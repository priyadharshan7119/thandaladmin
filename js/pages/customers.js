mountShell('customers');
const rows = document.getElementById('rows'); let page = 1, data = [];
const num = (v) => typeof v === 'number' ? fmt.money(v) : (v ?? '—');
const agentSel = document.getElementById('agent');
AgentService.list().then((a) => a.forEach((x) => agentSel.insertAdjacentHTML('beforeend', `<option>${esc(x.name)}</option>`))).catch(() => {});
agentSel.onchange = () => load();
async function load() {
  rows.innerHTML = '<tr><td colspan="7"><div class="skel"></div></td></tr>';
  try {
    const r = await Api.customers.list({ q: document.getElementById('q').value.trim(), page });
    data = r.data; const st = document.getElementById('status').value, ag = agentSel.value;
    const list = data.filter((c) => (!st || c.user?.status === st) && (!ag || (ag === '__none' ? !c.agent : c.agent?.user?.name === ag)));
    document.getElementById('count').textContent = `${r.total} customers`;
    rows.innerHTML = list.length ? list.map((c) => `<tr class="click" data-cid="${c.id}" onclick="location.href='details.html?id=${c.id}'"><td><div class="who"><span class="avatar">${fmt.initials(c.user?.name)}</span><div><b>${esc(c.user?.name)}</b><small>${esc(c.customer_code)}</small></div></div></td><td>+91 ${esc(c.user?.mobile)}</td><td>${esc(c.agent?.user?.name || 'Not assigned')}</td><td class="r" data-f="chits">—</td><td class="r" data-f="out">—</td><td class="r" data-f="od" style="color:var(--red)">—</td><td><span class="pill ${c.user?.status === 'active' ? '' : 'off'}">${esc(c.user?.status)}</span></td></tr>`).join('')
      : '<tr><td colspan="7" class="empty">No customers match your search.</td></tr>';
    // The list response has no balances; the portfolio endpoint supplies them in one call.
    CustomerService.balances().then((m) => list.forEach((c) => { const tr = rows.querySelector(`[data-cid="${c.id}"]`), b = m[c.id]; if (!tr || !b) return; tr.querySelector('[data-f=chits]').textContent = b.chits.filter((k) => k.status === 'active').length; tr.querySelector('[data-f=out]').textContent = fmt.paise(b.outstanding_paise); tr.querySelector('[data-f=od]').innerHTML = b.overdue_paise ? fmt.paise(b.overdue_paise) : '<span style="color:var(--muted)">—</span>'; })).catch(() => {});
    const pg = document.getElementById('pager');
    pg.innerHTML = `<span>Showing ${r.from ?? 0}–${r.to ?? 0} of ${r.total}</span><span></span>`;
    for (let i = 1; i <= r.last_page; i++) { const b = document.createElement('button'); b.textContent = i; if (i === r.current_page) b.className = 'on'; b.onclick = () => { page = i; load(); }; pg.lastChild.append(b); }
  } catch (e) { rows.innerHTML = `<tr><td colspan="7"><div class="alert">${esc(e.message)}</div></td></tr>`; }
}
document.getElementById('q').value = new URLSearchParams(location.search).get('q') || '';
let t; document.getElementById('q').oninput = () => { clearTimeout(t); t = setTimeout(() => { page = 1; load(); }, 300); };
document.getElementById('status').onchange = load; load();
