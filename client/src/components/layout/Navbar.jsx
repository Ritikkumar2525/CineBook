import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, Ticket, Shield, Menu, X, ChevronDown, Film } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    toast.success('Logged out successfully');
    navigate('/');
  };

  const navLinkClass = ({ isActive }) =>
    `px-3.5 py-1.5 text-[14px] font-medium transition-colors ${
      isActive
        ? 'text-[#252824] font-semibold border-b-2 border-[#cf785b]'
        : 'text-[#555850] hover:text-[#cf785b]'
    }`;

  return (
    <header className="sticky top-0 z-50 w-full bg-[#f7f6f2]/95 backdrop-blur-md border-b border-[#e5e3dc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[76px]">
          {/* StayBnb style Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <span className="brand-mark shadow-sm">c.</span>
            <span className="font-display font-bold text-[22px] tracking-tight text-[#252824] group-hover:text-[#cf785b] transition-colors">
              CineBook
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <NavLink to="/" className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/movies" className={navLinkClass}>
              Find a movie
            </NavLink>
            {isAuthenticated && (
              <NavLink to="/my-bookings" className={navLinkClass}>
                My Bookings
              </NavLink>
            )}
            {isAdmin && (
              <NavLink
                to="/admin"
                className="px-3 py-1 text-[13px] font-semibold text-[#344638] bg-[#e5eae4] rounded-full hover:bg-[#cbdbcb] transition-colors flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5" />
                Admin Portal
              </NavLink>
            )}
          </nav>

          {/* User / Auth CTA buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2.5 px-3 py-1.5 rounded-full border border-[#e5e3dc] bg-white hover:border-[#cf785b] transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-[#344638] text-white flex items-center justify-center font-display font-semibold text-xs">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="text-xs font-semibold text-[#252824] max-w-[120px] truncate">
                    {user?.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#777a72]" />
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-panel border border-[#e5e3dc] py-2 z-50"
                    >
                      <div className="px-4 py-2 border-b border-[#e5e3dc]">
                        <p className="text-xs text-[#777a72]">Signed in as</p>
                        <p className="text-sm font-semibold text-[#252824] truncate">
                          {user?.email}
                        </p>
                        <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-[#e5eae4] text-[#344638]">
                          {user?.role}
                        </span>
                      </div>

                      <div className="py-1">
                        <Link
                          to="/my-bookings"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-xs font-medium text-[#41453f] hover:bg-[#f7f6f2] hover:text-[#252824]"
                        >
                          <Ticket className="w-4 h-4 mr-2.5 text-[#777a72]" />
                          My Bookings
                        </Link>
                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center px-4 py-2 text-xs font-medium text-[#344638] hover:bg-[#e5eae4]"
                          >
                            <Shield className="w-4 h-4 mr-2.5" />
                            Admin Operations
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-[#e5e3dc] pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center px-4 py-2 text-xs font-medium text-[#a33d35] hover:bg-[#fdf5f2]"
                        >
                          <LogOut className="w-4 h-4 mr-2.5" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-[14px] font-medium text-[#41453f] hover:text-[#cf785b] transition-colors"
                >
                  Log in
                </Link>
                <Link to="/register" className="nav-cta">
                  <span>Join us</span>
                  <span className="text-xs">↗</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#252824] hover:bg-[#e9e8df] transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-[#e5e3dc] bg-[#f7f6f2] px-4 pt-3 pb-6 space-y-3"
          >
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-[#252824]"
            >
              Home
            </Link>
            <Link
              to="/movies"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-[#252824]"
            >
              Find a movie
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  to="/my-bookings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-sm font-semibold text-[#252824]"
                >
                  My Bookings
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2 text-sm font-semibold text-[#344638]"
                  >
                    Admin Dashboard
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full text-left py-2 text-sm font-semibold text-[#a33d35]"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="pt-2 flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-center text-sm font-semibold border border-[#e5e3dc] rounded-full bg-white text-[#252824]"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="nav-cta justify-center"
                >
                  Join us ↗
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
