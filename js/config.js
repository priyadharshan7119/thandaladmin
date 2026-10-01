// API base URL – injected by Vite's inject-api-config plugin (see vite.config.js)
// as a synchronous inline <script> in every HTML page's <head>.
//
// This file is now a safety net only: it runs AFTER the inline injection, so
// window.THANDAL is already set. The guard below is a no-op during normal Vite
// usage (dev and build). It only activates when the folder is served without
// Vite (e.g. plain python -m http.server) for quick offline checks.
if (!window.THANDAL) {
  window.THANDAL = {
    API_BASE_URL: 'https://pavilionrestaurant.ca/thandal/api', // fallback – non-Vite only
  };
}
