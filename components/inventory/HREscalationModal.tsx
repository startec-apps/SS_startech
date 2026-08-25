
import React from 'react';
import { ShieldAlert, CreditCard, Scale, FileWarning, Search, ChevronRight, X, AlertOctagon } from 'lucide-react';
import { ToolUsageRecord } from '../../types';

interface HREscalationModalProps {
  log: ToolUsageRecord;
  onConfirm: (protocol: string, chargeAmount: number) => void;
  onCancel: () => void;
}

const HREscalationModal: React.FC<HREscalationModalProps> = ({ log, onConfirm, onCancel }) => {
  const assetValue = log.monetaryValue || 0;

  const protocols = [
    { 
      id: 'PAYROLL_DEDUCTION_FULL', 
      label: 'Full Payroll Deduction', 
      sub: `Deduct $${assetValue} from next cycle`, 
      icon: <CreditCard size={18} />, 
      color: 'text-rose-600', 
      bg: 'bg-rose-50',
      value: assetValue 
    },
    { 
      id: 'LIABILITY_SPLIT', 
      label: 'Contributory Liability', 
      sub: `50/50 Split ($${(assetValue / 2).toFixed(2)})`, 
      icon: <Scale size={18} />, 
      color: 'text-amber-600', 
      bg: 'bg-amber-50',
      value: assetValue / 2
    },
    { 
      id: 'DISCIPLINARY_WARNING', 
      label: 'Professional Warning', 
      sub: 'Formal disciplinary entry (No Charge)', 
      icon: <FileWarning size={18} />, 
      color: 'text-indigo-600', 
      bg: 'bg-indigo-50',
      value: 0
    },
    { 
      id: 'NEGLIGENCE_INQUIRY', 
      label: 'Negligence Investigation', 
      sub: 'Freeze case for formal inquiry', 
      icon: <Search size={18} />, 
      color: 'text-slate-600', 
      bg: 'bg-slate-100',
      value: 0
    }
  ];

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
           <div className="flex items-center space-x-3">
              <div className="p-2 bg-rose-600 rounded-xl text-white shadow-lg shadow-rose-200"><AlertOctagon size={18}/></div>
              <div>
                 <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">HR Escalation Protocol</h3>
                 <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Personnel ID: {log.staffId}</p>
              </div>
           </div>
           <button onClick={onCancel} className="text-slate-300 hover:text-slate-900"><X size={20}/></button>
        </div>

        <div className="px-6 py-4 bg-rose-50/50 border-b border-rose-100/50">
           <div className="flex items-center justify-between">
              <p className="text-[8px] font-black text-rose-600 uppercase tracking-widest">Asset replacement value:</p>
              <p className="text-sm font-black text-slate-900">${assetValue.toLocaleString()}</p>
           </div>
        </div>

        <div className="p-6 space-y-2">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 px-2 italic">Select Administrative Direction:</p>
           {protocols.map(p => (
             <button 
               key={p.id}
               onClick={() => onConfirm(p.id, p.value)}
               className="w-full flex items-center p-4 rounded-2xl border border-slate-100 hover:border-rose-200 hover:shadow-md transition-all text-left group bg-white"
             >
                <div className={`w-10 h-10 rounded-xl ${p.bg} ${p.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                   {p.icon}
                </div>
                <div className="ml-4 min-w-0">
                   <p className="text-[11px] font-black text-slate-900 uppercase leading-none">{p.label}</p>
                   <p className="text-[8px] font-bold text-slate-400 uppercase mt-1.5">{p.sub}</p>
                </div>
                <ChevronRight size={14} className="ml-auto text-slate-200 group-hover:text-rose-400" />
             </button>
           ))}
        </div>

        <div className="p-6 bg-slate-900 text-center">
           <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
             Execution of this protocol is final and triggers an immediate <br/> 
             digital notification to the Institutional HR Manager.
           </p>
        </div>
      </div>
    </div>
  );
};

export default HREscalationModal;
