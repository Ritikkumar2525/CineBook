import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../src/index';

describe('Cinema Hall Booking System Backend API', () => {
  let adminToken = '';
  let customerToken = '';
  let customerUser = null;
  let testMovieId = '';
  let testShowtimeId = '';
  let availableSeatId = '';

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cinema-booking');
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('Health Check Endpoint', () => {
    it('GET /api/health should return status ok', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body).toHaveProperty('uptime');
    });
  });

  describe('Authentication Routes', () => {
    it('POST /api/auth/login should authenticate seeded admin user', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'admin@cinema.com',
        password: 'admin123',
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.role).toBe('admin');
      adminToken = res.body.token;
    });

    it('POST /api/auth/login should authenticate seeded customer user', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'john@example.com',
        password: 'password123',
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.role).toBe('customer');
      customerToken = res.body.token;
      customerUser = res.body.user;
    });

    it('GET /api/auth/me should return current user profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('john@example.com');
    });

    it('POST /api/auth/register should register a new customer', async () => {
      const timestamp = Date.now();
      const res = await request(app).post('/api/auth/register').send({
        name: 'Test Customer',
        email: `testcustomer_${timestamp}@cinema.test`,
        password: 'securePassword123',
        phone: '1234567890',
      });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.role).toBe('customer');
    });
  });

  describe('Movie Routes', () => {
    it('GET /api/movies should return list of movies', async () => {
      const res = await request(app).get('/api/movies');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      testMovieId = res.body.data[0]._id;
    });

    it('GET /api/movies/genres should return distinct genres', async () => {
      const res = await request(app).get('/api/movies/genres');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toContain('Sci-Fi');
    });

    it('GET /api/movies/:id should return single movie', async () => {
      const res = await request(app).get(`/api/movies/${testMovieId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(testMovieId);
    });

    it('POST /api/movies should allow admin to create a movie', async () => {
      const uniqueTitle = `Test Movie ${Date.now()}`;
      const res = await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: uniqueTitle,
          genre: ['Action', 'Drama', 'Adventure'],
          duration: 148,
          language: 'English',
          format: 'IMAX',
          rating: 'A',
          status: 'coming_soon',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(uniqueTitle);

      // Clean up test movie immediately so catalog remains clean
      if (res.body.data?._id) {
        await mongoose.model('Movie').deleteOne({ _id: res.body.data._id });
      }
    });
  });

  describe('Theatres & Screens Routes', () => {
    it('GET /api/theatres should return theatres with screens', async () => {
      const res = await request(app).get('/api/theatres');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('GET /api/screens should return screens', async () => {
      const res = await request(app).get('/api/screens');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Showtimes Routes', () => {
    it('GET /api/showtimes should return showtimes list', async () => {
      const res = await request(app).get('/api/showtimes');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      const future = res.body.data.find((s) => new Date(s.startTime) > new Date()) || res.body.data[0];
      testShowtimeId = future._id;
    });

    it('GET /api/showtimes/:id should return seat availability map', async () => {
      const res = await request(app).get(`/api/showtimes/${testShowtimeId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('seatCategories');
      expect(res.body.data).toHaveProperty('totals');
      expect(res.body.data.totals.totalSeats).toBeGreaterThan(0);

      // Find an available seat dynamically
      for (const cat of res.body.data.seatCategories) {
        for (const row of cat.rows) {
          for (const seat of row.seats) {
            if (seat.status === 'available') {
              availableSeatId = seat.seatId;
              break;
            }
          }
          if (availableSeatId) break;
        }
        if (availableSeatId) break;
      }
      expect(availableSeatId).toBeTruthy();
    });

    it('GET /api/showtimes/movie/:movieId should group by theatre', async () => {
      const res = await request(app).get(`/api/showtimes/movie/${testMovieId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('theatres');
    });

    it('POST /api/showtimes should reject overlapping showtime on same screen', async () => {
      const existingShow = (await request(app).get('/api/showtimes')).body.data[0];
      const res = await request(app)
        .post('/api/showtimes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          movie: existingShow.movie._id,
          screen: existingShow.screen._id,
          startTime: existingShow.startTime,
          endTime: existingShow.endTime,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Conflict detected');
    });
  });

  describe('Seat Hold & Booking Lifecycle', () => {
    let createdBookingRef = '';
    let createdBookingId = '';

    it('POST /api/bookings/hold should hold available seats', async () => {
      // Refresh available seat in case prior tests booked seats
      const avail = await request(app).get(`/api/showtimes/${testShowtimeId}`);
      for (const cat of avail.body.data.seatCategories) {
        for (const row of cat.rows) {
          for (const seat of row.seats) {
            if (seat.status === 'available') {
              availableSeatId = seat.seatId;
              break;
            }
          }
          if (availableSeatId) break;
        }
        if (availableSeatId) break;
      }

      const res = await request(app)
        .post('/api/bookings/hold')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          showtimeId: testShowtimeId,
          seats: [availableSeatId],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('expiresAt');
      expect(res.body.data[0].seatId).toBe(availableSeatId);
    });

    it('POST /api/bookings should confirm booking from held seats', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          showtimeId: testShowtimeId,
          seats: [availableSeatId],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('bookingRef');
      expect(res.body.data.status).toBe('confirmed');
      expect(res.body.data).toHaveProperty('qrCode');
      createdBookingRef = res.body.data.bookingRef;
      createdBookingId = res.body.data._id;
    });

    it('POST /api/bookings/validate should allow admin to validate confirmed ticket', async () => {
      const res = await request(app)
        .post('/api/bookings/validate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bookingRef: createdBookingRef,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('used');
    });

    it('POST /api/bookings/validate should reject already used ticket', async () => {
      const res = await request(app)
        .post('/api/bookings/validate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bookingRef: createdBookingRef,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already been used');
    });

    it('GET /api/bookings/my-bookings should list customer bookings', async () => {
      const res = await request(app)
        .get('/api/bookings/my-bookings')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('PATCH /api/bookings/:id/cancel should cancel a confirmed booking', async () => {
      // Find another available seat for booking and cancellation
      const availRes = await request(app).get(`/api/showtimes/${testShowtimeId}`);
      let seatToCancel = '';
      for (const cat of availRes.body.data.seatCategories) {
        for (const row of cat.rows) {
          for (const seat of row.seats) {
            if (seat.status === 'available') {
              seatToCancel = seat.seatId;
              break;
            }
          }
          if (seatToCancel) break;
        }
        if (seatToCancel) break;
      }

      await request(app)
        .post('/api/bookings/hold')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          showtimeId: testShowtimeId,
          seats: [seatToCancel],
        });

      const bookRes = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          showtimeId: testShowtimeId,
          seats: [seatToCancel],
        });

      const cancelBookingId = bookRes.body.data._id;

      const cancelRes = await request(app)
        .patch(`/api/bookings/${cancelBookingId}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.success).toBe(true);
      expect(cancelRes.body.data.status).toBe('cancelled');
      expect(cancelRes.body.data.paymentStatus).toBe('refunded');
    });
  });

  describe('Dashboard & Analytics Routes', () => {
    it('GET /api/dashboard/stats should return aggregated statistics for admin', async () => {
      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('movies');
      expect(res.body.data).toHaveProperty('theatres');
      expect(res.body.data).toHaveProperty('revenue');
    });

    it('GET /api/dashboard/stats should reject non-admin users with 403', async () => {
      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/dashboard/occupancy should return screen occupancy details', async () => {
      const res = await request(app)
        .get('/api/dashboard/occupancy')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/dashboard/sales should return sales breakdown', async () => {
      const res = await request(app)
        .get('/api/dashboard/sales')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('summary');
    });

    it('GET /api/dashboard/audit-logs should return audit trail', async () => {
      const res = await request(app)
        .get('/api/dashboard/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('logs');
      expect(res.body.logs.length).toBeGreaterThan(0);
    });
  });

  describe('In-Seat Meals & Snacks Routes', () => {
    it('GET /api/meals should return complete dining catalog and categories', async () => {
      const res = await request(app).get('/api/meals');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.categories.length).toBeGreaterThan(0);
    });

    it('GET /api/meals should filter items by category', async () => {
      const res = await request(app).get('/api/meals?category=Popcorn+%26+Nachos');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      res.body.data.forEach((item) => {
        expect(item.category).toBe('Popcorn & Nachos');
      });
    });

    it('POST /api/bookings should successfully confirm booking with in-seat meal orders', async () => {
      // Find a fresh available future showtime
      const showtimesRes = await request(app).get('/api/showtimes');
      const future = showtimesRes.body.data.find((s) => new Date(s.startTime) > new Date());
      const showId = future._id;

      const availRes = await request(app).get(`/api/showtimes/${showId}`);
      let mealSeat = null;
      for (const cat of availRes.body.data.seatCategories) {
        for (const row of cat.rows) {
          for (const s of row.seats) {
            if (s.status === 'available') {
              mealSeat = s.seatId;
              break;
            }
          }
          if (mealSeat) break;
        }
        if (mealSeat) break;
      }

      // Hold the seat
      await request(app)
        .post('/api/bookings/hold')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ showtimeId: showId, seats: [mealSeat] });

      // Book with in-seat meals
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          showtimeId: showId,
          seats: [mealSeat],
          mealOrders: [
            { itemId: 'popcorn-salted-reg', quantity: 1 },
            { itemId: 'drink-cola-fountain', quantity: 2 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.mealOrders.length).toBe(2);
      expect(res.body.data.mealTotal).toBe(180 + 120 * 2); // 420
      expect(res.body.data.totalAmount).toBeGreaterThan(res.body.data.mealTotal);
    });
  });
});
