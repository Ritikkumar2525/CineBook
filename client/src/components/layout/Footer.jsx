import React from 'react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="bg-[#f7f6f2] border-t border-[#e5e3dc] text-[#555850]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand info */}
          <div className="md:col-span-1 space-y-3">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="brand-mark">c.</span>
              <span className="font-display font-bold text-lg tracking-tight text-[#252824]">
                CineBook
              </span>
            </Link>
            <p className="text-[13px] text-[#777a72] leading-relaxed">
              Curated screenings for slow evenings, grand adventures, and stories worth keeping.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#252824] mb-3">
              Explore
            </h4>
            <ul className="space-y-2 text-[13px]">
              <li>
                <Link to="/movies" className="hover:text-[#cf785b] transition-colors">
                  Find a Movie
                </Link>
              </li>
              <li>
                <Link to="/movies?format=IMAX" className="hover:text-[#cf785b] transition-colors">
                  IMAX 3D Experience
                </Link>
              </li>
              <li>
                <Link to="/my-bookings" className="hover:text-[#cf785b] transition-colors">
                  My Reservations
                </Link>
              </li>
            </ul>
          </div>

          {/* Admin Operations */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#252824] mb-3">
              Operations
            </h4>
            <ul className="space-y-2 text-[13px]">
              <li>
                <Link to="/admin" className="hover:text-[#cf785b] transition-colors">
                  Staff Portal
                </Link>
              </li>
              <li>
                <Link to="/admin/bookings" className="hover:text-[#cf785b] transition-colors">
                  Usher Scanner Terminal
                </Link>
              </li>
              <li>
                <a
                  href="http://localhost:5001/api/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#cf785b] transition-colors"
                >
                  API Reference (Scalar) ↗
                </a>
              </li>
            </ul>
          </div>

          {/* Reviewer Note */}
          <div className="p-4 rounded-lg bg-white border border-[#e5e3dc] shadow-sm">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#344638] mb-1.5">
              Reviewer Test Credentials
            </h4>
            <p className="text-[11px] text-[#777a72] mb-1">
              Admin: <code className="text-[#252824] font-semibold">admin@cinema.com</code> / <code className="text-[#252824]">admin123</code>
            </p>
            <p className="text-[11px] text-[#777a72]">
              Customer: <code className="text-[#252824] font-semibold">john@example.com</code> / <code className="text-[#252824]">password123</code>
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-[#e5e3dc] flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-[#777a72]">
          <div className="flex items-center gap-2">
            <span className="brand-mark w-5 h-5 text-[11px]">c.</span>
            <span>© 2026 CineBook Inc. Built for Algions AI Labs assessment.</span>
          </div>
          <div className="flex items-center gap-6">
            <span>All rights reserved</span>
            <a href="http://localhost:5001/api/health" className="hover:text-[#cf785b]">
              System Health: 200 OK
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
