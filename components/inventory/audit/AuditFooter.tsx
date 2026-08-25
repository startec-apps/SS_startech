import React from 'react';
import { ShieldCheck, AlertTriangle, ChevronRight } from 'lucide-react';

interface AuditFooterProps {
  verifiedCount: number;
  totalCount: number;
  flagCount: number;
  isFirstSection: boolean;
  isLastSection: boolean;
  onBack: () => void;
  onNext: () => void;
  onFinalize: () => void;
}

const AuditFooter: React.FC<AuditFooterProps> = ({ 
  verifiedCount, totalCount, flagCount, isFirstSection, isLastSection, 
  onBack, onNext, onFinalize 
}) => (
  <div className="px-10 py-6 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6 sticky bottom-0 z-20 shadow-[0_-20px_50px_rgba(0,0,0,0.05)] sm:rounded-b-[2.5rem]">
    <div className="flex items-center space-x-5">
      <div className="flex items-center space-x-2 text-slate-400">
        <ShieldCheck size={20} className="text-indigo-600" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">{verifiedCount || 0} / {totalCount || 0} CHECKED</span>
      </div>
      <div className="h-6 w-px bg-slate-100"></div>
      <div className="flex items-center space-x-2 text-rose-500">
        <AlertTriangle size={16} />
        <span className="text-[10px] font-black uppercase tracking-[0.15em]">{flagCount || 0} DIFFERENCE(S) FOUND</span>
      </div>
    </div>
    
    <div className="flex items-center space-x-4 w-full sm:w-auto">
      {!isFirstSection && (
        <button onClick={onBack} className="flex-1 sm:flex-none px-8 py-4 rounded-2xl border border-slate-200 text-slate-500 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all">Previous Page</button>
      )}
      {!isLastSection ? (
        <button onClick={onNext} className="flex-1 sm:flex-none px-12 py-4 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 active:scale-95">
          <span>Go to Next Page</span>
          <ChevronRight size={16} />
        </button>
      ) : (
        <button onClick={onFinalize} className="flex-1 sm:flex-none px-16 py-4 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-[#0F1135] transition-all active:scale-95 flex items-center justify-center space-x-2">
          <ShieldCheck size={20} /> <span>Submit Completed Audit</span>
        </button>
      )}
    </div>
  </div>
);

export default AuditFooter;