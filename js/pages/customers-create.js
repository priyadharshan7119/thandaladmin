mountShell('customers');
const f = document.getElementById('f');
Api.agents.list().then((a) => a.filter((x) => x.status === 'active' && x.id != null).forEach((x) => document.getElementById('agent').insertAdjacentHTML('beforeend', `<option value="${x.id}">${esc(x.name)} (${esc(x.code)})</option>`))).catch(() => {});
f.onsubmit = async (e) => {
  e.preventDefault(); const b = document.getElementById('go'); b.disabled = true;
  const fd = new FormData(f); if (f.document.files[0]) fd.set('document', f.document.files[0]); if (!fd.get('agent_id')) fd.delete('agent_id');
  try {
    const r = await Api.customers.create(fd);
    modal({ title: 'Customer created', body: `<p style="color:var(--muted)">${esc(r.customer_id)} · login +91 ${esc(r.mobile)}</p><div class="pin">${esc(r.pin)}</div><div class="alert info">Shown only once. Give it to them in person or by phone.</div>`, actions: [{ label: 'Done', kind: 'primary', onClick: () => location.href = 'index.html' }] });
  } catch (err) { showErrors(f, err); toast(err.message); b.disabled = false; }
};
