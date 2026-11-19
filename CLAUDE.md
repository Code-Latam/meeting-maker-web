# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start Vite dev server (http://localhost:3000)
npm run build     # production build (vite build, outputs to dist/)
npm run preview   # serve the production build locally (port 3000)
npm run lint      # oxlint (React + oxc rules; config in .oxlintrc.json)
```

There is no test framework or test script configured in this project.

## Stack

- **React 19** + **Vite 8** (rolldown-based), no TypeScript — plain `.jsx`/`.js` throughout.
- **react-router-dom v7** for routing (single `<BrowserRouter>` in `src/main.jsx`).
- **Zustand v5** (with `persist` middleware) for client state.
- **axios** for all HTTP; **Tailwind CSS v4** (CSS-first via `@import "tailwindcss"`), **chart.js**, **@headlessui/react**, **@tiptap** (rich text).
- **oxlint** for linting (no ESLint, no Prettier config).

## Architecture

The app is a mobile-first SPA for a multi-tenant meeting/lead-generation product, following a strict three-layer pattern:

**`src/services/*` → `src/store/*` → `src/components/*` / `src/pages/*`**

- **`src/services/`** — axios wrappers, one file per backend domain (`api.js`, `auth.js`, `agents.js`, `crm.js`, `dashboard.js`, `boost.js`, `ranking.js`, `activity.js`, `campaigns.js`, `persons.js`, `blogStore`-adjacent `companyProfile.js`, `conversionService.js`). All share the single configured `api` instance from `services/api.js`.
- **`src/store/`** — Zustand stores. `store/index.js` defines `useAuthStore` (persisted as `auth-storage`), `useAppStore` (active-client switching, `app-storage`), `useUIStore`, and re-exports `useBlogStore`. Other domain stores live in separate files (`agentStore.js`, `boostStore.js`, `dashboardStore.js`) and are imported directly (not re-exported from `index.js`).
- **`src/components/`** — organized by feature domain (`Activity`, `Agent`, `CRM`, `Dashboard`, `Finance`, `Layout`, `Ranking`, `Tabs`, `Common`, etc.). **`src/pages/`** holds route-level components.

### API layer (`src/services/api.js`)

- Base URL: `import.meta.env.VITE_API_URL` with fallback `https://api.meetingmaker.tech`.
- The request interceptor attaches `Authorization: Bearer <jwt>` (from `localStorage`), and an `X-Client-Id` header when an **agency** user has switched to viewing a child client (see multi-tenancy below). It never sends `X-Client-Id` for the `/auth/me` endpoint.
- The response interceptor redirects to `/login` on any `401`, except for `/auth/login`, `/auth/me`, and `/auth/agency/verify-child` calls.
- Services are **defensive**: they `try/catch` and return `{ success, ...data | error }` rather than throwing. Some methods return raw arrays/objects instead (e.g. `dashboardService` returns metric numbers directly), so check the specific service.

### Auth & multi-tenancy (agency / child clients)

This is the most important cross-cutting concern and spans `services/api.js`, `store/index.js`, and `App.jsx`:

- Authentication is a JWT stored in `localStorage` under `jwt`; user/client data is mirrored in `localStorage` (`user`, `client`, `agencyClient`, `activeClientId`, `isChildClient`).
- An **agency** user has `client.isAgency === true` and can switch to view a **child** client's data; the active child id is tracked in `useAppStore.activeClientId` and sent to the backend via the `X-Client-Id` header.
- A user is a **restricted child client** when they have a `parentClientId` set AND `fullAccessForChildren !== true`. `useAuthStore.isChildClient` drives a `ChildClientGuard` in `App.jsx` that redirects restricted children away from certain routes (`/agents` index, `/ranking`, `/about`, `/templates`, and agent-detail sub-pages).
- `checkAuth()` (in `store/index.js`) re-fetches `/auth/me` on startup and reconstructs all of this state, with a `localStorage` fallback on failure.

### Routing

All routes are declared inline in `src/App.jsx`. The `/` route renders `components/Layout/AppLayout` (which shows `Header` + `MobileNav`/`DesktopSidebar` around an `<Outlet />`), with child routes for each tab/page. `components/Layout/ProtectedRoute.jsx` exists but the active auth gate is the inline `isAuthenticated ? <AppLayout/> : <Navigate to="/login"/>` check.

### Styling

Tailwind v4 is imported CSS-first in `src/index.css` (`@import "tailwindcss"`). `tailwind.config.js` extends the theme with an `xs` breakpoint, a `primary` blue palette, and `safe-top`/`safe-bottom` spacing + 44px `touch` minimum sizes for mobile targets. **`src/index.css` also hand-defines a large number of utility/component classes** (`@layer components` for `.card`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, plus hundreds of manually written utilities like `.flex`, `.gap-2`, `.line-clamp-2`). These are not Tailwind-generated — when styling, prefer real Tailwind utility classes or the existing `@layer components` helpers rather than adding more hand-written CSS.

Responsive behavior is driven by `useUIStore.isMobile`, which flips on a `resize` listener at the `1024px` breakpoint (`store/index.js`).

## Gotchas

- **`copy` / `copy.jsx` files are scratch backups, not part of the app** (e.g. `src/App copy.jsx`, `src/components/Agent/AgentForm copy.jsx`, `src/components/CRM/DealsBoard copy.jsx`). Do not import or edit them; do not assume they match the live file.
- Empty placeholder files exist at the repo root (`meeting-maker-web@0.0.0`, `tailwindcss` — both 0 bytes); ignore them.
- The codebase is heavily instrumented with `console.log` (often emoji-prefixed) for debugging. These are intentional and pervasive; leave them unless asked to clean up.
- `vite.config.js` sets `sourcemap: true` for production builds and serves on port 3000 for both dev and preview.
- `vercel.json` rewrites all routes to `/index.html` (SPA fallback) — the app is deployed to Vercel.
