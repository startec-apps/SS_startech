
import React, { useState } from 'react';
import { X, ShieldAlert, CreditCard, PackageX, FileWarning, Trash2, ChevronRight, ShieldCheck, User, Clock, AlertCircle, Info, Hammer } from 'lucide-react';
import { Employee, PerformanceObservation, ToolUsageRecord } from '../../types';

interface CaseReviewModalProps {
  caseData: {
    id: string;
    staffId: string;
    staffName: string;
    type: 'Behavioral' | 'Asset Liability';
    category: string;
    summary: string;
    raw: any;
  };
  onClose: () => void;
  onResolve: (protocol: string, notes: string) => Promise<void>;
}

const CaseReviewModal: React.FC<CaseReviewModalProps> = ({ caseData, onClose, onResolve }) => {
  const [selectedPathway, setSelectedPathway] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const pathways = [
    {
      id: 'PAYROLL_DEDUCTION',
      label: 'Payroll Liability Acknowledgment',
      desc: 'Fiscal recovery via automated payroll deduction.',
      icon: <CreditCard size={20} />,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      applicable: caseData.type === 'Asset Liability'
    },
    {
      id: 'REPLACED_BY_STAFF',
      label: 'Staff-Led Restitution',
      desc: 'Custodian procures identical replacement asset.',
      icon: <PackageX size={20} />,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      applicable: caseData.type === 'Asset Liability'
    },
    {
      id: 'DISCIPLINARY_ACTION',
      label: 'Formal Disciplinary Inquiry',
      desc: 'Verdicts: Written Warning or Suspension.',
      icon: <FileWarning size={20} />,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      applicable: true
    },
    {
      id: 'WAIVED',
      label: 'Operational Waiver',
      desc: 'Institutional write-off (Accidental/Fair Wear).',
      icon: <Trash2 size={20} />,
      color: 'text-slate-600',
      bg: 'bg-slate-100',
      applicable: true
    }
  ];

  const handleFinalize = async () => {
    if (!selectedPathway) return;
    setIsProcessing(true);
    try {
      await onResolve(selectedPathway, resolutionNotes);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        {/* HEADER */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
              <ShieldAlert size={28} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">Case Resolution Hub</h3>
              <div className="flex items-center space-x-3 mt-2">
                 <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                    ID: {caseData.id}
                 </span>
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                    <User size={12} className="mr-1.5" />
                    {caseData.staffName} ({caseData.staffId})
                 </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-900 transition-colors"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-8">
           {/* CASE CONTEXT */}
           <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-6 shadow-inner relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-10 -mt-10"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center space-x-2">
                      <AlertCircle size={16} className="text-indigo-600" />
                      <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Incident Summary</h4>
                   </div>
                   <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">{caseData.category}</span>
                </div>
                <p className="text-[11px] font-medium text-slate-600 leading-relaxed italic">
                  "{caseData.summary}"
                </p>
              </div>
           </div>

           {/* RESOLUTION PATHWAYS */}
           <div className="space-y-4">
              <div className="flex items-center space-x-2 px-1">
                 <ShieldCheck size={16} className="text-emerald-500" />
                 <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Select Resolution Pathway (SOP)</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                 {pathways.map(p => (
                    <button 
                      key={p.id}
                      disabled={!p.applicable}
                      onClick={() => setSelectedPathway(p.id)}
                      className={`relative flex flex-col p-5 rounded-[1.8rem] border text-left transition-all group ${
                        !p.applicable ? 'opacity-30 grayscale cursor-not-allowed border-slate-100' :
                        selectedPathway === p.id ? 'bg-white border-indigo-600 shadow-xl ring-2 ring-indigo-50' : 
                        'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-md'
                      }`}
                    >
                       <div className={`w-10 h-10 rounded-xl ${p.bg} ${p.color} flex items-center justify-center shrink-0 mb-4 shadow-inner group-hover:scale-110 transition-transform`}>
                          {p.icon}
                       </div>
                       <div className="min-w-0">
                          <p className={`text-[11px] font-black uppercase leading-tight ${selectedPathway === p.id ? 'text-indigo-600' : 'text-slate-900'}`}>{p.label}</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase mt-2 leading-relaxed">{p.desc}</p>
                       </div>
                       {selectedPathway === p.id && (
                         <div className="absolute top-4 right-4 text-indigo-600">
                            <ShieldCheck size={18} />
                         </div>
                       )}
                    </button>
                 ))}
              </div>
           </div>

           {/* FINAL VERDICT NOTES */}
           <div className="space-y-2">
              <div className="flex items-center space-x-2 ml-1">
                 <Info size={14} className="text-indigo-500" />
                 <label className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Final Verdict & Archival Notes</label>
              </div>
              <textarea 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-[11px] font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 h-28 placeholder:text-slate-300 shadow-inner"
                placeholder="State the formal outcome for institutional archives..."
                value={resolutionNotes}
                onChange={e => setResolutionNotes(e.target.value)}
              />
           </div>
        </div>

        {/* FOOTER */}
        <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
           <div className="hidden sm:flex items-center space-x-3 text-slate-400">
              <Clock size={16} />
              <span className="text-[8px] font-black uppercase tracking-widest">Building forensic paper trail</span>
           </div>
           
           <div className="flex items-center gap-3 w-full sm:w-auto">
              <button onClick={onClose} className="flex-1 sm:flex-none px-8 py-3.5 rounded-2xl border border-slate-200 text-slate-400 font-black uppercase tracking-widest text-[9px] hover:bg-white transition-all shadow-sm">Abort Review</button>
              <button 
                onClick={handleFinalize}
                disabled={!selectedPathway || isProcessing}
                className="flex-[2] sm:flex-none px-12 py-3.5 bg-[#0F1135] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[9px] hover:bg-emerald-600 shadow-2xl transition-all flex items-center justify-center space-x-2 disabled:opacity-40 active:scale-[0.98]"
              >
                <ShieldCheck size={16} />
                <span>{isProcessing ? 'SYNCHRONIZING...' : 'AUTHORIZE CLOSE-OUT'}</span>
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default CaseReviewModal;
