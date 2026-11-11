import React from 'react';
import { Film } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = Film,
  title = 'No items found',
  description = 'There are no items to display at this moment.',
  message,
  actionLabel,
  onAction,
}) => {
  const displayMsg = message || description;

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-[#e5e3dc] rounded-2xl bg-white my-6 shadow-sm">
      <div className="w-14 h-14 rounded-full bg-[#fdf5f2] text-[#cf785b] flex items-center justify-center mb-4">
        <Icon className="w-7 h-7" />
      </div>
      <h4 className="font-display text-lg font-bold text-[#252824] mb-1">{title}</h4>
      <p className="text-xs text-[#777a72] max-w-sm mb-6 leading-relaxed">{displayMsg}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="nav-cta"
        >
          <span>{actionLabel}</span>
          <span>↗</span>
        </button>
      )}
    </div>
  );
};

export default EmptyState;
