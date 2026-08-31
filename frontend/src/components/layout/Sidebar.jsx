import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaChartPie, FaGlobe, FaFolder, FaStar, FaSignOutAlt, FaTimes } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { logout, user } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: FaChartPie },
    { name: 'Websites', path: '/websites', icon: FaGlobe },
    { name: 'Categories', path: '/categories', icon: FaFolder },
    { name: 'Favorites', path: '/favorites', icon: FaStar },
  ];

  const activeStyle = 'bg-primary text-white shadow-md shadow-primary/20';
  const inactiveStyle = 'text-secondary-text hover:text-heading hover:bg-gray-100';

  const sidebarContent = (
    <div className="flex flex-col h-full bg-card border-r border-border/40 py-6 px-4">
      {/* Brand Logo Header */}
      <div className="flex items-center justify-between mb-8 px-2">
        <div>
          <h1 className="text-xl font-extrabold text-primary tracking-tight flex items-center gap-2">
            <span className="bg-primary text-white p-1.5 rounded-lg text-sm font-bold shadow-md shadow-primary/30">WV</span>
            WebVault
          </h1>
          <p className="text-[10px] font-semibold text-secondary-text mt-0.5 tracking-wide uppercase">
            Personal Website Manager
          </p>
        </div>
        {/* Mobile close button inside drawer */}
        <button
          onClick={onClose}
          className="md:hidden p-1.5 text-secondary-text hover:text-heading hover:bg-gray-100 rounded-md transition-colors"
          aria-label="Close menu"
        >
          <FaTimes size={16} />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                isActive ? activeStyle : inactiveStyle
              }`
            }
          >
            <item.icon className="text-lg" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom Pinned Admin Info & Logout */}
      <div className="border-t border-border/40 pt-4 mt-auto">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-9 h-9 flex items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm uppercase shadow-sm">
            {user?.username?.substring(0, 2) || 'AD'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-heading truncate">{user?.username || 'Administrator'}</p>
            <p className="text-[10px] text-secondary-text truncate">Admin Session</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-danger hover:bg-red-50 rounded-xl transition-all duration-200"
        >
          <FaSignOutAlt className="text-lg" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Fixed Sidebar */}
      <aside className="hidden md:block fixed top-0 bottom-0 left-0 w-64 z-20">
        {sidebarContent}
      </aside>

      {/* 2. Mobile Drawer Sidebar Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300"
          onClick={onClose}
        >
          <aside
            className="fixed top-0 bottom-0 left-0 w-72 z-40 transform transition-transform duration-300 translate-x-0"
            onClick={(e) => e.stopPropagation()} // Stop bubbling closures
          >
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
