import React from 'react';

export const Badge = ({ children, status, variant, className = '' }) => {
  const getBadgeStyle = () => {
    // If explicit variant is provided
    if (variant === 'success') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (variant === 'danger' || variant === 'error') return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    if (variant === 'warning') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    if (variant === 'info') return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
    if (variant === 'purple') return 'bg-primary-500/10 text-primary-400 border-primary-500/20';

    // Status mapping
    const normalized = (status || children || '').toString().toLowerCase();

    switch (normalized) {
      case 'confirmed':
      case 'paid':
      case 'active':
      case 'completed':
      case 'now_showing':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'cancelled':
      case 'inactive':
      case 'failed':
      case 'expired':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'used':
      case 'redeemed':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case 'held':
      case 'hold':
      case 'pending':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'coming_soon':
      case 'scheduled':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      default:
        return 'bg-dark-800 text-dark-300 border-dark-700/60';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${getBadgeStyle()} ${className}`}
    >
      {children || status}
    </span>
  );
};

export default Badge;
