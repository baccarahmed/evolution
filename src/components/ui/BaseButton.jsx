import React from 'react';
import './BaseButton.css';

const BaseButton = ({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  disabled = false, 
  fullWidth = false, 
  onClick,
  className = '',
  type = 'button'
}) => {
  const buttonClasses = [
    'base-button',
    `base-button--${variant}`,
    `base-button--${size}`,
    disabled ? 'base-button--disabled' : '',
    fullWidth ? 'base-button--full-width' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button 
      className={buttonClasses} 
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  );
};

export default BaseButton;
