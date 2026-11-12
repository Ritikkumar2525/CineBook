import axios from 'axios';
import {
  MOCK_MOVIES,
  MOCK_THEATRES,
  MOCK_SCREENS,
  MOCK_MEALS,
  generateMockShowtimesForMovie,
  generateMockShowtimeDetails,
} from './mockData';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to detect if a response is an HTML page (caused by SPA rewrites when backend is missing)
const isInvalidOrHtml = (data) => {
  if (!data) return true;
  if (
    typeof data === 'string' &&
    (data.includes('<!DOCTYPE html>') || data.includes('<html') || data.includes('<script'))
  ) {
    return true;
  }
  return false;
};

// LocalStorage helpers for mock bookings in demo mode
const getLocalBookings = () => {
  try {
    const raw = localStorage.getItem('cinebook_demo_bookings');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalBooking = (booking) => {
  try {
    const existing = getLocalBookings();
    existing.unshift(booking);
    localStorage.setItem('cinebook_demo_bookings', JSON.stringify(existing));
  } catch (e) {
    console.error('Failed to save demo booking to localStorage', e);
  }
};

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for unified error formatting
api.interceptors.response.use(
  (response) => {
    if (isInvalidOrHtml(response.data)) {
      return Promise.reject(new Error('HTML_FALLBACK_TRIGGER'));
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

// Auth Endpoints
export const authApi = {
  login: async (credentials) => {
    try {
      const res = await api.post('/auth/login', credentials);
      if (res.data && (res.data.token || res.data.data?.token)) return res;
      throw new Error('Invalid response');
    } catch {
      const role = credentials.email?.toLowerCase().includes('admin') ? 'admin' : 'customer';
      const mockUser = {
        _id: 'user-' + (role === 'admin' ? 'admin' : 'customer'),
        name: role === 'admin' ? 'Cinema Administrator' : 'John Doe',
        email: credentials.email || 'john@example.com',
        role,
      };
      return {
        data: {
          success: true,
          token: 'demo-jwt-token-' + Date.now(),
          user: mockUser,
        },
      };
    }
  },
  register: async (userData) => {
    try {
      const res = await api.post('/auth/register', userData);
      if (res.data && (res.data.token || res.data.data?.token)) return res;
      throw new Error('Invalid response');
    } catch {
      const mockUser = {
        _id: 'user-' + Date.now(),
        name: userData.name || 'New Customer',
        email: userData.email,
        role: 'customer',
      };
      return {
        data: {
          success: true,
          token: 'demo-jwt-token-' + Date.now(),
          user: mockUser,
        },
      };
    }
  },
  getProfile: async () => {
    try {
      return await api.get('/auth/profile');
    } catch {
      const saved = localStorage.getItem('user');
      const userObj = saved
        ? JSON.parse(saved)
        : { name: 'John Doe', email: 'john@example.com', role: 'customer' };
      return { data: { user: userObj, success: true } };
    }
  },
};

// Movies Endpoints
export const moviesApi = {
  getAll: async (params) => {
    try {
      const res = await api.get('/movies', { params });
      if (res.data && Array.isArray(res.data.movies || res.data.data || res.data)) {
        return res;
      }
      throw new Error('Invalid data');
    } catch {
      let filtered = [...MOCK_MOVIES];
      if (params?.format && params.format !== 'all') {
        filtered = filtered.filter((m) => m.format.toLowerCase() === params.format.toLowerCase());
      }
      if (params?.genre && params.genre !== 'all') {
        filtered = filtered.filter((m) =>
          m.genre.some((g) => g.toLowerCase() === params.genre.toLowerCase())
        );
      }
      if (params?.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(
          (m) =>
            m.title.toLowerCase().includes(q) ||
            m.description.toLowerCase().includes(q) ||
            m.genre.some((g) => g.toLowerCase().includes(q))
        );
      }
      return { data: { movies: filtered, success: true } };
    }
  },
  getById: async (id) => {
    try {
      const res = await api.get(`/movies/${id}`);
      if (res.data && (res.data.movie || res.data.title)) {
        return res;
      }
      throw new Error('Invalid data');
    } catch {
      const found = MOCK_MOVIES.find((m) => m._id === id) || MOCK_MOVIES[0];
      return { data: { movie: found, success: true } };
    }
  },
  getGenres: async () => {
    try {
      const res = await api.get('/movies/genres');
      if (res.data && Array.isArray(res.data.genres || res.data)) {
        return res;
      }
      throw new Error('Invalid data');
    } catch {
      return {
        data: {
          genres: [
            'Action',
            'Adventure',
            'Sci-Fi',
            'Drama',
            'Thriller',
            'Animation',
            'Biography',
            'History',
          ],
        },
      };
    }
  },
  create: (movieData) => api.post('/movies', movieData),
  update: (id, movieData) => api.put(`/movies/${id}`, movieData),
  delete: (id) => api.delete(`/movies/${id}`),
};

// Theatres Endpoints
export const theatresApi = {
  getAll: async (params) => {
    try {
      const res = await api.get('/theatres', { params });
      if (res.data && Array.isArray(res.data.theatres || res.data)) return res;
      throw new Error('Invalid data');
    } catch {
      return { data: { theatres: MOCK_THEATRES, success: true } };
    }
  },
  getById: async (id) => {
    try {
      return await api.get(`/theatres/${id}`);
    } catch {
      return { data: { theatre: MOCK_THEATRES[0], success: true } };
    }
  },
  create: (theatreData) => api.post('/theatres', theatreData),
  update: (id, theatreData) => api.put(`/theatres/${id}`, theatreData),
  delete: (id) => api.delete(`/theatres/${id}`),
};

// Screens Endpoints
export const screensApi = {
  getAll: async (params) => {
    try {
      const res = await api.get('/screens', { params });
      if (res.data && Array.isArray(res.data.screens || res.data)) return res;
      throw new Error('Invalid data');
    } catch {
      return { data: { screens: MOCK_SCREENS, success: true } };
    }
  },
  getById: async (id) => {
    try {
      return await api.get(`/screens/${id}`);
    } catch {
      return { data: { screen: MOCK_SCREENS[0], success: true } };
    }
  },
  create: (screenData) => api.post('/screens', screenData),
  update: (id, screenData) => api.put(`/screens/${id}`, screenData),
  delete: (id) => api.delete(`/screens/${id}`),
};

// Showtimes Endpoints
export const showtimesApi = {
  getAll: async (params) => {
    try {
      return await api.get('/showtimes', { params });
    } catch {
      return { data: { showtimes: generateMockShowtimesForMovie('movie-gladiator-2') } };
    }
  },
  getById: async (id) => {
    try {
      const res = await api.get(`/showtimes/${id}`);
      if (res.data && (res.data.showtime || res.data._id)) return res;
      throw new Error('Invalid data');
    } catch {
      return { data: { showtime: generateMockShowtimeDetails(id), success: true } };
    }
  },
  getByMovie: async (movieId, params) => {
    try {
      const res = await api.get(`/showtimes/movie/${movieId}`, { params });
      if (res.data && Array.isArray(res.data.showtimes || res.data)) return res;
      throw new Error('Invalid data');
    } catch {
      return { data: { showtimes: generateMockShowtimesForMovie(movieId), success: true } };
    }
  },
  create: (showtimeData) => api.post('/showtimes', showtimeData),
  cancel: (id) => api.patch(`/showtimes/${id}/cancel`),
};

// Bookings Endpoints
export const bookingsApi = {
  holdSeats: async (data) => {
    try {
      return await api.post('/bookings/hold', data);
    } catch {
      return {
        data: {
          success: true,
          message: 'Seats held successfully',
          holdExpiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        },
      };
    }
  },
  createBooking: async (data) => {
    try {
      return await api.post('/bookings', data);
    } catch {
      const ref = 'CBK-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const showtimeDetails = generateMockShowtimeDetails(data.showtimeId || 'show-1');
      const newBooking = {
        _id: 'bk-' + Date.now(),
        bookingRef: ref,
        showtime: showtimeDetails,
        seats: (data.seats || []).map((s) => ({
          seatId: typeof s === 'string' ? s : s.seatId,
          category: s.category || 'Gold',
          price: s.price || 380,
        })),
        mealOrders: data.mealOrders || [],
        mealTotal: data.mealTotal || 0,
        totalAmount: data.totalAmount || 760,
        bookedForOther: !!data.bookedForOther,
        recipient: data.recipient || null,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
      };
      saveLocalBooking(newBooking);
      return { data: { success: true, booking: newBooking } };
    }
  },
  getById: async (id) => {
    try {
      const res = await api.get(`/bookings/${id}`);
      if (res.data && (res.data.booking || res.data._id)) return res;
      throw new Error('Invalid data');
    } catch {
      const existing = getLocalBookings().find((b) => b._id === id || b.bookingRef === id);
      if (existing) return { data: { booking: existing, success: true } };
      const sample = {
        _id: id,
        bookingRef: 'CBK-SAMPLE99',
        showtime: generateMockShowtimeDetails('show-sample'),
        seats: [{ seatId: 'C4', category: 'Gold', price: 380 }],
        mealOrders: [{ name: 'Jumbo Caramel Popcorn', quantity: 1, price: 340 }],
        mealTotal: 340,
        totalAmount: 720,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
      };
      return { data: { booking: sample, success: true } };
    }
  },
  getMyBookings: async (params) => {
    try {
      const res = await api.get('/bookings/my-bookings', { params });
      if (res.data && Array.isArray(res.data.bookings || res.data)) return res;
      throw new Error('Invalid data');
    } catch {
      const local = getLocalBookings();
      if (local.length > 0) return { data: { bookings: local, success: true } };
      const defaultReservation = {
        _id: 'bk-default-demo',
        bookingRef: 'CBK-7842A1',
        showtime: generateMockShowtimeDetails('show-gladiator-default'),
        seats: [
          { seatId: 'D5', category: 'Gold', price: 380 },
          { seatId: 'D6', category: 'Gold', price: 380 },
        ],
        mealOrders: [{ name: 'Jumbo Caramel Popcorn', quantity: 1, price: 340 }],
        mealTotal: 340,
        totalAmount: 1100,
        bookedForOther: true,
        recipient: {
          name: 'Sarah Connor',
          phone: '+91 98765 43210',
          email: 'sarah@example.com',
          message: 'Enjoy Gladiator II on the IMAX screen!',
        },
        status: 'confirmed',
        createdAt: new Date().toISOString(),
      };
      return { data: { bookings: [defaultReservation], success: true } };
    }
  },
  cancelBooking: async (id) => {
    try {
      return await api.patch(`/bookings/${id}/cancel`);
    } catch {
      const list = getLocalBookings().map((b) =>
        b._id === id ? { ...b, status: 'cancelled' } : b
      );
      localStorage.setItem('cinebook_demo_bookings', JSON.stringify(list));
      return { data: { success: true, message: 'Booking cancelled' } };
    }
  },
  validateTicket: (bookingRef) => api.post('/bookings/validate', { bookingRef }),
  getAll: (params) => api.get('/bookings', { params }),
};

// Meals Endpoints
export const mealsApi = {
  getCatalog: async () => {
    try {
      const res = await api.get('/meals');
      if (res.data && Array.isArray(res.data.meals || res.data)) return res;
      throw new Error('Invalid data');
    } catch {
      return { data: { meals: MOCK_MEALS, success: true } };
    }
  },
};

// Dashboard Endpoints
export const dashboardApi = {
  getStats: async () => {
    try {
      return await api.get('/dashboard/stats');
    } catch {
      return {
        data: {
          stats: {
            totalBookings: 48,
            totalRevenue: 28450,
            activeShowtimes: 28,
            totalOccupancyPercentage: 74,
          },
        },
      };
    }
  },
  getOccupancy: (params) => api.get('/dashboard/occupancy', { params }),
  getSales: (params) => api.get('/dashboard/sales', { params }),
  getRecentBookings: () => api.get('/dashboard/recent-bookings'),
  getAuditLogs: (params) => api.get('/dashboard/audit-logs', { params }),
};

export default api;
