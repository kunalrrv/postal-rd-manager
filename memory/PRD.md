# PostalRD Pro - PRD

## Problem Statement
Build a production-ready full-stack web application for managing Recurring Deposit (RD) customers for an Indian Postal Service RD collection agent. Secure financial dashboard for tracking RD customers, monthly payments, and maturity details.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI + Recharts
- **Backend**: FastAPI (Python)
- **Database**: MongoDB (Motor async driver)
- **Auth**: JWT + bcrypt password hashing

## Core Requirements
1. Authentication (JWT login with admin/admin123)
2. Customer CRUD Management
3. Monthly Payment Tracking (auto-generated records)
4. RD Maturity Calculator (quarterly compounding)
5. Dashboard with analytics (cards, charts, tables)
6. Reporting (PDF, CSV, Print)
7. Sidebar navigation

## User Personas
- **RD Agent**: Indian Postal Service collection agent managing RD customers

## What's Been Implemented (March 16, 2026)
- [x] JWT Authentication with bcrypt password hashing
- [x] Auto-created admin user (admin/admin123)
- [x] Customer CRUD with full validation
- [x] Auto-generated payment records for full tenure (5 or 10 years)
- [x] RD Maturity Calculator with quarterly compounding
- [x] Dashboard with 4 metric cards, bar chart, donut chart, tables
- [x] Payment tracking with Paid/Unpaid/Overdue filters
- [x] Reports page with CSV export, PDF export, Print
- [x] Professional design: Official Blue sidebar, Postal Red accents, Manrope + Inter fonts
- [x] Responsive layout with sidebar navigation

## API Routes
- POST /api/auth/login
- GET /api/auth/me
- GET/POST /api/customers
- GET/PUT/DELETE /api/customers/{id}
- GET /api/customers/{id}/payments
- PUT /api/payments/{id}
- GET /api/payments/current-month, /unpaid, /overdue
- GET /api/dashboard/stats
- POST /api/calculator
- GET /api/customers/export/data

## Test Results
- Backend: 100% (18/18 tests passed)
- Frontend: 95% (minor date picker accessibility)

## Backlog
- P1: Bulk payment marking (mark all unpaid as paid)
- P1: Customer search in payments page
- P2: Date range filter for payment history
- P2: Dashboard date range selector
- P3: Dark mode toggle
- P3: Multi-user support with role-based access
