// Single place for every backend call. Endpoints mirror thandal/backend/routes/api.php.
class ApiError extends Error {
  constructor(status, body) { super(body?.message || 'Request failed'); this.status = status; this.errors = body?.errors || {}; this.body = body; }
}
async function request(method, path, { body, query, form } = {}) {
  const url = new URL(window.THANDAL.API_BASE_URL.replace(/\/$/, '') + path);
  Object.entries(query || {}).forEach(([k, v]) => v !== '' && v != null && url.searchParams.set(k, v));
  const headers = { Accept: 'application/json' };
  if (Auth.token()) headers.Authorization = 'Bearer ' + Auth.token();
  if (body) headers['Content-Type'] = 'application/json';
  let res;
  try { res = await fetch(url, { method, headers, body: form || (body && JSON.stringify(body)) }); }
  catch { throw new ApiError(0, { message: 'Cannot reach the server. Check API_BASE_URL in js/config.js.' }); }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && Auth.token()) { Auth.clear(); location.href = (document.body.dataset.root || '../../') + 'pages/auth/login.html'; }
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}
const Api = {
  auth: {
    login: (mobile, pin) => request('POST', '/auth/login', { body: { mobile, pin } }),
    register: (b) => request('POST', '/auth/register-admin', { body: b }),
    logout: () => request('POST', '/auth/logout'),
    me: () => request('GET', '/me'),
  },
  dashboard: () => request('GET', '/admin/dashboard'),
  portfolio: () => request('GET', '/admin/portfolio'),
  auditLogs: (q) => request('GET', '/admin/audit-logs', { query: { q } }),
  customers: {
    list: (q) => request('GET', '/admin/customers', { query: q }),
    get: (id) => request('GET', `/admin/customers/${id}`),
    create: (formData) => request('POST', '/admin/customers', { form: formData }),
    resetPin: (id) => request('POST', `/admin/customers/${id}/reset-pin`),
    setActive: (id, active) => request('POST', `/admin/customers/${id}/active`, { body: { active } }),
    transfer: (id, agent_id, reason) => request('POST', `/admin/customers/${id}/transfer`, { body: { agent_id, reason } }),
  },
  agents: {
    list: () => request('GET', '/admin/agents'),
    create: (formData) => request('POST', '/admin/agents', { form: formData }),
    resetPin: (id) => request('POST', `/admin/agents/${id}/reset-pin`),
    setActive: (id, active) => request('POST', `/admin/agents/${id}/active`, { body: { active } }),
  },
  chits: {
    list: (status) => request('GET', '/admin/chits', { query: { status } }),
    get: (id) => request('GET', `/admin/chits/${id}`),
    schedule: (id) => request('GET', `/admin/chits/${id}/schedule`),
    create: (b) => request('POST', '/admin/chits', { body: b }),
    disburse: (id, b) => request('POST', `/admin/chits/${id}/disburse`, { body: b }),
    cancel: (id, reason) => request('POST', `/admin/chits/${id}/cancel`, { body: { reason } }),
  },
  payments: { list: (q) => request('GET', '/admin/payments', { query: q }), get: (id) => request('GET', `/admin/payments/${id}`) },
  corrections: {
    list: (q) => request('GET', '/admin/corrections', { query: q }),
    approve: (id, note) => request('POST', `/admin/corrections/${id}/approve`, { body: { note: note || 'Approved.' } }),
    reject: (id, note) => request('POST', `/admin/corrections/${id}/reject`, { body: { note } }),
  },
  adminUsers: {
    list: (status) => request('GET', '/admin/admin-users', { query: { status } }),
    // The backend rejects an empty note (it becomes null), so always send text.
    approve: (id, note) => request('POST', `/admin/admin-users/${id}/approve`, { body: { note: note || 'Approved.' } }),
    reject: (id, note) => request('POST', `/admin/admin-users/${id}/reject`, { body: { note } }),
    setActive: (id, active) => request('POST', `/admin/admin-users/${id}/active`, { body: { active } }),
  },
};
