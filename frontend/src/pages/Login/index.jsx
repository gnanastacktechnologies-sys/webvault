import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const Login = () => {
  const { login, isAuthenticated, loading } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const validate = () => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

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

  return (
    <div className="min-h-screen bg-mainbg flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
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
        <form onSubmit={handleSubmit} className="space-y-4">
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
    </div>
  );
};

export default Login;
