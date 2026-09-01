import React, { useState, useEffect } from 'react';
import { FaUser, FaLock, FaUserPlus, FaTimes, FaEnvelope, FaKey, FaCheckCircle } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import authService from '../../services/authService';
import Input from '../common/Input';
import Button from '../common/Button';

const ProfileModal = ({ isOpen, onClose, initialTab = 'profile' }) => {
  const { user, updateProfile } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState(initialTab);

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
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setEmail(user.email || 'gnanastacktechnologies@gmail.com');
    }
    setActiveTab(initialTab);
  }, [user, initialTab, isOpen]);

  if (!isOpen) return null;

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
      });

      if (res.success) {
        success(res.message || 'User created successfully!');
        setNewUsername('');
        setNewUserEmail('');
        setNewUserPassword('');
      } else {
        error(res.message || 'Failed to create user');
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setIsCreatingUser(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-fadeIn">
      <div className="max-w-md w-full bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden relative">
        
        {/* Header Bar */}
        <div className="bg-mainbg px-6 py-4 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 rounded-xl text-primary font-bold">
              <FaUser size={16} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-heading">Admin Settings</h3>
              <p className="text-[11px] font-medium text-secondary-text">Manage your profile, security & users</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-secondary-text hover:text-heading hover:bg-card rounded-lg transition-colors"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border/40 bg-card px-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-primary text-primary'
                : 'border-transparent text-secondary-text hover:text-heading'
            }`}
          >
            <FaUser size={12} />
            My Profile & Password
          </button>
          <button
            onClick={() => setActiveTab('adduser')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'adduser'
                ? 'border-primary text-primary'
                : 'border-transparent text-secondary-text hover:text-heading'
            }`}
          >
            <FaUserPlus size={13} />
            Add New User
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          
          {/* TAB 1: MY PROFILE & SECURITY */}
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <Input
                label="Admin Name (Username)"
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

              <div className="pt-2 border-t border-border/30">
                <p className="text-xs font-semibold text-secondary-text mb-3">
                  Change Password (Optional)
                </p>

                <div className="space-y-3">
                  <Input
                    label="Current Password"
                    id="currentPassword"
                    type="password"
                    placeholder="Required only to change password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={isUpdatingProfile}
                  />

                  <Input
                    label="New Password"
                    id="newPassword"
                    type="password"
                    placeholder="Enter new password"
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
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="py-2 text-xs"
                  onClick={onClose}
                  disabled={isUpdatingProfile}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="py-2 text-xs font-bold shadow-md shadow-primary/20"
                  isLoading={isUpdatingProfile}
                  disabled={isUpdatingProfile}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          )}

          {/* TAB 2: ADD NEW USER */}
          {activeTab === 'adduser' && (
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-secondary-text">
                Create additional admin accounts to manage WebVault securely.
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
                placeholder="Enter account password (min 6 chars)"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                required
                disabled={isCreatingUser}
              />

              <div className="pt-3 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="py-2 text-xs"
                  onClick={onClose}
                  disabled={isCreatingUser}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="py-2 text-xs font-bold shadow-md shadow-primary/20"
                  isLoading={isCreatingUser}
                  disabled={isCreatingUser}
                >
                  Create User
                </Button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
