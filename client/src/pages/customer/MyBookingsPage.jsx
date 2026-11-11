import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Ticket,
  Calendar,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
  XCircle,
  ExternalLink,
  Tv,
  Film
} from 'lucide-react';
import { bookingsApi } from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Pagination from '../../components/ui/Pagination';
import toast from 'react-hot-toast';

export const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedBookingId, setExpandedBookingId] = useState(null);

  // Cancellation modal state
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const fetchMyBookings = async () => {
    try {
      setLoading(true);
      const res = await bookingsApi.getMyBookings();
      const list = res.data?.bookings || res.data?.data || res.data || [];
      setBookings(Array.isArray(list) ? list : []);
      setError(null);
    } catch (err) {
      console.error('Failed to load my bookings:', err);
      setError('Unable to load bookings. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!bookingToCancel) return;
    try {
      setCancelling(true);
      await bookingsApi.cancelBooking(bookingToCancel._id);
      toast.success('Booking cancelled successfully.');
      setBookingToCancel(null);
      fetchMyBookings();
    } catch (err) {
      console.error('Cancel booking failed:', err);
      toast.error(err.message || 'Failed to cancel booking.');
    } finally {
      setCancelling(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedBookingId(expandedBookingId === id ? null : id);
  };

  // Filter bookings by status
  const filteredBookings = bookings.filter((b) => {
    if (statusFilter === 'all') return true;
    return (b.status || '').toLowerCase() === statusFilter.toLowerCase();
  });

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const displayedBookings = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[80vh]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-dark-800 gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center">
            <Ticket className="w-8 h-8 text-primary-400 mr-3" />
            My Bookings
          </h1>
          <p className="text-sm text-dark-400 mt-1">
            Manage your cinema reservations, view digital entry passes, or cancel bookings
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center space-x-2 bg-dark-900 border border-dark-800 p-1 rounded-xl self-start sm:self-auto">
          {['all', 'confirmed', 'cancelled'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setStatusFilter(tab);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                statusFilter === tab
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" text="Loading your bookings..." />
      ) : error ? (
        <div className="p-8 text-center text-rose-400 bg-rose-500/10 rounded-2xl border border-rose-500/20">
          <p className="mb-4">{error}</p>
          <button
            onClick={fetchMyBookings}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-500 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : displayedBookings.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="No bookings found"
          description={
            statusFilter === 'all'
              ? "You haven't reserved any cinema tickets yet. Explore current movies and book your seats now!"
              : `You don't have any bookings with status "${statusFilter}".`
          }
          actionLabel="Explore Movies"
          onAction={() => (window.location.href = '/movies')}
        />
      ) : (
        <div className="space-y-4">
          {displayedBookings.map((b) => {
            const movie = b.movie || b.showtime?.movie || {};
            const theatre = b.theatre || b.showtime?.theatre || {};
            const screen = b.screen || b.showtime?.screen || {};
            const showtime = b.showtime || {};
            const isExpanded = expandedBookingId === b._id;

            const startTime = showtime.startTime ? new Date(showtime.startTime) : null;
            const canCancel =
              b.status === 'confirmed' &&
              startTime &&
              startTime.getTime() > Date.now();

            return (
              <motion.div
                layout
                key={b._id}
                className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden shadow-lg transition-all hover:border-dark-700"
              >
                {/* Main Card Header */}
                <div
                  onClick={() => toggleExpand(b._id)}
                  className="p-5 sm:p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 select-none"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-14 h-20 rounded-xl bg-dark-950 overflow-hidden flex-shrink-0 border border-dark-800">
                      <img
                        src={
                          movie.posterUrl ||
                          'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80'
                        }
                        alt={movie.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src =
                            'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2.5 mb-1.5">
                        <Badge status={b.status} />
                        <span className="text-xs font-mono font-bold text-dark-400">
                          Ref: {b.bookingRef || b._id.substring(0, 8).toUpperCase()}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-1">{movie.title || 'Movie'}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-dark-400">
                        <span className="flex items-center">
                          <MapPin className="w-3.5 h-3.5 mr-1 text-primary-400" />
                          {theatre.name || 'Main Cinema'}
                        </span>
                        <span className="flex items-center">
                          <Tv className="w-3.5 h-3.5 mr-1" />
                          {screen.name || 'Screen 1'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end space-x-6 border-t md:border-t-0 pt-3 md:pt-0 border-dark-800">
                    <div className="text-left md:text-right">
                      <p className="text-xs text-dark-400">Show Date</p>
                      <p className="text-sm font-semibold text-white">
                        {startTime
                          ? startTime.toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'N/A'}
                      </p>
                      <p className="text-xs text-primary-400 font-medium">
                        {startTime
                          ? startTime.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            })
                          : ''}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-dark-400">Total Paid</p>
                      <p className="text-base font-black text-emerald-400">₹{b.totalAmount || 0}</p>
                    </div>

                    <button
                      className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
                      aria-label="Toggle details"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expandable Details Section */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-dark-800 bg-dark-950/70 p-5 sm:p-6"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs mb-6">
                        <div>
                          <span className="text-dark-400 uppercase tracking-wider font-semibold text-[10px]">
                            Seats Reserved
                          </span>
                          <p className="text-sm font-black text-white mt-0.5">
                            {(b.seats || []).map((s) => s.seatNumber).join(', ')}
                          </p>
                        </div>

                        <div>
                          <span className="text-dark-400 uppercase tracking-wider font-semibold text-[10px]">
                            Booked On
                          </span>
                          <p className="text-xs font-medium text-dark-200 mt-0.5">
                            {b.createdAt
                              ? new Date(b.createdAt).toLocaleString()
                              : 'Recent'}
                          </p>
                        </div>

                        <div>
                          <span className="text-dark-400 uppercase tracking-wider font-semibold text-[10px]">
                            Payment Status
                          </span>
                          <p className="text-xs font-semibold text-emerald-400 mt-0.5 capitalize">
                            {b.paymentDetails?.status || 'Completed'}
                          </p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-dark-800/80">
                        <Link
                          to={`/booking/confirmation/${b._id}`}
                          className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary-600 hover:bg-primary-500 shadow-md shadow-primary-950/40 transition-all"
                        >
                          <Ticket className="w-3.5 h-3.5 mr-1.5" />
                          View QR Pass / Ticket
                        </Link>

                        {canCancel && (
                          <button
                            type="button"
                            onClick={() => setBookingToCancel(b)}
                            className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1.5" />
                            Cancel Reservation
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!bookingToCancel}
        onClose={() => setBookingToCancel(null)}
        onConfirm={handleCancelBooking}
        title="Cancel This Reservation?"
        message={`Are you sure you want to cancel booking #${bookingToCancel?.bookingRef}? Your held seats will be immediately released back to the box office.`}
        confirmText="Yes, Cancel Booking"
        isDanger={true}
        isLoading={cancelling}
      />
    </div>
  );
};

export default MyBookingsPage;
