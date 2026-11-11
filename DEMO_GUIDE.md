# 🎬 Cinema Hall Ticket Booking System — Walkthrough Video Script & Demo Guide

This guide provides a structured 3–5 minute presentation script and manual testing checklist for reviewers to evaluate the system.

---

## ⏱️ Video Script Timeline (3–5 Minutes)

| Timestamp | Phase | Scene / Action | Voiceover / Key Talking Points |
| :--- | :--- | :--- | :--- |
| **0:00 - 0:35** | **Introduction & Architecture** | Show terminal and repository layout. Point out client (`React + Tailwind + Framer Motion`) and server (`Node + Express + MongoDB`). | *"Hello! This is the Cinema Hall Ticket Booking System built for the Algions AI Labs assessment. It features a modular monolith architecture separating presentation, service logic, and database persistence with full server-side RBAC."* |
| **0:35 - 1:15** | **Customer Discovery** | Open `http://localhost:5173/`. Browse Now Showing, filter by genre (e.g., Sci-Fi), search for "Inception", view details. | *"Here is the responsive customer portal with smooth Framer Motion animations. Users can search and filter movies, review censor ratings, formats like IMAX 3D, and select from scheduled showtimes across venues."* |
| **1:15 - 2:05** | **Seat Selection & Live Hold** | Click on a showtime. Observe curved screen, seat tiers (Silver, Gold, Platinum). Select seats `A-3` and `A-4`. Click "Hold Seats". | *"Here is our seat selection matrix. Notice the 10-minute hold timer that starts immediately. These seats are locked in MongoDB via pessimistic holds. If another user in an incognito window attempts to select A-3 or A-4, they receive a 409 Conflict."* |
| **2:05 - 2:45** | **Booking Confirmation & QR Pass** | Click "Confirm Booking" (simulated sandbox checkout). View generated ticket with QR code pass. Click "Print Ticket". | *"Booking confirmed! The system atomically generates a unique reference code format BK-XXXXXXXX and renders a scannable high-density QR code pass. The seat hold status is now atomically updated to 'booked'."* |
| **2:45 - 3:30** | **Admin Dashboard & Usher Scanner** | Log out, log in as `admin@cinema.com` / `admin123`. Navigate to Admin Portal -> Bookings. Paste the booking reference in the Usher Scanner. | *"Switching to the operational staff view. The Usher Scanner simulates turnstile entry. Scanning the ticket admits the customer and transitions status to 'used'. If scanned a second time, it is rejected with an alert that the ticket has already been used."* |
| **3:30 - 4:10** | **Occupancy Report & Audit Trail** | Navigate to Dashboard -> Occupancy Report. Point out the live booked count and occupancy percentage. View Audit Logs. | *"Here is the live Occupancy Report. It dynamically recalculates booked vs. available seats without stale cache. If a booking is cancelled, seats are immediately restored and occupancy adjusts. Every business action is logged to the immutable audit trail."* |
| **4:10 - 4:45** | **Automated Test Evidence** | Switch to terminal. Run `npm test`. Show all 31 tests passing, including the 5 official acceptance tests. | *"Finally, our automated test suite runs 31 comprehensive integration tests with Vitest, guaranteeing that all 5 required acceptance criteria pass with 100% reliability. Thank you!"* |

---

## 🧪 Quick Reviewer Checklist (Manual Test Steps)

### Step 1: Start Applications
```bash
# Terminal 1: Start backend
cd cinema-booking/server && npm run dev

# Terminal 2: Start frontend
cd cinema-booking/client && npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

### Step 2: Test Pre-Seeded Accounts
For instant convenience, the login page features **1-click autofill buttons**:
- **Admin Operator:** `admin@cinema.com` / `admin123`
- **Customer User:** `john@example.com` / `password123`

---

### Step 3: Verify the 5 Acceptance Criteria

#### ✅ Acceptance Test 1: Seat Hold & Booking Confirmation
1. Sign in as `john@example.com`.
2. Browse to **Movies** -> Click on any movie -> Pick a showtime.
3. Select an available seat (e.g. `B-1`). Click **"Hold Selected Seats"**.
4. Confirm timer begins counting down from 10:00.
5. Click **"Confirm Booking (Sandbox Payment)"**.
6. Verify ticket pass displays with unique `BK-XXXXXXXX` code and scannable QR code.

#### ✅ Acceptance Test 2: Double-Booking Prevention
1. Open a second browser in **Incognito/Private mode**.
2. Sign in as a different user (or register a new user).
3. Navigate to the same showtime.
4. Verify that the seat booked by John is marked in **red (Booked)** and cannot be clicked.
5. If John is holding a seat, verify it shows as **yellow (Held by another customer)** and is disabled.

#### ✅ Acceptance Test 3: Expired Hold Re-Availability
1. In incognito, select a seat and click "Hold Seats".
2. Wait for hold window or trigger expiry (the server auto-cleans holds every 60 seconds).
3. Notice that once expired, the seat turns green (Available) and can be claimed by any user.

#### ✅ Acceptance Test 4: One-Time Usher Ticket Gate Validation
1. Log in as `admin@cinema.com`.
2. Navigate to **Admin Portal** -> **Bookings & Usher Scanner**.
3. Under the Usher Validation box, paste John's `bookingRef` (e.g., `BK-XXXXXXXX`) or click "Validate".
4. Result: **Ticket validated successfully. Admitted to auditorium.** Status changes to `used`.
5. Enter the same reference again and click Validate.
6. Result: **Rejected** — *"This ticket has already been used on [Timestamp]"*.

#### ✅ Acceptance Test 5: Occupancy Report Consistency
1. In the Admin Portal, open **Dashboard**.
2. Note the total booked seats for that showtime.
3. In customer account, navigate to **My Bookings** -> click **"Cancel Booking"**.
4. Refresh Admin Dashboard: Occupancy immediately decreases by the number of cancelled seats, and available seats increase accordingly.
