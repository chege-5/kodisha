# Kodisha Software Overview

Kodisha is a full-stack rental management platform built around the Kenyan rental market. It combines a web dashboard, tenant and caretaker portals, M-Pesa payments, Africa's Talking USSD/SMS/voice flows, WhatsApp messaging, billing, water meter tracking, trust scoring, credit passports, iTax exports, lease generation, notifications, and admin oversight.

The product goal is to let landlords run rental operations from one system while still supporting tenants and caretakers on low-friction channels such as USSD, SMS, voice IVR, WhatsApp, and M-Pesa.

## Technology Stack

- Backend: Node.js, Express, Prisma ORM, PostgreSQL.
- Frontend: React, Vite, Tailwind CSS, React Query, React Router, Chart.js.
- Authentication: JWT access tokens plus refresh token rotation stored in the database.
- Integrations: Safaricom Daraja for M-Pesa, Africa's Talking for USSD/SMS/voice/airtime, Twilio for WhatsApp, Open Exchange Rates for diaspora currency conversion.
- Documents: PDFKit for lease, iTax, and credit passport PDFs; CSV stringification for tax exports.
- Infrastructure: Docker Compose with PostgreSQL, Redis, backend API, frontend nginx container, and top-level nginx reverse proxy.
- Background work: node-cron jobs for reminders, trust score sync, monthly digest, scheduled broadcasts, and overdue bill marking.

## Repository Structure

- `backend/`: Express API, Prisma schema, route handlers, services, middleware, cron jobs, seed script, Dockerfile.
- `frontend/`: React application, pages, reusable components, hooks, API client, Vite/Tailwind config, Dockerfile.
- `nginx/`: Reverse proxy configuration.
- `docker-compose.yml`: Production-style service orchestration for Postgres, Redis, API, frontend, and nginx.
- `README.md`: Setup instructions, demo scenarios, environment variables, and endpoint summary.

Generated frontend build files in `frontend/dist/` and backend logs in `backend/logs/` are build/runtime artifacts, not source logic.

## Core Domain Model

The Prisma schema defines the main system entities:

- `Landlord`: property owner account. Stores contact details, password hash, plan, admin flag, language, currency preference, and monthly airtime cap.
- `Caretaker`: sub-account owned by a landlord. Caretakers can access assigned operational workflows such as tenants, tickets, and meter readings.
- `Property`: belongs to a landlord and has address, county, type, water rate, and units.
- `Unit`: belongs to a property, has rent amount, status (`OCCUPIED`, `VACANT`, `MAINTENANCE`), floor, bedrooms, tenants, payments, tickets, meter readings, and bills.
- `Tenant`: optionally attached to a unit, with lease dates, deposit, login credentials, active flag, tickets, payments, trust score, credit passport, bills, leases, and notifications.
- `Payment`: records rent or utility payments through M-Pesa, cash, or bank, including period month/year, lateness, partial status, late fees, and optional bill linkage.
- `Bill`: tracks rent, water, electricity, garbage, service charge, or other bills with amount, paid amount, status, due date, period, and payments.
- `MeterReading`: stores previous/current water meter values, consumption, period, reader, and notes.
- `MaintenanceTicket`: issue raised by a tenant through portal, USSD, SMS/WhatsApp, or voice IVR.
- `TrustScore`: tenant score from 100 to 900.
- `CreditPassport`: aggregate tenant payment history used for shareable rental credit profile.
- `BroadcastMessage`: landlord broadcast history and scheduled messages.
- `iTaxReport`: generated rental income tax reports.
- `RentAdvance`: landlord advance request records.
- `Lease`: generated tenancy agreement metadata and PDF URL.
- `UssdSession`: persisted USSD session metadata for analytics.
- `RefreshToken`: refresh token records for token rotation.
- `Notification`: in-app/SMS notification records.
- `SystemLog`: admin/system audit style records.

## User Roles

Kodisha supports four roles:

