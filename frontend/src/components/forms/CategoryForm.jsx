import React, { useState, useEffect } from 'react';
import {
  FaCode,
  FaBrain,
  FaCloud,
  FaGraduationCap,
  FaBuilding,
  FaShareAlt,
  FaWallet,
  FaBriefcase,
  FaEllipsisH,
  FaGlobe,
  FaBookmark,
  FaHeart,
  FaFolder,
} from 'react-icons/fa';
import Input from '../common/Input';
import Button from '../common/Button';

// Icon library mapping for selecting category icon
const ICON_OPTIONS = [
  { name: 'FaFolder', component: FaFolder },
  { name: 'FaCode', component: FaCode },
  { name: 'FaBrain', component: FaBrain },
  { name: 'FaCloud', component: FaCloud },
  { name: 'FaGraduationCap', component: FaGraduationCap },
  { name: 'FaBuilding', component: FaBuilding },
  { name: 'FaShareAlt', component: FaShareAlt },
  { name: 'FaWallet', component: FaWallet },
  { name: 'FaBriefcase', component: FaBriefcase },
  { name: 'FaGlobe', component: FaGlobe },
  { name: 'FaBookmark', component: FaBookmark },
  { name: 'FaHeart', component: FaHeart },
  { name: 'FaEllipsisH', component: FaEllipsisH },
];

// Predefined premium color palette
const COLOR_OPTIONS = [
  '#4F46E5', // Indigo
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#10B981', // Emerald/Green
  '#F59E0B', // Amber/Yellow
  '#EC4899', // Pink
  '#F43F5E', // Rose/Red
  '#6B7280', // Gray
];

const CategoryForm = ({
  onSubmit,
  initialData = null,
  isLoading = false,
  onCancel,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('FaFolder');
  const [selectedColor, setSelectedColor] = useState('#4F46E5');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setSelectedIcon(initialData.icon || 'FaFolder');
      setSelectedColor(initialData.color || '#4F46E5');
    }
  }, [initialData]);

  const validate = () => {
    const errs = {};
    if (!name.trim()) {
      errs.name = 'Category name is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      name: name.trim(),
      description: description.trim(),
      icon: selectedIcon,
      color: selectedColor,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="Category Name"
        id="cat-name"
        type="text"
        placeholder="e.g. Development, AI Tools"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        required
        disabled={isLoading}
      />

      <div className="flex flex-col mb-4">
        <label htmlFor="cat-desc" className="text-xs font-semibold text-heading mb-1.5">
          Description
        </label>
        <textarea
          id="cat-desc"
          rows={2}
          placeholder="Optional category description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isLoading}
          className="w-full px-3 py-2 text-sm bg-inputbg border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors duration-200"
        />
      </div>

      {/* Select Color */}
      <div className="flex flex-col mb-4">
        <label className="text-xs font-semibold text-heading mb-2">
          Accent Color
        </label>
        <div className="flex flex-wrap gap-2.5">
          {COLOR_OPTIONS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setSelectedColor(color)}
              className={`
                w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110
                ${selectedColor === color ? 'border-heading shadow-md scale-105' : 'border-transparent'}
              `}
              style={{ backgroundColor: color }}
              aria-label={`Select color ${color}`}
              disabled={isLoading}
            />
          ))}
        </div>
      </div>

      {/* Select Icon */}
      <div className="flex flex-col mb-4">
        <label className="text-xs font-semibold text-heading mb-2">
          Category Icon
        </label>
        <div className="grid grid-cols-5 gap-2.5 sm:grid-cols-7 max-w-md">
          {ICON_OPTIONS.map((iconOpt) => {
            const Icon = iconOpt.component;
            const isSelected = selectedIcon === iconOpt.name;
            return (
              <button
                key={iconOpt.name}
                type="button"
                onClick={() => setSelectedIcon(iconOpt.name)}
                className={`
                  p-2.5 rounded-lg border flex items-center justify-center transition-all duration-200 hover:bg-gray-50
                  ${
                    isSelected
                      ? 'border-primary bg-primary/5 text-primary shadow-sm scale-105 font-bold'
                      : 'border-border text-secondary-text'
                  }
                `}
                aria-label={`Select icon ${iconOpt.name}`}
                disabled={isLoading}
              >
                <Icon size={16} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-3 border-t border-border/30">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button type="submit" isLoading={isLoading} disabled={isLoading}>
          {initialData ? 'Update Category' : 'Save Category'}
        </Button>
      </div>
    </form>
  );
};

export default CategoryForm;
export { ICON_OPTIONS };
