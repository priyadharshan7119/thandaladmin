window.Pages = window.Pages || {};
window.Pages.chits = {
  title: 'Chit Accounts · Thandal',
  nav: 'chits',
  template: `<div class="head"><div><h1>Chit accounts</h1><small id="count" style="color:var(--muted)"></small></div><a class="btn primary" href="/chits/create" id="new">+ Create chit</a></div><div class="filters"><input class="input" id="q" placeholder="Search chit code or customer"><div id="tabs" style="margin:0"></div></div><div id="out"></div>`,
  init: function() {
    mountShell('chits');
    const out = document.getElementById('out');
    let all = [], st = 'all';
    const ST = ['All', 'Pending', 'Active', 'Completed', 'Cancelled'];

    function render() {
      const q = document.getElementById('q').value.toLowerCase();
      const r = all.filter((c) => (st === 'all' || c.status === st) && (c.code + c.customer).toLowerCase().includes(q));
      document.getElementById('count').textContent = `${all.length} chit accounts`;
      out.innerHTML = table([{ h: 'Chit', f: (c) => `<b>${c.code}</b>` }, { h: 'Customer', f: (c) => esc(c.customer) }, { h: 'Loan amount', f: (c) => fmt.money(c.loan), r: 1 }, { h: 'Repayment', f: (c) => c.repay }, { h: 'Total', f: (c) => fmt.money(c.total), r: 1 }, { h: 'Progress', f: (c) => { const pc = Math.round(c.paidInstallments / (c.installments || 1) * 100); return `<div style="display:flex;align-items:center;gap:8px"><div class="bar" style="width:70px;margin:0"><i style="width:${pc}%"></i></div><small style="color:var(--muted)">${c.paidInstallments}/${c.installments}</small></div>`; } }, { h: 'Outstanding', f: (c) => fmt.money(c.outstanding), r: 1 }, { h: 'Agent', f: (c) => c.agent }, { h: 'Status', f: (c) => pill(c.status) }], r, 'No chit accounts match.');
      out.querySelectorAll('tr.click').forEach((tr) => tr.onclick = () => Router.go(`/chits/details?id=${r[tr.dataset.i].id}`));
    }

    chips(document.getElementById('tabs'), ST, (i, n) => { st = n.toLowerCase(); render(); });
    document.getElementById('q').oninput = render;
    loading(out);
    ChitService.list().then((r) => { all = r; render(); }).catch((e) => failed(out, e));
  }
};
