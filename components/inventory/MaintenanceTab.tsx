
import React, { useMemo, useState } from 'react';
import { Hammer, AlertCircle, CheckCircle2, ChevronDown, Wrench, Clock, Activity, History, XCircle, UserCheck, ChevronLeft, ChevronRight, CalendarClock, DollarSign, ShieldAlert, FileText, User, AlertOctagon, RefreshCw, ShieldCheck, AlertTriangle } from 'lucide-react';
import { MaintenanceRecord, MaintenanceStatus, AccessLevel } from '../../types';

interface MaintenanceTabProps {
  maintenanceHistory: MaintenanceRecord[];
  onReport: () => void;
  onResolve: (record: MaintenanceRecord) => void;
  onReassign?: (record: MaintenanceRecord) => void;
  onEscalate?: (id: string, notes: string) => Promise<void>;
  currentUserLevel: AccessLevel;
  currentUser?: { name: string; accessLevel?: string };
  hasPermission: (module: string, action?: any, subHub?: string) => boolean;
}

const MaintenanceTab: React.FC<MaintenanceTabProps> = ({ 
  maintenanceHistory, 
  onReport, 
  onResolve, 
  onReassign, 
  onEscalate, 
  currentUserLevel, 
  currentUser,
  hasPermission 
}) => {
  const [filter, setFilter] = useState<MaintenanceStatus | 'ALL'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  
  const canAdminMaintenance = currentUserLevel === 'Admin' || currentUserLevel === 'Manager' || currentUserLevel === 'Stores';
  const isSupervisorTier = currentUserLevel === 'Admin' || currentUserLevel === 'Manager' || currentUserLevel === 'Supervisor';

  const filteredItems = useMemo(() => {
    const list = filter === 'ALL' ? maintenanceHistory : maintenanceHistory.filter(m => m.status === filter);
    return [...list].sort((a, b) => String(b.reportedDate || '').localeCompare(String(a.reportedDate || '')));
  }, [maintenanceHistory, filter]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getSupervisorName = (notes?: string) => {
    if (!notes) return "SUPERVISOR";
    const match = notes.match(/\[AUTHORIZING SUPERVISOR:?\s*([^\]|]+)\]/i);
    if (match) return match[1].split(' ')[0].toUpperCase();
    const legacyMatch = notes.match(/\[ESCALATED BY:?\s*([^\]]+)\]/i);
    return legacyMatch ? legacyMatch[1].split(' ')[0].toUpperCase() : "SUPERVISOR";
  };

  const getStatusConfig = (status: MaintenanceStatus, isEscalated: boolean, notes?: string) => {
    if (isEscalated && status !== 'Restored' && status !== 'Decommissioned') {
       const supName = getSupervisorName(notes);
       return { 
         label: `SUP. ${supName} ENGAGED`, 
         color: 'text-white bg-rose-600 border-rose-700 shadow-md animate-pulse', 
         icon: <ShieldCheck size={12}/> 
       };
    }
    switch (status) {
      case 'Staged': return { label: 'PENDING EVALUATION', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: <AlertCircle size={12}/> };
      case 'In_Repair': return { label: 'IN REPAIR PHASE', color: 'text-indigo-600 bg-indigo-50 border-indigo-100', icon: <Activity size={12}/> };
      case 'Restored': return { label: 'RESTORED TO STORE', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: <CheckCircle2 size={12}/> };
      case 'Decommissioned': return { label: 'DECOMMISSIONED', color: 'text-rose-600 bg-rose-50 border-rose-100', icon: <XCircle size={12}/> };
      default: return { label: 'UNKNOWN', color: 'text-slate-400 bg-slate-50', icon: null };
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 max-w-full pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm mx-1">
        <div className="flex items-center space-x-4">
           <div className="w-12 h-12 bg-[#0F1135] rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
              <Hammer size={24} />
           </div>
           <div>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">Maintenance Records</h2>
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">Asset Technical Health Ledger</p>
           </div>
        </div>

        <div className="flex items-center gap-3">
            <div className="flex bg-slate-50 border border-slate-200 p-1 rounded-xl shadow-inner">
               {['ALL', 'Staged', 'In_Repair', 'Restored', 'Decommissioned'].map(s => (
                 <button
                   key={s}
                   onClick={() => { setFilter(s as any); setCurrentPage(1); }}
                   className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${filter === s ? 'bg-[#0F1135] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                   {s === 'ALL' ? 'All' : s.replace('_', ' ')}
                 </button>
               ))}
            </div>
            <button 
                onClick={onReport}
                className="bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-black uppercase tracking-[0.15em] text-[9px] hover:bg-[#0F1135] shadow-xl shadow-indigo-100 transition-all flex items-center justify-center space-x-2 active:scale-95"
            >
                <AlertCircle size={14} />
                <span>Report Breakdown</span>
            </button>
        </div>
      </div>

      <div className="bg-white border border-slate-100 shadow-xl rounded-[2rem] overflow-hidden mx-1">
        <div className="hidden lg:grid grid-cols-12 bg-slate-50/80 backdrop-blur-md text-[8px] font-black text-slate-400 uppercase tracking-[0.25em] border-b border-slate-100 px-8 py-4">
           <div className="col-span-4">Asset Identification</div>
           <div className="col-span-5 text-center">Current Status</div>
           <div className="col-span-3 text-right pr-4">Details</div>
        </div>

        <div className="divide-y divide-slate-50">
          {paginatedItems.length === 0 ? (
            <div className="py-32 text-center">
               <History size={48} className="mx-auto text-slate-100 mb-4" />
               <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">No Records Found</p>
            </div>
          ) : paginatedItems.map(m => {
            const isExpanded = expandedId === m.id;
            const statusConfig = getStatusConfig(m.status, !!m.isEscalatedToSupervisor, m.escalationNotes);
            
            return (
              <React.Fragment key={m.id}>
                <div 
                  onClick={() => setExpandedId(isExpanded ? null : m.id)}
                  className={`group relative p-6 lg:px-8 lg:py-7 hover:bg-indigo-50/20 transition-all cursor-pointer ${isExpanded ? 'bg-indigo-50/30' : ''}`}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                      <div className="col-span-1 lg:col-span-4">
                        <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs uppercase shadow-sm border ${m.status === 'Restored' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : m.status === 'Decommissioned' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-indigo-600 border-slate-100'}`}>
                            {m.status === 'Decommissioned' ? <XCircle size={18} /> : <Wrench size={18} />}
                          </div>
                          <div className="flex flex-col min-w-0">
                              <span className="font-black text-slate-900 text-sm uppercase tracking-tight truncate leading-none">{m.toolName}</span>
                              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                 <Clock size={10} className="text-indigo-400" />
                                 <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 shadow-sm">
                                    {m.reportedDate}
                                 </span>
                                 <span className="text-slate-300 text-[8px]">•</span>
                                 <div className="flex items-center gap-1">
                                    <User size={10} className="text-indigo-400" />
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[120px]">
                                       REPORTED BY: <span className="text-slate-700 font-bold">{m.reportedBy || 'SYSTEM'}</span>
                                    </span>
                                 </div>
                              </div>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-1 lg:col-span-5 text-center flex flex-col items-center">
                         <div className="flex items-center gap-1.5 flex-wrap justify-center">
                            <div className={`px-3 py-1 rounded-lg border flex items-center gap-2 text-[8px] font-black uppercase tracking-widest shadow-sm transition-all ${statusConfig.color}`}>
                               {statusConfig.icon}
                               {statusConfig.label}
                            </div>
                            {m.isEscalatedToSupervisor && (
                               <div className="px-3 py-1 bg-rose-600 text-white rounded-lg text-[8px] font-black uppercase flex items-center gap-2 shadow-md animate-pulse">
                                  <ShieldAlert size={12} />
                                  COMMAND OVERSIGHT
                               </div>
                            )}
                         </div>
                      </div>

                      <div className="col-span-1 lg:col-span-3 text-right pr-4">
                         <div className={`transition-transform duration-500 inline-block ${isExpanded ? 'rotate-180 text-indigo-600' : 'text-slate-400'}`}>
                            <ChevronDown size={24} strokeWidth={3} />
                         </div>
                      </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="bg-slate-50 border-y border-slate-100 p-6 lg:px-12 animate-in slide-in-from-top-4 duration-500 shadow-inner">
                    <div className="bg-white border border-slate-200 rounded-[2.2rem] overflow-hidden shadow-xl max-w-5xl mx-auto">
                       <div className="px-8 py-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                          <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                             <History size={16} className="text-slate-300" />
                             Technical Service Log
                          </h4>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">REF: {m.id.split('-').pop()}</span>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                          <div className="md:col-span-5 p-6 space-y-5">
                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-indigo-600">
                                   <AlertTriangle size={14} />
                                   <span className="text-[9px] font-black uppercase tracking-widest">Incident Context</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-100 rounded text-[7px] font-black uppercase">
                                   <User size={10} className="text-indigo-400" />
                                   Reporter: {m.reportedBy}
                                </div>
                             </div>
                             <div className="bg-slate-50 p-5 rounded-[1.5rem] border border-slate-100 shadow-inner">
                                <p className="text-[11px] font-medium text-slate-600 italic leading-relaxed">
                                   "{m.breakdownContext}"
                                </p>
                             </div>
                             
                             {m.isEscalatedToSupervisor && (
                                <div className="p-5 bg-slate-900 text-white rounded-[1.8rem] shadow-lg space-y-4 animate-in zoom-in-95 border-l-4 border-rose-600">
                                   <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                         <ShieldAlert size={14} className="text-rose-500" />
                                         <span className="text-[9px] font-black uppercase tracking-widest text-slate-200">Governance Active</span>
                                      </div>
                                      <span className="text-[7px] font-black px-1.5 py-0.5 bg-rose-600 rounded uppercase">SOP Protocol</span>
                                   </div>
                                   <div className="space-y-1">
                                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Authorized By:</p>
                                      <p className="text-[10px] font-black text-white uppercase">{getSupervisorName(m.escalationNotes)}</p>
                                   </div>
                                   <div className="pt-3 border-t border-white/10">
                                      <p className="text-[10px] font-medium italic text-slate-300 leading-relaxed">
                                         "{m.escalationNotes?.includes(']') ? m.escalationNotes.split(']').pop()?.trim() : m.escalationNotes || 'Administrative directive issued.'}"
                                      </p>
                                   </div>
                                </div>
                             )}
                          </div>

                          <div className="md:col-span-7 p-6 space-y-5">
                             <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-2 text-indigo-600">
                                   <Activity size={14} />
                                   <span className="text-[9px] font-black uppercase tracking-widest">Repair Operations</span>
                                </div>
                                {m.resolutionDate && (
                                   <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[7px] font-black uppercase">
                                      <CheckCircle2 size={10} /> Certified: {m.resolutionDate}
                                   </div>
                                )}
                             </div>

                             <div className="space-y-4">
                                {m.technicianNotes ? (
                                   <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                                      <p className="text-[10px] font-bold text-slate-800 leading-relaxed">
                                         {m.technicianNotes}
                                      </p>
                                   </div>
                                ) : (
                                   <div className="py-12 flex flex-col items-center justify-center text-center opacity-30 grayscale space-y-2">
                                      <Wrench size={32} className="text-slate-300" />
                                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Operational Phase Active</p>
                                   </div>
                                )}
                                
                                <div className="grid grid-cols-2 gap-4">
                                   <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                                      <div>
                                         <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Repair Cost</p>
                                         <span className="text-[12px] font-black text-slate-900 tabular-nums">${m.estimatedCost || '0.00'}</span>
                                      </div>
                                      <DollarSign size={16} className="text-slate-200" />
                                   </div>
                                   <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                                      <div className="min-w-0">
                                         <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Assigned Tech</p>
                                         <p className="text-[10px] font-black text-slate-800 uppercase truncate mt-0.5">{m.assignedStaffName || 'NOT_ASSIGNED'}</p>
                                      </div>
                                      <UserCheck size={16} className="text-indigo-400" />
                                   </div>
                                </div>
                             </div>

                             {(m.status === 'Staged' || m.status === 'In_Repair') && (canAdminMaintenance || (isSupervisorTier && m.isEscalatedToSupervisor)) && (
                                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-50">
                                   {isSupervisorTier && m.isEscalatedToSupervisor && onReassign && (
                                      <button 
                                         onClick={(e) => { e.stopPropagation(); onReassign(m); }}
                                         className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-[#0F1135] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg"
                                      >
                                         <RefreshCw size={16} />
                                         <span>Reassign Task</span>
                                      </button>
                                   )}
                                   <button 
                                      onClick={(e) => { e.stopPropagation(); onResolve(m); }}
                                      className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg"
                                   >
                                      <CheckCircle2 size={16} />
                                      <span>Execute Resolution</span>
                                   </button>
                                </div>
                             )}
                          </div>
                       </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
           <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Technical Logs Archived: {filteredItems.length} Instances</span>
           <div className="flex items-center space-x-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all shadow-sm">
                 <ChevronLeft size={16} />
              </button>
              <div className="px-5 py-2 bg-white border border-slate-200 rounded-lg shadow-inner text-center">
                 <span className="text-[9px] font-black text-slate-900 uppercase">Page {currentPage} of {totalPages || 1}</span>
              </div>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all shadow-sm">
                 <ChevronRight size={16} />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceTab;
