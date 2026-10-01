window.Pages = window.Pages || {};
window.Pages.customersCreate = {
  title: 'Create Customer · Thandal',
  nav: 'customers',
  template: `<div class="crumb"><a href="/customers">Customers</a> / New</div><h1>Create customer</h1><div class="two" style="margin-top:16px"><form class="card" id="f" autocomplete="off"><div class="field l"><label>Full name *</label><input class="input" name="name" required placeholder="e.g. S. Kumar"></div><div class="field l"><label>Mobile number (for login) *</label><div class="phone"><span>+91</span><input class="input" name="mobile" required pattern="[6-9]\\d{9}" maxlength="10" placeholder="10-digit mobile" inputmode="numeric"></div></div><div class="field l"><label>Address</label><textarea class="input" name="address" style="height:70px;padding:8px 12px" placeholder="Street, area, landmark"></textarea></div><div class="row2"><div class="field l"><label>ID proof type</label><select class="input" name="id_proof_type"><option value="">Select type…</option><option value="aadhaar">Aadhaar</option><option value="pan">PAN</option><option value="voter_id">Voter ID</option><option value="ration">Ration card</option></select></div><div class="field l"><label>ID number</label><input class="input" name="id_proof_number" placeholder="Last 4 digits or full"></div></div><div class="field l"><label>Assigned agent</label><select class="input" name="agent_id" id="agent"><option value="">Select an agent (optional)…</option></select></div><div class="field l"><label>Initial PIN</label><input class="input" name="pin" type="password" maxlength="4" pattern="\\d{4}" inputmode="numeric" placeholder="4 digits (leave blank to auto-generate)"></div><div class="field l"><label>ID document photo</label><input class="input" name="document" type="file" accept="image/*,.pdf" style="padding:6px"></div><button class="btn primary" id="go" style="margin-top:8px">Create customer</button></form><div class="card"><b>What happens next</b><div class="note" style="margin:10px 0">A customer ID (THD-10xxx) is generated automatically. The customer can log in to the mobile app immediately using their mobile and PIN.</div><b style="display:block;margin-top:16px">ID document</b><p style="color:var(--muted);font-size:12px;margin-top:4px">Stored securely. Only Super Admins can see the uploaded file.</p></div></div>`,
  init: function() {
    mountShell('customers');
    const f = document.getElementById('f');
    Api.agents.list().then((a) => a.filter((x) => x.status === 'active' && x.id != null).forEach((x) => {
      const agEl = document.getElementById('agent');
      if (agEl) agEl.insertAdjacentHTML('beforeend', `<option value="${x.id}">${esc(x.name)} (${esc(x.code)})</option>`);
    })).catch(() => {});

    f.onsubmit = async (e) => {
      e.preventDefault();
      const b = document.getElementById('go');
      b.disabled = true;
      const fd = new FormData(f);
      if (f.document.files[0]) fd.set('document', f.document.files[0]);
      if (!fd.get('agent_id')) fd.delete('agent_id');
      try {
        const r = await Api.customers.create(fd);
        modal({
          title: 'Customer created',
          body: `<p style="color:var(--muted)">${esc(r.customer_id)} · login +91 ${esc(r.mobile)}</p><div class="pin">${esc(r.pin)}</div><div class="alert info">Shown only once. Give it to them in person or by phone.</div>`,
          actions: [{ label: 'Done', kind: 'primary', onClick: () => Router.go('/customers') }]
        });
      } catch (err) {
        showErrors(f, err);
        toast(err.message);
        b.disabled = false;
      }
    };
  }
};
