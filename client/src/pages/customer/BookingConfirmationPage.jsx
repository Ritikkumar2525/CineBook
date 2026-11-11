import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  Printer,
  Ticket,
  Calendar,
  Clock,
  MapPin,
  Tv,
  ArrowLeft,
  Download,
  Share2
} from 'lucide-react';
import { bookingsApi } from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import toast from 'react-hot-toast';

export const BookingConfirmationPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      const res = await bookingsApi.getById(bookingId);
      const data = res.data?.booking || res.data?.data || res.data;
      setBooking(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load booking:', err);
      setError('Could not retrieve booking details.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading booking ticket..." />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="bg-dark-900 border border-dark-800 rounded-3xl p-8">
          <Ticket className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">{error || 'Booking Not Found'}</h2>
          <p className="text-dark-400 text-sm mb-6">
            The booking reference was not found or you may not have permission to view it.
          </p>
          <Link
            to="/my-bookings"
            className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold text-sm transition-all"
          >
            Go to My Bookings
          </Link>
        </div>
      </div>
    );
  }

  const movie = booking.movie || booking.showtime?.movie || {};
  const theatre = booking.theatre || booking.showtime?.theatre || {};
  const screen = booking.screen || booking.showtime?.screen || {};
  const showtime = booking.showtime || {};

  const startTime = showtime.startTime ? new Date(showtime.startTime) : null;
  const bookingDate = booking.createdAt ? new Date(booking.createdAt) : new Date();

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Top Success Animation */}
        <div className="text-center mb-8 print:hidden">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-950/30"
          >
            <CheckCircle className="w-12 h-12" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-black text-white tracking-tight"
          >
            Booking Confirmed!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-dark-400 text-sm mt-1"
          >
            Your electronic cinema pass is ready. Present the QR code at the cinema entry gate.
          </motion.p>
        </div>

        {/* Action Buttons Top */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Link
            to="/my-bookings"
            className="flex items-center space-x-1.5 text-xs font-semibold text-dark-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All My Bookings</span>
          </Link>

          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-dark-800 hover:bg-dark-700 border border-dark-700/80 transition-all shadow-md"
          >
            <Printer className="w-4 h-4 text-primary-400" />
            <span>Print Ticket</span>
          </button>
        </div>

        {/* Printable Ticket Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-dark-900 border border-dark-700/80 rounded-3xl overflow-hidden shadow-2xl relative"
        >
          {/* Ticket Header */}
          <div className="bg-gradient-to-r from-primary-900 via-primary-800 to-indigo-950 p-6 sm:p-8 text-white relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-widest font-black text-primary-300">
                CineBook Cinema Ticket
              </span>
              <Badge status={booking.status || 'confirmed'} />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
              {movie.title || 'Cinema Movie'}
            </h2>

            <div className="flex flex-wrap items-center gap-3 text-xs text-primary-200">
              {movie.format && (
                <span className="px-2.5 py-0.5 rounded bg-black/30 font-bold border border-white/20">
                  {movie.format}
                </span>
              )}
              {movie.language && (
                <span className="px-2.5 py-0.5 rounded bg-black/30 font-semibold border border-white/20">
                  {movie.language}
                </span>
              )}
              {movie.duration && <span>{movie.duration} mins</span>}
            </div>
          </div>

          {/* Ticket Middle: Perforated Tear Line Effect */}
          <div className="relative py-2 bg-dark-900 flex items-center justify-between">
            <div className="w-6 h-6 rounded-full bg-dark-950 -ml-3 border-r border-dark-700/80" />
            <div className="flex-1 border-t-2 border-dashed border-dark-700/80 mx-2" />
            <div className="w-6 h-6 rounded-full bg-dark-950 -mr-3 border-l border-dark-700/80" />
          </div>

          {/* Ticket Body */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-dark-400 uppercase font-bold tracking-wider text-[10px]">
                  Theatre & Location
                </span>
                <p className="text-white font-bold text-sm mt-0.5">
                  {theatre.name || 'CineBook Main Cinema'}
                </p>
                <p className="text-dark-400 text-xs">{theatre.location || 'Downtown'}</p>
              </div>

              <div>
                <span className="text-dark-400 uppercase font-bold tracking-wider text-[10px]">
                  Auditorium
                </span>
                <p className="text-white font-bold text-sm mt-0.5">
                  {screen.name || 'Screen 1'}
                </p>
                <p className="text-dark-400 text-xs">Dolby Atmos Surround</p>
              </div>

              <div>
                <span className="text-dark-400 uppercase font-bold tracking-wider text-[10px]">
                  Date & Time
                </span>
                <p className="text-white font-bold text-sm mt-0.5">
                  {startTime
                    ? startTime.toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'N/A'}
                </p>
                <p className="text-primary-400 font-semibold text-xs">
                  {startTime
                    ? startTime.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })
                    : 'N/A'}
                </p>
              </div>

              <div>
                <span className="text-dark-400 uppercase font-bold tracking-wider text-[10px]">
                  Booked Seats
                </span>
                <p className="text-white font-black text-base mt-0.5">
                  {(booking.seats || []).map((s) => s.seatNumber).join(', ') || 'N/A'}
                </p>
                <p className="text-dark-400 text-xs">
                  {booking.seats?.length || 0} Seat(s) Reserved
                </p>
              </div>
            </div>

            {/* Financial summary */}
            <div className="pt-4 border-t border-dark-800 flex justify-between items-center text-xs">
              <div>
                <span className="text-dark-400 uppercase tracking-wider text-[10px] font-bold">
                  Total Paid
                </span>
                <p className="text-xl font-black text-emerald-400 mt-0.5">
                  ₹{booking.totalAmount || 0}
                </p>
              </div>
              <div className="text-right">
                <span className="text-dark-400 uppercase tracking-wider text-[10px] font-bold">
                  Booking Reference
                </span>
                <p className="text-sm font-mono font-bold text-primary-400 mt-0.5 tracking-wider">
                  {booking.bookingRef || 'CNB-' + booking._id?.substring(0, 8).toUpperCase()}
                </p>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="pt-6 border-t border-dark-800 flex flex-col sm:flex-row items-center justify-between gap-6 bg-dark-950/60 p-4 rounded-2xl border border-dark-800">
              <div className="flex-1 text-center sm:text-left">
                <p className="text-xs font-bold text-white mb-1">Entry Gate Pass</p>
                <p className="text-[11px] text-dark-400 leading-relaxed">
                  Scan this code directly at the hall usher terminal. Valid for all seats in this booking.
                </p>
                <span className="inline-block mt-2 font-mono text-[11px] text-primary-400 font-semibold">
                  {booking.bookingRef}
                </span>
              </div>

              {/* QR Image or SVG Representation */}
              <div className="p-3 bg-white rounded-xl shadow-lg flex-shrink-0">
                {booking.qrCode ? (
                  <img
                    src={booking.qrCode}
                    alt="Ticket QR Code"
                    className="w-28 h-28 object-contain"
                  />
                ) : (
                  <div className="w-28 h-28 flex flex-col items-center justify-center text-dark-900 border-2 border-dark-900 p-1 text-center">
                    <span className="text-[10px] font-mono font-black break-all">
                      {booking.bookingRef || 'CINE-QR'}
                    </span>
                    <span className="text-[8px] uppercase tracking-tighter mt-1 font-bold">
                      Scan to Validate
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BookingConfirmationPage;
