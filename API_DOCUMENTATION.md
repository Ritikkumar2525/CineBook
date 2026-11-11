# 📖 Cinema Hall Ticket Booking System — API Documentation

Interactive API Reference UI is accessible locally at:
👉 **`http://localhost:5000/api/docs`** (Powered by Scalar & OpenAPI 3.0.3)
Raw OpenAPI Specification: `http://localhost:5000/api/docs/openapi.json`

---

## Base Configuration

- **Base URL:** `http://localhost:5000/api`
- **Authentication:** Bearer token in the `Authorization` header
  ```http
  Authorization: Bearer <your_jwt_token>
  ```
- **Content Type:** `application/json`

---

## 1. Authentication Endpoints

### 1.1 Register Customer
Create a new customer account.
- **Method:** `POST`
- **Path:** `/api/auth/register`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "name": "Sarah Connor",
    "email": "sarah@example.com",
    "password": "securePassword123",
    "phone": "9876543210"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "6732f91a...",
      "name": "Sarah Connor",
      "email": "sarah@example.com",
      "role": "customer"
    }
  }
  ```

### 1.2 User Login
Authenticate credentials and receive a JWT.
- **Method:** `POST`
- **Path:** `/api/auth/login`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "email": "admin@cinema.com",
    "password": "admin123"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "6732f91a...",
      "name": "Super Admin",
      "email": "admin@cinema.com",
      "role": "admin"
    }
  }
  ```

### 1.3 Get Current Profile
Fetch authenticated user information.
- **Method:** `GET`
- **Path:** `/api/auth/me`
- **Access:** Private (Customer or Admin)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "user": {
      "_id": "6732f91a...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer"
    }
  }
  ```

---

## 2. Movies Catalog

### 2.1 List Movies (Browse & Filter)
- **Method:** `GET`
- **Path:** `/api/movies`
- **Access:** Public
- **Query Parameters:**
  - `search`: Case-insensitive title search (e.g. `?search=inception`)
  - `genre`: Filter by genre (e.g. `?genre=Sci-Fi`)
  - `language`: Filter by language (e.g. `?language=English`)
  - `format`: Filter by format (`2D`, `3D`, `IMAX`, `4DX`)
  - `status`: Filter by status (`now_showing`, `coming_soon`, `ended`)
  - `page`: Page index (default: `1`)
  - `limit`: Items per page (default: `12`)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "count": 6,
    "pagination": { "page": 1, "limit": 12, "totalPages": 1, "totalItems": 6 },
    "data": [
      {
        "_id": "6732...",
        "title": "Interstellar",
        "genre": ["Sci-Fi", "Drama", "Adventure"],
        "duration": 169,
        "language": "English",
        "format": "IMAX",
        "rating": "UA",
        "posterUrl": "https://...",
        "status": "now_showing"
      }
    ]
  }
  ```

### 2.2 Add Movie
- **Method:** `POST`
- **Path:** `/api/movies`
- **Access:** Private/Admin
- **Request Body:**
  ```json
  {
    "title": "Gladiator II",
    "description": "Years after witnessing the death of Maximus...",
    "genre": ["Action", "Drama"],
    "duration": 148,
    "language": "English",
    "format": "IMAX",
    "rating": "A",
    "posterUrl": "https://...",
    "status": "now_showing",
    "releaseDate": "2024-11-15T00:00:00.000Z"
  }
  ```
- **Response (201 Created):** `{ "success": true, "data": { ... } }`

---

## 3. Showtimes & Seating Discovery

