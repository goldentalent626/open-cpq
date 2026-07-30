import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({ label, error, fullWidth, className = '', ...props }) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (props.type === 'number') {
      if (['e', 'E', '+', '-'].includes(e.key)) {
        e.preventDefault();
      }
    }
    if (props.onKeyDown) {
      props.onKeyDown(e);
    }
  };

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <input
        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
        {...props}
        onKeyDown={handleKeyDown}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({ label, error, fullWidth, children, className = '', ...props }) => {
  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <select
        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan bg-white ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};
