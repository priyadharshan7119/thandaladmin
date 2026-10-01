mountShell('dashboard'); const out = document.getElementById('out');
const stat = (l, v, sub, cls = '') => `<div class="card ${cls === 'dark' ? 'dark' : ''}"><small>${l}</small><div class="v ${cls !== 'dark' ? cls : ''}">${esc(v)}</div><small>${sub}</small></div>`;
const num = (v) => typeof v === 'number' ? v : Number(String(v).replace(/[^\d.]/g, '')) || 0;
const perfTable = (rows) => table([{ h: 'Agent', f: (r) => `<b>${r[0]}</b><br><small>${r[1]}</small>` }, { h: 'Customers', f: (r) => r[2], r: 1 }, { h: 'Expected', f: (r) => fmt.money(r[3]), r: 1 }, { h: 'Collected', f: (r) => fmt.money(r[4]), r: 1 }, { h: 'Cash', f: (r) => fmt.money(r[5]), r: 1 }, { h: 'Online', f: (r) => fmt.money(r[6]), r: 1 }, { h: 'Pending', f: (r) => fmt.money(r[7]), r: 1 }, { h: 'Overdue custs.', f: (r) => r[8] ?? '—', r: 1 }, { h: 'Collection %', f: (r) => r[9] == null ? '—' : `${r[9]}%<span class="mini"><i style="width:${r[9]}%"></i></span>`, r: 1 }], rows);

async function overview() {
  const [d, perf, pend] = await Promise.all([DashboardService.overview(), DashboardService.agentPerformance(0), AdminUserService.list('pending').then((a) => a.length).catch(() => 0)]);
  const total = num(d.cash_today) + num(d.online_today) || 1;
  const bar = (l, v) => `<div style="display:flex;justify-content:space-between"><b>${l}</b><span>${fmt.money(v)}</span></div><div class="bar"><i style="width:${num(v) / total * 100}%"></i></div>`;
    const att = [d.pending_corrections ? `<a href="../payments/index.html" style="text-decoration:underline">${d.pending_corrections} correction request${d.pending_corrections > 1 ? 's' : ''}</a> waiting` : '', d.pending_online_payments ? `${d.pending_online_payments} online payment${d.pending_online_payments > 1 ? 's' : ''} pending verification` : '', d.pending_disbursements ? `<a href="../chits/index.html" style="text-decoration:underline">${d.pending_disbursements} chit${d.pending_disbursements > 1 ? 's' : ''}</a> waiting for disbursement` : '', pend ? `<a href="../admin-users/index.html" style="text-decoration:underline">${pend} admin registration${pend > 1 ? 's' : ''}</a> waiting` : ''].filter(Boolean).join(' · ');
  out.innerHTML = (att ? `<div class="alert warn"><b>Needs attention:</b> ${att}</div>` : '')
    + `<div class="grid4">${stat('Total customers', d.customers, 'Registered') + stat('Active chits', d.active_chits, 'Currently repaying') + stat("Today's expected", fmt.money(d.expected_today), 'Due installments + overdue', 'dark') + stat("Today's collected", fmt.money(d.collected_today), `${fmt.money(d.cash_today)} cash · ${fmt.money(d.online_today)} online`, 'g')
    + stat("Today's pending", fmt.money(d.pending_today), 'Not yet collected today', 'a') + stat('Total outstanding', fmt.money(d.outstanding), 'Across active chits') + stat('Total overdue', fmt.money(d.overdue), 'Missed installments', 'r') + stat('Pending verification', d.pending_online_payments, 'online payment' + (d.pending_online_payments === 1 ? '' : 's'))}</div>`
    + `<div class="split"><div><div class="head" style="margin:0 0 8px"><b>Agent performance</b><a class="btn" style="height:28px" href="#" id="dt">Details</a></div>${perfTable(perf.rows)}</div><div class="card"><b>Payment method today</b><div style="margin-top:14px">${bar('Cash', d.cash_today)}${bar('Online (Razorpay)', d.online_today)}</div></div></div>`;
  out.querySelector('#dt').onclick = (e) => { e.preventDefault(); document.querySelectorAll('#tabs button')[2].click(); };
}
async function daily(date = new Date().toLocaleDateString('en-CA', IST)) {
  const d = await DashboardService.daily(date);
  out.innerHTML = `<div class="filters"><input class="input" id="dd" type="date" value="${date}" style="width:auto"><span style="align-self:center;color:var(--muted)">${d.label}</span></div>
  <div class="grid4">${stat('Expected', fmt.money(d.expected), d.isToday ? 'Due installments + overdue' : 'Only available for today') + stat('Collected', fmt.money(d.collected), `${d.count} payments`, 'g') + stat('Pending', fmt.money(d.pending), d.isToday ? 'Not yet collected' : 'Only available for today', 'a') + stat('Cash / Online', `${fmt.money(d.cash)} / ${fmt.money(d.online)}`, '')}</div>
  <div class="split eq"><div class="card"><b>Collected by hour</b><div id="ch"></div></div><div class="card flush"><div class="ct"><b>By agent</b></div>${table([{ h: 'Agent', f: (r) => r[0] }, { h: 'Cash', f: (r) => fmt.money(r[1]), r: 1 }, { h: 'Online', f: (r) => fmt.money(r[2]), r: 1 }, { h: 'Total', f: (r) => fmt.money(r[3]), r: 1 }], d.byAgent)}</div></div>
  <b style="display:block;margin:16px 0 8px">Payments on this day</b>${table([{ h: 'Receipt', f: (r) => r[0] }, { h: 'Time', f: (r) => r[1] }, { h: 'Customer', f: (r) => r[2] }, { h: 'Method', f: (r) => r[3] }, { h: 'Amount', f: (r) => fmt.money(r[4]), r: 1 }], d.payments, 'No payments on this day.')}`;
  barChart(out.querySelector('#ch'), d.hours); out.querySelector('#dd').onchange = (e) => e.target.value && daily(e.target.value).catch((x) => failed(out, x));
}
async function agents(day = 0) {
  const r = await DashboardService.agentPerformance(day);
  out.innerHTML = `<div id="dc"></div><div class="card flush"><div class="ct"><b>Agent performance · ${r.label}</b></div>${perfTable(r.rows)}</div><div class="note">Collected counts cash taken by the agent plus online payments from their assigned customers. Deactivated agents are not shown.</div>`;
  chips(out.querySelector('#dc'), ['Today', 'Yesterday', '2 days ago'], (i) => agents(i).catch((e) => failed(out, e)), day);
}
const V = [overview, daily, () => agents(0)];
tabs(document.getElementById('tabs'), ['Overview', 'Daily collection summary', 'Agent performance'], (i) => { loading(out); V[i]().catch((e) => failed(out, e)); });
loading(out); overview().catch((e) => failed(out, e));
