import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import authService from '../../services/authService';

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Forgot Password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetUsername, setResetUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [modalErrors, setModalErrors] = useState({});

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const validateLogin = () => {
    const errors = {};
    if (!username.trim()) {
      errors.username = 'Username is required';
    }
    if (!password) {
      errors.password = 'Password is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!validateLogin()) return;

    setIsSubmitting(true);
    const result = await login(username.trim(), password);
    setIsSubmitting(false);

    if (result.success) {
      success('Logged in successfully!');
      navigate('/dashboard');
    } else {
      error(result.message || 'Invalid username or password');
    }
  };

  // Direct Password Reset without OTP
  const handleDirectReset = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!resetUsername.trim()) errs.username = 'Username is required';
    if (!newPassword) errs.newPassword = 'New password is required';
    if (newPassword && newPassword.length < 6) errs.newPassword = 'Password must be at least 6 characters';
    if (newPassword !== confirmPassword) errs.confirmPassword = 'Passwords do not match';

    setModalErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsResetting(true);
    try {
      const res = await authService.resetPassword(
        resetUsername.trim(),
        newPassword,
        confirmPassword
      );
      if (res.success) {
        success(res.message || 'Password updated successfully!');
        setShowForgotModal(false);
        setResetUsername('');
        setNewPassword('');
        setConfirmPassword('');
        setModalErrors({});
      } else {
        error(res.message || 'Failed to update password');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update password';
      error(msg);
    } finally {
      setIsResetting(false);
    }
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setModalErrors({});
  };

  return (
    <div className="min-h-screen bg-mainbg flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative">
      {/* Centered Login Card */}
      <div className="max-w-md w-full bg-card border border-border/40 rounded-2xl shadow-xl p-8 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center">
          <img
            src="/logo.png"
            alt="WebVault Logo"
            className="w-20 h-20 rounded-2xl object-cover shadow-xl shadow-primary/30 mx-auto mb-3 border border-border/40"
          />
          <h1 className="text-2xl font-extrabold text-primary tracking-tight">
            WebVault
          </h1>
          <p className="text-xs font-semibold text-secondary-text mt-1.5 tracking-wide">
            Your Website, Our Safe Place
          </p>
          <div className="h-0.5 w-16 bg-primary/20 mx-auto mt-4 rounded-full" />
        </div>

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <Input
            label="Username"
            id="username"
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            error={formErrors.username}
            required
            disabled={isSubmitting}
            autoFocus
          />

          <div>
            <Input
              label="Password"
              id="password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={formErrors.password}
              required
              disabled={isSubmitting}
            />
            <div className="flex justify-end mt-1.5">
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(true);
                  setModalErrors({});
                }}
                className="text-xs font-medium text-primary hover:text-primary-hover hover:underline transition-colors focus:outline-none"
              >
                Forgot Password?
              </button>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              className="w-full py-2.5 rounded-xl shadow-lg shadow-primary/25 font-bold tracking-wide"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              Sign In
            </Button>
          </div>
        </form>

        {/* Footer Notes */}
        <div className="text-center space-y-1">
          <p className="text-[10px] text-secondary-text font-medium leading-relaxed">
            Personal Website Manager. Secure multi-user login.
          </p>
          <p className="text-xs text-secondary-text font-semibold pt-1 border-t border-border/30">
            © 2026 Gnanastack Technologies. All rights reserved.
          </p>
        </div>
      </div>

      {/* Direct Forgot Password Modal (No OTP) */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="max-w-md w-full bg-card border border-border rounded-2xl shadow-2xl p-6 sm:p-8 space-y-5 relative">
            
            {/* Close Button */}
            <button
              type="button"
              onClick={closeForgotModal}
              className="absolute top-4 right-4 text-secondary-text hover:text-main-text text-xl font-bold p-1 focus:outline-none"
            >
              &times;
            </button>

            {/* Modal Header */}
            <div className="text-center">
              <h2 className="text-xl font-extrabold text-main-text">
                Reset Account Password
              </h2>
              <p className="text-xs text-secondary-text mt-1">
                Enter your username and new password to reset your account password.
              </p>
            </div>

            <form onSubmit={handleDirectReset} className="space-y-4">
              <Input
                label="Account Username"
                id="resetUsername"
                type="text"
                placeholder="e.g. Gnanasekaran or username"
                value={resetUsername}
                onChange={(e) => setResetUsername(e.target.value)}
                error={modalErrors.username}
                required
                disabled={isResetting}
                autoFocus
              />

              <Input
                label="New Password"
                id="newPassword"
                type="password"
                placeholder="Enter new password (min 6 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                error={modalErrors.newPassword}
                required
                disabled={isResetting}
              />

              <Input
                label="Confirm New Password"
                id="confirmPassword"
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={modalErrors.confirmPassword}
                required
                disabled={isResetting}
              />

              <div className="pt-2 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-1/2 py-2 rounded-xl text-xs font-semibold"
                  onClick={closeForgotModal}
                  disabled={isResetting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="w-1/2 py-2 rounded-xl text-xs font-bold shadow-md shadow-primary/20"
                  isLoading={isResetting}
                  disabled={isResetting}
                >
                  Reset Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
