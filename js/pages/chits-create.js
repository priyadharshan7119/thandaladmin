window.Pages = window.Pages || {};
window.Pages.chitsCreate = {
  title: 'Create Chit · Thandal',
  nav: 'chits',
  template: `<div class="crumb"><a href="/chits">Chit accounts</a> / New</div><h1>Create chit account</h1><div class="two" style="margin-top:16px"><form class="card" id="f" autocomplete="off"><div class="field l"><label>Customer *</label><select class="input" name="customer_id" required><option value="">Select a customer…</option></select></div><div class="row2"><div class="field l"><label>Loan amount (₹) *</label><input class="input" name="loan_amount" type="number" step="1000" min="1000" placeholder="e.g. 50000" required></div><div class="field l"><label>Repayment frequency *</label><select class="input" name="frequency"><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></div></div><div class="row2"><div class="field l"><label id="cl">Number of installments *</label><input class="input" name="installment_count" type="number" min="1" placeholder="e.g. 100" required></div><div class="field l"><label id="al">Installment amount (₹) *</label><input class="input" name="installment_amount" type="number" min="1" placeholder="e.g. 600" required></div></div><div class="row2"><div class="field l"><label>Start date *</label><input class="input" name="start_date" type="date" required></div><div class="field l"><label>Assigned agent</label><select class="input" name="agent_id"><option value="">Assign to customer's agent</option></select></div></div><div class="field l"><label>Notes</label><textarea class="input" name="notes" style="height:60px;padding:8px 12px" placeholder="Optional notes"></textarea></div><button class="btn primary" id="go" style="margin-top:8px">Create chit account</button></form><div class="card" id="pv"></div></div>`,
  init: function() {
    mountShell('chits');
    const f = document.getElementById('f'), pv = document.getElementById('pv');
    if (!f) return;
    const getEl = (n) => f.elements?.[n] || f.querySelector(`[name="${n}"]`);
    const UNIT = { daily: ['days', 'day'], weekly: ['weeks', 'week'], monthly: ['months', 'month'] };
    const sDate = getEl('start_date');
    if (sDate) sDate.value = new Date().toISOString().slice(0, 10);
    const custSel = getEl('customer_id');
    const agentSel = getEl('agent_id');
    CustomerService.list({}).then((r) => r.data.forEach((c) => {
      if (custSel) custSel.insertAdjacentHTML('beforeend', `<option value="${c.id}">${esc(c.user?.name)} · ${esc(c.customer_code)}</option>`);
    })).catch(() => {});
    AgentService.list().then((r) => r.filter((a) => a.id != null && a.status === 'active').forEach((a) => {
      if (agentSel) agentSel.insertAdjacentHTML('beforeend', `<option value="${a.id}">${esc(a.name)}</option>`);
    })).catch(() => {});

    function preview() {
      const fr = getEl('frequency')?.value || 'daily', n = +(getEl('installment_count')?.value || 0), a = +(getEl('installment_amount')?.value || 0), loan = +(getEl('loan_amount')?.value || 0);
      const cl = document.getElementById('cl'), al = document.getElementById('al');
      if (cl) cl.textContent = `Number of installments (${UNIT[fr][0]}) *`;
      if (al) al.textContent = `Installment amount (₹ every ${UNIT[fr][1]}) *`;
      let end = '—';
      const sVal = getEl('start_date')?.value;
      if (n && sVal) {
        const d = new Date(sVal);
        if (fr === 'daily') d.setDate(d.getDate() + n - 1);
        else if (fr === 'weekly') d.setDate(d.getDate() + 7 * (n - 1));
        else d.setMonth(d.getMonth() + n - 1);
        end = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      }
      if (pv) {
        pv.innerHTML = `<b>Preview (from the server)</b>${dl({ 'Loan amount': fmt.money(loan), Repayment: a ? `₹${a.toLocaleString('en-IN')} every ${UNIT[fr][1]}` : '—', Installments: n ? `${n} ${UNIT[fr][0]}` : '—', 'End date': end, 'Interest / charge': n && a && loan ? fmt.money(n * a - loan) : '—' })}<div style="margin:14px 0 4px;color:var(--muted)">Total to pay</div><div class="v" style="font-size:26px;font-weight:600;color:var(--green)">${n && a ? fmt.money(n * a) : '—'}</div><div class="note">The chit is created as Pending. It becomes Active once you record the disbursement.</div>`;
      }
    }

    f.oninput = f.onchange = preview;
    preview();

    f.onsubmit = async (e) => {
      e.preventDefault();
      f.querySelectorAll('.err').forEach((x) => x.remove());
      const b = document.getElementById('go');
      if (b) b.disabled = true;
      const v = Object.fromEntries(new FormData(f));
      ['loan_amount', 'installment_count', 'installment_amount', 'customer_id'].forEach((k) => v[k] = v[k] === '' ? '' : +v[k]);
      if (!v.agent_id) delete v.agent_id;
      if (!v.notes) delete v.notes;
      try {
        const c = await ChitService.create(v);
        modal({
          title: 'Chit account created',
          body: `<p style="color:var(--muted)">${esc(c.chit_code)} is Pending. Record the disbursement to make it Active.</p>`,
          actions: [
            { label: 'Done', onClick: () => Router.go('/chits') },
            { label: 'Record disbursement', kind: 'primary', onClick: () => Router.go(`/chits/details?id=${c.id}&tab=3`) }
          ]
        });
      } catch (err) {
        showErrors(f, err);
        toast(err.message);
      } finally {
        if (b) b.disabled = false;
      }
    };
  }
};