- `LANDLORD`: manages properties, units, tenants, bills, payments, broadcasts, reports, settings, caretakers, and advances.
- `CARETAKER`: handles field operations under a landlord, including tenant upload, meter readings, unit overview, and maintenance tickets.
- `TENANT`: uses a mobile-first portal and communication channels to view balances, pay, check bills, view payments, report issues, and receive alerts.
- `ADMIN`: platform-wide view over users, revenue, properties, units, open tickets, logs, and admin status controls.

Login uses a "smart login" endpoint that checks landlord/admin by email or phone, caretaker by phone, and tenant by phone or email. The frontend redirects each role to its correct workspace.

## Backend API Architecture

`backend/src/server.js` creates the Express app, attaches middleware, mounts routes, serves uploads, starts cron jobs, and opens the API port.

Important middleware:

- `helmet` security headers.
- CORS restricted to `FRONTEND_URL` or `http://localhost:3000`.
- JSON and URL-encoded body parsing with 10 MB limits.
- `morgan` request logging into Winston.
- Global and strict rate limiters.
- JWT authentication for protected route groups.
- Role checks for role-specific access.
- Central error handler.

Public or webhook routes include:

- `/auth`
- `/ussd`
- `/sms`
- `/voice`
- `/mpesa`
- `/whatsapp`
- `/health`

Protected route groups include:

- `/landlords`
- `/caretakers`
- `/tenants`
- `/reports`
- `/leases`
- `/diaspora`
- `/broadcast`
- `/airtime`
- `/passport`
- `/bills`
- `/meter-readings`
- `/notifications`
- `/insights`
- `/admin`

## Authentication Workflow

Registration:

1. A landlord registers with name, Kenyan phone, email, and password.
2. Password is hashed with bcrypt.
3. Landlord record is created.
4. JWT access and refresh tokens are issued.
5. Refresh token is stored in `RefreshToken` with a 7-day expiry.

Smart login:

1. User submits identifier and password.
2. Backend checks landlord/admin first.
3. If not matched, it checks active caretaker by phone.
4. If not matched, it checks tenant by phone or email.
5. Matching account receives access and refresh tokens.
6. Frontend stores `accessToken`, `refreshToken`, user, and role in local storage.

Refresh:

1. Frontend retries on 401 by calling `/auth/refresh`.
2. Backend verifies the refresh JWT and database record.
3. Old refresh token is deleted.
4. New access and refresh tokens are issued and stored.

Logout deletes the refresh token if supplied and clears frontend session state.

## Frontend Application

`frontend/src/App.jsx` defines the main route tree:

- `/`: landing page for unauthenticated users, otherwise redirects by role.
- `/login`: smart login screen.
- `/dashboard`: landlord/admin layout and nested pages.
- `/caretaker`: caretaker layout and nested pages.
- `/tenant`: tenant mobile portal.

The app uses:

- `AuthProvider` from `useAuth.js` for session state.
- `apiClient.js` for axios requests, JWT attachment, and automatic token refresh.
- React Query for data fetching and cache invalidation.
- `Layout.jsx` for sidebar navigation, top bar, theme toggle, logout, and notification count.
- `AIAssistant` for landlord/admin query interaction.

Landlord/admin pages:

- Dashboard: portfolio overview, revenue trend, occupancy, arrears, open tickets, and at-risk tenants.
- Properties: add properties and units, expand unit grids, view occupancy and expected rent.
- Tenants: search/list tenants, add tenants to vacant units, view trust scores.
- Tenant detail: tenant profile, manual payments, STK push, lease generation, credit passport, and maintenance history.
- Billing: list bills by type/status and display payment progress.
- Payments: aggregate tenant payments into a ledger and export CSV client-side.
- Maintenance: list open/in-progress/closed ticket queues.
- Broadcast: send or schedule SMS/WhatsApp broadcasts and view history.
- Reports: iTax export, trust leaderboard, API usage, airtime reward totals.
- Settings: update landlord profile, language, currency preference, monthly airtime cap, and caretaker sub-accounts.
- Notifications: view and mark notifications.
- Admin panel: platform stats, users, logs.

Caretaker pages:

