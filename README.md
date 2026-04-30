# MediCore — Healthcare Application

A React + TypeScript dashboard for managing hospital patients: live CRUD, search/filter/sort, role-aware notifications, light/dark theming, and analytics. Built as a frontend-engineer assignment.

**🚀 [View Live Demo](https://healthcare-application-xi.vercel.app/)**

---

## Stack

- **React 19** + **Vite 8** + **TypeScript** (strict mode)
- **Redux Toolkit** + custom middleware
- **Firebase** — Auth (email + Google) and Firestore (patient persistence)
- **React Router 7** for routing, with route-level code splitting (`React.lazy` + `Suspense`)
- **Framer Motion** for transitions
- **Recharts** for charts
- **Vitest** + **React Testing Library** + **jsdom** for unit tests

---

## Getting started

### Prerequisites

- Node 18+ and npm
- A Firebase project with **Authentication** (Email/Password + Google) and **Firestore** enabled

### 1. Install

```bash
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your Firebase web-app credentials:

```bash
cp .env.example .env
```

`.env` keys:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 3. Run

```bash
npm run dev       # start Vite dev server
npm run build     # type-check + production build to dist/
npm run preview   # preview the production build locally
npm test          # run unit tests once
npm run test:watch  # watch mode
npm run test:ui     # Vitest UI
```

---

## Routes

| Path         | Component         | Auth required |
| ------------ | ----------------- | ------------- |
| `/`          | smart redirect    | —             |
| `/Login`     | `LoginPage`       | no            |
| `/Signup`    | `SignUpPage`      | no            |
| `/Dashboard` | `DashboardPage`   | yes           |
| `/Patients`  | `PatientsPage`    | yes           |
| `/Analytics` | `AnalyticsPage`   | yes           |
| `/Settings`  | `SettingsPage`    | yes           |

`AuthEntryRedirect` sends new visitors to `/Signup`, returning users to `/Login`, and authenticated users to `/Dashboard`.

---

## Architecture

### Folder layout

```
src/
├── App.tsx                       # routes + Firestore listener wiring
├── main.tsx                      # React root + Redux Provider
├── index.css                     # global stylesheet (CSS variables, theming)
│
├── core/                         # cross-cutting infrastructure
│   ├── moduleRegistry.ts         # registers feature modules + their routes
│   └── types.ts
│
├── modules/                      # micro-module manifests (one per feature area)
│   ├── dashboard/module.ts
│   ├── patients/module.ts
│   ├── analytics/module.ts
│   └── settings/module.ts
│
├── features/                     # feature-scoped UI
│   ├── auth/                     # Login, Signup, AuthLayout, ProtectedRoute
│   ├── dashboard/
│   ├── patients/                 # PatientsPage + AddPatientModal (+ tests)
│   ├── analytics/
│   ├── notifications/            # NotificationPanel
│   └── settings/
│
├── components/layout/            # shared layout chrome
│   ├── AppLayout.tsx
│   ├── Sidebar.tsx
│   └── Topbar.tsx
│
├── store/                        # Redux Toolkit
│   ├── index.ts                  # configureStore + typed hooks
│   ├── slices/                   # auth, patients, notifications, ui
│   └── middleware/
│       └── notificationMiddleware.ts   # diffs CRUD events → push notifications
│
├── services/                     # external boundaries
│   ├── firebase.ts               # SDK init + auth helpers
│   ├── patientService.ts         # Firestore CRUD + Random User API
│   └── notifications.ts          # Web Notifications API wrapper
│
├── hooks/                        # useAuth, useBreakpoint, useNotifications
├── types/                        # shared TS types (Patient, Notification, …)
├── utils/                        # formatters, mock chart data
└── test/setup.ts                 # Vitest setup (jest-dom matchers)
```

### Data flow

1. On app load, `App.tsx` dispatches `fetchPatients()` which pulls 20 deterministically-seeded records from the [Random User Generator API](https://randomuser.me/api/) and maps them to the `Patient` shape.
2. A Firestore `onSnapshot` listener merges any user-added/edited patients on top of the seed list (`mergeFirestorePatients`).
3. CRUD thunks (`addPatientThunk`, `updatePatientThunk`, `deletePatientsThunk`) write to Firestore and update the slice optimistically.
4. `notificationMiddleware` snapshots the patients slice on `pending` and diffs it on `fulfilled` to fire a push notification with only the changed fields.
5. `uiSlice` controls theme (`light` / `dark`) and a global `notificationsEnabled` flag (gates the middleware).

### Key design choices

- **Service-layer isolation** — every external dependency (Firebase, Random User API, Web Notifications) lives in `src/services/` so the rest of the app talks to a stable internal API.
- **Module registry** — each feature exposes a `MicroModule` manifest (`id`, `routes`, optional `initialize()`); `App.tsx` collects routes from `moduleRegistry.getAllRoutes()`. Adding a new feature is a one-import change.
- **Deterministic patient IDs** (`P001`, `P002`, …) derived from a hash of the Random User UUID, so the same person maps to the same patient across reloads.
- **Diff-based notifications** — the notification middleware compares before/after state and only mentions fields that actually changed.
- **Theming** — a `data-theme` attribute on `<html>` flips a single set of CSS variables, so themes work everywhere with no per-component logic.
- **Route-level code splitting** — every module page is `React.lazy`-imported and wrapped in `Suspense` so unauthenticated users don't download dashboard code.

---




