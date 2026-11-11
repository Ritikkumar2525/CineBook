import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  Check
} from 'lucide-react';
import { moviesApi, showtimesApi } from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export const MovieDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');

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
        const showtimesList =
          showtimesRes.data?.showtimes || showtimesRes.data?.data || showtimesRes.data || [];
        const activeShowtimes = (Array.isArray(showtimesList) ? showtimesList : []).filter(
          (st) => st.status !== 'cancelled'
        );
        setShowtimes(activeShowtimes);

        if (activeShowtimes.length > 0) {
          const firstDate = new Date(activeShowtimes[0].startTime).toISOString().split('T')[0];
          setSelectedDate(firstDate);
        }
      } catch (stErr) {
        console.warn('Could not load showtimes:', stErr);
        setShowtimes([]);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to load movie details:', err);
      setError('Movie not found or failed to load.');
    } finally {
      setLoading(false);
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

  // Group showtimes by date (YYYY-MM-DD)
  const showtimesByDate = showtimes.reduce((acc, st) => {
    const dateKey = new Date(st.startTime).toISOString().split('T')[0];
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(st);
    return acc;
  }, {});

  const availableDates = Object.keys(showtimesByDate).sort();
  const activeDate =
    selectedDate && availableDates.includes(selectedDate)
      ? selectedDate
      : availableDates[0] || '';

  const activeShowtimes = showtimesByDate[activeDate] || [];

  return (
    <div className="min-h-screen bg-[#f7f6f2] text-[#252824] py-10 md:py-16">
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
              {movie.format || 'IMAX 3D'} · {movie.language}
            </p>
            <p>
              {movie.duration} minutes · Certificate {movie.rating || 'UA'}
            </p>
          </div>
        </div>

        {/* StayBnb Visual Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 rounded-xl overflow-hidden shadow-card">
          <div className="md:col-span-2 aspect-[16/9] md:aspect-auto h-[320px] md:h-[420px] bg-[#e7e5df]">
            <img
              src={poster}
              alt={movie.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="hidden md:flex flex-col gap-4 h-[420px]">
            <div className="h-1/2 bg-[#e7e5df] rounded-none overflow-hidden relative">
              <img
                src="https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=600&q=80"
                alt="Cinema Hall"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-3 left-3 px-2 py-0.5 bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold rounded">
                Auditorium Experience
              </span>
            </div>
            <div className="h-1/2 bg-[#e7e5df] rounded-none overflow-hidden relative">
              <img
                src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80"
                alt="Screening Room"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-3 left-3 px-2 py-0.5 bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold rounded">
                Luxury Recliner Tier
              </span>
            </div>
          </div>
        </div>

        {/* Main 2-Column Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column: Synopsis & Showtime Scheduler */}
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
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-display text-2xl font-bold text-[#252824]">
                    Available Showtimes
                  </h3>
                  <p className="text-xs text-[#777a72] mt-0.5">
                    Select a date and auditorium to reserve your seats.
                  </p>
                </div>
              </div>

              {/* Date Selector Tabs */}
              {availableDates.length > 0 ? (
                <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-none mb-6">
                  {availableDates.map((dateStr) => {
                    const d = new Date(dateStr + 'T00:00:00');
                    const isSelected = dateStr === activeDate;
                    return (
                      <button
                        key={dateStr}
                        onClick={() => setSelectedDate(dateStr)}
                        className={`px-4 py-3 rounded-lg border text-left transition-all min-w-[120px] ${
                          isSelected
                            ? 'bg-[#252824] border-[#252824] text-white shadow-sm'
                            : 'bg-white border-[#e5e3dc] text-[#252824] hover:border-[#cf785b]'
                        }`}
                      >
                        <span className="block text-[10px] uppercase font-bold tracking-wider opacity-70">
                          {d.toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                        <span className="block text-sm font-bold font-display mt-0.5">
                          {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 rounded-xl bg-white border border-[#e5e3dc] text-center text-sm text-[#777a72]">
                  No showtimes currently scheduled for this film. Please check back soon or browse other movies.
                </div>
              )}

              {/* Showtimes Grid */}
              <div className="space-y-4">
                {activeShowtimes.map((st) => {
                  const startTime = new Date(st.startTime);
                  const theatreName = st.screen?.theatre?.name || 'Premier Multiplex';
                  const screenName = st.screen?.name || 'Screen 1';
                  const city = st.screen?.theatre?.city || '';

                  return (
                    <div
                      key={st._id}
                      className="p-5 rounded-xl bg-white border border-[#e5e3dc] shadow-sm hover:border-[#cf785b] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-display font-bold text-base text-[#252824]">
                            {theatreName}
                          </span>
                          {city && (
                            <span className="text-xs text-[#777a72]">({city})</span>
                          )}
                        </div>
                        <p className="text-xs text-[#777a72]">
                          Auditorium: <strong className="text-[#252824]">{screenName}</strong> ·{' '}
                          {st.screen?.screenType || 'Standard'}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="font-display text-lg font-bold text-[#252824]">
                            {startTime.toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span className="block text-[10px] font-semibold text-[#5d7159] uppercase tracking-wider">
                            Seats Available
                          </span>
                        </div>

                        <Link
                          to={`/booking/${st._id}`}
                          className="px-4 py-2.5 rounded-full bg-[#252824] hover:bg-[#344638] text-white text-xs font-semibold tracking-tight transition-colors flex items-center gap-1.5"
                        >
                          <span>Select Seats</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Reservation Box (StayBnb Style) */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 bg-white border border-[#e5e3dc] rounded-2xl p-6 shadow-panel space-y-6">
              <div className="border-b border-[#e5e3dc] pb-4">
                <p className="text-xs text-[#777a72] uppercase tracking-wider font-semibold">
                  Ticket Pricing
                </p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-display text-3xl font-extrabold text-[#252824]">
                    From ₹250.00
                  </span>
                  <span className="text-xs text-[#777a72]">/ seat</span>
                </div>
              </div>

              {/* Seating Tiers Breakdown */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#f0efe9]">
                  <span className="text-[#777a72]">Silver Tier</span>
                  <span className="font-semibold text-[#252824]">₹250.00</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#f0efe9]">
                  <span className="text-[#777a72]">Gold Executive</span>
                  <span className="font-semibold text-[#252824]">₹350.00</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#777a72]">Platinum VIP Recliner</span>
                  <span className="font-semibold text-[#252824]">₹450.00</span>
                </div>
              </div>

              {/* Guarantee checklist */}
              <div className="space-y-2.5 text-xs text-[#555850] bg-[#f7f6f2] p-4 rounded-xl">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#5d7159] flex-shrink-0" />
                  <span>10-minute temporary seat hold guarantee</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#5d7159] flex-shrink-0" />
                  <span>Digital QR pass issued upon confirmation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#5d7159] flex-shrink-0" />
                  <span>Instant simulated refund on cancellation</span>
                </div>
              </div>

              <p className="text-[11px] text-[#777a72] text-center">
                Click on any scheduled showtime to enter the interactive seating matrix.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetailPage;
