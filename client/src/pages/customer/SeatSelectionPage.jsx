import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Film,
  Clock,
  MapPin,
  Tv,
  CheckCircle,
  AlertCircle,
  Timer,
  ArrowLeft,
  QrCode,
  ShieldCheck,
  ChevronRight,
  Ticket
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
  const [holdToken, setHoldToken] = useState(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [isHolding, setIsHolding] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // Success modal state
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const pollIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Fetch showtime details
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

    // Auto-poll showtime availability every 20s
    pollIntervalRef.current = setInterval(() => {
      fetchShowtimeDetails(true);
    }, 20000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [showtimeId]);

  // Hold Countdown Timer effect
  useEffect(() => {
    if (holdExpiresAt) {
      const updateCountdown = () => {
        const now = Date.now();
        const diff = Math.max(0, Math.floor((new Date(holdExpiresAt).getTime() - now) / 1000));
        setTimeLeft(diff);

        if (diff <= 0) {
          clearInterval(timerIntervalRef.current);
          toast.error('Your seat hold has expired. Please select seats again.');
          setHeldSeatsByMe([]);
          setHoldToken(null);
          setHoldExpiresAt(null);
          setSelectedSeats([]);
          fetchShowtimeDetails(true);
        }
      };

      updateCountdown();
      timerIntervalRef.current = setInterval(updateCountdown, 1000);

      return () => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      };
    }
  }, [holdExpiresAt]);

  // Derive seat layout and status
  const generateSeatLayout = () => {
    if (!showtime) return [];

    const screen = showtime.screen || {};
    const categories = screen.seatCategories || [
      { name: 'Standard', price: 150, rows: 4, seatsPerRow: 10, color: '#9333ea' },
      { name: 'Premium', price: 250, rows: 2, seatsPerRow: 10, color: '#3b82f6' },
      { name: 'VIP', price: 350, rows: 1, seatsPerRow: 8, color: '#eab308' },
    ];

    // Normalize booked/held lists from backend showtime
    const bookedSeatNumbers = new Set(
      (showtime.bookedSeats || []).map((s) => (typeof s === 'string' ? s : s.seatNumber))
    );

    // Filter held seats that are not expired and not held by this session
    const serverHeldSeats = showtime.heldSeats || [];
    const heldSeatNumbers = new Set(
      serverHeldSeats
        .filter((h) => {
          if (!h.expiresAt && !h.heldUntil) return true;
          const expiry = new Date(h.expiresAt || h.heldUntil).getTime();
          return expiry > Date.now();
        })
        .map((h) => (typeof h === 'string' ? h : h.seatNumber))
    );

    // If showtime has precomputed seats array
    if (Array.isArray(showtime.seats) && showtime.seats.length > 0) {
      // Group by category
      const catMap = {};
      showtime.seats.forEach((seat) => {
        const cat = seat.category || 'Standard';
        if (!catMap[cat]) {
          catMap[cat] = {
            name: cat,
            price: seat.price || 200,
            seats: [],
          };
        }
        let status = 'available';
        if (bookedSeatNumbers.has(seat.seatNumber) || seat.status === 'booked') {
          status = 'booked';
        } else if (
          heldSeatNumbers.has(seat.seatNumber) &&
          !heldSeatsByMe.some((s) => s.seatNumber === seat.seatNumber)
        ) {
          status = 'held';
        }
        catMap[cat].seats.push({
          ...seat,
          status,
        });
      });
      return Object.values(catMap);
    }

    // Otherwise generate from screen seatCategories
    let currentRowCode = 65; // 'A'
    return categories.map((cat) => {
      const rowCount = typeof cat.rows === 'number' ? cat.rows : Array.isArray(cat.rows) ? cat.rows.length : 3;
      const seatsPerRow = cat.seatsPerRow || 10;
      const categorySeats = [];

      for (let r = 0; r < rowCount; r++) {
        const rowChar = String.fromCharCode(currentRowCode++);
        for (let s = 1; s <= seatsPerRow; s++) {
          const seatNum = `${rowChar}${s}`;
          let status = 'available';

          if (bookedSeatNumbers.has(seatNum)) {
            status = 'booked';
          } else if (
            heldSeatNumbers.has(seatNum) &&
            !heldSeatsByMe.some((hs) => hs.seatNumber === seatNum)
          ) {
            status = 'held';
          }

          categorySeats.push({
            seatNumber: seatNum,
            row: rowChar,
            number: s,
            category: cat.name,
            price: cat.price || (cat.name === 'VIP' ? 350 : cat.name === 'Premium' ? 250 : 150),
            status,
          });
        }
      }

      return {
        name: cat.name,
        price: cat.price || (cat.name === 'VIP' ? 350 : cat.name === 'Premium' ? 250 : 150),
        seats: categorySeats,
        seatsPerRow,
      };
    });
  };

  const seatLayout = generateSeatLayout();

  // Toggle seat selection
  const handleSeatClick = (seat) => {
    // If seat is booked or held by others, ignore
    if (seat.status === 'booked' || seat.status === 'held') return;

    // If user has already held seats, they can't change until hold is cleared/expired
    if (heldSeatsByMe.length > 0) {
      toast('Please confirm your current held seats or wait for the hold timer to expire.', {
        icon: '⏳',
      });
      return;
    }

    const isSelected = selectedSeats.some((s) => s.seatNumber === seat.seatNumber);
    if (isSelected) {
      setSelectedSeats(selectedSeats.filter((s) => s.seatNumber !== seat.seatNumber));
    } else {
      if (selectedSeats.length >= 8) {
        toast.error('You can select a maximum of 8 seats per booking.');
        return;
      }
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const totalAmount = (heldSeatsByMe.length > 0 ? heldSeatsByMe : selectedSeats).reduce(
    (acc, s) => acc + (s.price || 0),
    0
  );

  // Step 1: Hold seats
  const handleHoldSeats = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to reserve seats.');
      navigate('/login', { state: { from: `/booking/${showtimeId}` } });
      return;
    }

    if (selectedSeats.length === 0) {
      toast.error('Please select at least one seat.');
      return;
    }

    try {
      setIsHolding(true);
      const res = await bookingsApi.holdSeats({
        showtimeId,
        seats: selectedSeats.map((s) => ({
          seatNumber: s.seatNumber,
          category: s.category,
          price: s.price,
        })),
      });

      const data = res.data?.data || res.data;
      const token = data.holdToken || data.holdId || data._id || 'held-' + Date.now();
      const expiresAt =
        data.expiresAt ||
        data.heldUntil ||
        new Date(Date.now() + 10 * 60 * 1000).toISOString();

      setHoldToken(token);
      setHoldExpiresAt(expiresAt);
      setHeldSeatsByMe([...selectedSeats]);
      toast.success('Seats held! You have 10 minutes to confirm your booking.');
    } catch (err) {
      console.error('Failed to hold seats:', err);
      toast.error(err.message || 'Could not hold selected seats. They might already be taken.');
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
      const bookingPayload = {
        showtimeId,
        seats: seatsToBook.map((s) => ({
          seatNumber: s.seatNumber,
          category: s.category,
          price: s.price,
        })),
        totalAmount,
        holdToken,
        paymentDetails: {
          method: 'credit_card',
          status: 'completed',
          transactionId: 'TXN-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
        },
      };

      const res = await bookingsApi.createBooking(bookingPayload);
      const bookingResult = res.data?.booking || res.data?.data || res.data;

      // Stop hold timer
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setConfirmedBooking(bookingResult);
      setShowSuccessModal(true);
      toast.success('Booking confirmed successfully!');
    } catch (err) {
      console.error('Booking confirmation failed:', err);
      toast.error(err.message || 'Booking confirmation failed. Please try again.');
    } finally {
      setIsConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading seat map & availability..." />
      </div>
    );
  }

  if (error || !showtime) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="bg-dark-900 border border-dark-800 rounded-3xl p-8">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">{error || 'Showtime unavailable'}</h2>
          <p className="text-dark-400 text-sm mb-6">
            Unable to load seat map for this showtime. It may have been cancelled or expired.
          </p>
          <button
            onClick={() => navigate('/movies')}
            className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold text-sm transition-all"
          >
            Browse Other Movies
          </button>
        </div>
      </div>
    );
  }

  const movie = showtime.movie || {};
  const theatre = showtime.theatre || {};
  const screen = showtime.screen || {};

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen pb-24 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Breadcrumb & Showtime Info Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between bg-dark-900 border border-dark-800 rounded-2xl p-4 sm:p-5 gap-4 shadow-lg">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-white">{movie.title || 'Movie'}</h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-dark-400 mt-0.5">
                <span className="flex items-center text-primary-400">
                  <MapPin className="w-3.5 h-3.5 mr-1" />
                  {theatre.name || 'Main Cinema'}
                </span>
                <span className="flex items-center text-dark-300">
                  <Tv className="w-3.5 h-3.5 mr-1" />
                  {screen.name || 'Screen 1'}
                </span>
                <span className="flex items-center text-dark-300">
                  <Clock className="w-3.5 h-3.5 mr-1" />
                  {new Date(showtime.startTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  })}{' '}
                  -{' '}
                  {new Date(showtime.startTime).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Hold Countdown Notice if seats are held */}
          {heldSeatsByMe.length > 0 && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center space-x-3 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 self-start md:self-auto"
            >
              <Timer className="w-5 h-5 text-amber-400 animate-pulse" />
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
                  Hold Expires In
                </p>
                <p className="text-base font-black font-mono">{formatTimer(timeLeft)}</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Grid Layout: Seatmap on Left, Summary on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Seat Map View (Left, cols 8) */}
          <div className="lg:col-span-8 bg-dark-900 border border-dark-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center">
            {/* Cinema Screen Curve Visualization */}
            <div className="w-full max-w-xl mx-auto mb-10 text-center">
              <div className="screen-curve bg-gradient-to-b from-primary-500/40 via-primary-500/10 to-transparent w-full border-t-2 border-primary-400 rounded-t-full shadow-lg shadow-primary-500/20" />
              <p className="text-[11px] font-bold uppercase tracking-widest text-dark-400 mt-2">
                All Eyes This Way • Cinema Screen
              </p>
            </div>

            {/* Seat Categories Matrix */}
            <div className="w-full space-y-8 overflow-x-auto pb-4 flex flex-col items-center">
              {seatLayout.map((category) => (
                <div key={category.name} className="w-full max-w-xl">
                  {/* Category Header */}
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-dark-800">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary-300">
                        {category.name} Class
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-dark-300">
                      ₹{category.price} / ticket
                    </span>
                  </div>

                  {/* Seat Grid */}
                  <div className="flex flex-wrap justify-center gap-2">
                    {category.seats.map((seat) => {
                      const isSelected = selectedSeats.some(
                        (s) => s.seatNumber === seat.seatNumber
                      );
                      const isHeldByMe = heldSeatsByMe.some(
                        (s) => s.seatNumber === seat.seatNumber
                      );

                      // Determine appearance based on status
                      let seatClasses =
                        'w-8 h-8 sm:w-9 sm:h-9 rounded-t-lg rounded-b-md text-[11px] font-bold flex items-center justify-center transition-all cursor-pointer ';

                      if (seat.status === 'booked') {
                        seatClasses +=
                          'bg-rose-500/80 text-white cursor-not-allowed border border-rose-600 opacity-60';
                      } else if (seat.status === 'held' && !isHeldByMe) {
                        seatClasses +=
                          'bg-amber-500 text-dark-950 font-black cursor-not-allowed border border-amber-600 opacity-75';
                      } else if (isHeldByMe || isSelected) {
                        seatClasses +=
                          'bg-primary-600 text-white border border-primary-400 shadow-md shadow-primary-500/50 scale-105';
                      } else {
                        // Available
                        seatClasses +=
                          'bg-dark-700/80 hover:bg-dark-600 text-dark-300 hover:text-white border border-dark-600/60 hover:scale-105';
                      }

                      return (
                        <motion.button
                          key={seat.seatNumber}
                          whileTap={
                            seat.status === 'available' ? { scale: 0.9 } : undefined
                          }
                          disabled={
                            seat.status === 'booked' ||
                            (seat.status === 'held' && !isHeldByMe)
                          }
                          onClick={() => handleSeatClick(seat)}
                          className={seatClasses}
                          title={`${seat.seatNumber} - ${category.name} (₹${seat.price})`}
                        >
                          {seat.seatNumber}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Seat State Legend */}
            <div className="w-full max-w-xl mt-8 pt-6 border-t border-dark-800 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-dark-300">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-t-md bg-dark-700 border border-dark-600" />
                <span>Available</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-t-md bg-primary-600 border border-primary-400" />
                <span>Selected</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-t-md bg-amber-500 border border-amber-600" />
                <span>Held (10m)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-t-md bg-rose-500/80 border border-rose-600 opacity-60" />
                <span>Booked</span>
              </div>
            </div>
          </div>

          {/* Booking Summary Sidebar (Right, cols 4) */}
          <div className="lg:col-span-4 bg-dark-900 border border-dark-800 rounded-3xl p-6 shadow-2xl sticky top-24 space-y-6">
            <div>
              <h2 className="text-lg font-black text-white flex items-center">
                <Ticket className="w-5 h-5 text-primary-400 mr-2" />
                Booking Summary
              </h2>
              <p className="text-xs text-dark-400 mt-1">
                Review your seats and proceed to hold & confirm
              </p>
            </div>

            {/* Selected Seats Listing */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-dark-400">
                Selected Seats (
                {heldSeatsByMe.length > 0 ? heldSeatsByMe.length : selectedSeats.length})
              </span>

              {(heldSeatsByMe.length > 0 ? heldSeatsByMe : selectedSeats).length === 0 ? (
                <div className="p-4 rounded-2xl bg-dark-950/60 border border-dark-800 text-center text-xs text-dark-400">
                  Click on the available seats on the map to add them to your reservation.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {(heldSeatsByMe.length > 0 ? heldSeatsByMe : selectedSeats).map((s) => (
                    <div
                      key={s.seatNumber}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-dark-950/60 border border-dark-800 text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded font-black bg-primary-600/30 text-primary-300 border border-primary-500/30">
                          {s.seatNumber}
                        </span>
                        <span className="text-dark-300">{s.category}</span>
                      </div>
                      <span className="font-semibold text-white">₹{s.price}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pricing Breakdown */}
            <div className="pt-4 border-t border-dark-800 space-y-2 text-xs">
              <div className="flex justify-between text-dark-400">
                <span>Tickets Subtotal</span>
                <span className="text-dark-200">₹{totalAmount}</span>
              </div>
              <div className="flex justify-between text-dark-400">
                <span>Convenience Fee</span>
                <span className="text-dark-200">₹0 (Free)</span>
              </div>
              <div className="pt-2 border-t border-dark-800 flex justify-between items-center text-sm">
                <span className="font-bold text-white">Total Payable</span>
                <span className="text-xl font-black text-primary-400">₹{totalAmount}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-3">
              {heldSeatsByMe.length === 0 ? (
                <button
                  type="button"
                  onClick={handleHoldSeats}
                  disabled={selectedSeats.length === 0 || isHolding}
                  className={`w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white shadow-xl transition-all flex items-center justify-center space-x-2 ${
                    selectedSeats.length === 0 || isHolding
                      ? 'bg-dark-800 text-dark-500 cursor-not-allowed border border-dark-700/60'
                      : 'bg-primary-600 hover:bg-primary-500 shadow-primary-950/40 hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  {isHolding ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Timer className="w-4 h-4 mr-1 text-primary-200" />
                  )}
                  <span>Hold Seats (10 Mins)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirmBooking}
                  disabled={isConfirming}
                  className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-xl shadow-emerald-950/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
                >
                  {isConfirming ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-1" />
                  )}
                  <span>Confirm Booking (₹{totalAmount})</span>
                </button>
              )}

              <p className="text-[11px] text-dark-400 text-center leading-normal">
                Holding locks your seats in real-time so no one else can book them while you complete payment.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Confirmation Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          navigate(`/booking/confirmation/${confirmedBooking?._id || ''}`);
        }}
        maxWidth="max-w-md"
        showCloseButton={false}
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10" />
          </div>

          <h3 className="text-2xl font-black text-white mb-1">Booking Confirmed!</h3>
          <p className="text-xs text-dark-400 mb-6">
            Your movie tickets have been secured and registered in the system.
          </p>

          <div className="p-4 bg-dark-950 rounded-2xl border border-dark-800 text-left space-y-3 mb-6">
            <div className="flex justify-between items-center pb-2 border-b border-dark-800">
              <span className="text-xs text-dark-400">Booking Reference</span>
              <span className="text-sm font-mono font-bold text-primary-400 tracking-wider">
                {confirmedBooking?.bookingRef || 'CNB-' + Math.random().toString(36).substring(2, 8).toUpperCase()}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-dark-400">Movie</span>
              <span className="font-semibold text-white truncate max-w-[180px]">
                {movie.title}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-dark-400">Seats</span>
              <span className="font-semibold text-white">
                {(confirmedBooking?.seats || heldSeatsByMe).map((s) => s.seatNumber).join(', ')}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-dark-400">Total Paid</span>
              <span className="font-bold text-emerald-400">₹{totalAmount}</span>
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            <button
              onClick={() => {
                setShowSuccessModal(false);
                navigate(`/booking/confirmation/${confirmedBooking?._id || ''}`);
              }}
              className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-primary-600 hover:bg-primary-500 shadow-lg shadow-primary-950/40 transition-all"
            >
              View Ticket & QR Code
            </button>
            <Link
              to="/my-bookings"
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-dark-300 hover:text-white bg-dark-800 hover:bg-dark-700 transition-colors"
            >
              Go to My Bookings
            </Link>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SeatSelectionPage;
