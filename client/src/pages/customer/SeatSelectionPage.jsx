import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Film,
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle,
  Timer,
  ArrowLeft,
  QrCode,
  ShieldCheck,
  Ticket,
  ArrowUpRight
} from 'lucide-react';
import { showtimesApi, bookingsApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

export const SeatSelectionPage = () => {
  const { showtimeId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [showtime, setShowtime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected seats by the current user before/during hold
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [heldSeatsByMe, setHeldSeatsByMe] = useState([]);
  const [holdExpiresAt, setHoldExpiresAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [isHolding, setIsHolding] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // Success modal state
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const pollIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);

  const fetchShowtimeDetails = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await showtimesApi.getById(showtimeId);
      const data = res.data?.showtime || res.data?.data || res.data;
      setShowtime(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load showtime:', err);
      if (!isBackground) {
        setError('Failed to load showtime details.');
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchShowtimeDetails();
    pollIntervalRef.current = setInterval(() => {
      fetchShowtimeDetails(true);
    }, 10000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [showtimeId]);

  // Hold Countdown Timer Effect
  useEffect(() => {
    if (!holdExpiresAt) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expires = new Date(holdExpiresAt).getTime();
      const diff = Math.max(0, Math.floor((expires - now) / 1000));

      setTimeLeft(diff);

      if (diff <= 0) {
        clearInterval(timerIntervalRef.current);
        setHeldSeatsByMe([]);
        setSelectedSeats([]);
        setHoldExpiresAt(null);
        toast.error('Seat hold expired. Please re-select your seats.');
        fetchShowtimeDetails(true);
      }
    };

    updateTimer();
    timerIntervalRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [holdExpiresAt]);

  // Extract categories and seats
  const seatCategories = showtime?.seatCategories || [];

  // Toggle seat selection
  const handleSeatClick = (seat, category) => {
    if (seat.status === 'booked') return;
    if (seat.status === 'held' && !seat.isHeldByCurrentUser) return;

    const seatId = seat.seatId;
    const exists = selectedSeats.some((s) => s.seatId === seatId);

    if (exists) {
      setSelectedSeats(selectedSeats.filter((s) => s.seatId !== seatId));
      if (heldSeatsByMe.length > 0) {
        setHeldSeatsByMe(heldSeatsByMe.filter((s) => s.seatId !== seatId));
      }
    } else {
      setSelectedSeats([
        ...selectedSeats,
        {
          seatId: seat.seatId,
          category: category.name,
          price: category.price,
        },
      ]);
    }
  };

  const totalAmount = selectedSeats.reduce((acc, s) => acc + s.price, 0);

  // Step 1: Hold selected seats
  const handleHoldSeats = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to hold seats');
      navigate('/login');
      return;
    }

    if (selectedSeats.length === 0) {
      toast.error('Please select at least one seat');
      return;
    }

    try {
      setIsHolding(true);
      const seatIds = selectedSeats.map((s) => s.seatId);
      const res = await bookingsApi.holdSeats({
        showtimeId,
        seats: seatIds,
      });

      const expiresAt =
        res.data?.expiresAt ||
        new Date(Date.now() + 10 * 60 * 1000).toISOString();

      setHoldExpiresAt(expiresAt);
      setHeldSeatsByMe([...selectedSeats]);
      toast.success('Seats held! You have 10 minutes to confirm your reservation.');
      fetchShowtimeDetails(true);
    } catch (err) {
      console.error('Failed to hold seats:', err);
      toast.error(
        err.response?.data?.message ||
          'Could not hold selected seats. They might already be held by another user.'
      );
      fetchShowtimeDetails(true);
    } finally {
      setIsHolding(false);
    }
  };

  // Step 2: Confirm booking
  const handleConfirmBooking = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const seatsToBook = heldSeatsByMe.length > 0 ? heldSeatsByMe : selectedSeats;
    if (seatsToBook.length === 0) {
      toast.error('No seats selected.');
      return;
    }

    try {
      setIsConfirming(true);
      const seatIds = seatsToBook.map((s) => s.seatId);
      const res = await bookingsApi.createBooking({
        showtimeId,
        seats: seatIds,
      });

      const bookingResult = res.data?.data || res.data;
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setConfirmedBooking(bookingResult);
      setShowSuccessModal(true);
      toast.success('Reservation confirmed!');
    } catch (err) {
      console.error('Booking confirmation failed:', err);
      toast.error(
        err.response?.data?.message || 'Booking confirmation failed. Please try again.'
      );
    } finally {
      setIsConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f6f2] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !showtime) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center bg-[#f7f6f2]">
        <div className="bg-white border border-[#e5e3dc] rounded-2xl p-8 shadow-sm">
          <AlertCircle className="w-12 h-12 text-[#cf785b] mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold text-[#252824] mb-2">
            {error || 'Showtime unavailable'}
          </h2>
          <p className="text-[#777a72] text-sm mb-6">
            Unable to load the seating layout for this screening.
          </p>
          <Link to="/movies" className="nav-cta">
            Browse Other Movies
          </Link>
        </div>
      </div>
    );
  }

  const movie = showtime.movie || {};
  const screen = showtime.screen || {};
  const theatre = screen.theatre || {};

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#f7f6f2] text-[#252824] py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header Card */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between bg-white border border-[#e5e3dc] rounded-2xl p-5 gap-4 shadow-sm">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg border border-[#e5e3dc] hover:border-[#cf785b] text-[#555850] hover:text-[#252824] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-xl font-bold text-[#252824]">
                  {movie.title || 'Screening'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#e5eae4] text-[#344638]">
                  {movie.format || 'IMAX'}
                </span>
              </div>
              <p className="text-xs text-[#777a72] mt-0.5">
                {theatre.name || 'Multiplex'} · {screen.name || 'Screen 1'} ·{' '}
                {new Date(showtime.startTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          {/* Hold Countdown Pill */}
          {heldSeatsByMe.length > 0 && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center space-x-2.5 px-4 py-2 rounded-full bg-[#fdf5f2] border border-[#cf785b] text-[#cf785b] self-start md:self-auto"
            >
              <Timer className="w-4 h-4 animate-pulse" />
              <div className="flex items-baseline gap-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider">
                  Hold Expires In:
                </span>
                <span className="text-sm font-bold font-mono">
                  {formatTimer(timeLeft)}
                </span>
              </div>
            </motion.div>
          )}
        </div>

        {/* 2-Column Layout: Seating Matrix + Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Seating Layout (Cols 8) */}
          <div className="lg:col-span-8 bg-white border border-[#e5e3dc] rounded-2xl p-6 sm:p-8 shadow-card flex flex-col items-center">
            {/* Cinema Screen Arch */}
            <div className="w-full max-w-xl mx-auto mb-10 text-center">
              <div className="cinema-screen-arch w-full" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#777a72] mt-2">
                Curved Auditorium Screen
              </p>
            </div>

            {/* Seating Grid */}
            <div className="w-full space-y-8 overflow-x-auto pb-4 flex flex-col items-center">
              {seatCategories.map((category) => (
                <div key={category.name} className="w-full max-w-xl">
                  {/* Category Header */}
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#e5e3dc]">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#344638]">
                      {category.name} Tier
                    </span>
                    <span className="text-xs font-semibold text-[#777a72]">
                      ₹{category.price}.00 / seat
                    </span>
                  </div>

                  {/* Rows Matrix */}
                  <div className="space-y-2">
                    {category.rows?.map((rowGroup) => (
                      <div key={rowGroup.row} className="flex items-center justify-center gap-2">
                        <span className="w-5 text-[11px] font-bold text-[#777a72] text-center">
                          {rowGroup.row}
                        </span>
                        <div className="flex flex-wrap justify-center gap-1.5">
                          {rowGroup.seats?.map((seat) => {
                            const isSelected = selectedSeats.some(
                              (s) => s.seatId === seat.seatId
                            );
                            const isHeldByMe = heldSeatsByMe.some(
                              (s) => s.seatId === seat.seatId
                            );

                            let btnStyle =
                              'w-8 h-8 sm:w-9 sm:h-9 rounded text-[11px] font-bold flex items-center justify-center transition-all ';

                            if (seat.status === 'booked') {
                              btnStyle += 'bg-[#e7e5df] text-[#9ea098] border border-[#d8d6cc] cursor-not-allowed';
                            } else if (seat.status === 'held' && !isHeldByMe && !seat.isHeldByCurrentUser) {
                              btnStyle += 'bg-[#f5e6d3] text-[#8c5825] border border-[#e2be9b] cursor-not-allowed';
                            } else if (isSelected || isHeldByMe) {
                              btnStyle += 'bg-[#cf785b] border border-[#cf785b] text-white shadow-sm scale-105';
                            } else {
                              btnStyle += 'bg-white hover:border-[#cf785b] border border-[#d8d6cc] text-[#252824] hover:scale-105';
                            }

                            return (
                              <button
                                key={seat.seatId}
                                disabled={
                                  seat.status === 'booked' ||
                                  (seat.status === 'held' && !isHeldByMe && !seat.isHeldByCurrentUser)
                                }
                                onClick={() => handleSeatClick(seat, category)}
                                className={btnStyle}
                                title={`${seat.seatId} - ${category.name} (₹${category.price})`}
                              >
                                {seat.seatId.split('-')[1]}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="w-full max-w-xl mt-8 pt-6 border-t border-[#e5e3dc] flex flex-wrap items-center justify-center gap-6 text-xs text-[#777a72]">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-white border border-[#d8d6cc]" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-[#cf785b]" />
                <span>Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-[#f5e6d3] border border-[#e2be9b]" />
                <span>Held by others</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-[#e7e5df] border border-[#d8d6cc]" />
                <span>Booked</span>
              </div>
            </div>
          </div>

          {/* Right Column: Checkout Summary (StayBnb Style) */}
          <div className="lg:col-span-4 bg-white border border-[#e5e3dc] rounded-2xl p-6 shadow-panel sticky top-24 space-y-6">
            <div className="border-b border-[#e5e3dc] pb-4">
              <h2 className="font-display text-lg font-bold text-[#252824] flex items-center gap-2">
                <Ticket className="w-4 h-4 text-[#cf785b]" />
                Reservation Summary
              </h2>
              <p className="text-xs text-[#777a72] mt-0.5">
                Pessimistic hold protects seats from race conditions
              </p>
            </div>

            {/* Selected Seats List */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#777a72]">
                Selected Seats ({selectedSeats.length})
              </span>

              {selectedSeats.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#f7f6f2] border border-[#e5e3dc] text-center text-xs text-[#777a72]">
                  Click on the available seats to reserve them.
                </div>
              ) : (
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {selectedSeats.map((s) => (
                    <div
                      key={s.seatId}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-[#f7f6f2] border border-[#e5e3dc] text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded font-bold bg-[#e5eae4] text-[#344638]">
                          {s.seatId}
                        </span>
                        <span className="text-[#555850]">{s.category}</span>
                      </div>
                      <span className="font-semibold text-[#252824]">₹{s.price}.00</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pricing Details */}
            <div className="pt-4 border-t border-[#e5e3dc] space-y-2 text-xs">
              <div className="flex justify-between text-[#777a72]">
                <span>Tickets Subtotal</span>
                <span className="text-[#252824] font-medium">₹{totalAmount}.00</span>
              </div>
              <div className="flex justify-between text-[#777a72]">
                <span>Convenience Fee</span>
                <span className="text-[#5d7159] font-medium">₹0.00 (Waived)</span>
              </div>
              <div className="pt-2 border-t border-[#e5e3dc] flex justify-between items-center text-sm">
                <span className="font-bold text-[#252824]">Total Amount</span>
                <span className="font-display text-2xl font-bold text-[#252824]">
                  ₹{totalAmount}.00
                </span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="pt-2 space-y-3">
              {heldSeatsByMe.length === 0 ? (
                <button
                  type="button"
                  onClick={handleHoldSeats}
                  disabled={selectedSeats.length === 0 || isHolding}
                  className={`w-full py-3.5 px-4 rounded-full text-xs font-semibold text-white tracking-tight shadow-sm transition-all flex items-center justify-center gap-2 ${
                    selectedSeats.length === 0 || isHolding
                      ? 'bg-[#d8d6cc] text-[#777a72] cursor-not-allowed'
                      : 'bg-[#252824] hover:bg-[#344638]'
                  }`}
                >
                  {isHolding ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Timer className="w-4 h-4 text-white" />
                  )}
                  <span>Hold Seats (10 Mins)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirmBooking}
                  disabled={isConfirming}
                  className="w-full py-3.5 px-4 rounded-full text-xs font-semibold text-white bg-[#cf785b] hover:bg-[#b85d38] shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  {isConfirming ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  <span>Confirm Booking (₹{totalAmount}.00)</span>
                </button>
              )}

              <p className="text-[11px] text-[#777a72] text-center leading-relaxed">
                Holding locks your seats in MongoDB so no other customer can book them.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          navigate(`/booking/confirmation/${confirmedBooking?._id || ''}`);
        }}
        maxWidth="max-w-md"
        showCloseButton={false}
      >
        <div className="text-center py-5">
          <div className="w-14 h-14 rounded-full bg-[#e5eae4] text-[#344638] flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8" />
          </div>

          <h3 className="font-display text-2xl font-bold text-[#252824] mb-1">
            Reservation Confirmed!
          </h3>
          <p className="text-xs text-[#777a72] mb-6">
            Your tickets are secured. Scannable QR pass generated.
          </p>

          <div className="p-4 rounded-xl bg-[#f7f6f2] border border-[#e5e3dc] mb-6 text-left space-y-1.5 text-xs">
            <p>
              <strong className="text-[#777a72]">Booking Ref:</strong>{' '}
              <span className="font-mono font-bold text-[#252824]">
                {confirmedBooking?.bookingRef}
              </span>
            </p>
            <p>
              <strong className="text-[#777a72]">Total Seats:</strong>{' '}
              <span className="font-semibold text-[#252824]">
                {confirmedBooking?.seats?.length} seats
              </span>
            </p>
            <p>
              <strong className="text-[#777a72]">Amount Paid:</strong>{' '}
              <span className="font-semibold text-[#252824]">
                ₹{confirmedBooking?.totalAmount}.00
              </span>
            </p>
          </div>

          <button
            onClick={() => {
              setShowSuccessModal(false);
              navigate(`/booking/confirmation/${confirmedBooking?._id || ''}`);
            }}
            className="nav-cta w-full justify-center"
          >
            <span>View Boarding Pass & QR</span>
            <span>↗</span>
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default SeatSelectionPage;
