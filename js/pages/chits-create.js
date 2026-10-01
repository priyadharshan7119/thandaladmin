mountShell('chits');
const f = document.getElementById('f'), pv = document.getElementById('pv');
const UNIT = { daily: ['days', 'day'], weekly: ['weeks', 'week'], monthly: ['months', 'month'] };
f.start_date.value = new Date().toISOString().slice(0, 10);
CustomerService.list({}).then((r) => r.data.forEach((c) => f.customer_id.insertAdjacentHTML('beforeend', `<option value="${c.id}">${esc(c.user?.name)} · ${esc(c.customer_code)}</option>`))).catch(() => {});
AgentService.list().then((r) => r.filter((a) => a.id != null && a.status === 'active').forEach((a) => f.agent_id.insertAdjacentHTML('beforeend', `<option value="${a.id}">${esc(a.name)}</option>`))).catch(() => {});
// Local preview: the API has no preview endpoint, so totals are computed here (GAP).
function preview() {
  const fr = f.frequency.value, n = +f.installment_count.value || 0, a = +f.installment_amount.value || 0, loan = +f.loan_amount.value || 0;
  document.getElementById('cl').textContent = `Number of installments (${UNIT[fr][0]}) *`; document.getElementById('al').textContent = `Installment amount (₹ every ${UNIT[fr][1]}) *`;
  let end = '—'; if (n && f.start_date.value) { const d = new Date(f.start_date.value); if (fr === 'daily') d.setDate(d.getDate() + n - 1); else if (fr === 'weekly') d.setDate(d.getDate() + 7 * (n - 1)); else d.setMonth(d.getMonth() + n - 1); end = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
  pv.innerHTML = `<b>Preview (from the server)</b>${dl({ 'Loan amount': fmt.money(loan), Repayment: a ? `₹${a.toLocaleString('en-IN')} every ${UNIT[fr][1]}` : '—', Installments: n ? `${n} ${UNIT[fr][0]}` : '—', 'End date': end, 'Interest / charge': n && a && loan ? fmt.money(n * a - loan) : '—' })}<div style="margin:14px 0 4px;color:var(--muted)">Total to pay</div><div class="v" style="font-size:26px;font-weight:600;color:var(--green)">${n && a ? fmt.money(n * a) : '—'}</div><div class="note">The chit is created as Pending. It becomes Active once you record the disbursement.</div>`;
}
f.oninput = f.onchange = preview; preview();
f.onsubmit = async (e) => {
  e.preventDefault(); f.querySelectorAll('.err').forEach((x) => x.remove()); const b = document.getElementById('go'); b.disabled = true;
  const v = Object.fromEntries(new FormData(f)); ['loan_amount', 'installment_count', 'installment_amount', 'customer_id'].forEach((k) => v[k] = v[k] === '' ? '' : +v[k]); if (!v.agent_id) delete v.agent_id; if (!v.notes) delete v.notes;
  try { const c = await ChitService.create(v);
    modal({ title: 'Chit account created', body: `<p style="color:var(--muted)">${esc(c.chit_code)} is Pending. Record the disbursement to make it Active.</p>`, actions: [{ label: 'Done', onClick: () => location.href = 'index.html' }, { label: 'Record disbursement', kind: 'primary', onClick: () => location.href = `details.html?id=${c.id}&tab=3` }] });
  } catch (err) { showErrors(f, err); toast(err.message); } finally { b.disabled = false; }
};
