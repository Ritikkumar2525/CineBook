import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Film,
  Star,
  Clock,
  Calendar,
  ArrowUpRight,
  Sparkles,
  ChevronDown,
  RotateCcw,
  LocateFixed,
  MapPin,
  Gift,
  Users,
  Compass,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { moviesApi } from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export const HomePage = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTitle, setSearchTitle] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [showLocationPopover, setShowLocationPopover] = useState(false);
  const [bookForOtherMode, setBookForOtherMode] = useState(false);
  const popoverRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMovies();
  }, []);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setShowLocationPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live Location Detection using browser Geolocation API
  const handleDetectLiveLocation = (e) => {
    if (e) e.stopPropagation();
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    toast.loading('Detecting your live GPS location...', { id: 'geo-detect' });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude } = position.coords;

        // Proximity calculation: closest cinema hub (Mumbai vs Delhi)
        const dMumbai = Math.hypot(latitude - 19.076, longitude - 72.8777);
        const dDelhi = Math.hypot(latitude - 28.7041, longitude - 77.1025);

        const detectedCity = dMumbai <= dDelhi ? 'Mumbai' : 'Delhi';
        setSearchTitle(detectedCity);
        setShowLocationPopover(false);
        setBookForOtherMode(false);
        toast.success(`📍 Live GPS: Located near ${detectedCity}! Showing local auditoriums.`, {
          id: 'geo-detect',
        });
      },
      (error) => {
        setIsLocating(false);
        console.warn('Geolocation warning:', error.message);
        setSearchTitle('Mumbai');
        setShowLocationPopover(false);
        toast.success('📍 Defaulted to premier cinema hub: Mumbai (PVR Superplex)', {
          id: 'geo-detect',
        });
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  };

  const handleSelectCity = (cityName) => {
    setSearchTitle(cityName);
    setShowLocationPopover(false);
    if (bookForOtherMode) {
      toast.success(`🎁 Selected ${cityName} to book for your friend!`);
    } else {
      toast.success(`📍 Filtered to ${cityName} screenings`);
    }
  };

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const res = await moviesApi.getAll();
      const movieData = res.data?.movies || res.data?.data || res.data || [];
      setMovies(Array.isArray(movieData) ? movieData : []);
    } catch (err) {
      console.error('Failed to load movies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTitle.trim()) params.append('search', searchTitle.trim());
    if (selectedFormat) params.append('format', selectedFormat);
    if (maxPrice) params.append('maxPrice', maxPrice);
    navigate(`/movies?${params.toString()}`);
  };

  const handleClearFilters = () => {
    setSearchTitle('');
    setSelectedFormat('');
    setMaxPrice('');
  };

  // Deduplicate movies by normalized title so duplicate records never show up
  const uniqueMovies = [];
  const seenTitles = new Set();
  for (const movie of movies) {
    const normKey = (movie.title || '').trim().toLowerCase();
    if (!seenTitles.has(normKey)) {
      seenTitles.add(normKey);
      uniqueMovies.push(movie);
    }
  }

  const allNowShowing = uniqueMovies.filter(
    (m) => (m.status || '').toLowerCase() === 'now_showing' || !m.status
  );
  const allComingSoon = uniqueMovies.filter(
    (m) => (m.status || '').toLowerCase() === 'coming_soon'
  );

  // Live filter for the curated grid on the homepage
  const nowShowing = allNowShowing.filter((m) => {
    if (searchTitle.trim()) {
      const q = searchTitle.toLowerCase().trim();
      const titleMatch = m.title.toLowerCase().includes(q);
      const descMatch = m.description && m.description.toLowerCase().includes(q);
      const genreMatch = Array.isArray(m.genre)
        ? m.genre.some((g) => g.toLowerCase().includes(q))
        : typeof m.genre === 'string' && m.genre.toLowerCase().includes(q);
      const formatMatch = m.format && m.format.toLowerCase().includes(q);
      if (!titleMatch && !descMatch && !genreMatch && !formatMatch) return false;
    }
    if (selectedFormat && m.format && m.format.toLowerCase() !== selectedFormat.toLowerCase()) {
      return false;
    }
    if (maxPrice) {
      const p = parseFloat(maxPrice);
      if (!isNaN(p) && 250 > p) return false;
    }
    return true;
  });

  const comingSoon = allComingSoon.filter((m) => {
    if (searchTitle.trim()) {
      const q = searchTitle.toLowerCase().trim();
      const titleMatch = m.title.toLowerCase().includes(q);
      const descMatch = m.description && m.description.toLowerCase().includes(q);
      const genreMatch = Array.isArray(m.genre)
        ? m.genre.some((g) => g.toLowerCase().includes(q))
        : typeof m.genre === 'string' && m.genre.toLowerCase().includes(q);
      if (!titleMatch && !descMatch && !genreMatch) return false;
    }
    if (selectedFormat && m.format && m.format.toLowerCase() !== selectedFormat.toLowerCase()) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f7f6f2] text-[#252824]">
      {/* 1. StayBnb Signature Split Hero Section */}
      <section className="relative min-h-[580px] bg-[#e9e8df] overflow-hidden border-b border-[#e5e3dc]">
        {/* Right background image with soft radial fade */}
        <div
          className="absolute inset-0 left-0 md:left-[38%] opacity-35 md:opacity-100 bg-cover bg-center pointer-events-none transition-opacity duration-700"
          style={{
            backgroundImage: `linear-gradient(90deg, #e9e8df 0%, rgba(233,232,223,0.4) 40%, rgba(233,232,223,0) 100%), url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1800&q=85')`,
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-16 pb-20 md:pt-20 md:pb-24">
          <div className="max-w-xl">
            {/* Eyebrow rule */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="eyebrow mb-4"
            >
              <span className="eyebrow-line"></span>
              <span>A different kind of cinema</span>
            </motion.div>

            {/* Editorial Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-[46px] sm:text-[64px] md:text-[76px] font-semibold text-[#252824] leading-[1.03] tracking-[-0.045em] mb-5"
            >
              Somewhere<br />
              new.<br />
              <em className="font-serif italic font-normal text-[#5d7159] tracking-[-0.03em]">
                Somehow
              </em><br />
              yours.
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-[15px] sm:text-[16px] text-[#62665e] leading-[1.7] max-w-[420px] mb-8 font-normal"
            >
              Thoughtful screenings for slow evenings, grand adventures, and stories worth keeping.
            </motion.p>
          </div>

          {/* Floating Search Panel (StayBnb Style) */}
          <motion.form
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="search-panel max-w-3xl flex-col sm:flex-row gap-2 sm:gap-0 mt-4"
          >
            <div ref={popoverRef} className="search-field w-full sm:w-auto flex-1 relative">
              <div className="flex items-center justify-between mb-1">
                <span>Where to?</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDetectLiveLocation}
                    disabled={isLocating}
                    className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#cf785b] hover:text-[#b85d38] transition-colors cursor-pointer"
                    title="Detect live GPS location"
                  >
                    <LocateFixed className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                    <span>{isLocating ? 'Locating...' : 'Live GPS'}</span>
                  </button>
                  <span className="text-stone-300">·</span>
                  <button
                    type="button"
                    onClick={() => {
                      setBookForOtherMode((prev) => !prev);
                      setShowLocationPopover(true);
                    }}
                    className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                      bookForOtherMode ? 'text-[#344638] font-black' : 'text-[#777a72] hover:text-[#252824]'
                    }`}
                    title="Book for someone else or another city"
                  >
                    <Gift className="w-3 h-3 text-[#cf785b]" />
                    <span>Book for other</span>
                  </button>
                </div>
              </div>

              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Title, theatre or genre"
                  value={searchTitle}
                  onChange={(e) => setSearchTitle(e.target.value)}
                  onFocus={() => setShowLocationPopover(true)}
                  className="w-full bg-transparent text-[#252824] focus:outline-none"
                />
                {searchTitle && (
                  <button
                    type="button"
                    onClick={() => setSearchTitle('')}
                    className="text-stone-400 hover:text-stone-700 p-0.5"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Location & "Book for Other" Suggestions Popover */}
              <AnimatePresence>
                {showLocationPopover && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-full mt-2 w-full sm:w-[380px] bg-white rounded-2xl border border-[#e5e3dc] shadow-2xl p-4 z-50 text-left"
                  >
                    {/* Header with Close */}
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#f0efe9]">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#252824] flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-[#cf785b]" />
                        <span>Cinema Location & Gifting</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowLocationPopover(false)}
                        className="text-stone-400 hover:text-stone-700 text-xs"
                      >
                        ✕
                      </button>
                    </div>

                    {/* 1. Fetch Live GPS Location Button */}
                    <button
                      type="button"
                      onClick={handleDetectLiveLocation}
                      disabled={isLocating}
                      className="w-full p-2.5 rounded-xl bg-[#f7f6f2] hover:bg-[#ebe9e1] border border-[#e5e3dc] flex items-center justify-between text-xs font-semibold text-[#252824] transition-all group mb-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#cf785b]/10 text-[#cf785b] flex items-center justify-center">
                          <LocateFixed className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-[#252824] flex items-center gap-1.5">
                            <span>Use Current Live Location</span>
                            <span className="text-[9px] bg-[#e5eae4] text-[#344638] px-1.5 py-0.2 rounded-full font-bold">
                              GPS
                            </span>
                          </p>
                          <p className="text-[10px] text-[#777a72]">Find cinemas near your live coordinates</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-[#cf785b] font-bold uppercase tracking-wider group-hover:translate-x-0.5 transition-transform">
                        Detect ↗
                      </span>
                    </button>

                    {/* 2. Book for Other / Choose City */}
                    <div className="border-t border-[#f0efe9] pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#777a72] flex items-center gap-1">
                          <Gift className="w-3 h-3 text-[#cf785b]" />
                          <span>{bookForOtherMode ? 'Book for Friend in City:' : 'Popular Cities & Auditoriums:'}</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 mb-3">
                        {[
                          { city: 'Mumbai', desc: 'PVR Superplex' },
                          { city: 'Delhi', desc: 'INOX Megaplex' },
                          { city: 'Bengaluru', desc: 'IMAX Laser' },
                          { city: 'Pune', desc: 'Dolby Atmos' },
                        ].map((item) => (
                          <button
                            key={item.city}
                            type="button"
                            onClick={() => handleSelectCity(item.city)}
                            className="p-2 rounded-xl bg-[#f7f6f2] hover:bg-[#cf785b] hover:text-white border border-[#e5e3dc] text-left transition-all group cursor-pointer"
                          >
                            <p className="text-xs font-bold text-[#252824] group-hover:text-white flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#cf785b] group-hover:text-white" />
                              <span>{item.city}</span>
                            </p>
                            <p className="text-[10px] text-[#777a72] group-hover:text-white/80">
                              {item.desc}
                            </p>
                          </button>
                        ))}
                      </div>

                      {/* Gifting tip */}
                      <div className="bg-[#fdf5f2] border border-[#f3d9d0] p-2.5 rounded-xl flex items-start gap-2">
                        <Gift className="w-4 h-4 text-[#cf785b] shrink-0 mt-0.5" />
                        <div className="text-[11px] text-[#555850] leading-tight">
                          <p className="font-bold text-[#252824]">Book for someone else</p>
                          <p className="text-[10px] text-[#777a72] mt-0.5">
                            Pick their city here. During seat selection, enter their name & custom message to print on their digital QR pass!
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="search-field w-full sm:w-auto sm:min-w-[170px] relative">
              <span>The Format</span>
              <div className="relative flex items-center">
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="appearance-none pr-6 cursor-pointer text-[13px] bg-transparent text-[#252824] focus:outline-none w-full"
                >
                  <option value="">Any format</option>
                  <option value="IMAX">IMAX 3D</option>
                  <option value="4DX">4DX Experience</option>
                  <option value="3D">Digital 3D</option>
                  <option value="2D">Standard 2D</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-stone-500 absolute right-0 pointer-events-none" />
              </div>
            </div>

            <div className="search-field w-full sm:w-auto sm:min-w-[170px] relative">
              <span>Price / Ticket</span>
              <div className="relative flex items-center">
                <select
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="appearance-none pr-6 cursor-pointer text-[13px] bg-transparent text-[#252824] focus:outline-none w-full"
                >
                  <option value="">Up to ₹500</option>
                  <option value="250">Up to ₹250</option>
                  <option value="350">Up to ₹350</option>
                  <option value="500">Up to ₹500</option>
                  <option value="600">Up to ₹600</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-stone-500 absolute right-0 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              className="search-submit-btn w-full sm:w-[48px] h-[48px] mt-2 sm:mt-0 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
              aria-label="Search movies"
            >
              <Search className="w-5 h-5 text-white" />
            </button>
          </motion.form>
        </div>
      </section>

      {/* 2. The CineBook Edit — Curated Movie Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-9 pb-2 border-b border-[#e5e3dc]">
          <div>
            <div className="eyebrow mb-2">
              <span className="eyebrow-line"></span>
              <span>The CineBook Edit</span>
            </div>
            <h2 className="font-display text-[32px] sm:text-[40px] font-semibold text-[#252824] tracking-[-0.04em]">
              Good movies, good energy.
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {(searchTitle || selectedFormat || maxPrice) && (
              <button
                onClick={handleClearFilters}
                className="text-xs font-semibold text-[#cf785b] hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset search</span>
              </button>
            )}
            <p className="text-[13px] text-[#777a72]">
              Showing {nowShowing.length} curated releases
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : nowShowing.length === 0 ? (
          <div className="text-center py-16 bg-white border border-[#e5e3dc] rounded-2xl p-8 shadow-xs">
            <Film className="w-10 h-10 text-stone-400 mx-auto mb-3" />
            <h3 className="font-display text-lg font-bold text-[#252824] mb-1">
              No screenings match your search
            </h3>
            <p className="text-xs text-[#777a72] mb-5">
              We couldn't find any releases matching your title, format, or price criteria.
            </p>
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#252824] text-white text-xs font-semibold hover:bg-[#cf785b] transition-all shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Search Filters</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
            {nowShowing.map((movie) => (
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

                    {/* Format / Genre badge */}
                    <span className="absolute top-3.5 left-3.5 px-2.5 py-1 bg-white/95 backdrop-blur-sm rounded-sm text-[10px] font-bold tracking-widest uppercase text-[#252824] shadow-sm">
                      {movie.format || 'IMAX'} ↗
                    </span>

                    {/* Floating circle arrow icon */}
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
                      {Array.isArray(movie.genre) ? movie.genre.join(', ') : movie.genre} · {movie.duration}m · {movie.language}
                    </p>

                    <p className="text-[14px] text-[#252824]">
                      <strong className="font-bold text-[15px]">From ₹250.00</strong>{' '}
                      <span className="text-[12px] text-[#777a72]">/ seat</span>
                    </p>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        )}
      </section>

      {/* 3. Host / Membership Banner (StayBnb Signature) */}
      <section className="bg-[#344638] text-[#f7f6f2] py-16 md:py-20 border-y border-[#2a382d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="max-w-xl">
              <div className="eyebrow text-[#cbdbcb] mb-3">
                <span className="h-[1px] w-6 bg-[#cf785b]"></span>
                <span className="text-[#cbdbcb]">Have a passion for cinema?</span>
              </div>
              <h2 className="font-display text-[36px] sm:text-[46px] font-semibold leading-[1.08] tracking-[-0.04em] mb-4">
                Let someone else<br />
                <em className="font-serif italic font-normal text-[#e5eae4]">fall for it.</em>
              </h2>
              <p className="text-[14px] sm:text-[15px] leading-[1.8] text-[#d0d6cd] max-w-md">
                Share the magic of the silver screen with people who watch for the feeling, not just the spectacle. Your CineBook account works for reserve seating, premier festivals, and usher admission.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link
                to="/movies"
                className="px-6 py-3.5 rounded-full bg-white text-[#252824] hover:bg-[#f7f6f2] font-semibold text-[13px] tracking-tight shadow-md transition-all flex items-center gap-2"
              >
                <span>Browse All Showtimes</span>
                <span>↗</span>
              </Link>
              <Link
                to="/register"
                className="px-6 py-3.5 rounded-full border border-[#cbdbcb]/40 text-[#f7f6f2] hover:bg-[#28362b] font-semibold text-[13px] tracking-tight transition-all"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Coming Soon / Stories Ahead */}
      {comingSoon.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="flex items-end justify-between mb-8 pb-2 border-b border-[#e5e3dc]">
            <div>
              <div className="eyebrow mb-2">
                <span className="eyebrow-line"></span>
                <span>Upcoming Premieres</span>
              </div>
              <h2 className="font-display text-[28px] sm:text-[34px] font-semibold text-[#252824] tracking-[-0.04em]">
                On the horizon.
              </h2>
            </div>
            <Link
              to="/movies?status=coming_soon"
              className="text-[13px] font-semibold text-[#252824] hover:text-[#cf785b] border-b border-[#252824] pb-0.5 transition-colors"
            >
              View calendar ↗
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {comingSoon.map((movie) => (
              <div
                key={movie._id}
                className="flex items-center gap-4 p-4 rounded-lg bg-white border border-[#e5e3dc] shadow-card hover:border-[#cf785b] transition-all"
              >
                <img
                  src={
                    movie.posterUrl ||
                    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=300&q=80'
                  }
                  alt={movie.title}
                  className="w-16 h-20 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] uppercase font-bold text-[#cf785b] tracking-wider">
                    Coming Soon
                  </span>
                  <h4 className="font-display text-[15px] font-bold text-[#252824] truncate">
                    {movie.title}
                  </h4>
                  <p className="text-[12px] text-[#777a72] truncate">
                    {Array.isArray(movie.genre) ? movie.genre.join(', ') : movie.genre}
                  </p>
                  <p className="text-[12px] text-[#5d7159] font-medium mt-1">
                    {movie.duration} mins · {movie.format}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;
