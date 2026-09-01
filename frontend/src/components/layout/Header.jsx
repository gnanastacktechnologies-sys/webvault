import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { FaBars, FaSearch, FaTimes, FaUserCircle, FaChevronDown, FaUserCog, FaUserPlus, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import ProfileModal from '../profile/ProfileModal';

const Header = ({ onMobileMenuOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState('profile');

  const dropdownRef = useRef(null);

  // Sync search input with URL query param
  useEffect(() => {
    const searchVal = searchParams.get('search') || '';
    setSearchTerm(searchVal);
  }, [searchParams]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    triggerSearch(searchTerm);
  };

  const triggerSearch = (value) => {
    const trimmed = value.trim();
    if (trimmed) {
      navigate(`/websites?search=${encodeURIComponent(trimmed)}`);
    } else {
      navigate('/websites');
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    if (location.pathname === '/websites') {
      navigate('/websites');
    }
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'Dashboard';
    if (path.startsWith('/websites')) return 'Websites';
    if (path.startsWith('/categories')) return 'Categories';
    if (path.startsWith('/favorites')) return 'Favorites';
    return 'WebVault';
  };

  const openProfileModal = (tab = 'profile') => {
    setProfileModalTab(tab);
    setIsProfileModalOpen(true);
    setIsDropdownOpen(false);
  };

  const handleLogout = () => {
    setIsDropdownOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="sticky top-0 right-0 z-10 flex items-center justify-between bg-card border-b border-border/40 h-16 px-4 md:px-6">
        {/* Mobile Hamburger & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMobileMenuOpen}
            className="md:hidden p-2 text-secondary-text hover:text-heading hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
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

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-mainbg transition-colors cursor-pointer border border-transparent hover:border-border/40 focus:outline-none"
          >
            <FaUserCircle size={22} className="text-primary" />
            <span className="text-xs font-bold text-heading max-w-30 truncate">
              {user?.username || 'Gnanasekaran'}
            </span>
            <FaChevronDown size={10} className={`text-secondary-text transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu Popup */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-card border border-border/80 rounded-2xl shadow-xl py-2 z-50 animate-fadeIn">
              
              {/* User Header Summary */}
              <div className="px-4 py-2.5 border-b border-border/40 mb-1">
                <p className="text-xs font-extrabold text-heading truncate">{user?.username || 'Gnanasekaran'}</p>
                <p className="text-[10px] text-secondary-text truncate">{user?.email || 'gnanastacktechnologies@gmail.com'}</p>
              </div>

              {/* Menu Items */}
              <button
                onClick={() => openProfileModal('profile')}
                className="w-full px-4 py-2 text-left text-xs font-semibold text-heading hover:bg-primary/10 hover:text-primary flex items-center gap-2.5 transition-colors"
              >
                <FaUserCog size={14} className="text-primary" />
                Profile & Security
              </button>

              <button
                onClick={() => openProfileModal('adduser')}
                className="w-full px-4 py-2 text-left text-xs font-semibold text-heading hover:bg-primary/10 hover:text-primary flex items-center gap-2.5 transition-colors"
              >
                <FaUserPlus size={14} className="text-primary" />
                Add New User
              </button>

              <div className="my-1 border-t border-border/40" />

              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2.5 transition-colors"
              >
                <FaSignOutAlt size={14} />
                Sign Out
              </button>

            </div>
          )}
        </div>
      </header>

      {/* Admin Profile & User Management Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        initialTab={profileModalTab}
      />
    </>
  );
};

export default Header;
