import React, { useState, useEffect } from 'react';
import { FaTimes, FaTags } from 'react-icons/fa';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

const WebsiteForm = ({
  categories = [],
  onSubmit,
  initialData = null,
  isLoading = false,
  onCancel,
}) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [notes, setNotes] = useState('');
  const [favorite, setFavorite] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setUrl(initialData.url || '');
      setCategory(
        initialData.category?._id || initialData.category || ''
      );
      setDescription(initialData.description || '');
      setTags(initialData.tags || []);
      setNotes(initialData.notes || '');
      setFavorite(!!initialData.favorite);
    }
  }, [initialData]);

  const validate = () => {
    const errs = {};
    if (!name.trim()) {
      errs.name = 'Website name is required';
    }
    if (!url.trim()) {
      errs.url = 'Website URL is required';
    } else {
      // Validate http/https format
      try {
        const parsedUrl = new URL(url.trim());
        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
          errs.url = 'URL must start with http:// or https://';
        }
      } catch (e) {
        errs.url = 'Please enter a valid URL (e.g., https://example.com)';
      }
    }
    if (!category) {
      errs.category = 'Please select a category';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      name: name.trim(),
      url: url.trim(),
      category,
      description: description.trim(),
      tags,
      notes: notes.trim(),
      favorite,
    });
  };

  // Add Tag
  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase().replace(/,/g, '');
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
  };

  // Remove Tag
  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const categoryOptions = categories.map((cat) => ({
    value: cat._id,
    label: cat.name,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Website Name"
          id="web-name"
          type="text"
          placeholder="e.g. GitHub"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          required
          disabled={isLoading}
        />

        <Input
          label="Website URL"
          id="web-url"
          type="text"
          placeholder="https://github.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          error={errors.url}
          required
          disabled={isLoading}
        />
      </div>

      <Select
        label="Category"
        id="web-category"
        options={categoryOptions}
        placeholder="Select Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        error={errors.category}
        required
        disabled={isLoading || categories.length === 0}
      />

      <div className="flex flex-col">
        <label htmlFor="web-desc" className="text-xs font-semibold text-heading mb-1.5">
          Description
        </label>
        <textarea
          id="web-desc"
          rows={2}
          placeholder="Optional description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isLoading}
          className="w-full px-3 py-2 text-sm bg-inputbg border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors duration-200"
        />
      </div>

      {/* Tokenized Tags Field */}
      <div className="flex flex-col">
        <label htmlFor="web-tags" className="text-xs font-semibold text-heading mb-1.5 flex items-center gap-1">
          <FaTags className="text-secondary-text" />
          Tags (press Enter or comma to add)
        </label>
        <div className="relative">
          <input
            type="text"
            id="web-tags"
            placeholder="Add tags..."
            value={tagInput}
            onKeyDown={handleAddTag}
            onChange={(e) => setTagInput(e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 text-sm bg-inputbg border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors duration-200"
          />
        </div>
        
        {/* Render tags badges */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-red-500 transition-colors p-0.5"
                  aria-label={`Remove tag ${tag}`}
                >
                  <FaTimes size={10} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col">
        <label htmlFor="web-notes" className="text-xs font-semibold text-heading mb-1.5">
          Notes
        </label>
        <textarea
          id="web-notes"
          rows={3}
          placeholder="Optional personal notes, tips or credentials (hashed)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isLoading}
          className="w-full px-3 py-2 text-sm bg-inputbg border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors duration-200"
        />
      </div>

      {/* Favorite Checkbox */}
      <div className="flex items-center gap-2 py-1">
        <input
          type="checkbox"
          id="web-favorite"
          checked={favorite}
          onChange={(e) => setFavorite(e.target.checked)}
          disabled={isLoading}
          className="h-4 w-4 text-primary focus:ring-primary border-border rounded cursor-pointer"
        />
        <label htmlFor="web-favorite" className="text-xs font-semibold text-heading cursor-pointer select-none">
          Add to Favorites
        </label>
      </div>

      {/* Submit Buttons */}
      <div className="flex justify-end gap-3 pt-3 border-t border-border/30">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button type="submit" isLoading={isLoading} disabled={isLoading}>
          {initialData ? 'Update Website' : 'Save Website'}
        </Button>
      </div>
    </form>
  );
};

export default WebsiteForm;
