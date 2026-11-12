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
  ArrowUpRight,
  Gift
} from 'lucide-react';
import { bookingsApi } from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
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
      setError('Unable to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!bookingToCancel) return;
    try {
      setCancelling(true);
      await bookingsApi.cancel(bookingToCancel._id);
      toast.success('Booking cancelled and refund processed.');
      setBookingToCancel(null);
      fetchMyBookings();
    } catch (err) {
      console.error('Failed to cancel booking:', err);
      toast.error(
        err.response?.data?.message || 'Failed to cancel booking. It may have already been used.'
      );
    } finally {
      setCancelling(false);
    }
  };

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
    <div className="min-h-screen bg-[#f7f6f2] text-[#252824] py-12 md:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 pb-6 border-b border-[#e5e3dc]">
          <div className="eyebrow mb-2">
            <span className="eyebrow-line"></span>
            <span>Your Passes & Reservations</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-[#252824]">
                My Bookings.
              </h1>
              <p className="text-[14px] text-[#777a72] mt-1">
                View your confirmed passes, scannable QR tokens, and cancellation records.
              </p>
            </div>
            <Link to="/movies" className="nav-cta text-xs">
              <span>Book New Show</span>
              <span>↗</span>
            </Link>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-1 text-xs">
          {['all', 'confirmed', 'used', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-full font-medium transition-colors capitalize ${
                statusFilter === status
                  ? 'bg-[#252824] text-white'
                  : 'bg-white border border-[#e5e3dc] text-[#555850] hover:border-[#cf785b]'
              }`}
            >
              {status === 'all' ? 'All Reservations' : status}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : displayedBookings.length === 0 ? (
          <EmptyState
            title="No reservations found"
            message={
              statusFilter === 'all'
                ? 'You have not booked any movie screenings yet. Browse our cinema catalog to get started.'
                : `No reservations with status "${statusFilter}".`
            }
            actionLabel="Find a Movie"
            onAction={() => (window.location.href = '/movies')}
          />
        ) : (
          <div className="space-y-4">
            {displayedBookings.map((b) => {
              const showtime = b.showtime || {};
              const movie = showtime.movie || {};
              const screen = showtime.screen || {};
              const theatre = screen.theatre || {};
              const startTime = showtime.startTime ? new Date(showtime.startTime) : null;
              const isExpanded = expandedBookingId === b._id;

              const statusColor =
                b.status === 'confirmed'
                  ? 'bg-[#e5eae4] text-[#344638]'
                  : b.status === 'used'
                  ? 'bg-[#e9e8df] text-[#555850]'
                  : 'bg-[#fdf5f2] text-[#cf785b]';

              return (
                <div
                  key={b._id}
                  className="bg-white border border-[#e5e3dc] rounded-xl p-5 shadow-sm hover:border-[#cf785b] transition-all"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-18 rounded bg-[#e7e5df] overflow-hidden flex-shrink-0">
                        <img
                          src={
                            movie.posterUrl ||
                            'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=200&q=80'
                          }
                          alt={movie.title || 'Movie'}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-display font-bold text-base text-[#252824]">
                            {movie.title || 'Screening'}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColor}`}
                          >
                            {b.status}
                          </span>
                          {b.bookedForOther && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#fef7ee] text-[#b45309] border border-[#fde68a] flex items-center gap-1">
                              <Gift className="w-3 h-3 text-[#b45309]" />
                              <span>Gifted to {b.recipient?.name || 'Friend'}</span>
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-[#777a72]">
                          Ref: <strong className="font-mono text-[#252824]">{b.bookingRef}</strong> ·{' '}
                          {theatre.name || 'Multiplex'} ({screen.name || 'Screen 1'})
                        </p>

                        <p className="text-xs text-[#777a72]">
                          {startTime
                            ? startTime.toLocaleDateString(undefined, {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              }) +
                              ' · ' +
                              startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : ''}
                        </p>
                      </div>
                    </div>

                    {/* Right side CTA actions */}
                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <span className="font-display font-bold text-base text-[#252824] mr-2">
                        ₹{b.totalAmount}.00
                      </span>

                      <Link
                        to={`/booking/confirmation/${b._id}`}
                        className="px-3.5 py-1.5 rounded-full bg-[#252824] text-white text-xs font-semibold hover:bg-[#344638] transition-colors flex items-center gap-1"
                      >
                        <span>Pass & QR</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>

                      {b.status === 'confirmed' && (
                        <button
                          onClick={() => setBookingToCancel(b)}
                          className="px-3.5 py-1.5 rounded-full border border-[#cf785b] text-[#cf785b] hover:bg-[#fdf5f2] text-xs font-semibold transition-colors"
                        >
                          Cancel
                        </button>
                      )}

                      <button
                        onClick={() =>
                          setExpandedBookingId(isExpanded ? null : b._id)
                        }
                        className="p-1.5 rounded-lg border border-[#e5e3dc] text-[#777a72] hover:text-[#252824]"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-[#e5e3dc] text-xs space-y-3"
                      >
                        <div className="flex flex-wrap gap-2">
                          <span className="text-[#777a72] font-semibold">Seats:</span>
                          {b.seats?.map((s) => (
                            <span
                              key={s.seatId}
                              className="px-2 py-0.5 rounded bg-[#f7f6f2] border border-[#e5e3dc] font-bold text-[#252824]"
                            >
                              {s.seatId} ({s.category} - ₹{s.price})
                            </span>
                          ))}
                        </div>

                        {b.bookedForOther && b.recipient && (
                          <div className="pt-2 border-t border-[#f0efe9]">
                            <div className="p-2.5 rounded-lg bg-[#fef7ee] border border-[#fde68a] text-[11px] text-[#78350f] space-y-1">
                              <div className="font-bold flex items-center gap-1.5 flex-wrap">
                                <Gift className="w-3.5 h-3.5 text-[#b45309]" />
                                <span>Booked as a gift for:</span>
                                <span className="text-[#252824]">{b.recipient.name}</span>
                                {b.recipient.phone && <span className="text-[#78350f]">({b.recipient.phone})</span>}
                                {b.recipient.email && <span className="text-[#78350f]">· {b.recipient.email}</span>}
                              </div>
                              {b.recipient.message && (
                                <p className="italic text-[#92400e]">"{b.recipient.message}"</p>
                              )}
                            </div>
                          </div>
                        )}

                        {b.mealOrders && b.mealOrders.length > 0 && (
                          <div className="pt-2 border-t border-[#f0efe9]">
                            <span className="text-[#cf785b] font-bold block mb-1">
                              🍿 In-Seat Meals Ordered (₹{b.mealTotal || 0}.00):
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {b.mealOrders.map((m, idx) => (
                                <span
                                  key={idx}
                                  className="px-2.5 py-0.5 rounded-full bg-[#fdf5f2] border border-[#cf785b]/30 text-[#252824] text-[11px] font-medium"
                                >
                                  {m.quantity}× {m.name} (₹{m.price * m.quantity})
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {b.cancelledAt && (
                          <p className="text-[#cf785b]">
                            Cancelled on: {new Date(b.cancelledAt).toLocaleString()} · Refund Status: Completed
                          </p>
                        )}
                        {b.usedAt && (
                          <p className="text-[#5d7159]">
                            Admitted to theatre on: {new Date(b.usedAt).toLocaleString()}
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-10 flex justify-center">
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
          title="Cancel Reservation?"
          message={`Are you sure you want to cancel booking ${bookingToCancel?.bookingRef}? Your seats will be released back to the auditorium immediately and ₹${bookingToCancel?.totalAmount}.00 will be refunded.`}
          confirmLabel={cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
          confirmVariant="danger"
        />
      </div>
    </div>
  );
};

export default MyBookingsPage;
