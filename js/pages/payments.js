mountShell('payments'); const out = document.getElementById('out');
function pay(p) { drawer(p.receipt, dl({ Amount: fmt.money(p.amount), 'Date & time': p.when, Customer: p.customer, Chit: p.chit, Method: p.method, 'Collected by / ref': esc(p.ref || p.by), Status: pill(p.status) })); }
function review(c) {
  const d = drawer(c.code, `<div style="margin-bottom:10px">${pill(c.status)}</div>` + dl({ Receipt: c.payment, Customer: c.customer, Chit: c.chit || '—', 'Recorded amount': fmt.money(c.current), 'Requested by': c.agent, Reason: c.reason, 'Requested amount': fmt.money(c.requested) }) + `<div class="note" style="margin:14px 0"><small>Agent's note</small><br><b>${esc(c.note)}</b></div>` + (c.status === 'pending' ? '<div class="field l"><label>Your note <span style="color:var(--muted);font-weight:400">(required to reject)</span></label><textarea class="input" id="nt" placeholder="Explain your decision" style="height:80px;padding:8px 12px"></textarea></div><div class="note" style="margin-bottom:14px">Approving never deletes the payment. It adds a reversal or adjustment and keeps the history.</div><button class="btn primary" id="ap">Approve</button> <button class="btn danger" id="rj">Reject</button>' : ''));
  const act = (fn, needNote) => async () => { const note = d.el.querySelector('#nt').value.trim(); if (needNote && !note) return toast('A note is required to reject.'); try { await fn(c.id, note); toast('Correction updated'); d.close(); show(1); refreshCount(); } catch (e) { toast(e.message); } };
  if (c.status === 'pending') { d.el.querySelector('#ap').onclick = act(PaymentService.approve, false); d.el.querySelector('#rj').onclick = act(PaymentService.reject, true); }
}
const PILL = { cash: 'off', online: 'off' };
let ALL = [];
function drawPayments() {
  const q = out.querySelector('#pq').value.toLowerCase(), m = out.querySelector('#pm').value, st = out.querySelector('#ps').value, dt = out.querySelector('#pd').value, cut = new Date(Date.now() - (dt === 'today' ? 0 : dt === 'week' ? 7 * 864e5 : 1e15)).toLocaleDateString('en-CA', IST);
  const r = ALL.filter((p) => (!m || p.method === m) && (!st || p.status === st) && (dt === 'all' || p.date >= cut) && Object.values(p).join(' ').toLowerCase().includes(q));
  out.querySelector('#pt').innerHTML = table([{ h: 'Receipt', f: (p) => `<b>${p.receipt}</b>` }, { h: 'Date & time', f: (p) => p.when }, { h: 'Customer', f: (p) => esc(p.customer) }, { h: 'Chit', f: (p) => p.chit }, { h: 'Method', f: (p) => `<span class="pill off">${p.method}</span>` }, { h: 'Collected by / ref', f: (p) => esc(p.ref || p.by) }, { h: 'Amount', f: (p) => fmt.money(p.amount), r: 1 }, { h: 'Status', f: (p) => pill(p.status) }, { h: 'Correction', f: (p) => p.correction ? pill(p.correction) : '' }], r, 'No payments match.');
  out.querySelectorAll('#pt tr.click').forEach((tr) => tr.onclick = () => location.href = 'details.html?id=' + r[tr.dataset.i].id);
}
async function show(i) {
  loading(out);
  try {
    if (i === 0) { ALL = await PaymentService.list(); document.getElementById('count').textContent = `${ALL.length} payments recorded`;
      out.innerHTML = '<div class="filters"><input class="input" id="pq" placeholder="Search receipt, customer, chit"><select class="input" id="pd"><option value="all">All dates</option><option value="today">Today</option><option value="week">Last 7 days</option></select><select class="input" id="pm"><option value="">All methods</option><option value="cash">Cash</option><option value="online">Online</option></select><select class="input" id="ps"><option value="">All statuses</option><option value="confirmed">Confirmed</option><option value="pending verification">Pending verification</option><option value="failed">Failed</option></select></div><div id="pt"></div>';
      out.querySelectorAll('.filters .input').forEach((e) => e.oninput = e.onchange = drawPayments); drawPayments(); }
    else { const r = await PaymentService.corrections(); out.innerHTML = table([{ h: 'Request', f: (c) => `<b>${c.code}</b>` }, { h: 'Payment', f: (c) => c.payment }, { h: 'Customer', f: (c) => esc(c.customer) }, { h: 'Agent', f: (c) => c.agent }, { h: 'Reason', f: (c) => c.reason }, { h: 'Change', f: (c) => `${fmt.money(c.current)} → ${fmt.money(c.requested)}`, r: 1 }, { h: 'Status', f: (c) => pill(c.status) }], r); out.querySelectorAll('tr.click').forEach((tr) => tr.onclick = () => review(r[tr.dataset.i])); }
  } catch (e) { failed(out, e); }
}
tabs(document.getElementById('tabs'), ['All payments', 'Correction requests'], show); show(0);
function refreshCount() { PaymentService.corrections().then((r) => { const n = r.filter((c) => c.status === 'pending').length; document.querySelectorAll('#tabs button')[1].textContent = n ? `Correction requests (${n})` : 'Correction requests'; }).catch(() => {}); }
refreshCount();
document.getElementById('exp').onclick = () => { const b = new Blob([['receipt,date,customer,chit,method,amount,status', ...ALL.map((p) => [p.receipt, p.when, p.customer, p.chit, p.method, p.amount, p.status].join(','))].join('\n')], { type: 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'payments.csv'; a.click(); toast('Exported from demo data'); };
