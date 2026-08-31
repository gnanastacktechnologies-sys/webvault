import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { FaBars, FaSearch, FaTimes, FaUserCircle } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const Header = ({ onMobileMenuOpen }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState('');

  // Sync search input with URL query param (especially on page changes / manual URL edits)
  useEffect(() => {
    const searchVal = searchParams.get('search') || '';
    setSearchTerm(searchVal);
  }, [searchParams]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    triggerSearch(searchTerm);
  };

  const triggerSearch = (value) => {
    const trimmed = value.trim();
    if (trimmed) {
      navigate(`/websites?search=${encodeURIComponent(trimmed)}`);
    } else {
      // Clear search parameter
      navigate('/websites');
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    // Clear URL param if on websites page
    if (location.pathname === '/websites') {
      navigate('/websites');
    }
  };

  // Compute page title dynamically based on location pathname
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'Dashboard';
    if (path.startsWith('/websites')) return 'Websites';
    if (path.startsWith('/categories')) return 'Categories';
    if (path.startsWith('/favorites')) return 'Favorites';
    return 'WebVault';
  };

  return (
    <header className="sticky top-0 right-0 z-10 flex items-center justify-between bg-card border-b border-border/40 h-16 px-4 md:px-6">
      {/* Mobile Hamburger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuOpen}
          className="md:hidden p-2 text-secondary-text hover:text-heading hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Open navigation menu"
        >
          <FaBars size={18} />
        </button>
        <h2 className="text-base md:text-lg font-bold text-heading hidden sm:block">
          {getPageTitle()}
        </h2>
      </div>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-lg mx-4 sm:mx-8">
        <form onSubmit={handleSearchSubmit} className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary-text">
            <FaSearch size={14} />
          </div>
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search websites, URLs, tags, categories..."
            className="w-full pl-9 pr-8 py-1.5 md:py-2 text-xs md:text-sm bg-inputbg border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors duration-200"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-text hover:text-heading transition-colors"
              aria-label="Clear search"
            >
              <FaTimes size={12} />
            </button>
          )}
        </form>
      </div>

      {/* Profile Indicator */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors cursor-default border border-transparent hover:border-border/30">
          <FaUserCircle size={20} className="text-primary" />
          <span className="text-xs font-bold text-heading hidden lg:inline max-w-[100px] truncate">
            {user?.username || 'Admin'}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
