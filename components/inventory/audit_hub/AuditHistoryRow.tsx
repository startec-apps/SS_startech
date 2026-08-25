
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { 
  CalendarClock, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  ChevronDown, 
  Timer, 
  UserCheck,
  Search,
  FileSignature,
  MoreVertical,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import { ToolUsageRecord, Employee } from '../../../types';

interface AuditHistoryRowProps {
  audit: any;
  isExpanded: boolean;
  onToggle: () => void;
  onViewReport: (audit: any) => void;
  onViewAgreement: (audit: any) => void;
  stats: any;
  usageLogs?: ToolUsageRecord[];
  masterEmployees?: Employee[];
}

const AuditHistoryRow: React.FC<AuditHistoryRowProps> = ({ 
  audit, 
  isExpanded, 
  onToggle, 
  onViewReport, 
  onViewAgreement,
  stats, 
  usageLogs = [], 
  masterEmployees = [] 
}) => {
  const [showReportMenu, setShowReportMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const normalizeId = (val: string) => String(val || '').replace(/[^a-z0-9]/gi, '').toLowerCase();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowReportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sopStatus = useMemo(() => {
    // 1. Identify all logs belonging to this specific Audit context
    const allLinkedLogs = usageLogs.filter(log => 
      normalizeId(log.physicalArchiveId || '') === normalizeId(audit.id)
    );

    // 2. Determine unique tools that were flagged
    const flaggedToolIds = Array.from(new Set(allLinkedLogs.map(l => normalizeId(l.toolId))));

    // 3. A variance is "Active" ONLY if NO resolved record exists for that tool in this audit.
    // This fixes the bug where multiple logs exist and the red badge won't clear.
    const activeToolVariances = flaggedToolIds.filter(tid => {
      const toolLogs = allLinkedLogs.filter(l => normalizeId(l.toolId) === tid);
      const hasResolvedRecord = toolLogs.some(l => l.isReturned || l.escalationStatus === 'Resolved');
      return !hasResolvedRecord;
    });

    // 4. Capture latest historical activity
    const allActions = allLinkedLogs.flatMap(l => l.actionHistory || []);
    const sortedActions = [...allActions].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const latestAction = sortedActions[0];
    const lastUpdateDate = latestAction ? latestAction.timestamp : (audit.timestamp || audit.date);

    // 5. Detection of 'Registry Restored' state
    // It's resolved if we had identifying variances (stats.total > 0) and now 0 active unresolved tools.
    const isResolved = stats.total > 0 && activeToolVariances.length === 0;
    
    // Identification of the resolving officer
    const finalAction = sortedActions.find(a => 
      a.action === 'FINAL_RESOLUTION_RETURN' || 
      a.action === 'PHYSICAL RECOVERY' ||
      a.action.includes('RECOVERY')
    );
    
    const resolvedLog = allLinkedLogs.find(l => l.isReturned || l.escalationStatus === 'Resolved');
    const resolverName = finalAction?.actorName || resolvedLog?.attendantName || "Authorized Officer";

    if (activeToolVariances.length === 0 && !isResolved) {
      return { lastUpdateDate, activeSOP: 'CLEAR' as const, isResolved: false, totalVariances: 0 };
    }

    const activeLogs = allLinkedLogs.filter(l => activeToolVariances.includes(normalizeId(l.toolId)));
    const graceItem = activeLogs.find(i => i.escalationStatus === 'In-Grace-Period');
    const supervisorItem = activeLogs.find(i => i.escalationStage === 'Supervisor' || i.escalationStage === 'Manager');
    const searchItem = activeLogs.find(i => (i.actionHistory && i.actionHistory.length > 0));

    let activeSOP: 'RESTITUTION' | 'SUPERVISOR' | 'SEARCH' | 'VARIANCE' | 'RESOLVED' = 'VARIANCE';
    let graceDaysRemaining: number | null = null;

    if (isResolved) {
      activeSOP = 'RESOLVED';
    } else if (graceItem) {
      activeSOP = 'RESTITUTION';
      if (graceItem.graceExpiryDate) {
        graceDaysRemaining = Math.max(0, Math.ceil((new Date(graceItem.graceExpiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)));
      }
    } else if (supervisorItem) {
      activeSOP = 'SUPERVISOR';
    } else if (searchItem) {
      activeSOP = 'SEARCH';
    }
    
    return {
      lastUpdateDate,
      activeSOP,
      graceDaysRemaining,
      totalVariances: activeToolVariances.length,
      hasFiscalCases: !!graceItem || (isResolved && allLinkedLogs.some(l => l.escalationStatus === 'Resolved' && l.graceExpiryDate)),
      isResolved,
      resolverName
    };
  }, [usageLogs, audit.id, audit.date, audit.timestamp, stats.total]);

  return (
    <div 
      onClick={onToggle}
      className={`group relative p-6 lg:px-8 lg:py-7 hover:bg-indigo-50/20 transition-all cursor-pointer ${isExpanded ? 'bg-indigo-50/30' : ''}`}
    >
      {sopStatus?.lastUpdateDate && (
        <div className="absolute top-3 right-8 flex items-center gap-1.5 transition-all">
          <RefreshCw size={10} className="text-indigo-400" />
          <span className="text-[7px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100 shadow-sm">
            {sopStatus.isResolved ? 'Resolved At' : 'Last Update'}: {sopStatus.lastUpdateDate}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          <div className="col-span-1 lg:col-span-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-[10px] uppercase shadow-sm">
                {audit.inspector?.charAt(0) || 'A'}
              </div>
              <div className="flex flex-col min-w-0">
                  <span className="font-black text-slate-900 text-sm uppercase tracking-tight truncate leading-none">{audit.inspector || 'System Audit'}</span>
                  <div className="flex items-center gap-1.5 mt-2">
                     <Clock size={10} className="text-indigo-400" />
                     <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 shadow-sm">
                        FILED: {String(audit.date).split(' ')[0]}
                     </span>
                  </div>
              </div>
            </div>
          </div>

          <div className="col-span-1 lg:col-span-5 text-center flex flex-col items-center">
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
               {sopStatus?.isResolved ? (
                 <div className="flex flex-col items-center gap-1.5">
                    <div className="px-3 py-1 bg-emerald-600 text-white border border-emerald-700 rounded-lg text-[8px] font-black uppercase flex items-center gap-2 shadow-md animate-in zoom-in-95 duration-500">
                       <ShieldCheck size={12} />
                       REGISTRY RESTORED
                    </div>
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">
                       Verified By: <span className="text-indigo-600">{sopStatus.resolverName}</span>
                    </p>
                 </div>
               ) : stats.total === 0 ? (
                 <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm">
                    <CheckCircle2 size={12} />
                    COMPLIANCE VERIFIED
                 </span>
               ) : (
                 <>
                   {sopStatus?.activeSOP === 'RESTITUTION' ? (
                     <div className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-[8px] font-black uppercase flex items-center gap-2 shadow-md animate-pulse">
                        <Timer size={12} />
                        {sopStatus.totalVariances} VARIANCES: STAFF RESTITUTION ({sopStatus.graceDaysRemaining}D)
                     </div>
                   ) : sopStatus?.activeSOP === 'SUPERVISOR' ? (
                     <div className="px-3 py-1 bg-[#4338CA] text-white rounded-lg text-[8px] font-black uppercase flex items-center gap-2 shadow-md">
                        <UserCheck size={12} />
                        {sopStatus.totalVariances} VARIANCES: SUPERVISOR FOLLOW-UP
                     </div>
                   ) : sopStatus?.activeSOP === 'SEARCH' ? (
                     <div className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[8px] font-black uppercase flex items-center gap-2 shadow-md">
                        <Search size={12} />
                        {sopStatus.totalVariances} RECOVERY IN PROGRESS
                     </div>
                   ) : (
                     <div className="px-3 py-1 bg-rose-600 text-white border border-rose-600 rounded-lg text-[8px] font-black uppercase flex items-center gap-2 shadow-md">
                        <AlertTriangle size={12} />
                        {sopStatus.totalVariances} VARIANCE(S) IDENTIFIED
                     </div>
                   )}

                   <span className="px-3 py-1 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg text-[8px] font-black uppercase tracking-widest ml-1">
                      ZONE: {audit.section || 'STORE'}
                    </span>
                    <span className={`px-3 py-1 border rounded-lg text-[8px] font-black uppercase tracking-widest ml-1 ${
                      audit.type === 'monthly'
                        ? 'bg-purple-100 text-purple-700 border-purple-200'
                        : 'bg-indigo-50 text-indigo-600 border-indigo-200'
                    }`}>
                      {audit.type === 'monthly' ? 'Monthly Deep-Audit' : 'Weekly Fast Audit'}
                   </span>
                 </>
               )}
            </div>
          </div>

          <div className="col-span-1 lg:col-span-3 text-right pr-4">
            <div className="flex items-center justify-end space-x-3 relative" ref={menuRef}>
               <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setShowReportMenu(!showReportMenu);
                  }}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all shadow-xl active:scale-95 border-2 ${
                    showReportMenu ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-[#0F1135] text-white border-indigo-500/20 hover:bg-indigo-600'
                  }`}
                  title="View Audit Reports"
               >
                  <FileText size={22} strokeWidth={2.5} />
               </button>

               {showReportMenu && (
                 <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in slide-in-from-top-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onViewReport(audit); setShowReportMenu(false); }}
                      className="w-full px-5 py-4 flex items-center gap-4 hover:bg-slate-50 text-left transition-colors group"
                    >
                       <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          <FileText size={18} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">Main Audit Report</p>
                          <p className="text-[7px] font-bold text-slate-400 uppercase mt-0.5">Full Technical Summary</p>
                       </div>
                    </button>
                    
                    {sopStatus?.hasFiscalCases && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onViewAgreement(audit); setShowReportMenu(false); }}
                        className="w-full px-5 py-4 flex items-center gap-4 hover:bg-emerald-50 text-left transition-colors border-t border-slate-50 group"
                      >
                         <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
                            <FileSignature size={18} />
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">Restitution Agreement</p>
                            <p className="text-[7px] font-bold text-slate-400 uppercase mt-0.5">Legal Staff Commitment</p>
                         </div>
                      </button>
                    )}
                 </div>
               )}

               <div className={`transition-transform duration-500 inline-block ${isExpanded ? 'rotate-180 text-indigo-600' : 'text-slate-400'}`}>
                  <ChevronDown size={24} strokeWidth={3} />
               </div>
            </div>
          </div>
      </div>
    </div>
  );
};

export default AuditHistoryRow;
