window.Pages = window.Pages || {};
window.Pages.reports = {
  title: 'Reports · Thandal',
  nav: 'reports',
  template: `<h1>Reports</h1><p style="color:var(--muted);margin:4px 0 16px">Choose a report. All reports can be filtered and exported to CSV or Excel.</p><div id="out"></div>`,
  init: function() {
    mountShell('reports');
    const out = document.getElementById('out');
    const show = (v, i, d) => (d.money || []).includes(i) ? fmt.money(v) : /^(active|completed|confirmed|failed|pending verification)$/.test(v) ? pill(v) : esc(v);

    async function open(name) {
      document.querySelectorAll('#app-content > h1, #app-content > p').forEach((e) => e.hidden = true);
      out.innerHTML = `<div class="head"><div><div class="crumb"><a href="/reports" id="back-rep">Reports</a> / ${esc(name)}</div><h1>${esc(name)}</h1></div><button class="btn primary" id="ex">Export CSV / Excel</button></div><div class="filters"><input class="input" id="s" placeholder="Filter rows"><small id="rc" style="align-self:center;color:var(--muted)"></small></div><div id="tb"></div>`;
      const backRep = out.querySelector('#back-rep');
      if (backRep) {
        backRep.onclick = (e) => {
          e.preventDefault();
          Router.go('/reports');
        };
      }
      const tb = document.getElementById('tb');
      loading(tb);
      let d;
      try { d = await ReportService.run(name); } catch (e) { return failed(tb, e); }
      const draw = () => {
        const q = out.querySelector('#s').value.toLowerCase();
        const rows = d.rows.filter((r) => r.join(' ').toLowerCase().includes(q));
        out.querySelector('#rc').textContent = `${rows.length} rows`;
        tb.innerHTML = table(d.cols.map((h, i) => ({ h, f: (r) => show(r[i], i, d), r: (d.money || []).includes(i) })), rows, 'No rows for these filters.');
      };
      draw();
      out.querySelector('#s').oninput = draw;
      document.getElementById('ex').onclick = () => modal({
        title: 'Export',
        body: '<div class="field l"><label>Format</label><label class="opt"><input type="radio" name="fm" value="csv" checked> CSV</label> <label class="opt"><input type="radio" name="fm" value="xls"> Excel</label></div><div class="field l"><label>Date range</label><select class="input"><option>Today</option><option>Last 7 days</option><option>This month</option></select></div>',
        actions: [
          { label: 'Cancel' },
          { label: 'Generate file', kind: 'primary', onClick: (c) => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(ReportService.csv(name, d));
            a.download = name.toLowerCase().replace(/\\W+/g, '-') + '.csv';
            a.click();
            c();
            toast('Exported from demo data');
          } }
        ]
      });
    }

    loading(out);
    ReportService.catalog().then((r) => {
      out.innerHTML = '<div class="rep">' + r.map(([n, d]) => `<div class="card" data-n="${n}"><b>${n}</b><br><small>${d}</small></div>`).join('') + '</div>';
      out.querySelectorAll('.card').forEach((c) => c.onclick = () => open(c.dataset.n));
      const q = new URLSearchParams(location.search).get('r');
      if (q) open(q);
    });
  }
};