- Overview: assigned units, occupancy, arrears indicators, open ticket count.
- Tenants: add tenants into vacant units.
- Meters: record meter readings and auto-generate water bills.
- Tickets: view open tickets.
- Maintenance: ticket queue.
- Notifications: notification list.

Tenant portal:

- Balance tab: outstanding rent for the current month and M-Pesa payment button.
- Bills tab: rent/water/utility bills and statuses.
- Payments tab: payment history with late/on-time status.
- Issues tab: existing tickets and issue submission form.
- Alerts tab: recent notifications.

## Property and Tenant Workflow

1. Landlord creates a property using `/landlords/properties`.
2. Landlord adds units under a property using `/landlords/properties/:propertyId/units`.
3. Units start as `VACANT`.
4. Landlord or caretaker adds a tenant using `/tenants`.
5. Backend verifies the unit belongs to the landlord scope and is not occupied.
6. Tenant is created with a provided password or default `KODI` plus the last 4 phone digits.
7. A trust score and credit passport are initialized.
8. Unit is marked `OCCUPIED`.
9. A welcome SMS is sent with login details.

Tenant deletion is a soft deactivation:

- `isActive` becomes false.
- Tenant is detached from the unit.
- Unit is marked `VACANT`.

## Rent, Payment, and Arrears Logic

Rent is represented in two related ways:

- Direct `Payment` records, used for collection history and trust score.
- `Bill` records, used for explicit rent/water/utility bill tracking.

Dashboard arrears logic compares current-month payments against unit rent:

1. Fetch active tenants for the landlord.
2. Sum payments for the current month/year.
3. Arrears = max(0, unit rent - paid).
4. Days overdue is approximated from the day of month after the 1st.

Manual payment workflow:

1. Landlord/caretaker logs amount, channel, notes, and optional payment date.
2. Backend calculates period month/year from payment date.
3. Rent due date is treated as the 1st of that month.
4. `daysLate` is computed from payment date minus the 1st.
5. `isPartial` is true if amount is less than unit rent.
6. Payment is saved.
7. Trust score and credit passport are recalculated.

M-Pesa workflow:

1. Landlord/caretaker or tenant initiates STK push.
2. Backend sends STK push through Daraja using tenant phone, amount, account reference, and description.
3. Safaricom callback reaches `/mpesa/callback`.
4. Backend acknowledges immediately.
5. Successful callback metadata is parsed for amount, receipt number, phone, and transaction date.
6. Duplicate receipt numbers are ignored.
7. Tenant is matched by phone variations.
8. Payment is recorded as `MPESA`.
9. Trust score is recalculated.
10. SMS receipt is sent.
11. Airtime reward eligibility is checked.

B2C disbursement routes also exist for landlord/admin initiated transfers and result/timeout callbacks.

## Billing Workflow

Bills can be created manually or generated automatically.

Manual bills:

1. Landlord/caretaker posts tenant, unit, type, amount, due date, description, and period.
2. Bill is created with `PENDING` status.

Monthly rent bills:

1. Landlord/admin calls `/bills/generate-rent`.
2. Service finds active tenants under the landlord.
3. Existing rent bills for the same tenant/month/year are skipped.
4. New rent bill uses unit rent, due date on the 5th, and current period.
5. Tenant is notified through the notification service.

Payment-to-bill linking:

1. A payment is assigned to a bill.
2. Total paid amount for that bill is recalculated.
3. Bill status becomes `PAID`, `PARTIALLY_PAID`, or `PENDING`.

Overdue marking:

- A daily 6 AM cron marks `PENDING` and `PARTIALLY_PAID` bills as `OVERDUE` if their due date has passed.

## Water Meter Workflow

Water billing is driven by meter readings:

1. Caretaker or landlord submits `unitId`, `currentReading`, optional period, and notes to `/meter-readings`.
2. Backend finds the latest previous reading for the unit.
3. Consumption = max(0, current reading - previous reading).
4. A `MeterReading` record is created.
5. Water bill amount = consumption times property `waterRatePerUnit` or default KSh 50.
6. Active tenant for the unit is found.
7. Water bill is created with a due date 14 days ahead.
8. Tenant receives bill notification.
9. Tenant also gets an in-app meter reading notification.

