import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, currentPage + 2);

      if (currentPage <= 3) {
        startPage = 1;
        endPage = 5;
      } else if (currentPage >= totalPages - 2) {
        startPage = totalPages - 4;
        endPage = totalPages;
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    return pages;
  };

  return (
    <nav className="flex items-center justify-center space-x-2 my-8" aria-label="Pagination">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
          currentPage === 1
            ? 'bg-dark-900/50 text-dark-500 cursor-not-allowed border border-dark-800'
            : 'bg-dark-900 text-dark-200 hover:bg-dark-800 hover:text-white border border-dark-700/60'
        }`}
        aria-label="Previous Page"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Prev
      </button>

      {getPageNumbers().map((pageNum) => (
        <button
          key={pageNum}
          onClick={() => onPageChange(pageNum)}
          className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${
            pageNum === currentPage
              ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/40 ring-1 ring-primary-500'
              : 'bg-dark-900 text-dark-300 hover:bg-dark-800 hover:text-white border border-dark-700/60'
          }`}
        >
          {pageNum}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
          currentPage === totalPages
            ? 'bg-dark-900/50 text-dark-500 cursor-not-allowed border border-dark-800'
            : 'bg-dark-900 text-dark-200 hover:bg-dark-800 hover:text-white border border-dark-700/60'
        }`}
        aria-label="Next Page"
      >
        Next
        <ChevronRight className="w-4 h-4 ml-1" />
      </button>
    </nav>
  );
};

export default Pagination;
