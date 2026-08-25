import React from 'react';

const SidebarItem: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  active: boolean; 
  collapsed: boolean;
  onClick: () => void;
  badgeCount?: number;
}> = ({ icon, label, active, collapsed, onClick, badgeCount }) => (
  <button
    onClick={onClick}
    title={collapsed ? label : ''}
    className={`w-full flex items-center transition-all duration-300 group relative rounded-xl h-10 ${
      active 
        ? 'bg-slate-50 text-indigo-700 font-bold' 
        : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
    } ${collapsed ? 'justify-center px-0' : 'space-x-3 px-4'}`}
  >
    {active && (
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-indigo-600 rounded-r-full" />
    )}
    
    <div className={`transition-colors duration-300 flex-shrink-0 relative ${active ? 'text-indigo-600' : 'text-slate-300 group-hover:text-slate-600'}`}>
      {React.cloneElement(icon as React.ReactElement<any>, { size: 16 })}
      {badgeCount !== undefined && badgeCount > 0 && collapsed && (
        <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-rose-600 border border-white rounded-full text-[6px] font-bold text-white flex items-center justify-center animate-pulse shadow-sm">
          {badgeCount}
        </span>
      )}
    </div>
    
    {!collapsed && (
      <div className="flex items-center justify-between w-full min-w-0">
        <span className="text-[9.5px] tracking-wider uppercase font-bold truncate">
          {label}
        </span>
        {badgeCount !== undefined && badgeCount > 0 && (
          <span className="ml-2 px-1.5 py-0.5 bg-rose-600 rounded-md text-[6px] font-bold text-white uppercase tracking-wider animate-pulse shadow-sm">
            {badgeCount} ALERTS
          </span>
        )}
      </div>
    )}
  </button>
);

export default SidebarItem;