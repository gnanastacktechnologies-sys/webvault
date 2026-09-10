import React, { useState, useEffect } from 'react';
import { FaTimes, FaTags, FaUsers, FaLock } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
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
  const { user: currentUser, isAdmin } = useAuth();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [notes, setNotes] = useState('');
  const [favorite, setFavorite] = useState(false);
  const [allowedAll, setAllowedAll] = useState(false);
  const [allowedUsers, setAllowedUsers] = useState([]);
  const [userList, setUserList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isAdmin) {
      setLoadingUsers(true);
      authService
        .getUsers()
        .then((res) => {
          if (res.success && res.data) {
            setUserList(res.data);
          }
        })
        .catch((err) => console.warn('Could not load user list:', err.message))
        .finally(() => setLoadingUsers(false));
    }
  }, [isAdmin]);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setUrl(initialData.url || '');
      setCategory(initialData.category?._id || initialData.category || '');
      setDescription(initialData.description || '');
      setTags(initialData.tags || []);
      setNotes(initialData.notes || '');
      setFavorite(!!initialData.favorite);
      setAllowedAll(!!initialData.allowedAll);
      const userIds = (initialData.allowedUsers || []).map((u) =>
        typeof u === 'object' ? u._id : u
      );
      setAllowedUsers(userIds);
    } else {
      setName('');
      setUrl('');
      setCategory('');
      setDescription('');
      setTags([]);
      setNotes('');
      setFavorite(false);
      setAllowedAll(false);
      setAllowedUsers([]);
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
      allowedAll,
      allowedUsers,
    });
  };

  const toggleUserSelection = (userId) => {
    if (allowedUsers.includes(userId)) {
      setAllowedUsers(allowedUsers.filter((id) => id !== userId));
    } else {
      setAllowedUsers([...allowedUsers, userId]);
    }
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
          rows={2}
          placeholder="Optional personal notes, tips or credentials"
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

      {/* User Access Controls for Admin */}
      {isAdmin && (
        <div className="p-3.5 bg-mainbg border border-border/60 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold text-heading flex items-center gap-1.5">
              <FaLock className="text-primary" size={12} />
              User Access Control Permissions:
            </label>
          </div>

          <label className="flex items-center gap-2 text-xs font-bold text-heading cursor-pointer select-none">
            <input
              type="checkbox"
              checked={allowedAll}
              onChange={(e) => setAllowedAll(e.target.checked)}
              disabled={isLoading}
              className="h-4 w-4 text-primary focus:ring-primary border-border rounded cursor-pointer"
            />
            <span>Allow All Users Access (Global Bookmark)</span>
          </label>

          {!allowedAll && (
            <div className="space-y-2 pt-1">
              <p className="text-[11px] font-bold text-secondary-text">
                Select Users Granted Access ({allowedUsers.length} selected):
              </p>
              {loadingUsers ? (
                <p className="text-xs text-secondary-text italic">Loading user list...</p>
              ) : userList.length === 0 ? (
                <p className="text-xs text-secondary-text">No sub-users registered yet.</p>
              ) : (
                <div className="max-h-36 overflow-y-auto space-y-1 p-2 bg-white border border-border/40 rounded-lg">
                  {userList
                    .filter((u) => u.role !== 'admin' && !u.isSuperAdmin)
                    .map((u) => {
                      const isChecked = allowedUsers.includes(u._id);
                      return (
                        <label
                          key={u._id}
                          className="flex items-center justify-between p-1.5 rounded text-xs cursor-pointer hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleUserSelection(u._id)}
                              disabled={isLoading}
                              className="h-3.5 w-3.5 text-primary focus:ring-primary border-border rounded cursor-pointer"
                            />
                            <span className="font-semibold text-heading">{u.username}</span>
                          </div>
                          <span className="text-[10px] text-secondary-text font-mono">{u.email}</span>
                        </label>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

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
