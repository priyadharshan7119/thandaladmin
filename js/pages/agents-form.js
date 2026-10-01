mountShell('agents');
const f = document.getElementById('f'), code = new URLSearchParams(location.search).get('code'), go = document.getElementById('go');
const edit = !!code;
if (edit) {
  document.getElementById('mode').textContent = 'Edit'; document.getElementById('ttl').textContent = 'Edit agent'; go.textContent = 'Save changes'; document.getElementById('stw').hidden = false;
  document.getElementById('code').value = code; f.document.closest('.field').querySelector('label').textContent = 'ID document photo';
  AgentService.list().then((r) => { const a = r.find((x) => x.code === code); if (!a) return toast('Agent not found'); f.name.value = a.name; f.mobile.value = a.mobile; f.address.value = a.address || ''; f.status.value = a.status; }).catch((e) => toast(e.message));
}
f.onsubmit = async (e) => {
  e.preventDefault(); f.querySelectorAll('.err').forEach((x) => x.remove()); go.disabled = true;
  try {
    if (edit) { await AgentService.update(code, Object.fromEntries(new FormData(f))); toast('Saved'); return; }
    const fd = new FormData(f); fd.delete('notes'); fd.delete('status');
    const r = await AgentService.create(fd);
    modal({ title: 'Agent created', body: `<p style="color:var(--muted)">${esc(r.agent_id)} · login +91 ${esc(r.mobile)}</p><div class="pin">${esc(r.pin)}</div><div class="alert info">Shown only once. Give it to them in person or by phone.</div>`, actions: [{ label: 'Done', kind: 'primary', onClick: () => location.href = 'index.html' }] });
  } catch (err) { showErrors(f, err); toast(err.message); } finally { go.disabled = false; }
};
