import React from 'react';
import './BaseCard.css';

const BaseCard = ({ 
  children, 
  variant = 'default', 
  shadow = 'md', 
  padding = 'medium',
  header,
  footer,
  className = ''
}) => {
  const cardClasses = [
    'base-card',
    `base-card--${variant}`,
    `base-card--shadow-${shadow}`,
    `base-card--padding-${padding}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses}>
      {header && (
        <div className="card-header">
          {header}
        </div>
      )}
      <div className="card-content">
        {children}
      </div>
      {footer && (
        <div className="card-footer">
          {footer}
        </div>
      )}
    </div>
  );
};

export default BaseCard;
