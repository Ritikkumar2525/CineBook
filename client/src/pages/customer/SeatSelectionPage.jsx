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
  ArrowUpRight,
  UtensilsCrossed,
  Plus,
  Minus,
  Sparkles,
  ShoppingBag,
  Trash2
} from 'lucide-react';
import { showtimesApi, bookingsApi, mealsApi } from '../../services/api';
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

  // In-Seat Meal & Snack Ordering State
  const [meals, setMeals] = useState([]);
  const [mealCategories, setMealCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [vegOnly, setVegOnly] = useState(false);
  const [mealCart, setMealCart] = useState({}); // { [itemId]: quantity }
  const [showMealSection, setShowMealSection] = useState(true);

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

  // Fetch meals catalog on mount
  useEffect(() => {
    const fetchMeals = async () => {
      try {
        const res = await mealsApi.getCatalog();
        const data = res.data?.data || [];
        setMeals(data);
        const cats = res.data?.categories || Array.from(new Set(data.map((m) => m.category)));
        setMealCategories(['ALL', ...cats]);
      } catch (err) {
        console.warn('Failed to load meals catalog:', err);
      }
    };
    fetchMeals();
  }, []);

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

  // In-Seat Meal Cart Operations
  const handleUpdateMealQty = (mealId, delta) => {
    setMealCart((prev) => {
      const currentQty = prev[mealId] || 0;
      const newQty = Math.max(0, Math.min(10, currentQty + delta));
      const updated = { ...prev };
      if (newQty === 0) {
        delete updated[mealId];
      } else {
        updated[mealId] = newQty;
      }
      return updated;
    });
  };

  const handleRemoveMeal = (mealId) => {
    setMealCart((prev) => {
      const updated = { ...prev };
      delete updated[mealId];
      return updated;
    });
  };

  // Subtotals and Grand Total
  const ticketsSubtotal = selectedSeats.reduce((acc, s) => acc + s.price, 0);

  const mealItemsInCart = Object.entries(mealCart)
    .filter(([_, qty]) => qty > 0)
    .map(([itemId, qty]) => {
      const item = meals.find((m) => m.id === itemId);
      return {
        ...item,
        quantity: qty,
        lineTotal: (item?.price || 0) * qty,
      };
    })
    .filter((item) => Boolean(item.id));

  const mealsSubtotal = mealItemsInCart.reduce((acc, item) => acc + item.lineTotal, 0);
  const totalAmount = ticketsSubtotal + mealsSubtotal;

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

  // Step 2: Confirm booking (including seats + in-seat meals!)
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

      const mealOrdersPayload = mealItemsInCart.map((m) => ({
        itemId: m.id,
        quantity: m.quantity,
      }));

      const res = await bookingsApi.createBooking({
        showtimeId,
        seats: seatIds,
        mealOrders: mealOrdersPayload,
      });

      const bookingResult = res.data?.data || res.data;
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setConfirmedBooking(bookingResult);
      setShowSuccessModal(true);
      toast.success('Reservation and In-Seat meal orders confirmed!');
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

  // Filtered meals
  const filteredMeals = meals.filter((item) => {
    const matchesCat =
      selectedCategory === 'ALL' ||
      item.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesVeg = !vegOnly || item.isVeg;
    return matchesCat && matchesVeg;
  });

  return (
    <div className="min-h-screen bg-[#f7f6f2] text-[#252824] py-8 md:py-12 select-none">
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
                  {screen.screenType || movie.format || 'IMAX'}
                </span>
              </div>
              <p className="text-xs text-[#777a72] mt-0.5">
                {theatre.name || 'Multiplex'} · {screen.name || 'Screen 1'} ·{' '}
                {new Date(showtime.startTime).toLocaleDateString([], {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}{' '}
                at{' '}
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
              className="flex items-center space-x-2.5 px-4 py-2 rounded-full bg-[#fdf5f2] border border-[#cf785b] text-[#cf785b] self-start md:self-auto shadow-xs"
            >
              <Timer className="w-4 h-4 animate-pulse" />
              <div className="flex items-baseline gap-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider">
                  Seat Hold Expires In:
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
          {/* Main Area: Seating Layout & Meal Selection (Cols 8) */}
          <div className="lg:col-span-8 space-y-8">
            {/* 1. Auditorium Seating Matrix Card */}
            <div className="bg-white border border-[#e5e3dc] rounded-2xl p-6 sm:p-8 shadow-card flex flex-col items-center">
              <div className="w-full flex items-center justify-between pb-3 mb-6 border-b border-[#e5e3dc]">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#252824] text-white text-xs font-bold flex items-center justify-center">
                    1
                  </span>
                  <h3 className="font-display text-lg font-bold text-[#252824]">
                    Select Auditorium Seats
                  </h3>
                </div>
                <span className="text-xs text-[#777a72]">
                  {selectedSeats.length} seat{selectedSeats.length === 1 ? '' : 's'} selected
                </span>
              </div>

              {/* Cinema Screen Arch */}
              <div className="w-full max-w-xl mx-auto mb-10 text-center">
                <div className="cinema-screen-arch w-full" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#777a72] mt-2">
                  Auditorium Curved Screen
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
                                'w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-[11px] font-bold flex items-center justify-center transition-all ';

                              if (seat.status === 'booked') {
                                btnStyle += 'bg-[#e7e5df] text-[#9ea098] border border-[#d8d6cc] cursor-not-allowed';
                              } else if (seat.status === 'held' && !isHeldByMe && !seat.isHeldByCurrentUser) {
                                btnStyle += 'bg-[#f5e6d3] text-[#8c5825] border border-[#e2be9b] cursor-not-allowed';
                              } else if (isSelected || isHeldByMe) {
                                btnStyle += 'bg-[#cf785b] border border-[#cf785b] text-white shadow-sm scale-105';
                              } else {
                                btnStyle += 'bg-white hover:border-[#cf785b] border border-[#d8d6cc] text-[#252824] hover:scale-105 shadow-2xs';
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

            {/* 2. In-Seat Dining & Snacks Delivery Card (New Feature!) */}
            <div className="bg-white border border-[#e5e3dc] rounded-2xl p-6 sm:p-8 shadow-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-[#e5e3dc] gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#cf785b] text-white text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-bold text-[#252824] flex items-center gap-2">
                      <span>Order Food & Beverages to Your Seat</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#ffd25d]/30 text-stone-900 border border-[#ffd25d]/50 font-sans font-semibold">
                        In-Seat Delivery
                      </span>
                    </h3>
                    <p className="text-xs text-[#777a72] mt-0.5">
                      Snacks and drinks will be delivered fresh to{' '}
                      <strong className="text-[#252824]">
                        {selectedSeats.length > 0
                          ? `Seat ${selectedSeats.map((s) => s.seatId).join(', ')}`
                          : 'your reserved seat'}
                      </strong>{' '}
                      before the intermission.
                    </p>
                  </div>
                </div>

                {/* Veg Only Switch */}
                <label className="flex items-center gap-2 cursor-pointer select-none self-start sm:self-auto">
                  <input
                    type="checkbox"
                    checked={vegOnly}
                    onChange={(e) => setVegOnly(e.target.checked)}
                    className="w-4 h-4 accent-[#344638] rounded"
                  />
                  <span className="text-xs font-semibold text-[#344638] flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                    Veg Only
                  </span>
                </label>
              </div>

              {/* Category Filter Pills */}
              <div className="flex gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
                {mealCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-[#252824] text-white shadow-xs'
                        : 'bg-[#f7f6f2] hover:bg-[#e9e8df] text-[#555850]'
                    }`}
                  >
                    {cat === 'ALL' ? '🍽️ All Menus' : cat}
                  </button>
                ))}
              </div>

              {/* Meals Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredMeals.map((meal) => {
                  const qty = mealCart[meal.id] || 0;

                  return (
                    <div
                      key={meal.id}
                      className={`p-3.5 rounded-2xl border transition-all flex gap-3.5 items-center justify-between ${
                        qty > 0
                          ? 'border-[#cf785b] bg-[#fdfcf9] shadow-xs'
                          : 'border-[#e5e3dc] bg-white hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Food Image with Veg / Non-Veg Indicator */}
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-stone-100 shrink-0">
                          <img
                            src={meal.image}
                            alt={meal.name}
                            className="w-full h-full object-cover"
                          />
                          <span
                            className={`absolute top-1 left-1 w-3 h-3 rounded-full border border-white flex items-center justify-center ${
                              meal.isVeg ? 'bg-emerald-600' : 'bg-red-600'
                            }`}
                            title={meal.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                          />
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-[#252824] truncate leading-tight">
                            {meal.name}
                          </h4>
                          <p className="text-[10px] text-[#777a72] line-clamp-1 mt-0.5">
                            {meal.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-display font-bold text-sm text-[#252824]">
                              ₹{meal.price}.00
                            </span>
                            {meal.calories && (
                              <span className="text-[9px] text-stone-400 font-medium">
                                {meal.calories}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Add Button or Stepper */}
                      <div className="shrink-0 ml-2">
                        {qty === 0 ? (
                          <button
                            type="button"
                            onClick={() => handleUpdateMealQty(meal.id, 1)}
                            className="px-3 py-1.5 rounded-full border border-[#cf785b] bg-[#fdf5f2] text-[#cf785b] hover:bg-[#cf785b] hover:text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1 active:scale-95"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5 bg-white border border-[#cf785b] rounded-full p-0.5 shadow-xs">
                            <button
                              type="button"
                              onClick={() => handleUpdateMealQty(meal.id, -1)}
                              className="w-6 h-6 rounded-full bg-[#fdf5f2] hover:bg-[#cf785b] hover:text-white text-[#cf785b] flex items-center justify-center transition"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-bold text-xs px-1 text-[#252824]">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateMealQty(meal.id, 1)}
                              className="w-6 h-6 rounded-full bg-[#cf785b] text-white hover:bg-[#b85d38] flex items-center justify-center transition"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom In-Seat Assurance Note */}
              <div className="mt-6 p-3.5 rounded-xl bg-[#f7f6f2] border border-[#e5e3dc] flex items-center gap-3 text-xs text-[#555850]">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  Your meal orders are securely synced with your seat booking. The cinema kitchen prepares them hot and ushers deliver them directly to your row & seat during the movie intermission.
                </span>
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
                Pessimistic hold locks seats + in-seat dining sync
              </p>
            </div>

            {/* Selected Seats List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#777a72]">
                  Selected Seats ({selectedSeats.length})
                </span>
                <span className="text-xs font-semibold text-[#252824]">
                  ₹{ticketsSubtotal}.00
                </span>
              </div>

              {selectedSeats.length === 0 ? (
                <div className="p-3.5 rounded-xl bg-[#f7f6f2] border border-[#e5e3dc] text-center text-xs text-[#777a72]">
                  Click on auditorium seats to reserve them.
                </div>
              ) : (
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {selectedSeats.map((s) => (
                    <div
                      key={s.seatId}
                      className="flex items-center justify-between p-2 rounded-lg bg-[#f7f6f2] border border-[#e5e3dc] text-xs"
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

            {/* In-Seat Food & Beverages in Cart */}
            <div className="pt-4 border-t border-[#e5e3dc] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#777a72] flex items-center gap-1.5">
                  <UtensilsCrossed className="w-3.5 h-3.5 text-[#cf785b]" />
                  In-Seat Meals ({mealItemsInCart.length})
                </span>
                <span className="text-xs font-semibold text-[#252824]">
                  ₹{mealsSubtotal}.00
                </span>
              </div>

              {mealItemsInCart.length === 0 ? (
                <p className="text-[11px] text-[#777a72] italic bg-[#fdfcf9] p-2.5 rounded-lg border border-dashed border-[#e5e3dc]">
                  No snacks added yet. Browse the menu on the left to add fresh popcorn or drinks to your seat!
                </p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {mealItemsInCart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-[#fdfcf9] border border-[#e5e3dc] text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-[#252824] truncate">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-[#777a72]">
                          Qty: {item.quantity} × ₹{item.price}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-semibold text-[#252824]">
                          ₹{item.lineTotal}.00
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMeal(item.id)}
                          className="text-stone-400 hover:text-red-500 transition"
                          title="Remove item"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pricing Details */}
            <div className="pt-4 border-t border-[#e5e3dc] space-y-2 text-xs">
              <div className="flex justify-between text-[#777a72]">
                <span>Tickets Subtotal</span>
                <span className="text-[#252824] font-medium">₹{ticketsSubtotal}.00</span>
              </div>
              {mealsSubtotal > 0 && (
                <div className="flex justify-between text-[#777a72]">
                  <span>In-Seat Dining Subtotal</span>
                  <span className="text-[#cf785b] font-medium">₹{mealsSubtotal}.00</span>
                </div>
              )}
              <div className="flex justify-between text-[#777a72]">
                <span>Convenience & Delivery Fee</span>
                <span className="text-[#5d7159] font-medium">₹0.00 (Free In-Seat Delivery)</span>
              </div>
              <div className="pt-2 border-t border-[#e5e3dc] flex justify-between items-center text-sm">
                <span className="font-bold text-[#252824]">Grand Total</span>
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
                  className="w-full py-3.5 px-4 rounded-full text-xs font-semibold text-white bg-[#cf785b] hover:bg-[#b85d38] active:scale-95 shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  {isConfirming ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  <span>Confirm Booking & Meals (₹{totalAmount}.00)</span>
                </button>
              )}

              <p className="text-[11px] text-[#777a72] text-center leading-relaxed">
                Holding locks your seats in MongoDB. Your meals will be prepared hot for your showtime.
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
            Your tickets & in-seat dining order are secured. Digital QR pass generated.
          </p>

          <div className="p-4 rounded-xl bg-[#f7f6f2] border border-[#e5e3dc] mb-6 text-left space-y-2 text-xs">
            <p className="flex justify-between">
              <strong className="text-[#777a72]">Booking Ref:</strong>{' '}
              <span className="font-mono font-bold text-[#252824]">
                {confirmedBooking?.bookingRef}
              </span>
            </p>
            <p className="flex justify-between">
              <strong className="text-[#777a72]">Reserved Seats:</strong>{' '}
              <span className="font-semibold text-[#252824]">
                {confirmedBooking?.seats?.map((s) => s.seatId).join(', ')}
              </span>
            </p>
            {confirmedBooking?.mealOrders && confirmedBooking.mealOrders.length > 0 && (
              <p className="flex justify-between text-[#cf785b]">
                <strong>In-Seat Meals:</strong>{' '}
                <span className="font-semibold">
                  {confirmedBooking.mealOrders.reduce((sum, m) => sum + m.quantity, 0)} item(s) ordered
                </span>
              </p>
            )}
            <p className="flex justify-between pt-1 border-t border-[#e5e3dc]">
              <strong className="text-[#777a72]">Total Paid:</strong>{' '}
              <span className="font-bold text-[#252824] text-sm">
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
