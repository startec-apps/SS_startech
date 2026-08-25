
import React from 'react';
import { AlertTriangle, Clock, ShieldCheck, X, ChevronRight, Timer } from 'lucide-react';
import { ToolUsageRecord } from '../../types';

interface ResolutionWarningModalProps {
  log: ToolUsageRecord;
  onProceed: () => void;
  onExtend: () => void;
  onCancel: () => void;
}

const ResolutionWarningModal: React.FC<ResolutionWarningModalProps> = ({ log, onProceed, onExtend, onCancel }) => {
  return (
    <div className="fixed inset-0 z-[280] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-amber-100">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
           <div className="flex items-center space-x-3">
              <div className="p-2 bg-amber-500 rounded-xl text-white shadow-lg shadow-amber-100"><AlertTriangle size={20}/></div>
              <div>
                 <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">Institutional Intercept</h3>
                 <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Case Reference: {log.id}</p>
              </div>
           </div>
           <button onClick={onCancel} className="text-slate-300 hover:text-slate-900"><X size={20}/></button>
        </div>

        <div className="p-6 space-y-6">
           <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
              <div className="flex items-center space-x-3 mb-3">
                 <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100 font-black text-xs">
                    {log.staffName.charAt(0)}
                 </div>
                 <div className="min-w-0">
                    <p className="text-[10px] font-black text-slate-900 uppercase truncate">{log.toolName}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Custodian: {log.staffName}</p>
                 </div>
              </div>
              <p className="text-[9px] text-slate-500 leading-relaxed font-medium uppercase tracking-wide">
                 You are about to initiate the final resolution path for this technical discrepancy. System policy requires a confirmation of intent.
              </p>
           </div>

           <div className="space-y-2.5">
              <button 
                onClick={onProceed}
                className="w-full flex items-center p-4 rounded-2xl border border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700 transition-all text-left shadow-lg shadow-indigo-100 group"
              >
                 <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <ShieldCheck size={18} />
                 </div>
                 <div className="ml-4 flex-1">
                    <p className="text-[11px] font-black uppercase leading-none">Proceed to Final Resolution</p>
                    <p className="text-[8px] font-bold opacity-80 uppercase mt-1.5">Apply physical or financial SOP protocols</p>
                 </div>
                 <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <button 
                onClick={onExtend}
                className="w-full flex items-center p-4 rounded-2xl border border-slate-100 bg-white hover:border-amber-300 transition-all text-left shadow-sm group"
              >
                 <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Timer size={18} />
                 </div>
                 <div className="ml-4 flex-1">
                    <p className="text-[11px] font-black text-slate-900 uppercase leading-none">Extend Grace Period</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase mt-1.5">Grant +7 days for technical recovery</p>
                 </div>
                 <ChevronRight size={14} className="text-slate-200 group-hover:text-amber-500 transition-colors" />
              </button>
           </div>
        </div>

        <div className="p-4 bg-slate-50 text-center border-t border-slate-100">
           <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest leading-relaxed">
             Institutional Liability Lock: Finalization prevents further floor-level reversals.
           </p>
        </div>
      </div>
    </div>
  );
};

export default ResolutionWarningModal;
