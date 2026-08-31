import React from 'react';

const Select = ({
  label,
  id,
  options = [],
  error,
  placeholder = 'Select an option',
  required = false,
  className = '',
  value,
  onChange,
  ...props
}) => {
  return (
    <div className={`w-full flex flex-col mb-4 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-semibold text-heading mb-1.5"
        >
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <select
        id={id}
        value={value}
        onChange={onChange}
        className={`
          w-full px-3 py-2 text-sm bg-inputbg border rounded-lg focus:outline-none transition-colors duration-200 cursor-pointer
          ${error ? 'border-danger focus:ring-1 focus:ring-danger' : 'border-border focus:border-primary focus:ring-1 focus:ring-primary'}
        `}
        {...props}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-danger mt-1.5">{error}</span>}
    </div>
  );
};

export default Select;
