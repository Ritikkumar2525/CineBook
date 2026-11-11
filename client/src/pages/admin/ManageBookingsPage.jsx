import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Ticket,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Clock,
  MapPin,
  Tv,
  QrCode,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { bookingsApi } from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

export const ManageBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  // Ticket Validation Section State
  const [validateRef, setValidateRef] = useState('');
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await bookingsApi.getAll();
      const list = res.data?.bookings || res.data?.data || res.data || [];
      setBookings(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load bookings:', err);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleValidateTicket = async (e) => {
    e?.preventDefault();
    if (!validateRef.trim()) {
      toast.error('Please enter a booking reference code');
      return;
    }

    try {
      setValidating(true);
      const res = await bookingsApi.validateTicket(validateRef.trim());
      const data = res.data?.data || res.data;
      setValidationResult({
        success: true,
        booking: data.booking || data,
        message: data.message || 'Ticket validated successfully! Granted hall admission.',
      });
      toast.success('Ticket validated successfully');
      fetchBookings();
    } catch (err) {
      console.error('Ticket validation error:', err);
      setValidationResult({
        success: false,
        message: err.message || 'Invalid or already redeemed ticket reference.',
      });
      toast.error(err.message || 'Validation failed');
    } finally {
      setValidating(false);
    }
  };

  // Filter bookings
  const filteredBookings = bookings.filter((b) => {
    if (statusFilter !== 'all' && (b.status || '').toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      const refMatch = (b.bookingRef || '').toLowerCase().includes(q);
      const userMatch = (b.user?.name || b.customerName || '').toLowerCase().includes(q);
      const emailMatch = (b.user?.email || '').toLowerCase().includes(q);
      const movieMatch = (b.movie?.title || b.showtime?.movie?.title || '').toLowerCase().includes(q);
      if (!refMatch && !userMatch && !emailMatch && !movieMatch) return false;
    }

    return true;
  });

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const displayedBookings = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="pb-4 border-b border-dark-800">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center">
          <Ticket className="w-7 h-7 text-primary-400 mr-2.5" />
          Manage Bookings & Ticket Validation
        </h1>
        <p className="text-xs sm:text-sm text-dark-400 mt-0.5">
          Verify digital patron entry passes and inspect live cinema transactions
        </p>
      </div>

      {/* Ticket Usher Verification Terminal (Hero Card) */}
      <div className="bg-gradient-to-r from-dark-900 via-primary-950/40 to-dark-900 border border-primary-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-300 text-xs font-semibold mb-3">
            <ShieldCheck className="w-4 h-4 text-primary-400" />
            <span>Usher Gate Scanner & Validation</span>
          </div>

          <h3 className="text-xl font-bold text-white mb-2">
            Verify & Admit Ticket Reference
          </h3>
          <p className="text-xs text-dark-300 mb-4 leading-relaxed">
            Enter the customer's 6 or 8-character booking reference printed on their digital pass to validate entry and mark the ticket as used.
          </p>

          <form onSubmit={handleValidateTicket} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <QrCode className="absolute left-3.5 top-3 w-4 h-4 text-dark-400 pointer-events-none" />
              <input
                type="text"
                value={validateRef}
                onChange={(e) => setValidateRef(e.target.value.toUpperCase())}
                placeholder="e.g. CNB-A98B12"
                className="w-full pl-10 pr-4 py-2.5 bg-dark-950 border border-dark-700 rounded-xl text-sm font-mono tracking-wider text-white placeholder-dark-500 focus:outline-none focus:border-primary-500"
              />
            </div>
            <button
              type="submit"
              disabled={validating || !validateRef.trim()}
              className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-primary-600 hover:bg-primary-500 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {validating ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Validate Pass</span>
                </>
              )}
            </button>
          </form>

          {/* Validation Report Banner */}
          <AnimatePresence>
            {validationResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`mt-4 p-4 rounded-xl border text-xs flex items-start space-x-3 ${
                  validationResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                {validationResult.success ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-bold text-sm text-white mb-0.5">
                    {validationResult.success ? 'Pass Verified' : 'Validation Failed'}
                  </p>
                  <p>{validationResult.message}</p>
                  {validationResult.booking && (
                    <div className="mt-2 pt-2 border-t border-emerald-500/20 text-[11px] grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <div>
                        <span className="text-emerald-400/70 block">Movie:</span>
                        <span className="font-semibold text-white">
                          {validationResult.booking.movie?.title || 'Movie'}
                        </span>
                      </div>
                      <div>
                        <span className="text-emerald-400/70 block">Seats:</span>
                        <span className="font-semibold text-white">
                          {(validationResult.booking.seats || []).map((s) => s.seatNumber).join(', ')}
                        </span>
                      </div>
                      <div>
                        <span className="text-emerald-400/70 block">Status:</span>
                        <span className="font-semibold text-white uppercase">
                          {validationResult.booking.status}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bookings Explorer Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-dark-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search reference, customer, or movie..."
              className="w-full pl-10 pr-4 py-2 bg-dark-900 border border-dark-700 rounded-xl text-xs sm:text-sm text-white placeholder-dark-500 focus:outline-none focus:border-primary-500"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center space-x-1.5 bg-dark-900 border border-dark-800 p-1 rounded-xl self-start sm:self-auto text-xs">
            {['all', 'confirmed', 'used', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-all ${
                  statusFilter === status
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-dark-400 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <LoadingSpinner size="lg" text="Loading customer bookings..." />
        ) : displayedBookings.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title="No bookings found"
            description="No cinema bookings matched your search query or status criteria."
          />
        ) : (
          <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-dark-950/80 border-b border-dark-800 text-dark-400 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Ref Code</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Movie & Showtime</th>
                    <th className="py-3.5 px-4">Seats</th>
                    <th className="py-3.5 px-4">Total Amount</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800/60">
                  {displayedBookings.map((b) => {
                    const isExpanded = expandedId === b._id;
                    const movie = b.movie || b.showtime?.movie || {};
                    const screen = b.screen || b.showtime?.screen || {};
                    const showtime = b.showtime || {};

                    return (
                      <React.Fragment key={b._id}>
                        <tr className="hover:bg-dark-800/40 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-white">
                            {b.bookingRef || b._id.substring(0, 8).toUpperCase()}
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-white">{b.user?.name || b.customerName || 'Guest'}</p>
                            <p className="text-[11px] text-dark-400">{b.user?.email || 'N/A'}</p>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-white line-clamp-1">{movie.title || 'Movie'}</p>
                            <p className="text-[11px] text-dark-400">
                              {screen.name || 'Screen 1'} •{' '}
                              {showtime.startTime
                                ? new Date(showtime.startTime).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : 'Today'}
                            </p>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-white">
                            {(b.seats || []).map((s) => s.seatNumber).join(', ')}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-emerald-400">
                            ₹{b.totalAmount}
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge status={b.status} />
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : b._id)}
                              className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                        </tr>

                        {/* Expandable details */}
                        {isExpanded && (
                          <tr className="bg-dark-950/60 border-b border-dark-800">
                            <td colSpan={7} className="p-4 sm:p-5">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                                <div>
                                  <span className="text-[10px] uppercase font-bold text-dark-400">
                                    Customer Phone
                                  </span>
                                  <p className="text-white mt-0.5">{b.user?.phone || 'N/A'}</p>
                                </div>
                                <div>
                                  <span className="text-[10px] uppercase font-bold text-dark-400">
                                    Transaction ID
                                  </span>
                                  <p className="font-mono text-dark-300 mt-0.5">
                                    {b.paymentDetails?.transactionId || 'TXN-ONLINE'}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-[10px] uppercase font-bold text-dark-400">
                                    Booked On
                                  </span>
                                  <p className="text-dark-300 mt-0.5">
                                    {new Date(b.createdAt || Date.now()).toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-[10px] uppercase font-bold text-dark-400">
                                    Fast Validate
                                  </span>
                                  <button
                                    onClick={() => {
                                      setValidateRef(b.bookingRef || '');
                                      window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="block mt-0.5 text-primary-400 hover:underline font-semibold"
                                  >
                                    Load into Scanner &rarr;
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageBookingsPage;
