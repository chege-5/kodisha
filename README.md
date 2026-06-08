# Kodisha

Kodisha is a modern, high-performance property management platform tailored for Kenyan real estate. It features automated billing, M-Pesa STK push collections, utility tracking, and an AI-assisted trust-scoring ecosystem.

---

##  Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS (Glassmorphism), Lucide Icons
- **Backend**: Node.js, Express, Prisma ORM
- **Database**: PostgreSQL, Redis (Sessions & Caching)

---

##  Getting Started

You can run the project locally either using **Docker Compose** or directly in your **Local Dev Environment**.

### Option 1: Running with Docker Compose (Recommended)
This starts all services (PostgreSQL, Redis, Backend API, Frontend SPA, and Nginx proxy) in containers.

```bash
# Start all containers in the background
docker compose up --build -d
```
Once healthy, access the app at: **`http://localhost`** (reverse-proxied via Nginx on port 80).

---

### Option 2: Local Development Setup (Manual)
Use this option if you want to run backend and frontend processes directly for active editing.

#### 1. Prerequisites
- **Node.js** (v18+)
- **PostgreSQL**
- **Redis**

#### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Create a `.env` file (based on `.env.example`).
   - Configure `DATABASE_URL`, `REDIS_URL`, and other integration credentials.
4. Generate the Prisma Client and run migrations:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```
5. *(Optional)* Seed the database with initial dummy data:
   ```bash
   npm run seed
   ```
6. Start the development server:
   ```bash
   npm run dev
   ```
   *The backend will run on port `5000` by default.*

#### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure the proxy target:
   - Open `vite.config.js` and verify the `server.proxy` target port matches your backend (e.g. `http://localhost:5000`).
4. Start the Vite dev server:
   ```bash
   npm run dev
   ```
   *Access the frontend at: **`http://localhost:3000`**.*

---

## 📂 Project Structure

```text
kodisha/
├── backend/            # Express.js API & Prisma schemas
│   ├── prisma/         # Database migrations & seed scripts
│   └── src/            # API endpoints & core services
├── frontend/           # React SPA
│   ├── src/components/ # Shared UI components
│   └── src/pages/      # Dashboard and portal interfaces
├── nginx/              # Nginx reverse proxy configuration
└── docker-compose.yml  # Multi-container orchestration
```
