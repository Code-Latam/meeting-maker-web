import React from 'react';

const variantClass = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
  ghost: 'btn-ghost',
};

export function Button({ variant = 'primary', size = 'md', className = '', ...props }) {
  const sizeClass = size === 'sm' ? 'text-sm px-3 py-1.5' : '';
  return (
    <button
      className={`${variantClass[variant] || 'btn-primary'} ${sizeClass} ${className}`}
      {...props}
    />
  );
}
