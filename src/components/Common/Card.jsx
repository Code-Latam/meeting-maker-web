import React from 'react';

export function Card({ className = '', ...props }) {
  return <div className={`card ${className}`} {...props} />;
}
