import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';

// Layouts
import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';
import ProtectedRoute from './components/ui/ProtectedRoute';

// Customer Pages
import HomePage from './pages/customer/HomePage';
import MoviesPage from './pages/customer/MoviesPage';
import MovieDetailPage from './pages/customer/MovieDetailPage';
import SeatSelectionPage from './pages/customer/SeatSelectionPage';
import BookingConfirmationPage from './pages/customer/BookingConfirmationPage';
import MyBookingsPage from './pages/customer/MyBookingsPage';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Admin Pages
import DashboardPage from './pages/admin/DashboardPage';
import ManageMoviesPage from './pages/admin/ManageMoviesPage';
import ManageTheatresPage from './pages/admin/ManageTheatresPage';
import ManageScreensPage from './pages/admin/ManageScreensPage';
import ManageShowtimesPage from './pages/admin/ManageShowtimesPage';
import ManageBookingsPage from './pages/admin/ManageBookingsPage';
import AuditLogPage from './pages/admin/AuditLogPage';

export const App = () => {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#0f172a',
            color: '#f8fafc',
            border: '1px solid #334155',
            borderRadius: '12px',
            fontSize: '13px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />

      <Routes>
        {/* Customer & Public Routes in Layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="movies" element={<MoviesPage />} />
          <Route path="movies/:id" element={<MovieDetailPage />} />
          <Route
            path="booking/:showtimeId"
            element={
              <ProtectedRoute>
                <SeatSelectionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="booking/confirmation/:bookingId"
            element={
              <ProtectedRoute>
                <BookingConfirmationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="my-bookings"
            element={
              <ProtectedRoute>
                <MyBookingsPage />
              </ProtectedRoute>
            }
          />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>

        {/* Admin Routes wrapped in AdminLayout and ProtectedRoute(admin) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="movies" element={<ManageMoviesPage />} />
          <Route path="theatres" element={<ManageTheatresPage />} />
          <Route path="screens" element={<ManageScreensPage />} />
          <Route path="showtimes" element={<ManageShowtimesPage />} />
          <Route path="bookings" element={<ManageBookingsPage />} />
          <Route path="audit-logs" element={<AuditLogPage />} />
        </Route>

        {/* 404 Catch All */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;