## Maintenance Workflow

Maintenance tickets can be created through several channels:

- Tenant portal issue form.
- Tenant USSD issue menu.
- WhatsApp `ISSUE [description]`.
- Voice IVR maintenance line.

Ticket creation:

1. Tenant is identified.
2. Unit is resolved.
3. Ticket is created with category, description, and `OPEN` status.
4. First active caretaker under the landlord is selected where available.
5. Tenant, landlord, and/or caretaker are notified depending on route/service.

Ticket closure:

- Caretaker can close through portal.
- Caretaker can reply by SMS with `DONE [ticketId]`.
- Caretaker can close via USSD.

When closed:

1. Ticket status becomes `CLOSED`.
2. `closedAt` is set.
3. Tenant is notified.
4. Tenant can rate via SMS using `RATE [ticketId] [1-5]`.

Voice IVR flow:

1. Caller number is matched to tenant.
2. System prompts for category: plumbing, electrical, security, or other.
3. Ticket is created and caretaker notified.
4. Caller is invited to record a short description.
5. Recording URL is saved on the ticket.

## USSD Workflows

USSD sessions are stored in Redis with a 120-second TTL and also persisted to `UssdSession` for analytics.

Tenant USSD menu:

- Pay Rent: choose full or partial amount, then backend triggers M-Pesa STK push.
- My Balance: calculate current-month arrears.
- Report Issue: choose category and create maintenance ticket.
- My Receipt: send last payment receipt by SMS.
- Language: toggle English/Swahili.
- Exit.

Landlord USSD menu:

- View arrears.
- View vacant units.
- Send broadcast message.
- Get add-tenant dashboard link.
- Get dashboard link.
- Exit.

Caretaker USSD menu:

- Log cash payment.
- View open tickets.
- Close ticket.
- Check unit status.
- Exit.

Inputs are sanitized by stripping high-risk characters and limiting length.

## SMS Workflows

Inbound SMS supports command-like operations:

- `DONE [TicketID]`: closes a maintenance ticket and notifies the tenant.
- `PAID [TenantPhone] [Amount]`: logs a cash payment, recalculates trust score, sends confirmation to caretaker/landlord and tenant.
- `VACANT [UnitNumber]`: caretaker marks a unit vacant.
- `RATE [TicketID] [1-5]`: tenant rates a closed ticket.
- `BALANCE`: tenant receives current-month balance.

Africa's Talking webhook validation is applied through `validateATRequest`.

## WhatsApp Workflows

Twilio WhatsApp webhook supports tenants and landlords.

Tenant commands:

- `BALANCE`: sends rent balance and prompts `PAY` if money is due.
- `PAY`: triggers M-Pesa STK push for rent.
- `RECEIPT`: sends last payment receipt.
- `ISSUE [description]`: creates a maintenance ticket and notifies caretaker by SMS.
- Any other message returns help.

Landlord commands:

- `ARREARS`: lists up to 10 overdue tenants for the current month.
- `VACANT`: lists vacant units.
- Any other message returns landlord help and dashboard link.

Unknown numbers receive onboarding/help text.

## Trust Score and Credit Passport Logic

Trust score starts at 500 and is clamped between 100 and 900.

Payment scoring:

- On-time payment: +20.
- 1-5 days late: -30.
- 6-14 days late: -60.
- 15+ days late: -100.
- 3, 6, and 12 consecutive on-time full payments each add +50.

Tiers:

- 750+: Excellent.
- 600-749: Good.
- 400-599: Fair.
- Below 400: Poor.

Recalculation also updates the credit passport:

- Total months.
- On-time months.
- Late months.
- Partial months.
- Missed months, currently set to 0 with future lease-period logic implied.
- Average days late.

Credit passport endpoints:

- `GET /passport/:tenantId`: returns tenant identity, score, tier, summary, and a 12-month payment calendar.
- `POST /passport/:tenantId/share`: generates a shareable PDF under `/uploads/passports`.

## Airtime Rewards

After an M-Pesa payment callback, Kodisha checks recent payments for consecutive full on-time streaks.

