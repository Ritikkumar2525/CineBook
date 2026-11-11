import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  MapPin,
  Tv,
  CheckCircle,
  Coffee,
  Sparkles
} from 'lucide-react';
import { theatresApi } from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

export const ManageTheatresPage = () => {
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const initialForm = {
    name: '',
    location: '',
    city: '',
    facilities: 'Dolby Atmos, Recliner Seats, Gourmet Snacks, Parking',
  };
  const [formData, setFormData] = useState(initialForm);

  // Delete Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [theatreToDelete, setTheatreToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchTheatres();
  }, []);

  const fetchTheatres = async () => {
    try {
      setLoading(true);
      const res = await theatresApi.getAll();
      const list = res.data?.theatres || res.data?.data || res.data || [];
      setTheatres(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load theatres:', err);
      toast.error('Failed to load theatres');
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

  const handleOpenEdit = (theatre) => {
    setIsEditing(true);
    setCurrentId(theatre._id);
    const facilitiesStr = Array.isArray(theatre.facilities)
      ? theatre.facilities.join(', ')
      : theatre.facilities || '';

    setFormData({
      name: theatre.name || '',
      location: theatre.location || '',
      city: theatre.city || '',
      facilities: facilitiesStr,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setFormSubmitting(true);
      const payload = {
        ...formData,
        facilities: formData.facilities
          .split(',')
          .map((f) => f.trim())
          .filter(Boolean),
      };

      if (isEditing) {
        await theatresApi.update(currentId, payload);
        toast.success('Theatre updated successfully');
      } else {
        await theatresApi.create(payload);
        toast.success('Theatre created successfully');
      }

      setModalOpen(false);
      fetchTheatres();
    } catch (err) {
      console.error('Error saving theatre:', err);
      toast.error(err.message || 'Failed to save theatre');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!theatreToDelete) return;
    try {
      setDeleting(true);
      await theatresApi.delete(theatreToDelete._id);
      toast.success('Theatre deleted successfully');
      setDeleteDialogOpen(false);
      setTheatreToDelete(null);
      fetchTheatres();
    } catch (err) {
      console.error('Error deleting theatre:', err);
      toast.error(err.message || 'Failed to delete theatre');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#e5e3dc] gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#252824] tracking-tight flex items-center">
            <Building2 className="w-7 h-7 text-[#cf785b] mr-2.5" />
            Manage Theatres
          </h1>
          <p className="text-xs sm:text-sm text-[#777a72] mt-0.5">
            Configure cinema locations, addresses, and available facility offerings
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="self-start sm:self-auto flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-bold text-[#252824] bg-[#252824] hover:bg-[#344638] text-white shadow-lg shadow-primary-950/40 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Theatre</span>
        </button>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" text="Loading theatres..." />
      ) : theatres.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No theatres registered"
          description="Add your first cinema location to start configuring auditoriums and showtimes."
          actionLabel="Add Theatre"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {theatres.map((t) => {
            const facilitiesList = Array.isArray(t.facilities)
              ? t.facilities
              : (t.facilities || '').split(',').map((f) => f.trim()).filter(Boolean);

            const screensCount = t.screensCount !== undefined ? t.screensCount : t.screens?.length || 0;

            return (
              <motion.div
                key={t._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-[#e5e3dc] rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-[#e5e3dc] transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl bg-primary-600/20 border border-primary-500/30 text-[#cf785b] flex items-center justify-center">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => handleOpenEdit(t)}
                        className="p-1.5 rounded-lg bg-[#f7f6f2] hover:bg-[#e9e8df] text-[#555850] hover:text-[#252824] transition-colors"
                        title="Edit Theatre"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setTheatreToDelete(t);
                          setDeleteDialogOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                        title="Delete Theatre"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-[#252824] mb-1 group-hover:text-[#344638] transition-colors">
                    {t.name}
                  </h3>

                  <div className="flex items-center text-xs text-[#777a72] mb-4">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-[#cf785b] flex-shrink-0" />
                    <span className="truncate">
                      {t.location}, {t.city}
                    </span>
                  </div>

                  {/* Screens count pill */}
                  <div className="mb-4 inline-flex items-center px-3 py-1 rounded-xl bg-[#f7f6f2] border border-[#e5e3dc] text-xs font-semibold text-[#555850]">
                    <Tv className="w-3.5 h-3.5 mr-1.5 text-[#cf785b]" />
                    <span>{screensCount} Active Screen(s)</span>
                  </div>

                  {/* Facilities list */}
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#777a72]">
                      Amenities
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {facilitiesList.map((f, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded text-[11px] bg-[#f7f6f2] text-[#555850] border border-[#e5e3dc]/60"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isEditing ? 'Edit Theatre Location' : 'Add New Theatre'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block text-[#555850] font-semibold mb-1">Cinema Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. CineBook IMAX Multiplex"
              required
              className="w-full px-3.5 py-2.5 bg-[#f7f6f2] border border-[#e5e3dc] rounded-xl text-[#252824] focus:outline-none focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-[#555850] font-semibold mb-1">Location / Street</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. 5th Avenue Mall, 4th Floor"
              required
              className="w-full px-3.5 py-2.5 bg-[#f7f6f2] border border-[#e5e3dc] rounded-xl text-[#252824] focus:outline-none focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-[#555850] font-semibold mb-1">City</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="e.g. New York"
              required
              className="w-full px-3.5 py-2.5 bg-[#f7f6f2] border border-[#e5e3dc] rounded-xl text-[#252824] focus:outline-none focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-[#555850] font-semibold mb-1">
              Facilities (comma separated)
            </label>
            <input
              type="text"
              value={formData.facilities}
              onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
              placeholder="Dolby Atmos, Recliner Seats, Gourmet Cafe, Free Parking"
              className="w-full px-3.5 py-2.5 bg-[#f7f6f2] border border-[#e5e3dc] rounded-xl text-[#252824] focus:outline-none focus:border-primary-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-[#e5e3dc]">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl text-[#555850] hover:text-[#252824] bg-[#f7f6f2] hover:bg-[#e9e8df]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="px-5 py-2 rounded-xl text-[#252824] bg-[#252824] hover:bg-[#344638] text-white font-bold shadow-md"
            >
              {formSubmitting ? 'Saving...' : isEditing ? 'Update Theatre' : 'Create Theatre'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Theatre Location"
        message={`Are you sure you want to delete "${theatreToDelete?.name}"? All associated screens and showtimes will be affected.`}
        confirmText="Delete Theatre"
        isDanger={true}
        isLoading={deleting}
      />
    </div>
  );
};

export default ManageTheatresPage;
