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
  const [forgotStep, setForgotStep] = useState(1); // 1: Request OTP, 2: Verify OTP
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
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

  // Step 1: Handle Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!resetEmail.trim()) errs.email = 'Email address is required';
    if (!newPassword) errs.newPassword = 'New password is required';
    if (newPassword && newPassword.length < 6) errs.newPassword = 'Password must be at least 6 characters';
    if (newPassword !== confirmPassword) errs.confirmPassword = 'Passwords do not match';

    setModalErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsResetting(true);
    try {
      const res = await authService.requestPasswordResetOtp(
        resetEmail.trim(),
        newPassword,
        confirmPassword
      );
      if (res.success) {
        success(res.message || 'OTP code sent!');
        if (res.otp) {
          setOtp(res.otp);
        }
        setForgotStep(2);
      } else {
        error(res.message || 'Failed to send OTP email');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to request password reset OTP';
      error(msg);
    } finally {
      setIsResetting(false);
    }
  };

  // Step 2: Handle Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      setModalErrors({ otp: 'Please enter the 6-digit OTP code' });
      return;
    }

    setIsResetting(true);
    try {
      const res = await authService.verifyPasswordResetOtp(resetEmail.trim(), otp.trim());
      if (res.success) {
        success(res.message || 'Password changed successfully!');
        // Reset state and close modal
        setShowForgotModal(false);
        setForgotStep(1);
        setResetEmail('');
        setNewPassword('');
        setConfirmPassword('');
        setOtp('');
        setModalErrors({});
      } else {
        error(res.message || 'OTP verification failed');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'OTP verification failed';
      error(msg);
    } finally {
      setIsResetting(false);
    }
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setForgotStep(1);
    setModalErrors({});
  };

  return (
    <div className="min-h-screen bg-mainbg flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative">
      {/* Centered Login Card */}
      <div className="max-w-md w-full bg-card border border-border/40 rounded-2xl shadow-xl p-8 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-primary tracking-tight flex items-center justify-center gap-2.5">
            <span className="bg-primary text-white p-2 rounded-xl text-base font-bold shadow-md shadow-primary/30">
              WV
            </span>
            WebVault
          </h1>
          <p className="text-xs font-semibold text-secondary-text mt-1.5 uppercase tracking-wide">
            Personal Website Manager
          </p>
          <div className="h-0.5 w-16 bg-primary/20 mx-auto mt-4 rounded-full" />
        </div>

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <Input
            label="Username"
            id="username"
            type="text"
            placeholder="Enter admin username"
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
              placeholder="Enter admin password"
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
                  setForgotStep(1);
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
        <div className="text-center">
          <p className="text-[10px] text-secondary-text font-medium leading-relaxed">
            Secure admin portal. Unauthorized access is logged.
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
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
                {forgotStep === 1 ? 'Reset Admin Password' : 'Verify Email OTP'}
              </h2>
              <p className="text-xs text-secondary-text mt-1">
                {forgotStep === 1
                  ? 'Enter your email address and new password to receive a 6-digit verification code.'
                  : `Enter the 6-digit OTP sent to ${resetEmail}`}
              </p>
            </div>

            {/* Step 1: Request OTP Form */}
            {forgotStep === 1 && (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <Input
                  label="Registered Email"
                  id="resetEmail"
                  type="email"
                  placeholder="admin@webvault.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  error={modalErrors.email}
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
                    Send OTP
                  </Button>
                </div>
              </form>
            )}

            {/* Step 2: Verify OTP Form */}
            {forgotStep === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <Input
                  label="6-Digit Verification Code (OTP)"
                  id="otp"
                  type="text"
                  placeholder="e.g. 123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  error={modalErrors.otp}
                  required
                  maxLength={6}
                  disabled={isResetting}
                  autoFocus
                />

                <div className="pt-2 flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-1/2 py-2 rounded-xl text-xs font-semibold"
                    onClick={() => {
                      setForgotStep(1);
                      setModalErrors({});
                    }}
                    disabled={isResetting}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-1/2 py-2 rounded-xl text-xs font-bold shadow-md shadow-primary/20"
                    isLoading={isResetting}
                    disabled={isResetting}
                  >
                    Verify & Reset
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