Reward rules:

- 3 consecutive: default KSh 30.
- 6 consecutive: default KSh 75.
- 12 consecutive: default KSh 150.

Before sending:

1. Landlord monthly airtime cap is loaded from landlord settings or default.
2. Already-sent rewards for that landlord in the current month are summed.
3. Reward is skipped if cap would be exceeded.
4. Africa's Talking airtime API is called.
5. Reward record is saved.
6. Tenant receives reward SMS.

## Reports and Documents

iTax export:

1. Landlord/admin requests `/reports/itax/:landlordId?year=YYYY&quarter=Q1|Q2|Q3|Q4|ANNUAL`.
2. Backend fetches payments for that landlord and period.
3. CSV rows include month, unit, property, tenant, rent, late fee, total, channel, and payment date.
4. PDF table is generated.
5. `iTaxReport` record is created with CSV/PDF URLs.

Lease generation:

1. Landlord requests `/leases/generate` with tenant and unit.
2. Backend fetches tenant, unit/property, and landlord.
3. PDF tenancy agreement is generated with property details, rent, deposit, standard clauses, Swahili summary, and signature lines.
4. `Lease` record is saved with PDF URL.

Credit passport PDF:

- Generated from tenant, trust score, and credit passport data.

Payment ledger export:

- Frontend currently assembles payments by fetching tenants and each tenant's payments, then generates CSV in the browser.

## Broadcast Messaging

Landlords/admins can send or schedule broadcasts:

1. User chooses optional property, message, channel (`SMS`, `WHATSAPP`, `BOTH`), and optional future time.
2. Backend finds active tenants under landlord/property scope.
3. Broadcast record is created.
4. If scheduled for future, status remains `PENDING`.
5. If immediate, SMS and/or WhatsApp sends are triggered and status is `SENT`.

A cron job runs every 5 minutes and processes due scheduled broadcasts. Failed scheduled sends are marked `FAILED`.

## Notifications

The notification service centralizes in-app and SMS notifications.

Supported notification activities include:

- Payment received.
- Bill generated.
- Issue update.
- Meter reading.
- Rent due.
- Landlord notifications.

Notifications can be:

- In-app only.
- SMS only.
- Both in-app and SMS.

Frontend shows unread counts in the layout and has notification pages/tabs for users.

## AI and Insights

The app calls these "AI" features, but the current backend implementation is rule-based rather than using an external ML or LLM service.

Insight endpoints include:

- Overdue prediction.
- Revenue summary.
- Occupancy stats.
- Natural language query parser.

Overdue prediction considers:

- Low trust score.
- Late payments in recent months.
- Partial payments.
- No payment this month after the 5th.
- Average days late.

Natural language query supports intents such as:

- Unpaid tenants.
- Total collected this month.
- Vacant units.
- Occupied units.
- Open tickets.
- Tenant count.
- Property count.
- Water bills/readings.
- Risky tenants.
- Occupancy rate.
- Collection rate.
- Best tenants.

Unknown queries return suggestions.

## Diaspora Mode

Diaspora features support landlords who want foreign-currency views:

- Fetches exchange rates from Open Exchange Rates with a one-hour in-memory cache.
- Converts collected rent and arrears from KES to USD, GBP, EUR, or KES.
- Falls back to approximate exchange rates if the external API fails.
- Settlement endpoint logs a settlement-style request and returns estimated KES equivalent.
- Property report endpoint summarizes property, units, tenants, and open issues.

Frontend settings include currency preference, though the main dashboard currently uses standard KES formatting in many places.

## Admin Workflow

Admin users are landlords with `isAdmin = true`, mapped to role `ADMIN` at login.

Admin routes provide:

- Platform stats: users, properties, units, total revenue, open tickets.
- User listing across landlords, caretakers, and tenants.
- Toggle landlord admin status.
- Read system logs.
- Create system log entries.

Admin frontend page shows platform metrics, recent users, and recent logs.

## Background Jobs

The backend schedules jobs at startup:

