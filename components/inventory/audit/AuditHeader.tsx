
import React from 'react';
import { Search, X, PackageSearch } from 'lucide-react';

interface AuditHeaderProps {
  currentZone: string;
  targetZone: string;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onCancel: () => void;
}

const AuditHeader: React.FC<AuditHeaderProps> = ({ currentZone, targetZone, searchTerm, onSearchChange, onCancel }) => (
  <div className="px-8 py-5 border-b border-slate-100 bg-white sticky top-0 z-20">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-[#0F1135] rounded-2xl flex items-center justify-center text-white shadow-lg">
          <PackageSearch size={24} />
        </div>
        <div>
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">Inspection Checklist</h3>
          <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1.5">
            Looking at: <span className="text-indigo-600 uppercase">{currentZone || targetZone}</span>
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="hidden lg:flex items-center space-x-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
          <Search size={14} className="text-slate-300" />
          <input 
            className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none w-48 text-slate-700" 
            placeholder="FIND A TOOL..." 
            value={searchTerm} 
            onChange={e => onSearchChange(e.target.value)} 
          />
        </div>
        <button onClick={onCancel} className="text-slate-300 hover:text-slate-900 transition-colors p-2"><X size={24} /></button>
      </div>
    </div>
  </div>
);

export default AuditHeader;
