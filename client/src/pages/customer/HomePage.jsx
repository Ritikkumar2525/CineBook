import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Film, Play, Star, Clock, Calendar, ArrowRight, Sparkles } from 'lucide-react';
import { moviesApi } from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import SearchBar from '../../components/ui/SearchBar';
import Badge from '../../components/ui/Badge';

export const HomePage = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const res = await moviesApi.getAll();
      const movieData = res.data?.movies || res.data?.data || res.data || [];
      setMovies(Array.isArray(movieData) ? movieData : []);
      setError(null);
    } catch (err) {
      console.error('Failed to load movies:', err);
      setError('Unable to load movies. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (q) => {
    if (q && q.trim()) {
      navigate(`/movies?search=${encodeURIComponent(q.trim())}`);
    }
  };

  const nowShowing = movies.filter(
    (m) => (m.status || '').toLowerCase() === 'now_showing' || !m.status
  );
  const comingSoon = movies.filter(
    (m) => (m.status || '').toLowerCase() === 'coming_soon'
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  const MovieCard = ({ movie }) => {
    const genres = Array.isArray(movie.genre)
      ? movie.genre
      : (movie.genre || '').split(',').map((g) => g.trim()).filter(Boolean);

    const poster =
      movie.posterUrl ||
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80';

    return (
      <motion.div
        variants={cardVariants}
        whileHover={{ y: -8, transition: { duration: 0.2 } }}
        className="group relative bg-dark-900 rounded-2xl overflow-hidden border border-dark-800 shadow-xl flex flex-col justify-between transition-all hover:border-primary-500/50 hover:shadow-primary-950/40"
      >
        <Link to={`/movies/${movie._id}`} className="block relative aspect-[2/3] overflow-hidden bg-dark-950">
          <img
            src={poster}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.target.src =
                'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

          {/* Format / Status badges on poster */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {movie.format && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary-600/90 text-white backdrop-blur-md shadow">
                {movie.format}
              </span>
            )}
            {movie.language && (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-dark-900/80 text-dark-200 backdrop-blur-md border border-dark-700/60">
                {movie.language}
              </span>
            )}
          </div>

          {movie.rating && (
            <div className="absolute top-3 right-3 flex items-center space-x-1 px-2 py-0.5 rounded bg-dark-900/80 backdrop-blur-md border border-dark-700/60 text-amber-400 text-xs font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>{movie.rating}</span>
            </div>
          )}
        </Link>

        {/* Info */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap gap-1 mb-2">
              {genres.slice(0, 2).map((g, idx) => (
                <span
                  key={idx}
                  className="text-[11px] font-medium text-primary-400 bg-primary-950/60 border border-primary-500/20 px-2 py-0.5 rounded-full"
                >
                  {g}
                </span>
              ))}
            </div>

            <Link to={`/movies/${movie._id}`}>
              <h3 className="text-base font-bold text-white group-hover:text-primary-400 transition-colors line-clamp-1 mb-1">
                {movie.title}
              </h3>
            </Link>

            <div className="flex items-center space-x-3 text-xs text-dark-400 mb-3">
              {movie.duration && (
                <span className="flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1 text-dark-400" />
                  {movie.duration} min
                </span>
              )}
              {movie.releaseDate && (
                <span className="flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1 text-dark-400" />
                  {new Date(movie.releaseDate).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
            </div>
          </div>

          <Link
            to={`/movies/${movie._id}`}
            className="w-full mt-2 py-2.5 px-3 rounded-xl text-center text-xs font-semibold text-white bg-primary-600 hover:bg-primary-500 shadow-md shadow-primary-950/40 transition-all flex items-center justify-center space-x-1.5"
          >
            <span>Book Tickets</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 sm:py-32 bg-radial-gradient">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/4 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-300 text-xs sm:text-sm font-medium mb-6"
          >
            <Sparkles className="w-4 h-4 text-primary-400" />
            <span>The Ultimate Cinematic Experience</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-6"
          >
            Book Your Next <br />
            <span className="bg-gradient-to-r from-primary-400 via-purple-300 to-indigo-400 bg-clip-text text-transparent">
              Movie Experience
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="max-w-2xl mx-auto text-base sm:text-lg text-dark-300 mb-10 leading-relaxed"
          >
            Select from the latest blockbuster releases, choose your preferred luxury seats with live hold locks, and book seamlessly with digital QR entry.
          </motion.p>

          {/* Quick Search on Hero */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="max-w-xl mx-auto"
          >
            <SearchBar
              placeholder="Search movies by title, genre, actor..."
              onSearch={handleSearchSubmit}
              className="shadow-2xl shadow-primary-950/60"
            />
          </motion.div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* Now Showing Section */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Now Showing
                </h2>
              </div>
              <p className="text-sm text-dark-400 mt-1">
                Catch the latest movies in theatres today
              </p>
            </div>
            <Link
              to="/movies"
              className="flex items-center text-sm font-semibold text-primary-400 hover:text-primary-300 transition-colors group"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {loading ? (
            <LoadingSpinner size="lg" text="Loading now showing..." />
          ) : error ? (
            <div className="p-8 text-center text-rose-400 bg-rose-500/10 rounded-2xl border border-rose-500/20">
              {error}
            </div>
          ) : nowShowing.length === 0 ? (
            <div className="text-center py-12 bg-dark-900/50 rounded-2xl border border-dark-800">
              <Film className="w-12 h-12 text-dark-500 mx-auto mb-3" />
              <p className="text-dark-300">No movies currently showing.</p>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6"
            >
              {nowShowing.map((movie) => (
                <MovieCard key={movie._id} movie={movie} />
              ))}
            </motion.div>
          )}
        </section>

        {/* Coming Soon Section */}
        {comingSoon.length > 0 && (
          <section className="pt-8 border-t border-dark-800/80">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Coming Soon
                </h2>
                <p className="text-sm text-dark-400 mt-1">
                  Exciting blockbusters releasing soon to theatres near you
                </p>
              </div>
              <Link
                to="/movies?status=coming_soon"
                className="flex items-center text-sm font-semibold text-primary-400 hover:text-primary-300 transition-colors group"
              >
                <span>Explore Upcoming</span>
                <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6"
            >
              {comingSoon.map((movie) => (
                <MovieCard key={movie._id} movie={movie} />
              ))}
            </motion.div>
          </section>
        )}
      </div>
    </div>
  );
};

export default HomePage;
