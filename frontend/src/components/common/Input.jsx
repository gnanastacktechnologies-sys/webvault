import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Input = ({
  label,
  id,
  type = 'text',
  error,
  placeholder = '',
  required = false,
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const isPasswordType = type === 'password';
  const inputType = isPasswordType && showPassword ? 'text' : type;

  return (
    <div className={`w-full flex flex-col mb-4 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-semibold text-heading mb-1.5 flex items-center justify-between"
        >
          <span>
            {label} {required && <span className="text-danger">*</span>}
          </span>
        </label>
      )}
      <div className="relative rounded-lg shadow-sm">
        <input
          type={inputType}
          id={id}
          className={`
            w-full px-3 py-2 text-sm bg-inputbg border rounded-lg focus:outline-none transition-colors duration-200
            ${error ? 'border-danger focus:ring-1 focus:ring-danger' : 'border-border focus:border-primary focus:ring-1 focus:ring-primary'}
            ${isPasswordType ? 'pr-10' : ''}
          `}
          placeholder={placeholder}
          required={required}
          {...props}
        />
        {isPasswordType && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-text hover:text-heading focus:outline-none"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
          </button>
        )}
      </div>
      {error && <span className="text-xs text-danger mt-1.5">{error}</span>}
    </div>
  );
};

export default Input;
