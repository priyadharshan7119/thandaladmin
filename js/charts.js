// Dependency-free bar chart. data = [[label, value], ...]
function barChart(el, data) {
  const max = Math.max(...data.map((d) => d[1]), 1);
  el.innerHTML = `<div class="bars">${data.map(([l, v]) => `<div class="bcol" title="${fmt.money(v)}"><i style="height:${Math.max(v / max * 100, 3)}%"></i><span>${l}</span></div>`).join('')}</div>`;
}
