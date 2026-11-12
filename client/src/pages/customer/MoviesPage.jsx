import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ArrowUpRight, Filter, RefreshCw } from 'lucide-react';
import { moviesApi } from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';

export const MoviesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state initialized from URL params
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedGenre, setSelectedGenre] = useState(searchParams.get('genre') || 'all');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || 'all');
  const [selectedFormat, setSelectedFormat] = useState(searchParams.get('format') || 'all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

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
        setGenres(['Action', 'Adventure', 'Sci-Fi', 'Drama', 'Thriller', 'Animation']);
      }
    } catch {
      setGenres(['Action', 'Adventure', 'Sci-Fi', 'Drama', 'Thriller', 'Animation']);
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
    } catch (err) {
      console.error('Failed to load movies:', err);
    } finally {
      setLoading(false);
    }
  };

  // Deduplicate movies by title so duplicate records never show up in the catalog
  const uniqueMovies = [];
  const seenTitles = new Set();
  for (const movie of movies) {
    const normKey = (movie.title || '').trim().toLowerCase();
    if (!seenTitles.has(normKey)) {
      seenTitles.add(normKey);
      uniqueMovies.push(movie);
    }
  }

  // Client-side filter for quick search and format
  const filteredMovies = uniqueMovies.filter((movie) => {
    const matchesSearch =
      !search ||
      movie.title.toLowerCase().includes(search.toLowerCase()) ||
      (movie.description && movie.description.toLowerCase().includes(search.toLowerCase()));

    const matchesFormat =
      selectedFormat === 'all' ||
      (movie.format && movie.format.toLowerCase() === selectedFormat.toLowerCase());

    return matchesSearch && matchesFormat;
  });

  const totalPages = Math.ceil(filteredMovies.length / itemsPerPage);
  const displayedMovies = filteredMovies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-[#f7f6f2] text-[#252824] py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-10 pb-6 border-b border-[#e5e3dc]">
          <div className="eyebrow mb-2">
            <span className="eyebrow-line"></span>
            <span>Browse Cinema Catalog</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-[#252824]">
                All Screenings.
              </h1>
              <p className="text-[15px] text-[#777a72] mt-1">
                Explore showtimes, formats, and auditorium tiers across premier locations.
              </p>
            </div>
            <p className="text-[13px] text-[#777a72]">
              Showing {filteredMovies.length} total releases
            </p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#e5e3dc] shadow-sm mb-10 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777a72]" />
              <input
                type="text"
                placeholder="Search by movie title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#e5e3dc] bg-[#f7f6f2] text-[#252824] placeholder-[#9ea098] text-sm focus:outline-none focus:border-[#cf785b]"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="px-3.5 py-2.5 rounded-lg border border-[#e5e3dc] bg-[#f7f6f2] text-[#252824] text-sm focus:outline-none focus:border-[#cf785b]"
              >
                <option value="all">All Formats</option>
                <option value="IMAX">IMAX 3D</option>
                <option value="4DX">4DX</option>
                <option value="3D">3D</option>
                <option value="2D">Standard 2D</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3.5 py-2.5 rounded-lg border border-[#e5e3dc] bg-[#f7f6f2] text-[#252824] text-sm focus:outline-none focus:border-[#cf785b]"
              >
                <option value="all">All Releases</option>
                <option value="now_showing">Now Showing</option>
                <option value="coming_soon">Coming Soon</option>
              </select>
            </div>
          </div>

          {/* Genre Filter Pills (StayBnb style) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-[#777a72] font-semibold uppercase text-[10px] tracking-wider pr-2">
              Genres:
            </span>
            <button
              onClick={() => setSelectedGenre('all')}
              className={`px-3 py-1.5 rounded-full font-medium transition-colors ${
                selectedGenre === 'all'
                  ? 'bg-[#252824] text-white'
                  : 'bg-[#f7f6f2] text-[#555850] hover:bg-[#e9e8df]'
              }`}
            >
              All Genres
            </button>
            {genres.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGenre(g)}
                className={`px-3 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap ${
                  selectedGenre === g
                    ? 'bg-[#252824] text-white'
                    : 'bg-[#f7f6f2] text-[#555850] hover:bg-[#e9e8df]'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Movies Grid */}
        {loading ? (
          <div className="py-24 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : displayedMovies.length === 0 ? (
          <EmptyState
            title="No movies found"
            message="No screenings match your current search and filter criteria. Try adjusting your selections."
            actionLabel="Reset All Filters"
            onAction={() => {
              setSearch('');
              setSelectedGenre('all');
              setSelectedStatus('all');
              setSelectedFormat('all');
            }}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
              {displayedMovies.map((movie) => (
                <motion.article
                  key={movie._id}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="group flex flex-col"
                >
                  <Link to={`/movies/${movie._id}`} className="block">
                    <div className="relative aspect-[1.28] w-full overflow-hidden rounded-md bg-[#e7e5df] shadow-card">
                      <img
                        src={
                          movie.posterUrl ||
                          'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80'
                        }
                        alt={movie.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />

                      {/* Pill Badge */}
                      <span className="absolute top-3.5 left-3.5 px-2.5 py-1 bg-white/95 backdrop-blur-sm rounded-sm text-[10px] font-bold tracking-widest uppercase text-[#252824] shadow-sm">
                        {movie.format || 'Standard'} ↗
                      </span>

                      {/* Arrow Icon */}
                      <div className="absolute bottom-3.5 right-3.5 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md text-[#252824] group-hover:bg-[#cf785b] group-hover:text-white transition-colors">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="pt-3.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="font-display text-[17px] font-bold text-[#252824] tracking-tight group-hover:text-[#cf785b] transition-colors">
                          {movie.title}
                        </h3>
                        <span className="text-[12px] font-semibold text-[#5d7159] whitespace-nowrap">
                          ★ {movie.rating || 'UA'}
                        </span>
                      </div>

                      <p className="text-[13px] text-[#777a72] mt-0.5 mb-1.5 truncate">
                        {Array.isArray(movie.genre) ? movie.genre.join(', ') : movie.genre} · {movie.duration}m
                      </p>

                      <p className="text-[14px] text-[#252824]">
                        <strong className="font-bold text-[15px]">From ₹250.00</strong>{' '}
                        <span className="text-[12px] text-[#777a72]">/ ticket</span>
                      </p>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-14 flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => setCurrentPage(page)}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MoviesPage;
