import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Heart, Github, Twitter, Mail } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-dark-900 border-t border-dark-800 text-dark-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand info */}
          <div className="md:col-span-1 space-y-4">
            <Link to="/" className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                <Film className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-black text-white">
                Cine<span className="text-primary-500">Book</span>
              </span>
            </Link>
            <p className="text-sm text-dark-400 leading-relaxed">
              Experience the best movies in premier cinema theatres with instant booking, seat holding, and mobile QR ticketing.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Explore
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-primary-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/movies" className="hover:text-primary-400 transition-colors">
                  Now Showing
                </Link>
              </li>
              <li>
                <Link to="/movies?status=coming_soon" className="hover:text-primary-400 transition-colors">
                  Coming Soon
                </Link>
              </li>
              <li>
                <Link to="/my-bookings" className="hover:text-primary-400 transition-colors">
                  My Bookings
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal / Policy */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Help & Support
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="hover:text-white cursor-pointer transition-colors">Terms of Service</span>
              </li>
              <li>
                <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
              </li>
              <li>
                <span className="hover:text-white cursor-pointer transition-colors">Cancellation & Refunds</span>
              </li>
              <li>
                <span className="hover:text-white cursor-pointer transition-colors">FAQ & Support</span>
              </li>
            </ul>
          </div>

          {/* Demo Details */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Demo Access
            </h4>
            <div className="p-3 bg-dark-950/60 rounded-xl border border-dark-800 text-xs space-y-1.5 text-dark-300">
              <p className="text-primary-400 font-semibold">Demo Credentials:</p>
              <p><strong className="text-white">Admin:</strong> admin@cinema.com / admin123</p>
              <p><strong className="text-white">Customer:</strong> john@example.com / password123</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-dark-800 flex flex-col sm:flex-row items-center justify-between text-xs text-dark-400">
          <p>© {new Date().getFullYear()} CineBook Inc. All rights reserved.</p>
          <p className="flex items-center mt-4 sm:mt-0">
            Built with <Heart className="w-3.5 h-3.5 text-rose-500 mx-1 fill-rose-500" /> for cinema lovers
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
