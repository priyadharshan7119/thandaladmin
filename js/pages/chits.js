mountShell('chits'); const out = document.getElementById('out'); let all = [], st = 'all';
const ST = ['All', 'Pending', 'Active', 'Completed', 'Cancelled'];
function render() {
  const q = document.getElementById('q').value.toLowerCase();
  const r = all.filter((c) => (st === 'all' || c.status === st) && (c.code + c.customer).toLowerCase().includes(q));
  document.getElementById('count').textContent = `${all.length} chit accounts`; out.innerHTML = table([{ h: 'Chit', f: (c) => `<b>${c.code}</b>` }, { h: 'Customer', f: (c) => esc(c.customer) }, { h: 'Loan amount', f: (c) => fmt.money(c.loan), r: 1 }, { h: 'Repayment', f: (c) => c.repay }, { h: 'Total', f: (c) => fmt.money(c.total), r: 1 }, { h: 'Progress', f: (c) => { const pc = Math.round(c.paidInstallments / (c.installments || 1) * 100); return `<div style="display:flex;align-items:center;gap:8px"><div class="bar" style="width:70px;margin:0"><i style="width:${pc}%"></i></div><small style="color:var(--muted)">${c.paidInstallments}/${c.installments}</small></div>`; } }, { h: 'Outstanding', f: (c) => fmt.money(c.outstanding), r: 1 }, { h: 'Agent', f: (c) => c.agent }, { h: 'Status', f: (c) => pill(c.status) }], r, 'No chit accounts match.');
  out.querySelectorAll('tr.click').forEach((tr) => tr.onclick = () => location.href = `details.html?id=${r[tr.dataset.i].id}`);
}
function detail(c) {
  const d = drawer(c.code, '<div id="dt"></div><div id="dv"></div>'); const dv = d.el.querySelector('#dv');
  const v = [() => dl({ Customer: c.customer, 'Loan amount': fmt.money(c.loan), Repayment: c.repay, Paid: fmt.money(c.paid), Outstanding: fmt.money(c.outstanding), Agent: c.agent, Status: pill(c.status) }),
    () => '<div class="empty">Loads from GET /admin/chits/{id}/schedule once the chit id is known.</div>', () => '<div class="empty">Payments for this chit.</div>',
    () => c.status === 'pending' ? '<button class="btn primary" id="ds">Record disbursement</button>' : '<div class="empty">Disbursement recorded.</div>', () => '<div class="empty">No audit entries.</div>'];
  tabs(d.el.querySelector('#dt'), ['Overview', 'Schedule', 'Payments', 'Disbursement', 'Audit'], (i) => { dv.innerHTML = v[i](); const b = dv.querySelector('#ds'); if (b) b.onclick = () => toast('Sends POST /admin/chits/{id}/disburse'); }); dv.innerHTML = v[0]();
  if (c.status !== 'cancelled' && c.status !== 'completed') { dv.insertAdjacentHTML('afterend', '<button class="btn danger" id="cx" style="margin-top:16px">Cancel chit</button>'); d.el.querySelector('#cx').onclick = () => modal({ title: `Cancel ${c.code}?`, body: '<p style="color:var(--muted)">This stops the schedule. Payments already made stay in the ledger.</p><div class="field l" style="margin-top:10px"><label>Reason *</label><textarea class="input" id="rs" style="height:64px"></textarea></div>', actions: [{ label: 'Back' }, { label: 'Cancel chit', kind: 'danger', onClick: async (cl, b, o) => { const rs = o.querySelector('#rs').value; if (!rs) return toast('Reason is required'); try { await ChitService.cancel(c.id ?? c.code, rs); cl(); toast('Chit cancelled'); } catch (e) { toast(e.message); } } }] }); }
}
document.getElementById('new').onclick = () => location.href = 'create.html';
chips(document.getElementById('tabs'), ST, (i, n) => { st = n.toLowerCase(); render(); }); document.getElementById('q').oninput = render;
loading(out); ChitService.list().then((r) => { all = r; render(); }).catch((e) => failed(out, e));
