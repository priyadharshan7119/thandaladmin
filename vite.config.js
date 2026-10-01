import { fileURLToPath } from 'url'
import { dirname, resolve, join } from 'path'
import { cpSync } from 'fs'
import { defineConfig, loadEnv } from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Injects `window.THANDAL = { API_BASE_URL: "..." }` as a synchronous inline
 * <script> at the very top of <head> in every HTML file.
 *
 * Inline scripts run before any src-based <script> tags, so window.THANDAL is
 * always available when api.js (and every page script) first reads it.
 */
function injectApiConfig(apiUrl) {
  return {
    name: 'inject-api-config',
    transformIndexHtml: {
      order: 'pre',
      handler() {
        return [
          {
            tag: 'script',
            children: `window.THANDAL={API_BASE_URL:${JSON.stringify(apiUrl)}};`,
            injectTo: 'head-prepend',
          },
        ]
      },
    },
  }
}

/**
 * Copies the js/ folder to dist/js/ so that the classic <script src="...">
 * relative paths in the built HTML files continue to resolve correctly.
 * Vite does not bundle classic (non-module) scripts; it leaves their paths
 * unchanged in the HTML, so the source files must be present in the output.
 */
function copyClassicScripts() {
  return {
    name: 'copy-classic-scripts',
    closeBundle() {
      cpSync(
        join(__dirname, 'js'),
        join(__dirname, 'dist', 'js'),
        { recursive: true }
      )
    },
  }
}

export default defineConfig(({ mode }) => {
  // Load env vars from .env / .env.production etc.
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl =
    env.VITE_API_BASE_URL || 'https://pavilionrestaurant.ca/thandal/api'

  return {
    plugins: [injectApiConfig(apiUrl), copyClassicScripts()],

    build: {
      rollupOptions: {
        // Every HTML page is its own entry point (multi-page app).
        input: {
          main:             resolve(__dirname, 'index.html'),
          login:            resolve(__dirname, 'pages/auth/login.html'),
          register:         resolve(__dirname, 'pages/auth/register.html'),
          dashboard:        resolve(__dirname, 'pages/dashboard/index.html'),
          customers:        resolve(__dirname, 'pages/customers/index.html'),
          customersCreate:  resolve(__dirname, 'pages/customers/create.html'),
          customersDetails: resolve(__dirname, 'pages/customers/details.html'),
          agents:           resolve(__dirname, 'pages/agents/index.html'),
          agentsCreate:     resolve(__dirname, 'pages/agents/create.html'),
          chits:            resolve(__dirname, 'pages/chits/index.html'),
          chitsCreate:      resolve(__dirname, 'pages/chits/create.html'),
          chitsDetails:     resolve(__dirname, 'pages/chits/details.html'),
          payments:         resolve(__dirname, 'pages/payments/index.html'),
          paymentsDetails:  resolve(__dirname, 'pages/payments/details.html'),
          paymentsRazorpay: resolve(__dirname, 'pages/payments/razorpay.html'),
          reports:          resolve(__dirname, 'pages/reports/index.html'),
          auditLogs:        resolve(__dirname, 'pages/audit-logs/index.html'),
          adminUsers:       resolve(__dirname, 'pages/admin-users/index.html'),
          settings:         resolve(__dirname, 'pages/settings/index.html'),
        },
      },
    },
  }
})
