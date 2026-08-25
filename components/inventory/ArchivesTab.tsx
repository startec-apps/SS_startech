import React, { useState, useMemo } from 'react';
import { 
  PlusCircle, 
  Archive,
  ClipboardList, 
  X,
  ChevronLeft,
  ChevronRight,
  User,
  Image as ImageIcon,
  Calendar,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  CalendarClock,
  Clock,
  ShieldCheck,
  Search,
  ChevronDown,
  History,
  Wrench,
  ShieldAlert,
  Activity,
  ClipboardCheck,
  PackageX,
  ArrowRight,
  Users,
  Timer,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { PhysicalLogbookRecord, ToolUsageRecord, AccessLevel, ToolAsset, Employee } from '../../types';
import ArchiveResolutionModal from './ArchiveResolutionModal';

interface ArchivesTabProps {
  logs: PhysicalLogbookRecord[];
  usageLogs: ToolUsageRecord[]; 
  tools: ToolAsset[];
  masterEmployees: Employee[];
  currentUserLevel: AccessLevel;
  onDigitize: () => void;
  onAuditTarget: (log: PhysicalLogbookRecord) => void;
  onVerify: (log: ToolUsageRecord) => void;
  onResolve: (logId: string, action: any, notes?: string) => void;
  hasPermission: (module: string, action?: any, subHub?: string) => boolean;
}

const ArchivesTab: React.FC<ArchivesTabProps> = ({ 
  logs, 
  usageLogs, 
  tools,
  masterEmployees,
  currentUserLevel,
  onDigitize, 
  onAuditTarget,
  onVerify,
  onResolve,
  hasPermission
}) => {
  const [previewImages, setPreviewImages] = useState<string[] | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VARIANCES' | 'CLEARED'>('ALL');
  const [resolutionTarget, setResolutionTarget] = useState<PhysicalLogbookRecord | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  
  const itemsPerPage = 15;
  const normalizeId = (val: string) => String(val || '').replace(/[^a-z0-9]/gi, '').toLowerCase();

  const filteredByStatus = useMemo(() => {
    return logs.filter(log => {
      const logNormId = normalizeId(log.id);
      const logNormPage = normalizeId(log.pageNumber || '');
      
      const linkedRecords = usageLogs.filter(u => {
        const uLink = normalizeId(u.physicalArchiveId || u.batchId || '');
        const uComment = normalizeId(u.comment || '');
        return (uLink === logNormId || (logNormPage && uComment.includes(logNormPage)));
      });

      const activeIssues = linkedRecords.filter(u => !u.isReturned && u.escalationStatus !== 'Resolved');
      const hasIssues = activeIssues.length > 0;

      if (statusFilter === 'VARIANCES') return hasIssues;
      if (statusFilter === 'CLEARED') return !hasIssues;
      return true;
    });
  }, [logs, usageLogs, statusFilter]);

  const totalPages = Math.ceil(filteredByStatus.length / itemsPerPage);
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return [...filteredByStatus].sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))).slice(start, start + itemsPerPage);
  }, [filteredByStatus, currentPage]);

  const toggleLog = (id: string) => {
    setExpandedLogId(prev => (prev === id ? null : id));
  };

  const getMissingPiecesNames = (item: ToolUsageRecord) => {
    if (!item.comment) return [];
    // Captures pieces after tags like "MISSING:", "UNRETURNED:", etc.
    const match = item.comment.match(/(?:MISSING|UNRETURNED PIECES|CHECK|VARIANCE):\s*([^|\]]+)/i);
    if (!match) return [];
    return match[1].split(',').map(p => p.trim().toUpperCase()).filter(Boolean);
  };

  const getRecordTrace = (item: ToolUsageRecord) => {
    const history = item.actionHistory || [];
    const lastAction = history.length > 0 ? history[history.length - 1] : null;
    
    // Identifies the officer who received the asset back based on historical action keys
    const receiverAction = [...history].reverse().find(a => 
      a.action.includes('RETURN') || 
      a.action.includes('RECOVERY') || 
      a.action.includes('RESOLUTION')
    );

    return {
      protocol: lastAction ? lastAction.action : (item.isReturned ? 'RETURNED' : 'ISSUED'),
      lastUpdate: lastAction ? lastAction.timestamp : null,
      receivingOfficer: receiverAction?.actorName || null
    };
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 max-w-full pb-10">
      {resolutionTarget && (
        <ArchiveResolutionModal 
          archive={resolutionTarget}
          usageLogs={usageLogs}
          tools={tools}
          currentUserLevel={currentUserLevel}
          onVerify={onVerify}
          onResolve={onResolve}
          onClose={() => setResolutionTarget(null)}
        />
      )}

      {previewImages && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
           <button onClick={() => setPreviewImages(null)} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors bg-white/10 p-3 rounded-2xl z-20">
              <X size={24}/>
           </button>
           
           {previewImages.length > 1 && (
             <>
               <button 
                 onClick={() => setPreviewIndex((prev) => (prev > 0 ? prev - 1 : previewImages.length - 1))}
                 className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/10 p-4 rounded-full text-white/50 hover:text-white transition-all z-20"
               >
                 <ChevronLeft size={32} />
               </button>
               <button 
                 onClick={() => setPreviewIndex((prev) => (prev < previewImages.length - 1 ? prev + 1 : 0))}
                 className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/10 p-4 rounded-full text-white/50 hover:text-white transition-all z-20"
               >
                 <ChevronRight size={32} />
               </button>
             </>
           )}

           <div className="relative max-w-full max-h-[90vh] flex flex-col items-center">
             <img src={previewImages[previewIndex]} className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl border border-white/10 animate-in zoom-in-95" alt="Log" />
           </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center space-x-4">
           <div className="w-12 h-12 bg-[#0F1135] rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
              <Archive size={24} />
           </div>
           <div>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">Daily Log Records</h2>
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">Scanned logbook history</p>
           </div>
        </div>

        <div className="flex items-center gap-3">
            <div className="flex bg-slate-50 border border-slate-200 p-1 rounded-xl shadow-inner">
               {[
                 { id: 'ALL', label: 'All' },
                 { id: 'VARIANCES', label: 'Exceptions' },
                 { id: 'CLEARED', label: 'Clear' }
               ].map(btn => (
                 <button
                   key={btn.id}
                   onClick={() => { setStatusFilter(btn.id as any); setCurrentPage(1); }}
                   className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${statusFilter === btn.id ? 'bg-[#0F1135] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                   {btn.label}
                 </button>
               ))}
            </div>
            <button 
                onClick={onDigitize}
                className="bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-black uppercase tracking-[0.15em] text-[9px] hover:bg-[#0F1135] shadow-xl shadow-indigo-100 transition-all flex items-center justify-center space-x-2 active:scale-95"
            >
                <PlusCircle size={14} />
                <span>Upload Daily Log</span>
            </button>
        </div>
      </div>

      <div className="bg-white border border-slate-100 shadow-xl rounded-[2rem] overflow-hidden mx-1">
        <div className="hidden lg:grid grid-cols-12 bg-slate-50/80 backdrop-blur-md text-[8px] font-black text-slate-400 uppercase tracking-[0.25em] border-b border-slate-100 px-8 py-4">
           <div className="col-span-4">Staff Member</div>
           <div className="col-span-5 text-center">Current Status</div>
           <div className="col-span-3 text-right pr-4">Details</div>
        </div>

        <div className="divide-y divide-slate-50">
          {paginatedLogs.length === 0 ? (
            <div className="py-32 text-center">
               <Archive size={48} className="mx-auto text-slate-100 mb-4" />
               <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">No logs found</p>
            </div>
          ) : paginatedLogs.map(log => {
            const isExpanded = expandedLogId === log.id;
            const logNormId = normalizeId(log.id);
            const logNormPage = normalizeId(log.pageNumber || '');
            
            const linkedRecords = usageLogs.filter(u => {
              const uLink = normalizeId(u.physicalArchiveId || u.batchId || '');
              const uComment = normalizeId(u.comment || '');
              return (uLink === logNormId || (logNormPage && uComment.includes(logNormPage)));
            });

            const activeIssues = linkedRecords.filter(u => !u.isReturned && u.escalationStatus !== 'Resolved');
            const hasIssues = activeIssues.length > 0;
            const officerName = log.attendantName || masterEmployees.find(e => e.id === log.attendantId)?.name || "Staff";
            
            const staffGroups = Array.from(new Set(linkedRecords.map(u => u.staffId))).map(staffId => {
               const items = linkedRecords.filter(u => u.staffId === staffId);
               const heldItems = items.filter(i => !i.isReturned);
               const graceItem = items.find(i => i.escalationStatus === 'In-Grace-Period');
               const graceDaysRemaining = graceItem && graceItem.graceExpiryDate ? Math.max(0, Math.ceil((new Date(graceItem.graceExpiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24))) : null;

               return {
                  staffId,
                  staffName: items[0]?.staffName || "Unknown",
                  items,
                  heldCount: heldItems.length,
                  graceDays: graceDaysRemaining
               };
            });

            return (
              <React.Fragment key={log.id}>
                <div 
                  onClick={() => toggleLog(log.id)}
                  className={`group relative p-6 lg:px-8 lg:py-7 hover:bg-indigo-50/20 transition-all cursor-pointer ${isExpanded ? 'bg-indigo-50/30' : ''}`}
                >
                  {log.timestamp && (
                    <div className="absolute top-3 right-8 flex items-center gap-1.5 transition-all">
                       <CalendarClock size={10} className="text-indigo-400" />
                       <span className="text-[7px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100 shadow-sm">
                          Last Update: {log.timestamp}
                       </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                      <div className="col-span-1 lg:col-span-4">
                        <div className="flex items-center space-x-4">
                          <div 
                            onClick={(e) => { e.stopPropagation(); if(log.imageUrls?.length > 0) { setPreviewImages(log.imageUrls); setPreviewIndex(0); } }} 
                            className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center shadow-sm shrink-0 overflow-hidden cursor-zoom-in hover:border-indigo-400 transition-all duration-500"
                          >
                             {log.imageUrls && log.imageUrls[0] ? <img src={log.imageUrls[0]} className="w-full h-full object-cover" alt="log" /> : <ImageIcon size={18} className="text-slate-300" />}
                          </div>
                          <div className="flex flex-col min-w-0">
                              <span className="font-black text-slate-900 text-sm uppercase tracking-tight truncate leading-none">{officerName}</span>
                              <div className="flex items-center gap-1.5 mt-2">
                                 <Clock size={10} className="text-indigo-400" />
                                 <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 shadow-sm">
                                    Date: {log.date}
                                 </span>
                              </div>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-1 lg:col-span-5 text-center flex flex-col items-center">
                         <div className="flex items-center gap-1.5 flex-wrap justify-center">
                            {hasIssues ? (
                              <div className="px-3 py-1 bg-rose-600 text-white border border-rose-600 rounded-lg text-[8px] font-black uppercase flex items-center gap-2 shadow-md">
                                 <AlertCircle size={12} />
                                 {activeIssues.length} UNRETURNED TOOLS
                              </div>
                            ) : (
                              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm">
                                 <CheckCircle2 size={12} />
                                 ALL CLEAR
                              </span>
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
                             Tool History Log
                          </h4>
                       </div>

                       <div className="divide-y divide-slate-100">
                          {staffGroups.length === 0 ? (
                            <div className="py-12 text-center">
                               <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">No entries found for this log.</p>
                            </div>
                          ) : staffGroups.map(group => (
                            <div key={group.staffId} className="bg-white overflow-hidden">
                               <div className="px-8 py-4 bg-indigo-50/40 border-b border-indigo-50 flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                     <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-[9px] shadow-sm uppercase">
                                        {group.staffName.charAt(0)}
                                     </div>
                                     <div>
                                        <p className="text-[13px] font-black text-slate-900 uppercase leading-none">{group.staffName}</p>
                                     </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                     <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-50 rounded text-[7px] font-black uppercase tracking-widest">
                                        {group.items.length} Tools
                                     </span>
                                     {group.heldCount > 0 && (
                                       <span className="px-2 py-0.5 bg-rose-500/80 text-white rounded text-[7px] font-black uppercase shadow-sm">
                                          OUTSTANDING
                                       </span>
                                     )}
                                  </div>
                               </div>

                               <div className="divide-y divide-slate-50">
                                  {group.items.map((item, i) => {
                                     const missingPieces = getMissingPiecesNames(item);
                                     const isVariance = !item.isReturned && (item.conditionOnReturn === 'Lost' || missingPieces.length > 0);
                                     const isCleared = item.isReturned;
                                     const trace = getRecordTrace(item);
                                     const issuingOfficer = item.attendantName || "Staff";
                                     const receivingOfficer = trace.receivingOfficer;
                                     
                                     return (
                                       <div key={i} className={`p-5 flex flex-col hover:bg-slate-50 transition-colors gap-5 ${isVariance ? 'bg-rose-50/10' : ''}`}>
                                          <div className="flex items-center justify-between lg:flex-row flex-col gap-6">
                                             <div className="flex items-center space-x-5 min-w-0 flex-1">
                                                <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 shadow-inner ${isCleared ? 'bg-emerald-50 border-emerald-100 text-emerald-500' : isVariance ? 'bg-rose-50 border-rose-100 text-rose-300' : 'bg-white border-slate-100 text-indigo-200'}`}>
                                                   {isCleared ? <CheckCircle2 size={16} /> : isVariance ? <PackageX size={16} /> : <Wrench size={16} />}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                   <div className="flex flex-wrap items-center gap-2 mb-1">
                                                      <p className={`text-[11px] font-black uppercase truncate leading-none ${isCleared ? 'text-emerald-700' : isVariance ? 'text-rose-700 underline decoration-rose-200' : 'text-slate-800'}`}>
                                                         {item.toolName}
                                                         {!isCleared && (
                                                            <span className={`ml-2 text-[10px] font-black ${isVariance ? 'text-rose-600' : 'text-slate-500'}`}>
                                                               (x{item.quantity})
                                                            </span>
                                                         )}
                                                      </p>
                                                      {isCleared ? (
                                                         <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[6.5px] font-black uppercase shadow-sm">
                                                            RETURNED
                                                         </span>
                                                      ) : isVariance ? (
                                                         <span className="px-2 py-0.5 bg-rose-600 text-white rounded text-[6.5px] font-black uppercase shadow-sm flex items-center gap-1">
                                                            <ShieldAlert size={8}/> VARIANCE
                                                         </span>
                                                      ) : (
                                                         <span className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[6.5px] font-black uppercase shadow-sm">
                                                            HELD
                                                         </span>
                                                      )}
                                                   </div>
                                                   
                                                   {/* UNRETURNED PIECES DISPLAY - Explicitly itemizes missing components from kit */}
                                                   {missingPieces.length > 0 && (
                                                      <div className="mt-2 flex flex-wrap gap-1.5 animate-in slide-in-from-left-2">
                                                         {missingPieces.map((p, idx) => (
                                                            <span key={idx} className="bg-rose-50 text-rose-600 px-2 py-0.5 rounded-lg border border-rose-100 text-[6.5px] font-black uppercase tracking-tighter">
                                                               Unreturned Piece: {p}
                                                            </span>
                                                         ))}
                                                      </div>
                                                   )}

                                                   {/* DUAL OFFICER ATTRIBUTION - Shows who gave it and who took it back */}
                                                   <div className="flex flex-wrap items-center gap-4 mt-3">
                                                      <div className="flex items-center gap-1.5">
                                                         <ArrowUpRight size={12} className="text-indigo-400" />
                                                         <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-tight">
                                                            Issued by: <span className="text-indigo-500 font-black">{issuingOfficer}</span>
                                                         </p>
                                                      </div>
                                                      {isCleared && receivingOfficer && (
                                                        <div className="flex items-center gap-1.5">
                                                           <ArrowDownLeft size={12} className="text-emerald-400" />
                                                           <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-tight">
                                                              Received by: <span className="text-emerald-600 font-black">{receivingOfficer}</span>
                                                           </p>
                                                        </div>
                                                      )}
                                                      <div className="flex items-center gap-1.5">
                                                         <Activity size={12} className="text-slate-300" />
                                                         <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-tight">
                                                            Trace: {trace.protocol.replace(/_/g, ' ')}
                                                         </p>
                                                      </div>
                                                   </div>
                                                </div>
                                             </div>

                                             <div className="flex items-center justify-end gap-3 shrink-0">
                                                {!item.isReturned && (
                                                    <button 
                                                      onClick={(e) => { e.stopPropagation(); onVerify(item); }} 
                                                      className={`px-8 py-3 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 shadow-md ${isVariance ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-[#0F1135] text-white hover:bg-indigo-600'}`}
                                                    >
                                                      <ClipboardCheck size={14} />
                                                      <span>{isVariance ? 'Resolve' : 'Return'}</span>
                                                    </button>
                                                )}
                                                {item.isReturned && (
                                                  <div className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-50">
                                                     <CheckCircle2 size={14} />
                                                     <span className="text-[8px] font-black uppercase">Filing Reconciled</span>
                                                  </div>
                                                )}
                                             </div>
                                          </div>
                                       </div>
                                     );
                                  })}
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
           <div className="flex items-center space-x-3 text-slate-400">
              <span className="text-[8px] font-black uppercase tracking-widest">{filteredByStatus.length} Logs found</span>
           </div>
           
           <div className="flex items-center space-x-2">
              <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all shadow-sm">
                 <ChevronLeft size={16} />
              </button>
              <div className="px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-inner text-center">
                 <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Page {currentPage} of {totalPages || 1}</span>
              </div>
              <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all shadow-sm">
                 <ChevronRight size={16} />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ArchivesTab;