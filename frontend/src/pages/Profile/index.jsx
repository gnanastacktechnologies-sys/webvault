import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaUser, FaUserShield, FaUserPlus, FaUsers, FaKey, FaEye, FaEyeSlash, FaCopy, FaEdit, FaTrash, FaGlobe } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import authService from '../../services/authService';
import websiteService from '../../services/websiteService';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const ProfilePage = () => {
  const { user, updateProfile, isAdmin } = useAuth();
  const { success, error } = useToast();
  const [searchParams] = useSearchParams();

  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    tabParam && ['profile', 'users', 'adduser'].includes(tabParam) ? tabParam : 'profile'
  );

  useEffect(() => {
    const currentTab = searchParams.get('tab');
    if (currentTab && ['profile', 'users', 'adduser'].includes(currentTab)) {
      setActiveTab(currentTab);
    }
  }, [searchParams]);

  // Tab 1: Profile & Password state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Tab 2: Add User state
  const [newUsername, setNewUsername] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');
  const [newSelectedWebsites, setNewSelectedWebsites] = useState([]);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Tab 3: User Access Management list state
  const [usersList, setUsersList] = useState([]);
  const [allWebsites, setAllWebsites] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({});

  // Editing User Access state
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingRole, setEditingRole] = useState('user');
  const [editingWebsites, setEditingWebsites] = useState([]);
  const [editingResetPassword, setEditingResetPassword] = useState('');
  const [isSavingAccess, setIsSavingAccess] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setEmail(user.email || 'gnanastacktechnologies@gmail.com');
    }
  }, [user]);

  // Load users & websites when opening tab or changing tabs
  useEffect(() => {
    if (isAdmin && (activeTab === 'users' || activeTab === 'adduser')) {
      fetchUsersAndWebsites();
    }
  }, [isAdmin, activeTab]);

  const fetchUsersAndWebsites = async () => {
    setIsLoadingUsers(true);
    try {
      const [usersRes, websitesRes] = await Promise.all([
        authService.getUsers().catch(() => ({ success: false, data: [] })),
        websiteService.getWebsites({ limit: 500 }).catch(() => ({ success: false, data: [] })),
      ]);

      if (usersRes && usersRes.success) {
        setUsersList(usersRes.data || []);
      }
      if (websitesRes && websitesRes.success) {
        setAllWebsites(websitesRes.data || []);
      }
    } catch (err) {
      console.error('Failed to load user access data:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Handle Profile & Password Update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    if (newPassword && newPassword !== confirmNewPassword) {
      error('New passwords do not match');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      error('New password must be at least 6 characters');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const payload = {
        username: username.trim(),
        email: email.trim(),
      };
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await updateProfile(payload);
      if (res.success) {
        success('Profile updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        error(res.message || 'Failed to update profile');
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
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

    setIsCreatingUser(true);
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
        setNewUsername('');
        setNewUserEmail('');
        setNewUserPassword('');
        setNewUserRole('user');
        setNewSelectedWebsites([]);
        fetchUsersAndWebsites();
        setActiveTab('users');
      } else {
        error(res.message || 'Failed to create user');
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setIsCreatingUser(false);
    }
  };

  // Toggle password visibility
  const toggleShowPassword = (userId) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  // Start editing a user's website access permissions & password
  const startEditingAccess = (u) => {
    setEditingUserId(u._id);
    setEditingRole(u.role || 'user');
    setEditingResetPassword('');
    const assignedIds = (u.allowedWebsites || []).map((w) => (typeof w === 'object' ? w._id : w));
    setEditingWebsites(assignedIds);
  };

  // Save updated permissions for a user
  const handleSaveUserAccess = async (targetUserId) => {
    setIsSavingAccess(true);
    try {
      const payload = {
        role: editingRole,
        allowedWebsites: editingWebsites,
      };
      if (editingResetPassword.trim()) {
        if (editingResetPassword.trim().length < 6) {
          error('New password must be at least 6 characters');
          setIsSavingAccess(false);
          return;
        }
        payload.newPassword = editingResetPassword.trim();
      }

      const res = await authService.updateUserAccess(targetUserId, payload);

      if (res.success) {
        success(res.message || 'User permissions & password updated!');
        setEditingUserId(null);
        setEditingResetPassword('');
        fetchUsersAndWebsites();
      } else {
        error(res.message || 'Failed to update user');
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update user');
    } finally {
      setIsSavingAccess(false);
    }
  };

  // Delete a user
  const handleDeleteUser = async (u) => {
    if (window.confirm(`Are you sure you want to delete user '${u.username}'?`)) {
      try {
        const res = await authService.deleteUser(u._id);
        if (res.success) {
          success(res.message);
          fetchUsersAndWebsites();
        } else {
          error(res.message);
        }
      } catch (err) {
        error(err.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const toggleWebsiteSelection = (websiteId, list, setList) => {
    if (list.includes(websiteId)) {
      setList(list.filter((id) => id !== websiteId));
    } else {
      setList([...list, websiteId]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex items-center justify-between bg-card border border-border/60 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary font-black text-xl flex items-center justify-center shadow-inner uppercase">
            {user?.username?.substring(0, 2) || 'PR'}
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-heading">Profile & Account Settings</h1>
            <p className="text-xs text-secondary-text mt-0.5 font-medium">
              Manage your personal credentials, password, and account permissions
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Card with Navigation Tabs */}
      <div className="bg-card border border-border/60 rounded-2xl shadow-sm overflow-hidden">
        {/* Tab Header Bar */}
        <div className="flex border-b border-border/40 bg-mainbg/50 px-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 py-4 px-5 text-xs md:text-sm font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'profile'
                ? 'border-primary text-primary bg-card'
                : 'border-transparent text-secondary-text hover:text-heading'
            }`}
          >
            <FaUser size={13} />
            My Profile & Security
          </button>

          {isAdmin && (
            <>
              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-2 py-4 px-5 text-xs md:text-sm font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
                  activeTab === 'users'
                    ? 'border-primary text-primary bg-card'
                    : 'border-transparent text-secondary-text hover:text-heading'
                }`}
              >
                <FaUserShield size={14} />
                User Access Control
              </button>

              <button
                onClick={() => setActiveTab('adduser')}
                className={`flex items-center gap-2 py-4 px-5 text-xs md:text-sm font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
                  activeTab === 'adduser'
                    ? 'border-primary text-primary bg-card'
                    : 'border-transparent text-secondary-text hover:text-heading'
                }`}
              >
                <FaUserPlus size={14} />
                Add New User
              </button>
            </>
          )}
        </div>

        {/* Tab Body */}
        <div className="p-6 md:p-8">
          {/* TAB 1: MY PROFILE */}
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="max-w-xl space-y-5">
              <Input
                label="Username"
                id="profileUsername"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isUpdatingProfile}
              />

              <Input
                label="Email Address"
                id="profileEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isUpdatingProfile}
              />

              <div className="pt-4 border-t border-border/40 space-y-4">
                <h3 className="text-xs font-extrabold text-heading tracking-wide uppercase">
                  Change Password (Optional)
                </h3>

                <Input
                  label="Current Password"
                  id="currentPassword"
                  type="password"
                  placeholder="Enter current password to set a new one"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={isUpdatingProfile}
                />

                <Input
                  label="New Password"
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password (min 6 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isUpdatingProfile}
                />

                <Input
                  label="Confirm New Password"
                  id="confirmNewPassword"
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  disabled={isUpdatingProfile}
                />
              </div>

              <div className="pt-4 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  className="px-6 py-2.5 text-xs font-extrabold shadow-md shadow-primary/20"
                  isLoading={isUpdatingProfile}
                  disabled={isUpdatingProfile}
                >
                  Save Profile Changes
                </Button>
              </div>
            </form>
          )}

          {/* TAB 2: USER ACCESS CONTROL */}
          {activeTab === 'users' && isAdmin && (
            <div className="space-y-5">
              <div className="flex items-center justify-between bg-primary/10 border border-primary/25 rounded-2xl p-4">
                <div className="flex items-center gap-3 text-primary font-bold text-xs md:text-sm">
                  <FaUsers size={18} />
                  <span>Total Users Registered:</span>
                  <span className="bg-primary text-white px-2.5 py-0.5 rounded-lg text-xs font-black">
                    {usersList.length}
                  </span>
                </div>
                <p className="text-xs font-bold text-secondary-text">Admin Control Center</p>
              </div>

              {isLoadingUsers ? (
                <p className="text-xs text-center py-10 text-secondary-text animate-pulse">Loading users list...</p>
              ) : usersList.length === 0 ? (
                <p className="text-xs text-center py-10 text-secondary-text">No additional sub-users found.</p>
              ) : (
                <div className="space-y-4">
                  {usersList.map((u) => {
                    const isEditing = editingUserId === u._id;
                    const isSuper = !!u.isSuperAdmin;

                    return (
                      <div
                        key={u._id}
                        className="border border-border/60 rounded-2xl p-4 bg-mainbg/40 space-y-3 transition-colors"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-3">
                          <div className="flex items-center gap-3.5">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
                              u.role === 'admin' ? 'bg-primary text-white' : 'bg-slate-200 text-slate-700'
                            }`}>
                              {u.username.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-black text-heading">{u.username}</h4>
                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                                  u.role === 'admin'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {isSuper ? 'Super Admin' : u.role === 'admin' ? 'Administrator' : 'Restricted User'}
                                </span>
                              </div>
                              <p className="text-xs text-secondary-text mt-0.5">{u.email}</p>

                              {/* Password Reveal Section for Admin */}
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-secondary-text flex items-center gap-1 font-semibold">
                                  <FaKey size={11} className="text-amber-500" /> Password:
                                </span>
                                <span className="text-xs font-mono font-bold bg-card text-heading px-2 py-0.5 rounded border border-border/50">
                                  {visiblePasswords[u._id] ? (u.plainPassword || (isSuper ? 'Gnana123@' : '******')) : '••••••••'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => toggleShowPassword(u._id)}
                                  className="p-1 text-secondary-text hover:text-primary transition-colors text-xs"
                                  title={visiblePasswords[u._id] ? "Hide password" : "Show password"}
                                >
                                  {visiblePasswords[u._id] ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const pwdToCopy = u.plainPassword || (isSuper ? 'Gnana123@' : '');
                                    if (pwdToCopy) {
                                      navigator.clipboard.writeText(pwdToCopy);
                                      success(`Password copied for ${u.username}!`);
                                    }
                                  }}
                                  className="p-1 text-secondary-text hover:text-primary transition-colors text-xs"
                                  title="Copy password"
                                >
                                  <FaCopy size={11} />
                                </button>
                              </div>
                            </div>
                          </div>

                          {!isSuper && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => (isEditing ? setEditingUserId(null) : startEditingAccess(u))}
                                className="px-3.5 py-1.5 rounded-xl border border-border bg-card hover:bg-gray-100 text-xs font-bold text-heading flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <FaEdit size={11} className="text-primary" />
                                {isEditing ? 'Close' : 'Manage Access'}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="p-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                                title="Delete user"
                              >
                                <FaTrash size={12} />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Inline Access Permission Editor */}
                        {isEditing && (
                          <div className="mt-3 pt-3 border-t border-border/40 space-y-4 bg-card p-4 rounded-xl border border-primary/20">
                            <div className="flex items-center justify-between gap-4 flex-wrap">
                              <label className="text-xs font-bold text-heading">User Account Role:</label>
                              <select
                                value={editingRole}
                                onChange={(e) => setEditingRole(e.target.value)}
                                className="text-xs px-3 py-1.5 rounded-xl bg-inputbg border border-border focus:outline-none focus:border-primary font-bold"
                              >
                                <option value="user">Restricted User</option>
                                <option value="admin">Administrator (Full Access)</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-xs font-bold text-heading block mb-1">Reset Password (Optional):</label>
                              <input
                                type="password"
                                placeholder="Enter new password to reset user password"
                                value={editingResetPassword}
                                onChange={(e) => setEditingResetPassword(e.target.value)}
                                className="w-full text-xs px-3 py-2 rounded-xl bg-inputbg border border-border focus:outline-none focus:border-primary"
                              />
                            </div>

                            {editingRole === 'user' && (
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <label className="text-xs font-bold text-heading flex items-center gap-1.5">
                                    <FaGlobe className="text-primary" size={12} />
                                    Select Websites Granted to {u.username}:
                                  </label>
                                  <span className="text-[10px] font-extrabold text-primary">
                                    {editingWebsites.length} of {allWebsites.length} Allowed
                                  </span>
                                </div>

                                <div className="max-h-56 overflow-y-auto space-y-1.5 p-2 bg-mainbg border border-border/50 rounded-xl">
                                  {allWebsites.length === 0 ? (
                                    <p className="text-xs text-secondary-text py-3 text-center">No websites in WebVault yet.</p>
                                  ) : (
                                    allWebsites.map((w) => {
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
                                          <div className="flex items-center gap-2 min-w-0">
                                            <input
                                              type="checkbox"
                                              checked={isChecked}
                                              onChange={() => toggleWebsiteSelection(w._id, editingWebsites, setEditingWebsites)}
                                              className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300"
                                            />
                                            <span className="truncate font-semibold">{w.name}</span>
                                          </div>
                                          <span className="text-[10px] text-secondary-text font-mono truncate max-w-40">
                                            {w.url.replace(/^https?:\/\//, '')}
                                          </span>
                                        </label>
                                      );
                                    })
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="flex justify-end gap-3 pt-2">
                              <Button
                                type="button"
                                variant="outline"
                                className="py-1.5 px-4 text-xs"
                                onClick={() => setEditingUserId(null)}
                                disabled={isSavingAccess}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="button"
                                variant="primary"
                                className="py-1.5 px-4 text-xs font-bold shadow-md shadow-primary/20"
                                onClick={() => handleSaveUserAccess(u._id)}
                                isLoading={isSavingAccess}
                                disabled={isSavingAccess}
                              >
                                Save Access Permissions
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ADD NEW USER */}
          {activeTab === 'adduser' && isAdmin && (
            <form onSubmit={handleCreateUser} className="max-w-xl space-y-5">
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 text-xs font-semibold text-secondary-text leading-relaxed">
                Create sub-user accounts and assign specific website access.
              </div>

              <Input
                label="New Username"
                id="newUsername"
                type="text"
                placeholder="e.g. JohnDoe"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                required
                disabled={isCreatingUser}
                autoFocus
              />

              <Input
                label="User Email"
                id="newUserEmail"
                type="email"
                placeholder="e.g. john@webvault.com"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                disabled={isCreatingUser}
              />

              <Input
                label="Account Password"
                id="newUserPassword"
                type="password"
                placeholder="Enter password (min 6 characters)"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                required
                disabled={isCreatingUser}
              />

              <div>
                <label className="block text-xs font-bold text-heading mb-2">User Role & Access Level:</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-inputbg border border-border focus:outline-none focus:border-primary font-bold"
                >
                  <option value="user">Restricted User (Access to selected websites only)</option>
                  <option value="admin">Administrator (Full Access to all websites)</option>
                </select>
              </div>

              {newUserRole === 'user' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-heading flex items-center gap-1.5">
                      <FaGlobe className="text-primary" size={12} />
                      Initial Website Access (Optional):
                    </label>
                    <span className="text-[10px] font-extrabold text-primary">
                      {newSelectedWebsites.length} Selected
                    </span>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-mainbg border border-border/50 rounded-xl">
                    {allWebsites.length === 0 ? (
                      <p className="text-xs text-secondary-text py-3 text-center">No websites created yet.</p>
                    ) : (
                      allWebsites.map((w) => {
                        const isChecked = newSelectedWebsites.includes(w._id);
                        return (
                          <label
                            key={w._id}
                            className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                              isChecked
                                ? 'bg-primary/10 border-primary/40 text-heading font-bold'
                                : 'bg-card border-border/40 text-secondary-text hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleWebsiteSelection(w._id, newSelectedWebsites, setNewSelectedWebsites)}
                                className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300"
                              />
                              <span className="truncate font-semibold">{w.name}</span>
                            </div>
                            <span className="text-[10px] text-secondary-text font-mono truncate max-w-40">
                              {w.url.replace(/^https?:\/\//, '')}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  className="px-6 py-2.5 text-xs font-extrabold shadow-md shadow-primary/20"
                  isLoading={isCreatingUser}
                  disabled={isCreatingUser}
                >
                  Create User Account
                </Button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