### 3.1 Get Showtime Details with Live Seating Grid
Returns the auditorium layout with live seat status (`available`, `held`, `booked`).
- **Method:** `GET`
- **Path:** `/api/showtimes/:id`
- **Access:** Public
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "_id": "6732...",
      "movie": { "title": "Inception", "duration": 148, "format": "IMAX" },
      "screen": { "name": "Screen 1 - IMAX 3D", "screenType": "IMAX" },
      "startTime": "2024-11-12T18:00:00.000Z",
      "endTime": "2024-11-12T20:43:00.000Z",
      "seatCategories": [
        {
          "name": "Platinum",
          "price": 450,
          "rows": [
            {
              "row": "A",
              "seats": [
                { "seatId": "A-1", "status": "available", "isHeldByCurrentUser": false },
                { "seatId": "A-2", "status": "booked", "isHeldByCurrentUser": false },
                { "seatId": "A-3", "status": "held", "isHeldByCurrentUser": true }
              ]
            }
          ]
        }
      ],
      "totals": {
        "totalSeats": 60,
        "availableSeats": 58,
        "heldSeats": 1,
        "bookedSeats": 1
      }
    }
  }
  ```

### 3.2 Schedule Showtime (With Conflict Guard)
- **Method:** `POST`
- **Path:** `/api/showtimes`
- **Access:** Private/Admin
- **Request Body:**
  ```json
  {
    "movie": "6732...",
    "screen": "6732...",
    "startTime": "2024-11-15T14:30:00.000Z"
  }
  ```
- **Response (400 Bad Request on Overlap Conflict):**
  ```json
  {
    "success": false,
    "message": "Conflict detected: Screen 1 is already booked from 14:00 to 17:00."
  }
  ```

---

## 4. Seat Hold & Transactional Booking Workflow

### 4.1 Hold Seats (Acceptance Test #1 & #2)
Locks seats for 10 minutes.
- **Method:** `POST`
- **Path:** `/api/bookings/hold`
- **Access:** Private (Customer or Admin)
- **Request Body:**
  ```json
  {
    "showtimeId": "6732...",
    "seats": ["A-4", "A-5"]
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "expiresAt": "2024-11-12T18:15:00.000Z",
    "expiresInSeconds": 600,
    "data": [
      { "seatId": "A-4", "status": "held", "expiresAt": "2024-11-12T18:15:00.000Z" },
      { "seatId": "A-5", "status": "held", "expiresAt": "2024-11-12T18:15:00.000Z" }
    ]
  }
  ```
- **Response (409 Conflict):**
  ```json
  {
    "success": false,
    "message": "The following seats are already reserved or held by another user: A-4"
  }
  ```

### 4.2 Confirm Booking & Issue Ticket (Acceptance Test #1)
Converts active holds to a confirmed booking, creates simulated payment, and generates ticket token & QR code pass.
- **Method:** `POST`
- **Path:** `/api/bookings`
- **Access:** Private (Customer or Admin)
- **Request Body:**
  ```json
  {
    "showtimeId": "6732...",
    "seats": ["A-4", "A-5"]
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "_id": "6732...",
      "bookingRef": "BK-9X4KM2L7",
      "user": { "name": "John Doe", "email": "john@example.com" },
      "showtime": {
        "movie": { "title": "Inception" },
        "screen": { "name": "Screen 1" },
        "startTime": "2024-11-12T18:00:00.000Z"
      },
      "seats": [
        { "seatId": "A-4", "category": "Platinum", "price": 450 },
        { "seatId": "A-5", "category": "Platinum", "price": 450 }
      ],
      "totalAmount": 900,
      "status": "confirmed",
      "paymentStatus": "completed",
      "qrCode": "data:image/png;base64,iVBORw0KGgo...",
      "createdAt": "2024-11-12T18:05:00.000Z"
    }
  }
  ```

### 4.3 Validate Ticket at Usher Gate (Acceptance Test #4)
Simulates ticket scanner terminal at cinema entrance. Accepts QR reference and ensures one-time admission.
- **Method:** `POST`
- **Path:** `/api/bookings/validate`
- **Access:** Private/Admin
- **Request Body:**
  ```json
  {
    "bookingRef": "BK-9X4KM2L7"
  }
  ```
- **Response (200 OK — First Admission):**
  ```json
  {
    "success": true,
    "message": "Ticket validated successfully. Admitted to auditorium.",
    "data": {
      "bookingRef": "BK-9X4KM2L7",
      "status": "used",
      "usedAt": "2024-11-12T18:45:00.000Z"
    }
  }
  ```
- **Response (400 Bad Request — Subsequent Attempt):**
  ```json
  {
    "success": false,
    "message": "This ticket has already been used on 2024-11-12T18:45:00.000Z."
  }
  ```

### 4.4 Cancel Booking & Simulate Refund
- **Method:** `PATCH`
- **Path:** `/api/bookings/:id/cancel`
- **Access:** Private (Owner Customer or Admin)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Booking cancelled and refund processed.",
    "data": {
      "bookingRef": "BK-9X4KM2L7",
      "status": "cancelled",
      "paymentStatus": "refunded",
      "cancelledAt": "2024-11-12T18:10:00.000Z"
    }
  }
  ```

---

## 5. Admin Analytics & Audit Trail

### 5.1 Real-Time Occupancy Report (Acceptance Test #5)
- **Method:** `GET`
- **Path:** `/api/dashboard/occupancy`
- **Access:** Private/Admin
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "count": 10,
    "data": [
      {
        "showtimeId": "6732...",
        "movieTitle": "Inception",
        "theatreName": "PVR ICON Palladium",
        "screenName": "Screen 1 - IMAX 3D",
        "startTime": "2024-11-12T18:00:00.000Z",
        "totalSeats": 60,
        "bookedSeats": 12,
        "availableSeats": 48,
        "occupancyPercentage": 20.0
      }
    ]
  }
  ```

### 5.2 Financial Sales Analytics
- **Method:** `GET`
- **Path:** `/api/dashboard/sales`
- **Access:** Private/Admin
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "summary": { "totalRevenue": 24500, "totalBookings": 38, "totalTickets": 74 },
      "byMovie": [
        { "movieTitle": "Inception", "revenue": 14500, "ticketsSold": 32 }
      ],
      "dailyTrend": [
        { "_id": "2024-11-12", "revenue": 3600, "bookings": 4 }
      ]
    }
  }
  ```

### 5.3 Security & Operational Audit Log
- **Method:** `GET`
- **Path:** `/api/dashboard/audit-logs`
- **Access:** Private/Admin
- **Query Parameters:** `action`, `entityType`, `page`, `limit`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "logs": [
      {
        "_id": "6732...",
        "action": "CREATE_BOOKING",
        "entityType": "Booking",
        "entityId": "6732...",
        "details": { "bookingRef": "BK-9X4KM2L7", "totalAmount": 900, "seats": ["A-4", "A-5"] },
        "ipAddress": "127.0.0.1",
        "createdAt": "2024-11-12T18:05:00.000Z"
      }
    ]
  }
  ```
