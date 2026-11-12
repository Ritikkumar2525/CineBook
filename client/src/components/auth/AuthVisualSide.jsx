import React from 'react';
import { motion } from 'framer-motion';

export const AuthVisualSide = () => {
  return (
    <div className="relative rounded-[28px] sm:rounded-[32px] overflow-hidden min-h-[560px] h-full shadow-inner bg-[#252824] m-2.5 sm:m-3 select-none">
      {/* Background Hero Image */}
      <img
        src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=85"
        alt="Team collaboration"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />

      {/* Subtle Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

      {/* 1. Top Yellow Task Review Widget */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="absolute top-8 left-8 z-10 space-y-1.5"
      >
        <div className="bg-[#ffd25d] text-[#1f2937] rounded-xl px-4 py-2.5 shadow-lg max-w-[210px]">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold tracking-tight">Task Review With Team</h4>
            <span className="w-1.5 h-1.5 rounded-full bg-[#1f2937]" />
          </div>
          <p className="text-[10px] text-[#4b5563] mt-0.5 font-medium">09:30am–10:00am</p>
        </div>

        {/* Small Dark Time Pill Below */}
        <div className="bg-black/85 text-white text-[10px] px-3 py-1 rounded-md shadow-md inline-block font-mono">
          09:30am–10:00am
        </div>
      </motion.div>

      {/* 2. Floating Avatar Bubbles on Right Side */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="absolute right-10 top-36 z-10 flex flex-col items-center -space-y-2"
      >
        <img
          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
          alt="Avatar 1"
          className="w-10 h-10 rounded-full border-2 border-white shadow-lg object-cover"
        />
        <img
          src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80"
          alt="Avatar 2"
          className="w-9 h-9 rounded-full border-2 border-white shadow-lg object-cover ml-5"
        />
        <img
          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
          alt="Avatar 3"
          className="w-8 h-8 rounded-full border-2 border-white shadow-lg object-cover -ml-3"
        />
      </motion.div>

      {/* 3. Translucent Glass Calendar Strip */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.5 }}
        className="absolute bottom-32 left-8 right-8 z-10 bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl p-3.5 text-white shadow-xl flex items-center justify-between"
      >
        <div className="grid grid-cols-7 gap-3 text-center flex-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
            <div key={day} className="flex flex-col items-center">
              <span className="text-[10px] uppercase font-medium opacity-75">{day}</span>
              <span
                className={`text-xs font-bold mt-1 ${
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
          className="w-16 h-10 rounded-lg ml-3 border border-white/20 opacity-60 hidden sm:block"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, rgba(255,255,255,0.2) 0, rgba(255,255,255,0.2) 2px, transparent 0, transparent 6px)',
          }}
        />
      </motion.div>

      {/* 4. Bottom White Daily Meeting Widget */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.5 }}
        className="absolute bottom-6 left-8 z-10 bg-white rounded-2xl p-3.5 shadow-2xl max-w-[210px] text-[#1f2937]"
      >
        <div className="flex items-center justify-between mb-1">
          <h5 className="text-xs font-bold tracking-tight">Daily Meeting</h5>
          <span className="w-2 h-2 rounded-full bg-[#ffd25d]" />
        </div>
        <p className="text-[10px] text-[#6b7280] mb-2 font-medium">12:00pm–01:00pm</p>

        {/* Mini Attendees Avatars */}
        <div className="flex items-center -space-x-1.5">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"
            alt="User 1"
            className="w-5 h-5 rounded-full border border-white object-cover"
          />
          <img
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80"
            alt="User 2"
            className="w-5 h-5 rounded-full border border-white object-cover"
          />
          <img
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80"
            alt="User 3"
            className="w-5 h-5 rounded-full border border-white object-cover"
          />
          <img
            src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80"
            alt="User 4"
            className="w-5 h-5 rounded-full border border-white object-cover"
          />
        </div>
      </motion.div>
    </div>
  );
};

export default AuthVisualSide;
