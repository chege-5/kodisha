# Kodisha — Rental Management Platform

> Production-ready AI-powered rental management system built for the Kenyan market.  
> USSD · M-Pesa · WhatsApp · Voice IVR · Credit Passport · iTax Export

---

## Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express |
| Database | PostgreSQL via Prisma ORM |
| Frontend | React + Vite + Tailwind CSS |
| Cache / Sessions | Redis |
| Payments | Safaricom Daraja (M-Pesa STK Push, C2B, B2C) |
| USSD / SMS / Voice | Africa's Talking |
| WhatsApp | Twilio |
| Auth | JWT with refresh token rotation |
| Containerisation | Docker Compose |
| Reverse Proxy | Nginx |
| Logging | Winston + Morgan |

---

## Quick Start (Development)

### 1. Prerequisites

- Node.js 20+
- Docker Desktop (or PostgreSQL + Redis locally)
- Africa's Talking sandbox account
- Safaricom Daraja sandbox credentials

### 2. Clone & Install

```bash
git clone <repo-url> kodisha
cd kodisha

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 3. Configure Environment

```bash
cd backend
cp .env.example .env
# Edit .env with your credentials (see variables reference below)
```

### 4. Start Services (Docker)

```bash
# From project root
docker compose up postgres redis -d
```

### 5. Run Migrations & Seed

```bash
cd backend
npx prisma migrate dev --name init
npm run seed
```

### 6. Start the Dev Servers

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

- Frontend: http://localhost:3000
- API: http://localhost:5000
- Health check: http://localhost:5000/health

---

## Production Deploy (Docker Compose)

```bash
# 1. Fill in backend/.env with production values
# 2. Build and start
docker compose up --build -d

# 3. Migrations run automatically on API startup
# 4. Seed demo data (one-time)
docker compose exec api npm run seed
```

---

## Environment Variables Reference

### App
| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `PORT` | API port | `5000` |
| `FRONTEND_URL` | Frontend origin (CORS) | `https://app.kodisha.ke` |

### Database
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |

### JWT
| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Access token secret (min 64 chars) |
| `JWT_REFRESH_SECRET` | Refresh token secret |
| `JWT_EXPIRES_IN` | Access token TTL (`15m`) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL (`7d`) |

### Africa's Talking
| Variable | Description |
|----------|-------------|
| `AT_API_KEY` | AT API key |
| `AT_USERNAME` | `sandbox` for testing, your username in prod |
| `AT_USSD_CODE` | Your USSD shortcode e.g. `*384*100#` |
| `AT_SENDER_ID` | SMS sender ID e.g. `KODISHA` |
| `AT_WHITELISTED_IPS` | Comma-separated AT IPs for webhook validation |

### Safaricom M-Pesa Daraja
| Variable | Description |
|----------|-------------|
| `MPESA_ENV` | `sandbox` or `production` |
| `MPESA_CONSUMER_KEY` | Daraja app consumer key |
| `MPESA_CONSUMER_SECRET` | Daraja app consumer secret |
| `MPESA_SHORTCODE` | Business shortcode |
| `MPESA_PASSKEY` | STK push passkey |
| `MPESA_CALLBACK_URL` | Public URL for M-Pesa callbacks |

### Twilio (WhatsApp)
| Variable | Description |
|----------|-------------|
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_WHATSAPP_FROM` | `whatsapp:+14155238886` |

---

## Africa's Talking Sandbox Setup

1. Register at [africastalking.com](https://africastalking.com)
2. Create a sandbox app
3. Note your **API Key** and **Username** (`sandbox`)
4. In AT dashboard → USSD → Create service → note the shortcode
5. Set callback URL: `https://<your-ngrok-or-domain>/ussd`
6. For SMS: set callback to `https://<domain>/sms`
7. For Voice: set callback to `https://<domain>/voice`

**Testing USSD locally:**
```bash
# Use ngrok to expose your local server
ngrok http 5000

# Then set AT_USSD callbacks to your ngrok URL
# Use AT simulator at: https://simulator.africastalking.com
```

---

## Safaricom Daraja Sandbox Setup

