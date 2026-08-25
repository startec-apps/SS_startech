import React from 'react';
import ToolEntryModal from './ToolEntryModal';
import ToolIssuanceModal from './ToolIssuanceModal';
import ReturnVerificationModal from './ReturnVerificationModal';
import LogbookDigitizerModal from './LogbookDigitizerModal';
import WeeklyAuditModal from './WeeklyAuditModal';
import { ReportMaintenanceModal, MaintenanceResolutionModal, ReassignTechnicianModal } from './MaintenanceModals';
import { ToolAsset, Employee, ToolUsageRecord, PhysicalLogbookRecord, MaintenanceRecord, WorkshopZone } from '../../types';

interface InventoryModalManagerProps {
  state: {
    isReportingMaintenance: boolean;
    resolvingMaintenance: MaintenanceRecord | null;
    reassigningMaintenance: MaintenanceRecord | null;
    verifyingLog: any | null;
    isAddingTool: boolean;
    editingTool: ToolAsset | null;
    isIssuingTool: boolean;
    isDigitizingLog: boolean;
    auditTargetLog: PhysicalLogbookRecord | null;
    isWeeklyAuditOpen: boolean;
    auditZone: WorkshopZone | 'Full Store';
    maintenanceRecords: MaintenanceRecord[];
  };
  data: {
    cloudTools: ToolAsset[];
    currentUser: Employee;
    masterEmployees: Employee[];
    cloudUsageLogs: ToolUsageRecord[];
  };
  handlers: {
    setIsReportingMaintenance: (v: boolean) => void;
    handleMaintenanceReport: (r: MaintenanceRecord | MaintenanceRecord[]) => Promise<void>;
    handleMaintenanceResolve: (u: any, s: any) => Promise<void>;
    handleMaintenanceReassign: (id: string, tid: string, tname: string) => Promise<void>;
    setResolvingMaintenance: (v: MaintenanceRecord | null) => void;
    setReassigningMaintenance: (v: MaintenanceRecord | null) => void;
    handleReturnConfirm: (log: ToolUsageRecord, c: any, n: string, q: number, p?: string, sig?: string, comp?: string[]) => Promise<void>;
    setVerifyingLog: (v: any) => void;
    onUpdateTools: (tools: ToolAsset[]) => void;
    syncToolAsset: (t: ToolAsset) => Promise<any>;
    setIsAddingTool: (v: boolean) => void;
    setEditingTool: (v: ToolAsset | null) => void;
    handleIssuanceConfirm: (i: any, s: string[], q: any) => Promise<void>;
    setIsIssuingTool: (v: boolean) => void;
    handleLogbookCommit: (l: any, d: any[]) => Promise<void>;
    setIsDigitizingLog: (v: boolean) => void;
    setAuditTargetLog: (v: any) => void;
    handleInspectionCommit: (f: any[], signature: string, auditType?: 'weekly' | 'monthly') => Promise<boolean>;
    setIsWeeklyAuditOpen: (v: boolean) => void;
    setSystemBusy: (v: boolean) => void;
    isSystemBusy: boolean;
  };
  showFeedback: (msg: string) => void;
}

