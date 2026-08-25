import React, { useState, useMemo } from 'react';
import { 
  X, 
  FileText, 
  ChevronDown, 
  CheckCircle2, 
  ShieldCheck, 
  AlertTriangle, 
  Wrench, 
  Timer, 
  History,
  Clock,
  Search,
  Hammer,
  PackageX,
  ShieldAlert,
  ChevronRight,
  User,
  ShieldX,
  Database,
  Flag,
  Briefcase,
  MonitorCheck,
  ArrowRight,
  Calendar
} from 'lucide-react';
import { ToolUsageRecord, PhysicalLogbookRecord, AccessLevel, ToolAsset, ToolCondition, EscalationStage } from '../../types';

interface ArchiveResolutionModalProps {
  archive: PhysicalLogbookRecord;
  usageLogs: ToolUsageRecord[];
  tools: ToolAsset[];
  currentUserLevel: AccessLevel;
  onVerify: (log: ToolUsageRecord, initialCondition?: ToolCondition) => void;
  onResolve: (logId: string, action: any, notes?: string) => void;
  onClose: () => void;
}

const ArchiveResolutionModal: React.FC<ArchiveResolutionModalProps> = ({ 
  archive, 
  usageLogs, 
  tools,
  currentUserLevel,
  onVerify, 
  onResolve, 
  onClose 
}) => {
  const [expandedStaffIds, setExpandedStaffIds] = useState<Set<string>>(new Set());
  const [notesInput, setNotesInput] = useState<Record<string, string>>({});
  
  const isSupervisor = currentUserLevel === 'Supervisor' || currentUserLevel === 'Admin' || currentUserLevel === 'Manager';
  const isManager = currentUserLevel === 'Manager' || currentUserLevel === 'Admin';

  const normalizeId = (val: string) => String(val || '').replace(/[^a-z0-9]/gi, '').toLowerCase();
  const extractNumericTrace = (val: string) => String(val || '').replace(/[^0-9]/g, '');
  const cleanDate = (dateStr: string) => String(dateStr || '').split(' ')[0].split('T')[0];

  const linkedIssues = useMemo(() => {
    const logNormId = normalizeId(archive.id);
    const logTrace = extractNumericTrace(archive.id);
    
    return usageLogs.filter(u => {
      if (u.escalationStatus === 'Resolved') return false;
      const uLink = normalizeId(u.physicalArchiveId || u.batchId || '');
      const uTrace = extractNumericTrace(u.physicalArchiveId || u.batchId || '');
      const uComment = normalizeId(u.comment || '');
      
      // Multi-layer match: Exact ID, Numeric Trace, or Comment reference
      return uLink === logNormId || 
             (logTrace && uTrace === logTrace) || 
             (archive.pageNumber && uComment.includes(normalizeId(archive.pageNumber)));
    });
  }, [usageLogs, archive]);

  const groupedIssues = useMemo(() => {
    const groups: Record<string, { staffName: string; staffId: string; items: ToolUsageRecord[]; isAttendantFallback?: boolean }> = {};
    linkedIssues.forEach(item => {
      const isFallback = !item.staffId || item.staffId === 'UNIDENTIFIED' || item.staffId === 'Audit-Attendant';
      const effectiveId = isFallback ? (archive.attendantId || 'SYSTEM-VAR') : item.staffId;
      const effectiveName = isFallback ? (archive.attendantName || 'Stores Attendant (Fallback)') : item.staffName;

      if (!groups[effectiveId]) {
        groups[effectiveId] = { staffName: effectiveName, staffId: effectiveId, items: [], isAttendantFallback: isFallback };
      }
      groups[effectiveId].items.push(item);
    });
    return Object.values(groups).sort((a, b) => b.items.length - a.items.length);
  }, [linkedIssues, archive]);

  const toggleStaff = (id: string) => {
    setExpandedStaffIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const parseMissingPieces = (comment?: string) => {
    if (!comment) return [];
    const match = comment.match(/(?:MISSING(?:\sPIECES)?|PARTIAL(?:\sKIT\sISSUANCE)?):\s*([^|\]]+)/i);
    if (!match) return [];
    return match[1].split(',').map(p => p.trim().toUpperCase()).filter(Boolean);
  };

  const getPriority = (item: ToolUsageRecord) => {
    const value = item.monetaryValue || 0;
    const isLost = item.conditionOnReturn === 'Lost' || (item.comment || '').toUpperCase().includes('LOST');
    if (isLost || value > 200) return { label: 'CRITICAL', color: 'bg-rose-600 text-white shadow-rose-200' };
    if (value > 50 || item.conditionOnReturn === 'Damaged') return { label: 'HIGH', color: 'bg-amber-50 text-white shadow-amber-200' };
    return { label: 'STANDARD', color: 'bg-slate-900 text-white shadow-slate-200' };
  };

  const getStageMetadata = (stage: EscalationStage = 'Store') => {
    switch (stage) {
      case 'Store': return { label: 'At Store Level', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' };
      case 'Supervisor': return { label: 'Escalated: Supervisor', color: 'bg-amber-50 text-amber-600 border-amber-100' };
      case 'Manager': return { label: 'Escalated: Manager', color: 'bg-rose-50 text-rose-600 border-rose-100' };
      default: return { label: 'Pending', color: 'bg-slate-50 text-slate-400' };
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="relative bg-[#F8FAFF] w-full max-w-5xl rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><FileText size={24} /></div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">Logbook Exception Management</h3>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-2">Archive Ref: {archive.pageNumber || archive.id} • {cleanDate(archive.date)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-900 transition-colors"><X size={24} /></button>
        </div>

        <div className="bg-amber-50/50 border-b border-amber-100 px-8 py-3 flex items-center justify-between shrink-0">
           <div className="flex items-center space-x-3">
              <MonitorCheck size={14} className="text-amber-600" />
              <p className="text-[8px] font-black text-amber-700 uppercase tracking-[0.1em]">
                 Select "Recovery Verified" to launch the <span className="underline decoration-2">SOP Verification Checklist</span> for any asset below.
              </p>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-6">
           {groupedIssues.length === 0 ? (
             <div className="py-32 flex flex-col items-center justify-center bg-white rounded-[2.5rem] border border-slate-100">
                <Database size={48} className="text-slate-100 mb-4" />
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">All Exceptions Reconciled</p>
             </div>
           ) : (
             <div className="space-y-4">
               {groupedIssues.map(group => (
                 <div key={group.staffId} className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
                    <button 
                      onClick={() => toggleStaff(group.staffId)}
                      className={`w-full flex items-center justify-between px-8 py-5 transition-all ${expandedStaffIds.has(group.staffId) ? 'bg-indigo-50/20' : 'hover:bg-slate-50'}`}
                    >
                       <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shadow-inner border ${group.isAttendantFallback ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-indigo-600 border-slate-100'}`}>
                             {group.isAttendantFallback ? <ShieldAlert size={18}/> : <User size={18}/>}
                          </div>
                          <div className="text-left">
                             <p className="text-[11px] font-black text-slate-900 uppercase">{group.staffName}</p>
                             <p className="text-[7.5px] font-bold text-slate-400 uppercase mt-1 tracking-widest">
                               ID: {group.staffId} • {group.items.length} Pending Exceptions
                             </p>
                          </div>
                       </div>
                       <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${expandedStaffIds.has(group.staffId) ? 'bg-indigo-600 text-white shadow-lg rotate-180' : 'bg-slate-50 text-slate-300'}`}>
                          <ChevronDown size={18} strokeWidth={3} />
                       </div>
                    </button>

                    {expandedStaffIds.has(group.staffId) && (
                      <div className="px-8 pb-6 space-y-4 animate-in slide-in-from-top-2">
                        <div className="h-px w-full bg-slate-50 mb-2"></div>
                        {group.items.map(item => {
                           const meta = getStageMetadata(item.escalationStage);
                           const priority = getPriority(item);
                           const missingPieces = parseMissingPieces(item.comment);
                           const isLost = item.conditionOnReturn === 'Lost' || (item.comment || '').toUpperCase().includes('LOST');
                           const isDamaged = item.conditionOnReturn === 'Damaged' || (item.comment || '').toUpperCase().includes('DAMAGED');
                           const isActuallyReturned = item.isReturned;

                           return (
                             <div key={item.id} className={`bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-4 hover:border-indigo-200 transition-all ${isActuallyReturned ? 'bg-emerald-50/5 border-emerald-100' : ''}`}>
                                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                                   <div className="flex items-center space-x-4 min-w-0 flex-1">
                                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-inner ${isActuallyReturned ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : isLost ? 'bg-rose-50 border-rose-100 text-rose-600' : isDamaged ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-white text-indigo-400'}`}>
                                         {isActuallyReturned ? <CheckCircle2 size={18}/> : isLost ? <PackageX size={18}/> : isDamaged ? <Hammer size={18}/> : <Wrench size={18}/>}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                         <div className="flex items-center gap-2">
                                            <p className={`text-[9.5px] font-black uppercase truncate leading-none ${isActuallyReturned ? 'text-emerald-700' : 'text-slate-900'}`}>{item.toolName}</p>
                                            {isActuallyReturned ? (
                                              <span className="px-1.5 py-0.5 rounded text-[6.5px] font-black uppercase bg-emerald-600 text-white shadow-sm flex items-center gap-1">
                                                 <ShieldCheck size={8}/> RESTORED
                                              </span>
                                            ) : (
                                              <span className={`px-1.5 py-0.5 rounded text-[6.5px] font-black uppercase border ${priority.color}`}>
                                                 <Flag size={8} className="inline mr-1" /> {priority.label}
                                              </span>
                                            )}
                                         </div>
                                         <div className="flex items-center space-x-3 mt-1.5">
                                            <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded border tracking-widest ${isActuallyReturned ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : meta.color}`}>{isActuallyReturned ? 'CLEARED' : meta.label}</span>
                                            <div className="flex items-center space-x-1 text-[7px] font-bold text-slate-400 uppercase tracking-widest">
                                               <Calendar size={10} className="text-slate-300" />
                                               <span>Filing Date: {cleanDate(item.date)}</span>
                                            </div>
                                            {!isActuallyReturned && <span className="text-[7px] font-black text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">Qty Missing: {item.quantity}</span>}
                                         </div>
                                      </div>
                                   </div>

                                   <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                                      {isActuallyReturned ? (
                                         <div className="flex items-center space-x-2 px-6 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shadow-inner">
                                            <CheckCircle2 size={14} />
                                            <span className="text-[8px] font-black uppercase">Verified Restored</span>
                                         </div>
                                      ) : (
                                         <>
                                            <button 
                                              onClick={() => onVerify(item)}
                                              className="flex-1 lg:flex-none px-5 py-2 bg-emerald-600 text-white rounded-xl text-[8px] font-black uppercase tracking-widest shadow-lg hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                                            >
                                               <ShieldCheck size={14} />
                                               <span>Recovery Verified</span>
                                            </button>

                                            {isSupervisor && item.escalationStage === 'Supervisor' && (
                                               <button 
                                                  onClick={() => onResolve(item.id, 'sup_confirm_loss', notesInput[item.id])}
                                                  className="flex-1 lg:flex-none px-5 py-2 bg-indigo-600 text-white rounded-xl text-[8px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center space-x-2"
                                               >
                                                  <Timer size={14}/> <span>Grant 30D Grace</span>
                                               </button>
                                            )}

                                            {isManager && item.escalationStage === 'Manager' && (
                                               <button 
                                                  onClick={() => onResolve(item.id, 'hr_escalate', notesInput[item.id])}
                                                  className="flex-1 lg:flex-none px-5 py-2 bg-rose-600 text-white rounded-xl text-[8px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center space-x-2"
                                               >
                                                  <ShieldAlert size={14}/> <span>HR Determination</span>
                                               </button>
                                            )}
                                         </>
                                      )}
                                   </div>
                                </div>

                                {!isActuallyReturned && (
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-1.5">
                                         <label className="text-[7px] font-black text-slate-300 uppercase tracking-widest ml-1">Case Context Notes</label>
                                         <textarea 
                                            className="w-full bg-white border border-slate-100 rounded-xl p-3 text-[9px] font-medium text-slate-500 outline-none h-16 shadow-inner"
                                            placeholder="Record final resolution notes here..."
                                            value={notesInput[item.id] || ''}
                                            onChange={(e) => setNotesInput({...notesInput, [item.id]: e.target.value})}
                                         />
                                      </div>
                                      <div className="bg-white border border-slate-100 rounded-xl p-3 overflow-hidden shadow-inner flex flex-col">
                                         <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest mb-2">Internal Sighting Archive</p>
                                         {missingPieces.length > 0 ? (
                                            <div className="flex flex-wrap gap-1 mt-1">
                                               {missingPieces.map(p => (
                                                  <span key={p} className="px-1.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded text-[6.5px] font-black uppercase">
                                                     MISSING: {p}
                                                  </span>
                                               ))}
                                            </div>
                                         ) : (
                                            <p className="text-[9px] font-medium text-slate-400 italic line-clamp-2 leading-relaxed">
                                               "{item.comment || 'No contextual data provided during digitization.'}"
                                            </p>
                                         )}
                                      </div>
                                   </div>
                                )}
                             </div>
                           );
                        })}
                      </div>
                    )}
                 </div>
               ))}
             </div>
           )}
        </div>

        <div className="px-8 py-5 bg-slate-900 border-t border-white/5 flex items-center justify-between shrink-0">
           <div className="flex items-center space-x-3 text-slate-500">
              <ShieldAlert size={16} />
              <p className="text-[8px] font-black uppercase tracking-widest">SOP Protocol: Verified Identity Custodianship • Trace-Linked</p>
           </div>
           <button onClick={onClose} className="px-10 py-3 bg-white text-slate-900 rounded-xl text-[9px] font-black uppercase shadow-xl hover:bg-slate-50 transition-all active:scale-95">Close Case Review</button>
        </div>
      </div>
    </div>
  );
};

export default ArchiveResolutionModal;