import React from 'react';

interface AuditZoneNavProps {
  zones: string[];
  activeIndex: number;
  onZoneSelect: (idx: number) => void;
}

const AuditZoneNav: React.FC<AuditZoneNavProps> = ({ zones, activeIndex, onZoneSelect }) => (
  <div className="px-8 py-3 bg-slate-50 border-b border-slate-100 flex items-center space-x-2 overflow-x-auto no-scrollbar sticky top-[80px] z-10">
    {zones.map((zone, idx) => (
      <button 
        key={zone} 
        onClick={() => onZoneSelect(idx)} 
        className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all shrink-0 border ${
          idx === activeIndex ? 'bg-[#0F1135] text-white shadow-md' : 'bg-white text-slate-400 border-slate-200'
        }`}
      >
        {idx + 1}. {zone}
      </button>
    ))}
  </div>
);

export default AuditZoneNav;