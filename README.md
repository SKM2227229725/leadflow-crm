# LeadFlow CRM (VyorAI SDE Internship Evaluation)

A small CRM MVP: capture leads → update stage → schedule a follow-up → complete it, with a live dashboard.
Implemented with **Python/Django + DRF** (agreed with VyorAI instead of MERN) and **React + Vite**.

## Stack
| Layer | Tech |
|---|---|
| Backend | Python 3.12, Django 5.2 LTS, Django REST Framework 3.18, SimpleJWT 5.5, django-cors-headers, django-environ |
| DB | SQLite (local) / PostgreSQL via `DATABASE_URL` (production) |
| Frontend | React 19, Vite 8, React Router 7, Axios, plain responsive CSS |

## Folder structure
```
backend/  config/ (settings, envelope renderer, exception handler)  accounts/  leads/  activities/  dashboard/
frontend/ src/{api,components,context,layouts,pages,routes,hooks,utils}
```
Each Django app separates models, serializers, views, permissions/services, urls and tests.

## Prerequisites
Python 3.12+, Node 20+ (tested with 22), npm.

## Local setup
```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # then set DJANGO_SECRET_KEY to a long random value
python manage.py migrate
python manage.py runserver    # http://localhost:8000/api/v1/health

# Frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev                   # http://localhost:5173
```

## Environment variables
Backend (`backend/.env`): `DJANGO_DEBUG`, `DJANGO_SECRET_KEY` (required), `DJANGO_ALLOWED_HOSTS`, `DATABASE_URL`, `CORS_ALLOWED_ORIGINS`, `JWT_ACCESS_MINUTES`, `JWT_REFRESH_DAYS`.
Frontend (`frontend/.env`): `VITE_API_BASE_URL` only (public, no secrets).
PostgreSQL example: `DATABASE_URL=postgres://user:password@host:5432/leadflow`.

## Commands
```bash
python manage.py test          # backend tests (42)
npm run build && npm run lint  # frontend build + oxlint
```

## Design decisions
- **User model**: custom `AbstractBaseUser` with `name`, unique lower-cased `email` (USERNAME_FIELD), `role` (default `admin`). Passwords hashed by Django (PBKDF2).
- **Auth**: SimpleJWT. Access token 15 min, rotating refresh token 7 days. Axios interceptor refreshes once on 401. Logout is client-side (tokens cleared).
- **Ownership**: querysets are always filtered by `request.user` *and* an `IsOwner` object permission is applied. Another user's record returns **404** (does not reveal existence).
- **Field protection**: serializers reject any non-writable key (`createdBy`, `id`, `createdAt`, `completedAt`, ...) with 400 instead of ignoring it.
- **Time**: `USE_TZ=True`, `TIME_ZONE=UTC`; naive datetimes are interpreted as UTC; the UI sends UTC ISO strings and displays local time.
- **Overdue** = `status=Pending AND dueAt < now()` (server time); Completed is never overdue.
- **Lead delete** cascades to its activities (FK `on_delete=CASCADE`).
- **Options**: serviceInterest ∈ Web Development, Digital Marketing, SEO, Social Media, Branding, Other; source ∈ Website, Referral, Social Media, Email, Direct Outreach, Other.

## API (base `/api/v1`, JSON, `Authorization: Bearer <access>`)
Success `{"success":true,"message":"Success","data":{}}` · Error `{"success":false,"message":"Request failed","errors":[{"field","message"}]}`

| Method | Endpoint | Notes |
|---|---|---|
| GET | `/health` | public |
| POST | `/auth/register` | `{name,email,password(>=8)}` → 201 `{user,tokens}`; duplicate → 409 |
| POST | `/auth/login` | `{email,password}` → `{user,tokens:{access,refresh}}`; bad creds → 400 |
| POST | `/auth/refresh` | `{refresh}` → new access (+ rotated refresh); invalid → 401 |
| GET | `/auth/me` | safe profile |
| GET/POST | `/leads` | `?search=` (name/company), `?stage=` (validated) |
| GET/PATCH/DELETE | `/leads/<id>` | non-numeric id → 400, other user's/unknown → 404, delete → 204 |
| GET/POST | `/activities` | `?status=Pending\|Completed`, `?leadId=`, `?overdue=true` |
| PATCH | `/activities/<id>` | `title,dueAt,type,status`; `leadId` cannot change |
| GET | `/dashboard/summary` | `totalLeads, activeLeads, wonLeads, pendingFollowUps, overdueFollowUps` |

