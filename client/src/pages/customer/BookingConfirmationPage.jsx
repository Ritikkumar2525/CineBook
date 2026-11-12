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
  ArrowLeft,
  ArrowUpRight,
  Gift,
  Share2,
  Copy
} from 'lucide-react';
import toast from 'react-hot-toast';
import { bookingsApi } from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

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

  const handleShareGiftPass = () => {
    const showStr = startTime
      ? `${startTime.toLocaleDateString()} at ${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      : 'Upcoming Show';
    const seatsStr = (booking.seats || []).map((s) => s.seatId).join(', ');
    const text = `🍿 Here is your movie ticket for ${movie.title || 'the movie'}!\n📅 Show: ${showStr}\n🏛️ Venue: ${theatre.name || 'Cinema'}\n🎟️ Seats: ${seatsStr}\n🎫 Reference: ${booking.bookingRef}\n🔗 Pass Link: ${window.location.href}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    toast.success('Ticket link copied to clipboard & WhatsApp opened!');
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] bg-[#f7f6f2] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center bg-[#f7f6f2]">
        <div className="bg-white border border-[#e5e3dc] rounded-2xl p-8 shadow-sm">
          <Ticket className="w-12 h-12 text-[#cf785b] mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold text-[#252824] mb-2">
            Ticket Not Found
          </h2>
          <p className="text-[#777a72] text-xs mb-6">
            We could not find a confirmed reservation with this identifier.
          </p>
          <Link to="/my-bookings" className="nav-cta">
            View My Reservations
          </Link>
        </div>
      </div>
    );
  }

  const showtime = booking.showtime || {};
  const movie = showtime.movie || {};
  const screen = showtime.screen || {};
  const theatre = screen.theatre || {};
  const startTime = showtime.startTime ? new Date(showtime.startTime) : null;

  return (
    <div className="min-h-screen bg-[#f7f6f2] text-[#252824] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Top Success Notice */}
        <div className="text-center mb-8 print:hidden">
          <div className="w-14 h-14 rounded-full bg-[#e5eae4] text-[#344638] flex items-center justify-center mx-auto mb-3 shadow-sm">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-[#252824]">
            Reservation Confirmed.
          </h1>
          <p className="text-[#777a72] text-xs mt-1">
            Present your scannable pass at the cinema turnstile for usher validation.
          </p>
        </div>

        {/* Action Header */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Link
            to="/my-bookings"
            className="flex items-center gap-1.5 text-xs font-semibold text-[#777a72] hover:text-[#252824] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>My Bookings</span>
          </Link>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-[#252824] bg-white border border-[#e5e3dc] hover:border-[#cf785b] transition-all shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-[#cf785b]" />
            <span>Print Pass</span>
          </button>
        </div>

        {/* StayBnb Style Digital Boarding Pass */}
        <div className="bg-white border border-[#e5e3dc] rounded-2xl overflow-hidden shadow-panel relative">
          {/* Ticket Header Banner */}
          <div className="bg-[#344638] p-6 sm:p-8 text-[#f7f6f2] relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#cbdbcb]">
                CineBook Boarding Pass
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white backdrop-blur-sm">
                {booking.status}
              </span>
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-white mb-2">
              {movie.title || 'Cinema Screening'}
            </h2>

            <div className="flex flex-wrap items-center gap-3 text-xs text-[#cbdbcb]">
              <span>{movie.format || 'IMAX 3D'}</span>
              <span>·</span>
              <span>{movie.language || 'English'}</span>
              <span>·</span>
              <span>{movie.duration} mins</span>
            </div>
          </div>

          {/* Gift Ticket / Booked for Other Banner */}
          {booking.bookedForOther && (
            <div className="bg-[#fdf5f2] border-b border-[#f3d9d0] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#cf785b]/10 text-[#cf785b] flex items-center justify-center shrink-0">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-[#cf785b] text-white px-2 py-0.5 rounded-full">
                      Gift Ticket
                    </span>
                    <span className="text-xs font-semibold text-[#777a72]">
                      Booked for someone else
                    </span>
                  </div>
                  <p className="text-sm font-bold text-[#252824] mt-0.5">
                    Attendee: {booking.recipient?.name || 'Special Guest'}
                  </p>
                  {booking.recipient?.phone && (
                    <p className="text-[11px] text-[#777a72]">
                      Contact: {booking.recipient.phone}
                    </p>
                  )}
                  {booking.recipient?.message && (
                    <p className="text-xs italic text-[#777a72] mt-0.5">
                      "{booking.recipient.message}"
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 print:hidden self-end sm:self-center">
                <button
                  type="button"
                  onClick={handleShareGiftPass}
                  className="px-3.5 py-2 rounded-full bg-[#252824] hover:bg-[#cf785b] text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Pass (WhatsApp)</span>
                </button>
              </div>
            </div>
          )}

          {/* Perforated Notches Divider */}
          <div className="relative py-2 bg-white flex items-center justify-between">
            <div className="w-5 h-5 rounded-full bg-[#f7f6f2] -ml-2.5 border-r border-[#e5e3dc]" />
            <div className="flex-1 border-t border-dashed border-[#e5e3dc] mx-2" />
            <div className="w-5 h-5 rounded-full bg-[#f7f6f2] -mr-2.5 border-l border-[#e5e3dc]" />
          </div>

          {/* Pass Body Details */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-2 gap-5 text-xs">
              <div>
                <span className="text-[#777a72] uppercase font-bold text-[10px] tracking-wider block">
                  Multiplex Venue
                </span>
                <p className="font-display text-sm font-bold text-[#252824] mt-0.5">
                  {theatre.name || 'PVR ICON Palladium'}
                </p>
                <p className="text-[#777a72] text-[11px]">{theatre.city || 'Mumbai'}</p>
              </div>

              <div>
                <span className="text-[#777a72] uppercase font-bold text-[10px] tracking-wider block">
                  Auditorium
                </span>
                <p className="font-display text-sm font-bold text-[#252824] mt-0.5">
                  {screen.name || 'Screen 1'}
                </p>
                <p className="text-[#777a72] text-[11px]">{screen.screenType || 'IMAX 3D'}</p>
              </div>

              <div>
                <span className="text-[#777a72] uppercase font-bold text-[10px] tracking-wider block">
                  Screening Date & Time
                </span>
                <p className="font-display text-sm font-bold text-[#252824] mt-0.5">
                  {startTime
                    ? startTime.toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Scheduled'}
                </p>
                <p className="text-[#5d7159] font-semibold text-[11px]">
                  {startTime
                    ? startTime.toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''}
                </p>
              </div>

              <div>
                <span className="text-[#777a72] uppercase font-bold text-[10px] tracking-wider block">
                  Payment Status
                </span>
                <p className="font-display text-sm font-bold text-[#5d7159] mt-0.5">
                  Completed (Simulated)
                </p>
                <p className="text-[#777a72] text-[11px]">₹{booking.totalAmount}.00</p>
              </div>
            </div>

            {/* Reserved Seats List */}
            <div className="pt-4 border-t border-[#e5e3dc]">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#777a72] block mb-2">
                Confirmed Seats ({booking.seats?.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {booking.seats?.map((s) => (
                  <span
                    key={s.seatId}
                    className="px-3 py-1.5 rounded-lg bg-[#f7f6f2] border border-[#e5e3dc] font-display font-bold text-xs text-[#252824]"
                  >
                    {s.seatId} · {s.category} (₹{s.price})
                  </span>
                ))}
              </div>
            </div>

            {/* In-Seat Meal Orders Section (if meals ordered) */}
            {booking.mealOrders && booking.mealOrders.length > 0 && (
              <div className="pt-4 border-t border-[#e5e3dc] bg-[#fdfcf9] -mx-6 sm:-mx-8 px-6 sm:px-8 py-4 border-b">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#cf785b] flex items-center gap-1.5">
                    <span>🍿 In-Seat Dining Service</span>
                    <span className="text-[9px] px-1.5 py-0.2 bg-[#ffd25d]/40 rounded text-stone-900 font-sans font-semibold">
                      Deliver to Seat
                    </span>
                  </span>
                  <span className="text-xs font-bold text-[#252824]">
                    Subtotal: ₹{booking.mealTotal || 0}.00
                  </span>
                </div>

                <div className="space-y-1.5">
                  {booking.mealOrders.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs text-[#555850]"
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-white border border-[#e5e3dc] flex items-center justify-center font-bold text-[10px] text-[#cf785b]">
                          {item.quantity}×
                        </span>
                        <span className="font-medium text-[#252824]">{item.name}</span>
                      </span>
                      <span className="font-semibold text-[#252824]">
                        ₹{item.price * item.quantity}.00
                      </span>
                    </div>
                  ))}
                </div>

                <p className="text-[10px] text-[#777a72] mt-2.5 italic">
                  * Order verified for delivery to Row {booking.seats?.[0]?.seatId?.split('-')?.[0]} prior to the interval.
                </p>
              </div>
            )}

            {/* Scannable QR Code Pass */}
            <div className="pt-4 border-t border-[#e5e3dc] flex flex-col sm:flex-row items-center justify-between gap-6 p-4 rounded-xl bg-[#f7f6f2] border border-[#e5e3dc]">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#777a72] block">
                  Usher Validation Token
                </span>
                <span className="font-mono text-xl sm:text-2xl font-bold tracking-wider text-[#252824] block mt-1">
                  {booking.bookingRef}
                </span>
                <p className="text-[11px] text-[#777a72] mt-1">
                  Valid for single-admission gate scan at auditorium entrance.
                </p>
              </div>

              {booking.qrCode && (
                <div className="p-2 bg-white rounded-lg border border-[#e5e3dc] shadow-sm flex-shrink-0">
                  <img
                    src={booking.qrCode}
                    alt="Ticket QR Code"
                    className="w-28 h-28 object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Back navigation */}
        <div className="mt-8 text-center print:hidden">
          <Link to="/" className="text-xs font-semibold text-[#777a72] hover:text-[#cf785b]">
            Return to Homepage ↗
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmationPage;
