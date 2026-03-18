# PostalRD Pro

**A production-ready Recurring Deposit (RD) management dashboard for Indian Postal Service RD collection agents.**

PostalRD Pro is a full-stack web application that enables postal agents to manage RD customers, track monthly payments, calculate maturity amounts, view analytics, and generate reports — all from a single, secure dashboard.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [RD Maturity Calculation](#rd-maturity-calculation)
- [PWA Support](#pwa-support)
- [Security](#security)
- [Deployment](#deployment)
- [Screenshots](#screenshots)
- [License](#license)

---

## Features

### Authentication
- JWT-based authentication with bcrypt password hashing
- User registration with optional email (for password recovery)
- Password reset flow via username + registered email verification
- Real-time password strength indicator (Weak / Fair / Good / Strong) with 6 criteria
- Confirm password validation with live match feedback
- Protected routes — all dashboard pages require authentication
- Auto logout on token expiry

### Customer Management
- Add, edit, and delete RD customers
- Customer fields: Name, Age, Monthly RD Amount, Tenure (5 or 10 years), Interest Rate (default 7.6%), Start Date
- Auto-calculated: Maturity Date, Maturity Amount, Total Deposit, Total Interest
- Search customers by name
- Filter by tenure (5Y / 10Y)
- **CSV Import** — bulk import customers via CSV file with:
  - Downloadable CSV template
  - Client-side parsing and row-by-row validation
  - Preview table with Valid/Error status per row
  - Server-side batch creation with detailed error reporting
- Click any customer row to view detailed profile

### Payment Tracking
- Auto-generated monthly payment records for full tenure (60 or 120 months)
- **Month/Year filter** — navigate to any month with `< Month Year >` controls, dropdowns, and "Go to Current Month" shortcut
- Tabs: All / Paid / Unpaid / Overdue
- Search payments by customer name
- Mark individual payments as Paid or Unpaid
- Overdue payments highlighted in red
- Summary cards update per selected month: Total, Paid, Unpaid, Collected amount

### RD Maturity Calculator
- Interactive calculator with inputs: Monthly Deposit, Tenure (5 or 10 years), Interest Rate
- Calculates using **quarterly compounding** (Indian Post Office method)
- Results: Maturity Amount, Total Deposit, Total Interest Earned
- Visual summary card with breakdown

### Dashboard Analytics
- **4 Metric Cards**: Total Customers, Monthly Expected Collection, Paid This Month, Unpaid This Month (with overdue count)
- **Monthly Collection Bar Chart** (Recharts) — aggregated paid amounts by month
- **Paid vs Unpaid Donut Chart** — current month payment distribution
- **Upcoming Maturity Table** — customers maturing within 6 months
- **Unpaid This Month Table** — recent unpaid payments

### Reporting & Export
- **CSV Export** — download all customer data as CSV
- **PDF Export** — generate professional PDF report with jsPDF + jspdf-autotable (landscape, styled headers, alternating row colors)
- **Print** — browser print with print-optimized CSS (hides navigation, buttons)
- Summary cards: Total Customers, Total Monthly Collection, Total Deposits, Total Maturity Value
- Full RD Sheet table with all customer details

### Responsive Design
- **Desktop (1024px+)**: Full sidebar always visible, 4-column layouts
- **Tablet (768px)**: Hamburger menu, 2-column metric cards
- **Mobile (375px)**: Collapsible sidebar via Sheet overlay, compact cards, scrollable tables, full-width buttons
- Mobile top bar with branding and hamburger toggle

### PWA (Progressive Web App)
- Installable on Android via "Add to Home Screen" in Chrome
- `manifest.json` with app metadata and icons (32px, 96px, 192px, 512px)
- Service worker with cache-first for static assets, network-first for API calls
- Offline fallback page
- "Install App" button in sidebar when browser detects installability

---

## Tech Stack

| Layer      | Technology                                        |
|------------|---------------------------------------------------|
| Frontend   | React 19, Tailwind CSS, Shadcn/UI, Recharts       |
| Backend    | FastAPI (Python), Pydantic                         |
| Database   | MongoDB (Motor async driver)                       |
| Auth       | JWT (PyJWT) + bcrypt                               |
| PDF Export | jsPDF + jspdf-autotable                            |
| Icons      | Lucide React                                       |
| Fonts      | Manrope (headings), Inter (body) via Google Fonts  |
| PWA        | Service Worker, Web App Manifest                   |
| Routing    | React Router DOM v7                                |
| State      | React Context API (AuthContext)                    |

---

## Architecture

```
Browser (React SPA)
    |
    |-- HTTPS --> Kubernetes Ingress
                    |
                    |-- /api/* --> FastAPI Backend (port 8001)
                    |                  |
                    |                  |-- MongoDB (Motor async)
                    |
                    |-- /* -----> React Frontend (port 3000)
```

- **Frontend** communicates with the backend exclusively via `REACT_APP_BACKEND_URL/api/*`
- **Backend** connects to MongoDB via `MONGO_URL` environment variable
- **JWT tokens** are stored in `localStorage` as `rd_token`
- **CORS** is configured via `CORS_ORIGINS` environment variable

---

## Project Structure

```
/app
├── backend/
│   ├── server.py              # FastAPI application (all routes, models, utilities)
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # Backend environment variables
│
├── frontend/
│   ├── public/
│   │   ├── index.html         # HTML entry point with PWA meta tags
│   │   ├── manifest.json      # PWA manifest
│   │   ├── sw.js              # Service worker
│   │   ├── offline.html       # Offline fallback page
│   │   ├── favicon.ico        # App favicon
│   │   ├── apple-touch-icon.png
│   │   └── icons/             # PWA icons (32, 96, 192, 512px)
│   │
│   ├── src/
│   │   ├── index.js           # React entry point + SW registration
│   │   ├── index.css          # Global styles, CSS variables, Tailwind base
│   │   ├── App.js             # Router, AuthProvider, ThemeProvider
│   │   ├── App.css            # Custom component styles, animations
│   │   │
│   │   ├── contexts/
│   │   │   └── AuthContext.js  # Auth state management (login, logout, verify)
│   │   │
│   │   ├── lib/
│   │   │   ├── api.js          # Axios instance, auth interceptors, formatters
│   │   │   └── utils.js        # cn() utility for Tailwind class merging
│   │   │
│   │   ├── components/
│   │   │   ├── Layout.js       # Main layout (sidebar + content + mobile top bar)
│   │   │   ├── Sidebar.js      # Navigation sidebar (desktop + mobile Sheet)
│   │   │   └── ui/             # Shadcn/UI components (Button, Card, Dialog, etc.)
│   │   │
│   │   ├── pages/
│   │   │   ├── LoginPage.js          # Login / Sign Up / Forgot Password
│   │   │   ├── DashboardPage.js      # Analytics dashboard
│   │   │   ├── CustomersPage.js      # Customer CRUD + CSV Import
│   │   │   ├── CustomerDetailPage.js # Customer profile + payment history
│   │   │   ├── PaymentsPage.js       # Payment tracking with month filter
│   │   │   ├── CalculatorPage.js     # RD maturity calculator
│   │   │   └── ReportsPage.js        # Export (CSV, PDF, Print)
│   │   │
│   │   └── hooks/
│   │       └── use-toast.js    # Toast hook
│   │
│   ├── tailwind.config.js     # Tailwind config (custom colors, fonts)
│   ├── package.json           # Node.js dependencies
│   └── .env                   # Frontend environment variables
│
├── memory/
│   └── PRD.md                 # Product Requirements Document
│
└── README.md                  # This file
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **Python** >= 3.10
- **MongoDB** running locally or a connection URI
- **Yarn** (package manager)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd app
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your values (see Environment Variables section)

# Start the server
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

The backend will start at `http://localhost:8001`. A default admin user (`admin` / `admin123`) is created on first startup.

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
yarn install

# Configure environment
cp .env.example .env
# Set REACT_APP_BACKEND_URL to your backend URL

# Start development server
yarn start
```

The frontend will start at `http://localhost:3000`.

### 4. Access the Application

Open `http://localhost:3000` in your browser. Create a new account via Sign Up or use the default admin credentials:
- **Username**: `admin`
- **Password**: `admin123`

---

## Environment Variables

### Backend (`/backend/.env`)

| Variable       | Description                              | Example                          |
|----------------|------------------------------------------|----------------------------------|
| `MONGO_URL`    | MongoDB connection string                | `mongodb://localhost:27017`      |
| `DB_NAME`      | Database name                            | `postalrd_db`                    |
| `JWT_SECRET`   | Secret key for JWT token signing         | `<random-64-char-hex-string>`    |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated)   | `*` or `http://localhost:3000`   |

### Frontend (`/frontend/.env`)

| Variable                  | Description                    | Example                              |
|---------------------------|--------------------------------|--------------------------------------|
| `REACT_APP_BACKEND_URL`  | Backend API base URL           | `http://localhost:8001`              |

---

## API Reference

All endpoints are prefixed with `/api`. Protected endpoints require `Authorization: Bearer <token>` header.

### Authentication

| Method | Endpoint               | Auth | Description                          |
|--------|------------------------|------|--------------------------------------|
| POST   | `/api/auth/register`   | No   | Register a new user                  |
| POST   | `/api/auth/login`      | No   | Login and receive JWT token          |
| POST   | `/api/auth/reset-password` | No | Reset password via username + email |
| GET    | `/api/auth/me`         | Yes  | Get current user info                |

**POST /api/auth/register**
```json
{
  "username": "agent1",
  "password": "SecurePass1!",
  "email": "agent1@postal.in"  // optional, used for password recovery
}
```

**POST /api/auth/login**
```json
{
  "username": "agent1",
  "password": "SecurePass1!"
}
// Response: { "token": "eyJ...", "username": "agent1" }
```

**POST /api/auth/reset-password**
```json
{
  "username": "agent1",
  "email": "agent1@postal.in",
  "new_password": "NewSecure1!"
}
```

### Customers

| Method | Endpoint                       | Auth | Description                      |
|--------|--------------------------------|------|----------------------------------|
| GET    | `/api/customers`               | Yes  | List all customers               |
| POST   | `/api/customers`               | Yes  | Create a new customer            |
| GET    | `/api/customers/{id}`          | Yes  | Get customer by ID               |
| PUT    | `/api/customers/{id}`          | Yes  | Update customer                  |
| DELETE | `/api/customers/{id}`          | Yes  | Delete customer + all payments   |
| POST   | `/api/customers/import`        | Yes  | Bulk import from CSV data        |
| GET    | `/api/customers/export/data`   | Yes  | Export all customer data         |

**POST /api/customers**
```json
{
  "name": "Rajesh Kumar",
  "age": 45,
  "monthly_amount": 1000,
  "tenure": 5,          // 5 or 10 years only
  "interest_rate": 7.6, // default 7.6%
  "start_date": "2025-01-01"
}
// Auto-calculates: maturity_date, maturity_amount, total_deposit, total_interest
// Auto-generates: 60 (or 120) monthly payment records
```

**POST /api/customers/import**
```json
{
  "customers": [
    { "name": "Customer 1", "age": 30, "monthly_amount": 500, "tenure": 5, "interest_rate": 7.6, "start_date": "2025-01-01" },
    { "name": "Customer 2", "age": 40, "monthly_amount": 2000, "tenure": 10, "interest_rate": 7.6, "start_date": "2025-06-01" }
  ]
}
// Response: { "success": 2, "failed": 0, "errors": [] }
```

### Payments

| Method | Endpoint                           | Auth | Description                              |
|--------|------------------------------------|------|------------------------------------------|
| GET    | `/api/customers/{id}/payments`     | Yes  | Get all payments for a customer          |
| PUT    | `/api/payments/{id}`               | Yes  | Update payment (mark Paid/Unpaid)        |
| GET    | `/api/payments/current-month`      | Yes  | Get payments for a month (query params)  |
| GET    | `/api/payments/unpaid`             | Yes  | Get unpaid payments for a month          |
| GET    | `/api/payments/overdue`            | Yes  | Get all overdue payments                 |

**Query Parameters for `/api/payments/current-month` and `/api/payments/unpaid`:**
- `month` (int, optional) — defaults to current month
- `year` (int, optional) — defaults to current year

**PUT /api/payments/{id}**
```json
{
  "status": "Paid",        // "Paid" or "Unpaid"
  "amount_paid": 1000,     // optional, defaults to amount_due
  "payment_date": "2025-03-15" // optional, defaults to now
}
```

### Dashboard

| Method | Endpoint              | Auth | Description                          |
|--------|-----------------------|------|--------------------------------------|
| GET    | `/api/dashboard/stats`| Yes  | Get all dashboard analytics data     |

**Response includes:**
- `total_customers`, `total_monthly_expected`
- `total_paid_amount`, `total_paid_count`, `unpaid_count`, `overdue_count`
- `monthly_chart` — array of `{ month, amount, count }` for bar chart
- `paid_vs_unpaid` — array for pie chart
- `upcoming_maturity` — customers maturing within 6 months
- `recent_unpaid` — recent unpaid payments this month

### Calculator

| Method | Endpoint           | Auth | Description                          |
|--------|--------------------|------|--------------------------------------|
| POST   | `/api/calculator`  | No   | Calculate RD maturity amount         |

**POST /api/calculator**
```json
{
  "monthly_deposit": 1000,
  "tenure_years": 5,    // 5 or 10
  "annual_rate": 7.6
}
// Response: { "maturity_amount": 73022.56, "total_deposit": 60000, "total_interest": 13022.56, ... }
```

---

## Database Schema

### Collections

#### `users`
| Field       | Type    | Description                    |
|-------------|---------|--------------------------------|
| `id`        | String  | UUID primary key               |
| `username`  | String  | Unique username (indexed)      |
| `password`  | String  | bcrypt hashed password         |
| `email`     | String  | Email for password recovery    |
| `created_at`| String  | ISO 8601 timestamp             |

#### `customers`
| Field            | Type    | Description                        |
|------------------|---------|------------------------------------|
| `id`             | String  | UUID primary key (indexed, unique) |
| `name`           | String  | Customer full name                 |
| `age`            | Int     | Customer age                       |
| `monthly_amount` | Float   | Monthly RD deposit amount          |
| `tenure`         | Int     | 5 or 10 (years)                    |
| `interest_rate`  | Float   | Annual interest rate (e.g., 7.6)   |
| `start_date`     | String  | RD start date (ISO format)         |
| `maturity_date`  | String  | Auto-calculated maturity date      |
| `maturity_amount`| Float   | Auto-calculated maturity amount    |
| `total_deposit`  | Float   | Monthly amount x total months      |
| `total_interest` | Float   | Maturity amount - total deposit    |
| `created_at`     | String  | Creation timestamp                 |
| `created_by`     | String  | User ID who created                |

#### `payments`
| Field           | Type    | Description                       |
|-----------------|---------|-----------------------------------|
| `id`            | String  | UUID primary key (indexed, unique)|
| `customer_id`   | String  | Foreign key to customer (indexed) |
| `customer_name` | String  | Denormalized customer name        |
| `month`         | Int     | Payment month (1-12, indexed)     |
| `year`          | Int     | Payment year (indexed)            |
| `month_label`   | String  | Human-readable (e.g., "March 2025")|
| `amount_due`    | Float   | Expected payment amount           |
| `amount_paid`   | Float   | Actual amount paid (0 if unpaid)  |
| `payment_date`  | String  | Date payment was made (nullable)  |
| `status`        | String  | "Paid" or "Unpaid" (indexed)      |
| `due_date`      | String  | Payment due date (indexed)        |

### Indexes

| Collection  | Index                       | Type         |
|-------------|------------------------------|-------------|
| `users`     | `username`                   | Unique       |
| `customers` | `id`                         | Unique       |
| `payments`  | `id`                         | Unique       |
| `payments`  | `customer_id`                | Standard     |
| `payments`  | `(month, year)`              | Compound     |
| `payments`  | `status`                     | Standard     |
| `payments`  | `due_date`                   | Standard     |

---

## RD Maturity Calculation

PostalRD Pro uses the **Indian Post Office quarterly compounding method**:

```
For each monthly deposit (month m from 1 to N):
    remaining_months = N - m
    remaining_quarters = remaining_months / 3
    maturity_contribution = R * (1 + r/4) ^ remaining_quarters

Maturity Amount = Sum of all monthly contributions
```

Where:
- `R` = Monthly deposit amount
- `N` = Total months (60 for 5-year, 120 for 10-year)
- `r` = Annual interest rate as decimal (7.6% = 0.076)

**Example**: Rs 1,000/month for 5 years at 7.6%:
- Total Deposit: Rs 60,000
- Total Interest: ~Rs 13,023
- Maturity Amount: ~Rs 73,023

---

## PWA Support

PostalRD Pro is a Progressive Web App that can be installed on Android devices.

### How to Install on Android

1. Open the app URL in **Google Chrome** on your Android device
2. Tap the **three-dot menu** (top right)
3. Select **"Add to Home Screen"** or **"Install App"**
4. The app will appear as a standalone app on your home screen

### PWA Features
- **Standalone display** — runs without browser chrome
- **App icons** — custom PostalRD shield icon in all required sizes
- **Offline fallback** — graceful offline page when no connection
- **Cache strategy** — static assets cached locally for faster loads
- **Install prompt** — "Install App" button in sidebar when available

---

## Security

- **Password Hashing**: bcrypt with auto-generated salt
- **JWT Tokens**: 24-hour expiry, signed with `JWT_SECRET` from environment
- **Password Strength**: Client-side enforcement (6+ criteria: length, uppercase, lowercase, numbers, special chars)
- **Protected Routes**: All dashboard endpoints require valid JWT
- **MongoDB**: All queries exclude `_id` field, all documents use UUID-based `id`
- **CORS**: Configurable via `CORS_ORIGINS` environment variable
- **No Hardcoded Secrets**: All credentials loaded from environment variables

---

## Deployment

### Emergent Platform (Current)

The app is deployed on Emergent's Kubernetes infrastructure:
- Frontend served on port 3000 (auto-routed via ingress)
- Backend served on port 8001 (routed via `/api` prefix)
- MongoDB runs locally within the container

### Self-Hosted Deployment

1. Set up MongoDB (local or Atlas)
2. Configure backend `.env` with your `MONGO_URL` and a secure `JWT_SECRET`
3. Build the frontend: `cd frontend && yarn build`
4. Serve the built frontend with any static server (Nginx, etc.)
5. Run the backend: `uvicorn server:app --host 0.0.0.0 --port 8001`

### Docker Deployment

```dockerfile
# Backend
FROM python:3.11-slim
WORKDIR /app
COPY backend/ .
RUN pip install -r requirements.txt
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]

# Frontend
FROM node:18-alpine
WORKDIR /app
COPY frontend/ .
RUN yarn install && yarn build
# Serve with nginx or any static server
```

---

## Design System

| Element        | Value                                    |
|----------------|------------------------------------------|
| Primary Color  | Postal Red `#D32F2F`                     |
| Secondary      | Official Blue `#1E3A8A`                  |
| Success        | Emerald `#059669`                        |
| Warning        | Amber `#D97706`                          |
| Background     | Slate 50 `#F8FAFC`                       |
| Heading Font   | Manrope (700, 800)                       |
| Body Font      | Inter (400, 500, 600)                    |
| Components     | Shadcn/UI (Button, Card, Dialog, Table, Select, Calendar, Popover, etc.) |
| Icons          | Lucide React                             |
| Charts         | Recharts (BarChart, PieChart)            |

---

## License

This project is proprietary software built for Indian Postal Service RD collection agents.
