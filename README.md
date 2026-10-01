# Thandal Admin Console: frontend

Static HTML / CSS / vanilla JavaScript. No build step. It talks to your Laravel backend over its REST API and contains no backend code.

## Run
1. Start the Laravel backend (e.g. `php artisan serve`, default http://localhost:8000).
2. Set `API_BASE_URL` in `js/config.js` (it includes `/api`).
3. Serve this folder: `python3 -m http.server 5500` (or `npx serve .`) and open http://localhost:5500/.
4. If the browser blocks requests, allow the origin in the backend's CORS config (a backend setting you control).
Log in with a Super Admin / Admin mobile number and PIN (for the seeded data: 9000012345 / 1357).

## Structure
`pages/` one folder per module · `js/api.js` all HTTP calls · `js/services/services.js` maps API responses to UI rows (one service per module) · `js/pages/` page logic · `js/ui.js`, `js/app.js` shared UI (shell, tables, drawers, modals, tabs) · `css/app.css` all styles · `js/services/mock/data.js` mock data (settings only).

## Endpoints used (all exist in routes/api.php)
Auth: POST /auth/login, /auth/register-admin, /auth/logout · GET /me
Dashboard: GET /admin/dashboard, /admin/portfolio
Customers: GET /admin/customers, /admin/customers/{id} · POST /admin/customers, /{id}/transfer, /{id}/reset-pin, /{id}/active
Agents: GET /admin/agents · POST /admin/agents, /{id}/reset-pin, /{id}/active
Chits: GET /admin/chits, /admin/chits/{id}, /{id}/schedule · POST /admin/chits, /{id}/disburse, /{id}/cancel
Payments: GET /admin/payments, /admin/payments/{id}
Corrections: GET /admin/corrections · POST /{id}/approve, /{id}/reject
Audit: GET /admin/audit-logs
Admin users: GET /admin/admin-users?status= · POST /{id}/approve, /{id}/reject, /{id}/active

## Derived from real data (no dedicated endpoint)
Dashboard Daily collection and Agent performance, all 10 reports, and each customer's Payments / Receipts / Disbursements / Audit tabs are computed in the browser from the payments, chits, agents, portfolio and audit-log feeds. Figures for past days that the API cannot provide (expected, pending) show "—".

## Integration gaps (UI built, nothing sent)
- Edit customer and Edit agent: no update endpoint. The forms open and show an "API not available" message on save.
- System settings: no settings endpoint. The four tabs work locally using mock data (`SettingsService`).
- Report export creates a CSV in the browser (no server-side Excel export).
- The backend rejects an empty approval note (becomes null), so the frontend always sends "Approved." when none is typed.

## Testing status
Browser-tested (Chromium, 1440px and 390px) against a copy of the updated backend with seeded data: login, dashboard and its tabs, customers (balances, all detail tabs, reset PIN, transfer, activate), agents (drawer tabs, reset PIN, transfer-then-deactivate), chits (list, create, details, schedule, disbursement), payments, corrections review, reports, audit logs, admin users, settings, and mobile overflow: no console errors and no failed requests.
Compared side by side with the screenshots and adjusted: Login, Register, Dashboard (3 tabs), Customers, Customer details, Agents, Agent create, Chit list / create / details / disbursement, Payments, Correction drawer, Reports, Audit logs, Admin users and registration drawer, Settings (4 tabs). Fonts load from Google Fonts (IBM Plex Sans) and were not available in the test browser, so type metrics were not checked.
Not verified: Razorpay online-payment flows end to end (no online payments in the test data), and modal/drawer dimensions to the pixel.
