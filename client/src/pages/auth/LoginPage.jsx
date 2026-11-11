import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowUpRight, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name || 'User'}!`);
      if (user.role === 'admin' && redirectPath === '/') {
        navigate('/admin');
      } else {
        navigate(redirectPath);
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrorMessage(
        err.response?.data?.message || err.message || 'Invalid email or password.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setErrorMessage('');
  };

  return (
    <div className="min-h-[85vh] bg-[#f7f6f2] flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="bg-white border border-[#e5e3dc] rounded-2xl p-8 sm:p-10 shadow-panel">
          {/* Logo & Heading */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-3">
              <span className="brand-mark">c.</span>
              <span className="font-display font-bold text-xl tracking-tight text-[#252824]">
                CineBook
              </span>
            </Link>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#252824]">
              Welcome back.
            </h1>
            <p className="text-xs text-[#777a72] mt-1">
              Sign in to manage your movie tickets, passes, and reservations.
            </p>
          </div>

          {/* Quick Demo Autofill Pills for Assessment Reviewers */}
          <div className="mb-6 p-4 rounded-xl bg-[#f7f6f2] border border-[#e5e3dc] space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#777a72] block">
              1-Click Demo Credentials:
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleFillDemo('admin@cinema.com', 'admin123')}
                className="flex-1 py-1.5 px-2.5 rounded-lg bg-white border border-[#e5e3dc] hover:border-[#cf785b] text-[11px] font-semibold text-[#252824] transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#344638]" />
                <span>Admin</span>
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('john@example.com', 'password123')}
                className="flex-1 py-1.5 px-2.5 rounded-lg bg-white border border-[#e5e3dc] hover:border-[#cf785b] text-[11px] font-semibold text-[#252824] transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <User className="w-3.5 h-3.5 text-[#cf785b]" />
                <span>Customer</span>
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3 rounded-lg bg-[#fdf5f2] border border-[#cf785b]/40 text-[#cf785b] text-xs">
              {errorMessage}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#252824] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777a72]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#e5e3dc] bg-white text-sm text-[#252824] placeholder-[#9ea098] focus:outline-none focus:border-[#cf785b]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#252824] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777a72]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#e5e3dc] bg-white text-sm text-[#252824] placeholder-[#9ea098] focus:outline-none focus:border-[#cf785b]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="nav-cta w-full justify-center py-3 mt-2 shadow-sm"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <span>↗</span>
                </>
              )}
            </button>
          </form>

          {/* Switch to Register */}
          <div className="mt-6 pt-5 border-t border-[#e5e3dc] text-center text-xs text-[#777a72]">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-semibold text-[#252824] hover:text-[#cf785b] underline"
            >
              Join us now ↗
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
