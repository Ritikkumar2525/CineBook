import React from 'react';
import { Film } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = Film,
  title = 'No items found',
  description = 'There are no items to display at this moment.',
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-dark-800 rounded-2xl bg-dark-900/40 my-6">
      <div className="w-16 h-16 rounded-2xl bg-dark-800/80 border border-dark-700/60 flex items-center justify-center text-dark-400 mb-4 shadow-inner">
        <Icon className="w-8 h-8 text-primary-400" />
      </div>
      <h4 className="text-lg font-bold text-white mb-1.5">{title}</h4>
      <p className="text-sm text-dark-300 max-w-sm mb-6 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary-600 hover:bg-primary-500 shadow-lg shadow-primary-900/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