Lead body: `name*, company, email, phone, serviceInterest, source, budget(>=0), stage` (at least one of email/phone required).
Activity body: `leadId*, title*, dueAt*, type(Call|Email|Meeting|Task), status(Pending|Completed)`.
Status codes used: 200, 201, 204, 400, 401, 403, 404, 405, 409, 500.

## Test checklist (actual results from this build)
Environment: Python 3.12.3, Django 5.2.18, Node 22.22.2, SQLite.

| Area | Test | Expected | Actual | Result |
|---|---|---|---|---|
| Backend suite | `python manage.py test` | all pass | Ran 42 tests, OK | PASS |
| Auth | register, duplicate email (409), email normalization, hashing (pbkdf2), valid/invalid login, no user enumeration, missing/invalid/tampered/expired token, safe profile, refresh | as stated | automated tests | PASS |
| Leads | CRUD, search, stage filter, missing name, missing email+phone, invalid email, negative budget, invalid stage, malformed IDs, protected fields, cross-user access, PUT blocked | as stated | automated tests | PASS |
| Follow-ups | create, invalid lead (nonexistent/other user's/malformed), invalid fields, client cannot set owner/completedAt, server completion timestamp, overdue rules, UTC-aware storage, cascade delete | as stated | automated tests | PASS |
| Dashboard | counts vs fixtures, no hardcoding, user isolation, auth required | as stated | automated tests | PASS |
| Live API smoke | register→login→lead→stage→follow-up→complete→dashboard→delete over real HTTP, CORS allowed/blocked origin, stage persists on re-fetch | all checks | 24/24 checks passed | PASS |
| Logs | no passwords/tokens in server log during smoke run | none | 0 matches | PASS |
| Frontend build | `npm run build` | succeeds | built, 102 modules | PASS |
| Frontend lint | `npm run lint` (oxlint) | no errors | 0 errors, 1 warning (`set-state-in-effect` in `useApi` fetch hook; accepted) | PASS (warning) |
| Browser UI | loading/empty/error states, buttons, mobile layout, logout, **refresh persistence in a real browser** | works | **NOT EXECUTED** (no browser in build environment); persistence verified at API level only | UNTESTED |
| PostgreSQL | run with `DATABASE_URL=postgres://...` | works | **NOT EXECUTED** (no Postgres server); driver installed | UNTESTED |
| Deployment | hosted URL | n/a | **NOT ATTEMPTED** | NOT DONE |

## Demo script (3–5 min)
1. Register `demo@example.com`; you land on the dashboard (all zeros).
2. Leads → **New lead** (name, email, budget) → opens its detail page.
3. Edit the lead (change company). Try saving without name/contact to show validation errors.
4. On the detail page change **Pipeline stage** to *Qualified* → "Stage saved". Press F5: stage remains.
5. Add a follow-up with a past due time → **Overdue** badge. Add another in the future.
6. Dashboard: pending 2, overdue 1. Follow-ups page → **Mark complete** → overdue drops to 0.
7. Leads list: search by company, filter by stage, delete with confirmation. Logout; `/leads` redirects to login.

## Troubleshooting
- `ImproperlyConfigured ... DJANGO_SECRET_KEY` → create `backend/.env` from the example.
- Browser CORS error → `CORS_ALLOWED_ORIGINS` must exactly match the frontend origin (scheme+host+port).
- "Cannot reach the server" in the UI → backend not running or wrong `VITE_API_BASE_URL`.

## Known limitations
- Tokens in `localStorage` (XSS trade-off); logout does not blacklist the refresh token server-side.
- No pagination, rate limiting, password reset or email verification.
- Cross-user access returns 404 rather than 403 by design.
- Browser E2E, PostgreSQL run and deployment were not executed (see checklist).
- No automated frontend component tests.
- Phone validation is a lenient pattern, not country-specific.

## Definition of Done
- [x] Registration, login, logout (client) — backend tested; UI not browser-tested
- [x] Passwords hashed (PBKDF2)
- [x] Protected endpoints enforce JWT
- [x] Cross-user isolation
- [x] Lead CRUD, search, filter
- [x] Stage updates persist (API-verified)
- [x] Follow-ups create/complete
- [x] Dashboard from DB
- [x] Validation + error envelope
- [ ] Data survives browser refresh — verified at API level only; real-browser check pending
- [x] README / env examples / checklist / demo script
- [x] Limitations disclosed
