
import React from 'react';
import { ShieldCheck, Search, PackageX, ShoppingBag, Hammer, Trash2, ChevronRight, PackageSearch, AlertTriangle, Info, CheckSquare } from 'lucide-react';
import { ToolUsageRecord } from '../../types';

interface ResolutionProtocolModalProps {
  log: ToolUsageRecord;
  onConfirm: (protocol: string) => void;
  onCancel: () => void;
}

const ResolutionProtocolModal: React.FC<ResolutionProtocolModalProps> = ({ log, onConfirm, onCancel }) => {
  const protocols = [
    { id: 'RECOVERED', label: 'Physical Recovery', sub: 'Original asset/pieces found & verified', icon: <Search size={18} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'REPLACED_BY_STAFF', label: 'Staff Replacement', sub: 'Custodian provided new identical units', icon: <PackageX size={18} />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'PROCURED', label: 'Institutional Purchase', sub: 'Company restocked via procurement', icon: <ShoppingBag size={18} />, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'REPAIRED', label: 'Maintenance Restored', sub: 'Technical unit successfully repaired item', icon: <Hammer size={18} />, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'WAIVED', label: 'Institutional Write-off', sub: 'Management approved loss/waiver', icon: <Trash2 size={18} />, color: 'text-rose-600', bg: 'bg-rose-50' }
  ];

  // PROFESSIONAL MANIFEST PARSER
  const parseManifestVariances = (comment?: string) => {
    if (!comment) return { missing: [], damaged: [] };
    const missingMatch = comment.match(/MISSING:\s*([^|\]]+)/);
    const damagedMatch = comment.match(/DAMAGED:\s*([^|\]]+)/);
    
    return {
      missing: missingMatch ? missingMatch[1].split(',').map(s => s.trim()) : [],
      damaged: damagedMatch ? damagedMatch[1].split(',').map(s => s.trim()) : []
    };
  };

  const manifest = parseManifestVariances(log.comment);
  const hasVariances = manifest.missing.length > 0 || manifest.damaged.length > 0;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
           <div className="flex items-center space-x-3">
              <div className="p-2 bg-slate-900 rounded-xl text-white shadow-lg"><ShieldCheck size={18}/></div>
              <div>
                 <h3 className="text-sm font-black uppercase tracking-tight">Resolution Protocol</h3>
                 <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Asset Ref: {log.toolId}</p>
              </div>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
           {/* FORENSIC MANIFEST REVIEW (ONLY FOR MULTI-PART DISCREPANCIES) */}
           {hasVariances && (
             <div className="bg-indigo-50/50 border border-indigo-100 rounded-[1.8rem] p-5 space-y-4 animate-in slide-in-from-top-2">
                <div className="flex items-center space-x-2">
                   <PackageSearch size={16} className="text-indigo-600" />
                   <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Sighting Manifest Recovery</h4>
                </div>
                <div className="space-y-1.5">
                   {manifest.missing.map((p, i) => (
                     <div key={i} className="flex items-center justify-between p-2.5 bg-white border border-indigo-100 rounded-xl shadow-sm">
                        <span className="text-[8.5px] font-black text-rose-600 uppercase">Missing: {p}</span>
                        <CheckSquare size={12} className="text-slate-200" />
                     </div>
                   ))}
                   {manifest.damaged.map((p, i) => (
                     <div key={i} className="flex items-center justify-between p-2.5 bg-white border border-indigo-100 rounded-xl shadow-sm">
                        <span className="text-[8.5px] font-black text-amber-600 uppercase">Damaged: {p}</span>
                        <Hammer size={12} className="text-slate-200" />
                     </div>
                   ))}
                </div>
                <div className="flex items-start space-x-2 text-indigo-400 mt-2">
                   <Info size={12} className="shrink-0 mt-0.5" />
                   <p className="text-[7.5px] font-bold uppercase leading-relaxed italic">
                      Applying a recovery protocol will restore these artifacts to the registry manifest of {log.toolName}.
                   </p>
                </div>
             </div>
           )}

           <div className="space-y-2">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 px-2">Select Institutional SOP:</p>
              {protocols.map(p => (
                <button 
                  key={p.id}
                  onClick={() => onConfirm(p.id)}
                  className="w-full flex items-center p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all text-left group bg-white"
                >
                   <div className={`w-10 h-10 rounded-xl ${p.bg} ${p.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-inner`}>
                      {p.icon}
                   </div>
                   <div className="ml-4 min-w-0">
                      <p className="text-[11px] font-black text-slate-900 uppercase leading-none">{p.label}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase mt-1.5">{p.sub}</p>
                   </div>
                   <ChevronRight size={14} className="ml-auto text-slate-200 group-hover:text-indigo-400" />
                </button>
              ))}
           </div>
        </div>

        <div className="p-4 bg-slate-50 text-center border-t border-slate-100">
           <button onClick={onCancel} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600">Abort Resolution</button>
        </div>
      </div>
    </div>
  );
};

export default ResolutionProtocolModal;
