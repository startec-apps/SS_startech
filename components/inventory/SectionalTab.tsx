
import React, { useState, useMemo } from 'react';
import { 
  HardHat, 
  PlusCircle, 
  ChevronDown, 
  Wrench, 
  Clock, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  Box, 
  ClipboardCheck,
  AlertTriangle,
  History,
  ShieldCheck,
  UserCheck,
  CalendarClock,
  ShieldAlert,
  Timer,
  Hammer,
  PackageX,
  ArrowUpRight,
  ArrowDownLeft,
  Activity,
  Layers,
  Check,
  X
} from 'lucide-react';
import { ToolUsageRecord, ToolCondition, Employee, ToolAsset } from '../../types';

interface SectionalTabProps {
  logs: ToolUsageRecord[];
  tools?: ToolAsset[];
  staffRegistry?: Employee[];
  onIssue: () => void;
  onVerify?: (log: ToolUsageRecord, initialCondition?: ToolCondition) => void;
  hasPermission: (module: string, action?: any, subHub?: string) => boolean;
}

const SectionalTab: React.FC<SectionalTabProps> = ({ logs, tools = [], staffRegistry = [], onIssue, onVerify, hasPermission }) => {
  const [expandedStaffId, setExpandedStaffId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VARIANCES' | 'CLEARED'>('ALL');
  const itemsPerPage = 15;

  const canIssue = hasPermission('inventory', 'create', 'sectional') || hasPermission('inventory', 'create');
  const canVerifyReturn = hasPermission('inventory', 'update', 'sectional') || hasPermission('inventory', 'update');

  const sectionalHeldLogs = useMemo(() => 
    logs.filter(l => String(l.issuanceType || '').toLowerCase().includes('section')),
    [logs]
  );

  const parseArtifactVariances = (comment?: string) => {
    if (!comment) return { missing: [], damaged: [] };
    const missingMatch = comment.match(/(?:MISSING|UNRETURNED PIECES|CHECK):\s*([^|\]]+)/i);
    const damagedMatch = comment.match(/DAMAGED:\s*([^|\]]+)/i);
    
    return {
      missing: missingMatch ? missingMatch[1].split(',').map(s => s.trim().toUpperCase()) : [],
      damaged: damagedMatch ? damagedMatch[1].split(',').map(s => s.trim().toUpperCase()) : []
    };
  };

  const getRecordTrace = (item: ToolUsageRecord) => {
    const history = item.actionHistory || [];
    const lastAction = history.length > 0 ? history[history.length - 1] : null;
    const receiverAction = [...history].reverse().find(a => 
      a.action.includes('RETURN') || 
      a.action.includes('RECOVERY') || 
      a.action.includes('RESOLUTION')
    );

    return {
      protocol: lastAction ? lastAction.action : (item.isReturned ? 'RECONCILED' : 'DISPATCHED'),
      lastUpdate: lastAction ? lastAction.timestamp : null,
      receivingOfficer: receiverAction?.actorName || null
    };
  };

  const resolveOfficerName = (id: string, name?: string) => {
    if (name && name.toUpperCase() !== 'SYSTEM' && name.trim() !== '') return name;
    const found = staffRegistry.find(e => e.id === id);
    return found ? found.name : (name || 'OFFICER');
  };

  const groupedByStaff = useMemo(() => {
    const groups: Record<string, { staffName: string; staffId: string; items: ToolUsageRecord[] }> = {};
    const sortedLogs = [...sectionalHeldLogs];

    sortedLogs.forEach(log => {
      if (!groups[log.staffId]) {
        groups[log.staffId] = { staffName: log.staffName, staffId: log.staffId, items: [] };
      }
      groups[log.staffId].items.push(log);
    });

    return Object.values(groups).filter(group => {
      const heldItems = group.items.filter(i => !i.isReturned);
      const hasVariance = heldItems.some(i => i.conditionOnReturn === 'Lost' || parseArtifactVariances(i.comment).missing.length > 0);
      const isCleared = group.items.every(i => i.isReturned);

      if (statusFilter === 'VARIANCES') return hasVariance;
      if (statusFilter === 'CLEARED') return isCleared;
      return true;
    }).sort((a, b) => {
      // PRIMARY SORT: Personnel with active holdings or variances to the top
      const heldA = a.items.filter(i => !i.isReturned).length;
      const heldB = b.items.filter(i => !i.isReturned).length;
      
      const varA = a.items.some(i => !i.isReturned && (i.conditionOnReturn === 'Lost' || parseArtifactVariances(i.comment).missing.length > 0));
      const varB = b.items.some(i => !i.isReturned && (i.conditionOnReturn === 'Lost' || parseArtifactVariances(i.comment).missing.length > 0));

      if (varA !== varB) return varA ? -1 : 1;
      if (heldA !== heldB) return heldB - heldA;
      
      return b.items.length - a.items.length;
    });
  }, [sectionalHeldLogs, statusFilter]);

  const totalPages = Math.ceil(groupedByStaff.length / itemsPerPage);
  const paginatedGroups = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return groupedByStaff.slice(start, start + itemsPerPage);
  }, [groupedByStaff, currentPage]);

  const toggleStaff = (id: string) => {
    setExpandedStaffId(prev => (prev === id ? null : id));
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 max-w-full">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-1 mb-2">
         <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-[#0F1135] rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
               <HardHat size={24} />
            </div>
            <div>
               <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">Tools with Staff</h3>
               <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">Track who has what tools</p>
            </div>
         </div>
         <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
               {[
                 { id: 'ALL', label: 'All' },
                 { id: 'VARIANCES', label: 'Exceptions' },
                 { id: 'CLEARED', label: 'Verified' }
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
            {canIssue && (
              <button 
                onClick={onIssue} 
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-black uppercase text-[9px] hover:bg-[#0F1135] transition-all flex items-center gap-2 shadow-lg"
              >
                <PlusCircle size={14}/> 
                <span>Issue Tools</span>
              </button>
            )}
         </div>
      </div>

      <div className="bg-white border border-slate-100 shadow-xl rounded-[2rem] overflow-hidden mx-1">
        <div className="hidden lg:grid grid-cols-12 bg-slate-50/80 backdrop-blur-md text-[8px] font-black text-slate-400 uppercase tracking-[0.25em] border-b border-slate-100 px-8 py-4">
           <div className="col-span-4">Staff Personnel</div>
           <div className="col-span-5 text-center">Status</div>
           <div className="col-span-3 text-right pr-4">Details</div>
        </div>

        <div className="divide-y divide-slate-50">
          {paginatedGroups.length === 0 ? (
            <div className="py-32 text-center">
               <Box size={48} className="mx-auto mb-4 text-slate-100 opacity-50" />
               <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No Active Records</p>
            </div>
          ) : paginatedGroups.map(group => {
            const isExpanded = expandedStaffId === group.staffId;
            const heldItems = group.items.filter(i => !i.isReturned);
            const isFullyReturned = group.items.every(i => i.isReturned);
            
            const latestLog = group.items[0]; 
            const primaryIssuanceDate = latestLog?.date || '---';
            const primaryIssuerName = resolveOfficerName(latestLog?.attendantId || '', latestLog?.attendantName);

            const graceItem = group.items.find(i => i.escalationStatus === 'In-Grace-Period');
            const graceDaysRemaining = graceItem && graceItem.graceExpiryDate ? Math.max(0, Math.ceil((new Date(graceItem.graceExpiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24))) : null;
            const varianceTools = heldItems.filter(i => i.conditionOnReturn === 'Lost' || parseArtifactVariances(i.comment).missing.length > 0);

            // Calculate tools held hint
            const heldToolsHint = heldItems.length > 0 
              ? heldItems.map(i => i.toolName).join(', ')
              : '';

            // INTERNAL SORTING: Unreturned items to the top within the staff detail view
            const sortedGroupItems = [...group.items].sort((a, b) => {
              if (a.isReturned !== b.isReturned) return a.isReturned ? 1 : -1;
              return new Date(b.date).getTime() - new Date(a.date).getTime();
            });

            return (
              <React.Fragment key={group.staffId}>
                <div 
                  onClick={() => toggleStaff(group.staffId)}
                  className={`group relative p-6 lg:px-8 lg:py-7 hover:bg-indigo-50/20 transition-all duration-300 cursor-pointer ${isExpanded ? 'bg-indigo-50/30' : ''}`}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                      <div className="col-span-1 lg:col-span-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg uppercase shadow-md transition-transform group-hover:scale-110 duration-500">
                            {group.staffName.charAt(0)}
                          </div>
                          <div className="flex flex-col min-w-0">
                              <span className="font-black text-slate-900 text-sm uppercase tracking-tight leading-none mb-2">{group.staffName}</span>
                              <div className="flex flex-wrap items-center gap-2">
                                 <div className="flex items-center gap-1.5 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                                    <Clock size={10} className="text-indigo-600" />
                                    <span className="text-[8px] font-black text-indigo-700 uppercase tracking-widest">
                                       ISSUED: {primaryIssuanceDate}
                                    </span>
                                 </div>
                                 <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-sm">
                                    <UserCheck size={10} className="text-indigo-600" />
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                       ISSUER: <span className="text-indigo-600">{primaryIssuerName}</span>
                                    </span>
                                 </div>
                              </div>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-1 lg:col-span-5 text-center flex flex-col items-center">
                        <div className="flex items-center gap-2 flex-wrap justify-center">
                           {isFullyReturned ? (
                             <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm">
                                <CheckCircle2 size={12} />
                                RETURNED
                             </span>
                           ) : (
                             <span className="px-3 py-1.5 bg-indigo-600 text-white border border-indigo-700 rounded-xl text-[8px] font-black uppercase tracking-widest shadow-md">
                                {heldItems.length} TOOLS HELD
                             </span>
                           )}

                           {varianceTools.length > 0 && (
                             <div className="px-3 py-1.5 bg-rose-600 text-white border border-rose-600 rounded-xl text-[8px] font-black uppercase flex items-center gap-2 shadow-md animate-pulse">
                                <AlertTriangle size={12} />
                                ISSUE FOUND
                             </div>
                           )}

                           {graceDaysRemaining !== null && (
                             <div className="px-3 py-1.5 bg-amber-500 text-white rounded-xl text-[8px] font-black uppercase flex items-center gap-2 shadow-lg animate-pulse">
                                <Timer size={12} />
                                {graceDaysRemaining} DAYS TO REPLACE
                             </div>
                           )}
                        </div>
                        {/* FAINT TOOLS HELD HINT */}
                        {!isFullyReturned && !isExpanded && (
                           <p className="text-[7px] font-medium text-slate-300 uppercase tracking-tighter truncate max-w-[250px] mt-2 italic group-hover:text-slate-400 transition-colors">
                              {heldToolsHint}
                           </p>
                        )}
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
                          <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                             <History size={16} className="text-indigo-600" />
                             Tool List
                          </h4>
                          <div className="flex items-center gap-4">
                             <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest">Personnel: {group.staffName}</span>
                          </div>
                       </div>
                       <div className="divide-y divide-slate-50">
                          {sortedGroupItems.map((item, i) => {
                             const variances = parseArtifactVariances(item.comment);
                             const isVariance = item.conditionOnReturn === 'Lost' || variances.missing.length > 0;
                             const isCleared = item.isReturned;
                             const trace = getRecordTrace(item);
                             const issuingOfficer = resolveOfficerName(item.attendantId, item.attendantName);
                             const receivingOfficer = trace.receivingOfficer;

                             const masterTool = tools.find(t => t.id === item.toolId);
                             const isKit = masterTool?.assetClass === 'Set' || masterTool?.assetClass === 'Toolbox';
                             const pieces = masterTool?.composition || [];

                             const issuanceNotes = (item.comment || '').toUpperCase();
                             const partialDispatchMatch = issuanceNotes.match(/PARTIAL DISPATCH: MISSING ([^|\]]+)/i);
                             const missingInDispatch = partialDispatchMatch ? partialDispatchMatch[1].split(',').map(s => s.trim().toUpperCase()) : [];
                             
                             return (
                               <div key={i} className={`p-6 flex flex-col hover:bg-slate-50 transition-colors gap-6 ${!isCleared && isVariance ? 'bg-rose-50/20' : ''}`}>
                                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                     <div className="flex items-center space-x-6 min-w-0 flex-1">
                                        <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 shadow-inner ${isCleared ? 'bg-emerald-50 border-emerald-100 text-emerald-500' : isVariance ? 'bg-rose-100 border-rose-200 text-rose-600' : 'bg-white border-slate-100 text-indigo-400'}`}>
                                           <Wrench size={20} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                           <div className="flex flex-col mb-1">
                                              <div className="flex flex-wrap items-center gap-2">
                                                 <p className={`text-[11px] font-black uppercase truncate leading-none ${isCleared ? 'text-emerald-700' : isVariance ? 'text-rose-700 underline decoration-rose-300' : 'text-slate-900'}`}>
                                                    {item.toolName}
                                                    {!isCleared && (
                                                       <span className={`ml-2 text-[10px] font-black ${isVariance ? 'text-rose-600' : 'text-indigo-600'}`}>
                                                          (Qty: {item.quantity})
                                                       </span>
                                                    )}
                                                 </p>
                                                 {isCleared ? (
                                                    <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[7px] font-black uppercase shadow-sm">
                                                       RETURNED
                                                    </span>
                                                 ) : isVariance ? (
                                                    <span className="px-2 py-0.5 bg-rose-600 text-white rounded text-[7px] font-black uppercase shadow-sm flex items-center gap-1">
                                                       <ShieldAlert size={8}/> ISSUE FOUND
                                                    </span>
                                                 ) : (
                                                    <span className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[7px] font-black uppercase shadow-sm">
                                                       HELD BY STAFF
                                                    </span>
                                                 )}
                                              </div>

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
                                     </div>

                                     <div className="flex items-center justify-end gap-3 shrink-0">
                                        {!item.isReturned && canVerifyReturn && (
                                            <button 
                                              onClick={() => onVerify?.(item)} 
                                              className={`px-10 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 shadow-lg ${isVariance ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-100' : 'bg-[#0F1135] text-white hover:bg-indigo-600 shadow-indigo-100'}`}
                                            >
                                              <ClipboardCheck size={16} />
                                              <span>{isVariance ? 'Resolve Issue' : 'Confirm Return'}</span>
                                            </button>
                                        )}
                                        {item.isReturned && (
                                          <div className="flex items-center space-x-2 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 shadow-inner">
                                             <CheckCircle2 size={16} />
                                             <span className="text-[9px] font-black uppercase">Handover Confirmed</span>
                                          </div>
                                        )}
                                     </div>
                                  </div>

                                  {/* ISSUANCE MANIFEST FOR KITS */}
                                  {isKit && pieces.length > 0 && (
                                    <div className="mt-1 animate-in fade-in duration-700">
                                       <div className="flex items-center space-x-2 text-slate-400 mb-2 px-1">
                                          <Layers size={10} />
                                          <span className="text-[7px] font-black uppercase tracking-widest">Handover Manifest Details</span>
                                       </div>
                                       <div className="bg-slate-50/50 border border-slate-100 rounded-lg overflow-hidden max-w-2xl">
                                          <table className="w-full text-left table-fixed border-collapse">
                                             <thead className="bg-white border-b border-slate-100">
                                                <tr className="text-[6px] font-black text-slate-300 uppercase tracking-widest">
                                                   <th className="py-1.5 px-3 w-1/2">Piece / Component</th>
                                                   <th className="py-1.5 px-3">Issuance State</th>
                                                   <th className="py-1.5 px-3 text-right">Verification</th>
                                                </tr>
                                             </thead>
                                             <tbody className="divide-y divide-slate-100">
                                                {pieces.map((piece, pIdx) => {
                                                   const cleanPiece = piece.replace(/\s*\(MISSING\)/g, '').replace(/\s*\(DAMAGED\)/g, '').toUpperCase();
                                                   const isRegistryMissing = piece.toUpperCase().includes('MISSING');
                                                   const isHandoverMissing = missingInDispatch.includes(cleanPiece);
                                                   const isIssued = !isRegistryMissing && !isHandoverMissing;

                                                   return (
                                                      <tr key={pIdx} className="hover:bg-white transition-colors group">
                                                         <td className="py-1 px-3">
                                                            <span className={`text-[7px] font-medium uppercase truncate block ${!isIssued ? 'text-slate-300 italic' : 'text-slate-600 font-bold'}`}>
                                                               {cleanPiece}
                                                            </span>
                                                         </td>
                                                         <td className="py-1 px-3">
                                                            <div className="flex items-center gap-1">
                                                               <div className={`w-1 h-1 rounded-full ${isIssued ? 'bg-emerald-400' : 'bg-rose-300'}`}></div>
                                                               <span className={`text-[6.5px] font-black uppercase ${isIssued ? 'text-emerald-600' : 'text-rose-400'}`}>
                                                                  {isIssued ? 'ISSUED TO STAFF' : isRegistryMissing ? 'RETAINED (MISSING)' : 'NOT ISSUED'}
                                                               </span>
                                                            </div>
                                                         </td>
                                                         <td className="py-1 px-3 text-right">
                                                            {isIssued ? <Check size={8} className="text-emerald-400 inline" /> : <X size={8} className="text-rose-300 inline" />}
                                                         </td>
                                                      </tr>
                                                   );
                                                })}
                                             </tbody>
                                          </table>
                                       </div>
                                    </div>
                                  )}
                                  
                                  {/* REMAINDER OF ARTIFACT VIEW (Detailed Piece Grid for returns) */}
                                  {(variances.missing.length > 0 || variances.damaged.length > 0) && (
                                     <div className="bg-slate-50 border border-slate-100 rounded-[1.8rem] p-5 animate-in slide-in-from-top-1">
                                        <div className="flex items-center justify-between mb-4">
                                           <div className="flex items-center gap-2 text-rose-600">
                                              <ShieldAlert size={14} />
                                              <span className="text-[9px] font-black uppercase tracking-widest">Broken or Missing Pieces</span>
                                           </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                           {variances.missing.map((piece, idx) => (
                                              <div key={`m-${idx}`} className="flex items-center justify-between p-3 bg-white border border-rose-100 rounded-xl shadow-sm group">
                                                 <div className="flex items-center gap-3">
                                                    <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg group-hover:bg-rose-600 group-hover:text-white transition-all"><PackageX size={14}/></div>
                                                    <span className="text-[9px] font-black text-rose-700 uppercase truncate">{piece}</span>
                                                 </div>
                                                 <span className="text-[7px] font-black bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded uppercase">MISSING</span>
                                              </div>
                                           ))}
                                           {variances.damaged.map((piece, idx) => (
                                              <div key={`d-${idx}`} className="flex items-center justify-between p-3 bg-white border border-amber-100 rounded-xl shadow-sm group">
                                                 <div className="flex items-center gap-3">
                                                    <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-all"><Hammer size={14}/></div>
                                                    <span className="text-[9px] font-black text-amber-700 uppercase truncate">{piece}</span>
                                                 </div>
                                                 <span className="text-[7px] font-black bg-amber-50 text-amber-100 px-1.5 py-0.5 rounded uppercase">DAMAGED</span>
                                              </div>
                                           ))}
                                        </div>
                                     </div>
                                  )}
                               </div>
                             );
                          })}
                       </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
           <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">PERSONNEL WITH ASSETS: {groupedByStaff.length}</span>
           <div className="flex items-center space-x-2">
              <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all shadow-sm">
                 <ChevronLeft size={16} />
              </button>
              <div className="px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-inner text-center">
                 <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Page {currentPage}</span>
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

export default SectionalTab;
