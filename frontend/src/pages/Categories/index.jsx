import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Icons from 'react-icons/fa';
import { FaPlus, FaEdit, FaTrashAlt, FaFolderOpen, FaArrowRight } from 'react-icons/fa';
import { useToast } from '../../context/ToastContext';
import categoryService from '../../services/categoryService';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorState from '../../components/common/ErrorState';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import CategoryForm from '../../components/forms/CategoryForm';

// Utility component to render Fa Icon dynamically by name
export const CategoryIcon = ({ iconName, className = '', size = 16 }) => {
  const IconComponent = Icons[iconName] || Icons.FaFolder;
  return <IconComponent className={className} size={size} />;
};

const Categories = () => {
  const navigate = useNavigate();
  const { success, error, warning } = useToast();

  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // Form Modals states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Deletion Modal states
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setIsError(false);
      const res = await categoryService.getCategories();
      setCategories(res.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Handle Edit click
  const handleEditClick = (category, e) => {
    e.stopPropagation(); // Avoid navigating
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  // Handle Delete click
  const handleDeleteClick = (category, e) => {
    e.stopPropagation();

    // Prevent deletion if category contains websites (checked from count)
    if (category.websiteCount > 0) {
      warning(
        `This category contains ${category.websiteCount} website${
          category.websiteCount === 1 ? '' : 's'
        }. Please move or delete those websites before deleting this category.`
      );
      return;
    }

    setDeletingCategory(category);
    setIsDeleteOpen(true);
  };

  // Submit create or update
  const handleFormSubmit = async (formData) => {
    setFormSubmitting(true);
    try {
      if (editingCategory) {
        // Update
        const res = await categoryService.updateCategory(editingCategory._id, formData);
        if (res.success) {
          success('Category updated successfully!');
          setIsFormOpen(false);
          setEditingCategory(null);
          fetchCategories();
        }
      } else {
        // Create
        const res = await categoryService.createCategory(formData);
        if (res.success) {
          success('Category created successfully!');
          setIsFormOpen(false);
          fetchCategories();
        }
      }
    } catch (err) {
      error(err.response?.data?.message || 'Operation failed');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;
    setDeleteSubmitting(true);
    try {
      const res = await categoryService.deleteCategory(deletingCategory._id);
      if (res.success) {
        success('Category deleted successfully!');
        setIsDeleteOpen(false);
        setDeletingCategory(null);
        fetchCategories();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to delete category');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Retrieving categories..." />;
  }

  if (isError) {
    return <ErrorState message="Failed to load categories. Please retry." onRetry={fetchCategories} />;
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg md:text-xl font-black text-heading">Categories</h1>
          <p className="text-xs text-secondary-text mt-0.5">
            Organize website bookmarks into custom groups
          </p>
        </div>
        <button
          onClick={() => {
            setEditingCategory(null);
            setIsFormOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs md:text-sm shadow-md shadow-primary/20 transition-all duration-200"
        >
          <FaPlus size={10} />
          Add Category
        </button>
      </div>

      {/* Grid of Categories */}
      {categories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((cat) => (
            <div
              key={cat._id}
              onClick={() => navigate(`/categories/${cat._id}`)}
              className="bg-card border border-border/40 rounded-2xl shadow-sm hover:shadow-md hover:border-border/80 transition-all duration-200 cursor-pointer p-5 flex flex-col justify-between group"
            >
              <div>
                {/* Icon & Title */}
                <div className="flex items-center justify-between mb-3.5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                    style={{ backgroundColor: cat.color || '#4F46E5' }}
                  >
                    <CategoryIcon iconName={cat.icon} size={18} />
                  </div>
                  <span className="bg-slate-100 text-slate-800 text-xs font-black px-2.5 py-1 rounded-lg">
                    {cat.websiteCount} Website{cat.websiteCount === 1 ? '' : 's'}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-heading group-hover:text-primary transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-secondary-text mt-1.5 line-clamp-2 h-8 leading-relaxed">
                  {cat.description || 'No description provided.'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/30">
                <span className="text-[10px] text-gray-400 font-semibold">
                  Created {new Date(cat.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                </span>
                
                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleEditClick(cat, e)}
                    className="p-2 text-secondary-text hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                    title="Edit Category"
                  >
                    <FaEdit size={13} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(cat, e)}
                    className="p-2 text-secondary-text hover:text-danger hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Category"
                  >
                    <FaTrashAlt size={13} />
                  </button>
                  <span className="p-2 text-secondary-text group-hover:text-primary group-hover:translate-x-1 transition-all rounded-lg">
                    <FaArrowRight size={12} />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12">
          <EmptyState
            title="No categories yet"
            description="Start by creating your first category to group your websites (e.g., Development, AI Tools)."
            actionText="Add Category"
            onActionClick={() => {
              setEditingCategory(null);
              setIsFormOpen(true);
            }}
          />
        </div>
      )}

      {/* Category Create/Edit Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCategory(null);
        }}
        title={editingCategory ? 'Update Category' : 'Add Category'}
      >
        <CategoryForm
          onSubmit={handleFormSubmit}
          initialData={editingCategory}
          isLoading={formSubmitting}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingCategory(null);
          }}
        />
      </Modal>

      {/* Deletion Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setDeletingCategory(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Category?"
        message={`Are you sure you want to delete the category "${deletingCategory?.name}"? This action cannot be undone.`}
        isLoading={deleteSubmitting}
      />
    </div>
  );
};

export default Categories;
