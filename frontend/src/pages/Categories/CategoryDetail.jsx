import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaArrowLeft,
  FaPlus,
  FaGlobe,
  FaCopy,
  FaExternalLinkAlt,
  FaEdit,
  FaTrashAlt,
  FaStar,
  FaRegStar,
  FaTags,
} from 'react-icons/fa';
import { useToast } from '../../context/ToastContext';
import categoryService from '../../services/categoryService';
import websiteService from '../../services/websiteService';
import { CategoryIcon } from './index';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorState from '../../components/common/ErrorState';
import DataTable from '../../components/tables/DataTable';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import WebsiteForm from '../../components/forms/WebsiteForm';

// Reusable Favicon Component with Error Fallback
export const Favicon = ({ url, name }) => {
  const [imgError, setImgError] = useState(false);

  let hostname = '';
  try {
    hostname = new URL(url).hostname;
  } catch (e) {
    // Leave blank
  }

  if (imgError || !hostname) {
    return <FaGlobe className="text-secondary-text flex-shrink-0" size={15} />;
  }

  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
      alt={name}
      onError={() => setImgError(true)}
      className="w-4 h-4 rounded-sm object-contain flex-shrink-0"
    />
  );
};

const CategoryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error, warning } = useToast();

  // Category and list states
  const [category, setCategory] = useState(null);
  const [websites, setWebsites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // Pagination, sorting and filter states
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [favoriteOnly, setFavoriteOnly] = useState('all'); // all, favorites

  // Modal form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWebsite, setEditingWebsite] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Deletion modal states
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingWebsite, setDeletingWebsite] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const fetchCategoryDetails = useCallback(async () => {
    try {
      const res = await categoryService.getCategory(id);
      setCategory(res.data);
    } catch (err) {
      console.error('Error fetching category info:', err);
      setIsError(true);
    }
  }, [id]);

  const fetchWebsites = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = {
        page,
        limit,
        category: id,
        sort: sortField,
        order: sortOrder,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (favoriteOnly === 'favorites') {
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
  }, [id, page, limit, search, sortField, sortOrder, favoriteOnly]);

  useEffect(() => {
    fetchCategoryDetails();
  }, [fetchCategoryDetails]);

  useEffect(() => {
    fetchWebsites();
  }, [fetchWebsites]);

  // Handle Search Input (reset to page 1)
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  // Toggle favorite filter
  const handleFavoriteFilterToggle = (value) => {
    setFavoriteOnly(value);
    setPage(1);
  };

  // Handle Sort Change
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

  // Favorite toggle patch
  const handleToggleFavorite = async (website, e) => {
    e.stopPropagation();
    try {
      const res = await websiteService.toggleFavorite(website._id);
      if (res.success) {
        success(res.message);
        // Live update websites state to avoid full API reload
        setWebsites(
          websites.map((w) =>
            w._id === website._id ? { ...w, favorite: !w.favorite } : w
          )
        );
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
        // Update
        const res = await websiteService.updateWebsite(editingWebsite._id, formData);
        if (res.success) {
          success('Website bookmark updated successfully!');
          setIsFormOpen(false);
          setEditingWebsite(null);
          fetchWebsites();
          fetchCategoryDetails(); // Update counts
        }
      } else {
        // Create
        const res = await websiteService.createWebsite(formData);
        if (res.success) {
          success('Website bookmarked successfully!');
          setIsFormOpen(false);
          fetchWebsites();
          fetchCategoryDetails();
        }
      }
    } catch (err) {
      error(err.response?.data?.message || 'Operation failed');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Confirm deletion
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
        fetchCategoryDetails();
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
          className="text-amber-400 hover:scale-110 transition-transform p-1 focus:outline-none"
          aria-label={row.favorite ? 'Remove from favorites' : 'Add to favorites'}
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
      key: 'tags',
      label: 'Tags',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.tags && row.tags.length > 0 ? (
            row.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 text-secondary-text border border-border/20"
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
            title="Open in New Tab"
          >
            <FaExternalLinkAlt size={12} />
          </a>
          <button
            onClick={(e) => handleEditClick(row, e)}
            className="p-1.5 text-secondary-text hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
            title="Edit website"
          >
            <FaEdit size={12} />
          </button>
          <button
            onClick={(e) => handleDeleteClick(row, e)}
            className="p-1.5 text-secondary-text hover:text-danger hover:bg-red-50 rounded-lg transition-colors"
            title="Delete website"
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
      {/* Title & Star */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Favicon url={row.url} name={row.name} />
          <h4 className="text-xs font-extrabold text-heading truncate">{row.name}</h4>
        </div>
        <button
          onClick={(e) => handleToggleFavorite(row, e)}
          className="text-amber-400 p-1"
          aria-label={row.favorite ? 'Remove favorite' : 'Add favorite'}
        >
          {row.favorite ? <FaStar size={16} /> : <FaRegStar className="text-gray-300" size={16} />}
        </button>
      </div>

      {/* URL & copy */}
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
    return (
      <ErrorState
        message="Could not load websites. Please check your category details."
        onRetry={() => {
          fetchCategoryDetails();
          fetchWebsites();
        }}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* 1. Header with back button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/30 pb-4">
        <div className="flex items-start gap-3.5 min-w-0">
          <button
            onClick={() => navigate('/categories')}
            className="p-2 border border-border bg-white text-secondary-text hover:text-heading hover:bg-gray-50 rounded-xl transition-all flex-shrink-0 mt-0.5"
            aria-label="Back to categories"
          >
            <FaArrowLeft size={13} />
          </button>
          
          {category && (
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: category.color || '#4F46E5' }}
                >
                  <CategoryIcon iconName={category.icon} size={13} />
                </div>
                <h1 className="text-base md:text-lg font-black text-heading truncate">
                  {category.name}
                </h1>
                <span className="bg-slate-100 text-slate-800 text-xs font-black px-2.5 py-0.5 rounded-lg flex-shrink-0">
                  {category.websiteCount} Bookmark{category.websiteCount === 1 ? '' : 's'}
                </span>
              </div>
              <p className="text-xs text-secondary-text mt-1.5 leading-relaxed max-w-xl">
                {category.description || 'Websites categorized under ' + category.name}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={() => {
            setEditingWebsite(null);
            setIsFormOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs md:text-sm shadow-md shadow-primary/20 transition-all duration-200 self-start sm:self-center"
        >
          <FaPlus size={10} />
          Add Website
        </button>
      </div>

      {/* 2. Controls and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-border/40 p-4 rounded-xl shadow-sm">
        {/* Search Input */}
        <div className="relative max-w-sm w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary-text">
            <FaGlobe size={14} />
          </span>
          <input
            type="text"
            placeholder="Search within this category..."
            value={search}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-inputbg border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          />
        </div>

        {/* Favorite Filter Toggle */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto border border-border rounded-xl p-0.5 bg-gray-50">
          <button
            onClick={() => handleFavoriteFilterToggle('all')}
            className={`
              px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200
              ${favoriteOnly === 'all' ? 'bg-white text-heading shadow-sm' : 'text-secondary-text hover:text-heading'}
            `}
          >
            All
          </button>
          <button
            onClick={() => handleFavoriteFilterToggle('favorites')}
            className={`
              px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5
              ${favoriteOnly === 'favorites' ? 'bg-white text-amber-500 shadow-sm' : 'text-secondary-text hover:text-heading'}
            `}
          >
            <FaStar size={11} />
            Favorites
          </button>
        </div>
      </div>

      {/* 3. Reusable DataTable rendering */}
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
            title={search ? 'No matches' : 'Category is empty'}
            description={
              search
                ? `No bookmarks match "${search}" in this category.`
                : `You haven't bookmarked any websites under "${category?.name}" yet.`
            }
            actionText={search ? 'Clear Search' : 'Add Website'}
            onActionClick={
              search
                ? () => setSearch('')
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
        {category && (
          <WebsiteForm
            categories={[category]} // Restrict / lock selection to current category
            onSubmit={handleFormSubmit}
            initialData={
              editingWebsite || {
                category: category._id, // Pre-fill category ID
              }
            }
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
        message={`Are you sure you want to remove the bookmark for "${deletingWebsite?.name}"?`}
        isLoading={deleteSubmitting}
      />
    </div>
  );
};

export default CategoryDetail;
