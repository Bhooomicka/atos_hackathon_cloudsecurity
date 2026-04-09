# Sentinel Dashboard (Frontend + Backend)

Sentinel is a security operations dashboard with role-based views, alert monitoring, access hygiene workflows, offboarding tracking, credential rotation, and compliance visibility.

## Current Project State

- Frontend is fully usable in frontend-only mode (no backend required).
- Backend now includes testable JIT privileged access, sales-safe operations settings, maintenance-window aware permission changes, offboarding updates, credential rotation flows, and an ML-based behavioral baselining workflow.
- Sidebar navigation is split into dedicated pages:
  - Dashboard
  - Users & Accounts
  - Threats
  - Credentials
  - Compliance
  - Settings
- Users & Accounts shows access and assigned tasks (no plaintext passwords displayed in UI).

## Repository Layout

- frontend: React app (CRA + CRACO + Tailwind + Radix UI)
- backend: FastAPI service
- tests, test_reports: backend testing assets
- docs: cloud/deployment documentation

## AWS Trial-Friendly Deployment

For a credit-conscious AWS setup aligned to the security architecture (IAM, CloudTrail/GuardDuty, Secrets Manager, Config/Security Hub, EventBridge/Lambda, CI policy checks), use:

- `docs/AWS_FREE_TRIAL_SECURITY_RUNBOOK.md`

## Student Free Deployment (No Upfront Cloud Spend)

For a zero-upfront path using Vercel + Render + MongoDB Atlas free tier, use:

- `docs/STUDENT_FREE_DEPLOYMENT.md`

## Prerequisites

- Node.js 18+
- npm 9+
- Python 3.10+

## Quick Start (Frontend Only)

This is the recommended mode for local UI development.

1) Install frontend dependencies

	cd frontend
	npm install --legacy-peer-deps

2) Create frontend env file

	Create frontend/.env with:

	REACT_APP_BACKEND_URL=http://localhost:8000

3) Start frontend

	npm start

4) Open app

	http://localhost:3000

## Mock Login (When Backend Is Not Running)

The app automatically falls back to mock authentication if backend login is unavailable.

Mock users:

- Admin: bhooomickadg@gmail.com / 12345
- Team Lead: sarah.lead@company.com / lead123
- Team Member: john.doe@company.com / member123

After login, user identity is persisted locally for greeting/profile display.

## Available Frontend Routes

- /login
- /dashboard
- /users-accounts
- /threats
- /credentials
- /compliance
- /settings

## Backend Setup (Optional)

If you want live API data instead of mock fallback:

1) Create and activate virtual environment

	cd backend
	python3 -m venv .venv
	source .venv/bin/activate

2) Install requirements

	pip install -r requirements.txt

	Note:
	- The backend now uses `scikit-learn` for behavioral anomaly detection (`IsolationForest`).

3) Create backend env file

	Create backend/.env with:

	MONGO_URL=mongodb://localhost:27017
	DB_NAME=sentinel_dashboard
	JWT_SECRET=your-local-jwt-secret
	CORS_ORIGINS=http://localhost:3000
	EMAIL_FROM=alerts@sentinel-dashboard.com

	Notes:
	- MongoDB is required for live backend mode.
	- RESEND_API_KEY is optional. Without it, emails are mocked and stored in MongoDB.
	- The database does not need to be created manually; the app seeds data on startup.

4) Run API

	uvicorn server:app --reload --port 8000

5) Create frontend env file

	Create frontend/.env with:

	REACT_APP_BACKEND_URL=http://localhost:8000

## Key Frontend Behavior

- If backend calls fail, dashboard and auth use local fallback data so the UI stays interactive.
- Theme preference and notification preferences are persisted in localStorage.
- Access Hygiene "Overprivileged Accounts" click works in fallback mode and opens the permission flow modal.
- Dashboard includes live test surfaces for:
  - ML-driven behavioral baselining and anomaly simulation
  - JIT privileged access request/approval/revocation
  - Sales-safe operations settings
  - Maintenance-window permission changes
  - Offboarding updates
  - Credential rotation

## New Backend + UI Flows Added

- AI-Driven Behavioral Baselining
  - Uses a free local ML model: `IsolationForest` from `scikit-learn`
  - Learns normal behavior from stored activity events for each user/service account
  - Scores new events for anomalies based on time, location, resource access, and API-call volume
  - Can simulate anomalous activity directly from the dashboard
  - Converts strong anomalies into standard dashboard alerts
  - Current implementation is powered by Mongo-stored activity history and simulation data, not AWS telemetry yet

- JIT Privileged Access
  - Admins and team leads can create requests that become active immediately.
  - Team members submit pending requests for approval.
  - Active requests can be revoked and also expire automatically.

- Sales-Safe Operations
  - Admins can toggle safe mode and peak-season mode.
  - Maintenance windows can be configured from the dashboard.
  - Permission changes can be applied immediately or queued for a maintenance window.

- Access Hygiene
  - Permission change modal now supports `auto`, `immediate`, and `maintenance_window` apply modes.

- Existing Dashboard Workflows Wired to Backend
  - Offboarding detail actions persist to MongoDB.
  - Credential rotation actions persist to MongoDB.
  - Outgoing webhook hooks were added for key events.

## Recommended Manual Test Flow

1) Log in as admin

	Email: bhooomickadg@gmail.com
	Password: 12345

2) JIT Access panel

	- Create a request
	- Confirm it becomes `active` immediately
	- Revoke it and confirm status changes

3) Behavioral Baselining panel

	- Click `Recompute Baselines`
	- Click `Simulate Anomaly`
	- Confirm a new anomaly appears in the panel
	- Confirm a new behavioral alert is created in the alert flow

4) Sales-Safe Operations panel

	- Toggle `Safe Mode`
	- Toggle `Peak Season Active`
	- Save settings

5) Access Hygiene

	- Open the permission modal from an overprivileged account
	- Select `Maintenance Window`
	- Submit the permission change
	- Confirm the request succeeds and queues when outside a window

6) Offboarding / Credentials

	- Open detail modals
	- Trigger actions
	- Confirm the dashboard refreshes with updated values

## Troubleshooting

1) Dependency resolution errors during npm install

- This repo pins `date-fns` to a version compatible with `react-day-picker`.
- If you still hit a local npm cache issue, delete `node_modules` and rerun `npm install`.

2) Missing module error for ajv/dist/compile/codegen

- Run npm install ajv --legacy-peer-deps

3) Login says success but immediately logs out

- Ensure frontend is using the latest code where mock token/user persistence is enabled.
- Log out and log back in once.

4) Page/component appears blank

- Confirm you are on the correct dedicated route from sidebar.
- Hard refresh browser after route/page updates.

## Development Notes

- Main router/auth providers: frontend/src/App.js
- Dashboard: frontend/src/pages/Dashboard.jsx
- Dedicated pages:
  - frontend/src/pages/UsersAccountsPage.jsx
  - frontend/src/pages/ThreatsPage.jsx
  - frontend/src/pages/CredentialsPage.jsx
  - frontend/src/pages/CompliancePage.jsx
  - frontend/src/pages/SettingsPage.jsx