- Rent reminders: 1st of every month at 8:00 AM Africa/Nairobi.
- Late warnings: 6th of every month at 9:00 AM Africa/Nairobi.
- Scheduled broadcast processing: every 5 minutes.
- Trust score sync: daily at midnight.
- Monthly digest: weekly Sunday at 7:00 AM.
- Overdue bill marking: daily at 6:00 AM.

README also mentions pre-generating iTax reports, but the currently mounted server job list only explicitly schedules the above items in source.

## Infrastructure and Deployment

`docker-compose.yml` defines:

- `postgres`: PostgreSQL 16 Alpine with persistent volume and health check.
- `redis`: Redis 7 Alpine with append-only persistence and LRU memory policy.
- `api`: backend container using `backend/.env`, database/Redis service URLs, upload/log volumes, health check on `/health`.
- `frontend`: built React app served by nginx on port 3000.
- `nginx`: reverse proxy on ports 80 and 443 with mounted config/certs.

`backend/src/server.js` serves generated files from `/uploads`, so generated PDFs/CSVs are accessed through API static file serving.

## Security and Operational Notes

Implemented:

- Password hashing with bcrypt.
- JWT access tokens and refresh token rotation.
- Role-based route checks.
- Rate limiting globally and stricter auth limiting.
- Helmet headers.
- CORS with configured frontend origin.
- Prisma parameterized database access.
- USSD input sanitization.
- Africa's Talking webhook validation middleware.

Current caveats visible in source:

- Some route files instantiate new `PrismaClient` directly while others use shared `utils/prismaClient`.
- `idNumber` is stored directly in the database schema despite comments indicating app-level encryption should be used.
- Payment-to-bill linking is explicit; M-Pesa callback creates payments but does not automatically link them to matching bills.
- Trust passport `missedMonths` is currently always 0.
- Frontend payment ledger gathers payments by looping over tenants and calling each tenant's payment endpoint, which may become slow at scale.
- Several displayed strings in source show mojibake/encoding artifacts, likely from file encoding issues.
- AI features are presently deterministic rules, not external AI model calls.

## End-to-End Example Workflows

### Landlord Onboarding

1. Register or log in.
2. Create property.
3. Add units.
4. Add caretaker sub-account if needed.
5. Add tenants to vacant units.
6. System sends tenant welcome SMS.
7. Dashboard starts showing occupancy, arrears, rent collection, and tickets.

### Tenant Rent Payment

1. Tenant logs into portal or uses USSD/WhatsApp.
2. Tenant checks balance.
3. Tenant initiates M-Pesa STK push.
4. M-Pesa callback records payment.
5. Trust score and credit passport update.
6. Tenant receives SMS receipt.
7. Airtime reward may be issued if streak rules are met.

### Caretaker Water Reading

1. Caretaker logs into portal.
2. Selects occupied unit and enters current meter reading.
3. Backend computes consumption from prior reading.
4. Water bill is generated.
5. Tenant receives bill notification.

### Maintenance Issue

1. Tenant reports issue through portal, USSD, WhatsApp, or voice.
2. Ticket is created.
3. Caretaker/landlord is notified.
4. Caretaker resolves and closes ticket through portal, USSD, or SMS.
5. Tenant is asked to rate service.
6. Rating is stored on ticket.

### Tax Report

1. Landlord opens reports.
2. Selects year and quarter.
3. Backend gathers matching payments.
4. CSV and PDF are generated.
5. Report metadata is saved.
6. User downloads files from generated URLs.

## Current Product Shape

Kodisha is best understood as a rental operations OS for Kenyan landlords. The center is the landlord dashboard, but the software deliberately extends beyond the browser into the channels tenants and caretakers already use: M-Pesa, USSD, SMS, WhatsApp, and voice calls. Its current logic is strongest around rent collection, arrears visibility, maintenance routing, utility billing, tenant scoring, and document/report generation.

The application aims to achieve this by combining:

- A relational property-management data model.
- Role-aware web portals.
- Channel-specific webhook handlers.
- Payment and billing services.
- Scheduled reminders and status updates.
- Rule-based insights and scoring.
- Generated compliance and trust documents.

