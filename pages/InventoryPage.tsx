
import React, { useState } from 'react';
import { 
  AlertTriangle,
  CheckCircle2,
  X
} from 'lucide-react';
import { 
  ToolAsset, 
  Employee, 
  ToolUsageRecord, 
  PhysicalLogbookRecord,
  ToolCondition,
  MaintenanceRecord
} from '../types';

// Logic & Modular Parts
import { useInventoryLogic } from '../hooks/useInventoryLogic';
import InventoryModalManager from '../components/inventory/InventoryModalManager';
import InventoryStats from '../components/inventory/InventoryStats';
import InventoryHeader from '../components/inventory/InventoryHeader';

// Tab Sections
import InventoryTab from '../components/inventory/InventoryTab';
import SectionalTab from '../components/inventory/SectionalTab';
import ArchivesTab from '../components/inventory/ArchivesTab';
import AuditTab from '../components/inventory/AuditTab';
import MaintenanceTab from '../components/inventory/MaintenanceTab';
import SparesTab from '../components/inventory/SparesTab';

interface InventoryPageProps {
  masterEmployees: Employee[];
  currentUser: Employee;
  cloudTools: ToolAsset[];
  cloudUsageLogs: ToolUsageRecord[];
  cloudPhysicalLogs: PhysicalLogbookRecord[];
  cloudAuditHistory: any[];
  cloudMaintenanceHistory: MaintenanceRecord[];
  onUpdateTools: (tools: ToolAsset[]) => void;
  onDeleteTool: (id: string) => void;
  onUpdateUsageLogs: (logs: ToolUsageRecord[]) => void;
  onUpdatePhysicalLogs: (logs: PhysicalLogbookRecord[]) => void;
  onUpdateAuditHistory: (history: any[]) => void;
  isSystemBusy: boolean;
  setSystemBusy: (busy: boolean) => void;
  hasPermission: (module: string, action?: any, subHub?: string) => boolean;
  initialTab?: string;
}

