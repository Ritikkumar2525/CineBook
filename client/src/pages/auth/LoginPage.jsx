import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, X, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AuthVisualSide from '../../components/auth/AuthVisualSide';
import toast from 'react-hot-toast';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    toast.success(`Demo credentials filled for ${demoEmail}`);
  };

  return (
    <div className="min-h-screen bg-[#9ea7b4] flex items-center justify-center p-3 sm:p-6 md:p-10 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative w-full max-w-[1020px] bg-gradient-to-b from-[#fdfcf9] via-[#faf8f0] to-[#f4ebd6] rounded-[36px] sm:rounded-[42px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] overflow-hidden"
      >
        {/* Top-Right Circular Close Button */}
        <Link
          to="/"
          aria-label="Close"
          className="absolute top-5 right-5 sm:top-6 sm:right-6 z-30 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-stone-700 hover:text-stone-900 flex items-center justify-center shadow-sm hover:shadow transition-all"
        >
          <X className="w-4 h-4" />
        </Link>

        {/* 2-Column Split: Left Form / Right Visual Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-2 items-stretch min-h-[640px]">
          {/* Left Column: Form Content */}
          <div className="p-7 sm:p-10 md:p-12 flex flex-col justify-between">
            {/* Top Bar: Brand Pill */}
            <div>
              <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-stone-300/80 bg-white/60 backdrop-blur-sm text-stone-800 text-xs font-semibold tracking-wide shadow-xs mb-6">
                <span>Crextio</span>
              </div>

              {/* Title & Subtitle */}
              <div className="text-center mb-6">
                <h1 className="font-sans text-2xl sm:text-[28px] font-semibold text-stone-900 tracking-tight">
                  Welcome back
                </h1>
                <p className="text-xs text-stone-500 mt-1.5">
                  Sign in to manage your cinema passes & tickets
                </p>
              </div>

              {/* 1-Click Demo Credentials Pill Bar for Assessment Reviewers */}
              <div className="mb-5 p-2.5 rounded-2xl bg-white/70 border border-stone-200/80 backdrop-blur-xs">
                <div className="flex items-center justify-between mb-1.5 px-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500">
                    1-Click Demo Login
                  </span>
                  <span className="text-[10px] text-stone-400">reviewer access</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleFillDemo('admin@cinema.com', 'admin123')}
                    className="flex-1 py-1.5 px-3 rounded-full bg-white border border-stone-200 hover:border-amber-400 text-[11px] font-semibold text-stone-800 transition flex items-center justify-center gap-1.5 shadow-2xs hover:bg-amber-50/50"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Admin</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFillDemo('john@example.com', 'password123')}
                    className="flex-1 py-1.5 px-3 rounded-full bg-white border border-stone-200 hover:border-amber-400 text-[11px] font-semibold text-stone-800 transition flex items-center justify-center gap-1.5 shadow-2xs hover:bg-amber-50/50"
                  >
                    <User className="w-3.5 h-3.5 text-amber-600" />
                    <span>Customer</span>
                  </button>
                </div>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="mb-5 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs text-center font-medium">
                  {errorMessage}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-[11px] font-medium text-stone-600 mb-1.5 ml-3">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="amélielaurent7622@gmail.com"
                    required
                    className="w-full bg-white border border-stone-200/90 rounded-full px-5 py-3 text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#fed45b] focus:border-[#fed45b] shadow-sm transition"
                  />
                </div>

                {/* Password with Eye Toggle */}
                <div>
                  <label className="block text-[11px] font-medium text-stone-600 mb-1.5 ml-3">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••••••"
                      required
                      className="w-full bg-white border border-stone-200/90 rounded-full pl-5 pr-12 py-3 text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#fed45b] focus:border-[#fed45b] shadow-sm transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 bg-[#fed45b] hover:bg-[#f6c944] active:scale-[0.99] text-stone-900 font-semibold py-3 sm:py-3.5 rounded-full text-xs sm:text-sm shadow-sm hover:shadow transition-all text-center flex items-center justify-center"
                >
                  {loading ? 'Signing in...' : 'Submit'}
                </button>

                {/* Social Login Buttons */}
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => toast('Apple login is a mock preview', { icon: '' })}
                    className="flex-1 bg-white hover:bg-stone-50 border border-stone-200/90 rounded-full py-2.5 px-4 text-xs font-medium text-stone-700 flex items-center justify-center gap-2 shadow-xs transition"
                  >
                    <span className="text-sm"></span>
                    <span>Apple</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toast('Google login is a mock preview', { icon: 'G' })}
                    className="flex-1 bg-white hover:bg-stone-50 border border-stone-200/90 rounded-full py-2.5 px-4 text-xs font-medium text-stone-700 flex items-center justify-center gap-2 shadow-xs transition"
                  >
                    <span className="font-bold text-xs text-amber-600">G</span>
                    <span>Google</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Bottom Footer Row */}
            <div className="flex items-center justify-between text-[11px] text-stone-500 pt-8 mt-6">
              <div>
                <span>Don't have an account? </span>
                <Link
                  to="/register"
                  className="text-stone-900 font-medium underline hover:text-stone-700 transition"
                >
                  Sign up
                </Link>
              </div>
              <a
                href="#terms"
                onClick={(e) => {
                  e.preventDefault();
                  toast('CineBook terms of service apply.');
                }}
                className="text-stone-600 underline hover:text-stone-900 transition"
              >
                Terms & Conditions
              </a>
            </div>
          </div>

          {/* Right Column: Visual Showcase Card */}
          <div className="hidden lg:block">
            <AuthVisualSide />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
