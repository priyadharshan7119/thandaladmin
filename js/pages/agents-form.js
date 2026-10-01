window.Pages = window.Pages || {};
window.Pages.agentsForm = {
  title: 'Agent · Thandal',
  nav: 'agents',
  template: `<div class="crumb"><a href="/agents">Agents</a> / <span id="mode">New</span></div><h1 id="ttl">Create agent</h1><div class="two" style="margin-top:16px"><form class="card" id="f" autocomplete="off"><div class="field l"><label>Full name *</label><input class="input" name="name" required placeholder="e.g. R. Suresh"></div><div class="field l"><label>Mobile number (for login) *</label><div class="phone"><span>+91</span><input class="input" name="mobile" required pattern="[6-9]\\d{9}" maxlength="10" placeholder="10-digit mobile" inputmode="numeric"></div></div><div class="field l"><label>Address</label><textarea class="input" name="address" style="height:70px;padding:8px 12px" placeholder="Street, area"></textarea></div><div class="row2"><div class="field l"><label>ID proof type</label><select class="input" name="id_proof_type"><option value="">Select type…</option><option value="aadhaar">Aadhaar</option><option value="pan">PAN</option><option value="voter_id">Voter ID</option></select></div><div class="field l"><label>ID number</label><input class="input" name="id_proof_number" placeholder="Last 4 digits or full"></div></div><div class="field l"><label>ID document photo</label><input class="input" name="document" type="file" accept="image/*,.pdf" style="padding:6px"></div><div class="field l"><label>Initial PIN</label><input class="input" name="pin" type="password" maxlength="4" pattern="\\d{4}" inputmode="numeric" placeholder="4 digits (leave blank to auto-generate)"></div><div class="field l" id="stw" hidden><label>Status</label><select class="input" name="status"><option value="active">Active</option><option value="inactive">Inactive</option></select></div><input type="hidden" name="code" id="code"><button class="btn primary" id="go" style="margin-top:8px">Create agent</button></form><div class="card"><b>What happens next</b><div class="note" style="margin:10px 0">An agent code (AGT-xxx) is generated automatically. The agent uses this mobile number and PIN to log in to the Thandal Agent mobile app.</div><b style="display:block;margin-top:16px">ID document</b><p style="color:var(--muted);font-size:12px;margin-top:4px">Stored securely. Only Super Admins can see the uploaded file.</p></div></div>`,
  init: function() {
    mountShell('agents');
    const f = document.getElementById('f'), code = new URLSearchParams(location.search).get('code'), go = document.getElementById('go');
    const edit = !!code;
    if (edit) {
      document.getElementById('mode').textContent = 'Edit';
      document.getElementById('ttl').textContent = 'Edit agent';
      go.textContent = 'Save changes';
      document.getElementById('stw').hidden = false;
      document.getElementById('code').value = code;
      f.document.closest('.field').querySelector('label').textContent = 'ID document photo';
      AgentService.list().then((r) => {
        const a = r.find((x) => x.code === code);
        if (!a) return toast('Agent not found');
        f.name.value = a.name;
        f.mobile.value = a.mobile;
        f.address.value = a.address || '';
        f.status.value = a.status;
      }).catch((e) => toast(e.message));
    }
    f.onsubmit = async (e) => {
      e.preventDefault();
      f.querySelectorAll('.err').forEach((x) => x.remove());
      go.disabled = true;
      try {
        if (edit) {
          await AgentService.update(code, Object.fromEntries(new FormData(f)));
          toast('Saved');
          Router.go('/agents');
          return;
        }
        const fd = new FormData(f);
        fd.delete('notes');
        fd.delete('status');
        const r = await AgentService.create(fd);
        modal({
          title: 'Agent created',
          body: `<p style="color:var(--muted)">${esc(r.agent_id)} · login +91 ${esc(r.mobile)}</p><div class="pin">${esc(r.pin)}</div><div class="alert info">Shown only once. Give it to them in person or by phone.</div>`,
          actions: [{ label: 'Done', kind: 'primary', onClick: () => Router.go('/agents') }]
        });
      } catch (err) {
        showErrors(f, err);
        toast(err.message);
      } finally {
        go.disabled = false;
      }
    };
  }
};
