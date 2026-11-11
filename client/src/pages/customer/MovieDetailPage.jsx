import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Film,
  Calendar,
  Clock,
  Star,
  MapPin,
  Sparkles,
  ChevronRight,
  Tv,
  ArrowLeft,
  Ticket
} from 'lucide-react';
import { moviesApi, showtimesApi } from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';

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
      // Fetch movie details
      const movieRes = await moviesApi.getById(id);
      const movieObj = movieRes.data?.movie || movieRes.data?.data || movieRes.data;
      setMovie(movieObj);

      // Fetch showtimes for this movie
      try {
        const showtimesRes = await showtimesApi.getByMovie(id);
        const showtimesList =
          showtimesRes.data?.showtimes || showtimesRes.data?.data || showtimesRes.data || [];
        const activeShowtimes = (Array.isArray(showtimesList) ? showtimesList : []).filter(
          (st) => st.status !== 'cancelled'
        );
        setShowtimes(activeShowtimes);

        // Set initial selected date if showtimes exist
        if (activeShowtimes.length > 0) {
          const firstDate = new Date(activeShowtimes[0].startTime).toISOString().split('T')[0];
          setSelectedDate(firstDate);
        }
      } catch (stErr) {
        console.warn('Could not load specific showtimes:', stErr);
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
      <div className="min-h-[70vh] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading movie details..." />
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="bg-dark-900 border border-dark-800 rounded-3xl p-10">
          <Film className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">{error || 'Movie Not Found'}</h2>
          <p className="text-dark-400 text-sm mb-6">
            The movie you are looking for does not exist or has been removed.
          </p>
          <Link
            to="/movies"
            className="inline-flex items-center px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold text-sm transition-all shadow-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Movies
          </Link>
        </div>
      </div>
    );
  }

  const genres = Array.isArray(movie.genre)
    ? movie.genre
    : (movie.genre || '').split(',').map((g) => g.trim()).filter(Boolean);

  const poster =
    movie.posterUrl ||
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80';

  // Group showtimes by date (YYYY-MM-DD)
  const showtimesByDate = showtimes.reduce((acc, st) => {
    const dateKey = new Date(st.startTime).toISOString().split('T')[0];
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(st);
    return acc;
  }, {});

  const availableDates = Object.keys(showtimesByDate).sort();

  // If selectedDate is not set or not in availableDates, fallback to first
  const activeDate =
    selectedDate && availableDates.includes(selectedDate)
      ? selectedDate
      : availableDates[0] || '';

  const currentDayShowtimes = activeDate ? showtimesByDate[activeDate] || [] : [];

  // Group currentDayShowtimes by Theatre
  const showtimesByTheatre = currentDayShowtimes.reduce((acc, st) => {
    const theatreName = st.theatre?.name || st.theatreName || 'CineBook Main Cinema';
    const theatreLocation = st.theatre?.location || st.theatre?.city || 'Downtown';
    const theatreId = st.theatre?._id || theatreName;

    if (!acc[theatreId]) {
      acc[theatreId] = {
        name: theatreName,
        location: theatreLocation,
        showtimes: [],
      };
    }
    acc[theatreId].showtimes.push(st);
    return acc;
  }, {});

  return (
    <div className="min-h-screen pb-20">
      {/* Movie Banner Backdrop */}
      <div className="relative w-full h-[360px] sm:h-[460px] lg:h-[500px] overflow-hidden bg-dark-950">
        <img
          src={poster}
          alt={movie.title}
          className="w-full h-full object-cover object-center filter blur-lg scale-110 opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/70 to-dark-950/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-dark-950 via-dark-950/80 to-transparent" />

        {/* Breadcrumb Back */}
        <div className="absolute top-6 left-4 sm:left-8 z-10">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-dark-900/80 hover:bg-dark-800 text-dark-200 hover:text-white backdrop-blur-md border border-dark-700/60 text-xs font-semibold transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
        </div>
      </div>

      {/* Main Movie Info Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-64 sm:-mt-72 relative z-20">
        <div className="flex flex-col md:flex-row items-start gap-8 lg:gap-12 mb-12">
          {/* Movie Poster Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-48 sm:w-64 lg:w-72 flex-shrink-0 mx-auto md:mx-0 rounded-2xl overflow-hidden shadow-2xl border border-dark-700/80 bg-dark-900 group"
          >
            <img
              src={poster}
              alt={movie.title}
              className="w-full aspect-[2/3] object-cover"
              onError={(e) => {
                e.target.src =
                  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80';
              }}
            />
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex-1 text-center md:text-left"
          >
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
              <Badge status={movie.status || 'now_showing'} />
              {movie.format && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-600/80 text-white border border-primary-500/40">
                  {movie.format}
                </span>
              )}
              {movie.language && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-dark-800 text-dark-200 border border-dark-700">
                  {movie.language}
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-3">
              {movie.title}
            </h1>

            {/* Quick Metrics Bar */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-6 text-sm text-dark-300 mb-6">
              {movie.rating && (
                <div className="flex items-center text-amber-400 font-bold">
                  <Star className="w-4 h-4 fill-amber-400 mr-1.5" />
                  <span>{movie.rating} Rating</span>
                </div>
              )}
              {movie.duration && (
                <div className="flex items-center">
                  <Clock className="w-4 h-4 text-dark-400 mr-1.5" />
                  <span>{movie.duration} mins</span>
                </div>
              )}
              {movie.releaseDate && (
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 text-dark-400 mr-1.5" />
                  <span>
                    {new Date(movie.releaseDate).toLocaleDateString(undefined, {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Genres */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-6">
              {genres.map((genre, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-xl text-xs font-medium bg-dark-900/90 text-primary-300 border border-dark-700/80 shadow-sm"
                >
                  {genre}
                </span>
              ))}
            </div>

            {/* Storyline */}
            <div className="max-w-3xl">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-dark-400 mb-2">
                Synopsis
              </h3>
              <p className="text-dark-300 text-sm sm:text-base leading-relaxed">
                {movie.description || 'No description available for this movie.'}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Showtimes & Booking Section */}
        <section className="mt-12 bg-dark-900 border border-dark-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-dark-800 gap-4">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center">
                <Ticket className="w-6 h-6 text-primary-400 mr-2.5" />
                Select Showtime
              </h2>
              <p className="text-xs sm:text-sm text-dark-400 mt-1">
                Pick a date and choose your preferred theatre screen time
              </p>
            </div>

            {/* Date Selector Pills */}
            {availableDates.length > 0 && (
              <div className="flex items-center space-x-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
                {availableDates.map((dateStr) => {
                  const dateObj = new Date(dateStr + 'T00:00:00');
                  const isSelected = dateStr === activeDate;
                  const dayName = dateObj.toLocaleDateString(undefined, { weekday: 'short' });
                  const dayNum = dateObj.getDate();
                  const monthName = dateObj.toLocaleDateString(undefined, { month: 'short' });

                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`flex flex-col items-center justify-center px-4 py-2.5 rounded-2xl min-w-[70px] border transition-all ${
                        isSelected
                          ? 'bg-primary-600 border-primary-500 text-white shadow-lg shadow-primary-950/40 ring-2 ring-primary-400/50 scale-105'
                          : 'bg-dark-800 border-dark-700/80 text-dark-300 hover:text-white hover:bg-dark-700'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold tracking-wider">
                        {dayName}
                      </span>
                      <span className="text-lg font-black">{dayNum}</span>
                      <span className="text-[10px] text-dark-400 font-medium">{monthName}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Showtimes List */}
          {availableDates.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No Showtimes Available"
              description="There are currently no scheduled showtimes for this movie. Please check back later."
            />
          ) : Object.keys(showtimesByTheatre).length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No shows for this date"
              description="Please select another date above to view available showtimes."
            />
          ) : (
            <div className="space-y-6">
              {Object.entries(showtimesByTheatre).map(([theatreId, theatreGroup]) => (
                <div
                  key={theatreId}
                  className="bg-dark-950/60 border border-dark-800 rounded-2xl p-5 sm:p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-dark-800/80 gap-2">
                    <div>
                      <h4 className="text-lg font-bold text-white flex items-center">
                        <MapPin className="w-4 h-4 text-primary-400 mr-2" />
                        {theatreGroup.name}
                      </h4>
                      <p className="text-xs text-dark-400 ml-6">{theatreGroup.location}</p>
                    </div>
                  </div>

                  {/* Showtimes slots */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {theatreGroup.showtimes.map((st) => {
                      const startTime = new Date(st.startTime);
                      const timeStr = startTime.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      });
                      const screenName = st.screen?.name || st.screenName || 'Screen 1';
                      const availableSeats =
                        st.availableSeatsCount !== undefined
                          ? st.availableSeatsCount
                          : st.screen?.totalSeats || 'Available';

                      return (
                        <Link
                          key={st._id}
                          to={`/booking/${st._id}`}
                          className="group/slot flex flex-col p-3 rounded-xl bg-dark-900 border border-dark-700/80 hover:border-primary-500 hover:bg-dark-850 transition-all shadow hover:shadow-primary-950/30 text-center"
                        >
                          <span className="text-sm font-bold text-white group-hover/slot:text-primary-400 transition-colors">
                            {timeStr}
                          </span>
                          <span className="text-[11px] text-dark-400 mt-0.5 truncate flex items-center justify-center">
                            <Tv className="w-3 h-3 mr-1 text-dark-500" />
                            {screenName}
                          </span>
                          <div className="mt-2 pt-2 border-t border-dark-800 flex items-center justify-between text-[10px]">
                            <span className="text-emerald-400 font-medium">
                              {typeof availableSeats === 'number'
                                ? `${availableSeats} seats`
                                : 'Available'}
                            </span>
                            <span className="text-primary-400 font-semibold group-hover/slot:translate-x-0.5 transition-transform">
                              Book &rarr;
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default MovieDetailPage;
