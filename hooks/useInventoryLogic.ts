
import { useState, useMemo, useEffect } from 'react';
import { 
  ToolAsset, 
  WorkshopZone, 
  ToolCondition, 
  Employee, 
  ToolUsageRecord, 
  ShiftType, 
  PhysicalLogbookRecord, 
  MaintenanceRecord, 
  MaintenanceStatus,
  EscalationStage
} from '../types';
import { syncToolToGoogleSheets } from '../services/googleSheets';

interface InventoryLogicProps {
  currentUser: Employee;
  cloudTools: ToolAsset[];
  cloudUsageLogs: ToolUsageRecord[];
  cloudPhysicalLogs: PhysicalLogbookRecord[];
  cloudAuditHistory: any[];
  cloudMaintenanceHistory: MaintenanceRecord[];
  masterEmployees: Employee[];
  onUpdateTools: (tools: ToolAsset[]) => void;
  onUpdateUsageLogs: (logs: ToolUsageRecord[]) => void;
  onUpdatePhysicalLogs: (logs: PhysicalLogbookRecord[]) => void;
  onUpdateAuditHistory: (history: any[]) => void;
  setSystemBusy: (busy: boolean) => void;
  isSystemBusy: boolean;
  initialTab?: string;
}

export const useInventoryLogic = ({
  currentUser,
  cloudTools,
  cloudUsageLogs,
  cloudPhysicalLogs,
  cloudAuditHistory,
  cloudMaintenanceHistory = [],
  masterEmployees,
  onUpdateTools,
  onUpdateUsageLogs,
  onUpdatePhysicalLogs,
  onUpdateAuditHistory,
  setSystemBusy,
  isSystemBusy,
  initialTab
}: InventoryLogicProps) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'sectional' | 'archives' | 'audit' | 'resolution' | 'maintenance' | 'spares' | 'technician_tasks'>(
    (initialTab as any) || 'inventory'
  );

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab as any);
    }
  }, [initialTab]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [zoneFilter, setZoneFilter] = useState('ALL');
  const [conditionFilter, setConditionFilter] = useState('ALL');

  const [archiveStatusFilter, setArchiveStatusFilter] = useState<'ALL' | 'ISSUES' | 'CLEAR'>('ALL');
  const [archiveOfficerFilter, setArchiveOfficerFilter] = useState('ALL');

  const [expandedZones, setExpandedZones] = useState<Set<string>>(new Set());
  const [expandedAuditId, setExpandedAuditId] = useState<string | null>(null);
  const [isAddingTool, setIsAddingTool] = useState(false);
  const [isIssuingTool, setIsIssuingTool] = useState(false);
  const [isDigitizingLog, setIsDigitizingLog] = useState(false);
  const [isWeeklyAuditOpen, setIsWeeklyAuditOpen] = useState(false);
  const [isReportingMaintenance, setIsReportingMaintenance] = useState(false);
  const [verifyingLog, setVerifyingLog] = useState<any | null>(null);
  const [editingTool, setEditingTool] = useState<ToolAsset | null>(null);
  const [auditZone, setAuditZone] = useState<WorkshopZone | 'Full Store'>('Full Store');
  const [auditTargetLog, setAuditTargetLog] = useState<PhysicalLogbookRecord | null>(null);
  const [resolvingMaintenance, setResolvingMaintenance] = useState<MaintenanceRecord | null>(null);
  const [reassigningMaintenance, setReassigningMaintenance] = useState<MaintenanceRecord | null>(null);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);

  useEffect(() => {
    if (cloudMaintenanceHistory && cloudMaintenanceHistory.length > 0) {
      setMaintenanceRecords(cloudMaintenanceHistory);
    }
  }, [cloudMaintenanceHistory]);

  const normalizeIdStr = (val: string) => String(val || '').replace(/[^a-z0-9]/gi, '').toLowerCase();

  const handleMaintenanceReport = async (records: MaintenanceRecord | MaintenanceRecord[]) => {
    setSystemBusy(true);
    const reports = Array.isArray(records) ? records : [records];
    try {
      const updatedToolsMap = new Map(cloudTools.map(t => [normalizeIdStr(t.id), t]));
      for (const record of reports) {
        const tool = updatedToolsMap.get(normalizeIdStr(record.toolId));
        if (tool) {
          const updatedTool = { ...tool, available: Math.max(0, tool.available - 1), condition: 'Maintenance' as ToolCondition };
          updatedToolsMap.set(normalizeIdStr(tool.id), updatedTool);
        }
      }
      setMaintenanceRecords(prev => [...reports, ...prev]);
      onUpdateTools(Array.from(updatedToolsMap.values()));
      setIsReportingMaintenance(false);
    } finally { setSystemBusy(false); }
  };

  const handleMaintenanceResolve = async (updates: Partial<MaintenanceRecord>, nextStatus: MaintenanceStatus) => {
    if (!resolvingMaintenance) return;
    setSystemBusy(true);
    try {
      const updatedRecord: MaintenanceRecord = { ...resolvingMaintenance, ...updates, status: nextStatus };
      setMaintenanceRecords(prev => prev.map(m => m.id === updatedRecord.id ? updatedRecord : m));
      const tool = cloudTools.find(t => normalizeIdStr(t.id) === normalizeIdStr(updatedRecord.toolId));
      if (tool) {
        let updatedTool: ToolAsset | null = null;
        if (nextStatus === 'Restored') {
          updatedTool = { ...tool, available: Math.min(tool.quantity, tool.available + 1), condition: 'Good' as ToolCondition };
        } else if (nextStatus === 'Decommissioned') {
          updatedTool = { ...tool, quantity: Math.max(0, tool.quantity - 1), condition: tool.quantity > 1 ? tool.condition : 'Irreparable' as any };
        }
        if (updatedTool) {
          onUpdateTools(cloudTools.map(t => normalizeIdStr(t.id) === normalizeIdStr(updatedTool!.id) ? updatedTool! : t));
        }
      }
      setResolvingMaintenance(null);
    } finally { setSystemBusy(false); }
  };

  const handleMaintenanceEscalate = async (recordId: string, notes: string) => {
    setSystemBusy(true);
    try {
      const record = maintenanceRecords.find(m => m.id === recordId);
      if (!record) return;
      const updatedRecord: MaintenanceRecord = { 
        ...record, 
        isEscalatedToSupervisor: true, 
        escalationNotes: `[ESCALATED BY ${currentUser.name}] ${notes}` 
      };
      setMaintenanceRecords(prev => prev.map(m => m.id === recordId ? updatedRecord : m));
    } finally { setSystemBusy(false); }
  };

  const handleMaintenanceReassign = async (recordId: string, newTechId: string, newTechName: string) => {
    setSystemBusy(true);
    try {
      const record = maintenanceRecords.find(m => m.id === recordId);
      if (!record) return;
      const updatedRecord: MaintenanceRecord = { 
        ...record, 
        assignedStaffId: newTechId, 
        assignedStaffName: newTechName,
        technicianNotes: (record.technicianNotes || '') + ` | [SUPERVISOR REASSIGNMENT TO ${newTechName} BY ${currentUser.name}]`
      };
      setMaintenanceRecords(prev => prev.map(m => m.id === recordId ? updatedRecord : m));
      setReassigningMaintenance(null);
    } finally { setSystemBusy(false); }
  };

  const handleInspectionCommit = async (findings: any[], signature: string, auditType?: 'weekly' | 'monthly') => {
    if (findings.length === 0) {
      setIsWeeklyAuditOpen(false);
      return true;
    }
    setSystemBusy(true);
    try {
      const auditId = `AUD-${Date.now()}`;
      const timestamp = new Date().toLocaleString();
      const date = new Date().toISOString().split('T')[0];
      const auditLog = {
        id: auditId,
        date: date,
        timestamp: timestamp,
        section: auditZone,
        inspector: currentUser.name,
        shiftType: ShiftType.DAY,
        issues: findings,
        signature: signature || '',
        type: auditType || 'weekly'
      };

      const updatedUsage = [...cloudUsageLogs];
      const updatedToolsMap = new Map(cloudTools.map(t => [normalizeIdStr(t.id), t]));

      for (const finding of findings) {
        const tool = updatedToolsMap.get(normalizeIdStr(finding.toolId));
        if (!tool) continue;

        const isStockShortage = Number(finding.quantity) < tool.available;
        const isConditionIssue = finding.condition === 'Damaged' || finding.condition === 'Lost';
        const hasPieceVariances = finding.pieceStatus && Object.values(finding.pieceStatus).some(s => s !== 'Present');

        if (isStockShortage || isConditionIssue || hasPieceVariances) {
          const varianceQty = Math.max(0, tool.available - finding.quantity);
          const log: ToolUsageRecord = {
            id: `AUD-VAR-${Date.now()}-${finding.toolId}`,
            toolId: finding.toolId,
            toolName: tool.name,
            quantity: varianceQty || 1,
            staffId: finding.responsibleStaffId || 'AUDIT-FALLBACK',
            staffName: finding.responsibleStaffName || 'Audit Oversight',
            shiftType: ShiftType.DAY,
            date: date,
            timeOut: '00:00',
            isReturned: false,
            conditionOnReturn: finding.condition,
            attendantId: currentUser.id,
            attendantName: currentUser.name,
            issuanceType: 'Outstanding',
            physicalArchiveId: auditId,
            comment: `[AUDIT] ${finding.notes || 'Unaccounted item state during store inspection.'}`,
            monetaryValue: tool.monetaryValue || 0,
            escalationStatus: 'Pending', 
            escalationStage: 'Store'
          };

          updatedUsage.unshift(log);

          let nextComposition = tool.composition;
          if (finding.pieceStatus && tool.composition) {
             nextComposition = tool.composition.map(piece => {
                const cleanName = piece.replace(/\s*\(MISSING\)/g, '').replace(/\s*\(DAMAGED\)/g, '');
                const status = finding.pieceStatus[piece];
                if (status === 'Missing') return `${cleanName} (MISSING)`;
                if (status === 'Damaged') return `${cleanName} (DAMAGED)`;
                return cleanName;
             });
          }

          const isMulti = tool.assetClass === 'Set' || tool.assetClass === 'Toolbox';
          const nextAvailable = isMulti ? (Number(finding.quantity) > 0 ? 1 : 0) : Number(finding.quantity);

          const nextTool: ToolAsset = { 
            ...tool, 
            available: Math.max(0, nextAvailable),
            composition: nextComposition,
            condition: (finding.condition === 'Damaged' || hasPieceVariances) ? 'Maintenance' : finding.condition
          };
          
          updatedToolsMap.set(normalizeIdStr(tool.id), nextTool);
        }
      }

      onUpdateAuditHistory([auditLog, ...cloudAuditHistory]);
      onUpdateUsageLogs(updatedUsage);
      onUpdateTools(Array.from(updatedToolsMap.values()));
      setIsWeeklyAuditOpen(false);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    } finally {
      setSystemBusy(false);
    }
  };

  const handleReturnConfirm = async (logData: ToolUsageRecord, cond: ToolCondition, notes: string, returnedQty: number, nextProtocol?: string, signature?: string, updatedComposition?: string[]) => {
    setSystemBusy(true);
    try {
      const existingLog = cloudUsageLogs.find(l => normalizeIdStr(l.id) === normalizeIdStr(logData.id));
      const log = existingLog || logData;
      const isResolved = !nextProtocol;
      
      let nextStatus = log.escalationStatus || 'Pending';
      let nextStage = log.escalationStage || 'Store';
      let expiry = log.graceExpiryDate;

      if (nextProtocol === 'grant_grace') {
        nextStatus = 'In-Grace-Period';
        const d = new Date(); d.setDate(d.getDate() + 30);
        expiry = d.toISOString().split('T')[0];
      } else if (nextProtocol === 'escalate_to_manager') {
        nextStage = 'Manager';
      }

      const receiverStamp = `[RECEIVED BY: ${currentUser.name} @ ${new Date().toLocaleTimeString()}]`;
      const finalComment = `${log.comment || ''} | ${receiverStamp} | ${notes}`.trim().replace(/^ \| /, '');

      const updatedLog: ToolUsageRecord = {
        ...log,
        isReturned: isResolved,
        conditionOnReturn: cond,
        comment: finalComment,
        timeIn: isResolved ? new Date().toLocaleTimeString() : undefined,
        escalationStatus: isResolved ? 'Resolved' : nextStatus as any,
        escalationStage: nextStage as any,
        graceExpiryDate: expiry,
        recipientSignature: signature || log.recipientSignature,
        attendantName: currentUser.name, 
        actionHistory: [...(log.actionHistory || []), {
          stage: log.escalationStage || 'Store',
          actorName: currentUser.name,
          action: isResolved ? 'FINAL_RESOLUTION_RETURN' : (nextProtocol ? `ESCALATION_${nextProtocol.toUpperCase()}` : 'CUSTODIAL_RETURN_UPDATE'),
          timestamp: new Date().toLocaleString(),
          notes: notes || 'Registry Reconciled'
        }]
      };

      if (existingLog) {
        onUpdateUsageLogs(cloudUsageLogs.map(l => l.id === log.id ? updatedLog : l));
      } else {
        onUpdateUsageLogs([updatedLog, ...cloudUsageLogs]);
      }

      const tool = cloudTools.find(t => normalizeIdStr(t.id) === normalizeIdStr(log.toolId));
      if (tool) {
        const isMulti = tool.assetClass === 'Set' || tool.assetClass === 'Toolbox';
        
        let incrementAmount = 0;
        if (isMulti) {
          const isEntirelyMissing = updatedComposition && updatedComposition.length > 0 && updatedComposition.every(p => p.includes('(MISSING)'));
          const isPhysicallyBack = cond !== 'Lost' || (updatedComposition && !isEntirelyMissing);
          incrementAmount = isPhysicallyBack ? 1 : 0;
        } else {
          incrementAmount = cond !== 'Lost' ? returnedQty : 0;
        }

        const nextAvailable = Math.min(tool.quantity, tool.available + incrementAmount);

        let nextComposition = updatedComposition || tool.composition;
        const isHealthy = cond === 'Good' || cond === 'Fair' || cond === 'Excellent';

        if (isResolved && isHealthy && isMulti) {
           const currentComp = updatedComposition || tool.composition || [];
           nextComposition = currentComp.map(p => p.replace(/\s*\(MISSING\)/g, '').replace(/\s*\(DAMAGED\)/g, ''));
        }
        
        const updatedTool: ToolAsset = { 
            ...tool, 
            available: nextAvailable, 
            lastVerified: new Date().toISOString().split('T')[0],
            composition: nextComposition,
            condition: (isResolved && isHealthy && (!isMulti || !nextComposition?.some(p => p.includes('(MISSING)')))) 
              ? 'Good' 
              : (cond === 'Damaged' || (isMulti && nextComposition?.some(p => p.includes('(MISSING)'))) ? 'Maintenance' : tool.condition) as ToolCondition
        };
        
        onUpdateTools(cloudTools.map(t => normalizeIdStr(t.id) === normalizeIdStr(tool.id) ? updatedTool : t));
      }
    } finally { setSystemBusy(false); }
  };

  const handleIssuanceConfirm = async (issuance: Partial<ToolUsageRecord>, toolIds: string[], quantities: Record<string, number>) => {
    setSystemBusy(true);
    try {
      const batchId = `B-${Date.now()}`;
      const newLogs: ToolUsageRecord[] = [];
      const updatedToolsMap = new Map(cloudTools.map(t => [normalizeIdStr(t.id), t]));

      for (const tid of toolIds) {
        const tool = updatedToolsMap.get(normalizeIdStr(tid));
        const qty = quantities[tid] || 1;
        if (!tool) continue;

        const log: ToolUsageRecord = {
          ...issuance,
          id: `L-${Date.now()}-${tid}`,
          batchId,
          toolId: tid,
          toolName: tool.name,
          quantity: qty,
          date: new Date().toISOString().split('T')[0],
          isReturned: false,
          monetaryValue: tool.monetaryValue || 0,
          escalationStatus: 'Pending',
          escalationStage: 'Store'
        } as ToolUsageRecord;

        newLogs.push(log);

        const updatedTool = { ...tool, available: Math.max(0, tool.available - qty) };
        updatedToolsMap.set(normalizeIdStr(tid), updatedTool);
      }

      onUpdateUsageLogs([...newLogs, ...cloudUsageLogs]);
      onUpdateTools(Array.from(updatedToolsMap.values()));
      setIsIssuingTool(false);
    } finally { setSystemBusy(false); }
  };

  const handleLogbookCommit = async (record: PhysicalLogbookRecord, issues: any[]) => {
    setSystemBusy(true);
    try {
      const updatedUsage = [...cloudUsageLogs];
      const updatedToolsMap = new Map(cloudTools.map(t => [normalizeIdStr(t.id), t]));

      for (const issue of issues) {
        const tool = updatedToolsMap.get(normalizeIdStr(issue.toolId));
        const log: ToolUsageRecord = {
          id: `VAR-${Date.now()}-${issue.toolId}`,
          toolId: issue.toolId,
          toolName: tool?.name || issue.toolId,
          quantity: issue.quantity,
          staffId: issue.staffId,
          staffName: masterEmployees.find(e => e.id === issue.staffId)?.name || 'Unknown',
          shiftType: record.shiftType,
          date: record.date,
          timeOut: '00:00',
          isReturned: false,
          conditionOnReturn: issue.condition,
          attendantId: record.attendantId,
          attendantName: record.attendantName || '',
          issuanceType: 'Outstanding',
          physicalArchiveId: record.id,
          comment: `[LOGBOOK] ${issue.notes}`,
          monetaryValue: tool?.monetaryValue || 0,
          escalationStatus: 'Pending',
          escalationStage: 'Store'
        };

        updatedUsage.unshift(log);

        if (tool) {
           const isMulti = tool.assetClass === 'Set' || tool.assetClass === 'Toolbox';
           const decrementAmount = isMulti ? 0 : issue.quantity;
           const nextTool = { ...tool, available: Math.max(0, tool.available - decrementAmount) };
           updatedToolsMap.set(normalizeIdStr(tool.id), nextTool);
        }
      }

      onUpdatePhysicalLogs([record, ...cloudPhysicalLogs]);
      onUpdateUsageLogs(updatedUsage);
      onUpdateTools(Array.from(updatedToolsMap.values()));
      setIsDigitizingLog(false);
    } finally { setSystemBusy(false); }
  };

  return {
    state: { 
      activeTab, setActiveTab, searchTerm, setSearchTerm, 
      categoryFilter, setCategoryFilter,
      zoneFilter, setZoneFilter,
      conditionFilter, setConditionFilter,
      archiveStatusFilter, setArchiveStatusFilter,
      archiveOfficerFilter, setArchiveOfficerFilter,
      expandedZones, setExpandedZones, expandedAuditId, setExpandedAuditId, 
      isAddingTool, setIsAddingTool, isIssuingTool, setIsIssuingTool, isDigitizingLog, setIsDigitizingLog, 
      isWeeklyAuditOpen, setIsWeeklyAuditOpen, isReportingMaintenance, setIsReportingMaintenance, 
      verifyingLog, setVerifyingLog, editingTool, setEditingTool, auditZone, setAuditZone, 
      auditTargetLog, setAuditTargetLog, resolvingMaintenance, setResolvingMaintenance, reassigningMaintenance, setReassigningMaintenance, maintenanceRecords 
    },
    computed: { 
      monitoredItems: cloudUsageLogs.filter(l => !l.isReturned || (l.conditionOnReturn === 'Lost' || l.conditionOnReturn === 'Damaged')), 
      filteredTools: useMemo(() => {
        const s = searchTerm.toLowerCase();
        return cloudTools.filter(t => {
          const matchesSearch = (t.name || '').toLowerCase().includes(s) || (t.id || '').toLowerCase().includes(s);
          const matchesCategory = categoryFilter === 'ALL' || t.category === categoryFilter;
          const matchesZone = zoneFilter === 'ALL' || t.zone === zoneFilter;
          
          let matchesCondition = true;
          if (conditionFilter === 'VARIANCE') {
            const held = cloudUsageLogs.filter(l => normalizeIdStr(l.toolId) === normalizeIdStr(t.id) && !l.isReturned).reduce((acc, curr) => acc + (curr.quantity || 0), 0);
            const leaks = Math.max(0, (t.quantity - t.available) - held);
            matchesCondition = leaks > 0;
          } else if (conditionFilter === 'OUT_OF_STOCK') {
            matchesCondition = t.available === 0;
          } else if (conditionFilter === 'IRREPARABLE') {
            matchesCondition = t.condition === 'Irreparable' || t.condition === 'Lost';
          } else if (conditionFilter !== 'ALL') {
            matchesCondition = t.condition === conditionFilter;
          }
          
          return matchesSearch && matchesCategory && matchesZone && matchesCondition;
        });
      }, [cloudTools, cloudUsageLogs, searchTerm, categoryFilter, zoneFilter, conditionFilter]),
      filteredLogs: useMemo(() => {
        const s = searchTerm.toLowerCase();
        return cloudPhysicalLogs.filter(log => {
          const matchesSearch = (log.attendantName || '').toLowerCase().includes(s) || (log.notes || '').toLowerCase().includes(s) || (log.pageNumber || '').toLowerCase().includes(s);
          const matchesOfficer = archiveOfficerFilter === 'ALL' || log.attendantId === archiveOfficerFilter;
          let matchesStatus = true;
          if (archiveStatusFilter !== 'ALL') {
            const logNormId = normalizeIdStr(log.id);
            const logNormPage = normalizeIdStr(log.pageNumber || '');
            const linkedCount = cloudUsageLogs.filter(u => {
              if (u.escalationStatus === 'Resolved') return false;
              const uLink = normalizeIdStr(u.physicalArchiveId || u.batchId || '');
              const uComment = normalizeIdStr(u.comment || '');
              return (uLink === logNormId || (logNormPage && uComment.includes(logNormPage)));
            }).filter(u => !u.isReturned).length;
            if (archiveStatusFilter === 'ISSUES') matchesStatus = linkedCount > 0;
            else if (archiveStatusFilter === 'CLEAR') matchesStatus = linkedCount === 0;
          }
          return matchesSearch && matchesOfficer && matchesStatus;
        });
      }, [cloudPhysicalLogs, cloudUsageLogs, searchTerm, archiveStatusFilter, archiveOfficerFilter]), 
      stats: { 
        totalAssets: cloudTools.length,
        totalUnits: cloudTools.reduce((acc, t) => acc + t.quantity, 0),
        totalValue: cloudTools.reduce((acc, t) => acc + ((t.monetaryValue || 0) * t.quantity), 0), 
        criticalIssues: cloudTools.filter(t => t.condition === 'Damaged' || t.condition === 'Lost' || t.condition === 'Maintenance').length, 
        outstandingCount: cloudUsageLogs.filter(l => !l.isReturned).length, 
        lastInspection: [...cloudAuditHistory].sort((a,b) => String(b.date || '').localeCompare(String(a.date || '')))[0]?.date?.split(' ')[0] || '---' 
      } 
    },
    handlers: { 
      handleReturnConfirm, handleLogbookCommit, handleEscalationAction: async () => {}, 
      handleMaintenanceReport, handleMaintenanceResolve, handleMaintenanceEscalate, handleMaintenanceReassign,
      handleIssuanceConfirm, handleInspectionCommit,
      syncToolAsset: async (t: ToolAsset) => { await syncToolToGoogleSheets(t); },
      toggleZoneExpansion: (z: string) => setExpandedZones(prev => { const n = new Set(prev); if (n.has(z)) n.delete(z); else n.add(z); return n; }) 
    }
  };
};
