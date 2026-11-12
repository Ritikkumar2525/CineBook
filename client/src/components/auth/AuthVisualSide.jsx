import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const AuthVisualSide = () => {
  // Generate 21 consecutive days centered around Nov 22–28
  const daysList = [
    { id: 'nov-18', dayName: 'WED', dayNum: 18, month: 'Nov', fullDate: 'Wed, Nov 18' },
    { id: 'nov-19', dayName: 'THU', dayNum: 19, month: 'Nov', fullDate: 'Thu, Nov 19' },
    { id: 'nov-20', dayName: 'FRI', dayNum: 20, month: 'Nov', fullDate: 'Fri, Nov 20' },
    { id: 'nov-21', dayName: 'SAT', dayNum: 21, month: 'Nov', fullDate: 'Sat, Nov 21' },
    { id: 'nov-22', dayName: 'SUN', dayNum: 22, month: 'Nov', fullDate: 'Sun, Nov 22' },
    { id: 'nov-23', dayName: 'MON', dayNum: 23, month: 'Nov', fullDate: 'Mon, Nov 23' },
    { id: 'nov-24', dayName: 'TUE', dayNum: 24, month: 'Nov', fullDate: 'Tue, Nov 24' },
    { id: 'nov-25', dayName: 'WED', dayNum: 25, month: 'Nov', fullDate: 'Wed, Nov 25' },
    { id: 'nov-26', dayName: 'THU', dayNum: 26, month: 'Nov', fullDate: 'Thu, Nov 26' },
    { id: 'nov-27', dayName: 'FRI', dayNum: 27, month: 'Nov', fullDate: 'Fri, Nov 27' },
    { id: 'nov-28', dayName: 'SAT', dayNum: 28, month: 'Nov', fullDate: 'Sat, Nov 28' },
    { id: 'nov-29', dayName: 'SUN', dayNum: 29, month: 'Nov', fullDate: 'Sun, Nov 29' },
    { id: 'nov-30', dayName: 'MON', dayNum: 30, month: 'Nov', fullDate: 'Mon, Nov 30' },
    { id: 'dec-01', dayName: 'TUE', dayNum: 1, month: 'Dec', fullDate: 'Tue, Dec 1' },
    { id: 'dec-02', dayName: 'WED', dayNum: 2, month: 'Dec', fullDate: 'Wed, Dec 2' },
    { id: 'dec-03', dayName: 'THU', dayNum: 3, month: 'Dec', fullDate: 'Thu, Dec 3' },
    { id: 'dec-04', dayName: 'FRI', dayNum: 4, month: 'Dec', fullDate: 'Fri, Dec 4' },
    { id: 'dec-05', dayName: 'SAT', dayNum: 5, month: 'Dec', fullDate: 'Sat, Dec 5' },
  ];

  // Default selected date: 25 (WED 25) matching the reference screenshot!
  const [selectedDayId, setSelectedDayId] = useState('nov-25');
  const scrollRef = useRef(null);

  // Mouse drag-to-scroll state
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeftPos = useRef(0);

  // Center the default active date (25) into view on mount
  useEffect(() => {
    if (scrollRef.current) {
      const activeEl = scrollRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, []);

  const handleMouseDown = (e) => {
    if (!scrollRef.current) return;
    isDown.current = true;
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeftPos.current = scrollRef.current.scrollLeft;
  };

  const handleMouseLeave = () => {
    isDown.current = false;
  };

  const handleMouseUp = () => {
    isDown.current = false;
  };

  const handleMouseMove = (e) => {
    if (!isDown.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.6;
    scrollRef.current.scrollLeft = scrollLeftPos.current - walk;
  };

  // Convert mouse wheel to horizontal scroll smoothly
  const handleWheel = (e) => {
    if (scrollRef.current && e.deltaY !== 0) {
      e.preventDefault();
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  const scrollByAmount = (amount) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const activeDayObj = daysList.find((d) => d.id === selectedDayId) || daysList[7];

  return (
    <div className="relative rounded-[26px] sm:rounded-[30px] overflow-hidden h-full min-h-[460px] lg:min-h-[530px] shadow-inner bg-[#141416] m-2 sm:m-2.5 select-none">
      {/* Background Hero Image - Cinematic Theatre Auditorium */}
      <img
        src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=85"
        alt="Cinema auditorium and premiere screen"
        className="absolute inset-0 w-full h-full object-cover object-center scale-105"
      />

      {/* Atmospheric Dark Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/30 pointer-events-none" />
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/20 to-black/60 pointer-events-none" />

      {/* 1. Top Yellow Premiere Widget (Dynamic based on selected date!) */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="absolute top-6 left-6 z-10 space-y-1.5"
      >
        <div className="bg-[#ffd25d] text-[#1f2937] rounded-xl px-3.5 py-2 shadow-lg max-w-[210px] transition-all">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-bold tracking-tight">IMAX Laser Premiere</h4>
            <span className="w-1.5 h-1.5 rounded-full bg-[#1f2937]" />
          </div>
          <p className="text-[9px] text-[#4b5563] mt-0.5 font-medium">
            {activeDayObj.fullDate} · 09:30pm
          </p>
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

      {/* 3. Translucent Glass Horizontally Scrollable Calendar Strip */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="group/cal absolute bottom-24 left-5 right-5 z-20 bg-black/45 backdrop-blur-md border border-white/20 rounded-2xl p-2 sm:p-2.5 text-white shadow-xl flex items-center justify-between overflow-hidden"
      >
        {/* Subtle Scroll Left Button */}
        <button
          type="button"
          onClick={() => scrollByAmount(-110)}
          aria-label="Scroll left"
          className="shrink-0 w-6 h-6 rounded-full bg-white/10 hover:bg-white/25 active:scale-95 text-white/80 hover:text-white flex items-center justify-center transition-all mr-1.5 shadow-xs"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Scrollable Dates Strip Container */}
        <div
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onWheel={handleWheel}
          className="flex-1 flex items-center gap-3 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth cursor-grab active:cursor-grabbing py-0.5 px-1 select-none"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {daysList.map((day) => {
            const isSelected = day.id === selectedDayId;
            return (
              <button
                key={day.id}
                type="button"
                data-active={isSelected}
                onClick={() => setSelectedDayId(day.id)}
                className={`flex flex-col items-center justify-center min-w-[34px] sm:min-w-[38px] py-1 px-1 rounded-xl transition-all duration-200 group ${
                  isSelected
                    ? 'scale-105 bg-white/10 shadow-xs'
                    : 'hover:bg-white/5 opacity-80 hover:opacity-100'
                }`}
              >
                {/* Day of Week Label (SUN, MON, TUE...) */}
                <span
                  className={`text-[9px] uppercase tracking-wider transition-colors ${
                    isSelected ? 'text-white font-bold' : 'text-stone-300 font-medium'
                  }`}
                >
                  {day.dayName}
                </span>

                {/* Day Number (22, 23, 24, 25...) */}
                <span
                  className={`text-[12px] sm:text-[13px] mt-0.5 leading-none transition-all ${
                    isSelected
                      ? 'text-[#ffd25d] font-black drop-shadow-sm'
                      : 'text-white font-bold group-hover:text-amber-200'
                  }`}
                >
                  {day.dayNum}
                </span>

                {/* Micro Selected Indicator Dot */}
                {isSelected && (
                  <motion.span
                    layoutId="activeDot"
                    className="w-1 h-1 rounded-full bg-[#ffd25d] mt-1"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Subtle Scroll Right Button */}
        <button
          type="button"
          onClick={() => scrollByAmount(110)}
          aria-label="Scroll right"
          className="shrink-0 w-6 h-6 rounded-full bg-white/10 hover:bg-white/25 active:scale-95 text-white/80 hover:text-white flex items-center justify-center transition-all ml-1.5 shadow-xs"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Diagonal striped texture accent box matching reference screenshot */}
        <button
          type="button"
          onClick={() => scrollByAmount(140)}
          title="Scroll next days"
          className="w-11 sm:w-12 h-8 rounded-lg ml-2 border border-white/20 opacity-70 hover:opacity-100 transition-opacity shrink-0 hidden sm:block cursor-pointer"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, rgba(255,255,255,0.2) 0, rgba(255,255,255,0.2) 2px, transparent 0, transparent 5px)',
          }}
        />
      </motion.div>

      {/* 4. Bottom White Reservation Widget (Dynamic to selected date) */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.4 }}
        className="absolute bottom-4 left-6 z-10 bg-white/95 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 shadow-2xl max-w-[200px] text-[#1f2937]"
      >
        <div className="flex items-center justify-between mb-0.5">
          <h5 className="text-[11px] font-bold tracking-tight">VIP Prime Hall</h5>
          <span className="w-1.5 h-1.5 rounded-full bg-[#ffd25d]" />
        </div>
        <p className="text-[9px] text-[#6b7280] mb-1.5 font-medium">
          Seats D12, D13 · {activeDayObj.dayName} {activeDayObj.dayNum}
        </p>

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
