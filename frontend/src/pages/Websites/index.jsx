import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { FaPlus, FaGlobe, FaCopy, FaExternalLinkAlt, FaEdit, FaTrashAlt, FaStar, FaRegStar, FaTags, FaFilter } from 'react-icons/fa';
import { useToast } from '../../context/ToastContext';
import categoryService from '../../services/categoryService';
import websiteService from '../../services/websiteService';
import { Favicon } from '../Categories/CategoryDetail';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import DataTable from '../../components/tables/DataTable';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import WebsiteForm from '../../components/forms/WebsiteForm';

const Websites = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { success, error } = useToast();

  // Route check: is this the dedicated favorites tab?
  const isFavoritesRoute = location.pathname === '/favorites';

  // Data states
  const [websites, setWebsites] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // Pagination, sorting and filtering states
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  
  // Search input state, pre-filled from global header query if present
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [favoriteOnly, setFavoriteOnly] = useState('all'); // all, favorites
  
  // Sort states
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modal form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWebsite, setEditingWebsite] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Deletion modal states
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingWebsite, setDeletingWebsite] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // 1. Fetch categories for dropdown filters and Website forms
  const fetchCategories = useCallback(async () => {
    try {
      const res = await categoryService.getCategories();
      setCategories(res.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  // 2. Fetch websites using current search/filter/sort parameters
  const fetchWebsites = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsError(false);

      const params = {
        page,
        limit,
        sort: sortField,
        order: sortOrder,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (selectedCategory) {
        params.category = selectedCategory;
      }

      // If we are on the Favorites route, force favorite query.
      // Otherwise, check the favorite filter state.
      if (isFavoritesRoute || favoriteOnly === 'favorites') {
        params.favorite = 'true';
      }

      const res = await websiteService.getWebsites(params);
      setWebsites(res.data || []);
      setTotal(res.total || 0);
      setPages(res.pages || 0);
    } catch (err) {
      console.error('Error fetching websites:', err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, selectedCategory, favoriteOnly, sortField, sortOrder, isFavoritesRoute]);

  // Sync state on mount and update
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Sync search input with URL search parameters from global search bar
  useEffect(() => {
    const searchVal = searchParams.get('search') || '';
    setSearch(searchVal);
    setPage(1); // Reset to page 1 on new search
  }, [searchParams]);

  useEffect(() => {
    fetchWebsites();
  }, [fetchWebsites]);

  // Handle Search Input Change
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  // Handle Category Filter Change
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setPage(1);
  };

  // Handle Favorite Filter Change
  const handleFavoriteChange = (value) => {
    setFavoriteOnly(value);
    setPage(1);
  };

  // Handle Sorting header click
  const handleSort = (field, order) => {
    setSortField(field);
    setSortOrder(order);
    setPage(1);
  };

  // Copy Link
  const handleCopyLink = (url, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    success('URL copied to clipboard!');
  };

  // Toggle favorite patch
  const handleToggleFavorite = async (website, e) => {
    e.stopPropagation();
    try {
      const res = await websiteService.toggleFavorite(website._id);
      if (res.success) {
        success(res.message);
        
        // If we are on the favorites route, toggle removes the item from view
        if (isFavoritesRoute) {
          setWebsites(websites.filter((w) => w._id !== website._id));
          setTotal((prev) => prev - 1);
        } else {
          // Normal list: just toggle stars inline
          setWebsites(
            websites.map((w) =>
              w._id === website._id ? { ...w, favorite: !w.favorite } : w
            )
          );
        }
      }
    } catch (err) {
      error('Failed to update favorite status');
    }
  };

  // Edit Click
  const handleEditClick = (website, e) => {
    e.stopPropagation();
    setEditingWebsite(website);
    setIsFormOpen(true);
  };

  // Delete Click
  const handleDeleteClick = (website, e) => {
    e.stopPropagation();
    setDeletingWebsite(website);
    setIsDeleteOpen(true);
  };

  // Submit Create/Edit
  const handleFormSubmit = async (formData) => {
    setFormSubmitting(true);
    try {
      if (editingWebsite) {
        const res = await websiteService.updateWebsite(editingWebsite._id, formData);
        if (res.success) {
          success('Website bookmark updated successfully!');
          setIsFormOpen(false);
          setEditingWebsite(null);
          fetchWebsites();
        }
      } else {
        const res = await websiteService.createWebsite(formData);
        if (res.success) {
          success('Website bookmarked successfully!');
          setIsFormOpen(false);
          fetchWebsites();
        }
      }
    } catch (err) {
      error(err.response?.data?.message || 'Operation failed');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Confirm Deletion
  const handleConfirmDelete = async () => {
    if (!deletingWebsite) return;
    setDeleteSubmitting(true);
    try {
      const res = await websiteService.deleteWebsite(deletingWebsite._id);
      if (res.success) {
        success('Website deleted successfully!');
        setIsDeleteOpen(false);
        setDeletingWebsite(null);
        fetchWebsites();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to delete bookmark');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'favorite',
      label: '',
      className: 'w-10 text-center pr-0',
      render: (row) => (
        <button
          onClick={(e) => handleToggleFavorite(row, e)}
          className="text-amber-400 hover:scale-110 transition-transform p-1"
          aria-label={row.favorite ? 'Remove favorite' : 'Add favorite'}
        >
          {row.favorite ? <FaStar size={16} /> : <FaRegStar className="text-gray-300 hover:text-amber-400" size={16} />}
        </button>
      ),
    },
    {
      key: 'name',
      label: 'Website',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <Favicon url={row.url} name={row.name} />
          <span className="font-bold text-heading text-xs md:text-sm">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'url',
      label: 'URL',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2 max-w-xs md:max-w-md">
          <span className="text-secondary-text truncate text-xs font-medium select-all">
            {row.url}
          </span>
          <button
            onClick={(e) => handleCopyLink(row.url, e)}
            className="p-1 hover:bg-gray-100 rounded text-secondary-text hover:text-heading transition-colors"
            title="Copy URL"
          >
            <FaCopy size={11} />
          </button>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: row.category?.color || '#6B7280' }}
          />
          <span className="text-xs font-bold text-heading">
            {row.category?.name || 'Uncategorized'}
          </span>
        </div>
      ),
    },
    {
      key: 'tags',
      label: 'Tags',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.tags && row.tags.length > 0 ? (
            row.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 text-secondary-text border border-border/25"
              >
                {tag}
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-300 font-medium">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (row) => (
        <span className="text-secondary-text text-xs">
          {new Date(row.createdAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'w-24 text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <a
            href={row.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-secondary-text hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
            title="Open in new tab"
          >
            <FaExternalLinkAlt size={12} />
          </a>
          <button
            onClick={(e) => handleEditClick(row, e)}
            className="p-1.5 text-secondary-text hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
            title="Edit bookmark"
          >
            <FaEdit size={12} />
          </button>
          <button
            onClick={(e) => handleDeleteClick(row, e)}
            className="p-1.5 text-secondary-text hover:text-danger hover:bg-red-50 rounded-lg transition-colors"
            title="Delete bookmark"
          >
            <FaTrashAlt size={12} />
          </button>
        </div>
      ),
    },
  ];

  // Mobile viewport card rendering
  const mobileRender = (row) => (
    <div className="bg-card border border-border/30 rounded-xl p-4 shadow-sm flex flex-col space-y-3">
      {/* Title, Category & Star */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Favicon url={row.url} name={row.name} />
          <div className="min-w-0">
            <h4 className="text-xs font-extrabold text-heading truncate">{row.name}</h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className="w-1.5 h-1.5 rounded-full inline-block"
                style={{ backgroundColor: row.category?.color || '#6B7280' }}
              />
              <span className="text-[9px] font-bold text-secondary-text">
                {row.category?.name || 'Uncategorized'}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={(e) => handleToggleFavorite(row, e)}
          className="text-amber-400 p-1"
          aria-label={row.favorite ? 'Remove favorite' : 'Add favorite'}
        >
          {row.favorite ? <FaStar size={16} /> : <FaRegStar className="text-gray-300" size={16} />}
        </button>
      </div>

      {/* URL */}
      <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg text-[11px] min-w-0">
        <span className="text-secondary-text truncate select-all flex-1 pr-2">{row.url}</span>
        <button
          onClick={(e) => handleCopyLink(row.url, e)}
          className="text-secondary-text hover:text-heading p-1 transition-colors"
        >
          <FaCopy size={11} />
        </button>
      </div>

      {/* Tags */}
      {row.tags && row.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 items-center">
          <FaTags className="text-[10px] text-gray-400" />
          {row.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-gray-100 text-secondary-text"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border/20 mt-1">
        <span className="text-[10px] text-gray-400 font-semibold">
          Created {new Date(row.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </span>
        <div className="flex items-center gap-2">
          <a
            href={row.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center gap-1"
          >
            Open
            <FaExternalLinkAlt size={10} />
          </a>
          <button
            onClick={(e) => handleEditClick(row, e)}
            className="p-1.5 text-secondary-text hover:text-primary hover:bg-gray-100 rounded-lg"
          >
            <FaEdit size={14} />
          </button>
          <button
            onClick={(e) => handleDeleteClick(row, e)}
            className="p-1.5 text-secondary-text hover:text-danger hover:bg-red-50 rounded-lg"
          >
            <FaTrashAlt size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  if (isError) {
    return <ErrorState message="Could not fetch websites list. Try again." onRetry={fetchWebsites} />;
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Title & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg md:text-xl font-black text-heading">
            {isFavoritesRoute ? 'Favorites' : 'Websites'}
          </h1>
          <p className="text-xs text-secondary-text mt-0.5">
            {isFavoritesRoute
              ? 'View all your starred and critical links'
              : 'View, filter and search your entire personal bookmark library'}
          </p>
        </div>
        <button
          onClick={() => {
            setEditingWebsite(null);
            setIsFormOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs md:text-sm shadow-md shadow-primary/20 transition-all duration-200"
        >
          <FaPlus size={10} />
          Add Website
        </button>
      </div>

      {/* 2. Advanced Filtering Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-white border border-border/40 p-4 rounded-xl shadow-sm">
        {/* Search Input */}
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary-text">
            <FaGlobe size={14} />
          </span>
          <input
            type="text"
            placeholder="Search websites, URLs, tags, description..."
            value={search}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-inputbg border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          />
        </div>

        {/* Category Selector */}
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary-text">
            <FaFilter size={12} />
          </span>
          <select
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-inputbg border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors cursor-pointer appearance-none"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Favorite Selector (only visible on main Websites route) */}
        {!isFavoritesRoute && (
          <div className="flex items-center gap-1.5 border border-border rounded-xl p-0.5 bg-gray-50 self-start sm:self-auto max-w-xs sm:max-w-none w-full sm:w-auto">
            <button
              onClick={() => handleFavoriteChange('all')}
              className={`
                flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200
                ${favoriteOnly === 'all' ? 'bg-white text-heading shadow-sm' : 'text-secondary-text hover:text-heading'}
              `}
            >
              All Bookmarks
            </button>
            <button
              onClick={() => handleFavoriteChange('favorites')}
              className={`
                flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5
                ${favoriteOnly === 'favorites' ? 'bg-white text-amber-500 shadow-sm' : 'text-secondary-text hover:text-heading'}
              `}
            >
              <FaStar size={11} />
              Favorites
            </button>
          </div>
        )}
      </div>

      {/* 3. Reusable DataTable */}
      <DataTable
        columns={columns}
        data={websites}
        isLoading={isLoading}
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={handleSort}
        pagination={{
          page,
          pages,
          total,
          limit,
          onPageChange: (p) => setPage(p),
        }}
        mobileRender={mobileRender}
        emptyState={
          <EmptyState
            title={
              isFavoritesRoute
                ? 'No favorite bookmarks'
                : search || selectedCategory || favoriteOnly === 'favorites'
                ? 'No matches found'
                : 'No websites saved'
            }
            description={
              isFavoritesRoute
                ? 'Star your favorite websites for instant, prioritized access.'
                : search || selectedCategory || favoriteOnly === 'favorites'
                ? 'Try adjusting your search criteria or resetting filters.'
                : 'Build your personal collection by creating your first website bookmark.'
            }
            actionText={
              search || selectedCategory || (!isFavoritesRoute && favoriteOnly === 'favorites')
                ? 'Reset Filters'
                : 'Add Website'
            }
            onActionClick={
              search || selectedCategory || (!isFavoritesRoute && favoriteOnly === 'favorites')
                ? () => {
                    setSearch('');
                    setSelectedCategory('');
                    setFavoriteOnly('all');
                  }
                : () => {
                    setEditingWebsite(null);
                    setIsFormOpen(true);
                  }
            }
          />
        }
      />

      {/* Website Modal Form */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingWebsite(null);
        }}
        title={editingWebsite ? 'Update Website' : 'Add Website'}
        size="lg"
      >
        {categories.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-secondary-text mb-4">
              Please create at least one category before adding a website bookmark.
            </p>
          </div>
        ) : (
          <WebsiteForm
            categories={categories}
            onSubmit={handleFormSubmit}
            initialData={editingWebsite}
            isLoading={formSubmitting}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingWebsite(null);
            }}
          />
        )}
      </Modal>

      {/* Website Deletion Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setDeletingWebsite(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Website Bookmark?"
        message={`Are you sure you want to delete the bookmark for "${deletingWebsite?.name}"?`}
        isLoading={deleteSubmitting}
      />
    </div>
  );
};

export default Websites;
