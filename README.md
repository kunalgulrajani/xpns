# XPNS

**A Personal Finance & Expense Management System.**

Record your income and expenses, organise them into categories, and see your monthly financial health on an interactive dashboard.

![Node.js](https://img.shields.io/badge/Node.js-20-green)
![React](https://img.shields.io/badge/UI-React%2018%20%2B%20Vite-blue)
![Express](https://img.shields.io/badge/API-Express%204-lightgrey)
![MongoDB](https://img.shields.io/badge/Database-MongoDB%207-brightgreen)
![Docker](https://img.shields.io/badge/Deploy-Docker%20Compose-2496ED)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup & Sample Data](#database-setup--sample-data)
- [Usage](#usage)
- [Running Tests](#running-tests)
- [Project Status](#project-status)
- [Group Members](#group-members)

---

## Features

| Module | Description |
|---|---|
| **Authentication** | Register and log in with bcrypt-hashed passwords and JWT tokens. Protected routes on both backend and frontend. |
| **Transactions** | Add, edit, delete and list income and expense transactions. Filter by type, category and date range. |
| **Categories** | 13 system default categories plus user-defined custom categories. Defaults are protected from deletion. |
| **Dashboard** | Monthly total income, total expenses and net balance, a donut chart, a category breakdown, the 5 most recent transactions, a month/year selector and a quick "Add Transaction" modal. |
| **Currency** | Per-transaction currency (INR, USD, EUR, GBP) and a navbar currency selector. Default is INR. |

**Highlights**

- **End-to-end flow works:** Register, log in, add an expense, see it on the dashboard.
- **Per-user data isolation:** one user can never read or modify another user's data.
- **Secure by default:** helmet, CORS allow-list, input validation, and rate limiting on auth routes.
- **One-command startup** with Docker Compose, including health checks.
- **50 automated tests** (40 backend, 10 frontend).

---

## Tech Stack

| Purpose | Technology |
|---|---|
| Web UI | React 18, Vite 5, React Router 6 |
| Charts | Recharts |
| HTTP client | Axios |
| API | Node.js 20, Express 4 |
| Database | MongoDB 7 with Mongoose 8 |
| Security | bcryptjs, jsonwebtoken, helmet, CORS, express-rate-limit (auth routes: 20 requests / 15 min) |
| Validation | express-validator |
| Backend testing | Jest, Supertest, mongodb-memory-server |
| Frontend testing | Vitest, React Testing Library, jsdom |
| DevOps | Docker, Docker Compose, Nginx |

---

## Project Structure

```
xpns/
├── README.md
├── docker-compose.yml          # mongo + backend + frontend
├── .env.example                # Docker environment template
├── .gitignore
├── sample_data/
│   └── seed.js                 # wrapper that runs the backend seed
├── backend/
│   ├── Dockerfile              # multi-stage, runs as non-root "node" user
│   ├── package.json
│   ├── jest.config.js
│   ├── .env.example
│   ├── sample_data/seed.js     # demo user, default categories, sample transactions
│   ├── src/
│   │   ├── server.js           # entry point
│   │   ├── app.js              # middleware and route mounting
│   │   ├── config/             # env config, DB connection
│   │   ├── models/             # User, Category, Transaction
│   │   ├── controllers/        # auth, category, transaction, dashboard
│   │   ├── routes/             # route definitions and validation rules
│   │   ├── middleware/         # JWT auth, validation, error handler
│   │   └── utils/              # ApiError
│   └── tests/                  # Jest + Supertest suites
└── frontend/
    ├── Dockerfile              # multi-stage: Vite build, then Nginx
    ├── nginx.conf              # SPA fallback + /api reverse proxy
    ├── package.json
    ├── vite.config.js
    ├── .env.example
    └── src/
        ├── api/                # Axios client and endpoint modules
        ├── components/         # Layout, Navbar, ProtectedRoute
        ├── context/            # AuthContext, CurrencyContext
        ├── pages/              # Login, Register, Dashboard, Transactions, Categories
        └── test/               # Vitest suites
```

---

## Installation

### Prerequisites

| Tool | Version | Needed for |
|---|---|---|
| Docker Desktop (with Compose v2) | 20+ | Docker setup (recommended) |
| Node.js | 20.x | Running without Docker, and running tests |
| npm | 10.x | Running without Docker, and running tests |
| MongoDB | 7.x | Running without Docker only (can be started with Docker) |
| Git | any | Cloning |

All dependencies are declared in `backend/package.json` and `frontend/package.json` and are installed with `npm install` (or automatically during the Docker build). Nothing needs to be installed globally.

### Option A: Docker (recommended)

From the project root (the folder containing `docker-compose.yml`):

```bash
# 1. (Recommended) create your environment file and set your own JWT_SECRET
cp .env.example .env          # Windows: copy .env.example .env

# 2. Build and start MongoDB, backend and frontend
docker compose up --build -d

# 3. Wait until all three services show "healthy"
docker compose ps

# 4. Load default categories, the demo user and sample transactions
docker compose exec backend npm run seed
```

Open **http://localhost:3000**.

Stop the stack:

```bash
docker compose down        # stops containers, KEEPS the database
docker compose down -v     # stops containers AND DELETES the database volume
```

> **Warning:** `docker compose down -v` wipes MongoDB, including the demo user. After a fresh `up`, run `docker compose exec backend npm run seed` again. The seed script is safe to re-run.

---

### Option B: Without Docker

**1. Start MongoDB** (use an existing local instance, or start one with Docker):

```bash
docker run -d --name xpns-mongo -p 27017:27017 mongo:7
```

**2. Backend (port 5000)**

```bash
cd backend
npm install
cp .env.example .env          # Windows: copy .env.example .env
# edit .env and set JWT_SECRET to a long random string
npm run seed                  # optional: demo user + sample data
npm run dev                   # or: npm start
```

**3. Frontend (port 3000)**, in a second terminal:

```bash
cd frontend
npm install
cp .env.example .env          # Windows: copy .env.example .env
npm run dev
```

Open **http://localhost:3000**.

---

## Configuration

Sample files: root `.env.example` (Docker), `backend/.env.example`, `frontend/.env.example`. Copy them to `.env`.

```env
# backend/.env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/xpns
JWT_SECRET=CHANGE_ME_TO_A_RANDOM_SECRET
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000

# frontend/.env
VITE_API_URL=http://localhost:5000/api
```

| Variable | Where | Example | Description |
|---|---|---|---|
| `PORT` | backend | `5000` | API port |
| `NODE_ENV` | backend | `development` | Environment |
| `MONGO_URI` | backend | `mongodb://localhost:27017/xpns` | MongoDB connection (Compose sets `mongodb://mongo:27017/xpns`) |
| `JWT_SECRET` | backend / root | *(long random string)* | Signs JWTs. **Must be changed.** |
| `JWT_EXPIRES_IN` | backend / root | `7d` | Token lifetime |
| `CORS_ORIGIN` | backend / root | `http://localhost:3000` | Comma-separated allowed origins |
| `VITE_API_URL` | frontend | `http://localhost:5000/api` (dev) / `/api` (Docker) | API base URL baked into the frontend at build time |

> Docker Compose only reads `JWT_SECRET`, `JWT_EXPIRES_IN` and `CORS_ORIGIN` from the root `.env`. If not created, built-in development defaults are used.

---

## Database Setup & Sample Data

- The database (`xpns`) and its collections are created automatically on first use. No manual schema step is needed.
- **Seed script:** `backend/sample_data/seed.js`, run with `npm run seed` from `backend/` (or `docker compose exec backend npm run seed`). It:
  1. creates the 13 default categories (4 income, 9 expense),
  2. creates or updates the demo user,
  3. clears and recreates that user's sample transactions (31 INR transactions across several months).
- `sample_data/seed.js` in the project root is a thin wrapper that calls the backend seed.

### Demo credentials (demo only)

| Field | Value |
|---|---|
| Email | `demo@xpns.test` |
| Password | `DemoUser123!` |

These exist only for evaluation and are created by the seed script. The login page also has a **"Fill Demo Credentials"** button.

---

## Usage

1. **Sign up or log in:** open http://localhost:3000 and click **Register here**, or use the demo login.
2. **Add a transaction:** go to **Transactions > + Add Transaction** (or use the button on the Dashboard) and add an expense with a category and amount.
3. **Check the dashboard:** confirm the expense appears in total expenses, the donut chart, the category breakdown and recent transactions.
4. **Explore:** filter transactions by type, category and date range, then edit and delete a transaction.
5. **Manage categories:** on **Categories**, create, delete and update custom categories.

---

## Running Tests

### Backend: 40 tests (Jest + Supertest)

Uses `mongodb-memory-server`, so **no database setup is required**. The first run downloads a MongoDB binary and may take a minute.

```bash
cd backend
npm test                                     # all suites
npm test -- transaction category --verbose   # only some suites, with test names
```

| Suite | Tests | Covers |
|---|---:|---|
| `tests/auth.test.js` | 12 | Register (valid, duplicate, invalid email, short password, missing name), login (valid, wrong password, unknown email, missing fields), `/me` (valid, missing and invalid token) |
| `tests/category.test.js` | 9 | List defaults and custom, create, duplicate, validation, delete custom, block default delete, cross-user delete blocked |
| `tests/transaction.test.js` | 14 | Create, validation, list, filter by type and date, update, delete, 404, four user-isolation tests |
| `tests/dashboard.test.js` | 5 | 401 when unauthenticated, empty state, correct totals and category breakdown, month/year filter, user isolation |

### Frontend: 10 tests (Vitest + React Testing Library)

```bash
cd frontend
npm test
```

| Suite | Tests | Covers |
|---|---:|---|
| `src/test/Login.test.jsx` | 2 | Form renders, demo-credentials button |
| `src/test/ProtectedRoute.test.jsx` | 1 | Redirect to `/login` when unauthenticated |
| `src/test/Transactions.test.jsx` | 3 | Table and filters render, modal opens and closes, create-transaction submit |
| `src/test/Dashboard.test.jsx` | 4 | KPI cards, category breakdown, period selector, quick-add button |

---

## Project Status

**Completed**

- User registration and login (bcrypt + JWT)
- Transaction CRUD with filters
- Default and custom categories
- Dashboard with chart, totals, breakdown and recent transactions
- Per-transaction currency and navbar currency selector
- Dockerised stack with health checks
- Seed script with demo user and sample data
- 40 backend and 10 frontend automated tests

**Planned**

- Budgets and spending alerts
- Recurring transactions
- CSV / PDF export
- Receipt upload
- Cloud deployment

---

## Group Members

| # | Name | Registration No. |
|---|------|------------------|
| 1 | Mayank Singh | 20243164 |
| 2 | Kunal Gulrajani | 20243576 |
| 3 | Keshav Kalwar | 20243523 |
| 4 | Mayank Negi | 20243163 |
