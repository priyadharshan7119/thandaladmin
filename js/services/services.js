// Service layer: maps the Laravel API responses into the row shapes the pages use.
// Only SettingsService still uses mock data (js/services/mock/data.js): the API has no settings endpoint.
const wait = (v) => new Promise((r) => setTimeout(() => r(structuredClone(v)), 200));
const rs = (p) => (p ?? 0) / 100;
const IST = { timeZone: 'Asia/Kolkata' };
const when = (iso) => { if (!iso) return '—'; const d = new Date(iso); return d.toLocaleDateString('en-IN', { ...IST, month: 'short', day: 'numeric' }) + ', ' + d.toLocaleTimeString('en-IN', { ...IST, hour: 'numeric', minute: '2-digit' }).toLowerCase(); };
const day = (iso) => iso ? new Date(iso).toLocaleDateString('en-CA', IST) : '';
const dmy = (s) => s ? new Date(s.slice(0, 10) + 'T00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const label = (a) => a.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

const mapAgent = (a) => ({ id: a.id, code: a.code, name: a.name, mobile: a.mobile, address: a.address, customers: a.customers, status: a.status, joined: dmy(a.joined_on), id_proof: a.id_proof,
  collectedToday: rs(a.collected_today_paise), pendingToday: rs(a.pending_today_paise), rate: Math.round(a.collected_today_paise / ((a.collected_today_paise + a.pending_today_paise) || 1) * 100) });
const mapChit = (c) => ({ id: c.id, code: c.chit_code, customer: c.customer_name, customerCode: c.customer_code, loan: rs(c.loan_amount_paise), repay: `${c.installment_amount} ${c.frequency}`, total: rs(c.total_repayment_paise),
  paid: rs(c.paid_paise), outstanding: rs(c.outstanding_paise), overdue: rs(c.overdue_paise), paidInstallments: c.paid_installments, installments: c.installment_count, agent: c.agent?.name || '—', status: c.status, disbursement: c.disbursement });
const mapPayment = (p) => ({ id: p.id, receipt: p.receipt_number || '—', when: when(p.paid_at), date: day(p.paid_at), paidAt: p.paid_at, customer: p.customer_name, customerCode: p.customer_code, chit: p.chit_code, chitId: p.chit_id, method: p.method,
  by: p.collected_by || (p.method === 'online' ? 'Razorpay' : '—'), ref: p.razorpay_payment_id || '', amount: rs(p.amount_paise), status: p.status === 'pending' && p.method === 'online' ? 'pending verification' : p.status, correction: p.correction_status });
const mapAudit = (l) => ({ time: when(l.created_at), actor: l.actor, action: label(l.action), entity: l.entity_id, detail: l.summary, raw: l });

const CustomerService = {
  list: Api.customers.list, get: Api.customers.get, create: Api.customers.create, transfer: Api.customers.transfer,
  reset: Api.customers.resetPin, setActive: Api.customers.setActive,
  balances: async () => Object.fromEntries((await Api.portfolio()).map((c) => [c.id, c])),
  update: () => Promise.reject(new ApiError(0, { message: 'Editing customers is not available in the API yet.' })) /* GAP */,
  // Per-customer sub-tabs are derived from the admin feeds (no dedicated endpoints).
  async extras(code) {
    const [pays, chits, logs] = await Promise.all([PaymentService.list(), ChitService.list(), AuditService.list()]);
    const mine = chits.filter((c) => c.customerCode === code), codes = new Set([code, ...mine.map((c) => c.code)]);
    return { payments: pays.filter((p) => p.customerCode === code), disbursements: mine.filter((c) => c.disbursement), audit: logs.filter((l) => codes.has(l.entity)) };
  }
};
const AgentService = {
  list: async () => (await Api.agents.list()).map(mapAgent), create: Api.agents.create,
  setActive: (a, on) => Api.agents.setActive(a.id, on), reset: (a) => Api.agents.resetPin(a.id),
  update: () => Promise.reject(new ApiError(0, { message: 'Editing agents is not available in the API yet.' })) /* GAP */
};
const ChitService = { list: async (s) => (await Api.chits.list(s)).map(mapChit), create: Api.chits.create, cancel: Api.chits.cancel, disburse: Api.chits.disburse, get: Api.chits.get, schedule: Api.chits.schedule };
const PaymentService = {
  list: async (q) => (await Api.payments.list(q)).map(mapPayment), get: Api.payments.get,
  corrections: async () => { const chitOf = Object.fromEntries((await PaymentService.list()).map((p) => [p.receipt, p.chit])); return (await Api.corrections.list({})).data.map((c) => ({ id: c.id, code: c.code, payment: c.payment?.receipt_number, chit: chitOf[c.payment?.receipt_number], customer: c.payment?.customer?.user?.name, agent: c.requested_by_agent?.user?.name || '—', reason: label(c.reason), requested: rs(c.requested_amount_paise), current: rs(c.payment?.amount_paise), status: c.status, note: c.note || '' })); },
  approve: Api.corrections.approve, reject: Api.corrections.reject
};
const AuditService = { list: async (q) => (await Api.auditLogs(q)).map(mapAudit) };
const AdminUserService = { list: (s) => Api.adminUsers.list(s), approve: Api.adminUsers.approve, reject: Api.adminUsers.reject, setActive: Api.adminUsers.setActive };
const SettingsService = { get: () => wait(MOCK.settings) /* GAP */, save: (v) => wait(Object.assign(MOCK.settings, v)) /* GAP */ };

// Dashboard tabs are computed from the real payments and agents feeds.
const DashboardService = {
  overview: Api.dashboard,
  async daily(date) {
    const [pays, agents, dash] = await Promise.all([PaymentService.list(), AgentService.list(), Api.dashboard()]);
    const today = new Date().toLocaleDateString('en-CA', IST), d = date || today, ok = pays.filter((p) => p.date === d && p.status === 'confirmed');
    const sum = (f) => ok.filter(f).reduce((n, p) => n + p.amount, 0), hrs = {};
    ok.forEach((p) => { const h = new Date(p.paidAt).toLocaleTimeString('en-IN', { ...IST, hour: 'numeric', hour12: true }).replace(' ', '').toLowerCase(); hrs[h] = (hrs[h] || 0) + p.amount; });
    const by = {}; ok.forEach((p) => { const k = p.by; by[k] = by[k] || [k, 0, 0, 0]; by[k][p.method === 'cash' ? 1 : 2] += p.amount; by[k][3] += p.amount; });
    const isToday = d === today, exp = dash.paise ? rs(dash.paise.expected_today) : null;
    return { label: new Date(d + 'T00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }), isToday,
      expected: isToday ? exp : null, collected: sum(() => true), pending: isToday ? rs(dash.paise.pending_today) : null, cash: sum((p) => p.method === 'cash'), online: sum((p) => p.method === 'online'), count: ok.length,
      hours: Object.entries(hrs), byAgent: Object.values(by), payments: ok.map((p) => [p.receipt, p.when.split(', ')[1], p.customer, p.method, p.amount]) };
  },
  // rows: [name, code, customers, expected, collected, cash, online, pending, overdue customers, collection %]; null = not available for that day
  async agentPerformance(i) {
    const [agents, pays] = await Promise.all([AgentService.list(), PaymentService.list()]);
    const d = new Date(); d.setDate(d.getDate() - i); const key = d.toLocaleDateString('en-CA', IST), label = dmy(key);
    const rows = agents.filter((a) => a.status === 'active').map((a) => {
      const mine = pays.filter((p) => p.date === key && p.status === 'confirmed' && (p.by === a.name)), cash = mine.filter((p) => p.method === 'cash').reduce((n, p) => n + p.amount, 0);
      if (i === 0) return [a.name, a.code, a.customers, a.collectedToday + a.pendingToday, a.collectedToday, cash, a.collectedToday - cash, a.pendingToday, null, a.rate];
      const col = mine.reduce((n, p) => n + p.amount, 0); return [a.name, a.code, a.customers, null, col, cash, col - cash, null, null, null];
    });
    return { label, rows };
  }
};

const REPORTS = [['Daily collection', 'Collected amount per day, split by method.'], ['Agent collection', 'Expected and collected per agent for today.'], ['Customer report', 'Every customer with balance and status.'], ['Payment report', 'All payments with method and status.'], ['Outstanding', 'Balance still to collect on each active chit.'], ['Overdue report', 'Chits with missed installments.'], ['Completed accounts', 'Chits fully repaid.'], ['Cash payments', 'Cash collected by agents.'], ['Razorpay payments', 'Online payments and their verification status.'], ['Disbursements', 'Loan amounts given to customers.']];
const ReportService = {
  catalog: () => Promise.resolve(REPORTS),
  async run(name) {
    const R = { 'Daily collection': async () => { const m = {}; (await PaymentService.list()).filter((p) => p.status === 'confirmed').forEach((p) => { const r = m[p.date] = m[p.date] || [dmy(p.date), 0, 0, 0, 0]; r[1]++; r[p.method === 'cash' ? 2 : 3] += p.amount; r[4] += p.amount; }); return { cols: ['Date', 'Payments', 'Cash', 'Online', 'Total'], rows: Object.values(m), money: [2, 3, 4] }; },
      'Agent collection': async () => ({ cols: ['Agent', 'Customers', 'Collected today', 'Pending today', 'Collection %'], rows: (await AgentService.list()).map((a) => [a.name, a.customers, a.collectedToday, a.pendingToday, a.rate + '%']), money: [2, 3] }),
      'Customer report': async () => ({ cols: ['Customer', 'ID', 'Mobile', 'Agent', 'Outstanding', 'Overdue', 'Status'], rows: (await Api.portfolio()).map((c) => [c.name, c.customer_code, '+91 ' + c.mobile, c.agent?.name || 'Not assigned', rs(c.outstanding_paise), rs(c.overdue_paise), c.status]), money: [4, 5] }),
      'Payment report': async () => ({ cols: ['Receipt', 'Date', 'Customer', 'Chit', 'Method', 'Amount', 'Status'], rows: (await PaymentService.list()).map((p) => [p.receipt, dmy(p.date), p.customer, p.chit, p.method, p.amount, p.status]), money: [5] }),
      'Outstanding': async () => ({ cols: ['Chit', 'Customer', 'Agent', 'Repayment', 'Total', 'Outstanding'], rows: (await ChitService.list('active')).map((c) => [c.code, c.customer, c.agent, c.repay, c.total, c.outstanding]), money: [4, 5] }),
      'Overdue report': async () => ({ cols: ['Customer', 'Chit', 'Agent', 'Overdue amount'], rows: (await ChitService.list('active')).filter((c) => c.overdue > 0).map((c) => [c.customer, c.code, c.agent, c.overdue]), money: [3] }),
      'Completed accounts': async () => ({ cols: ['Chit', 'Customer', 'Loan amount', 'Total repaid', 'Agent'], rows: (await ChitService.list('completed')).map((c) => [c.code, c.customer, c.loan, c.paid, c.agent]), money: [2, 3] }),
      'Cash payments': async () => ({ cols: ['Receipt', 'Date', 'Customer', 'Agent', 'Amount'], rows: (await PaymentService.list({ method: 'cash' })).map((p) => [p.receipt, dmy(p.date), p.customer, p.by, p.amount]), money: [4] }),
      'Razorpay payments': async () => ({ cols: ['Receipt', 'Date', 'Customer', 'Razorpay ID', 'Amount', 'Status'], rows: (await PaymentService.list({ method: 'online' })).map((p) => [p.receipt, dmy(p.date), p.customer, p.ref || '—', p.amount, p.status]), money: [4] }),
      'Disbursements': async () => ({ cols: ['Chit', 'Customer', 'Method', 'Date', 'Reference', 'Amount', 'Status'], rows: (await ChitService.list()).filter((c) => c.disbursement).map((c) => [c.code, c.customer, label(c.disbursement.method), dmy(c.disbursement.disbursed_on), c.disbursement.reference || '—', c.loan, c.disbursement.status]), money: [5] }) };
    return R[name]();
  },
  csv: (n, d) => new Blob([[d.cols, ...d.rows].map((r) => r.join(',')).join('\n')], { type: 'text/csv' })
};