const InventoryModalManager: React.FC<InventoryModalManagerProps> = ({ state, data, handlers, showFeedback }) => {
  return (
    <>
      {state.isReportingMaintenance && (
        <ReportMaintenanceModal 
          tools={data.cloudTools} 
          staff={data.masterEmployees}
          currentUser={data.currentUser} 
          onSave={async (records) => {
            await handlers.handleMaintenanceReport(records);
            showFeedback(`${Array.isArray(records) ? records.length : 1} Maintenance Logs Recorded`);
          }} 
          onCancel={() => handlers.setIsReportingMaintenance(false)} 
        />
      )}
      {state.resolvingMaintenance && (
        <MaintenanceResolutionModal 
          record={state.resolvingMaintenance} 
          staff={data.masterEmployees}
          onConfirm={async (updates, status) => {
            await handlers.handleMaintenanceResolve(updates, status);
            showFeedback(`Asset Status: ${status.replace('_', ' ')}`);
          }} 
          onCancel={() => handlers.setResolvingMaintenance(null)} 
        />
      )}
      {state.reassigningMaintenance && (
        <ReassignTechnicianModal
          record={state.reassigningMaintenance}
          staff={data.masterEmployees}
          onConfirm={async (tid, tname) => {
             await handlers.handleMaintenanceReassign(state.reassigningMaintenance!.id, tid, tname);
             showFeedback("Technician Reassigned by Supervisor");
          }}
          onCancel={() => handlers.setReassigningMaintenance(null)}
        />
      )}
      {state.verifyingLog && (
        <ReturnVerificationModal 
          log={state.verifyingLog} 
          staffRegistry={data.masterEmployees}
          onConfirm={async (id, cond, notes, q, p, sig, updatedComp) => {
            await handlers.handleReturnConfirm(state.verifyingLog, cond, notes, q, p, sig, updatedComp);
            handlers.setVerifyingLog(null);
            showFeedback("Registry Reconciled Successfully");
          }} 
          onCancel={() => handlers.setVerifyingLog(null)} 
        />
      )}
      {(state.isAddingTool || state.editingTool) && (
        <ToolEntryModal 
          initialData={state.editingTool} 
          currentUser={data.currentUser}
          masterEmployees={data.masterEmployees}
          onSave={async (savedTool) => { 
            handlers.setSystemBusy(true);
            try {
              if (state.editingTool) handlers.onUpdateTools(data.cloudTools.map(t => t.id === state.editingTool!.id ? savedTool : t)); 
              else handlers.onUpdateTools([savedTool, ...data.cloudTools]); 
              await handlers.syncToolAsset(savedTool); 
              handlers.setIsAddingTool(false); 
              handlers.setEditingTool(null); 
              showFeedback(state.editingTool ? "Asset Identity Updated" : "New Asset Enrolled");
            } finally {
              handlers.setSystemBusy(false);
            }
          }} 
          onCancel={() => { handlers.setIsAddingTool(false); handlers.setEditingTool(null); }} 
        />
      )}
      {state.isIssuingTool && (
        <ToolIssuanceModal 
          availableTools={data.cloudTools} 
          staffRegistry={data.masterEmployees} 
          currentUser={data.currentUser}
          onConfirm={async (i, s, q) => {
            await handlers.handleIssuanceConfirm(i, s, q);
            showFeedback("Asset Issuance Authorized");
          }} 
          onCancel={() => handlers.setIsIssuingTool(false)} 
        />
      )}
      {(state.isDigitizingLog || state.auditTargetLog) && (
        <LogbookDigitizerModal 
          tools={data.cloudTools} 
          staff={data.masterEmployees} 
          onSave={async (l, d) => {
            await handlers.handleLogbookCommit(l, d);
            showFeedback("Logbook Digitized & Archived");
          }} 
          onCancel={() => { handlers.setIsDigitizingLog(false); handlers.setAuditTargetLog(null); }} 
          currentUser={data.currentUser} 
          initialRecord={state.auditTargetLog} 
          startAtAudit={!!state.auditTargetLog} 
        />
      )}
      {state.isWeeklyAuditOpen && (
        <WeeklyAuditModal 
          tools={data.cloudTools} 
          usageLogs={data.cloudUsageLogs}
          maintenanceHistory={state.maintenanceRecords}
          staff={data.masterEmployees} 
          currentUser={data.currentUser} 
          targetZone={state.auditZone} 
          onSave={async (findings, signature, auditType) => {
            const success = await handlers.handleInspectionCommit(findings, signature, auditType);
            if (success) showFeedback("Master Ledger Audit Certified");
          }} 
          onCancel={() => handlers.setIsWeeklyAuditOpen(false)} 
        />
      )}
    </>
  );
};

export default InventoryModalManager;