import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Film,
  Calendar,
  Clock,
  Star,
  MapPin,
  ArrowLeft,
  Ticket,
  ArrowUpRight,
  ShieldCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  UtensilsCrossed,
  Sparkles,
  Volume2,
  Tv,
  PlusCircle
} from 'lucide-react';
import { moviesApi, showtimesApi, theatresApi, screensApi } from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { toLocalDateKey } from '../../utils/date';

export const MovieDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDateStr, setSelectedDateStr] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('ALL');
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [isGeneratingShowtimes, setIsGeneratingShowtimes] = useState(false);

  const dateScrollRef = useRef(null);

  // Generate 14 rolling calendar dates starting from today in local time
  const rollingDates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateKey = toLocalDateKey(d);
    const isToday = i === 0;
    const isTomorrow = i === 1;

    let dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    if (isToday) dayLabel = 'TODAY';
    else if (isTomorrow) dayLabel = 'TOMORROW';

    return {
      dateKey,
      dayLabel,
      dayNumber: d.getDate(),
      monthLabel: d.toLocaleDateString('en-US', { month: 'short' }),
      fullFormatted: d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }),
    };
  });

  useEffect(() => {
    fetchMovieAndShowtimes();
  }, [id]);

  const fetchMovieAndShowtimes = async () => {
    try {
      setLoading(true);
      const movieRes = await moviesApi.getById(id);
      const movieObj = movieRes.data?.movie || movieRes.data?.data || movieRes.data;
      setMovie(movieObj);

      try {
        const showtimesRes = await showtimesApi.getByMovie(id);
        let rawList = [];
        if (Array.isArray(showtimesRes.data?.data)) {
          rawList = showtimesRes.data.data;
        } else if (Array.isArray(showtimesRes.data?.showtimes)) {
          rawList = showtimesRes.data.showtimes;
        } else if (Array.isArray(showtimesRes.data)) {
          rawList = showtimesRes.data;
        } else if (Array.isArray(showtimesRes.data?.theatres)) {
          rawList = showtimesRes.data.theatres.flatMap((tGroup) =>
            (tGroup.showtimes || []).map((st) => ({
              ...st,
              screen: {
                ...st.screen,
                theatre: tGroup.theatre,
              },
            }))
          );
        }

        const activeShowtimes = rawList.filter((st) => st.status !== 'cancelled');
        setShowtimes(activeShowtimes);

        // Default date selection: pick today if it has shows, else earliest date with shows
        const todayKey = toLocalDateKey(new Date());
        const showtimesByDateTemp = activeShowtimes.reduce((acc, st) => {
          const dk = toLocalDateKey(st.startTime);
          if (!acc[dk]) acc[dk] = [];
          acc[dk].push(st);
          return acc;
        }, {});

        const availableDateKeys = Object.keys(showtimesByDateTemp)
          .filter((dk) => showtimesByDateTemp[dk].length > 0)
          .sort();

        if (showtimesByDateTemp[todayKey] && showtimesByDateTemp[todayKey].length > 0) {
          setSelectedDateStr(todayKey);
        } else if (availableDateKeys.length > 0) {
          setSelectedDateStr(availableDateKeys[0]);
        } else {
          setSelectedDateStr(todayKey);
        }
      } catch (stErr) {
        console.warn('Could not load showtimes:', stErr);
        setShowtimes([]);
        setSelectedDateStr(toLocalDateKey(new Date()));
      }
      setError(null);
    } catch (err) {
      console.error('Failed to load movie details:', err);
      setError('Movie not found or failed to load.');
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Demo Generator: creates showtimes if a movie has none (e.g. for Gladiator II)
  const handleGenerateDemoShowtimes = async () => {
    try {
      setIsGeneratingShowtimes(true);
      toast.loading('Scheduling upcoming showtimes for this movie...', { id: 'demo-st' });

      // Fetch existing screens
      const screensRes = await screensApi.getAll();
      const screensList = screensRes.data?.data || screensRes.data?.screens || [];

      if (!screensList || screensList.length === 0) {
        toast.error('No screens configured yet. Please configure screens in admin first.', {
          id: 'demo-st',
        });
        return;
      }

      const today = new Date();
      const newShowtimesToCreate = [];

      // Create 6 showtimes spread over today, tomorrow and day after
      for (let dayOffset = 0; dayOffset <= 2; dayOffset++) {
        const screen1 = screensList[0];
        const screen2 = screensList[1] || screensList[0];

        const t1 = new Date(today);
        t1.setDate(t1.getDate() + dayOffset);
        t1.setHours(15, 30, 0, 0);

        const end1 = new Date(t1);
        end1.setMinutes(end1.getMinutes() + (movie?.duration || 140));

        const t2 = new Date(today);
        t2.setDate(t2.getDate() + dayOffset);
        t2.setHours(19, 0, 0, 0);

        const end2 = new Date(t2);
        end2.setMinutes(end2.getMinutes() + (movie?.duration || 140));

        newShowtimesToCreate.push({
          movie: movie._id,
          screen: screen1._id,
          startTime: t1.toISOString(),
          endTime: end1.toISOString(),
          status: 'scheduled',
        });

        newShowtimesToCreate.push({
          movie: movie._id,
          screen: screen2._id,
          startTime: t2.toISOString(),
          endTime: end2.toISOString(),
          status: 'scheduled',
        });
      }

      for (const st of newShowtimesToCreate) {
        try {
          await showtimesApi.create(st);
        } catch (e) {
          console.warn('Showtime creation skipped/collided:', e.message);
        }
      }

      toast.success('Upcoming showtimes scheduled successfully!', { id: 'demo-st' });
      await fetchMovieAndShowtimes();
    } catch (err) {
      console.error('Failed to create demo showtimes:', err);
      toast.error('Could not schedule showtimes automatically.', { id: 'demo-st' });
    } finally {
      setIsGeneratingShowtimes(false);
    }
  };

  const scrollDates = (direction) => {
    if (dateScrollRef.current) {
      dateScrollRef.current.scrollBy({
        left: direction === 'left' ? -180 : 180,
        behavior: 'smooth',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#f7f6f2]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center bg-[#f7f6f2]">
        <div className="bg-white border border-[#e5e3dc] rounded-2xl p-10 shadow-sm">
          <Film className="w-12 h-12 text-[#cf785b] mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold text-[#252824] mb-2">
            {error || 'Movie Not Found'}
          </h2>
          <p className="text-[#777a72] text-sm mb-6">
            The film you are searching for does not exist or has concluded its screening run.
          </p>
          <Link to="/movies" className="nav-cta">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Catalog
          </Link>
        </div>
      </div>
    );
  }

  const poster =
    movie.posterUrl ||
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=85';

  // Group showtimes by local date (YYYY-MM-DD) avoiding timezone day shifts
  const showtimesByDate = showtimes.reduce((acc, st) => {
    const dateKey = toLocalDateKey(st.startTime);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(st);
    return acc;
  }, {});

  const datesWithShows = Object.keys(showtimesByDate)
    .filter((dk) => showtimesByDate[dk] && showtimesByDate[dk].length > 0)
    .sort();

  // Showtimes on selected date
  const rawDateShowtimes = showAllUpcoming ? showtimes : (showtimesByDate[selectedDateStr] || []);

  // Filter by format if selected
  const filteredShowtimes =
    selectedFormat === 'ALL'
      ? rawDateShowtimes
      : rawDateShowtimes.filter((st) => {
          const fmt = (st.screen?.screenType || movie.format || '').toUpperCase();
          return fmt.includes(selectedFormat.toUpperCase());
        });

  // Extract formats present for pill filter
  const availableFormats = [
    'ALL',
    ...Array.from(
      new Set(
        showtimes
          .map((st) => (st.screen?.screenType || movie.format || '').toUpperCase())
          .filter(Boolean)
      )
    ),
  ];

  // Dynamic pricing breakdown from the first showtime's screen
  const sampleScreen = showtimes[0]?.screen;
  const seatCategories = sampleScreen?.seatCategories || [
    { name: 'Silver Tier', price: 250 },
    { name: 'Gold Executive', price: 350 },
    { name: 'Platinum VIP Recliner', price: 450 },
  ];

  const lowestPrice = Math.min(...seatCategories.map((c) => c.price));

  return (
    <div className="min-h-screen bg-[#f7f6f2] text-[#252824] py-8 md:py-14 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <Link
          to="/movies"
          className="inline-flex items-center text-xs font-semibold text-[#777a72] hover:text-[#cf785b] transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Back to all screenings
        </Link>

        {/* Title Header (StayBnb Style) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-[#e5e3dc]">
          <div>
            <div className="eyebrow mb-2">
              <span className="eyebrow-line"></span>
              <span>The CineBook Feature</span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-[#252824]">
              {movie.title}
            </h1>
          </div>

          <div className="text-left md:text-right text-xs text-[#777a72] leading-relaxed">
            <p className="font-semibold text-sm text-[#252824]">
              {movie.format || 'IMAX 3D'} · {movie.language || 'English'}
            </p>
            <p>
              {Math.floor(movie.duration / 60)}h {movie.duration % 60}m · Certificate{' '}
              {movie.rating || 'UA'}
            </p>
          </div>
        </div>

        {/* Visual Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 rounded-2xl overflow-hidden shadow-card">
          <div className="md:col-span-2 aspect-[16/9] md:aspect-auto h-[320px] md:h-[420px] bg-[#e7e5df]">
            <img
              src={poster}
              alt={movie.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="hidden md:flex flex-col gap-4 h-[420px]">
            <div className="h-1/2 bg-[#e7e5df] overflow-hidden relative group">
              <img
                src="https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=600&q=80"
                alt="Cinema Hall Auditorium"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute bottom-3 left-3 px-2 py-0.5 bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold rounded">
                Auditorium Experience
              </span>
            </div>
            <div className="h-1/2 bg-[#e7e5df] overflow-hidden relative group">
              <img
                src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80"
                alt="Luxury Recliner Tier"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute bottom-3 left-3 px-2 py-0.5 bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold rounded">
                Luxury Recliner Tier
              </span>
            </div>
          </div>
        </div>

        {/* In-Seat Cinema Dining & Snack Feature Bar */}
        <div className="mb-10 bg-gradient-to-r from-[#252824] via-[#2f352e] to-[#252824] text-white rounded-2xl p-5 sm:p-6 shadow-md border border-[#3b423a] flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#ffd25d]/20 border border-[#ffd25d]/40 flex items-center justify-center shrink-0 text-2xl">
              🍿
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#ffd25d] text-stone-900 px-2 py-0.5 rounded-full">
                  New Feature
                </span>
                <h4 className="font-display text-base sm:text-lg font-bold text-white">
                  In-Seat Dining & Snacks Delivery
                </h4>
              </div>
              <p className="text-xs text-stone-300 mt-1 max-w-xl">
                Skip concession lines! Order fresh caramel popcorn, warm nachos, burgers, and chilled drinks during seat selection. Delivered straight to your seat before the interval.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-medium text-stone-300 hidden md:inline">
              Available at checkout
            </span>
            <div className="flex -space-x-1">
              {['🍿', '🧀', '🍔', '🥤'].map((emoji, idx) => (
                <span
                  key={idx}
                  className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-sm shadow-xs"
                >
                  {emoji}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Main 2-Column Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          {/* Left Column: Synopsis & Dynamic Showtime Scheduler */}
          <div className="lg:col-span-2 space-y-10">
            {/* Synopsis */}
            <div>
              <h3 className="font-display text-xl font-bold text-[#252824] mb-3">
                The Storyline
              </h3>
              <p className="text-[15px] text-[#555850] leading-relaxed">
                {movie.description ||
                  'Experience this masterfully crafted cinema release on premier curved screens with Dolby Atmos surround audio.'}
              </p>

              <div className="flex flex-wrap gap-2 mt-4">
                {(Array.isArray(movie.genre) ? movie.genre : [movie.genre]).map((g) => (
                  <span
                    key={g}
                    className="px-3 py-1 rounded-full text-xs font-semibold bg-[#e9e8df] text-[#252824]"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>

            {/* Showtime Selection Section */}
            <div className="pt-6 border-t border-[#e5e3dc]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h3 className="font-display text-2xl font-bold text-[#252824]">
                    Select Date & Showtimes
                  </h3>
                  <p className="text-xs text-[#777a72] mt-0.5">
                    Choose your preferred screening date, theatre auditorium, and experience.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* All Upcoming Toggle */}
                  {showtimes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowAllUpcoming((prev) => !prev)}
                      className={`px-3 py-1 text-[11px] font-semibold rounded-full border transition-all ${
                        showAllUpcoming
                          ? 'bg-[#252824] text-white border-[#252824] shadow-xs'
                          : 'bg-white text-[#777a72] border-[#e5e3dc] hover:text-[#252824]'
                      }`}
                    >
                      {showAllUpcoming ? '✓ Showing All Dates' : `All Shows (${showtimes.length})`}
                    </button>
                  )}

                  {/* Format Filter Pills (if multiple available) */}
                  {availableFormats.length > 2 && (
                    <div className="flex gap-1 bg-white p-1 rounded-full border border-[#e5e3dc] shadow-2xs">
                      {availableFormats.map((fmt) => (
                        <button
                          key={fmt}
                          onClick={() => setSelectedFormat(fmt)}
                          className={`px-3 py-1 text-[11px] font-semibold rounded-full transition-all ${
                            selectedFormat === fmt
                              ? 'bg-[#252824] text-white shadow-xs'
                              : 'text-[#777a72] hover:text-[#252824]'
                          }`}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Horizontally Scrollable Date Selector Strip */}
              <div className="relative mb-6">
                {/* Scroll Left Button */}
                <button
                  onClick={() => scrollDates('left')}
                  className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white border border-[#e5e3dc] text-stone-700 shadow-sm flex items-center justify-center hover:bg-[#f7f6f2] transition"
                  aria-label="Scroll dates left"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Scrollable Container */}
                <div
                  ref={dateScrollRef}
                  className="flex gap-2.5 overflow-x-auto no-scrollbar scroll-smooth py-1 px-2 select-none"
                >
                  {rollingDates.map((item) => {
                    const isSelected = item.dateKey === selectedDateStr;
                    const dateShowtimesCount = (showtimesByDate[item.dateKey] || []).length;
                    const hasShows = dateShowtimesCount > 0;

                    return (
                      <button
                        key={item.dateKey}
                        onClick={() => setSelectedDateStr(item.dateKey)}
                        className={`flex flex-col items-center justify-center min-w-[90px] sm:min-w-[100px] py-2.5 px-3 rounded-2xl border transition-all duration-200 shrink-0 ${
                          isSelected
                            ? 'bg-[#252824] border-[#252824] text-white shadow-md scale-[1.02]'
                            : hasShows
                            ? 'bg-white border-[#e5e3dc] text-[#252824] hover:border-[#cf785b] hover:shadow-xs'
                            : 'bg-white/60 border-[#e5e3dc]/70 text-stone-400 hover:border-stone-400'
                        }`}
                      >
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            isSelected
                              ? 'text-[#ffd25d]'
                              : hasShows
                              ? 'text-[#777a72]'
                              : 'text-stone-400'
                          }`}
                        >
                          {item.dayLabel}
                        </span>

                        <span className="font-display text-lg font-bold mt-0.5 leading-tight">
                          {item.dayNumber}{' '}
                          <span className="text-xs font-normal opacity-80">
                            {item.monthLabel}
                          </span>
                        </span>

                        {/* Shows indicator dot/count */}
                        <span
                          className={`text-[9px] font-semibold mt-1 px-1.5 py-0.2 rounded-full ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : hasShows
                              ? 'bg-[#e5eae4] text-[#344638]'
                              : 'bg-stone-100 text-stone-400'
                          }`}
                        >
                          {hasShows ? `${dateShowtimesCount} show${dateShowtimesCount > 1 ? 's' : ''}` : 'No shows'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Scroll Right Button */}
                <button
                  onClick={() => scrollDates('right')}
                  className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white border border-[#e5e3dc] text-stone-700 shadow-sm flex items-center justify-center hover:bg-[#f7f6f2] transition"
                  aria-label="Scroll dates right"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Showtimes List for Selected Date */}
              {filteredShowtimes.length > 0 ? (
                <div className="space-y-4">
                  {filteredShowtimes.map((st) => {
                    const startTime = new Date(st.startTime);
                    const endTime = new Date(st.endTime);
                    const theatreName = st.screen?.theatre?.name || 'Premier Multiplex';
                    const screenName = st.screen?.name || 'Screen 1';
                    const screenType = st.screen?.screenType || 'Standard';
                    const city = st.screen?.theatre?.city || '';

                    return (
                      <div
                        key={st._id}
                        className="p-5 sm:p-6 rounded-2xl bg-white border border-[#e5e3dc] shadow-xs hover:border-[#cf785b] hover:shadow-card transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-5"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="font-display font-bold text-base sm:text-lg text-[#252824]">
                              {theatreName}
                            </span>
                            {city && (
                              <span className="text-xs text-[#777a72]">({city})</span>
                            )}
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#e5eae4] text-[#344638]">
                              {screenType}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-[#777a72] flex-wrap">
                            <span className="flex items-center gap-1 text-[#252824] font-medium">
                              <Tv className="w-3.5 h-3.5 text-[#555850]" />
                              {screenName}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-[#344638] font-medium">
                              <Volume2 className="w-3.5 h-3.5 text-[#344638]" />
                              Dolby Atmos 7.1
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-[#cf785b] font-medium">
                              <UtensilsCrossed className="w-3.5 h-3.5 text-[#cf785b]" />
                              In-Seat Dining Available
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-5 sm:shrink-0 justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-stone-100">
                          <div className="text-left sm:text-right">
                            <span className="font-display text-xl sm:text-2xl font-bold text-[#252824]">
                              {startTime.toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <span className="block text-[10px] font-semibold text-[#5d7159] uppercase tracking-wider">
                              ● Live Seats Open
                            </span>
                          </div>

                          <Link
                            to={`/booking/${st._id}`}
                            className="px-5 py-3 rounded-full bg-[#252824] hover:bg-[#344638] active:scale-95 text-white text-xs font-semibold tracking-tight transition-all flex items-center gap-1.5 shadow-sm"
                          >
                            <span>Select Seats</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Empty state for the date */
                <div className="p-8 sm:p-10 rounded-2xl bg-white border border-[#e5e3dc] text-center shadow-xs">
                  <Film className="w-10 h-10 text-stone-400 mx-auto mb-3" />
                  <h4 className="font-display text-lg font-bold text-[#252824] mb-1">
                    No Showtimes Scheduled for this Date
                  </h4>
                  <p className="text-xs text-[#777a72] max-w-md mx-auto mb-4">
                    We don't have showtimes scheduled for {selectedDateStr}. Select an available date below to view timings:
                  </p>

                  {datesWithShows.length > 0 && (
                    <div className="mb-6">
                      <p className="text-[11px] font-semibold text-[#777a72] uppercase tracking-wider mb-2.5">
                        Available Screening Dates for {movie.title}:
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
                        {datesWithShows.slice(0, 6).map((dk) => {
                          const count = showtimesByDate[dk].length;
                          const [y, m, d] = dk.split('-').map(Number);
                          const dObj = new Date(y, m - 1, d);
                          const label = dObj.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          });
                          return (
                            <button
                              key={dk}
                              onClick={() => {
                                setSelectedDateStr(dk);
                                setShowAllUpcoming(false);
                              }}
                              className="px-3.5 py-2 rounded-xl bg-[#252824] hover:bg-[#cf785b] text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5"
                            >
                              <Calendar className="w-3.5 h-3.5 text-[#ffd25d]" />
                              <span>{label}</span>
                              <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                                {count} {count === 1 ? 'show' : 'shows'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3 justify-center items-center">
                    {showtimes.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowAllUpcoming(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#252824] text-white text-xs font-semibold transition-all shadow-xs"
                      >
                        <span>View All {showtimes.length} Upcoming Shows</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* 1-Click Demo Schedule Button */}
                    <button
                      type="button"
                      onClick={handleGenerateDemoShowtimes}
                      disabled={isGeneratingShowtimes}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#fdf5f2] border border-[#cf785b] text-[#cf785b] hover:bg-[#cf785b] hover:text-white text-xs font-semibold transition-all shadow-xs"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>
                        {isGeneratingShowtimes ? 'Scheduling...' : '⚡ Generate Showtimes for this Movie'}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Sticky Reservation Box (StayBnb Style) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white border border-[#e5e3dc] rounded-2xl p-6 shadow-panel space-y-6">
              <div className="border-b border-[#e5e3dc] pb-4">
                <p className="text-xs text-[#777a72] uppercase tracking-wider font-semibold">
                  Ticket Pricing
                </p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-display text-3xl font-extrabold text-[#252824]">
                    From ₹{lowestPrice}.00
                  </span>
                  <span className="text-xs text-[#777a72]">/ seat</span>
                </div>
              </div>

              {/* Seating Tiers Breakdown */}
              <div className="space-y-2.5 text-xs">
                {seatCategories.map((cat) => (
                  <div
                    key={cat.name}
                    className="flex justify-between py-1.5 border-b border-[#f0efe9] last:border-0"
                  >
                    <span className="text-[#555850] font-medium">{cat.name}</span>
                    <span className="font-semibold text-[#252824]">₹{cat.price}.00</span>
                  </div>
                ))}
              </div>

              {/* Guarantee checklist */}
              <div className="space-y-2.5 text-xs text-[#555850] bg-[#f7f6f2] p-4 rounded-xl">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#5d7159] shrink-0" />
                  <span>10-minute pessimistic seat hold guarantee</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#5d7159] shrink-0" />
                  <span>In-seat dining & fresh meal delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#5d7159] shrink-0" />
                  <span>Digital QR boarding pass issued instantly</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#5d7159] shrink-0" />
                  <span>Instant simulated refund on cancellation</span>
                </div>
              </div>

              <p className="text-[11px] text-[#777a72] text-center">
                Click on any scheduled showtime on the left to enter the interactive auditorium layout.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetailPage;
