import React, { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Film,
  Building2,
  Tv,
  CalendarClock,
  Ticket,
  ClipboardList,
  Menu,
  X,
  ArrowLeft,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard & Reports', path: '/admin', icon: LayoutDashboard, end: true },
    { name: 'Movies Catalog', path: '/admin/movies', icon: Film },
    { name: 'Theatres & Venues', path: '/admin/theatres', icon: Building2 },
    { name: 'Screens & Tiers', path: '/admin/screens', icon: Tv },
    { name: 'Showtime Schedules', path: '/admin/showtimes', icon: CalendarClock },
    { name: 'Bookings & Usher Scanner', path: '/admin/bookings', icon: Ticket },
    { name: 'Audit Logs Trail', path: '/admin/audit-logs', icon: ClipboardList },
  ];

  const getLinkClasses = ({ isActive }) =>
    `flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
      isActive
        ? 'bg-[#252824] text-white shadow-sm'
        : 'text-[#555850] hover:text-[#252824] hover:bg-[#f7f6f2]'
    }`;

  return (
    <div className="min-h-screen bg-[#f7f6f2] flex flex-col md:flex-row text-[#252824]">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-[#e5e3dc] sticky top-0 z-40">
        <div className="flex items-center space-x-2">
          <span className="brand-mark w-7 h-7 text-xs">c.</span>
          <span className="font-display font-bold text-sm text-[#252824]">Staff Operations</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-lg border border-[#e5e3dc] text-[#555850] hover:text-[#252824]"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#e5e3dc] transform transition-transform duration-200 ease-in-out md:static md:translate-x-0 flex flex-col justify-between ${
          sidebarOpen ? 'translate-x-0 shadow-panel' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand header */}
          <div className="h-[76px] px-6 border-b border-[#e5e3dc] flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="brand-mark">c.</span>
              <div>
                <span className="font-display font-bold text-base text-[#252824] block leading-tight">
                  CineBook
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#344638]">
                  Staff Portal
                </span>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-[#777a72]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  onClick={() => setSidebarOpen(false)}
                  className={getLinkClasses}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer profile & return */}
        <div className="p-4 border-t border-[#e5e3dc] space-y-2">
          <Link
            to="/"
            className="flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-semibold text-[#555850] hover:text-[#252824] hover:bg-[#f7f6f2] transition-colors"
          >
            <div className="flex items-center gap-2">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Cinema Front</span>
            </div>
            <span>↗</span>
          </Link>

          <div className="p-3 rounded-lg bg-[#f7f6f2] border border-[#e5e3dc] flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#252824] truncate">{user?.name || 'Admin'}</p>
              <p className="text-[10px] text-[#777a72] truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-[#cf785b] hover:text-[#a85338]"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 min-w-0 bg-[#f7f6f2] p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
