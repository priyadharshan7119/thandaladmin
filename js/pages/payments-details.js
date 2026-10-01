window.Pages = window.Pages || {};
window.Pages.paymentsDetails = {
  title: 'Payment Details · Thandal',
  nav: 'payments',
  template: `<div class="crumb" id="crumb"><a href="/payments">Payments</a></div><div class="head"><div><h1 id="nm">…</h1><small id="sub" style="color:var(--muted)"></small></div><button class="btn neutral" id="rc">Print receipt</button></div><div id="out"></div>`,
  init: function(routeInfo) {
    mountShell('payments');
    const out = document.getElementById('out'), pid = new URLSearchParams(location.search).get('id') || routeInfo?.id;
    loading(out);
    (async () => {
      try {
        const p = await PaymentService.get(pid);
        const n = p.receipt_number || p.receipt, st = p.status;
        document.getElementById('nm').textContent = n;
        document.getElementById('sub').innerHTML = pill(st);
        document.getElementById('crumb').innerHTML = `<a href="/payments">Payments</a> / ${esc(n)}`;
        document.getElementById('rc').onclick = () => window.print();
        out.innerHTML = `<div class="grid4"><div class="card dark"><small>Amount</small><div class="v">${esc(typeof p.amount === 'number' ? fmt.money(p.amount) : p.amount)}</div><small>${esc(p.method)}</small></div><div class="card"><small>Date & time</small><div class="v" style="font-size:18px">${esc(when(p.paid_at))}</div></div><div class="card"><small>Customer</small><div class="v" style="font-size:18px;color:var(--green-2)">${esc(p.customer || p.customer_name)}</div></div><div class="card"><small>Chit</small><div class="v" style="font-size:18px;color:var(--green-2)">${esc(p.chit || p.chit_code)}</div></div></div>
        <div class="two"><div class="card"><b>Installments covered</b><p style="color:var(--muted);margin-top:8px">${(p.applied_to || []).length ? 'Applied to: ' + p.applied_to.join(', ') : 'Applied by the server oldest installment first.'}</p>${p.correction_status ? `<p style="margin-top:8px">Correction: ${pill(p.correction_status)}</p>` : ''}</div><div class="card"><b>Source</b>${dl({ 'Collected by': esc(p.collected_by || p.by || '—'), Reference: esc(p.razorpay_payment_id || p.ref || '—'), Status: pill(st) })}</div></div>`;
      } catch (e) {
        failed(out, e);
      }
    })();
  }
};
