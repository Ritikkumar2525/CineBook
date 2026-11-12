import React from 'react';
import { motion } from 'framer-motion';

export const AuthVisualSide = () => {
  return (
    <div className="relative rounded-[26px] sm:rounded-[30px] overflow-hidden h-full min-h-[460px] lg:min-h-[530px] shadow-inner bg-[#141416] m-2 sm:m-2.5 select-none">
      {/* Background Hero Image - Cinematic Theatre Auditorium */}
      <img
        src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=85"
        alt="Cinema auditorium and premiere screen"
        className="absolute inset-0 w-full h-full object-cover object-center scale-105"
      />

      {/* Atmospheric Dark Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/30 pointer-events-none" />
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/20 to-black/60 pointer-events-none" />

      {/* 1. Top Yellow Premiere Widget */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="absolute top-6 left-6 z-10 space-y-1.5"
      >
        <div className="bg-[#ffd25d] text-[#1f2937] rounded-xl px-3.5 py-2 shadow-lg max-w-[200px]">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-bold tracking-tight">IMAX Laser Premiere</h4>
            <span className="w-1.5 h-1.5 rounded-full bg-[#1f2937]" />
          </div>
          <p className="text-[9px] text-[#4b5563] mt-0.5 font-medium">09:30pm–12:15am</p>
        </div>

        {/* Small Dark Screen Pill Below */}
        <div className="bg-black/90 text-white text-[9px] px-2.5 py-0.5 rounded-md shadow-md inline-block font-mono tracking-tight border border-white/10">
          Screen 1 · Dolby Atmos
        </div>
      </motion.div>

      {/* 2. Floating Avatar Bubbles on Right Side */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="absolute right-7 top-24 z-10 flex flex-col items-center -space-y-1.5"
      >
        <img
          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
          alt="Cinephile 1"
          className="w-9 h-9 rounded-full border-2 border-white shadow-lg object-cover"
        />
        <img
          src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80"
          alt="Cinephile 2"
          className="w-8 h-8 rounded-full border-2 border-white shadow-lg object-cover ml-4"
        />
        <img
          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
          alt="Cinephile 3"
          className="w-7 h-7 rounded-full border-2 border-white shadow-lg object-cover -ml-2"
        />
      </motion.div>

      {/* 3. Translucent Glass Calendar Strip */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="absolute bottom-24 left-6 right-6 z-10 bg-black/40 backdrop-blur-md border border-white/20 rounded-2xl p-2.5 sm:p-3 text-white shadow-xl flex items-center justify-between"
      >
        <div className="grid grid-cols-7 gap-2 text-center flex-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
            <div key={day} className="flex flex-col items-center">
              <span className="text-[9px] uppercase font-medium opacity-75">{day}</span>
              <span
                className={`text-[11px] font-bold mt-0.5 ${
                  i === 3 ? 'text-[#ffd25d] font-black' : 'text-white'
                }`}
              >
                {22 + i}
              </span>
            </div>
          ))}
        </div>

        {/* Diagonal striped texture accent box */}
        <div
          className="w-12 h-8 rounded-lg ml-2 border border-white/20 opacity-60 hidden sm:block"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, rgba(255,255,255,0.2) 0, rgba(255,255,255,0.2) 2px, transparent 0, transparent 5px)',
          }}
        />
      </motion.div>

      {/* 4. Bottom White Reservation Widget */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.4 }}
        className="absolute bottom-4 left-6 z-10 bg-white/95 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 shadow-2xl max-w-[195px] text-[#1f2937]"
      >
        <div className="flex items-center justify-between mb-0.5">
          <h5 className="text-[11px] font-bold tracking-tight">VIP Prime Hall</h5>
          <span className="w-1.5 h-1.5 rounded-full bg-[#ffd25d]" />
        </div>
        <p className="text-[9px] text-[#6b7280] mb-1.5 font-medium">Seats D12, D13 · Confirmed</p>

        {/* Mini Attendees Avatars */}
        <div className="flex items-center -space-x-1">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"
            alt="Guest 1"
            className="w-4 h-4 rounded-full border border-white object-cover"
          />
          <img
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80"
            alt="Guest 2"
            className="w-4 h-4 rounded-full border border-white object-cover"
          />
          <img
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80"
            alt="Guest 3"
            className="w-4 h-4 rounded-full border border-white object-cover"
          />
        </div>
      </motion.div>
    </div>
  );
};

export default AuthVisualSide;
