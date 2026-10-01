const pill = (s) => { const k = { active: '', confirmed: '', completed: '', approved: '', paid: '', pending: 'am', 'pending verification': 'am', failed: 'rd', 'waiting for approval': 'am', rejected: 'rd', cancelled: 'off', inactive: 'off' }[s] ?? 'off'; return `<span class="pill ${k}">${esc(s)}</span>`; };
const PAGE = 10;
function table(cols, rows, empty = 'Nothing to show') {
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const body = rows.length ? rows.map((r, i) => `<tr class="click" data-i="${i}" data-p="${Math.floor(i / PAGE) + 1}"${i >= PAGE ? ' hidden' : ''}>${cols.map((c) => `<td class="${c.r ? 'r' : ''}">${c.f(r)}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${cols.length}" class="empty">${empty}</td></tr>`;
  const btns = pages > 1 ? Array.from({ length: pages }, (_, k) => `<button data-pg="${k + 1}" class="${k ? '' : 'on'}">${k + 1}</button>`).join('') : '<button class="on" disabled>1</button>';
  return `<div class="tw" data-total="${rows.length}"><table><thead><tr>${cols.map((c) => `<th class="${c.r ? 'r' : ''}">${c.h}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table><div class="pager"><span class="pinfo">Showing ${rows.length ? `1–${Math.min(PAGE, rows.length)}` : 0} of ${rows.length}</span><span>${btns}</span></div></div>`;
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('.pager button[data-pg]'); if (!b) return; const w = b.closest('.tw'), n = b.dataset.pg, t = +w.dataset.total;
  w.querySelectorAll('tbody tr[data-p]').forEach((r) => r.hidden = r.dataset.p !== n);
  w.querySelectorAll('.pager button').forEach((x) => x.classList.toggle('on', x === b));
  w.querySelector('.pinfo').textContent = `Showing ${(n - 1) * PAGE + 1}–${Math.min(n * PAGE, t)} of ${t}`;
});
function drawer(title, html) {
  const o = document.createElement('div'); o.className = 'overlay dr'; o.innerHTML = `<aside class="drawer"><header><b>${esc(title)}</b><button aria-label="Close">✕</button></header><div class="db">${html}</div></aside>`;
  const close = () => o.remove(); o.querySelector('button').onclick = close; o.onmousedown = (e) => e.target === o && close(); document.body.append(o); return { el: o.querySelector('.db'), close };
}
function tabs(el, names, onPick, start = 0) {
  el.className = 'tabs'; el.innerHTML = names.map((n, i) => `<button class="${i === start ? 'on' : ''}">${n}</button>`).join('');
  el.querySelectorAll('button').forEach((b, i) => b.onclick = () => { el.querySelector('.on').classList.remove('on'); b.classList.add('on'); onPick(i, names[i]); });
}
const chips = (el, names, onPick, start = 0) => { tabs(el, names, onPick, start); el.className = 'chips'; };
const dl = (o) => Object.entries(o).map(([k, v]) => `<div class="kv"><span>${k}</span><b>${v}</b></div>`).join('');
const loading = (el) => el.innerHTML = '<div class="skel" style="height:120px"></div>';
const failed = (el, e) => el.innerHTML = `<div class="alert">${esc(e.message)}</div>`;
