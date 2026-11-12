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
    <div className="min-h-screen bg-[#9ea7b4] flex items-center justify-center p-2.5 sm:p-4 md:p-6 select-none overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative w-full max-w-[940px] bg-gradient-to-b from-[#fdfcf9] via-[#faf8f0] to-[#f4ebd6] rounded-[30px] sm:rounded-[36px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] overflow-hidden my-auto"
      >
        {/* Top-Right Circular Close Button */}
        <Link
          to="/"
          aria-label="Close"
          className="absolute top-4 right-4 sm:top-5 sm:right-5 z-30 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 hover:bg-white text-stone-700 hover:text-stone-900 flex items-center justify-center shadow-xs hover:shadow transition-all"
        >
          <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </Link>

        {/* 2-Column Split: Left Form / Right Visual Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-2 items-stretch">
          {/* Left Column: Form Content */}
          <div className="p-5 sm:p-7 md:p-8 flex flex-col justify-between">
            <div>
              {/* Top Bar: Brand Pill */}
              <div className="inline-flex items-center px-3.5 py-1 rounded-full border border-stone-300/80 bg-white/60 backdrop-blur-xs text-stone-800 text-[11px] font-semibold tracking-wide shadow-2xs mb-3 sm:mb-4">
                <span>Crextio</span>
              </div>

              {/* Title & Subtitle */}
              <div className="text-center mb-3 sm:mb-4">
                <h1 className="font-sans text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                  Welcome back
                </h1>
                <p className="text-[11px] sm:text-xs text-stone-500 mt-1">
                  Sign in to manage your cinema passes & tickets
                </p>
              </div>

              {/* 1-Click Demo Credentials Pill Bar for Assessment Reviewers */}
              <div className="mb-3 p-2 rounded-xl bg-white/75 border border-stone-200/80 backdrop-blur-xs">
                <div className="flex items-center justify-between mb-1 px-1">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-stone-500">
                    1-Click Demo Login
                  </span>
                  <span className="text-[9px] text-stone-400">reviewer access</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleFillDemo('admin@cinema.com', 'admin123')}
                    className="flex-1 py-1 px-2.5 rounded-full bg-white border border-stone-200 hover:border-amber-400 text-[11px] font-semibold text-stone-800 transition flex items-center justify-center gap-1.5 shadow-2xs hover:bg-amber-50/50"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Admin</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFillDemo('john@example.com', 'password123')}
                    className="flex-1 py-1 px-2.5 rounded-full bg-white border border-stone-200 hover:border-amber-400 text-[11px] font-semibold text-stone-800 transition flex items-center justify-center gap-1.5 shadow-2xs hover:bg-amber-50/50"
                  >
                    <User className="w-3.5 h-3.5 text-amber-600" />
                    <span>Customer</span>
                  </button>
                </div>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="mb-3 p-2 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs text-center font-medium">
                  {errorMessage}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-2.5">
                {/* Email */}
                <div>
                  <label className="block text-[10px] font-medium text-stone-600 mb-1 ml-2.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="amélielaurent7622@gmail.com"
                    required
                    className="w-full bg-white border border-stone-200/90 rounded-full px-4 py-2 sm:py-2.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#fed45b] focus:border-[#fed45b] shadow-2xs transition"
                  />
                </div>

                {/* Password with Eye Toggle */}
                <div>
                  <label className="block text-[10px] font-medium text-stone-600 mb-1 ml-2.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••••••"
                      required
                      className="w-full bg-white border border-stone-200/90 rounded-full pl-4 pr-11 py-2 sm:py-2.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#fed45b] focus:border-[#fed45b] shadow-2xs transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-3 bg-[#fed45b] hover:bg-[#f6c944] active:scale-[0.99] text-stone-900 font-semibold py-2.5 sm:py-3 rounded-full text-xs sm:text-sm shadow-2xs hover:shadow-xs transition-all text-center flex items-center justify-center"
                >
                  {loading ? 'Signing in...' : 'Submit'}
                </button>

                {/* Social Login Buttons */}
                <div className="flex gap-2.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => toast('Apple login is a mock preview', { icon: '' })}
                    className="flex-1 bg-white hover:bg-stone-50 border border-stone-200/90 rounded-full py-2 px-3 text-xs font-medium text-stone-700 flex items-center justify-center gap-1.5 shadow-2xs transition"
                  >
                    <span className="text-xs"></span>
                    <span>Apple</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toast('Google login is a mock preview', { icon: 'G' })}
                    className="flex-1 bg-white hover:bg-stone-50 border border-stone-200/90 rounded-full py-2 px-3 text-xs font-medium text-stone-700 flex items-center justify-center gap-1.5 shadow-2xs transition"
                  >
                    <span className="font-bold text-xs text-amber-600">G</span>
                    <span>Google</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Bottom Footer Row */}
            <div className="flex items-center justify-between text-[11px] text-stone-500 pt-3 mt-3 border-t border-stone-200/50">
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
