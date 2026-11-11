import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#f7f6f2] text-[#252824]">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
