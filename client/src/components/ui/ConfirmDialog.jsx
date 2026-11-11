import React from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = false,
  isLoading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      <div className="flex flex-col items-center text-center py-2">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
            isDanger ? 'bg-[#fdf5f2] text-[#cf785b]' : 'bg-[#e5eae4] text-[#344638]'
          }`}
        >
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="font-display text-xl font-bold text-[#252824] mb-1.5">{title}</h3>
        <p className="text-[#777a72] text-xs mb-6 leading-relaxed max-w-sm">{message}</p>

        <div className="flex items-center space-x-3 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 px-4 rounded-full text-xs font-semibold text-[#555850] bg-white hover:bg-[#f7f6f2] border border-[#e5e3dc] transition-all"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-2.5 px-4 rounded-full text-xs font-semibold text-white shadow-sm transition-all flex items-center justify-center ${
              isDanger
                ? 'bg-[#a33d35] hover:bg-[#852d26]'
                : 'bg-[#252824] hover:bg-[#344638]'
            } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : null}
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
