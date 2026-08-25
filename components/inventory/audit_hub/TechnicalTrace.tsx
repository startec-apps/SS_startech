
import React, { useMemo } from 'react';
import { History, ShieldCheck, ClipboardCheck, Activity, Hammer, PackageX, Wrench, CheckCircle2, Layers, Briefcase, Trash2, AlertTriangle, Fingerprint, Box, ShieldAlert, Clock, UserCheck } from 'lucide-react';
import { ToolAsset, ToolUsageRecord, ToolCondition, ShiftType } from '../../../types';

interface TechnicalTraceProps {
  staffGroups: any[];
  tools: ToolAsset[];
  usageLogs: ToolUsageRecord[];
  auditId: string;
  auditDate: string;
  inspector: string;
  onVerify?: (log: ToolUsageRecord, initialCondition?: ToolCondition) => void;
}

const TechnicalTrace: React.FC<TechnicalTraceProps> = ({ staffGroups, tools, usageLogs, auditId, auditDate, inspector, onVerify }) => {
  const normalizeId = (val: any) => String(val || '').replace(/[^a-z0-9]/gi, '').toLowerCase();

  const parseVariances = (comment?: string) => {
    if (!comment) return [];
    
    const missingMatch = comment.match(/\[MISSING:\s*([^\]]+)\]/i);
    const damagedMatch = comment.match(/\[DAMAGED:\s*([^\]]+)\]/i);
    
    const results: { name: string, status: string }[] = [];
    if (missingMatch) {
      missingMatch[1].split(',').forEach(p => {
        if (p.trim()) results.push({ name: p.trim().toUpperCase(), status: 'MISSING' });
      });
    }
    if (damagedMatch) {
      damagedMatch[1].split(',').forEach(p => {
        if (p.trim()) results.push({ name: p.trim().toUpperCase(), status: 'DAMAGED' });
      });
    }
    
    if (results.length === 0) {
      const legacyMissing = comment.match(/(?:MISSING|CHECK):\s*([^|\]]+)/i);
      const legacyDamaged = comment.match(/DAMAGED:\s*([^|\]]+)/i);
      if (legacyMissing) legacyMissing[1].split(',').forEach(p => results.push({ name: p.trim().toUpperCase(), status: 'MISSING' }));
      if (legacyDamaged) legacyDamaged[1].split(',').forEach(p => results.push({ name: p.trim().toUpperCase(), status: 'DAMAGED' }));
    }
    
    return results;
  };

  // 1. Sort Staff Groups so those with active variances are at the top
  const sortedStaffGroups = useMemo(() => {
    return [...staffGroups].sort((a, b) => {
      const aHasActive = a.items.some((item: any) => !usageLogs.find(u => 
        normalizeId(u.physicalArchiveId) === normalizeId(auditId) && 
        normalizeId(u.toolId) === normalizeId(item.toolId) &&
        u.isReturned
      ));
      const bHasActive = b.items.some((item: any) => !usageLogs.find(u => 
        normalizeId(u.physicalArchiveId) === normalizeId(auditId) && 
        normalizeId(u.toolId) === normalizeId(item.toolId) &&
        u.isReturned
      ));
      if (aHasActive === bHasActive) return 0;
      return aHasActive ? -1 : 1;
    });
  }, [staffGroups, usageLogs, auditId]);

  return (
    <div className="bg-slate-50 border-y border-slate-100 p-4 lg:px-10 animate-in slide-in-from-top-4 duration-500 shadow-inner">
      <div className="bg-white border border-slate-200 rounded-[1.8rem] overflow-hidden shadow-xl max-w-5xl mx-auto">
         <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <h4 className="text-[8px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
               <History size={12} className="text-indigo-600" />
               Detailed Variance Ledger
            </h4>
            <span className="text-[6.5px] font-bold text-slate-400 uppercase tracking-widest">Inspector Certificate: {inspector}</span>
         </div>

         <div className="divide-y divide-slate-100">
            {sortedStaffGroups.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                 <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                    <ShieldCheck size={20} />
                  </div>
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Compliance Verified: All items present.</p>
              </div>
            ) : sortedStaffGroups.map(group => {
              // 2. Sort Items within the group: Unreturned items first
              const sortedItems = [...group.items].sort((a, b) => {
                const aResolved = usageLogs.find(u => normalizeId(u.physicalArchiveId) === normalizeId(auditId) && normalizeId(u.toolId) === normalizeId(a.toolId) && u.isReturned);
                const bResolved = usageLogs.find(u => normalizeId(u.physicalArchiveId) === normalizeId(auditId) && normalizeId(u.toolId) === normalizeId(b.toolId) && u.isReturned);
                if (!!aResolved === !!bResolved) return 0;
                return aResolved ? 1 : -1;
              });

              return (
                <div key={group.staffId} className="bg-white overflow-hidden">
                   <div className="px-8 py-4 bg-indigo-50/20 border-b border-indigo-50 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                         <div className={`w-8 h-8 rounded-lg ${normalizeId(group.staffId) === 'auditfallback' ? 'bg-slate-800' : 'bg-indigo-600'} text-white flex items-center justify-center font-black text-[9px] shadow-sm uppercase shrink-0`}>
                            {group.staffName.charAt(0)}
                         </div>
                         <div>
                            <p className="text-[13px] font-black text-slate-900 uppercase leading-none">{group.staffName}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                         <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-50 rounded text-[7px] font-black uppercase tracking-widest">
                            {group.items.length} Instances
                         </span>
                      </div>
                   </div>

                   <div className="divide-y divide-slate-50">
                      {sortedItems.map((item: any, i: number) => {
                         const tool = tools.find(t => t.id === item.toolId);
                         const pieceVariances = parseVariances(item.notes);
                         const isLost = item.condition === 'Lost';
                         const varianceCount = Math.max(0, (item.expectedQty || 0) - (item.quantity || 0));
                         
                         // Locate the specific pending variance log created during the audit
                         const pendingLog = usageLogs.find(u => 
                            normalizeId(u.physicalArchiveId) === normalizeId(auditId) && 
                            normalizeId(u.toolId) === normalizeId(item.toolId) &&
                            !u.isReturned
                         );

                         const resolutionLog = usageLogs.find(u => 
                            normalizeId(u.physicalArchiveId) === normalizeId(auditId) && 
                            normalizeId(u.toolId) === normalizeId(item.toolId) &&
                            u.isReturned
                         );

                         const resAction = resolutionLog?.actionHistory?.slice().reverse().find(a => 
                           a.action === 'FINAL_RESOLUTION_RETURN' || 
                           a.action === 'PHYSICAL RECOVERY' ||
                           a.action.includes('RECOVERY')
                         );

                         const resDate = resAction ? resAction.timestamp : (resolutionLog?.timeIn || resolutionLog?.date || '---');
                         const resOfficer = resAction ? resAction.actorName : (resolutionLog?.attendantName || 'Authorized Officer');
                         
                         return (
                            <div key={i} className={`p-5 flex flex-col hover:bg-slate-50 transition-colors ${resolutionLog ? 'bg-emerald-50/10' : ''}`}>
                               <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center space-x-5 min-w-0 flex-1">
                                     <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 shadow-inner ${resolutionLog ? 'bg-emerald-50 border-emerald-100 text-emerald-500' : isLost ? 'bg-rose-50 border-rose-100 text-rose-300' : 'bg-amber-50 border-amber-100 text-amber-300'}`}>
                                        {resolutionLog ? <CheckCircle2 size={16} /> : isLost ? <PackageX size={16} /> : <Wrench size={16} />}
                                     </div>
                                     <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-3 mb-1">
                                           <p className={`text-[11px] font-black uppercase truncate leading-none ${resolutionLog ? 'text-emerald-700' : isLost ? 'text-rose-700 underline decoration-rose-200' : 'text-slate-700'}`}>
                                              {tool?.name || item.toolId}
                                           </p>
                                           <div className="flex flex-wrap items-center gap-2">
                                              {resolutionLog ? (
                                                <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[6.5px] font-black uppercase shadow-sm">RESTORED</span>
                                              ) : (
                                                <div className="flex items-center gap-2">
                                                  <span className={`px-2 py-0.5 rounded text-[7.5px] font-black uppercase border tracking-tighter ${isLost ? 'bg-rose-600 text-white border-rose-700' : 'bg-amber-500 text-white border-amber-600'}`}>
                                                    {isLost ? 'MISSING' : 'BROKEN'}: {varianceCount} UNIT(S)
                                                  </span>
                                                </div>
                                              )}
                                           </div>
                                        </div>
                                     </div>
                                  </div>
                                  
                                  <div className="flex items-center justify-end gap-2 shrink-0">
                                     {onVerify && !resolutionLog && (
                                        <button 
                                           onClick={() => {
                                              // Use existing pending log if found to ensure the same record is resolved
                                              const logToResolve: ToolUsageRecord = pendingLog || {
                                                 id: `AUD-VAR-${Date.now()}-${item.toolId}`,
                                                 toolId: item.toolId,
                                                 toolName: tool?.name || item.toolId,
                                                 quantity: varianceCount,
                                                 staffId: group.staffId,
                                                 staffName: group.staffName,
                                                 shiftType: ShiftType.DAY,
                                                 date: auditDate,
                                                 timeOut: '00:00',
                                                 isReturned: false,
                                                 conditionOnReturn: item.condition,
                                                 attendantId: 'SYSTEM',
                                                 attendantName: 'Audit System',
                                                 issuanceType: 'Outstanding',
                                                 physicalArchiveId: auditId,
                                                 comment: `[AUDIT_RECOVERY] ${item.notes || 'Discrepancy identified in audit.'}`,
                                                 monetaryValue: tool?.monetaryValue || 0,
                                                 escalationStatus: 'Pending',
                                                 escalationStage: 'Store'
                                              };
                                              onVerify(logToResolve, item.condition);
                                           }}
                                           className="px-8 py-3 bg-[#0F1135] text-white rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-md active:scale-95 flex items-center gap-2"
                                        >
                                           <ClipboardCheck size={14} />
                                           <span>Verify Recovery</span>
                                        </button>
                                     )}
                                     {resolutionLog && (
                                       <div className="flex flex-col items-end">
                                          <div className="flex items-center space-x-2 px-5 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shadow-inner">
                                            <CheckCircle2 size={12} />
                                            <span className="text-[8px] font-black uppercase">Filing Reconciled</span>
                                          </div>
                                          <div className="flex flex-col items-end mt-1.5 px-1">
                                             <div className="flex items-center gap-1.5 text-[7px] font-black text-slate-400 uppercase tracking-widest">
                                                <Clock size={10} className="text-indigo-400" />
                                                <span>Resolved: {resDate}</span>
                                             </div>
                                             <div className="flex items-center gap-1.5 text-[7px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                                                <UserCheck size={10} className="text-indigo-400" />
                                                <span>Verified By: <span className="text-indigo-600">{resOfficer}</span></span>
                                             </div>
                                          </div>
                                       </div>
                                     )}
                                  </div>
                               </div>

                               {!resolutionLog && pieceVariances.length > 0 && (
                                  <div className="mt-3 ml-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                     {pieceVariances.map((v: any, j: number) => (
                                       <div key={j} className={`flex items-center justify-between p-2 rounded-lg border text-[8px] font-black uppercase transition-all ${v.status === 'MISSING' ? 'bg-rose-50/50 border-rose-100/50 text-rose-600' : 'bg-amber-50/50 border-amber-100/50 text-amber-600'}`}>
                                          <div className="flex items-center gap-1.5 truncate">
                                             {v.status === 'MISSING' ? <PackageX size={10} className="opacity-70" /> : <Hammer size={10} className="opacity-70" />}
                                             <span className="truncate">{v.name}</span>
                                          </div>
                                          <span className="text-[6px] opacity-40 ml-2 font-bold tracking-tighter">{v.status === 'MISSING' ? 'MISSING' : 'BROKEN'}</span>
                                       </div>
                                     ))}
                                  </div>
                               )}
                            </div>
                         );
                      })}
                   </div>
                </div>
              );
            })}
         </div>
      </div>
    </div>
  );
};

export default TechnicalTrace;
