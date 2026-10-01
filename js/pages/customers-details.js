window.Pages = window.Pages || {};
window.Pages.customersDetails = {
  title: 'Customer Details · Thandal',
  nav: 'customers',
  template: `<div class="crumb" id="crumb"><a href="/customers">Customers</a></div><div class="head"><div><h1 id="nm">…</h1><small id="sub" style="color:var(--muted)"></small></div><div id="acts" style="display:flex;gap:8px"></div></div><div id="tabs"></div><div id="out"></div>`,
  init: function(routeInfo) {
    mountShell('customers');
    const id = new URLSearchParams(location.search).get('id') || routeInfo?.id;
    const out = document.getElementById('out');
    let c, x, chit = null;
    const gap = (fn, ok) => async (close) => { try { await fn(); toast(ok); close(); } catch (e) { toast(e.message); } };
    const field = (l, i, t = 'input') => `<div class="field l"><label>${l}</label><${t} class="input" id="${i}"${t === 'textarea' ? ' style="height:60px"' : ''}></${t}></div>`;

    function actions() {
      const on = c.status === 'active', a = document.getElementById('acts');
      a.innerHTML = `<button class="btn neutral" id="ed">Edit</button><button class="btn neutral" id="rp">Reset PIN</button><button class="btn neutral" id="tr">Transfer agent</button><button class="btn ${on ? 'danger' : 'primary'}" id="dx">${on ? 'Deactivate' : 'Activate'}</button>`;
      a.querySelector('#ed').onclick = () => modal({ title: 'Edit customer', body: field('Full name', 'n') + field('Address', 'ad', 'textarea'), actions: [{ label: 'Cancel' }, { label: 'Save changes', kind: 'primary', onClick: gap(() => CustomerService.update(id, {}), 'Saved') }] });
      a.querySelector('#rp').onclick = () => modal({ title: `Reset PIN for ${c.name}?`, body: '<div class="alert warn">The current PIN stops working immediately.</div>' + field('Reason', 'r', 'textarea'), actions: [{ label: 'Cancel' }, { label: 'Reset PIN', kind: 'primary', onClick: async (cl) => { try { const r = await CustomerService.reset(id); cl(); modal({ title: 'New temporary PIN', body: `<p style="color:var(--muted)">Give this to ${esc(c.name)} in person or by phone.</p><div class="pin">${esc(r.pin)}</div><div class="alert info">Shown only once. Only a secure hash is stored.</div>`, actions: [{ label: 'Done', kind: 'primary' }] }); } catch (e) { toast(e.message); } } }] });
      a.querySelector('#tr').onclick = () => {
        const m = modal({ title: 'Transfer to another agent', body: '<p style="color:var(--muted)">Now with ' + esc(c.agent?.name || 'no agent') + '</p><div class="field l"><label>New agent *</label><select class="input" id="ag"><option value="">Select an agent…</option></select></div><div class="field l"><label>Reason</label><select class="input" id="rs"><option>Route change</option><option>Agent left</option><option>Other</option></select></div>',
          actions: [{ label: 'Cancel' }, { label: 'Transfer', kind: 'primary', onClick: async (cl, b, o) => { const v = o.querySelector('#ag').value; if (!v) return toast('Choose an agent'); try { await CustomerService.transfer(id, v, o.querySelector('#rs').value); cl(); toast('Agent transferred'); loadCustomer(); } catch (e) { toast(e.message); } } }] });
        AgentService.list().then((l) => l.filter((x) => x.status === 'active' && x.code !== c.agent?.code).forEach((x) => m.el.querySelector('#ag').insertAdjacentHTML('beforeend', `<option value="${x.id}">${esc(x.name)}</option>`))).catch((e) => toast(e.message));
      };
      a.querySelector('#dx').onclick = () => modal({ title: `${on ? 'Deactivate' : 'Activate'} ${c.name}?`, body: on ? '<div class="alert warn">They will not be able to log in to the app. Their chits and history are kept.</div>' : '', actions: [{ label: 'Cancel' }, { label: on ? 'Deactivate' : 'Activate', kind: on ? 'danger' : 'primary', onClick: async (cl) => { try { await CustomerService.setActive(id, !on); cl(); toast('Status updated'); loadCustomer(); } catch (e) { toast(e.message); } } }] });
    }

    const T = (cols, rows) => table(cols.map((h, i) => ({ h, f: (r) => r[i] ?? '', r: /₹|amount/i.test(h) })), rows);
    const VIEWS = [
      () => `<div class="grid4"><div class="card"><small>Active chits</small><div class="v">${c.chits.filter((k) => k.status === 'active').length}</div></div><div class="card"><small>Outstanding</small><div class="v">${fmt.money(c.outstanding)}</div></div><div class="card"><small>Overdue</small><div class="v r">${fmt.money(c.overdue)}</div><small>Missed installments</small></div><div class="card"><small>Installments paid</small><div class="v">${c.chits.reduce((n, k) => n + k.paid_installments, 0)}</div></div></div>
        <div class="two"><div class="card"><b>Customer information</b>${dl({ 'Full name': esc(c.name), 'Customer ID': c.customer_code, 'Mobile (login)': '+91 ' + c.mobile, Address: esc(c.address), Status: pill(c.status) })}<b style="display:block;margin-top:14px">ID proof</b>${dl({ Type: esc(c.id_proof?.type || '—'), Number: c.id_proof ? '•••• ' + c.id_proof.last4 : '—' })}</div>
        <div><div class="card"><b>Assigned agent</b><div class="who" style="margin-top:10px">${c.agent ? `<span class="avatar">${fmt.initials(c.agent.name)}</span><div><b>${esc(c.agent.name)}</b><small>${c.agent.code}</small><small>Future collections go to this agent.</small></div>` : 'Not assigned'}</div></div><div class="card" style="margin-top:12px"><b>Assignment history</b><p class="empty">Not exposed by the API yet.</p></div></div></div>`,
      () => T(['Chit', 'Loan amount', 'Repayment', 'Installments', 'Paid', 'Outstanding', 'Status'], c.chits.map((k) => [`<b>${k.chit_code}</b>`, k.loan_amount, `${k.installment_amount} ${k.frequency}`, `${k.paid_installments}/${k.installment_count}`, k.paid, k.outstanding, pill(k.status)])),
      () => T(['Receipt', 'Date & time', 'Chit', 'Method', 'Collected by / ref', 'Amount', 'Status'], x.payments.map((p) => [p.receipt, p.when, p.chit, `<span class="pill off">${p.method}</span>`, esc(p.ref || p.by), fmt.money(p.amount), pill(p.status)])),
      null,
      () => T(['Receipt', 'Date', 'Chit', 'Amount'], x.payments.map((p) => [p.receipt, p.when, p.chit, fmt.money(p.amount)])),
      () => T(['Chit', 'Method', 'Date', 'Reference', 'Amount', 'Status'], x.disbursements.map((k) => [k.code, label(k.disbursement.method), dmy(k.disbursement.disbursed_on), esc(k.disbursement.reference || '—'), fmt.money(k.loan), pill(k.disbursement.status)])),
      () => x.audit.length ? x.audit.map((a) => `<div class="kv"><span><b style="color:var(--ink)">${a.action}</b><br>${esc(a.detail)}<br><small>${a.time} · ${esc(a.actor)}</small></span></div>`).join('') : '<div class="empty">No audit entries.</div>'
    ];

    async function schedule(el) {
      if (!c.chits.length) return el.innerHTML = '<div class="empty">No chits yet.</div>';
      chit = chit || c.chits[0]; let f = 'all';
      const draw = async () => {
        const r = await Api.chits.schedule(chit.id); const rows = r.filter((i) => f === 'all' || i.status === f);
        el.innerHTML = `<div id="cs"></div><b>Repayment schedule · ${chit.chit_code}</b><div id="fs" style="margin:10px 0"></div>` + table([{ h: '#', f: (i) => 'Day ' + i.sequence }, { h: 'Date', f: (i) => i.due_date }, { h: 'Due', f: (i) => i.amount, r: 1 }, { h: 'Paid', f: (i) => i.paid, r: 1 }, { h: 'Status', f: (i) => pill(i.status.replace('_', ' ')) }], rows, 'Nothing to show. Try changing the filters.');
        chips(el.querySelector('#cs'), c.chits.map((k) => k.chit_code), (i) => { chit = c.chits[i]; draw(); });
        chips(el.querySelector('#fs'), ['All', 'Paid', 'Overdue', 'Due today', 'Upcoming'], (i, n) => { f = ['all', 'paid', 'overdue', 'due_today', 'upcoming'][i]; draw(); });
      };
      loading(el); try { await draw(); } catch (e) { failed(el, e); }
    }

    async function show(i) { if (i === 3) return schedule(out); out.innerHTML = VIEWS[i](); }

    async function loadCustomer() {
      loading(out);
      try {
        c = await CustomerService.get(id); x = await CustomerService.extras(c.customer_code);
        document.getElementById('crumb').innerHTML = `<a href="/customers">Customers</a> / ${c.customer_code}`;
        document.getElementById('nm').textContent = c.name; document.getElementById('sub').innerHTML = `${c.customer_code} ${pill(c.status)}`;
        actions(); tabs(document.getElementById('tabs'), ['Overview', 'Chits', 'Payment history', 'Repayment schedule', 'Receipts', 'Disbursements', 'Audit history'], show); show(0);
      } catch (e) { failed(out, e); }
    }

    loadCustomer();
  }
};
