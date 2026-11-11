import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Tv,
  Plus,
  Pencil,
  Trash2,
  Building2,
  Users,
  Layers,
  DollarSign,
  X,
  Palette
} from 'lucide-react';
import { screensApi, theatresApi } from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

export const ManageScreensPage = () => {
  const [screens, setScreens] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTheatreFilter, setSelectedTheatreFilter] = useState('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Form State
  const defaultCategories = [
    { name: 'VIP', price: 350, rows: 2, seatsPerRow: 8, color: '#eab308' },
    { name: 'Premium', price: 250, rows: 3, seatsPerRow: 10, color: '#3b82f6' },
    { name: 'Standard', price: 150, rows: 5, seatsPerRow: 10, color: '#9333ea' },
  ];

  const initialForm = {
    theatre: '',
    name: '',
    seatCategories: defaultCategories,
  };
  const [formData, setFormData] = useState(initialForm);

  // Delete Dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [screenToDelete, setScreenToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [screensRes, theatresRes] = await Promise.all([
        screensApi.getAll(),
        theatresApi.getAll(),
      ]);

      const scList = screensRes.data?.screens || screensRes.data?.data || screensRes.data || [];
      const thList = theatresRes.data?.theatres || theatresRes.data?.data || theatresRes.data || [];

      setScreens(Array.isArray(scList) ? scList : []);
      setTheatres(Array.isArray(thList) ? thList : []);
    } catch (err) {
      console.error('Failed to load screen data:', err);
      toast.error('Failed to load screens');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({
      theatre: theatres[0]?._id || '',
      name: '',
      seatCategories: [
        { name: 'VIP', price: 350, rows: 1, seatsPerRow: 8, color: '#eab308' },
        { name: 'Premium', price: 250, rows: 2, seatsPerRow: 10, color: '#3b82f6' },
        { name: 'Standard', price: 150, rows: 4, seatsPerRow: 10, color: '#9333ea' },
      ],
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (screen) => {
    setIsEditing(true);
    setCurrentId(screen._id);
    const theatreId = screen.theatre?._id || screen.theatre || '';

    setFormData({
      theatre: theatreId,
      name: screen.name || '',
      seatCategories:
        screen.seatCategories && screen.seatCategories.length > 0
          ? screen.seatCategories
          : defaultCategories,
    });
    setModalOpen(true);
  };

  const handleAddCategory = () => {
    setFormData({
      ...formData,
      seatCategories: [
        ...formData.seatCategories,
        { name: 'New Tier', price: 200, rows: 2, seatsPerRow: 10, color: '#a855f7' },
      ],
    });
  };

  const handleRemoveCategory = (index) => {
    if (formData.seatCategories.length <= 1) {
      toast.error('Must have at least one seat tier');
      return;
    }
    const updated = formData.seatCategories.filter((_, i) => i !== index);
    setFormData({ ...formData, seatCategories: updated });
  };

  const handleCategoryChange = (index, field, value) => {
    const updated = [...formData.seatCategories];
    updated[index] = {
      ...updated[index],
      [field]: field === 'price' || field === 'rows' || field === 'seatsPerRow' ? Number(value) : value,
    };
    setFormData({ ...formData, seatCategories: updated });
  };

  const calculateTotalSeats = (categories) => {
    return categories.reduce(
      (sum, cat) => sum + (Number(cat.rows) || 0) * (Number(cat.seatsPerRow) || 0),
      0
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.theatre) {
      toast.error('Please select a theatre');
      return;
    }

    try {
      setFormSubmitting(true);
      const totalSeats = calculateTotalSeats(formData.seatCategories);
      const payload = {
        ...formData,
        totalSeats,
      };

      if (isEditing) {
        await screensApi.update(currentId, payload);
        toast.success('Screen updated successfully');
      } else {
        await screensApi.create(payload);
        toast.success('Screen created successfully');
      }

      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Error saving screen:', err);
      toast.error(err.message || 'Failed to save screen');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!screenToDelete) return;
    try {
      setDeleting(true);
      await screensApi.delete(screenToDelete._id);
      toast.success('Screen deleted successfully');
      setDeleteDialogOpen(false);
      setScreenToDelete(null);
      loadData();
    } catch (err) {
      console.error('Error deleting screen:', err);
      toast.error(err.message || 'Failed to delete screen');
    } finally {
      setDeleting(false);
    }
  };

  const filteredScreens = screens.filter((s) => {
    if (selectedTheatreFilter === 'all') return true;
    const thId = s.theatre?._id || s.theatre;
    return thId === selectedTheatreFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-dark-800 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center">
            <Tv className="w-7 h-7 text-primary-400 mr-2.5" />
            Manage Screens & Auditoriums
          </h1>
          <p className="text-xs sm:text-sm text-dark-400 mt-0.5">
            Configure hall layouts, tiered seat categories, pricing tiers, and capacity
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="self-start sm:self-auto flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-primary-600 hover:bg-primary-500 shadow-lg shadow-primary-950/40 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Screen</span>
        </button>
      </div>

      {/* Filter by Theatre */}
      <div className="flex items-center space-x-3 bg-dark-900 border border-dark-800 p-3 rounded-2xl max-w-sm">
        <Building2 className="w-4 h-4 text-primary-400 flex-shrink-0" />
        <select
          value={selectedTheatreFilter}
          onChange={(e) => setSelectedTheatreFilter(e.target.value)}
          className="w-full bg-transparent text-xs sm:text-sm text-dark-200 focus:outline-none cursor-pointer"
        >
          <option value="all">All Cinema Locations</option>
          {theatres.map((th) => (
            <option key={th._id} value={th._id}>
              {th.name} ({th.city})
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" text="Loading screens..." />
      ) : filteredScreens.length === 0 ? (
        <EmptyState
          icon={Tv}
          title="No screens found"
          description="Click Add New Screen to build auditorium seat layouts for your theatres."
          actionLabel="Add Screen"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredScreens.map((screen) => {
            const theatreName = screen.theatre?.name || 'Assigned Theatre';
            const totalSeats =
              screen.totalSeats || calculateTotalSeats(screen.seatCategories || []);

            return (
              <motion.div
                key={screen._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-dark-900 border border-dark-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-dark-700 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                      <Tv className="w-6 h-6" />
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => handleOpenEdit(screen)}
                        className="p-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-white transition-colors"
                        title="Edit Screen"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setScreenToDelete(screen);
                          setDeleteDialogOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                        title="Delete Screen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-0.5">{screen.name}</h3>
                  <p className="text-xs text-primary-400 font-medium mb-3 flex items-center">
                    <Building2 className="w-3.5 h-3.5 mr-1" />
                    {theatreName}
                  </p>

                  <div className="p-3 bg-dark-950/80 rounded-xl border border-dark-800 flex justify-between items-center text-xs mb-4">
                    <span className="text-dark-400 font-medium">Total Capacity</span>
                    <span className="text-sm font-black text-white">{totalSeats} Seats</span>
                  </div>

                  {/* Seat Categories breakdown */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-dark-400">
                      Tier Breakdown
                    </p>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {(screen.seatCategories || []).map((cat, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-lg bg-dark-850/80 border border-dark-800 text-xs"
                        >
                          <div className="flex items-center space-x-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: cat.color || '#a855f7' }}
                            />
                            <span className="font-semibold text-white">{cat.name}</span>
                          </div>
                          <div className="text-right text-[11px]">
                            <span className="text-emerald-400 font-bold">₹{cat.price}</span>
                            <span className="text-dark-400 ml-2">
                              ({(cat.rows || 1) * (cat.seatsPerRow || 1)} seats)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal with dynamic category manager */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isEditing ? 'Edit Screen & Layout' : 'Create Auditorium Screen'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5 text-xs sm:text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-dark-300 font-semibold mb-1">Parent Theatre</label>
              <select
                value={formData.theatre}
                onChange={(e) => setFormData({ ...formData, theatre: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 bg-dark-950 border border-dark-700/80 rounded-xl text-white focus:outline-none focus:border-primary-500"
              >
                <option value="">Select Theatre</option>
                {theatres.map((th) => (
                  <option key={th._id} value={th._id}>
                    {th.name} ({th.city})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-dark-300 font-semibold mb-1">Screen Name / Number</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Screen 1 - Dolby IMAX"
                required
                className="w-full px-3.5 py-2.5 bg-dark-950 border border-dark-700/80 rounded-xl text-white focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>

          {/* Seat Categories Manager */}
          <div className="pt-3 border-t border-dark-800">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-bold text-white">Auditorium Seat Tiers</h4>
                <p className="text-[11px] text-dark-400">
                  Total calculated seats: {calculateTotalSeats(formData.seatCategories)}
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddCategory}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-dark-800 hover:bg-dark-700 text-primary-300 border border-dark-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Tier</span>
              </button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {formData.seatCategories.map((cat, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-2 p-3 bg-dark-950 rounded-xl border border-dark-800 items-center"
                >
                  <div className="col-span-3">
                    <label className="block text-[10px] text-dark-400 mb-0.5">Tier Name</label>
                    <input
                      type="text"
                      value={cat.name}
                      onChange={(e) => handleCategoryChange(index, 'name', e.target.value)}
                      required
                      placeholder="Name"
                      className="w-full px-2 py-1.5 bg-dark-900 border border-dark-700 rounded-lg text-white text-xs"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[10px] text-dark-400 mb-0.5">Price (₹)</label>
                    <input
                      type="number"
                      value={cat.price}
                      onChange={(e) => handleCategoryChange(index, 'price', e.target.value)}
                      required
                      min={1}
                      className="w-full px-2 py-1.5 bg-dark-900 border border-dark-700 rounded-lg text-white text-xs"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[10px] text-dark-400 mb-0.5">Rows</label>
                    <input
                      type="number"
                      value={cat.rows}
                      onChange={(e) => handleCategoryChange(index, 'rows', e.target.value)}
                      required
                      min={1}
                      className="w-full px-2 py-1.5 bg-dark-900 border border-dark-700 rounded-lg text-white text-xs"
                    />
                  </div>

                  <div className="col-span-3">
                    <label className="block text-[10px] text-dark-400 mb-0.5">Seats/Row</label>
                    <input
                      type="number"
                      value={cat.seatsPerRow}
                      onChange={(e) => handleCategoryChange(index, 'seatsPerRow', e.target.value)}
                      required
                      min={1}
                      className="w-full px-2 py-1.5 bg-dark-900 border border-dark-700 rounded-lg text-white text-xs"
                    />
                  </div>

                  <div className="col-span-2 flex justify-end items-end pt-3">
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(index)}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 transition-colors"
                      title="Remove Tier"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
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
              {formSubmitting ? 'Saving...' : isEditing ? 'Update Screen' : 'Save Screen'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Auditorium Screen"
        message={`Are you sure you want to remove "${screenToDelete?.name}"? Scheduled showtimes for this screen will also be cancelled.`}
        confirmText="Delete Screen"
        isDanger={true}
        isLoading={deleting}
      />
    </div>
  );
};

export default ManageScreensPage;
