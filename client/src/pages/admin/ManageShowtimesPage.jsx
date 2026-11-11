import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarClock,
  Plus,
  XCircle,
  Calendar,
  Clock,
  Film,
  Tv,
  Building2,
  AlertTriangle,
  Search,
  Filter
} from 'lucide-react';
import { showtimesApi, moviesApi, screensApi } from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

export const ManageShowtimesPage = () => {
  const [showtimes, setShowtimes] = useState([]);
  const [movies, setMovies] = useState([]);
  const [screens, setScreens] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterMovie, setFilterMovie] = useState('all');
  const [filterDate, setFilterDate] = useState('');

  // Add Showtime Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    movie: '',
    screen: '',
    startTime: '',
    endTime: '',
  });

  // Cancel showtime dialog
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [showtimeToCancel, setShowtimeToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [showtimesRes, moviesRes, screensRes] = await Promise.all([
        showtimesApi.getAll(),
        moviesApi.getAll(),
        screensApi.getAll(),
      ]);

      const stList = showtimesRes.data?.showtimes || showtimesRes.data?.data || showtimesRes.data || [];
      const mvList = moviesRes.data?.movies || moviesRes.data?.data || moviesRes.data || [];
      const scList = screensRes.data?.screens || screensRes.data?.data || screensRes.data || [];

      setShowtimes(Array.isArray(stList) ? stList : []);
      setMovies(Array.isArray(mvList) ? mvList : []);
      setScreens(Array.isArray(scList) ? scList : []);
    } catch (err) {
      console.error('Failed to load showtimes data:', err);
      toast.error('Failed to load showtimes');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    // Current time + 1 hour as default ISO local datetime
    const now = new Date();
    now.setHours(now.getHours() + 2);
    now.setMinutes(0, 0, 0);
    const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    const firstMovie = movies[0]?._id || '';
    const firstScreen = screens[0]?._id || '';

    // Calculate default end time
    const movieObj = movies.find((m) => m._id === firstMovie);
    const durationMins = movieObj?.duration || 120;
    const endDate = new Date(now.getTime() + durationMins * 60000);
    const endIso = new Date(endDate.getTime() - endDate.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    setFormData({
      movie: firstMovie,
      screen: firstScreen,
      startTime: localIso,
      endTime: endIso,
    });
    setModalOpen(true);
  };

  // Auto-calculate end time when movie or startTime changes
  const handleMovieOrTimeChange = (newMovieId, newStartTime) => {
    const movieObj = movies.find((m) => m._id === newMovieId);
    const durationMins = (movieObj?.duration || 120) + 15; // 15 mins intermission & clean

    if (newStartTime) {
      const start = new Date(newStartTime);
      const end = new Date(start.getTime() + durationMins * 60000);
      const endIso = new Date(end.getTime() - end.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);

      setFormData((prev) => ({
        ...prev,
        movie: newMovieId,
        startTime: newStartTime,
        endTime: endIso,
      }));
    } else {
      setFormData((prev) => ({ ...prev, movie: newMovieId }));
    }
  };

  // Check for conflicts
  const hasTimeConflict = () => {
    if (!formData.screen || !formData.startTime || !formData.endTime) return false;
    const start = new Date(formData.startTime).getTime();
    const end = new Date(formData.endTime).getTime();

    return showtimes.some((st) => {
      if (st.status === 'cancelled') return false;
      const screenId = st.screen?._id || st.screen;
      if (screenId !== formData.screen) return false;

      const existingStart = new Date(st.startTime).getTime();
      const existingEnd = new Date(st.endTime).getTime();

      // Overlap condition
      return start < existingEnd && end > existingStart;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setFormSubmitting(true);
      const selectedScreen = screens.find((s) => s._id === formData.screen);
      const theatreId = selectedScreen?.theatre?._id || selectedScreen?.theatre;

      const payload = {
        movie: formData.movie,
        screen: formData.screen,
        theatre: theatreId,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
      };

      await showtimesApi.create(payload);
      toast.success('Showtime created successfully');
      setModalOpen(false);
      loadAllData();
    } catch (err) {
      console.error('Error creating showtime:', err);
      toast.error(err.message || 'Failed to schedule showtime');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleCancelConfirm = async () => {
    if (!showtimeToCancel) return;
    try {
      setCancelling(true);
      await showtimesApi.cancel(showtimeToCancel._id);
      toast.success('Showtime cancelled');
      setCancelDialogOpen(false);
      setShowtimeToCancel(null);
      loadAllData();
    } catch (err) {
      console.error('Error cancelling showtime:', err);
      toast.error(err.message || 'Failed to cancel showtime');
    } finally {
      setCancelling(false);
    }
  };

  // Filtering
  const filteredShowtimes = showtimes.filter((st) => {
    const movieId = st.movie?._id || st.movie;
    if (filterMovie !== 'all' && movieId !== filterMovie) return false;

    if (filterDate) {
      const stDate = new Date(st.startTime).toISOString().split('T')[0];
      if (stDate !== filterDate) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredShowtimes.length / itemsPerPage);
  const displayedShowtimes = filteredShowtimes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-dark-800 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center">
            <CalendarClock className="w-7 h-7 text-primary-400 mr-2.5" />
            Manage Showtimes
          </h1>
          <p className="text-xs sm:text-sm text-dark-400 mt-0.5">
            Schedule movie showtimes across theatre screens with conflict checking
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="self-start sm:self-auto flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-primary-600 hover:bg-primary-500 shadow-lg shadow-primary-950/40 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Showtime</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-dark-900 border border-dark-800 p-4 rounded-2xl">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-dark-400 mb-1">
            Filter by Movie
          </label>
          <select
            value={filterMovie}
            onChange={(e) => {
              setFilterMovie(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-xl text-xs text-white focus:outline-none"
          >
            <option value="all">All Movies</option>
            {movies.map((m) => (
              <option key={m._id} value={m._id}>
                {m.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-dark-400 mb-1">
            Filter by Date
          </label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => {
              setFilterDate(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-xl text-xs text-white focus:outline-none"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={() => {
              setFilterMovie('all');
              setFilterDate('');
              setCurrentPage(1);
            }}
            className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-white transition-colors border border-dark-700"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner size="lg" text="Loading scheduled shows..." />
      ) : displayedShowtimes.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No showtimes found"
          description="Schedule movie screening times across your auditoriums."
          actionLabel="Schedule Showtime"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-dark-950/80 border-b border-dark-800 text-dark-400 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Movie</th>
                  <th className="py-3.5 px-4">Theatre & Screen</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800/60">
                {displayedShowtimes.map((st) => {
                  const movie = st.movie || {};
                  const screen = st.screen || {};
                  const theatre = st.theatre || screen.theatre || {};
                  const startTime = new Date(st.startTime);
                  const isCancelled = st.status === 'cancelled';

                  return (
                    <motion.tr
                      key={st._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-dark-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-white text-sm line-clamp-1">
                          {movie.title || 'Movie'}
                        </p>
                        <span className="text-[11px] text-primary-400 font-medium">
                          {movie.format || '2D'} • {movie.duration || 120}m
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="text-white font-semibold">{screen.name || 'Screen 1'}</p>
                        <p className="text-xs text-dark-400">{theatre.name || 'Main Cinema'}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5 text-white font-medium">
                          <Calendar className="w-3.5 h-3.5 text-dark-400" />
                          <span>
                            {startTime.toLocaleDateString(undefined, {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-primary-300 text-xs mt-0.5 font-bold">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {startTime.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge status={st.status || 'scheduled'} />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {!isCancelled && (
                          <button
                            onClick={() => {
                              setShowtimeToCancel(st);
                              setCancelDialogOpen(true);
                            }}
                            className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            <span>Cancel</span>
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}

      {/* Schedule Showtime Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Schedule New Showtime"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block text-dark-300 font-semibold mb-1">Select Movie</label>
            <select
              value={formData.movie}
              onChange={(e) => handleMovieOrTimeChange(e.target.value, formData.startTime)}
              required
              className="w-full px-3.5 py-2.5 bg-dark-950 border border-dark-700/80 rounded-xl text-white focus:outline-none focus:border-primary-500"
            >
              <option value="">Select Movie</option>
              {movies.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.title} ({m.duration} mins)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-dark-300 font-semibold mb-1">Select Screen</label>
            <select
              value={formData.screen}
              onChange={(e) => setFormData({ ...formData, screen: e.target.value })}
              required
              className="w-full px-3.5 py-2.5 bg-dark-950 border border-dark-700/80 rounded-xl text-white focus:outline-none focus:border-primary-500"
            >
              <option value="">Select Screen</option>
              {screens.map((sc) => (
                <option key={sc._id} value={sc._id}>
                  {sc.name} ({sc.theatre?.name || 'Cinema'} - {sc.totalSeats || 100} Seats)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-dark-300 font-semibold mb-1">Start Time</label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => handleMovieOrTimeChange(formData.movie, e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-dark-950 border border-dark-700/80 rounded-xl text-white focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-dark-300 font-semibold mb-1">Calculated End Time</label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 bg-dark-950 border border-dark-700/80 rounded-xl text-white focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>

          {/* Time Conflict Alert */}
          {hasTimeConflict() && (
            <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-400" />
              <span>
                <strong>Warning:</strong> An existing showtime overlaps with this screen and time slot.
              </span>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-dark-800">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl text-dark-300 hover:text-white bg-dark-800 hover:bg-dark-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="px-5 py-2 rounded-xl text-white bg-primary-600 hover:bg-primary-500 font-bold shadow-md shadow-primary-950/40"
            >
              {formSubmitting ? 'Scheduling...' : 'Confirm Schedule'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        onConfirm={handleCancelConfirm}
        title="Cancel Showtime"
        message="Are you sure you want to cancel this showtime? Any reserved seats will be flagged for refund."
        confirmText="Yes, Cancel Show"
        isDanger={true}
        isLoading={cancelling}
      />
    </div>
  );
};

export default ManageShowtimesPage;
