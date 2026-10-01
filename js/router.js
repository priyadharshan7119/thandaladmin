// Vanilla JS SPA Router for Thandal Admin Console
var Router = window.Router = {
  routes: {
    '/': 'dashboard',
    '/dashboard': 'dashboard',
    '/customers': 'customers',
    '/customers/create': 'customersCreate',
    '/customers/details': 'customersDetails',
    '/agents': 'agents',
    '/agents/create': 'agentsForm',
    '/chits': 'chits',
    '/chits/create': 'chitsCreate',
    '/chits/details': 'chitsDetails',
    '/payments': 'payments',
    '/payments/details': 'paymentsDetails',
    '/reports': 'reports',
    '/audit-logs': 'auditLogs',
    '/admin-users': 'adminUsers',
    '/settings': 'settings'
  },

  currentRoute: null,

  initShell() {
    if (!Auth.guard('/')) return false;

    const u = Auth.user() || {};
    const meEl = document.getElementById('me');
    if (meEl) {
      const initEl = document.getElementById('user-initials');
      if (initEl) initEl.textContent = fmt.initials(u.name || 'Admin');
      const nameEl = document.getElementById('user-name');
      if (nameEl) nameEl.textContent = u.name || 'Admin';
      const roleEl = document.getElementById('user-role');
      if (roleEl) roleEl.textContent = roleLabel(u);
      meEl.onclick = () => modal({
        title: 'Log out?',
        body: '<p style="color:var(--muted)">You will need your mobile number and PIN to sign in again.</p>',
        actions: [{ label: 'Cancel' }, { label: 'Log out', kind: 'primary', onClick: logout }]
      });
    }

    const brandRole = document.getElementById('brand-role');
    if (brandRole) {
      brandRole.textContent = (u.is_super_admin || u.role === 'super_admin') ? 'Super Admin' : 'Admin';
    }

    // Global search
    const gs = document.getElementById('gs');
    if (gs) {
      gs.onkeydown = (e) => {
        if (e.key === 'Enter' && gs.value.trim()) {
          Router.go('/customers?q=' + encodeURIComponent(gs.value.trim()));
        }
      };
    }

    // Mobile menu toggle
    const mn = document.getElementById('mn');
    if (mn) {
      mn.onclick = () => document.querySelector('.sidebar')?.classList.toggle('open');
    }

    // Notification bell
    const bell = document.getElementById('bell');
    if (bell) {
      bell.onclick = () => Router.go('/payments');
    }

    // Render nav links
    const spaNav = document.getElementById('spa-nav');
    if (spaNav) {
      spaNav.innerHTML = NAV.map((n) => {
        if (n.length === 1) return `<div class="nav-h">${n[0]}</div>`;
        return `<a href="${n[1]}" data-route="${n[2]}"><svg viewBox="0 0 24 24">${ICON[n[2]]}</svg>${n[0]}<span class="badge-n" data-badge="${n[2]}" hidden></span></a>`;
      }).join('');
    }

    loadBadges();
    return true;
  },

  resolve(pathname) {
    let clean = pathname.replace(/\/$/, '') || '/';
    // Handle /pages/.../index.html or /pages/.../*.html paths
    clean = clean.replace(/^\/pages/, '').replace(/\/index\.html$/, '').replace(/\.html$/, '') || '/';

    // Direct match
    if (this.routes[clean]) {
      return { key: this.routes[clean], path: clean };
    }

    // Pattern matches:
    // /customers/:id -> customersDetails
    const custMatch = clean.match(/^\/customers\/([^/]+)$/);
    if (custMatch && custMatch[1] !== 'create') {
      return { key: 'customersDetails', path: clean, id: custMatch[1] };
    }

    // /chits/:id -> chitsDetails
    const chitMatch = clean.match(/^\/chits\/([^/]+)$/);
    if (chitMatch && chitMatch[1] !== 'create') {
      return { key: 'chitsDetails', path: clean, id: chitMatch[1] };
    }

    // /payments/:id -> paymentsDetails
    const payMatch = clean.match(/^\/payments\/([^/]+)$/);
    if (payMatch) {
      return { key: 'paymentsDetails', path: clean, id: payMatch[1] };
    }

    // Fallback to dashboard
    return { key: 'dashboard', path: '/dashboard' };
  },

  handleRoute() {
    if (!Auth.guard('/')) return;

    // Close any open overlays/drawers/modals
    document.querySelectorAll('.overlay').forEach((o) => o.remove());
    // Close mobile sidebar if open
    document.querySelector('.sidebar')?.classList.remove('open');

    const res = this.resolve(location.pathname);
    const pageKey = res.key;
    const page = window.Pages && window.Pages[pageKey];

    if (!page) {
      console.warn('Page definition not found for', pageKey);
      return;
    }

    this.currentRoute = pageKey;

    // Update active nav
    const activeNavKey = page.nav || pageKey;
    document.querySelectorAll('#spa-nav a').forEach((a) => {
      a.classList.toggle('on', a.dataset.route === activeNavKey);
    });

    // Update document title
    if (page.title) document.title = page.title;

    // Mount page HTML to #app-content
    const main = document.getElementById('app-content');
    if (main) {
      main.innerHTML = page.template;
      window.scrollTo(0, 0);
      try {
        page.init(res);
      } catch (err) {
        console.error('Error in page init:', err);
        failed(main, err);
      }
    }
  },

  go(url, replace = false) {
    if (replace) {
      history.replaceState(null, '', url);
    } else {
      history.pushState(null, '', url);
    }
    this.handleRoute();
  },

  init() {
    if (!this.initShell()) return;

    // Intercept all internal anchor clicks
    document.addEventListener('click', (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest('a');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || a.target === '_blank') return;

      const url = new URL(a.href, window.location.origin);
      if (url.origin !== window.location.origin) return;
      if (url.pathname.includes('/auth/')) return;

      e.preventDefault();
      Router.go(url.pathname + url.search + url.hash);
    });

    window.addEventListener('popstate', () => this.handleRoute());

    // Initial route handling
    this.handleRoute();
  }
};

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => Router.init());
} else {
  Router.init();
}
