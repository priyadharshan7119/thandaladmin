const msg = document.getElementById('msg');
const busy = (b, on, t) => { b.disabled = on; b.textContent = on ? 'Please wait…' : t; };
const login = document.getElementById('login');
if (login) login.onsubmit = async (e) => {
  e.preventDefault(); msg.innerHTML = ''; const b = document.getElementById('go');
  busy(b, true);
  try {
    const r = await Api.auth.login(login.mobile.value.trim(), login.pin.value);
    Auth.save(r.token, r.user);
    if (r.user.role !== 'admin' && r.user.role !== 'super_admin') { Auth.clear(); throw new ApiError(403, { message: 'This console is for admins. Customers and agents use the mobile app.' }); }
    location.href = '../dashboard/index.html';
  } catch (err) {
    showErrors(login, err);
    const left = err.body?.attempts_left != null && !/attempt/i.test(err.message) ? ` ${err.body.attempts_left} attempt(s) left.` : '';
    msg.innerHTML = `<div class="alert">${esc(err.message)}${left}</div>`; busy(b, false, 'Log in');
  }
};
const reg = document.getElementById('reg');
if (reg) reg.onsubmit = async (e) => {
  e.preventDefault(); msg.innerHTML = ''; const b = document.getElementById('go'); busy(b, true);
  try {
    const body = Object.fromEntries(new FormData(reg));
    const r = await Api.auth.register(body);
    document.getElementById('wrap').innerHTML = `<div style="text-align:center"><div class="avatar" style="margin:0 auto 10px">✓</div><h2 style="text-align:center">Registration sent</h2><p class="sub" style="text-align:center">Your request is waiting for a Super Admin.</p>
    <div class="card" style="text-align:left;margin:14px 0"><p>Name: <b>${esc(body.name)}</b></p><p>Mobile: <b>+91 ${esc(body.mobile)}</b></p><p>Status: <span class="pill" style="background:var(--amber-bg);color:var(--amber)">${esc(r.status)}</span></p></div>
    <div class="alert info">You can log in with your mobile number and PIN after approval.</div><a class="btn primary block" href="login.html">Back to log in</a></div>`;
    document.querySelector('.auth-card > h2').remove(); document.querySelector('.auth-card > .sub').remove();
  } catch (err) { showErrors(reg, err); msg.innerHTML = `<div class="alert">${esc(err.message)}</div>`; busy(b, false, 'Submit registration'); }
};
