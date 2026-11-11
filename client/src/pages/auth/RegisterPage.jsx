import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Phone, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await register(name, email, password, phone);
      toast.success('Registration successful! Welcome to CineBook.');
      navigate('/');
    } catch (err) {
      console.error('Registration error:', err);
      setErrorMessage(
        err.response?.data?.message || err.message || 'Registration failed. Email might already be taken.'
      );
    } finally {
      setLoading(false);
    }
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
              Join CineBook.
            </h1>
            <p className="text-xs text-[#777a72] mt-1">
              Create an account for personalized bookings and instant seat holding.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3 rounded-lg bg-[#fdf5f2] border border-[#cf785b]/40 text-[#cf785b] text-xs">
              {errorMessage}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#252824] mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777a72]" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sarah Connor"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#e5e3dc] bg-white text-sm text-[#252824] placeholder-[#9ea098] focus:outline-none focus:border-[#cf785b]"
                />
              </div>
            </div>

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
                  placeholder="sarah@example.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#e5e3dc] bg-white text-sm text-[#252824] placeholder-[#9ea098] focus:outline-none focus:border-[#cf785b]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#252824] mb-1.5">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777a72]" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
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
                  placeholder="Min 6 characters"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#e5e3dc] bg-white text-sm text-[#252824] placeholder-[#9ea098] focus:outline-none focus:border-[#cf785b]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#252824] mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777a72]" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
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
                  <span>Create Account</span>
                  <span>↗</span>
                </>
              )}
            </button>
          </form>

          {/* Switch to Login */}
          <div className="mt-6 pt-5 border-t border-[#e5e3dc] text-center text-xs text-[#777a72]">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-[#252824] hover:text-[#cf785b] underline"
            >
              Log in here ↗
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
