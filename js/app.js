// Shared UI: app shell, toast, modal, formatting helpers.
const ICON = {
  logo: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M5 4v16M9 4v16M13 4v16M17 4v16M3 15l18-6"/></svg>',
  dashboard: '<path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/>',
  customers: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5M16 5a3 3 0 010 6M18 15c2 .5 3 2.5 3 5"/>',
  agents: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5"/>',
  chits: '<path d="M6 3h9l4 4v14H6z"/><path d="M9 12h7M9 16h7"/>',
  payments: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/>',
  reports: '<path d="M5 20V10M11 20V4M17 20v-7"/>',
  audit: '<path d="M6 3h9l4 4v14H6z"/><path d="M9 12h7"/>',
  admins: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>'
};
const NAV = [
  ['Dashboard', 'dashboard/index.html', 'dashboard'],
  ['MANAGE'],
  ['Customers', 'customers/index.html', 'customers'],
  ['Agents', 'agents/index.html', 'agents'],
  ['Chit accounts', 'chits/index.html', 'chits'],
  ['MONEY'],
  ['Payments', 'payments/index.html', 'payments'],
  ['Reports', 'reports/index.html', 'reports'],
  ['SYSTEM'],
  ['Audit logs', 'audit-logs/index.html', 'audit'],
  ['Admin users', 'admin-users/index.html', 'admins'],
  ['System settings', 'settings/index.html', 'settings']
];
const fmt = {
  money: (v) => typeof v === 'number' ? '₹' + v.toLocaleString('en-IN') : (v ?? '—'),
  paise: (p) => '₹' + Math.round((p || 0) / 100).toLocaleString('en-IN'),
  initials: (n = '') => n.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase()
};
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.append(t); setTimeout(() => t.remove(), 3200); }

function modal({ title, body, actions = [] }) {
  const o = document.createElement('div'); o.className = 'overlay';
  o.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><h3>${esc(title)}</h3><div class="mb">${body}</div><div class="act"></div></div>`;
  const close = () => o.remove();
  actions.forEach((a) => { const b = document.createElement('button'); b.className = 'btn ' + (a.kind || ''); b.textContent = a.label; b.onclick = () => a.onClick ? a.onClick(close, b, o) : close(); o.querySelector('.act').append(b); });
  o.addEventListener('mousedown', (e) => e.target === o && close());
  document.addEventListener('keydown', function esc_(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc_); } });
  document.body.append(o); return { close, el: o };
}

async function logout() { try { await Api.auth.logout(); } catch {} Auth.clear(); location.href = document.body.dataset.root + 'pages/auth/login.html'; }

const roleLabel = (u) => u.is_super_admin || u.role === 'super_admin' ? 'Super Admin' : (u.role || '').replace(/^./, (c) => c.toUpperCase());
function mountShell(active) {
  const root = document.body.dataset.root; Auth.guard(root);
  const u = Auth.user() || {};
  const links = NAV.map((n) => n.length === 1 ? `<div class="nav-h">${n[0]}</div>`
    : `<a href="${root}pages/${n[1]}" class="${n[2] === active ? 'on' : ''}"><svg viewBox="0 0 24 24">${ICON[n[2]]}</svg>${n[0]}<span class="badge-n" data-badge="${n[2]}" hidden></span></a>`).join('');
  const main = document.querySelector('main'); const content = main.innerHTML;
  document.body.innerHTML = `<div class="shell"><aside class="sidebar"><div class="brand">${ICON.logo}<div>Thandal<small>Super Admin</small></div></div><nav class="nav">${links}</nav></aside>
  <div><header class="topbar"><button class="menu" id="mn" aria-label="Menu">☰</button><input class="input search" id="gs" placeholder="Search customers, chits, receipts…" aria-label="Search"><button class="bell" id="bell" aria-label="Notifications" title="Pending items"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9a6 6 0 0112 0c0 6 2 7 2 7H4s2-1 2-7M10 20a2 2 0 004 0"/></svg><i hidden></i></button><button class="me" id="me"><span class="avatar">${fmt.initials(u.name)}</span><span><b>${esc(u.name || 'Admin')}</b>${esc(roleLabel(u))}</span></button></header><main class="main">${content}</main></div></div>`;
  const gs = document.getElementById('gs'); gs.onkeydown = (e) => { if (e.key === 'Enter' && gs.value.trim()) location.href = root + 'pages/customers/index.html?q=' + encodeURIComponent(gs.value.trim()); };
  document.getElementById('mn').onclick = () => document.querySelector('.sidebar').classList.toggle('open');
  document.getElementById('bell').onclick = () => location.href = root + 'pages/payments/index.html';
  loadBadges();
  document.getElementById('me').onclick = () => modal({ title: 'Log out?', body: '<p style="color:var(--muted)">You will need your mobile number and PIN to sign in again.</p>', actions: [{ label: 'Cancel' }, { label: 'Log out', kind: 'primary', onClick: logout }] });
}

function showErrors(form, err) {
  form.querySelectorAll('.err').forEach((e) => e.remove());
  Object.entries(err.errors || {}).forEach(([k, m]) => { const el = form.querySelector(`[name="${k}"]`); if (el) el.closest('.field').insertAdjacentHTML('beforeend', `<div class="err">${esc(m[0])}</div>`); });
}

// Sidebar / bell badges: pending corrections (dashboard API) and pending admin registrations.
async function loadBadges() {
  const set = (k, n) => { const el = document.querySelector(`[data-badge="${k}"]`); if (el && n) { el.textContent = n; el.hidden = false; } };
  let total = 0;
  try { const d = await Api.dashboard(); set('payments', d.pending_corrections); total += d.pending_corrections || 0; } catch {}
  try { const a = await Api.adminUsers.list('pending'); set('admins', a.length); window.__pendingAdmins = a.length; total += a.length; } catch {}
  const bi = document.querySelector('#bell i'); if (bi && total) { bi.textContent = total; bi.hidden = false; }
}
