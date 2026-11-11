import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, Filter, Star, Clock, Calendar, Search, ArrowRight, RefreshCw } from 'lucide-react';
import { moviesApi } from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import SearchBar from '../../components/ui/SearchBar';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';

export const MoviesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state initialized from URL params
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedGenre, setSelectedGenre] = useState(searchParams.get('genre') || 'all');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || 'all');
  const [selectedLanguage, setSelectedLanguage] = useState(searchParams.get('language') || 'all');
  const [selectedFormat, setSelectedFormat] = useState(searchParams.get('format') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    loadGenres();
  }, []);

  useEffect(() => {
    loadMovies();
  }, [selectedGenre, selectedStatus]);

  const loadGenres = async () => {
    try {
      const res = await moviesApi.getGenres();
      const genreData = res.data?.genres || res.data?.data || res.data || [];
      if (Array.isArray(genreData) && genreData.length > 0) {
        setGenres(genreData);
      } else {
        // Fallback default genres
        setGenres(['Action', 'Adventure', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Thriller', 'Animation']);
      }
    } catch {
      setGenres(['Action', 'Adventure', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Thriller', 'Animation']);
    }
  };

  const loadMovies = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedGenre !== 'all') params.genre = selectedGenre;
      if (selectedStatus !== 'all') params.status = selectedStatus;

      const res = await moviesApi.getAll(params);
      const data = res.data?.movies || res.data?.data || res.data || [];
      setMovies(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error('Failed to load movies:', err);
      setError('Unable to fetch movies at this time.');
    } finally {
      setLoading(false);
    }
  };

  // Sync state to URL params
  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'all' || !value) {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    setSearchParams(newParams);
    setCurrentPage(1);
  };

  const handleSearchChange = (q) => {
    setSearch(q);
    updateFilter('search', q);
  };

  // Extract unique languages & formats from movies for filter dropdowns
  const availableLanguages = [
    'all',
    ...Array.from(new Set(movies.map((m) => m.language).filter(Boolean))),
  ];
  const availableFormats = [
    'all',
    ...Array.from(new Set(movies.map((m) => m.format).filter(Boolean))),
  ];

  // Client filtering & sorting
  const filteredMovies = movies
    .filter((movie) => {
      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const titleMatch = movie.title?.toLowerCase().includes(q);
        const descMatch = movie.description?.toLowerCase().includes(q);
        const genreStr = Array.isArray(movie.genre) ? movie.genre.join(' ') : movie.genre || '';
        const genreMatch = genreStr.toLowerCase().includes(q);
        if (!titleMatch && !descMatch && !genreMatch) return false;
      }
      // Language
      if (selectedLanguage !== 'all' && movie.language !== selectedLanguage) {
        return false;
      }
      // Format
      if (selectedFormat !== 'all' && movie.format !== selectedFormat) {
        return false;
      }
      // Status
      if (selectedStatus !== 'all' && movie.status !== selectedStatus) {
        return false;
      }
      // Genre
      if (selectedGenre !== 'all') {
        const movieGenres = Array.isArray(movie.genre)
          ? movie.genre
          : (movie.genre || '').split(',').map((g) => g.trim().toLowerCase());
        if (!movieGenres.includes(selectedGenre.toLowerCase())) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'title-asc') return (a.title || '').localeCompare(b.title || '');
      if (sortBy === 'title-desc') return (b.title || '').localeCompare(a.title || '');
      if (sortBy === 'rating-desc') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'duration-asc') return (a.duration || 0) - (b.duration || 0);
      // newest
      return new Date(b.releaseDate || b.createdAt || 0) - new Date(a.releaseDate || a.createdAt || 0);
    });

  // Pagination calculation
  const totalPages = Math.ceil(filteredMovies.length / itemsPerPage);
  const displayedMovies = filteredMovies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
          Explore Movies
        </h1>
        <p className="text-dark-400 text-sm sm:text-base">
          Browse all current and upcoming movie releases, check showtimes, and book your tickets.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-dark-900 border border-dark-800 rounded-2xl p-4 sm:p-6 mb-8 space-y-4 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <SearchBar
              placeholder="Search by title, genre, keyword..."
              initialValue={search}
              onSearch={handleSearchChange}
            />
          </div>
          <div>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                updateFilter('sort', e.target.value);
              }}
              className="w-full py-2.5 px-3 bg-dark-800 border border-dark-700/80 rounded-xl text-sm text-dark-200 focus:outline-none focus:border-primary-500"
            >
              <option value="newest">Sort by: Newest Releases</option>
              <option value="title-asc">Sort by: Title (A - Z)</option>
              <option value="title-desc">Sort by: Title (Z - A)</option>
              <option value="rating-desc">Sort by: Highest Rated</option>
              <option value="duration-asc">Sort by: Shortest Duration</option>
            </select>
          </div>
        </div>

        {/* Secondary Filter Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-dark-800/80">
          {/* Genre */}
          <div>
            <label className="block text-[11px] font-semibold text-dark-400 uppercase tracking-wider mb-1">
              Genre
            </label>
            <select
              value={selectedGenre}
              onChange={(e) => {
                setSelectedGenre(e.target.value);
                updateFilter('genre', e.target.value);
              }}
              className="w-full py-2 px-2.5 bg-dark-800 border border-dark-700/80 rounded-lg text-xs text-dark-200 focus:outline-none focus:border-primary-500"
            >
              <option value="all">All Genres</option>
              {genres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[11px] font-semibold text-dark-400 uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                updateFilter('status', e.target.value);
              }}
              className="w-full py-2 px-2.5 bg-dark-800 border border-dark-700/80 rounded-lg text-xs text-dark-200 focus:outline-none focus:border-primary-500"
            >
              <option value="all">All Status</option>
              <option value="now_showing">Now Showing</option>
              <option value="coming_soon">Coming Soon</option>
            </select>
          </div>

          {/* Language */}
          <div>
            <label className="block text-[11px] font-semibold text-dark-400 uppercase tracking-wider mb-1">
              Language
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => {
                setSelectedLanguage(e.target.value);
                updateFilter('language', e.target.value);
              }}
              className="w-full py-2 px-2.5 bg-dark-800 border border-dark-700/80 rounded-lg text-xs text-dark-200 focus:outline-none focus:border-primary-500"
            >
              <option value="all">All Languages</option>
              {availableLanguages
                .filter((l) => l !== 'all')
                .map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
            </select>
          </div>

          {/* Format */}
          <div>
            <label className="block text-[11px] font-semibold text-dark-400 uppercase tracking-wider mb-1">
              Format
            </label>
            <select
              value={selectedFormat}
              onChange={(e) => {
                setSelectedFormat(e.target.value);
                updateFilter('format', e.target.value);
              }}
              className="w-full py-2 px-2.5 bg-dark-800 border border-dark-700/80 rounded-lg text-xs text-dark-200 focus:outline-none focus:border-primary-500"
            >
              <option value="all">All Formats</option>
              {availableFormats
                .filter((f) => f !== 'all')
                .map((fmt) => (
                  <option key={fmt} value={fmt}>
                    {fmt}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Movies Grid */}
      {loading ? (
        <LoadingSpinner size="lg" text="Fetching movies..." />
      ) : error ? (
        <div className="p-8 text-center text-rose-400 bg-rose-500/10 rounded-2xl border border-rose-500/20">
          <p className="mb-4">{error}</p>
          <button
            onClick={loadMovies}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-500 transition-colors inline-flex items-center"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Try Again
          </button>
        </div>
      ) : displayedMovies.length === 0 ? (
        <EmptyState
          icon={Film}
          title="No movies match your filters"
          description="Try clearing search query or adjusting your genre and format selections."
          actionLabel="Reset All Filters"
          onAction={() => {
            setSearch('');
            setSelectedGenre('all');
            setSelectedStatus('all');
            setSelectedLanguage('all');
            setSelectedFormat('all');
            setSortBy('newest');
            setSearchParams({});
          }}
        />
      ) : (
        <>
          <motion.div
            layout
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 sm:gap-6"
          >
            <AnimatePresence>
              {displayedMovies.map((movie) => {
                const genresList = Array.isArray(movie.genre)
                  ? movie.genre
                  : (movie.genre || '').split(',').map((g) => g.trim()).filter(Boolean);

                const poster =
                  movie.posterUrl ||
                  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80';

                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ y: -6, transition: { duration: 0.2 } }}
                    key={movie._id}
                    className="group bg-dark-900 rounded-2xl overflow-hidden border border-dark-800 shadow-xl flex flex-col justify-between transition-all hover:border-primary-500/50"
                  >
                    <Link
                      to={`/movies/${movie._id}`}
                      className="block relative aspect-[2/3] overflow-hidden bg-dark-950"
                    >
                      <img
                        src={poster}
                        alt={movie.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          e.target.src =
                            'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/20 to-transparent opacity-85 group-hover:opacity-60 transition-opacity" />

                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        {movie.format && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary-600/90 text-white backdrop-blur-md shadow">
                            {movie.format}
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

                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {genresList.slice(0, 2).map((g, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-semibold text-primary-400 bg-primary-950/60 border border-primary-500/20 px-2 py-0.5 rounded-full"
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
                              <Clock className="w-3.5 h-3.5 mr-1" />
                              {movie.duration}m
                            </span>
                          )}
                          {movie.language && <span>{movie.language}</span>}
                        </div>
                      </div>

                      <Link
                        to={`/movies/${movie._id}`}
                        className="w-full mt-2 py-2 px-3 rounded-xl text-center text-xs font-semibold text-white bg-primary-600 hover:bg-primary-500 shadow-md shadow-primary-950/40 transition-all flex items-center justify-center space-x-1.5"
                      >
                        <span>View Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </>
      )}
    </div>
  );
};

export default MoviesPage;
