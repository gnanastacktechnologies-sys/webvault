import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-mainbg flex">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      {/* Main Page Area */}
      <div className="flex-grow flex flex-col md:pl-64 min-w-0 min-h-screen">
        <Header onMobileMenuOpen={() => setIsMobileMenuOpen(true)} />
        
        {/* Scrollable Content Container */}
        <main className="flex-1 p-4 md:p-6 w-full max-w-7xl mx-auto overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
