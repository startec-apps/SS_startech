import React from 'react';
import { RotateCcw, CheckCircle, Database } from 'lucide-react';

interface GlobalOverlayProps {
  isVisible: boolean;
  message?: string;
}

const GlobalOverlay: React.FC<GlobalOverlayProps> = ({ isVisible, message = "Saving Records" }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-950/20 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white/95 border border-white/20 p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center space-y-5 max-w-sm w-full text-center">
        <div className="relative">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
            <Database size={24} />
          </div>
          <div className="absolute -top-1 -right-1 w-8 h-8 bg-white rounded-xl shadow-md flex items-center justify-center text-indigo-600 animate-spin">
            <RotateCcw size={14} strokeWidth={3} />
          </div>
        </div>
        
        <div className="space-y-1">
          <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{message}</h3>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
            Updating the system database
          </p>
        </div>

        <div className="flex items-center space-x-2 text-emerald-500 bg-emerald-50 px-4 py-1.5 rounded-xl border border-emerald-100">
          <CheckCircle size={12} />
          <span className="text-[7.5px] font-black uppercase tracking-widest">Active Connection</span>
        </div>
      </div>
    </div>
  );
};

export default GlobalOverlay;