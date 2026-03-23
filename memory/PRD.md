# PostalRD Pro - Product Requirements Document

## Original Problem Statement
Build a production-ready full stack web application for managing Recurring Deposit (RD) customers for an Indian Postal Service RD collection agent. The app should function as a secure financial dashboard with Authentication, Customer Management System, Payment Tracking, RD Maturity Calculator, Dashboard UI (analytics/charts), Reporting (PDF/CSV), and use a specific design scheme.

## User Personas
1. **RD Collection Agent (Admin)** - Manages customers, tracks payments, generates reports
2. **RD Customer** - Views their own RD account details, payment history, and maturity info

## Tech Stack
- **Frontend**: React, TailwindCSS, Shadcn UI, Recharts
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Auth**: JWT-based with role support (admin/customer)
- **PWA**: Service worker + manifest for mobile install

## Core Features (Implemented)

### Authentication & Roles
- JWT-based auth with login, signup, password recovery
- Password strength indicator on signup
- **Role-based access**: Admin and Customer roles
- Admin users get full dashboard access
- Customer users get read-only view of their RD account

### Customer Management (Admin)
- CRUD operations for RD customers
- CSV import with validation
- Customer search and tenure filtering
- Auto-generation of payment schedules

### Customer Account Management (Admin)
- Create login credentials for customers
- Link customer accounts to customer records
- View/delete customer accounts
- Customers can only have one account each

### Customer Dashboard
- Welcome screen with customer name
- Maturity amount hero card with interest rate
- Payment progress bar (paid vs total installments)
- Summary cards: Monthly RD, Paid count, Remaining, Overdue
- Next payment due card with amount and date
- RD account details section
- Full payment history with filter (All/Paid/Unpaid/Overdue)

### Payment Tracking (Admin)
- Month-based payment view with navigation
- Mark payments as Paid/Unpaid
- Overdue payment tracking
- Customer-level payment history

### Dashboard Analytics (Admin)
- Total customers, monthly expected, paid/unpaid metrics
- Monthly collection bar chart
- Paid vs Unpaid pie chart
- Upcoming maturity list
- Recent unpaid payments

### RD Calculator
- Calculate maturity for 5 or 10 year tenure
- Default interest rate: **6.7% p.a.** (quarterly compounding)
- Shows maturity amount, total deposit, interest earned

### Reports (Admin)
- Customer RD sheet with all details
- Export to CSV
- Export to PDF (jsPDF + autotable)
- Print functionality

## Key Configuration
- **Default Interest Rate**: 6.7% p.a. (changed from 7.6)
- **Allowed Tenures**: 5 years, 10 years
- **Compounding**: Quarterly

## Database Schema
- **users**: `{id, username, password, email, role, customer_id?, created_at}`
- **customers**: `{id, name, age, monthly_amount, tenure, interest_rate, start_date, maturity_date, maturity_amount, total_deposit, total_interest, created_at, created_by}`
- **payments**: `{id, customer_id, customer_name, month, year, month_label, amount_due, amount_paid, payment_date, status, due_date}`

## API Endpoints
- Auth: POST `/api/auth/register`, `/api/auth/login`, `/api/auth/reset-password`, GET `/api/auth/me`
- Customers: GET/POST `/api/customers`, GET/PUT/DELETE `/api/customers/{id}`, POST `/api/customers/import`, GET `/api/customers/export/data`
- Payments: GET `/api/payments/current-month`, PUT `/api/payments/{id}`, GET `/api/payments/unpaid`, `/api/payments/overdue`, GET `/api/customers/{id}/payments`
- Dashboard: GET `/api/dashboard/stats`
- Calculator: POST `/api/calculator`
- Admin: POST/GET `/api/admin/customer-accounts`, DELETE `/api/admin/customer-accounts/{id}`
- Customer: GET `/api/customer/dashboard`

## Completed Tasks
- [x] Full stack app (React + FastAPI + MongoDB)
- [x] JWT Authentication with signup/login/reset
- [x] Password strength indicator
- [x] Customer CRUD + CSV import
- [x] Payment tracking with month filter
- [x] RD maturity calculator
- [x] Dashboard with charts (Recharts)
- [x] Reports page with PDF/CSV export
- [x] PWA configuration
- [x] Responsive design (mobile/tablet/desktop)
- [x] Interest rate updated to 6.7% globally
- [x] Role-based auth (admin/customer)
- [x] Admin: Create customer login accounts
- [x] Customer Dashboard (read-only RD view)
- [x] Customer Layout with header/footer

## Upcoming Tasks
- [ ] Rate limiting on auth endpoints (P2)
- [ ] Bulk "Mark All as Paid" for selected month (P2)

## Future/Backlog
- [ ] Email-based OTP verification for password recovery (P3)
- [ ] Android APK generation (BLOCKED - needs Java/Gradle env)
