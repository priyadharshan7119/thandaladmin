window.Pages = window.Pages || {};
window.Pages.auditLogs = {
  title: 'Audit Logs · Thandal',
  nav: 'audit',
  template: `<h1>Audit logs</h1><p style="color:var(--muted);margin:4px 0 16px">Every financial and account action taken by admins and agents is recorded permanently.</p><div class="filters"><input class="input" id="q" placeholder="Search actor, action or details"><select class="input" id="act"><option value="">All actions</option></select></div><div id="out"></div>`,
  init: function() {
    mountShell('audit');
    const out = document.getElementById('out');
    let all = [];
    const act = document.getElementById('act');

    function render() {
      const q = document.getElementById('q').value.toLowerCase(), a = act.value;
      const r = all.filter((x) => (!a || x.action === a) && Object.values(x).join(' ').toLowerCase().includes(q));
      out.innerHTML = table([{ h: 'Time', f: (x) => x.time }, { h: 'Actor', f: (x) => esc(x.actor) }, { h: 'Action', f: (x) => `<b>${x.action}</b>` }, { h: 'Entity', f: (x) => x.entity }, { h: 'Details', f: (x) => esc(x.detail) }], r, 'No log entries match.');
    }

    loading(out);
    AuditService.list().then((r) => {
      all = r;
      act.innerHTML = '<option value="">All actions</option>' + [...new Set(r.map((x) => x.action))].map((a) => `<option>${a}</option>`).join('');
      render();
    }).catch((e) => failed(out, e));

    document.getElementById('q').oninput = render;
    act.onchange = render;
  }
};
