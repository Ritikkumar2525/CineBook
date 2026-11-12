import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../src/index';
import SeatHold from '../src/models/SeatHold';
import { releaseExpiredHolds } from '../src/services/seatHoldService';

describe('Official Acceptance Criteria Test Suite', () => {
  let adminToken = '';
  let user1Token = '';
  let user2Token = '';
  let testShowtimeId = '';
  let testSeatId = '';
  let secondSeatId = '';
  let screenTotalSeats = 0;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cinema-booking');
    }

    // Authenticate Admin
    const adminRes = await request(app).post('/api/auth/login').send({
      email: 'admin@cinema.com',
      password: 'admin123',
    });
    adminToken = adminRes.body.token;

    // Register User 1
    const ts1 = Date.now();
    const u1Res = await request(app).post('/api/auth/register').send({
      name: 'User One',
      email: `accept_u1_${ts1}@cinema.test`,
      password: 'password123',
      phone: '9876543210',
    });
    user1Token = u1Res.body.token;

    // Register User 2
    const u2Res = await request(app).post('/api/auth/register').send({
      name: 'User Two',
      email: `accept_u2_${ts1}@cinema.test`,
      password: 'password123',
      phone: '9876543211',
    });
    user2Token = u2Res.body.token;

    // Pick an active future showtime and get seat layout
    const showtimesRes = await request(app).get('/api/showtimes');
    const futureShowtime = showtimesRes.body.data.find((s) => new Date(s.startTime) > new Date()) || showtimesRes.body.data[0];
    testShowtimeId = futureShowtime._id;

    const availRes = await request(app).get(`/api/showtimes/${testShowtimeId}`);
    screenTotalSeats = availRes.body.data.totals.totalSeats;

    // Pick available seats for tests
    const foundSeats = [];
    for (const cat of availRes.body.data.seatCategories) {
      for (const row of cat.rows) {
        for (const seat of row.seats) {
          if (seat.status === 'available') {
            foundSeats.push(seat.seatId);
            if (foundSeats.length >= 5) break;
          }
        }
        if (foundSeats.length >= 5) break;
      }
      if (foundSeats.length >= 5) break;
    }
    testSeatId = foundSeats[0];
    secondSeatId = foundSeats[1];
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  // Acceptance Criterion 1
  it('Criterion 1: An available seat can be held and booked for a show', async () => {
    // Step 1: Hold the available seat
    const holdRes = await request(app)
      .post('/api/bookings/hold')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        showtimeId: testShowtimeId,
        seats: [testSeatId],
      });

    expect(holdRes.status).toBe(200);
    expect(holdRes.body.success).toBe(true);
    expect(holdRes.body).toHaveProperty('expiresAt');
    expect(holdRes.body.data[0].seatId).toBe(testSeatId);
    expect(holdRes.body.data[0].status).toBe('held');

    // Step 2: Confirm booking from held seat
    const bookRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        showtimeId: testShowtimeId,
        seats: [testSeatId],
      });

    expect(bookRes.status).toBe(201);
    expect(bookRes.body.success).toBe(true);
    expect(bookRes.body.data.status).toBe('confirmed');
    expect(bookRes.body.data.bookingRef).toMatch(/^BK-[A-Z0-9]{8}$/);
    expect(bookRes.body.data.qrCode).toMatch(/^data:image\/png;base64,/);
    expect(bookRes.body.data.seats[0].seatId).toBe(testSeatId);
  });

  // Acceptance Criterion 2
  it('Criterion 2: The same seat cannot be confirmed to two users for one show', async () => {
    // testSeatId is now confirmed/booked by user 1.
    // User 2 attempts to hold the same seat:
    const holdRes = await request(app)
      .post('/api/bookings/hold')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({
        showtimeId: testShowtimeId,
        seats: [testSeatId],
      });

    expect([400, 409]).toContain(holdRes.status);
    expect(holdRes.body.success).toBe(false);
    expect(holdRes.body.message).toMatch(/already reserved or held/i);

    // User 2 attempts to bypass hold and book directly:
    const bookRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({
        showtimeId: testShowtimeId,
        seats: [testSeatId],
      });

    expect(bookRes.status).toBe(400);
    expect(bookRes.body.success).toBe(false);
    expect(bookRes.body.message).toMatch(/Seat hold has expired or was not found/);
  });

  // Acceptance Criterion 3
  it('Criterion 3: Expired holds release the seat; confirmed bookings remain unavailable', async () => {
    // 3a. User 2 holds secondSeatId
    const holdRes = await request(app)
      .post('/api/bookings/hold')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({
        showtimeId: testShowtimeId,
        seats: [secondSeatId],
      });
    expect(holdRes.status).toBe(200);

    // Verify seat is currently held (unavailable to others)
    const availDuringHold = await request(app).get(`/api/showtimes/${testShowtimeId}`);
    let holdStatus = null;
    availDuringHold.body.data.seatCategories.forEach((cat) => {
      cat.rows.forEach((r) => {
        const found = r.seats.find((s) => s.seatId === secondSeatId);
        if (found) holdStatus = found.status;
      });
    });
    expect(holdStatus).toBe('held');

    // Manually expire this hold in MongoDB to simulate hold timeout
    await SeatHold.updateOne(
      { showtime: testShowtimeId, seatId: secondSeatId, status: 'held' },
      { $set: { expiresAt: new Date(Date.now() - 1000) } }
    );

    // Call hold cleanup service
    const cleanupResult = await releaseExpiredHolds();
    expect(cleanupResult.releasedCount).toBeGreaterThanOrEqual(1);

    // Check availability: secondSeatId should now be AVAILABLE again
    const availAfterExpiry = await request(app).get(`/api/showtimes/${testShowtimeId}`);
    let seatStatusAfterExpiry = null;
    let confirmedSeatStatus = null;
    availAfterExpiry.body.data.seatCategories.forEach((cat) => {
      cat.rows.forEach((r) => {
        const s2 = r.seats.find((s) => s.seatId === secondSeatId);
        if (s2) seatStatusAfterExpiry = s2.status;
        const s1 = r.seats.find((s) => s.seatId === testSeatId);
        if (s1) confirmedSeatStatus = s1.status;
      });
    });

    // Expired hold was released!
    expect(seatStatusAfterExpiry).toBe('available');
    // Confirmed booking (Criterion 1) remains unavailable / booked!
    expect(confirmedSeatStatus).toBe('booked');
  });

  // Acceptance Criterion 4
  it('Criterion 4: A ticket reference/QR can be validated once in a simulated entry flow', async () => {
    // Pick another seat and book it
    const availRes = await request(app).get(`/api/showtimes/${testShowtimeId}`);
    let freshSeat = null;
    for (const cat of availRes.body.data.seatCategories) {
      for (const row of cat.rows) {
        for (const seat of row.seats) {
          if (seat.status === 'available') {
            freshSeat = seat.seatId;
            break;
          }
        }
        if (freshSeat) break;
      }
      if (freshSeat) break;
    }

    // Hold and book
    await request(app)
      .post('/api/bookings/hold')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ showtimeId: testShowtimeId, seats: [freshSeat] });

    const bookingRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ showtimeId: testShowtimeId, seats: [freshSeat] });

    const ticketRef = bookingRes.body.data.bookingRef;
    expect(ticketRef).toBeTruthy();

    // First validation by usher/admin: SUCCESS
    const firstValidation = await request(app)
      .post('/api/bookings/validate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ bookingRef: ticketRef });

    expect(firstValidation.status).toBe(200);
    expect(firstValidation.body.success).toBe(true);
    expect(firstValidation.body.message).toContain('Ticket validated successfully');
    expect(firstValidation.body.data.status).toBe('used');

    // Second validation attempt: REJECTED (cannot enter twice)
    const secondValidation = await request(app)
      .post('/api/bookings/validate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ bookingRef: ticketRef });

    expect(secondValidation.status).toBe(400);
    expect(secondValidation.body.success).toBe(false);
    expect(secondValidation.body.message).toContain('already been used');
  });

  // Acceptance Criterion 5
  it('Criterion 5: The admin occupancy report matches bookings and cancellations', async () => {
    // Fetch baseline occupancy report for this showtime
    const report1 = await request(app)
      .get(`/api/dashboard/occupancy?showtimeId=${testShowtimeId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const showStat1 = report1.body.data.find((s) => s.showtimeId.toString() === testShowtimeId.toString());
    const initialBooked = showStat1.bookedSeats;

    // Book another seat
    const availRes = await request(app).get(`/api/showtimes/${testShowtimeId}`);
    let seatForOccupancy = null;
    for (const cat of availRes.body.data.seatCategories) {
      for (const row of cat.rows) {
        for (const seat of row.seats) {
          if (seat.status === 'available') {
            seatForOccupancy = seat.seatId;
            break;
          }
        }
        if (seatForOccupancy) break;
      }
      if (seatForOccupancy) break;
    }

    await request(app)
      .post('/api/bookings/hold')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ showtimeId: testShowtimeId, seats: [seatForOccupancy] });

    const bookRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ showtimeId: testShowtimeId, seats: [seatForOccupancy] });

    const bookingId = bookRes.body.data._id;

    // Check report: booked seats must have increased by 1
    const report2 = await request(app)
      .get(`/api/dashboard/occupancy?showtimeId=${testShowtimeId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    const showStat2 = report2.body.data.find((s) => s.showtimeId.toString() === testShowtimeId.toString());
    expect(showStat2.bookedSeats).toBe(initialBooked + 1);

    // Now Cancel the booking
    const cancelRes = await request(app)
      .patch(`/api/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${user2Token}`);
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.status).toBe('cancelled');

    // Check report again: booked seats must have decreased back to initialBooked
    const report3 = await request(app)
      .get(`/api/dashboard/occupancy?showtimeId=${testShowtimeId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    const showStat3 = report3.body.data.find((s) => s.showtimeId.toString() === testShowtimeId.toString());
    expect(showStat3.bookedSeats).toBe(initialBooked);
  });
});