1. Register at [developer.safaricom.co.ke](https://developer.safaricom.co.ke)
2. Create an app → get Consumer Key & Secret
3. For STK Push use shortcode `174379` and the test passkey from docs
4. Set `MPESA_CALLBACK_URL` to your public URL (ngrok works)
5. Test M-Pesa STK push with sandbox phone: `254708374149`

---

## Demo Scenarios

### Scenario 1 — Amina pays rent
- Login: Amina Hassan · phone `+254712000010` · password `tenant123`
- Amina has 3 consecutive on-time payments already seeded
- She has earned KSh 30 airtime reward
- Trust Score: 640 (Good tier)

**USSD flow:** Dial `*384*100#` → select tenant flow → Pay Rent → Full Amount → M-Pesa STK Push fires

### Scenario 2 — Pipe bursts (John)
- Login: John Mwangi · phone `+254712000011` · password `tenant123`
- Pre-seeded closed plumbing ticket with voice recording URL
- Caretaker rated 4/5 stars
- Dashboard shows ticket history in Maintenance tab

**IVR flow:** Call the AT Voice number → Press 1 (Plumbing) → Record description → Caretaker SMSed

### Scenario 3 — iTax Q1 2025
- Login: Landlord John Kamau · `john.kamau@gmail.com` · `password123`
- Go to Reports → iTax Export → Select Q1 2025 → Generate
- Downloads CSV + PDF formatted for KRA rental income return

### Scenario 4 — Diaspora mode
- Landlord login → Settings → change currency to USD/GBP/EUR
- Dashboard amounts display in selected currency with live FX rates
- GET `/diaspora/dashboard/:landlordId?currency=GBP` returns converted amounts

---

## API Endpoints Summary

```
POST   /auth/register              Register landlord
POST   /auth/smart-login           Smart login with auto role detection
POST   /auth/refresh               Refresh JWT tokens

POST   /ussd                       AT USSD callback
POST   /sms                        AT inbound SMS
POST   /voice                      AT Voice IVR
POST   /whatsapp/webhook           Twilio WhatsApp webhook

POST   /mpesa/stkpush              Trigger STK push
POST   /mpesa/callback             Daraja C2B callback
GET    /mpesa/status/:id           Query transaction status

GET    /landlords/dashboard        Landlord overview
GET    /landlords/properties       List properties
POST   /landlords/properties       Add property
POST   /landlords/caretakers       Add caretaker
POST   /landlords/advance/request  Request rent advance
GET    /landlords/me               Landlord profile

GET    /tenants                    List tenants
POST   /tenants                    Add tenant
GET    /tenants/:id                Tenant detail
GET    /tenants/:id/trustscore     Trust score
POST   /tenants/:id/payments       Log manual payment

GET    /passport/:tenantId         Credit passport
POST   /passport/:tenantId/share   Generate PDF

GET    /reports/itax/:landlordId   Generate iTax report
GET    /reports/trust-leaderboard  Top 10 tenant scores
GET    /reports/api-usage          AT usage this month

POST   /broadcast                  Send/schedule broadcast
POST   /leases/generate            Generate lease PDF
GET    /diaspora/dashboard/:id     FX-converted dashboard
POST   /diaspora/settle/:id        Request overseas settlement

GET    /health                     Health check
```

---

## Cron Jobs

| Schedule | Job |
|----------|-----|
| 1st of month, 8am | Rent reminders SMS to all tenants |
| 6th of month, 9am | Late payment warnings + optional late fee |
| Daily midnight | Trust score recalculation |
| Every 5 minutes | Process scheduled broadcasts |
| Weekly Sunday 7am | Email digest to all landlords |
| 2nd of month 6am | Pre-generate iTax reports |

---

## Trust Score Rules

| Event | Delta |
|-------|-------|
| On-time payment | +20 |
| 3 / 6 / 12 consecutive on-time | +50 bonus each |
| 1–5 days late | −30 |
| 6–14 days late | −60 |
| 15+ days late | −100 |
| Range | 100 – 900 |

**Tiers:** Excellent (750+) · Good (600–749) · Fair (400–599) · Poor (<400)

---

## Airtime Rewards

| Streak | Reward |
|--------|--------|
| 3 consecutive on-time | KSh 30 |
| 6 consecutive on-time | KSh 75 |
| 12 consecutive on-time | KSh 150 |

Configurable monthly cap per landlord (default KSh 5,000).

---

## Security Notes

- All AT webhooks validated against IP whitelist in production
- JWT access tokens expire in 15 minutes; refresh tokens rotated on use
- `idNumber` stored as plain text — encrypt at rest in production using `ENCRYPTION_KEY`
- Rate limiting: 200 req/15min globally, 20 req/15min on auth endpoints
- Helmet.js security headers enabled
- SQL injection prevented via Prisma parameterised queries
- Input sanitisation on all USSD inputs (strips `'";<>\`)

---

## Folder Structure

```
kodisha/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── src/
│   │   ├── routes/          # Express route modules
│   │   ├── services/        # Business logic services
│   │   ├── middleware/       # Auth, rate limit, AT validate
│   │   ├── jobs/            # Cron jobs
│   │   └── utils/           # Logger
│   ├── server.js
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/           # Route-level page components
│   │   ├── components/      # Reusable UI components
│   │   ├── hooks/           # React Query hooks
│   │   └── utils/           # API client, formatters
│   ├── Dockerfile
│   └── vite.config.js
├── nginx/
│   └── nginx.conf
├── docker-compose.yml
└── README.md
```
