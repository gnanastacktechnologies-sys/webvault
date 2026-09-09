import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="h-screen w-screen overflow-hidden bg-mainbg flex">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      {/* Main Page Area */}
      <div className="grow flex flex-col md:pl-64 min-w-0 h-screen overflow-hidden">
        <Header onMobileMenuOpen={() => setIsMobileMenuOpen(true)} />
        
        {/* Scrollable Content Container */}
        <main className="flex-1 p-4 md:p-6 w-full max-w-7xl mx-auto overflow-y-auto overscroll-contain flex flex-col justify-between">
          <div>
            <Outlet />
          </div>
          <footer className="mt-8 pt-4 border-t border-border/40 text-center text-xs text-secondary-text font-medium">
            © 2026 Gnanastack Technologies. All rights reserved.
          </footer>
        </main>
      </div>
    </div>
  );
};

export default Layout;

