# <p align="center">🏢 Kodishaa</p>
<p align="center">
  <strong>The Operating System for Modern Kenyan Real Estate.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Production--Ready-10B981?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/badge/Stack-React_|_Node_|_Prisma-1D4ED8?style=for-the-badge" alt="Stack" />
  <img src="https://img.shields.io/badge/Market-Kenya_🇰🇪-F59E0B?style=for-the-badge" alt="Market" />
</p>

---

## 🌟 Overview

**Kodishaa** is a high-performance, AI-augmented property management platform designed to eliminate the administrative friction of Kenyan real estate. By bridging the gap between physical operations and digital financial control, Kodishaa provides landlords, caretakers, and tenants with a seamless, omnichannel experience.

From **M-Pesa STK Push** rent collection to **USSD-based utility tracking** and **AI-driven trust scoring**, Kodishaa is built for scale, transparency, and operational excellence.

---

## 🚀 Key Features

### 🏦 Financial Command Center
- **Native M-Pesa Integration**: One-click STK push for rent and utilities with instant transaction matching.
- **Automated Billing**: Dynamic bill runs for water (meter-based) and electricity with automated receipt generation.
- **Arrears Management**: Intelligent tracking of partial payments and automated omnichannel reminders (SMS, WhatsApp).

### 🛠️ Field Operations (Caretaker Portal)
- **Maintenance Lifecycle**: Track issues from tenant report (Voice/Web) to caretaker closure and landlord verification.
- **Meter Reading Engine**: On-site utility recording with instant billing triggers.
- **Tenant Onboarding**: Streamlined KYC and unit assignment directly from the field.

### 📜 Trust & Credit Ecosystem
- **Intelligent Trust Score**: Behavioral risk signal analysis based on historical payment patterns.
- **Digital Credit Passport**: Verified rent history sharing for tenants, rewarding reliability.
- **Airtime Rewards**: Automated loyalty payouts for consistent on-time payments.

### 🎨 Premium User Experience
- **Glassmorphic UI**: A modern design system built with Mesh Gradients, noise textures, and backdrop blurs.
- **Omnichannel Access**: Seamless transition between Web, USSD, SMS, WhatsApp, and Voice IVR.
- **Scroll-Reveal Animations**: Cinematic, staggered entry animations for an engaging professional narrative.

---

## 🛠️ Technology Stack

| Layer | Technology |
|:---|:---|
| **Frontend** | React 18, Vite, Tailwind CSS (Glassmorphism), Lucide Icons |
| **Backend** | Node.js, Express, Prisma ORM |
| **Database** | PostgreSQL, Redis (Caching & Sessions) |
| **Integrations** | Africa's Talking (USSD/SMS/Voice), Safaricom Daraja (M-Pesa), Twilio (WhatsApp) |
| **Infrastructure** | Docker, Nginx Reverse Proxy, Winston/Morgan Logging |

---

## ⚡ Quick Start

### 1. Environment Setup
```bash
# Clone the repository
git clone https://github.com/Peter-Opapa/kodisha.git
cd kodisha

# Install dependencies
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configuration
Copy `.env.example` to `.env` in the `backend` directory and fill in your credentials:
- **Database**: `DATABASE_URL`
- **Africa's Talking**: `AT_API_KEY`, `AT_USERNAME`
- **M-Pesa**: `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`
- **Security**: `JWT_SECRET`, `JWT_REFRESH_SECRET`

### 3. Execution (Docker Compose)
The fastest way to get Kodishaa running in production-mode is via Docker:
```bash
docker compose up --build -d
```

For development:
```bash
# Terminal 1 (Backend)
cd backend && npm run dev

# Terminal 2 (Frontend)
cd frontend && npm run dev
```

---

## 📊 Trust Score Mechanics

| Event | Delta | Tier | Range |
|:---|:---|:---|:---|
| **On-time payment** | +20 | 🌟 Excellent | 750+ |
| **On-time streak (3mo)** | +50 | ✅ Good | 600-749 |
| **Late payment (1-5d)** | -30 | ⚠️ Fair | 400-599 |
| **Late payment (15d+)** | -100 | 🛑 Poor | <400 |

---

## 📂 Project Structure

```text
kodisha/
├── backend/          # Node.js API with Prisma ORM
│   ├── prisma/       # Database schemas and seeds
│   └── src/          # Business logic & integrations
├── frontend/         # React SPA with Modern Design System
│   ├── src/pages/    # Context-aware user dashboards
│   └── src/components/ # Shared premium UI components
├── nginx/            # Reverse proxy configuration
└── docker-compose.yml # Orchestration for Postgres, Redis, and API
```

---

## 🛡️ Security
- **JWT Rotation**: Access token expiration with automatic refresh token rotation.
- **Webhook Validation**: AT and M-Pesa callback validation against IP whitelists.
- **Audit Trails**: Detailed logging of all financial transactions and maintenance events.

---

<p align="center">
  Built with ❤️ for the Kenyan Real Estate Market.<br/>
  © 2026 Kodishaa Platform.
</p>
