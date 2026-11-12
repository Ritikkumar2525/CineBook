import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

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
  (response) => response,
  (error) => {
    // 401 Unauthorized handling
    if (error.response && error.response.status === 401) {
      // Optional: if token expired, clean up and redirect if not on login page
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
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
};

// Movies Endpoints
export const moviesApi = {
  getAll: (params) => api.get('/movies', { params }),
  getById: (id) => api.get(`/movies/${id}`),
  create: (movieData) => api.post('/movies', movieData),
  update: (id, movieData) => api.put(`/movies/${id}`, movieData),
  delete: (id) => api.delete(`/movies/${id}`),
  getGenres: () => api.get('/movies/genres'),
};

// Theatres Endpoints
export const theatresApi = {
  getAll: (params) => api.get('/theatres', { params }),
  getById: (id) => api.get(`/theatres/${id}`),
  create: (theatreData) => api.post('/theatres', theatreData),
  update: (id, theatreData) => api.put(`/theatres/${id}`, theatreData),
  delete: (id) => api.delete(`/theatres/${id}`),
};

// Screens Endpoints
export const screensApi = {
  getAll: (params) => api.get('/screens', { params }),
  getById: (id) => api.get(`/screens/${id}`),
  create: (screenData) => api.post('/screens', screenData),
  update: (id, screenData) => api.put(`/screens/${id}`, screenData),
  delete: (id) => api.delete(`/screens/${id}`),
};

// Showtimes Endpoints
export const showtimesApi = {
  getAll: (params) => api.get('/showtimes', { params }),
  getById: (id) => api.get(`/showtimes/${id}`),
  getByMovie: (movieId, params) => api.get(`/showtimes/movie/${movieId}`, { params }),
  create: (showtimeData) => api.post('/showtimes', showtimeData),
  cancel: (id) => api.patch(`/showtimes/${id}/cancel`),
};

// Bookings Endpoints
export const bookingsApi = {
  holdSeats: (data) => api.post('/bookings/hold', data),
  createBooking: (data) => api.post('/bookings', data),
  cancelBooking: (id) => api.patch(`/bookings/${id}/cancel`),
  validateTicket: (bookingRef) => api.post('/bookings/validate', { bookingRef }),
  getMyBookings: (params) => api.get('/bookings/my-bookings', { params }),
  getAll: (params) => api.get('/bookings', { params }),
  getById: (id) => api.get(`/bookings/${id}`),
};

// Meals Endpoints
export const mealsApi = {
  getCatalog: () => api.get('/meals'),
};

// Dashboard Endpoints
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getOccupancy: (params) => api.get('/dashboard/occupancy', { params }),
  getSales: (params) => api.get('/dashboard/sales', { params }),
  getRecentBookings: () => api.get('/dashboard/recent-bookings'),
  getAuditLogs: (params) => api.get('/dashboard/audit-logs', { params }),
};

export default api;
