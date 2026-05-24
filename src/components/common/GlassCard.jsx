import React from 'react';
import './common.css';

export default function GlassCard({ children, className = '', interactive = false, onClick, ...props }) {
  return (
    <div
      className={`card-wrapper ${interactive ? 'interactive' : ''} ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      {...props}
    >
      {children}
    </div>
  );
}