const ToolsInventoryPage: React.FC<InventoryPageProps> = (props) => {
  const { 
    masterEmployees, 
    currentUser,
    cloudTools,
    cloudUsageLogs,
    cloudPhysicalLogs,
    cloudAuditHistory,
    cloudMaintenanceHistory,
    onUpdateTools,
    onDeleteTool,
    onUpdateUsageLogs,
    onUpdatePhysicalLogs,
    onUpdateAuditHistory,
    isSystemBusy,
    setSystemBusy,
    hasPermission,
    initialTab
  } = props;

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { state, computed, handlers } = useInventoryLogic({
    currentUser, 
    cloudTools, 
    cloudUsageLogs, 
    cloudPhysicalLogs, 
    cloudAuditHistory,
    cloudMaintenanceHistory,
    masterEmployees, 
    onUpdateTools, 
    onUpdateUsageLogs, 
    onUpdatePhysicalLogs, 
    onUpdateAuditHistory, 
    setSystemBusy, 
    isSystemBusy,
    initialTab
  });

  const showFeedback = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleExecuteDelete = async () => {
    if (!pendingDeleteId) return;
    const idToDelete = pendingDeleteId;
    setPendingDeleteId(null);
    setSystemBusy(true);
    try {
      await onDeleteTool(idToDelete);
      showFeedback("Asset Deleted Successfully");
    } finally {
      setSystemBusy(false);
    }
  };

  const triggerVerification = (log: ToolUsageRecord, initialCondition: ToolCondition = 'Good') => {
    const masterTool = cloudTools.find(t => 
      String(t.id).trim().toLowerCase() === String(log.toolId).trim().toLowerCase()
    );
    state.setVerifyingLog({
      ...log,
      imageUrl: masterTool?.imageUrl,
      assetClass: masterTool?.assetClass,
      composition: masterTool?.composition,
      preselectedCondition: initialCondition,
      currentAvailable: masterTool?.available,
      totalQuantity: masterTool?.quantity
    });
  };

  return (
    <div className="space-y-3 md:space-y-4 animate-in fade-in duration-700 relative">
      {successMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[500] animate-in slide-in-from-top-4 duration-300">
          <div className="bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-500/50">
            <CheckCircle2 size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">{successMessage}</span>
            <button onClick={() => setSuccessMessage(null)} className="ml-2 hover:opacity-70"><X size={14}/></button>
          </div>
        </div>
      )}

      {pendingDeleteId && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 text-center animate-in zoom-in-95">
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                 <AlertTriangle size={32} />
              </div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">Delete Asset?</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed mb-8 px-4">
                 This action will permanently delete this asset from the system.
              </p>
              <div className="grid grid-cols-2 gap-3">
                 <button onClick={() => setPendingDeleteId(null)} className="py-4 bg-slate-50 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">Cancel</button>
                 <button onClick={handleExecuteDelete} className="py-4 bg-rose-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-rose-100 hover:bg-rose-700 active:scale-95 transition-all">Delete</button>
              </div>
           </div>
        </div>
      )}

      <InventoryModalManager 
        state={state} 
        data={{ cloudTools, currentUser, masterEmployees, cloudUsageLogs }}
        handlers={{ 
          ...handlers, 
          setSystemBusy, 
          onUpdateTools, 
          setIsReportingMaintenance: state.setIsReportingMaintenance,
          setResolvingMaintenance: state.setResolvingMaintenance,
          setReassigningMaintenance: state.setReassigningMaintenance,
          setVerifyingLog: state.setVerifyingLog,
          setIsAddingTool: state.setIsAddingTool,
          setEditingTool: state.setEditingTool,
          setIsIssuingTool: state.setIsIssuingTool,
          setIsDigitizingLog: state.setIsDigitizingLog,
          setAuditTargetLog: state.setAuditTargetLog,
          setIsWeeklyAuditOpen: state.setIsWeeklyAuditOpen,
          isSystemBusy
        }}
        showFeedback={showFeedback}
      />

      {state.activeTab !== 'spares' && <InventoryStats stats={computed.stats} />}

      <InventoryHeader 
        activeTab={state.activeTab} 
        setActiveTab={state.setActiveTab} 
        searchTerm={state.searchTerm} 
        setSearchTerm={state.setSearchTerm}
        categoryFilter={state.categoryFilter}
        setCategoryFilter={state.setCategoryFilter}
        zoneFilter={state.zoneFilter}
        setZoneFilter={state.setZoneFilter}
        conditionFilter={state.conditionFilter}
        setConditionFilter={state.setConditionFilter}
        archiveStatusFilter={state.archiveStatusFilter}
        setArchiveStatusFilter={state.setArchiveStatusFilter}
        archiveOfficerFilter={state.archiveOfficerFilter}
        setArchiveOfficerFilter={state.setArchiveOfficerFilter}
        masterEmployees={masterEmployees}
        onDigitize={() => state.setIsDigitizingLog(true)}
        onEnrollTool={() => state.setIsAddingTool(true)}
        hasPermission={hasPermission}
      />

      <div className="w-full">
        {state.activeTab === 'inventory' && (
          <InventoryTab 
            filteredTools={computed.filteredTools} 
            onEnroll={() => state.setIsAddingTool(true)} 
            onEdit={state.setEditingTool} 
            onDelete={setPendingDeleteId}
            usageLogs={cloudUsageLogs}
            hasPermission={hasPermission}
            onUpdateTools={onUpdateTools}
            isSystemBusy={isSystemBusy}
            setSystemBusy={setSystemBusy}
          />
        )}

        {state.activeTab === 'sectional' && (
          <SectionalTab 
            logs={cloudUsageLogs} 
            tools={cloudTools}
            staffRegistry={masterEmployees}
            onIssue={() => state.setIsIssuingTool(true)} 
            onVerify={triggerVerification}
            hasPermission={hasPermission}
          />
        )}

        {state.activeTab === 'maintenance' && (
          <MaintenanceTab 
            maintenanceHistory={state.maintenanceRecords} 
            onReport={() => state.setIsReportingMaintenance(true)} 
            onResolve={state.setResolvingMaintenance}
            onReassign={state.setReassigningMaintenance}
            onEscalate={async (id, notes) => {
              await handlers.handleMaintenanceEscalate(id, notes);
              showFeedback("Technical Oversight Escalated to Supervisor");
            }}
            currentUserLevel={currentUser.accessLevel || 'Staff'}
            currentUser={currentUser}
            hasPermission={hasPermission}
          />
        )}

        {state.activeTab === 'archives' && (
          <ArchivesTab 
            logs={computed.filteredLogs} 
            usageLogs={cloudUsageLogs}
            tools={cloudTools}
            masterEmployees={masterEmployees}
            currentUserLevel={currentUser.accessLevel || 'Staff'}
            onDigitize={() => state.setIsDigitizingLog(true)} 
            onAuditTarget={state.setAuditTargetLog} 
            onVerify={triggerVerification}
            onResolve={handlers.handleEscalationAction}
            hasPermission={hasPermission}
          />
        )}

        {state.activeTab === 'audit' && (
          <AuditTab 
            tools={cloudTools} 
            usageLogs={cloudUsageLogs}
            auditHistory={cloudAuditHistory} 
            expandedZones={state.expandedZones} 
            toggleZoneExpansion={handlers.toggleZoneExpansion} 
            onStartAudit={(zone) => { state.setAuditZone(zone); state.setIsWeeklyAuditOpen(true); }} 
            currentUserLevel={currentUser.accessLevel}
            onVerify={triggerVerification}
            onResolve={() => state.setActiveTab('resolution')}
            masterEmployees={masterEmployees}
            hasPermission={hasPermission}
            setExpandedAuditId={state.setExpandedAuditId}
            expandedAuditId={state.expandedAuditId}
          />
        )}

        {state.activeTab === 'spares' && (
          <SparesTab 
            masterEmployees={masterEmployees}
            currentUser={currentUser}
            hasPermission={hasPermission}
          />
        )}
      </div>
    </div>
  );
};

export default ToolsInventoryPage;
