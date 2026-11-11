import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Film,
  Plus,
  Pencil,
  Trash2,
  Search,
  Clock,
  Star,
  Calendar,
  X,
  Check
} from 'lucide-react';
import { moviesApi } from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

export const ManageMoviesPage = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add / Edit Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Form State
  const initialForm = {
    title: '',
    description: '',
    genre: '',
    duration: 120,
    language: 'English',
    format: '2D',
    rating: '8.0',
    posterUrl: '',
    releaseDate: new Date().toISOString().split('T')[0],
    status: 'now_showing',
  };
  const [formData, setFormData] = useState(initialForm);

  // Delete Dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [movieToDelete, setMovieToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const res = await moviesApi.getAll();
      const list = res.data?.movies || res.data?.data || res.data || [];
      setMovies(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load movies:', err);
      toast.error('Failed to load movies');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData(initialForm);
    setModalOpen(true);
  };

  const handleOpenEdit = (movie) => {
    setIsEditing(true);
    setCurrentId(movie._id);
    const genreStr = Array.isArray(movie.genre) ? movie.genre.join(', ') : movie.genre || '';
    const dateStr = movie.releaseDate
      ? new Date(movie.releaseDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    setFormData({
      title: movie.title || '',
      description: movie.description || '',
      genre: genreStr,
      duration: movie.duration || 120,
      language: movie.language || 'English',
      format: movie.format || '2D',
      rating: movie.rating || '8.0',
      posterUrl: movie.posterUrl || '',
      releaseDate: dateStr,
      status: movie.status || 'now_showing',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setFormSubmitting(true);
      const payload = {
        ...formData,
        duration: Number(formData.duration),
        genre: formData.genre
          .split(',')
          .map((g) => g.trim())
          .filter(Boolean),
      };

      if (isEditing) {
        await moviesApi.update(currentId, payload);
        toast.success('Movie updated successfully');
      } else {
        await moviesApi.create(payload);
        toast.success('Movie created successfully');
      }

      setModalOpen(false);
      fetchMovies();
    } catch (err) {
      console.error('Error saving movie:', err);
      toast.error(err.message || 'Failed to save movie');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!movieToDelete) return;
    try {
      setDeleting(true);
      await moviesApi.delete(movieToDelete._id);
      toast.success('Movie deleted successfully');
      setDeleteDialogOpen(false);
      setMovieToDelete(null);
      fetchMovies();
    } catch (err) {
      console.error('Error deleting movie:', err);
      toast.error(err.message || 'Failed to delete movie');
    } finally {
      setDeleting(false);
    }
  };

  // Filter movies
  const filtered = movies.filter((m) =>
    (m.title || '').toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const displayedMovies = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-dark-800 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center">
            <Film className="w-7 h-7 text-primary-400 mr-2.5" />
            Manage Movies
          </h1>
          <p className="text-xs sm:text-sm text-dark-400 mt-0.5">
            Create, update, and manage the movie catalog and show eligibility
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="self-start sm:self-auto flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-primary-600 hover:bg-primary-500 shadow-lg shadow-primary-950/40 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Movie</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="flex items-center max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-dark-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search movie titles..."
            className="w-full pl-10 pr-4 py-2.5 bg-dark-900 border border-dark-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-dark-500 focus:outline-none focus:border-primary-500"
          />
        </div>
      </div>

      {/* Movies Table */}
      {loading ? (
        <LoadingSpinner size="lg" text="Loading movie list..." />
      ) : displayedMovies.length === 0 ? (
        <EmptyState
          icon={Film}
          title="No movies found"
          description="Click Add New Movie to populate your theatre's movie offerings."
          actionLabel="Add Movie"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-dark-950/80 border-b border-dark-800 text-dark-400 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Movie</th>
                  <th className="py-3.5 px-4">Genre / Format</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800/60">
                {displayedMovies.map((movie) => {
                  const genres = Array.isArray(movie.genre)
                    ? movie.genre.join(', ')
                    : movie.genre || 'Various';

                  return (
                    <motion.tr
                      key={movie._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-dark-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-14 rounded-lg bg-dark-950 overflow-hidden flex-shrink-0 border border-dark-800">
                            <img
                              src={
                                movie.posterUrl ||
                                'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80'
                              }
                              alt={movie.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm line-clamp-1">
                              {movie.title}
                            </p>
                            <p className="text-[11px] text-dark-400">{movie.language || 'English'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="text-dark-200 line-clamp-1">{genres}</p>
                        <span className="inline-block mt-0.5 px-2 py-0.5 text-[10px] font-bold rounded bg-primary-600/20 text-primary-300 border border-primary-500/30">
                          {movie.format || '2D'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-dark-300">
                        {movie.duration ? `${movie.duration}m` : '120m'}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1 text-amber-400 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{movie.rating || 'N/A'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge status={movie.status || 'now_showing'} />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpenEdit(movie)}
                            className="p-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-white transition-colors"
                            title="Edit Movie"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setMovieToDelete(movie);
                              setDeleteDialogOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                            title="Delete Movie"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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

      {/* Add / Edit Movie Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isEditing ? 'Edit Movie' : 'Add New Movie'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-dark-300 font-semibold mb-1">Movie Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 bg-dark-950 border border-dark-700/80 rounded-xl text-white focus:outline-none focus:border-primary-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-dark-300 font-semibold mb-1">Synopsis / Storyline</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 bg-dark-950 border border-dark-700/80 rounded-xl text-white focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-dark-300 font-semibold mb-1">
                Genres (comma separated)
              </label>
              <input
                type="text"
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                placeholder="Action, Sci-Fi, Adventure"
                required
                className="w-full px-3.5 py-2.5 bg-dark-950 border border-dark-700/80 rounded-xl text-white focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-dark-300 font-semibold mb-1">Duration (minutes)</label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                required
                min={1}
                className="w-full px-3.5 py-2.5 bg-dark-950 border border-dark-700/80 rounded-xl text-white focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-dark-300 font-semibold mb-1">Language</label>
              <input
                type="text"
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 bg-dark-950 border border-dark-700/80 rounded-xl text-white focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-dark-300 font-semibold mb-1">Format</label>
              <select
                value={formData.format}
                onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-dark-950 border border-dark-700/80 rounded-xl text-white focus:outline-none focus:border-primary-500"
              >
                <option value="2D">2D</option>
                <option value="3D">3D</option>
                <option value="IMAX 2D">IMAX 2D</option>
                <option value="IMAX 3D">IMAX 3D</option>
                <option value="4DX">4DX</option>
              </select>
            </div>

            <div>
              <label className="block text-dark-300 font-semibold mb-1">Rating</label>
              <input
                type="text"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                placeholder="8.5"
                className="w-full px-3.5 py-2.5 bg-dark-950 border border-dark-700/80 rounded-xl text-white focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-dark-300 font-semibold mb-1">Release Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-dark-950 border border-dark-700/80 rounded-xl text-white focus:outline-none focus:border-primary-500"
              >
                <option value="now_showing">Now Showing</option>
                <option value="coming_soon">Coming Soon</option>
              </select>
            </div>

            <div>
              <label className="block text-dark-300 font-semibold mb-1">Release Date</label>
              <input
                type="date"
                value={formData.releaseDate}
                onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-dark-950 border border-dark-700/80 rounded-xl text-white focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-dark-300 font-semibold mb-1">Poster Image URL</label>
              <input
                type="url"
                value={formData.posterUrl}
                onChange={(e) => setFormData({ ...formData, posterUrl: e.target.value })}
                placeholder="https://example.com/poster.jpg"
                className="w-full px-3.5 py-2.5 bg-dark-950 border border-dark-700/80 rounded-xl text-white focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>

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
              {formSubmitting ? 'Saving...' : isEditing ? 'Update Movie' : 'Create Movie'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Movie"
        message={`Are you sure you want to remove "${movieToDelete?.title}" from the cinema database? This will also affect scheduled shows.`}
        confirmText="Delete Movie"
        isDanger={true}
        isLoading={deleting}
      />
    </div>
  );
};

export default ManageMoviesPage;
