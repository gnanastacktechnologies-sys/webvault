import React, { useState, useEffect, useCallback } from 'react';
import { FaUserShield, FaUserPlus, FaUsers, FaUserCheck, FaLock, FaGlobe, FaEye, FaEyeSlash, FaCopy, FaEdit, FaTrash, FaSearch, FaKey, FaShieldAlt } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import authService from '../../services/authService';
import websiteService from '../../services/websiteService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const UsersPage = () => {
  const { user: currentUser, isAdmin } = useAuth();
  const { success, error } = useToast();

  const [users, setUsers] = useState([]);
  const [websites, setWebsites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState({});

  // Add User Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');
  const [newSelectedWebsites, setNewSelectedWebsites] = useState([]);
  const [isSubmittingNewUser, setIsSubmittingNewUser] = useState(false);

  // Edit Access Modal State
  const [editingUser, setEditingUser] = useState(null);
  const [editingRole, setEditingRole] = useState('user');
  const [editingWebsites, setEditingWebsites] = useState([]);
  const [editingResetPassword, setEditingResetPassword] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Fetch Users and Websites data
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [usersRes, websitesRes] = await Promise.all([
        authService.getUsers(),
        websiteService.getWebsites({ limit: 500 }),
      ]);

      if (usersRes.success) {
        setUsers(usersRes.data || []);
      }
      if (websitesRes.success) {
        setWebsites(websitesRes.data || []);
      }
    } catch (err) {
      console.error('Error loading users page data:', err);
      error('Failed to load user access data');
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter users by search term
  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      u.username?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.role?.toLowerCase().includes(term)
    );
  });

  const toggleShowPassword = (userId) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const toggleWebsiteCheck = (websiteId, list, setList) => {
    if (list.includes(websiteId)) {
      setList(list.filter((id) => id !== websiteId));
    } else {
      setList([...list, websiteId]);
    }
  };

  // Handle Add New User
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUsername.trim()) {
      error('Username is required');
      return;
    }
    if (!newUserPassword || newUserPassword.length < 6) {
      error('Password must be at least 6 characters');
      return;
    }

    setIsSubmittingNewUser(true);
    try {
      const res = await authService.createUser({
        username: newUsername.trim(),
        email: newUserEmail.trim(),
        password: newUserPassword,
        role: newUserRole,
        allowedWebsites: newSelectedWebsites,
      });

      if (res.success) {
        success(res.message || 'User created successfully!');
        setIsAddModalOpen(false);
        setNewUsername('');
        setNewUserEmail('');
        setNewUserPassword('');
        setNewUserRole('user');
        setNewSelectedWebsites([]);
        fetchData();
      } else {
        error(res.message || 'Failed to create user');
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setIsSubmittingNewUser(false);
    }
  };

  // Open Edit Access Modal
  const openEditModal = (u) => {
    setEditingUser(u);
    setEditingRole(u.role || 'user');
    setEditingResetPassword('');
    const assignedIds = (u.allowedWebsites || []).map((w) => (typeof w === 'object' ? w._id : w));
    setEditingWebsites(assignedIds);
  };

  // Save Edit Access & Password
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSubmittingEdit(true);
    try {
      const payload = {
        role: editingRole,
        allowedWebsites: editingWebsites,
      };
      if (editingResetPassword.trim()) {
        if (editingResetPassword.trim().length < 6) {
          error('New password must be at least 6 characters');
          setIsSubmittingEdit(false);
          return;
        }
        payload.newPassword = editingResetPassword.trim();
      }

      const res = await authService.updateUserAccess(editingUser._id, payload);

      if (res.success) {
        success(res.message || 'User access updated successfully!');
        setEditingUser(null);
        fetchData();
      } else {
        error(res.message || 'Failed to update user');
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update user');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Delete User
  const handleDeleteUser = async (u) => {
    if (window.confirm(`Are you sure you want to delete user account '${u.username}'?`)) {
      try {
        const res = await authService.deleteUser(u._id);
        if (res.success) {
          success(res.message);
          fetchData();
        } else {
          error(res.message);
        }
      } catch (err) {
        error(err.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const totalAdmins = users.filter((u) => u.role === 'admin' || u.isSuperAdmin).length;
  const totalRestricted = users.filter((u) => u.role !== 'admin' && !u.isSuperAdmin).length;

  if (isLoading) {
    return <LoadingSpinner message="Fetching users and website access permissions..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg md:text-xl font-black text-heading flex items-center gap-2.5">
            <FaUserShield className="text-primary" />
            Users & Website Access Control
          </h1>
          <p className="text-xs text-secondary-text mt-0.5">
            Manage user accounts, view passwords, assign roles, and grant specific website access permissions.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs md:text-sm shadow-md shadow-primary/20 transition-all duration-200 self-start sm:self-center"
          >
            <FaUserPlus size={14} />
            Add New User
          </button>
        )}
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border/50 p-4 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl text-primary font-bold">
            <FaUsers size={20} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-secondary-text font-bold">Total Registered Users</p>
            <h3 className="text-2xl font-black text-heading mt-0.5">{users.length}</h3>
          </div>
        </div>

        <div className="bg-card border border-border/50 p-4 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 rounded-xl text-purple-600 font-bold">
            <FaShieldAlt size={20} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-secondary-text font-bold">Administrators</p>
            <h3 className="text-2xl font-black text-heading mt-0.5">{totalAdmins}</h3>
          </div>
        </div>

        <div className="bg-card border border-border/50 p-4 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-600 font-bold">
            <FaUserCheck size={20} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-secondary-text font-bold">Restricted Users</p>
            <h3 className="text-2xl font-black text-heading mt-0.5">{totalRestricted}</h3>
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white border border-border/40 p-4 rounded-xl shadow-sm">
        <div className="relative max-w-md w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary-text">
            <FaSearch size={14} />
          </span>
          <input
            type="text"
            placeholder="Search users by username, email, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-inputbg border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          />
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredUsers.length === 0 ? (
          <div className="col-span-full bg-card border border-border/50 p-8 text-center rounded-2xl">
            <p className="text-xs text-secondary-text">No users found matching your search term.</p>
          </div>
        ) : (
          filteredUsers.map((u) => {
            const isSuper = !!u.isSuperAdmin;
            const isUserAdmin = u.role === 'admin' || isSuper;
            const allowedWebsiteList = Array.isArray(u.allowedWebsites) ? u.allowedWebsites : [];

            return (
              <div
                key={u._id}
                className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm uppercase shadow-sm ${
                        isUserAdmin ? 'bg-primary text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {u.username.substring(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-extrabold text-heading truncate">{u.username}</h3>
                          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg ${
                            isSuper
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : isUserAdmin
                              ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}>
                            {isSuper ? '👑 Super Admin' : isUserAdmin ? '⚡ Administrator' : '🔒 Restricted User'}
                          </span>
                        </div>
                        <p className="text-xs text-secondary-text truncate mt-0.5">{u.email}</p>
                      </div>
                    </div>

                    {!isSuper && isAdmin && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => openEditModal(u)}
                          className="px-2.5 py-1.5 rounded-xl border border-border bg-mainbg hover:bg-gray-100 text-xs font-bold text-heading flex items-center gap-1 transition-colors"
                          title="Manage Access & Password"
                        >
                          <FaEdit size={11} className="text-primary" />
                          <span>Access</span>
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="p-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                          title="Delete User"
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Password Reveal Section */}
                  <div className="bg-mainbg p-3 rounded-xl border border-border/40 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FaKey className="text-amber-500 shrink-0" size={12} />
                      <span className="text-xs font-bold text-secondary-text">Password:</span>
                      <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded border border-border/50 text-heading truncate">
                        {visiblePasswords[u._id]
                          ? (u.plainPassword || (isSuper ? 'Gnana123@' : '******'))
                          : '••••••••'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => toggleShowPassword(u._id)}
                        className="p-1.5 rounded text-secondary-text hover:text-primary hover:bg-card transition-colors"
                        title={visiblePasswords[u._id] ? 'Hide password' : 'Show password'}
                      >
                        {visiblePasswords[u._id] ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                      </button>
                      <button
                        onClick={() => {
                          const pwd = u.plainPassword || (isSuper ? 'Gnana123@' : '');
                          if (pwd) {
                            navigator.clipboard.writeText(pwd);
                            success(`Password copied for ${u.username}!`);
                          }
                        }}
                        className="p-1.5 rounded text-secondary-text hover:text-primary hover:bg-card transition-colors"
                        title="Copy password"
                      >
                        <FaCopy size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Website Access List */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-heading flex items-center gap-1.5">
                        <FaGlobe className="text-primary" size={12} />
                        Granted Website Access:
                      </p>
                      <span className="text-[11px] font-extrabold text-primary">
                        {isUserAdmin ? 'All Websites (Unrestricted)' : `${allowedWebsiteList.length} Websites Granted`}
                      </span>
                    </div>

                    {isUserAdmin ? (
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold p-2.5 rounded-xl">
                        🌐 Full Unrestricted Admin Access to All Websites & Categories
                      </div>
                    ) : allowedWebsiteList.length === 0 ? (
                      <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium p-2.5 rounded-xl">
                        ⚠️ No websites assigned to this user. User cannot view any bookmarks until Admin grants access.
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-mainbg rounded-xl border border-border/40">
                        {allowedWebsiteList.map((w) => (
                          <span
                            key={w._id || w}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-border/60 text-heading shadow-2xs"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            {w.name || 'Website'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal 1: Add New User */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New User Account"
        size="md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input
            label="New Username"
            id="newUsername"
            type="text"
            placeholder="e.g. JohnDoe"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            required
            disabled={isSubmittingNewUser}
            autoFocus
          />

          <Input
            label="User Email"
            id="newUserEmail"
            type="email"
            placeholder="e.g. john@webvault.com"
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
            disabled={isSubmittingNewUser}
          />

          <Input
            label="Account Password"
            id="newUserPassword"
            type="password"
            placeholder="Enter password (min 6 chars)"
            value={newUserPassword}
            onChange={(e) => setNewUserPassword(e.target.value)}
            required
            disabled={isSubmittingNewUser}
          />

          <div>
            <label className="block text-xs font-bold text-heading mb-1.5">Role & Access Level:</label>
            <select
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl bg-inputbg border border-border font-semibold focus:outline-none focus:border-primary"
            >
              <option value="user">Restricted User (Selected websites only)</option>
              <option value="admin">Administrator (Full access to all websites)</option>
            </select>
          </div>

          {newUserRole === 'user' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-heading">Grant Initial Website Access:</label>
                <span className="text-xs font-bold text-primary">{newSelectedWebsites.length} Selected</span>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-mainbg border border-border/50 rounded-xl">
                {websites.map((w) => {
                  const isChecked = newSelectedWebsites.includes(w._id);
                  return (
                    <label key={w._id} className="flex items-center justify-between p-2 rounded-lg bg-white border border-border/40 text-xs cursor-pointer">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleWebsiteCheck(w._id, newSelectedWebsites, setNewSelectedWebsites)}
                          className="w-3.5 h-3.5 rounded text-primary focus:ring-primary"
                        />
                        <span className="font-semibold text-heading">{w.name}</span>
                      </div>
                      <span className="text-[10px] text-secondary-text font-mono">{w.url.replace(/^https?:\/\//, '')}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-border/30">
            <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)} disabled={isSubmittingNewUser}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmittingNewUser} disabled={isSubmittingNewUser}>
              Create User
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Edit Access & Password */}
      {editingUser && (
        <Modal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          title={`Manage Access for '${editingUser.username}'`}
          size="lg"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-heading mb-1.5">User Account Role:</label>
              <select
                value={editingRole}
                onChange={(e) => setEditingRole(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl bg-inputbg border border-border font-semibold focus:outline-none focus:border-primary"
              >
                <option value="user">Restricted User (Access to granted websites only)</option>
                <option value="admin">Administrator (Full Access to all websites)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-heading mb-1.5">Reset User Password (Optional):</label>
              <input
                type="password"
                placeholder="Enter new password to update user password"
                value={editingResetPassword}
                onChange={(e) => setEditingResetPassword(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-inputbg border border-border rounded-xl focus:outline-none focus:border-primary"
              />
            </div>

            {editingRole === 'user' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <label className="text-xs font-bold text-heading">Select Granted Websites:</label>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setEditingWebsites(websites.map((w) => w._id))}
                      className="text-xs text-primary hover:underline font-bold cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={() => setEditingWebsites([])}
                      className="text-xs text-secondary-text hover:underline font-bold cursor-pointer"
                    >
                      Clear All
                    </button>
                    <span className="text-xs font-bold text-primary ml-2 bg-primary/10 px-2 py-0.5 rounded-md">
                      {editingWebsites.length} of {websites.length} Granted
                    </span>
                  </div>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1.5 p-2.5 bg-mainbg border border-border/50 rounded-xl">
                  {websites.length === 0 ? (
                    <p className="text-xs text-secondary-text py-3 text-center">No websites bookmarked yet in WebVault.</p>
                  ) : (
                    websites.map((w) => {
                      const isChecked = editingWebsites.includes(w._id);
                      return (
                        <label
                          key={w._id}
                          className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-primary/10 border-primary/40 text-heading font-bold'
                              : 'bg-card border-border/40 text-secondary-text hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleWebsiteCheck(w._id, editingWebsites, setEditingWebsites)}
                              className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
                            />
                            <span className="truncate">{w.name}</span>
                          </div>
                          <span className="text-[10px] text-secondary-text font-mono truncate max-w-48">
                            {w.url.replace(/^https?:\/\//, '')}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-border/30">
              <Button variant="outline" type="button" onClick={() => setEditingUser(null)} disabled={isSubmittingEdit}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmittingEdit} disabled={isSubmittingEdit}>
                Save Access Permissions
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default UsersPage;
