
import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  ChevronRight, 
  ChevronLeft,
  History,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { ToolAsset, WorkshopZone, ToolUsageRecord, AccessLevel, Employee, ShiftType, ToolCondition } from '../../types';

// Refactored Sub-components
import AuditReportModal from './audit_hub/AuditReportModal';
import RestitutionAgreementModal from './audit_hub/RestitutionAgreementModal';
import AuditHistoryRow from './audit_hub/AuditHistoryRow';
import TechnicalTrace from './audit_hub/TechnicalTrace';

interface AuditTabProps {
  tools: ToolAsset[];
  usageLogs?: ToolUsageRecord[]; 
  auditHistory: any[];
  expandedZones: Set<string>;
  toggleZoneExpansion: (zone: string) => void;
  expandedAuditId: string | null;
  setExpandedAuditId: (id: string | null) => void;
  onStartAudit: (zone: WorkshopZone | 'Full Store') => void;
  currentUserLevel?: AccessLevel;
  onVerify?: (log: ToolUsageRecord, initialCondition?: ToolCondition) => void;
  onResolve?: (logId: string, action: any, notes?: string) => void;
  masterEmployees?: Employee[];
  hasPermission: (module: string, action?: any, subHub?: string) => boolean;
}

const AuditTab: React.FC<AuditTabProps> = ({ 
  tools, 
  usageLogs = [],
  auditHistory, 
  onStartAudit,
  masterEmployees = [],
  expandedAuditId,
  setExpandedAuditId,
  onVerify,
  currentUserLevel
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingAuditReport, setViewingAuditReport] = useState<any | null>(null);
  const [viewingAgreement, setViewingAgreement] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VARIANCES' | 'CLEARED'>('ALL');
  
  const itemsPerPage = 15;

  const getAuditStats = (issues: any[]) => {
    let missing = 0;
    let damaged = 0;
    let pieces = 0;

    issues.forEach(f => {
      const tool = tools.find(t => t.id === f.toolId);
      const isAnIssue = f.condition === 'Damaged' || f.condition === 'Lost' || (tool && Number(f.quantity) < tool.available);
      if (isAnIssue) {
        if (f.condition === 'Lost' || (tool && Number(f.quantity) < tool.available)) missing++;
        if (f.condition === 'Damaged') damaged++;
      }
      if (f.pieceStatus && Object.values(f.pieceStatus).some(s => s !== 'Present')) pieces++;
    });

    return { missing, damaged, pieces, total: missing + damaged + pieces };
  };

  const filteredHistory = useMemo(() => {
    return auditHistory.filter(audit => {
      const stats = getAuditStats(audit.issues || []);
      if (statusFilter === 'VARIANCES') return stats.total > 0;
      if (statusFilter === 'CLEARED') return stats.total === 0;
      return true;
    }).sort((a,b) => String(b.date || '').localeCompare(String(a.date || '')));
  }, [auditHistory, statusFilter, tools]);

  const paginatedHistory = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredHistory.slice(start, start + itemsPerPage);
  }, [filteredHistory, currentPage]);

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);

  const getStaffName = (id?: string) => {
    if (!id) return "Audit Attendant Oversight";
    return masterEmployees.find(e => e.id === id)?.name || "Personnel Identity Unknown";
  };

  const sectionalItems = useMemo(() => 
    usageLogs.filter(l => l.issuanceType === 'Section-Held' && !l.isReturned),
    [usageLogs]
  );

  const activeCases = useMemo(() => 
    usageLogs.filter(l => l.issuanceType === 'Outstanding' && l.escalationStatus !== 'Resolved'),
    [usageLogs]
  );

  const reconciliationMetrics = useMemo(() => {
    let expectedBaselineQty = 0;
    let actualOnHandPresentQty = 0;

    tools.forEach(tool => {
      expectedBaselineQty += Number(tool.quantity || 0);
      actualOnHandPresentQty += Number(tool.available || 0);
    });

    const activeIssuedLogs = usageLogs.filter(log => !log.isReturned && (log.issuanceType === 'Daily' || log.issuanceType === 'Section-Held'));
    const totalIssuedQty = activeIssuedLogs.reduce((sum, log) => sum + Number(log.quantity || 0), 0);

    const activeOutstandingLogs = usageLogs.filter(log => !log.isReturned && log.issuanceType === 'Outstanding');
    const totalOutstandingLeaksQty = activeOutstandingLogs.reduce((sum, log) => sum + Number(log.quantity || 0), 0);

    const accountRate = expectedBaselineQty > 0
      ? Math.min(100, Math.max(0, Math.round(((actualOnHandPresentQty + totalIssuedQty) / expectedBaselineQty) * 1000) / 10))
      : 100;

    return {
      expectedBaselineQty,
      actualOnHandPresentQty,
      totalIssuedQty,
      totalOutstandingLeaksQty,
      accountRate
    };
  }, [tools, usageLogs]);

  return (
    <div className="space-y-4 animate-in fade-in duration-500 max-w-full pb-10">
      
      {viewingAuditReport && (
        <AuditReportModal 
          report={viewingAuditReport}
          tools={tools}
          sectionalItems={sectionalItems}
          activeCases={activeCases}
          onClose={() => setViewingAuditReport(null)}
        />
      )}

      {viewingAgreement && (
        <RestitutionAgreementModal 
          audit={viewingAgreement}
          usageLogs={usageLogs}
          tools={tools}
          masterEmployees={masterEmployees}
          onClose={() => setViewingAgreement(null)}
        />
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-1 mb-2">
         <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-[#0F1135] rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0"><ShieldCheck size={24} /></div>
            <div>
               <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">Audit Records</h3>
               <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">Verification History</p>
            </div>
         </div>
         <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="flex bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
               {[
                 { id: 'ALL', label: 'All' },
                 { id: 'VARIANCES', label: 'Variances' },
                 { id: 'CLEARED', label: 'Cleared' }
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
            <button onClick={() => onStartAudit('Full Store')} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black uppercase text-[9px] hover:bg-[#0F1135] transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-indigo-100">
               <CheckCircle2 size={14}/> <span>Start Audit</span>
            </button>
         </div>
      </div>

      {/* GLOBAL RESOURCE RECONCILIATION & SYSTEMS ALIGNMENT LEDGER */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 px-1 pb-2">
         <div className="bg-white border border-slate-100 p-5 rounded-[1.5rem] shadow-sm flex flex-col justify-between">
            <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block mb-2">Registered Baseline</span>
            <div className="flex items-baseline gap-1">
               <span className="text-2xl font-black text-slate-800 tabular-nums">{reconciliationMetrics.expectedBaselineQty}</span>
               <span className="text-[9px] font-bold text-slate-400 uppercase">Tools</span>
            </div>
            <p className="text-[7px] font-medium text-slate-300 uppercase tracking-tight mt-1.5 border-t border-slate-50 pt-1.5">Enrolled system expected scale</p>
         </div>
         <div className="bg-white border border-slate-100 p-5 rounded-[1.5rem] shadow-sm flex flex-col justify-between">
            <span className="text-[7.5px] font-black text-emerald-600 uppercase tracking-widest block mb-2">Storeroom On-Hand</span>
            <div className="flex items-baseline gap-1">
               <span className="text-2xl font-black text-emerald-700 tabular-nums">{reconciliationMetrics.actualOnHandPresentQty}</span>
               <span className="text-[9px] font-bold text-emerald-500 uppercase">Available</span>
            </div>
            <p className="text-[7px] font-medium text-slate-300 uppercase tracking-tight mt-1.5 border-t border-slate-50 pt-1.5">Physically present in store</p>
         </div>
         <div className="bg-white border border-slate-100 p-5 rounded-[1.5rem] shadow-sm flex flex-col justify-between">
            <span className="text-[7.5px] font-black text-indigo-600 uppercase tracking-widest block mb-2">Issued to Staff</span>
            <div className="flex items-baseline gap-1">
               <span className="text-2xl font-black text-indigo-700 tabular-nums">{reconciliationMetrics.totalIssuedQty}</span>
               <span className="text-[9px] font-bold text-indigo-500 uppercase">Issued</span>
            </div>
            <p className="text-[7px] font-medium text-slate-300 uppercase tracking-tight mt-1.5 border-t border-slate-50 pt-1.5">Active field task assignments</p>
         </div>
         <div className="bg-white border border-slate-100 p-5 rounded-[1.5rem] shadow-sm flex flex-col justify-between">
            <span className="text-[7.5px] font-black text-amber-600 uppercase tracking-widest block mb-2">Known Discrepancies</span>
            <div className="flex items-baseline gap-1">
               <span className="text-2xl font-black text-amber-700 tabular-nums">{reconciliationMetrics.totalOutstandingLeaksQty}</span>
               <span className="text-[9px] font-bold text-amber-500 uppercase">Unaccounted</span>
            </div>
            <p className="text-[7px] font-medium text-slate-300 uppercase tracking-tight mt-1.5 border-t border-slate-50 pt-1.5">Loss / damage accountability leaks</p>
         </div>
         <div className="col-span-2 lg:col-span-1 bg-[#0F1135] text-white p-5 rounded-[1.5rem] shadow-lg flex flex-col justify-between">
            <span className="text-[7.5px] font-black text-emerald-400 uppercase tracking-widest block mb-2">Systems Integrity</span>
            <div className="flex items-baseline gap-1">
               <span className="text-2xl font-black text-emerald-300 tabular-nums">{reconciliationMetrics.accountRate}%</span>
               <span className="text-[9px] font-bold text-indigo-300 uppercase">Match</span>
            </div>
            <p className="text-[7px] font-medium text-indigo-200 uppercase tracking-tight mt-1.5 border-t border-white/5 pt-1.5">Total registered match accuracy</p>
         </div>
      </div>

       <div className="bg-white border border-slate-100 shadow-xl rounded-[2rem] overflow-hidden mx-1">
        <div className="hidden lg:grid grid-cols-12 bg-slate-50/80 backdrop-blur-md text-[8px] font-black text-slate-400 uppercase tracking-[0.25em] border-b border-slate-100 px-8 py-4">
           <div className="col-span-4">Inspector Certification</div>
           <div className="col-span-4 text-center">Audit Status</div>
           <div className="col-span-4 text-right pr-4">Report Details</div>
        </div>

        <div className="divide-y divide-slate-50">
          {paginatedHistory.length === 0 ? (
            <div className="py-32 text-center">
               <History size={48} className="mx-auto text-slate-100 mb-4" />
               <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">No matching history found</p>
            </div>
          ) : paginatedHistory.map(audit => {
            const stats = getAuditStats(audit.issues || []);
            const isRowExpanded = expandedAuditId === audit.id;
            
            const varianceIssues = (audit.issues || []).filter((f: any) => {
               const tool = tools.find(t => t.id === f.toolId);
               const isStockShortage = tool && Number(f.quantity) < tool.available;
               const isConditionIssue = f.condition === 'Damaged' || f.condition === 'Lost';
               const isKitVariance = f.pieceStatus && Object.values(f.pieceStatus).some(s => s !== 'Present');
               return isStockShortage || isConditionIssue || isKitVariance;
            });

            const staffGroups = Array.from(new Set<string>(varianceIssues.map((f: any) => String(f.responsibleStaffId || 'AUDIT-FALLBACK')))).map((staffId: string) => {
               const groupItems = varianceIssues.filter((f: any) => String(f.responsibleStaffId || 'AUDIT-FALLBACK') === staffId);
               return {
                  staffId,
                  staffName: staffId === 'AUDIT-FALLBACK' ? "Audit Oversight / Store Attendant" : getStaffName(staffId),
                  items: groupItems,
                  heldCount: groupItems.length
               };
            });

            return (
              <React.Fragment key={audit.id}>
                <AuditHistoryRow 
                  audit={audit}
                  isExpanded={isRowExpanded}
                  onToggle={() => setExpandedAuditId(isRowExpanded ? null : audit.id)}
                  onViewReport={setViewingAuditReport}
                  onViewAgreement={setViewingAgreement}
                  stats={stats}
                  usageLogs={usageLogs}
                  masterEmployees={masterEmployees}
                />

                {isRowExpanded && (
                  <TechnicalTrace 
                    staffGroups={staffGroups}
                    tools={tools}
                    usageLogs={usageLogs}
                    auditId={audit.id}
                    // Added auditDate prop here
                    auditDate={audit.date}
                    inspector={audit.inspector}
                    onVerify={onVerify}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
           <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{filteredHistory.length} Matching records</span>
           <div className="flex items-center space-x-2">
              <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all shadow-sm">
                 <ChevronLeft size={16} />
              </button>
              <div className="px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-inner text-center">
                 <span className="text-[9px] font-black text-slate-900 uppercase">Page {currentPage} of {totalPages || 1}</span>
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

export default AuditTab;
