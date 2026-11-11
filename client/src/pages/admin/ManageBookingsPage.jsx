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
  QrCode,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { bookingsApi } from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
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

  // Ticket Validation Section State (Acceptance Test #4)
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
      const list = res.data?.data || res.data?.bookings || res.data || [];
      setBookings(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load bookings:', err);
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
        message:
          err.response?.data?.message ||
          err.message ||
          'Invalid or already redeemed ticket reference.',
      });
      toast.error('Validation failed');
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
      const userMatch = (b.user?.name || '').toLowerCase().includes(q);
      const emailMatch = (b.user?.email || '').toLowerCase().includes(q);
      const movieMatch = (b.showtime?.movie?.title || '').toLowerCase().includes(q);
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
    <div className="space-y-8 bg-[#f7f6f2] text-[#252824]">
      {/* Top Header */}
      <div className="pb-6 border-b border-[#e5e3dc]">
        <div className="eyebrow mb-2">
          <span className="eyebrow-line"></span>
          <span>Access Control & Ledger</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#252824]">
          Bookings & Gate Validation.
        </h1>
        <p className="text-xs sm:text-sm text-[#777a72] mt-1">
          Simulate usher barcode scanning and inspect the central reservations ledger.
        </p>
      </div>

      {/* Usher Ticket Scanner Terminal (Acceptance Test #4) */}
      <div className="bg-white border border-[#e5e3dc] rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b border-[#e5e3dc] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#e5eae4] text-[#344638] flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-[#252824]">
                Usher Ticket Scanner Terminal
              </h2>
              <p className="text-xs text-[#777a72]">
                Scan or enter the booking reference code (e.g., <code className="font-mono text-[#252824]">BK-XXXXXXXX</code>)
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#e5eae4] text-[#344638]">
            Acceptance Test #4
          </span>
        </div>

        <form onSubmit={handleValidateTicket} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={validateRef}
              onChange={(e) => setValidateRef(e.target.value.toUpperCase())}
              placeholder="Enter Booking Reference (e.g. BK-9X4KM2L7)"
              className="w-full px-4 py-3 rounded-lg border border-[#e5e3dc] bg-[#f7f6f2] text-[#252824] placeholder-[#9ea098] font-mono text-sm tracking-wider focus:outline-none focus:border-[#cf785b]"
            />
          </div>

          <button
            type="submit"
            disabled={validating || !validateRef.trim()}
            className="px-6 py-3 rounded-lg bg-[#cf785b] hover:bg-[#b85d38] text-white text-xs font-semibold tracking-tight transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            {validating ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            <span>Validate Ticket</span>
          </button>
        </form>

        {/* Validation Result Box */}
        {validationResult && (
          <div
            className={`mt-5 p-4 rounded-xl border text-xs ${
              validationResult.success
                ? 'bg-[#e5eae4] border-[#cbdbcb] text-[#344638]'
                : 'bg-[#fdf5f2] border-[#cf785b]/40 text-[#a33d35]'
            }`}
          >
            <div className="flex items-start gap-3">
              {validationResult.success ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0 text-[#344638]" />
              ) : (
                <XCircle className="w-5 h-5 flex-shrink-0 text-[#a33d35]" />
              )}
              <div>
                <p className="font-bold text-sm">{validationResult.message}</p>
                {validationResult.success && validationResult.booking && (
                  <p className="mt-1 text-[11px] text-[#555850]">
                    Status: <strong className="uppercase">Used</strong> · Admitted to auditorium.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bookings Ledger */}
      <div className="bg-white border border-[#e5e3dc] rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e5e3dc] pb-4">
          <h2 className="font-display text-xl font-bold text-[#252824]">
            All System Bookings ({filteredBookings.length})
          </h2>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Search reference, customer, title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-[#e5e3dc] bg-[#f7f6f2] text-xs text-[#252824] placeholder-[#9ea098] focus:outline-none focus:border-[#cf785b]"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-[#e5e3dc] bg-[#f7f6f2] text-xs text-[#252824] focus:outline-none focus:border-[#cf785b]"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="used">Used</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Ledger Table */}
        {loading ? (
          <div className="py-16 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : displayedBookings.length === 0 ? (
          <EmptyState
            title="No bookings recorded"
            message="No reservations match the specified search query."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#e5e3dc] text-[#777a72] uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-3 px-3">Reference</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Movie</th>
                  <th className="py-3 px-3">Seats</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0efe9]">
                {displayedBookings.map((b) => {
                  const statusStyle =
                    b.status === 'confirmed'
                      ? 'bg-[#e5eae4] text-[#344638]'
                      : b.status === 'used'
                      ? 'bg-[#e9e8df] text-[#555850]'
                      : 'bg-[#fdf5f2] text-[#cf785b]';

                  return (
                    <tr key={b._id} className="hover:bg-[#f7f6f2] transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-[#252824]">
                        {b.bookingRef}
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#252824]">
                        {b.user?.name || 'Customer'}
                      </td>
                      <td className="py-3 px-3 text-[#555850]">
                        {b.showtime?.movie?.title || 'Movie'}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-[#f7f6f2] border border-[#e5e3dc] font-bold">
                          {b.seats?.map((s) => s.seatId).join(', ') || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-[#252824]">
                        ₹{b.totalAmount}.00
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusStyle}`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            setValidateRef(b.bookingRef);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="text-[11px] font-semibold text-[#cf785b] hover:underline"
                        >
                          Load to Scanner ↗
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="pt-4 flex justify-center">
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
