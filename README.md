# 🍿 CineBook — Cinema Hall Ticket Booking System

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://cinebook-sepia.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue?style=for-the-badge&logo=github)](https://github.com/Ritikkumar2525/CineBook)

A full-stack, enterprise-grade cinema hall ticket booking application built with **React 18**, **Node.js/Express**, **MongoDB/Mongoose**, **Framer Motion**, and **Tailwind CSS**.

Developed for the **Algions AI Labs** Full-Stack Web Development Advanced Individual Project Assessment.

---

## 🌟 Highlights & Capabilities

- **Modular Monolith Architecture:** Clear separation between Presentation (React), API/Business Logic (Express Services), and Persistence (MongoDB).
- **Pessimistic Seat Hold Engine:** 10-minute temporary seat lock buffer preventing double reservations with automatic expiration.
- **Transactional Booking Confirmation:** Atomic conversion of held seats to confirmed reservations with cryptographic reference token generation and scannable high-density QR code passes.
- **Usher Ticket Scanner Terminal:** One-time gate check-in preventing duplicate entry.
- **Server-Side Role-Based Access Control (RBAC):** Strict JWT verification and role enforcement for Admin and Customer personas.
- **Live Occupancy & Sales Reporting:** Real-time capacity calculations matching bookings and cancellations with an immutable audit trail.
- **Interactive API Documentation:** Built-in OpenAPI 3.0 specification served via Scalar UI at `/api/docs`.
- **100% Automated Test Coverage:** 31 tests passing including 5 dedicated acceptance tests.

---

## 🏗️ Architecture Overview

```
cinema-booking/
├── client/                     # Frontend Application (React + Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/         # Navbar, Footer, Layout, AdminLayout
│   │   │   └── ui/             # Modal, ConfirmDialog, Badge, Pagination, SearchBar
│   │   ├── pages/
│   │   │   ├── auth/           # LoginPage, RegisterPage (with 1-click autofill)
│   │   │   ├── customer/       # HomePage, MoviesPage, MovieDetailPage, SeatSelectionPage,
│   │   │   │                   # BookingConfirmationPage, MyBookingsPage
│   │   │   └── admin/          # DashboardPage, ManageMoviesPage, ManageTheatresPage,
│   │   │                       # ManageScreensPage, ManageShowtimesPage, ManageBookingsPage,
│   │   │                       # AuditLogPage
│   │   ├── context/            # AuthContext (JWT state & role synchronization)
│   │   └── services/           # Axios HTTP client with JWT interceptors
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Backend REST API (Node.js + Express)
│   ├── src/
│   │   ├── config/             # Database connection & seed script
│   │   ├── controllers/        # Express route handlers
│   │   ├── middleware/         # JWT auth, RBAC authorize, error handler, validation
│   │   ├── models/             # Mongoose schemas (User, Movie, Theatre, Screen, Showtime,
│   │   │                       # SeatHold, Booking, AuditLog)
│   │   ├── routes/             # REST route modules
│   │   ├── services/           # Domain logic (seatHoldService, bookingService, auditService)
│   │   ├── utils/              # Transaction wrapper & helper utilities
│   │   └── docs/               # OpenAPI 3.0.3 specification & Swagger assets
│   ├── tests/
│   │   ├── acceptance.test.js  # 5 official acceptance tests
│   │   └── api.test.js         # 26 integration tests
│   ├── package.json
│   └── vitest.config.js
│
├── API_DOCUMENTATION.md        # API reference with cURL examples
├── ER_DIAGRAM.md               # Database schema & Mermaid ER diagram
├── TECHNICAL_REPORT.md         # Architecture decisions, concurrency & security report
├── DEMO_GUIDE.md               # 3-5 minute video script & reviewer checklist
└── package.json                # Root package with unified scripts
```

---

## ⚡ Quick Start (Local Setup)

### Prerequisites
- **Node.js:** v18.0.0 or higher
- **MongoDB:** v6.0 or higher running locally on port 27017 (or MongoDB Atlas connection URI)

### 1. Clone & Install Dependencies
From the repository root:
```bash
# Install dependencies for both server and client
npm run install:all
```

### 2. Environment Configuration
The repository includes pre-configured environment files:

**`server/.env`**:
```env
MONGODB_URI=mongodb://localhost:27017/cinema-booking
JWT_SECRET=cinema-booking-dev-secret-key-2024
JWT_EXPIRES_IN=7d
PORT=5000
CLIENT_URL=http://localhost:5173
SEAT_HOLD_EXPIRY_MINUTES=10
NODE_ENV=development
```

*(A template is also committed at `server/.env.example`.)*

### 3. Seed Database
Populates the database with movies, multiplexes, auditoriums, seating tiers, schedules, and test accounts:
```bash
npm run seed
```

### 4. Run Development Servers
Start both backend API and frontend client with a single command:
```bash
npm run dev
```

- **Frontend Client:** `http://localhost:5173`
- **Backend API:** `http://localhost:5000`
- **Interactive API Documentation:** `http://localhost:5000/api/docs`

---

## 🔑 Pre-Seeded Demo Credentials

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin Operator** | `admin@cinema.com` | `admin123` | Full administrative control, schedule management, box office analytics, usher ticket scanner, audit logs |
| **Customer User** | `john@example.com` | `password123` | Movie browsing, seat selection & temporary holds, ticket booking, cancellation, personal booking history |

*(The login screen also provides 1-click autofill buttons for both roles.)*

---

## 🧪 Automated Test Verification

Run the entire test suite from the repository root:
```bash
npm test
```

To run exclusively the 5 core acceptance criteria tests:
```bash
npm run test:acceptance
```

### Acceptance Test Matrix

| # | Assessment Acceptance Requirement | Automated Test Result | Test File & Line |
| :-: | :--- | :---: | :--- |
| **1** | An available seat can be held and booked for a show | **PASS** ✅ | [`server/tests/acceptance.test.js:65`](file:///Users/ritikkumar/Desktop/Algions/cinema-booking/server/tests/acceptance.test.js#L65) |
| **2** | The same seat cannot be confirmed to two users for one show | **PASS** ✅ | [`server/tests/acceptance.test.js:108`](file:///Users/ritikkumar/Desktop/Algions/cinema-booking/server/tests/acceptance.test.js#L108) |
| **3** | Expired holds release the seat; confirmed bookings remain unavailable | **PASS** ✅ | [`server/tests/acceptance.test.js:140`](file:///Users/ritikkumar/Desktop/Algions/cinema-booking/server/tests/acceptance.test.js#L140) |
| **4** | A ticket reference/QR can be validated once in a simulated entry flow | **PASS** ✅ | [`server/tests/acceptance.test.js:203`](file:///Users/ritikkumar/Desktop/Algions/cinema-booking/server/tests/acceptance.test.js#L203) |
| **5** | The admin occupancy report matches bookings and cancellations | **PASS** ✅ | [`server/tests/acceptance.test.js:255`](file:///Users/ritikkumar/Desktop/Algions/cinema-booking/server/tests/acceptance.test.js#L255) |

---

## 📚 Documentation Reference

- **[ER_DIAGRAM.md](ER_DIAGRAM.md):** Complete database schema, Mermaid ER diagram, foreign keys, compound indexes, and business constraints.
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md):** REST API specification with sample payloads and status codes.
- **[TECHNICAL_REPORT.md](TECHNICAL_REPORT.md):** Deep-dive architecture report detailing concurrency handling, transactional guarantees, and security decisions.
- **[DEMO_GUIDE.md](DEMO_GUIDE.md):** 3–5 minute video script and step-by-step reviewer manual testing guide.

---

## ⚠️ Known Assumptions & Limitations

1. **Payment Simulation:** In accordance with the project brief ("Payment must be simulated or sandboxed. Do not pay for hosting or external services"), payments complete synchronously upon user checkout without connecting to live external payment gateways.
2. **MongoDB Replica Set for Distributed Transactions:** Multi-document ACID transactions via `session.withTransaction()` utilize MongoDB replica sets. When running against standalone local MongoDB development servers, the system includes a graceful fallback (`transaction.js`) ensuring consistent local operation.
3. **Usher Camera Scanner:** The Usher Scanner UI currently operates via reference code entry (or copy/paste from QR scans). A future extension can incorporate WebRTC device camera video feed decoding via `jsQR`.
