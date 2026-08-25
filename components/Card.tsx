
import React from 'react';

const Card: React.FC<{ title?: string; children: React.ReactNode; className?: string; headerAction?: React.ReactNode }> = ({ title, children, className = "", headerAction }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
    {(title || headerAction) && (
      <div className="flex justify-between items-center mb-4">
        {title && <h3 className="text-lg font-semibold text-gray-800 tracking-tight">{title}</h3>}
        {headerAction}
      </div>
    )}
    {children}
  </div>
);

export default Card;
