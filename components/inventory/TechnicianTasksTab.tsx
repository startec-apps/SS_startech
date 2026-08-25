import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wrench, 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter, 
  Calendar, 
  Trash2, 
  PackageCheck,
  PackageMinus,
  Briefcase,
  X,
  FileText,
  Download,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Users,
  UserCheck,
  ClipboardCheck,
  CalendarCheck,
  Check,
  ExternalLink,
  Edit3,
  RotateCcw,
  Loader2,
  AlertTriangle,
  Save,
  FileDown,
  Printer,
  Eye
} from 'lucide-react';
import { Employee, ToolAsset, DayType, AttendanceRecord } from '../../types';
import { 
  fetchTechnicianTasksFromGoogleSheets, 
  syncTechnicianTaskToGoogleSheets, 
  deleteTechnicianTaskFromGoogleSheets,
  fetchSparesFromGoogleSheets,
  syncSpareIssueToGoogleSheets,
  syncAttendanceToGoogleSheets,
  syncAttendanceBulkToGoogleSheets
} from '../../services/googleSheets';
import { generateSingleJobCardPDF } from '../../utils/jobCardPdfGenerator';

const MOCK_TASK_JCS = ['JC-1006', 'JC-1005', 'JC-1004', 'IT-JC-4102', 'IT-JC-4103', 'IT-JC-4099'];

const isMockTaskRecord = (t: any) => {
  if (!t) return true;
  if (t.jobCardNumber && MOCK_TASK_JCS.includes(t.jobCardNumber)) return true;
  if (t.technicianName && (t.technicianName.includes('Alex Mercer') || t.technicianName.includes('David Miller'))) return true;
  return false;
};

export interface TeamMemberRef {
  id: string;
  name: string;
}

export interface AttendanceRegisterEntry {
  employeeId: string;
  employeeName: string;
  shift: string;
  startTime: string;
  endTime: string;
  status: 'Auto-Logged' | 'Verified' | 'Pending Verification';
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface AttendanceRegisterData {
  autoMark: boolean;
  shift: string;
  startTime: string;
  endTime: string;
  entries: AttendanceRegisterEntry[];
  timestamp: string;
}

export interface TechnicianTaskLog {
  id: string;
  date: string;
  technicianId: string;
  technicianName: string;
  teamMembers?: TeamMemberRef[];
  jobCardNumber: string;
  equipmentRef: string;
  category: 'IT Services' | 'Protection Services' | string;
  description: string;
  sparesUsed?: string;
  issuedItemId?: string;
  issuedQty?: number;
  hoursSpent?: number;
  status: 'Completed' | 'In Progress' | 'Pending Review';
  supervisorSignoff?: string;
  attendanceRegister?: AttendanceRegisterData;
}

interface TechnicianTasksTabProps {
  masterEmployees: Employee[];
  currentUser: Employee;
  hasPermission: (module: string, action?: any, subHub?: string) => boolean;
  inventoryTools?: ToolAsset[];
  onUpdateTools?: (tools: ToolAsset[]) => void;
  onSyncAttendance?: (records: any[]) => void;
}

// Helper to calculate hours between two 24h timestamps
const calculateHoursFromTimes = (start: string, end: string): number => {
  if (!start || !end) return 9;
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  if (isNaN(startH) || isNaN(endH)) return 9;
  let diffMinutes = (endH * 60 + (endM || 0)) - (startH * 60 + (startM || 0));
  if (diffMinutes < 0) {
    diffMinutes += 24 * 60;
  }
  return Math.round((diffMinutes / 60) * 10) / 10;
};

// Fallback inventory items array - empty to rely strictly on database records
const DEFAULT_INVENTORY_ITEMS: ToolAsset[] = [];

export const TechnicianTasksTab: React.FC<TechnicianTasksTabProps> = ({
  masterEmployees = [],
  currentUser,
  hasPermission,
  inventoryTools = [],
  onUpdateTools,
  onSyncAttendance
}) => {
  // Local state & persistence for tasks
  const [tasks, setTasks] = useState<TechnicianTaskLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Local state for tools if onUpdateTools is not supplied
  const [localTools, setLocalTools] = useState<ToolAsset[]>([]);

  // Modal toggle
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);

  // Edit modal states
  const [editingTask, setEditingTask] = useState<TechnicianTaskLog | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Edit form field states
  const [editTechId, setEditTechId] = useState('');
  const [editTechName, setEditTechName] = useState('');
  const [editSelectedTeamMemberIds, setEditSelectedTeamMemberIds] = useState<string[]>([]);
  const [editDate, setEditDate] = useState('');
  const [editJobCardNumber, setEditJobCardNumber] = useState('');
  const [editEquipmentRef, setEditEquipmentRef] = useState('');
  const [editCategory, setEditCategory] = useState<TechnicianTaskLog['category']>('IT Services');
  const [editDescription, setEditDescription] = useState('');
  const [editSparesUsed, setEditSparesUsed] = useState('');
  const [editStatus, setEditStatus] = useState<TechnicianTaskLog['status']>('In Progress');
  const [editAutoMarkAttendance, setEditAutoMarkAttendance] = useState(false);
  const [editAttendanceShift, setEditAttendanceShift] = useState('Day Shift (07:00 - 17:00)');
  const [editAttendanceStartTime, setEditAttendanceStartTime] = useState('07:30');
  const [editAttendanceEndTime, setEditAttendanceEndTime] = useState('16:30');

  // Delete modal states
  const [taskToDelete, setTaskToDelete] = useState<TechnicianTaskLog | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Helper to check if a technician already has attendance recorded on a specific date (across tasks or register)
  const hasExistingAttendanceForDate = (employeeId: string, employeeName: string, targetDate: string, excludeTaskId?: string) => {
    const empIdLower = (employeeId || '').trim().toLowerCase();
    const empNameLower = (employeeName || '').trim().toLowerCase();
    if (!empIdLower && !empNameLower) return false;

    // 1. Check existing tasks for targetDate that have attendance register recorded
    const taskHasIt = tasks.some(t => {
      if (excludeTaskId && t.id === excludeTaskId) return false;
      if (t.date !== targetDate || !t.attendanceRegister) return false;
      const tTechId = (t.technicianId || '').trim().toLowerCase();
      const tTechName = (t.technicianName || '').trim().toLowerCase();
      if ((empIdLower && tTechId === empIdLower) || (empNameLower && tTechName === empNameLower)) {
        return true;
      }
      return (t.teamMembers || []).some(m => {
        const mId = (m.id || '').trim().toLowerCase();
        const mName = (m.name || '').trim().toLowerCase();
        return (empIdLower && mId === empIdLower) || (empNameLower && mName === empNameLower);
      });
    });

    if (taskHasIt) return true;

    // 2. Check stored attendance register records in local storage
    try {
      const rawAtt = localStorage.getItem('siteops_attendance_records') || localStorage.getItem('attendance_records') || '[]';
      const attRecords: any[] = JSON.parse(rawAtt);
      if (Array.isArray(attRecords)) {
        return attRecords.some(r => 
          r.date === targetDate && 
          (r.employeeId || '').toLowerCase() === empIdLower &&
          (r.status === 'Present' || r.isApproved)
        );
      }
    } catch {}

    return false;
  };

  // Form states
  const [techId, setTechId] = useState(currentUser?.id || '');
  const [techName, setTechName] = useState(currentUser?.name || '');
  const [selectedTeamMemberIds, setSelectedTeamMemberIds] = useState<string[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [jobCardNumber, setJobCardNumber] = useState('');
  const [equipmentRef, setEquipmentRef] = useState('');
  const [category, setCategory] = useState<TechnicianTaskLog['category']>('IT Services');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TechnicianTaskLog['status']>('Completed');

  // Part Issuance Form State
  const [issueItem, setIssueItem] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [issueQty, setIssueQty] = useState<number>(1);
  const [customSparesText, setCustomSparesText] = useState('');

  // Auto Mark Attendance Register form states
  const [autoMarkAttendance, setAutoMarkAttendance] = useState(true);
  const [attendanceShift, setAttendanceShift] = useState('Day Shift (07:00 - 17:00)');
  const [attendanceStartTime, setAttendanceStartTime] = useState('07:30');
  const [attendanceEndTime, setAttendanceEndTime] = useState('16:30');
  const [autoMarkTeamMembers, setAutoMarkTeamMembers] = useState(true);

  // Spares Inventory Catalog state
  const [sparesCatalog, setSparesCatalog] = useState<{ id: string; name: string; available: number; partNumber?: string; quantity?: number }[]>([]);

  // Attendance Verification Modal state
  const [selectedTaskForAttendance, setSelectedTaskForAttendance] = useState<TechnicianTaskLog | null>(null);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [myShiftInput, setMyShiftInput] = useState('Day Shift (07:00 - 17:00)');
  const [myStartTimeInput, setMyStartTimeInput] = useState('07:30');
  const [myEndTimeInput, setMyEndTimeInput] = useState('16:30');

  // Single Job Card Preview & PDF Modal state
  const [previewTask, setPreviewTask] = useState<TechnicianTaskLog | null>(null);
  const [isDownloadingPdfId, setIsDownloadingPdfId] = useState<string | null>(null);

  // Attendance Prompt Banner dismissed tasks state
  const [dismissedPromptTaskIds, setDismissedPromptTaskIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('dismissed_attendance_prompts');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const acknowledgePrompt = (taskId: string) => {
    const updated = [...dismissedPromptTaskIds, taskId];
    setDismissedPromptTaskIds(updated);
    try {
      localStorage.setItem('dismissed_attendance_prompts', JSON.stringify(updated));
    } catch {}
  };

  // Identify tasks where currentUser is strictly a team member (and NOT the team lead) and attendance was auto-marked
  const memberAttendancePromptTasks = useMemo(() => {
    if (!currentUser) return [];
    const currentIdLower = (currentUser.id || '').trim().toLowerCase();
    const currentNameLower = (currentUser.name || '').trim().toLowerCase();

    return tasks.filter(t => {
      if (!t.attendanceRegister || !t.attendanceRegister.autoMark) return false;
      if (dismissedPromptTaskIds.includes(t.id)) return false;

      // Exclude Team Lead (the person who recorded/leads the task)
      const leadIdLower = (t.technicianId || '').trim().toLowerCase();
      const leadNameLower = (t.technicianName || '').trim().toLowerCase();
      const isLead = (currentIdLower && leadIdLower === currentIdLower) || 
                     (currentNameLower && leadNameLower === currentNameLower);
      if (isLead) return false; // Lead technician shouldn't get "Your Team Lead marked your attendance" prompt!

      // Check if current user is explicitly a team member
      const isMember = (t.teamMembers || []).some(m => {
        const mIdLower = (m.id || '').trim().toLowerCase();
        const mNameLower = (m.name || '').trim().toLowerCase();
        return (currentIdLower && mIdLower === currentIdLower) || 
               (currentNameLower && mNameLower === currentNameLower);
      });

      return isMember;
    });
  }, [tasks, currentUser, dismissedPromptTaskIds]);

  // Check if the selected technician already has attendance logged for the chosen date
  const isTechnicianAttendanceAlreadyLogged = useMemo(() => {
    return hasExistingAttendanceForDate(
      techId || currentUser?.id || '',
      techName || currentUser?.name || '',
      date
    );
  }, [tasks, techId, techName, currentUser, date]);

  // Check if technician being edited already has attendance logged for the editDate (excluding current task)
  const isEditTechnicianAttendanceAlreadyLogged = useMemo(() => {
    if (!editingTask) return false;
    return hasExistingAttendanceForDate(
      editTechId || editingTask.technicianId,
      editTechName || editingTask.technicianName,
      editDate,
      editingTask.id
    );
  }, [tasks, editTechId, editTechName, editDate, editingTask]);

  const activeCatalog = useMemo(() => {
    let sourceList: any[] = [];
    if (sparesCatalog && sparesCatalog.length > 0) {
      sourceList = sparesCatalog;
    } else if (inventoryTools && inventoryTools.length > 0) {
      sourceList = inventoryTools.map(t => ({ id: t.id, name: t.name, available: t.available ?? t.quantity ?? 0, quantity: t.quantity ?? t.available ?? 0, partNumber: t.serialNumber }));
    } else if (localTools && localTools.length > 0) {
      sourceList = localTools.map(t => ({ id: t.id, name: t.name, available: t.available ?? t.quantity ?? 0, quantity: t.quantity ?? t.available ?? 0, partNumber: t.serialNumber }));
    } else {
      sourceList = DEFAULT_INVENTORY_ITEMS.map(t => ({ id: t.id, name: t.name, available: t.available ?? t.quantity ?? 0, quantity: t.quantity ?? t.available ?? 0, partNumber: t.serialNumber }));
    }

    const seenIds = new Set<string>();
    return sourceList.filter(item => {
      if (!item || !item.id) return false;
      if (seenIds.has(item.id)) return false;
      seenIds.add(item.id);
      return true;
    });
  }, [sparesCatalog, inventoryTools, localTools]);

  // Selected item object
  const selectedToolAsset = useMemo(() => {
    if (!selectedItemId) return null;
    return activeCatalog.find(t => t.id === selectedItemId) || null;
  }, [activeCatalog, selectedItemId]);

  // Fetch Spares Inventory
  const refreshSparesCatalog = async () => {
    try {
      const { spares, receipts, issues } = await fetchSparesFromGoogleSheets();
      if (spares && spares.length > 0) {
        const seenIds = new Set<string>();
        const items: any[] = [];
        spares.forEach((s: any) => {
          let sid = s.id || `SPR-${items.length + 1001}`;
          if (seenIds.has(sid)) {
            sid = `${sid}-${items.length + 1}`;
          }
          seenIds.add(sid);

          const itemReceipts = (receipts || []).filter((r: any) => r.spareId === s.id);
          const itemIssues = (issues || []).filter((i: any) => i.spareId === s.id);
          const recQty = itemReceipts.reduce((sum: number, r: any) => sum + (Number(r.quantity) || 0), 0);
          const issQty = itemIssues.reduce((sum: number, i: any) => sum + (Number(i.quantity) || 0), 0);
          const baseStock = Number(s.currentStock ?? s.initialStock ?? 0);
          const netStock = itemReceipts.length > 0 ? (recQty - issQty) : Math.max(0, baseStock - issQty);

          items.push({
            id: sid,
            name: s.name || s.description || 'Spare Part',
            partNumber: s.partNumber || s.sku || '',
            available: Math.max(0, netStock),
            quantity: Math.max(0, netStock)
          });
        });
        setSparesCatalog(items);
      }
    } catch (err) {
      console.debug('Notice fetching spares catalog:', err);
    }
  };

  // Load Task Logs, Spares & Local Inventory
  useEffect(() => {
    setIsLoadingTasks(true);
    refreshSparesCatalog();
    fetchTechnicianTasksFromGoogleSheets().then(remoteTasks => {
      if (remoteTasks && remoteTasks.length > 0) {
        const cleanRemote = remoteTasks.filter(t => !isMockTaskRecord(t));
        setTasks(cleanRemote);
      } else {
        const saved = localStorage.getItem('workshop_technician_tasks');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            const cleanLocal = Array.isArray(parsed) ? parsed.filter((t: any) => !isMockTaskRecord(t)) : [];
            setTasks(cleanLocal);
            localStorage.setItem('workshop_technician_tasks', JSON.stringify(cleanLocal));
          } catch {
            setTasks([]);
            localStorage.setItem('workshop_technician_tasks', JSON.stringify([]));
          }
        } else {
          setTasks([]);
          localStorage.setItem('workshop_technician_tasks', JSON.stringify([]));
        }
      }
    }).catch(() => {
      const saved = localStorage.getItem('workshop_technician_tasks');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const cleanLocal = Array.isArray(parsed) ? parsed.filter((t: any) => !isMockTaskRecord(t)) : [];
          setTasks(cleanLocal);
          localStorage.setItem('workshop_technician_tasks', JSON.stringify(cleanLocal));
        } catch {
          setTasks([]);
        }
      }
    }).finally(() => {
      setIsLoadingTasks(false);
    });

    // Load local tools backup
    const savedTools = localStorage.getItem('workshop_local_inventory_spares');
    if (savedTools) {
      try {
        setLocalTools(JSON.parse(savedTools));
      } catch {
        setLocalTools(DEFAULT_INVENTORY_ITEMS);
      }
    } else {
      setLocalTools(DEFAULT_INVENTORY_ITEMS);
      localStorage.setItem('workshop_local_inventory_spares', JSON.stringify(DEFAULT_INVENTORY_ITEMS));
    }
  }, [currentUser]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const saveTasksToStorage = (updatedTasks: TechnicianTaskLog[]) => {
    const cleanTasks = updatedTasks.filter(t => !isMockTaskRecord(t));
    setTasks(cleanTasks);
    localStorage.setItem('workshop_technician_tasks', JSON.stringify(cleanTasks));
    cleanTasks.forEach(task => {
      syncTechnicianTaskToGoogleSheets(task).catch(() => {});
    });
  };

  // Open Modal Helper with Automated Job Card Number
  const handleOpenModal = (isIssuing: boolean) => {
    setIssueItem(isIssuing);
    const autoJC = `JC-${String(tasks.length + 1001).padStart(4, '0')}`;
    setJobCardNumber(autoJC);
    const targetTechId = currentUser?.id || (masterEmployees[0]?.id || '');
    const targetTechName = currentUser?.name || (masterEmployees[0]?.name || 'Technician');
    const today = new Date().toISOString().split('T')[0];
    setTechId(targetTechId);
    setTechName(targetTechName);
    setSelectedTeamMemberIds([]);
    setDate(today);
    setEquipmentRef('');
    setDescription('');
    setCustomSparesText('');
    setSelectedItemId('');
    setIssueQty(1);
    setCategory('IT Services');
    setStatus('Completed');
    const alreadyLogged = hasExistingAttendanceForDate(targetTechId, targetTechName, today);
    setAutoMarkAttendance(!alreadyLogged);
    setAttendanceShift('Day Shift (07:00 - 17:00)');
    setAttendanceStartTime('07:30');
    setAttendanceEndTime('16:30');
    setAutoMarkTeamMembers(true);
    setIsModalOpen(true);
  };

  // Open Attendance Details & Verification Modal
  const handleOpenAttendanceModal = (task: TechnicianTaskLog) => {
    setSelectedTaskForAttendance(task);
    const reg = task.attendanceRegister;
    if (reg) {
      setMyShiftInput(reg.shift || 'Day Shift (07:00 - 17:00)');
      setMyStartTimeInput(reg.startTime || '07:30');
      setMyEndTimeInput(reg.endTime || '16:30');
    } else {
      setMyShiftInput('Day Shift (07:00 - 17:00)');
      setMyStartTimeInput('07:30');
      setMyEndTimeInput('16:30');
    }
    setIsAttendanceModalOpen(true);
  };

  // Verify / Log Attendance for the currently logged-in user
  const handleVerifyMyAttendance = () => {
    if (!selectedTaskForAttendance) return;

    const currentReg = selectedTaskForAttendance.attendanceRegister || {
      autoMark: true,
      shift: myShiftInput,
      startTime: myStartTimeInput,
      endTime: myEndTimeInput,
      entries: [],
      timestamp: new Date().toISOString()
    };

    const existingEntries = [...(currentReg.entries || [])];
    const myEntryIdx = existingEntries.findIndex(e => e.employeeId === currentUser.id);

    const updatedEntry: AttendanceRegisterEntry = {
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      shift: myShiftInput,
      startTime: myStartTimeInput,
      endTime: myEndTimeInput,
      status: 'Verified',
      verifiedAt: new Date().toISOString(),
      verifiedBy: currentUser.name
    };

    if (myEntryIdx >= 0) {
      existingEntries[myEntryIdx] = updatedEntry;
    } else {
      existingEntries.push(updatedEntry);
    }

    const updatedTask: TechnicianTaskLog = {
      ...selectedTaskForAttendance,
      attendanceRegister: {
        ...currentReg,
        shift: myShiftInput,
        startTime: myStartTimeInput,
        endTime: myEndTimeInput,
        entries: existingEntries
      }
    };

    const nextTasks = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    saveTasksToStorage(nextTasks);
    setSelectedTaskForAttendance(updatedTask);

    // Sync to central storage
    try {
      const rawAtt = localStorage.getItem('siteops_attendance_records') || localStorage.getItem('attendance_records') || '[]';
      let attRecords: any[] = JSON.parse(rawAtt);
      const dateStr = updatedTask.date;
      const existingIdx = attRecords.findIndex(r => r.employeeId === currentUser.id && r.date === dateStr);
      const attEntry: AttendanceRecord = {
        date: dateStr,
        employeeId: currentUser.id,
        shiftId: myShiftInput.toLowerCase().includes('night') ? 'SHIFT-NIGHT' : 'SHIFT-DAY',
        status: 'Present',
        overtimeHours: myShiftInput.toLowerCase().includes('overtime') ? 2 : 0,
        comment: `Verified via Technician Task (${updatedTask.jobCardNumber})`,
        dayType: DayType.STANDARD,
        hoursWorked: 8,
        startTime: myStartTimeInput,
        endTime: myEndTimeInput,
        isApproved: true,
        approvedBy: currentUser.name,
        approvedDate: new Date().toISOString()
      };

      if (existingIdx >= 0) {
        attRecords[existingIdx] = { ...attRecords[existingIdx], ...attEntry };
      } else {
        attRecords.push(attEntry);
      }

      localStorage.setItem('siteops_attendance_records', JSON.stringify(attRecords));
      localStorage.setItem('attendance_records', JSON.stringify(attRecords));

      syncAttendanceToGoogleSheets(attEntry).catch(err => {
        console.debug('Google Sheets attendance sync notice:', err);
      });

      if (onSyncAttendance) {
        onSyncAttendance([attEntry]);
      }
    } catch (err) {
      console.debug('Notice syncing attendance:', err);
    }

    triggerToast(`Attendance register verified & signed for ${currentUser.name}`);
  };

  // Function to deduct item quantity from inventory
  const deductInventoryItem = (itemId: string, qtyToDeduct: number): string | null => {
    const targetTool = activeCatalog.find(t => t.id === itemId);
    if (!targetTool) return null;

    const currentAvail = targetTool.available ?? targetTool.quantity ?? 0;
    if (currentAvail < qtyToDeduct) {
      alert(`Insufficient stock! Available: ${currentAvail}, requested: ${qtyToDeduct}`);
      return null;
    }

    const updatedCatalog = activeCatalog.map(t => {
      if (t.id === itemId) {
        const nextAvail = Math.max(0, (t.available ?? t.quantity) - qtyToDeduct);
        const nextQty = Math.max(0, t.quantity - qtyToDeduct);
        return {
          ...t,
          available: nextAvail,
          quantity: nextQty
        };
      }
      return t;
    });

    // Save to master handler or local state
    if (onUpdateTools && inventoryTools && inventoryTools.length > 0) {
      onUpdateTools(updatedCatalog);
    } else {
      setLocalTools(updatedCatalog);
      localStorage.setItem('workshop_local_inventory_spares', JSON.stringify(updatedCatalog));
    }

    return targetTool.name;
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      alert('Please fill out Work Done / Comments.');
      return;
    }

    let issuedSparesText = customSparesText.trim();

    const selectedEmp = masterEmployees.find(e => e.id === techId);
    const assignedName = selectedEmp ? selectedEmp.name : (techName || currentUser.name);
    const finalJC = jobCardNumber.trim() ? jobCardNumber.trim().toUpperCase() : `JC-${String(tasks.length + 1001).padStart(4, '0')}`;

    // Deduct from inventory if issuing an item
    if (issueItem && selectedItemId) {
      if (!selectedToolAsset) {
        alert('Please select a valid inventory spare part to issue.');
        return;
      }
      const avail = selectedToolAsset.available ?? selectedToolAsset.quantity ?? 0;
      if (avail < issueQty || issueQty < 1) {
        alert(`Cannot issue ${issueQty} pcs. Current available stock is ${avail}.`);
        return;
      }

      // Sync spare issue to Google Sheets Spare Parts Inventory
      const issueRecord = {
        id: `ISS-${Date.now()}`,
        spareId: selectedToolAsset.id,
        spareName: selectedToolAsset.name,
        quantity: issueQty,
        date: date,
        issuedTo: assignedName,
        issuedBy: currentUser?.name || 'Team Lead',
        purpose: description.trim() || `Daily Task (${finalJC})`,
        workOrderRef: finalJC
      };
      syncSpareIssueToGoogleSheets(issueRecord).catch(() => {});

      // Deduct from local tools fallback if present
      deductInventoryItem(selectedItemId, issueQty);

      // Update local spares catalog stock immediately
      setSparesCatalog(prev => prev.map(s => s.id === selectedToolAsset.id ? { ...s, available: Math.max(0, (s.available ?? 0) - issueQty) } : s));

      const itemDeductionNote = `Issued ${issueQty}x ${selectedToolAsset.name}`;
      issuedSparesText = issuedSparesText ? `${itemDeductionNote} (${issuedSparesText})` : itemDeductionNote;
    }

    // Map selected team members
    const teamMembersObj = selectedTeamMemberIds
      .map(id => {
        const emp = masterEmployees.find(m => m.id === id);
        return emp ? { id: emp.id, name: emp.name } : null;
      })
      .filter((m): m is TeamMemberRef => m !== null);

    // Build Attendance Register Payload if auto-mark is enabled and not already logged for this person today
    let attendanceRegData: AttendanceRegisterData | undefined = undefined;

    if (autoMarkAttendance && !isTechnicianAttendanceAlreadyLogged) {
      const rawMemberList = [
        { id: techId || currentUser.id, name: assignedName },
        ...teamMembersObj
      ];
      // Filter out duplicate members by ID
      const uniqueMembers = rawMemberList.filter((m, idx, self) => 
        idx === self.findIndex(t => (t.id || '').toLowerCase() === (m.id || '').toLowerCase())
      );

      const entries: AttendanceRegisterEntry[] = uniqueMembers.map((m, index) => ({
        employeeId: m.id,
        employeeName: m.name,
        shift: attendanceShift,
        startTime: attendanceStartTime,
        endTime: attendanceEndTime,
        status: index === 0 ? 'Verified' : (autoMarkTeamMembers ? ('Auto-Logged' as const) : ('Pending Verification' as const)),
        verifiedAt: index === 0 ? new Date().toISOString() : undefined,
        verifiedBy: index === 0 ? currentUser.name : undefined
      }));

      attendanceRegData = {
        autoMark: true,
        shift: attendanceShift,
        startTime: attendanceStartTime,
        endTime: attendanceEndTime,
        entries: entries,
        timestamp: new Date().toISOString()
      };

      // Sync to central attendance records in local storage and Google Sheets
      try {
        const rawAtt = localStorage.getItem('siteops_attendance_records') || localStorage.getItem('attendance_records') || '[]';
        let attRecords: any[] = JSON.parse(rawAtt);
        if (!Array.isArray(attRecords)) attRecords = [];
        
        const attRecordsToSave: any[] = [];

        entries.forEach(e => {
          const empIdLower = (e.employeeId || '').toLowerCase();
          const existingIdx = attRecords.findIndex(r => 
            (r.employeeId || '').toLowerCase() === empIdLower && r.date === date
          );
          const computedHours = calculateHoursFromTimes(e.startTime, e.endTime) || 9;
          const attEntry: AttendanceRecord = {
            date: date,
            employeeId: e.employeeId,
            shiftId: attendanceShift.toLowerCase().includes('night') ? 'SHIFT-NIGHT' : 'SHIFT-DAY',
            status: 'Present',
            overtimeHours: Math.max(0, computedHours - 9),
            comment: `Auto-marked via Technician Task (${finalJC})`,
            dayType: DayType.STANDARD,
            hoursWorked: computedHours,
            startTime: e.startTime,
            endTime: e.endTime,
            isApproved: true,
            approvedBy: currentUser.name,
            approvedDate: new Date().toISOString()
          };

          if (existingIdx >= 0) {
            attRecords[existingIdx] = { ...attRecords[existingIdx], ...attEntry };
          } else {
            attRecords.push(attEntry);
          }
          attRecordsToSave.push(attEntry);
        });

        localStorage.setItem('siteops_attendance_records', JSON.stringify(attRecords));
        localStorage.setItem('attendance_records', JSON.stringify(attRecords));

        // Sync directly to Google Sheets attendance_records
        syncAttendanceBulkToGoogleSheets(attRecordsToSave).catch(err => {
          console.debug('Google Sheets attendance bulk sync notice:', err);
        });

        // Sync to React state attendanceHistory so Attendance Register Logs auto-syncs instantly
        if (onSyncAttendance) {
          onSyncAttendance(attRecordsToSave);
        }
      } catch (err) {
        console.debug('Notice syncing attendance records:', err);
      }
    }

    const newTask: TechnicianTaskLog = {
      id: `TSK-${Date.now().toString().slice(-6)}`,
      date: date,
      technicianId: techId || currentUser.id,
      technicianName: assignedName,
      teamMembers: teamMembersObj.length > 0 ? teamMembersObj : undefined,
      jobCardNumber: finalJC,
      equipmentRef: equipmentRef.trim() || 'N/A',
      category: category,
      description: description.trim(),
      sparesUsed: issuedSparesText || undefined,
      issuedItemId: issueItem ? selectedItemId : undefined,
      issuedQty: issueItem ? issueQty : undefined,
      hoursSpent: 1,
      status: status,
      supervisorSignoff: status === 'Completed' ? `Signed by ${currentUser.name}` : undefined,
      attendanceRegister: attendanceRegData
    };

    const nextTasks = [newTask, ...tasks];
    saveTasksToStorage(nextTasks);

    if (issueItem && selectedToolAsset) {
      const remaining = Math.max(0, (selectedToolAsset.available ?? selectedToolAsset.quantity) - issueQty);
      triggerToast(`Task logged & ${issueQty}x ${selectedToolAsset.name} deducted from inventory (${remaining} remaining)`);
    } else if (autoMarkAttendance) {
      triggerToast(`Task recorded under ${finalJC} & Attendance Register Auto-Marked (${attendanceStartTime} - ${attendanceEndTime})`);
    } else {
      triggerToast(`Task entry recorded successfully under ${finalJC}`);
    }

    // Reset Form
    setEquipmentRef('');
    setDescription('');
    setCustomSparesText('');
    setIssueItem(false);
    setSelectedItemId('');
    setSelectedTeamMemberIds([]);
    setIssueQty(1);
    setIsModalOpen(false);
  };

  const toggleTaskStatus = (taskId: string) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const nextStatus: TechnicianTaskLog['status'] = t.status === 'Completed' ? 'In Progress' : 'Completed';
        return {
          ...t,
          status: nextStatus,
          supervisorSignoff: nextStatus === 'Completed' ? `Signed by ${currentUser.name}` : undefined
        };
      }
      return t;
    });
    saveTasksToStorage(updated);
    triggerToast('Task status updated');
  };

  const handleDeleteTaskClick = (task: TechnicianTaskLog) => {
    setTaskToDelete(task);
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    setIsDeleting(true);
    try {
      const targetId = taskToDelete.id;
      const targetJc = taskToDelete.jobCardNumber;
      const nextTasks = tasks.filter(t => t.id !== targetId);
      setTasks(nextTasks);
      localStorage.setItem('workshop_technician_tasks', JSON.stringify(nextTasks));
      
      // Update Google Sheets directly
      await deleteTechnicianTaskFromGoogleSheets(targetId);
      triggerToast(`Task record ${targetJc} deleted from database`);
    } catch (err) {
      console.error('Error deleting task:', err);
      triggerToast('Error deleting task record');
    } finally {
      setIsDeleting(false);
      setTaskToDelete(null);
    }
  };

  const handleOpenEditModal = (task: TechnicianTaskLog) => {
    setEditingTask(task);
    setEditTechId(task.technicianId || currentUser?.id || '');
    setEditTechName(task.technicianName || currentUser?.name || '');
    setEditDate(task.date || new Date().toISOString().split('T')[0]);
    setEditJobCardNumber(task.jobCardNumber || '');
    setEditEquipmentRef(task.equipmentRef && task.equipmentRef !== 'N/A' ? task.equipmentRef : '');
    setEditCategory(task.category || 'IT Services');
    setEditDescription(task.description || '');
    setEditSparesUsed(task.sparesUsed || '');
    setEditStatus(task.status || 'In Progress');
    setEditSelectedTeamMemberIds(task.teamMembers ? task.teamMembers.map(m => m.id) : []);

    if (task.attendanceRegister) {
      setEditAutoMarkAttendance(Boolean(task.attendanceRegister.autoMark));
      setEditAttendanceShift(task.attendanceRegister.shift || 'Day Shift (07:00 - 17:00)');
      setEditAttendanceStartTime(task.attendanceRegister.startTime || '07:30');
      setEditAttendanceEndTime(task.attendanceRegister.endTime || '16:30');
    } else {
      setEditAutoMarkAttendance(false);
      setEditAttendanceShift('Day Shift (07:00 - 17:00)');
      setEditAttendanceStartTime('07:30');
      setEditAttendanceEndTime('16:30');
    }

    setIsEditModalOpen(true);
  };

  const handleSaveEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    if (!editDescription.trim()) {
      alert('Please enter a description for work done.');
      return;
    }

    setIsSavingEdit(true);
    try {
      const assignedName = editTechName || (masterEmployees.find(m => m.id === editTechId)?.name || 'Technician');
      const teamMembersObj = editSelectedTeamMemberIds.map(id => {
        const emp = masterEmployees.find(m => m.id === id);
        return {
          id: id,
          name: emp ? emp.name : id
        };
      });

      let attendanceRegData: AttendanceRegisterData | undefined = editingTask.attendanceRegister;
      if (editAutoMarkAttendance) {
        const entries: AttendanceRegisterEntry[] = [
          {
            employeeId: editTechId,
            employeeName: assignedName,
            shift: editAttendanceShift,
            startTime: editAttendanceStartTime,
            endTime: editAttendanceEndTime,
            status: 'Verified',
            verifiedAt: new Date().toISOString()
          },
          ...teamMembersObj.map(m => ({
            employeeId: m.id,
            employeeName: m.name,
            shift: editAttendanceShift,
            startTime: editAttendanceStartTime,
            endTime: editAttendanceEndTime,
            status: 'Auto-Logged' as const
          }))
        ];

        attendanceRegData = {
          autoMark: true,
          shift: editAttendanceShift,
          startTime: editAttendanceStartTime,
          endTime: editAttendanceEndTime,
          entries: entries,
          timestamp: new Date().toISOString()
        };

        // Sync to Attendance Register Ledger
        try {
          const rawAtt = localStorage.getItem('attendance_records') || localStorage.getItem('siteops_attendance_records') || '[]';
          let attRecords: any[] = JSON.parse(rawAtt);
          const attRecordsToSave: AttendanceRecord[] = [];

          entries.forEach(entry => {
            const empIdLower = (entry.employeeId || '').toLowerCase();
            const existingIdx = attRecords.findIndex(r => 
              (r.employeeId || '').toLowerCase() === empIdLower && r.date === editDate
            );
            const computedEditHours = calculateHoursFromTimes(entry.startTime, entry.endTime) || 9;
            const attEntry: AttendanceRecord = {
              date: editDate,
              employeeId: entry.employeeId,
              shiftId: editAttendanceShift.toLowerCase().includes('night') ? 'SHIFT-NIGHT' : 'SHIFT-DAY',
              status: 'Present',
              overtimeHours: Math.max(0, computedEditHours - 9),
              comment: `Updated via Technician Task (${editJobCardNumber})`,
              dayType: DayType.STANDARD,
              hoursWorked: computedEditHours,
              startTime: entry.startTime,
              endTime: entry.endTime,
              isApproved: true,
              approvedBy: currentUser.name,
              approvedDate: new Date().toISOString().split('T')[0]
            };

            if (existingIdx >= 0) {
              attRecords[existingIdx] = { ...attRecords[existingIdx], ...attEntry };
            } else {
              attRecords.push(attEntry);
            }
            attRecordsToSave.push(attEntry);
          });

          localStorage.setItem('siteops_attendance_records', JSON.stringify(attRecords));
          localStorage.setItem('attendance_records', JSON.stringify(attRecords));
          syncAttendanceBulkToGoogleSheets(attRecordsToSave).catch(() => {});
          if (onSyncAttendance) {
            onSyncAttendance(attRecordsToSave);
          }
        } catch (err) {
          console.debug('Error updating attendance for task:', err);
        }
      }

      const updatedTask: TechnicianTaskLog = {
        ...editingTask,
        date: editDate,
        technicianId: editTechId,
        technicianName: assignedName,
        teamMembers: teamMembersObj.length > 0 ? teamMembersObj : undefined,
        jobCardNumber: editJobCardNumber,
        equipmentRef: editEquipmentRef.trim() || 'N/A',
        category: editCategory,
        description: editDescription.trim(),
        sparesUsed: editSparesUsed.trim() || undefined,
        status: editStatus,
        supervisorSignoff: editStatus === 'Completed' ? (editingTask.supervisorSignoff || `Signed by ${currentUser.name}`) : undefined,
        attendanceRegister: attendanceRegData
      };

      const nextTasks = tasks.map(t => t.id === editingTask.id ? updatedTask : t);
      setTasks(nextTasks);
      localStorage.setItem('workshop_technician_tasks', JSON.stringify(nextTasks));

      await syncTechnicianTaskToGoogleSheets(updatedTask);
      triggerToast(`Task record ${updatedTask.jobCardNumber} updated successfully`);
      setIsEditModalOpen(false);
      setEditingTask(null);
    } catch (err) {
      console.error('Error updating task:', err);
      triggerToast('Error saving task updates');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Export to Excel function
  const handleExportToExcel = () => {
    if (filteredTasks.length === 0) {
      alert('No task records available to export.');
      return;
    }

    const headers = ['Job Card #', 'Date', 'Team Lead', 'Team Members', 'Equipment', 'Category', 'Work Done', 'Spares Issued', 'Status'];
    const rows = filteredTasks.map(t => [
      `"${(t.jobCardNumber || '').replace(/"/g, '""')}"`,
      `"${(t.date || '').replace(/"/g, '""')}"`,
      `"${(t.technicianName || '').replace(/"/g, '""')}"`,
      `"${(t.teamMembers ? t.teamMembers.map(m => m.name).join('; ') : 'N/A').replace(/"/g, '""')}"`,
      `"${(t.equipmentRef || '').replace(/"/g, '""')}"`,
      `"${(t.category || '').replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${(t.sparesUsed || 'None').replace(/"/g, '""')}"`,
      `"${(t.status || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `Technician_Daily_Tasks_Logbook_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    triggerToast(`Exported ${filteredTasks.length} task entries to Excel CSV`);
  };

  // Download Single Job Card as professionally formatted PDF
  const handleDownloadJobCardPDF = async (task: TechnicianTaskLog) => {
    setIsDownloadingPdfId(task.id);
    try {
      generateSingleJobCardPDF(task);
      triggerToast(`Job Card ${task.jobCardNumber} PDF downloaded`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      triggerToast('Error generating Job Card PDF');
    } finally {
      setIsDownloadingPdfId(null);
    }
  };

  // Stats
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    const sparesIssuedCount = tasks.filter(t => t.issuedQty && t.issuedQty > 0).reduce((acc, t) => acc + (t.issuedQty || 0), 0);

    return {
      total,
      completed,
      inProgress,
      sparesIssuedCount
    };
  }, [tasks]);

  // Filtered List
  const filteredTasks = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const todayObj = new Date();
    const todayStr = todayObj.toISOString().split('T')[0];

    return tasks.filter(t => {
      const matchesSearch = 
        (t.technicianName || '').toLowerCase().includes(q) ||
        (t.jobCardNumber || '').toLowerCase().includes(q) ||
        (t.equipmentRef || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        (t.sparesUsed && t.sparesUsed.toLowerCase().includes(q)) ||
        (t.teamMembers && t.teamMembers.some(m => (m.name || '').toLowerCase().includes(q)));

      const matchesCat = categoryFilter === 'ALL' || t.category === categoryFilter;
      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;

      let matchesDate = true;
      if (dateFilter === 'TODAY') {
        matchesDate = t.date === todayStr;
      } else if (dateFilter === 'YESTERDAY') {
        const yest = new Date(todayObj);
        yest.setDate(yest.getDate() - 1);
        matchesDate = t.date === yest.toISOString().split('T')[0];
      } else if (dateFilter === 'THIS_WEEK') {
        const curr = new Date();
        const firstDayObj = new Date(curr.setDate(curr.getDate() - curr.getDay()));
        const firstStr = firstDayObj.toISOString().split('T')[0];
        matchesDate = t.date >= firstStr && t.date <= todayStr;
      } else if (dateFilter === 'THIS_MONTH') {
        const monthPrefix = todayStr.slice(0, 7);
        matchesDate = t.date.startsWith(monthPrefix);
      } else if (dateFilter === 'CUSTOM') {
        if (startDate && t.date < startDate) matchesDate = false;
        if (endDate && t.date > endDate) matchesDate = false;
      }

      return matchesSearch && matchesCat && matchesStatus && matchesDate;
    });
  }, [tasks, searchQuery, categoryFilter, statusFilter, dateFilter, startDate, endDate]);

  // Reset pagination to page 1 whenever search query or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, statusFilter, dateFilter, startDate, endDate]);

  // Total pages calculation
  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / itemsPerPage));

  // Auto-correct page if current page exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Paginated records list
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTasks.slice(start, start + itemsPerPage);
  }, [filteredTasks, currentPage, itemsPerPage]);

  const startIndex = filteredTasks.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(filteredTasks.length, currentPage * itemsPerPage);

  const categoryList = ['IT Services', 'Protection Services'];

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[500] animate-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 border border-slate-800">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span className="text-xs font-black uppercase tracking-wider">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/80 p-3.5 sm:p-4 rounded-2xl shadow-xs flex items-center space-x-3">
          <div className="p-2.5 bg-black text-white rounded-xl shrink-0">
            <Briefcase size={16} />
          </div>
          <div>
            <p className="text-[8.5px] font-bold uppercase tracking-wider text-slate-500">Total Work Logs</p>
            <h4 className="text-base sm:text-lg font-extrabold text-slate-900 leading-none mt-0.5">{stats.total}</h4>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-3.5 sm:p-4 rounded-2xl shadow-xs flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 shrink-0">
            <CheckCircle2 size={16} />
          </div>
          <div>
            <p className="text-[8.5px] font-bold uppercase tracking-wider text-slate-500">Completed Jobs</p>
            <h4 className="text-base sm:text-lg font-extrabold text-slate-900 leading-none mt-0.5">{stats.completed}</h4>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-3.5 sm:p-4 rounded-2xl shadow-xs flex items-center space-x-3">
          <div className="p-2.5 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 shrink-0">
            <Clock size={16} />
          </div>
          <div>
            <p className="text-[8.5px] font-bold uppercase tracking-wider text-slate-500">In Progress</p>
            <h4 className="text-base sm:text-lg font-extrabold text-slate-900 leading-none mt-0.5">{stats.inProgress}</h4>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-3.5 sm:p-4 rounded-2xl shadow-xs flex items-center space-x-3">
          <div className="p-2.5 bg-slate-100 text-slate-900 rounded-xl border border-slate-200 shrink-0">
            <PackageMinus size={16} />
          </div>
          <div>
            <p className="text-[8.5px] font-bold uppercase tracking-wider text-slate-500">Spares Issued</p>
            <h4 className="text-base sm:text-lg font-extrabold text-slate-900 leading-none mt-0.5">{stats.sparesIssuedCount} <span className="text-[9px] text-slate-400 font-medium">Items</span></h4>
          </div>
        </div>
      </div>

      {/* TEAM MEMBER ATTENDANCE REGISTER PROMPT BANNER */}
      {memberAttendancePromptTasks.length > 0 && (
        <div className="w-full bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-3.5 sm:p-4.5 shadow-md border border-emerald-500/40 transition-all animate-in fade-in duration-300">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 sm:gap-4">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0 mt-0.5">
                <ClipboardCheck size={20} />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-emerald-500 text-slate-950 font-black text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
                    Attendance Register Auto-Marked
                  </span>
                  <span className="text-emerald-200 text-xs font-semibold">
                    {memberAttendancePromptTasks[0].date} • {memberAttendancePromptTasks[0].attendanceRegister?.shift || 'Day Shift'} ({memberAttendancePromptTasks[0].attendanceRegister?.startTime || '07:30'} - {memberAttendancePromptTasks[0].attendanceRegister?.endTime || '16:30'})
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed break-words mt-1">
                  Notice: Your attendance register was <strong className="text-emerald-300 font-bold">auto-marked & verified</strong> for Job Card <strong className="text-white font-mono bg-white/10 px-1.5 py-0.5 rounded">{memberAttendancePromptTasks[0].jobCardNumber}</strong> by Team Lead <strong className="text-white">{memberAttendancePromptTasks[0].technicianName}</strong>.
                </p>
                {(memberAttendancePromptTasks[0].teamMembers || []).length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1.5 text-[10.5px] text-emerald-200/90">
                    <span className="font-bold text-slate-300">Registered Staff:</span>
                    <span className="bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded-md font-bold">
                      {memberAttendancePromptTasks[0].technicianName} (Team Lead)
                    </span>
                    {memberAttendancePromptTasks[0].teamMembers?.map(m => {
                      const isMe = (m.id && currentUser?.id && m.id.toLowerCase() === currentUser.id.toLowerCase()) || 
                                   (m.name && currentUser?.name && m.name.toLowerCase() === currentUser.name.toLowerCase());
                      return (
                        <span key={m.id} className={`px-2 py-0.5 rounded-md font-semibold ${isMe ? 'bg-indigo-500/40 text-indigo-100 border border-indigo-400/50 font-bold shadow-2xs' : 'bg-white/10 text-white'}`}>
                          {m.name} {isMe ? '(You)' : ''}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end pt-2 lg:pt-0 border-t lg:border-0 border-white/10">
              <button
                onClick={() => handleOpenAttendanceModal(memberAttendancePromptTasks[0])}
                className="flex-1 sm:flex-initial bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-3.5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              >
                <CheckCircle2 size={14} />
                <span>View Register</span>
              </button>
              <button
                onClick={() => acknowledgePrompt(memberAttendancePromptTasks[0].id)}
                className="flex-1 sm:flex-initial bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all cursor-pointer text-center active:scale-95"
                title="Acknowledge & Dismiss Alert"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER ACTION CONTROL BAR */}
      <div className="bg-white p-4 border border-slate-200/80 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm md:text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <Wrench size={18} className="text-slate-900" />
            <span>Daily Tasks & Projects Logbook</span>
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
          <button
            onClick={() => {
              setIsLoadingTasks(true);
              fetchTechnicianTasksFromGoogleSheets().then(remoteTasks => {
                if (remoteTasks && remoteTasks.length > 0) {
                  const cleanRemote = remoteTasks.filter(t => !isMockTaskRecord(t));
                  setTasks(cleanRemote);
                  localStorage.setItem('workshop_technician_tasks', JSON.stringify(cleanRemote));
                }
              }).finally(() => {
                setIsLoadingTasks(false);
                triggerToast('Logbook synced with database');
              });
            }}
            disabled={isLoadingTasks}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center justify-center"
            title="Refresh Logbook from Database"
          >
            <RotateCcw size={14} className={isLoadingTasks ? 'animate-spin text-indigo-600' : ''} />
          </button>

          <button
            onClick={handleExportToExcel}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 px-3.5 py-2.5 rounded-xl font-black uppercase tracking-wider text-[9px] transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs active:scale-95"
            title="Export task logs to Excel CSV format"
          >
            <FileSpreadsheet size={14} className="text-emerald-700" />
            <span>Export to Excel</span>
          </button>

          <button
            onClick={() => handleOpenModal(true)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 px-3.5 py-2.5 rounded-xl font-black uppercase tracking-wider text-[9px] transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs active:scale-95"
          >
            <PackageMinus size={14} />
            <span>Issue Part / Item</span>
          </button>

          <button
            onClick={() => handleOpenModal(false)}
            className="bg-black hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-black uppercase tracking-wider text-[9px] transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm active:scale-95"
          >
            <PlusCircle size={14} />
            <span>Log Daily Task</span>
          </button>
        </div>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="bg-white p-3 border border-slate-200/80 rounded-2xl shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Search Job Card, Technician, Equipment..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-[10px] font-bold text-slate-800 outline-none focus:bg-white focus:border-black transition-all"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
            <Filter size={13} className="text-slate-400" />
            <select 
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="bg-transparent text-[9.5px] font-black uppercase text-slate-700 outline-none cursor-pointer w-full"
            >
              <option value="ALL">All Categories</option>
              {categoryList.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
            <CheckCircle2 size={13} className="text-slate-400" />
            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-transparent text-[9.5px] font-black uppercase text-slate-700 outline-none cursor-pointer w-full"
            >
              <option value="ALL">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="In Progress">In Progress</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
            <Calendar size={13} className="text-slate-400 shrink-0" />
            <select 
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="bg-transparent text-[9.5px] font-black uppercase text-slate-700 outline-none cursor-pointer w-full"
            >
              <option value="ALL">All Dates</option>
              <option value="TODAY">Today</option>
              <option value="YESTERDAY">Yesterday</option>
              <option value="THIS_WEEK">This Week</option>
              <option value="THIS_MONTH">This Month</option>
              <option value="CUSTOM">Custom Range</option>
            </select>
          </div>
        </div>

        {/* CUSTOM DATE RANGE PICKER (WHEN dateFilter === 'CUSTOM') */}
        {dateFilter === 'CUSTOM' && (
          <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-200">
            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              <span className="text-[8.5px] font-black uppercase text-slate-500 shrink-0">From:</span>
              <input 
                type="date" 
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="bg-transparent text-[9.5px] font-bold text-slate-800 outline-none w-full cursor-pointer"
              />
            </div>

            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              <span className="text-[8.5px] font-black uppercase text-slate-500 shrink-0">To:</span>
              <input 
                type="date" 
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="bg-transparent text-[9.5px] font-bold text-slate-800 outline-none w-full cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* TASK LOG CONTAINER - RESPONSIVE FOR ALL DEVICES */}
      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[8.5px] font-black uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Job Card / Date</th>
                <th className="py-3 px-4">Team Lead / Staff</th>
                <th className="py-3 px-4">Equipment / Location</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Work Done & Issued Spares</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[10px] font-bold">
              {isLoadingTasks ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="max-w-xs mx-auto text-center space-y-2">
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="font-bold text-slate-500 text-xs">Loading...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="max-w-xs mx-auto text-center space-y-2">
                      <Wrench className="mx-auto text-slate-300" size={32} />
                      <h5 className="font-black text-slate-600 uppercase text-[10px] tracking-wider">No task logs found</h5>
                      <p className="text-[9px] text-slate-400">Log a work order or issue parts using the controls above.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTasks.map((t) => {
                  const isCompleted = t.status === 'Completed';

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col items-start gap-1">
                          <button
                            type="button"
                            onClick={() => setPreviewTask(t)}
                            className="font-mono text-[9.5px] text-indigo-900 hover:text-indigo-600 font-black hover:underline inline-flex items-center gap-1 cursor-pointer"
                            title="Click to preview & print Job Card"
                          >
                            <span>{t.jobCardNumber}</span>
                          </button>
                          <span className="text-[8px] text-slate-400 font-semibold">{t.date}</span>
                          
                          {/* Attendance Register Icon & Badge */}
                          {t.attendanceRegister ? (
                            <button
                              onClick={() => handleOpenAttendanceModal(t)}
                              className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[8px] font-black uppercase tracking-tight transition-all cursor-pointer shadow-2xs"
                              title="Click to view or verify Attendance Register record"
                            >
                              <ClipboardCheck size={11} className="text-emerald-600 shrink-0" />
                              <span>Attendance ({t.attendanceRegister.startTime} - {t.attendanceRegister.endTime})</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenAttendanceModal(t)}
                              className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 text-[8px] font-bold uppercase tracking-tight transition-all cursor-pointer"
                              title="Click to register attendance for this task"
                            >
                              <ClipboardCheck size={11} className="text-slate-500 shrink-0" />
                              <span>Register Attendance</span>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-900 font-black">
                        <div>
                          <span>{t.technicianName}</span>
                          {t.teamMembers && t.teamMembers.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1 mt-1">
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[8px] font-black uppercase tracking-tight border border-slate-200" title={`Team Members: ${t.teamMembers.map(m => m.name).join(', ')}`}>
                                <Users size={10} className="text-slate-600 shrink-0" />
                                <span>+ {t.teamMembers.length} Team ({t.teamMembers.map(m => m.name.split(' ')[0]).join(', ')})</span>
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 font-bold">
                        {t.equipmentRef}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 text-[8px] rounded-md bg-slate-100 border border-slate-200 text-slate-800 font-black uppercase">
                          {t.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-sm">
                        <p className="text-slate-800 leading-snug font-medium text-[10px]">{t.description}</p>
                        {t.sparesUsed && (
                          <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-900 text-[8px] font-black uppercase tracking-tight">
                            <PackageCheck size={11} className="text-amber-700 shrink-0" />
                            <span>{t.sparesUsed}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => toggleTaskStatus(t.id)}
                          className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border ${
                            isCompleted 
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                              : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
                          <span>{t.status}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleDownloadJobCardPDF(t)}
                            disabled={isDownloadingPdfId === t.id}
                            className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Download Job Card (PDF)"
                          >
                            {isDownloadingPdfId === t.id ? (
                              <Loader2 size={14} className="animate-spin text-indigo-600" />
                            ) : (
                              <FileDown size={14} />
                            )}
                          </button>
                          <button
                            onClick={() => setPreviewTask(t)}
                            className="p-1.5 hover:text-slate-900 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="View / Print Job Card Details"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(t)}
                            className="p-1.5 hover:text-indigo-600 text-slate-400 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit task record"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteTaskClick(t)}
                            className="p-1.5 hover:text-rose-600 text-slate-400 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete task record"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE & TABLET CARD VIEW (fully responsive, zero horizontal scrolls required) */}
      <div className="block md:hidden space-y-3">
        {isLoadingTasks ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center space-y-2 shadow-xs">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-bold text-slate-500 text-xs">Loading...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center space-y-2 shadow-xs">
            <Wrench className="mx-auto text-slate-300" size={32} />
            <h5 className="font-black text-slate-600 uppercase text-xs tracking-wider">No task logs found</h5>
            <p className="text-[10px] text-slate-400">Log a work order or issue parts using the controls above.</p>
          </div>
        ) : (
          paginatedTasks.map((t) => {
            const isCompleted = t.status === 'Completed';

            return (
              <div 
                key={t.id} 
                className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3 transition-all hover:border-slate-300"
              >
                {/* Top Row: Job Card #, Date, Category */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setPreviewTask(t)}
                        className="font-mono text-xs text-indigo-950 hover:text-indigo-600 font-black hover:underline inline-flex items-center gap-1 cursor-pointer"
                        title="View & Print Job Card Details"
                      >
                        <span>{t.jobCardNumber}</span>
                      </button>
                      <span className="px-2 py-0.5 text-[7.5px] rounded-md bg-slate-100 border border-slate-200 text-slate-800 font-black uppercase">
                        {t.category}
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-400 font-semibold mt-0.5">{t.date}</p>
                  </div>

                  <button
                    onClick={() => toggleTaskStatus(t.id)}
                    className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border shrink-0 ${
                      isCompleted 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
                    <span>{t.status}</span>
                  </button>
                </div>

                {/* Body Details: Technician & Equipment */}
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 block">Technician</span>
                    <span className="font-black text-slate-900 block truncate">{t.technicianName}</span>
                    {t.teamMembers && t.teamMembers.length > 0 && (
                      <div className="flex items-center gap-1 mt-0.5 text-[8px] font-bold text-slate-600">
                        <Users size={10} className="text-slate-500 shrink-0" />
                        <span className="truncate">With: {t.teamMembers.map(m => m.name).join(', ')}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 block">Equipment / Location</span>
                    <span className="font-bold text-slate-800 block truncate">{t.equipmentRef}</span>
                  </div>
                </div>

                {/* Work Description */}
                <div>
                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">Work Done / Comments</span>
                  <p className="text-slate-800 leading-snug font-medium text-[10.5px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {t.description}
                  </p>
                </div>

                {/* Spares Issued Badge */}
                {t.sparesUsed && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[8.5px] font-black uppercase tracking-tight">
                    <PackageCheck size={13} className="text-amber-700 shrink-0" />
                    <span className="truncate">{t.sparesUsed}</span>
                  </div>
                )}

                {/* Attendance Register Sync Indicator */}
                {t.attendanceRegister ? (
                  <button
                    onClick={() => handleOpenAttendanceModal(t)}
                    className="w-full flex items-center justify-between p-2 rounded-xl bg-emerald-50/90 hover:bg-emerald-100 border border-emerald-200/80 text-emerald-900 transition-all cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center space-x-1.5 text-[8.5px] font-black uppercase tracking-tight">
                      <ClipboardCheck size={14} className="text-emerald-600 shrink-0" />
                      <span>Attendance Register Synced</span>
                    </div>
                    <span className="text-[8px] font-mono font-black text-emerald-800 bg-white/90 px-2 py-0.5 rounded-md border border-emerald-200/60">
                      {t.attendanceRegister.startTime} - {t.attendanceRegister.endTime}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenAttendanceModal(t)}
                    className="w-full flex items-center justify-center gap-1.5 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[8.5px] font-bold uppercase transition-all cursor-pointer"
                  >
                    <ClipboardCheck size={13} className="text-slate-500" />
                    <span>Mark Attendance Register For This Task</span>
                  </button>
                )}

                {/* Footer Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[9px]">
                  <span className="text-slate-400 font-semibold">
                    {t.supervisorSignoff ? t.supervisorSignoff : 'Pending Signoff'}
                  </span>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleDownloadJobCardPDF(t)}
                      disabled={isDownloadingPdfId === t.id}
                      className="px-2 py-1 text-indigo-700 hover:text-indigo-900 bg-indigo-50/80 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer font-bold uppercase text-[8px] border border-indigo-200"
                      title="Download Job Card (PDF)"
                    >
                      {isDownloadingPdfId === t.id ? (
                        <Loader2 size={11} className="animate-spin text-indigo-600" />
                      ) : (
                        <FileDown size={11} />
                      )}
                      <span>PDF</span>
                    </button>
                    <button
                      onClick={() => setPreviewTask(t)}
                      className="px-2 py-1 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer font-bold uppercase text-[8px] border border-slate-200"
                      title="Preview Job Card"
                    >
                      <Eye size={11} />
                      <span>View</span>
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(t)}
                      className="px-2 py-1 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer font-bold uppercase text-[8px] border border-slate-200"
                    >
                      <Edit3 size={11} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteTaskClick(t)}
                      className="px-1.5 py-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer font-bold uppercase text-[8px] border border-rose-200"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FULLY RESPONSIVE PAGINATION CONTROLS */}
      {filteredTasks.length > 0 && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px]">
          
          {/* Left: Info & Rows per page */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-slate-600 font-bold">
            <span>
              Showing <strong className="text-slate-900 font-black">{startIndex}</strong> to <strong className="text-slate-900 font-black">{endIndex}</strong> of <strong className="text-slate-900 font-black">{filteredTasks.length}</strong> records
            </span>

            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-xl">
              <span className="text-[8.5px] font-black uppercase text-slate-400">Rows:</span>
              <select
                value={itemsPerPage}
                onChange={e => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-transparent text-slate-800 font-black outline-none cursor-pointer text-[10px]"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Right: Page Navigation Buttons */}
          <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-800 font-black flex items-center space-x-1 transition-all cursor-pointer active:scale-95"
              title="Previous Page"
            >
              <ChevronLeft size={14} />
              <span className="hidden sm:inline uppercase text-[9px] tracking-wider">Prev</span>
            </button>

            {/* Page number buttons window */}
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((p, idx, arr) => {
                  const prevPage = arr[idx - 1];
                  const showEllipsis = prevPage && p - prevPage > 1;

                  return (
                    <React.Fragment key={p}>
                      {showEllipsis && <span className="px-1 text-slate-400 font-mono text-[9px]">...</span>}
                      <button
                        onClick={() => setCurrentPage(p)}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl font-black text-[10px] transition-all cursor-pointer active:scale-95 flex items-center justify-center ${
                          currentPage === p
                            ? 'bg-black text-white shadow-xs'
                            : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  );
                })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-800 font-black flex items-center space-x-1 transition-all cursor-pointer active:scale-95"
              title="Next Page"
            >
              <span className="hidden sm:inline uppercase text-[9px] tracking-wider">Next</span>
              <ChevronRight size={14} />
            </button>
          </div>

        </div>
      )}

      {/* INPUT TASK & ITEM ISSUANCE MODAL - FULLY RESPONSIVE COMPACT LIGHT DESIGN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative bg-[#F8FAFF] w-full max-w-xl sm:max-w-2xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden my-auto flex flex-col max-h-[96vh] animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-[#0F1135] text-indigo-300 rounded-xl flex items-center justify-center shadow-md shrink-0">
                  <Wrench size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">
                    {issueItem ? 'Issue Part from Inventory' : 'Input Daily Task'}
                  </h3>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">Technician Work Record</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-slate-800 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form - Fits seamlessly across all screen sizes without scrolling */}
            <form onSubmit={handleCreateTask} className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3 text-slate-800">
              
              <div className="space-y-2.5">
                {/* Main Form Fields Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* Team Lead */}
                  <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-0.5 block">Team Lead *</label>
                    <select
                      required
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-[10px] sm:text-[11px] font-black uppercase text-slate-800 outline-none focus:border-indigo-500 shadow-sm cursor-pointer"
                      value={techId}
                      onChange={(e) => {
                        setTechId(e.target.value);
                        const emp = masterEmployees.find(m => m.id === e.target.value);
                        if (emp) setTechName(emp.name);
                      }}
                    >
                      {masterEmployees.map(e => (
                        <option key={e.id} value={e.id}>
                          {e.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-0.5 block">Date *</label>
                    <input
                      type="date"
                      required
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-[10px] font-black text-slate-800 outline-none focus:border-indigo-500 shadow-sm"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>

                  {/* Job Card / Work Order # */}
                  <div>
                    <div className="flex items-center justify-between mb-1 ml-0.5">
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Job Card #</label>
                      <span className="text-[7px] font-bold uppercase px-1 py-0.1 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        System Locked
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        disabled
                        className="w-full bg-slate-100/90 border border-slate-200 rounded-xl px-2.5 py-1.5 text-[10px] font-bold uppercase text-slate-600 outline-none font-mono cursor-not-allowed select-none"
                        value={jobCardNumber}
                        placeholder="Auto Generated"
                      />
                      <FileText size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-0.5 block">Category *</label>
                    <select
                      required
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-[10px] font-black uppercase text-slate-800 outline-none focus:border-indigo-500 shadow-sm cursor-pointer"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                    >
                      <option value="IT Services">IT Services</option>
                      <option value="Protection Services">Protection Services</option>
                    </select>
                  </div>

                  {/* Equipment / Location / Area */}
                  <div className="col-span-1 sm:col-span-2">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-0.5 block">
                      Equipment / Asset Ref (Location / Area)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Server Room B, Wi-Fi Node, CCTV Tower, Workshop Area"
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-[10px] font-bold text-slate-800 outline-none focus:border-indigo-500 shadow-sm"
                      value={equipmentRef}
                      onChange={(e) => setEquipmentRef(e.target.value)}
                    />
                  </div>

                  {/* Job Status */}
                  <div className="col-span-1 sm:col-span-2">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-0.5 block">Job Status *</label>
                    <select
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-[10px] font-black uppercase text-slate-800 outline-none focus:border-indigo-500 shadow-sm cursor-pointer"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                    >
                      <option value="Completed">Completed</option>
                      <option value="In Progress">In Progress</option>
                    </select>
                  </div>

                  {/* Work Done */}
                  <div className="col-span-full">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-0.5 block">Work Done / Task Summary *</label>
                    <input
                      required
                      type="text"
                      placeholder="Describe maintenance or work performed..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[10px] font-medium text-slate-800 outline-none focus:border-indigo-500 shadow-sm"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>

                {/* TEAM MEMBERS / COLLABORATION */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-2.5 space-y-1 shadow-sm">
                  <div className="flex items-center justify-between">
                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                      <Users size={11} className="text-indigo-600" />
                      Team Members (Optional)
                    </label>
                    {selectedTeamMemberIds.length > 0 && (
                      <span className="text-[7.5px] font-bold uppercase px-1.5 py-0.1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {selectedTeamMemberIds.length} Selected
                      </span>
                    )}
                  </div>

                  {/* Compact Inline Team Member Checkboxes */}
                  <div className="flex flex-wrap gap-1 max-h-12 overflow-y-auto pt-0.5">
                    {masterEmployees.filter(e => e.id !== techId).length === 0 ? (
                      <p className="text-[8.5px] text-slate-400">No other staff members</p>
                    ) : (
                      masterEmployees
                        .filter(e => e.id !== techId)
                        .map(emp => {
                          const isSelected = selectedTeamMemberIds.includes(emp.id);
                          return (
                            <label 
                              key={emp.id}
                              className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg border text-[8.5px] cursor-pointer transition-colors ${
                                isSelected ? 'bg-indigo-50 border-indigo-200 font-bold text-indigo-900' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <input 
                                type="checkbox"
                                checked={isSelected}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setSelectedTeamMemberIds(prev => [...prev, emp.id]);
                                  } else {
                                    setSelectedTeamMemberIds(prev => prev.filter(id => id !== emp.id));
                                  }
                                }}
                                className="w-2.5 h-2.5 accent-indigo-600 rounded cursor-pointer"
                              />
                              <span>{emp.name}</span>
                            </label>
                          );
                        })
                    )}
                  </div>
                </div>

                {/* INVENTORY PART ISSUANCE & ATTENDANCE AUTO-MARKING IN 2-COLUMN PANELS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* INVENTORY PART ISSUANCE BOX */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-2.5 space-y-1.5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={issueItem} 
                          onChange={e => setIssueItem(e.target.checked)}
                          className="w-3 h-3 text-indigo-600 accent-indigo-600 rounded cursor-pointer"
                        />
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-700 flex items-center gap-1">
                          <PackageMinus size={11} className="text-indigo-600" />
                          Issue Inventory Part
                        </span>
                      </label>
                      {issueItem && selectedToolAsset && (
                        <span className="text-[7.5px] font-bold uppercase px-1 py-0.1 rounded bg-emerald-100 text-emerald-800">
                          Stock: {selectedToolAsset.available ?? 0}
                        </span>
                      )}
                    </div>

                    {issueItem ? (
                      <div className="space-y-1.5 pt-1 border-t border-slate-100">
                        <div>
                          <select
                            required={issueItem}
                            value={selectedItemId}
                            onChange={e => setSelectedItemId(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-[10px] font-bold text-slate-900 outline-none focus:border-indigo-500 cursor-pointer"
                          >
                            <option value="">-- Choose Spare Asset --</option>
                            {activeCatalog.map((tool, idx) => (
                              <option key={`${tool.id || 'tool'}-${idx}`} value={tool.id}>
                                {tool.name} ({tool.available ?? 0} left)
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5">
                          <div>
                            <label className="block text-[7px] font-black uppercase text-slate-400 mb-0.5">Qty</label>
                            <input 
                              type="number"
                              min="1"
                              max={selectedToolAsset ? (selectedToolAsset.available ?? 1) : 99}
                              required={issueItem}
                              value={issueQty}
                              onChange={e => setIssueQty(Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-0.5 text-[10px] font-bold text-slate-900 outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[7px] font-black uppercase text-slate-400 mb-0.5">Remaining</label>
                            <div className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-0.5 text-[10px] font-bold text-slate-700">
                              {selectedToolAsset 
                                ? Math.max(0, (selectedToolAsset.available ?? 0) - issueQty) + ' pcs'
                                : '--'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <input
                        type="text"
                        placeholder="Other consumables used (Optional)"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-[10px] font-medium text-slate-800 outline-none focus:border-indigo-500"
                        value={customSparesText}
                        onChange={(e) => setCustomSparesText(e.target.value)}
                      />
                    )}
                  </div>

                  {/* AUTO MARK ATTENDANCE REGISTER PANEL */}
                  {isTechnicianAttendanceAlreadyLogged ? (
                    <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-2.5 space-y-1 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                          <span className="text-[8px] font-black uppercase tracking-widest text-emerald-800">
                            Daily Attendance Already Logged
                          </span>
                        </div>
                        <span className="text-[7.5px] font-bold px-1.5 py-0.5 rounded bg-emerald-100/80 text-emerald-800 border border-emerald-300">
                          Single Register Active
                        </span>
                      </div>
                      <p className="text-[8px] text-emerald-700/90 font-medium">
                        Attendance for this technician is already recorded on {date}. This work order is linked to the day's record without creating duplicate register entries.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-2.5 space-y-1.5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center space-x-1.5 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={autoMarkAttendance} 
                            onChange={e => setAutoMarkAttendance(e.target.checked)}
                            className="w-3 h-3 text-emerald-600 accent-emerald-600 rounded cursor-pointer"
                          />
                          <span className="text-[8px] font-black uppercase tracking-widest text-slate-700 flex items-center gap-1">
                            <ClipboardCheck size={11} className="text-emerald-600" />
                            Auto Attendance
                          </span>
                        </label>
                        <span className="text-[7.5px] font-bold px-1 py-0.1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Auto-Sync
                        </span>
                      </div>

                      {autoMarkAttendance && (
                        <div className="space-y-1.5 pt-1 border-t border-slate-100">
                          <select
                            value={attendanceShift}
                            onChange={e => setAttendanceShift(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-[10px] font-bold text-slate-900 outline-none focus:border-emerald-500 cursor-pointer"
                          >
                            <option value="Day Shift (07:00 - 17:00)">Day Shift (07:00 - 17:00)</option>
                            <option value="Night Shift (19:00 - 07:00)">Night Shift (19:00 - 07:00)</option>
                          </select>

                          <div className="grid grid-cols-2 gap-1.5">
                            <div>
                              <label className="block text-[7px] font-black uppercase text-slate-400 mb-0.5">Start Time</label>
                              <input 
                                type="time" 
                                required={autoMarkAttendance}
                                value={attendanceStartTime}
                                onChange={e => setAttendanceStartTime(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-0.5 text-[10px] font-bold text-slate-900 outline-none focus:border-emerald-500 font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[7px] font-black uppercase text-slate-400 mb-0.5">End Time</label>
                              <input 
                                type="time" 
                                required={autoMarkAttendance}
                                value={attendanceEndTime}
                                onChange={e => setAttendanceEndTime(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-0.5 text-[10px] font-bold text-slate-900 outline-none focus:border-emerald-500 font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2.5">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-black uppercase tracking-wider text-[9px] hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[1.4] py-2.5 rounded-xl bg-[#0F1135] hover:bg-indigo-700 text-white font-black uppercase tracking-wider text-[9px] shadow-lg transition-all flex items-center justify-center space-x-1.5 active:scale-95 cursor-pointer"
                >
                  <PlusCircle size={14} />
                  <span>{issueItem ? 'Submit & Issue Part' : 'Submit Daily Task'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ATTENDANCE REGISTER VERIFICATION & SELF-SERVICE MODAL */}
      {isAttendanceModalOpen && selectedTaskForAttendance && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative bg-[#F8FAFF] w-full max-w-md sm:max-w-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden my-auto flex flex-col max-h-[96vh] animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-md shrink-0">
                  <ClipboardCheck size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">Attendance Register</h3>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                    {selectedTaskForAttendance.jobCardNumber} • {selectedTaskForAttendance.date}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAttendanceModalOpen(false)}
                className="text-slate-400 hover:text-slate-800 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3 text-slate-800 overflow-y-auto no-scrollbar">
              <div className="space-y-3">
                {/* Task Info Summary */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-3 space-y-1 shadow-sm">
                  <div className="flex items-center justify-between text-[8.5px] font-black uppercase text-slate-400">
                    <span>{selectedTaskForAttendance.category}</span>
                    <span className="text-indigo-600">{selectedTaskForAttendance.status}</span>
                  </div>
                  <p className="font-black text-slate-900 text-xs">{selectedTaskForAttendance.equipmentRef || 'General Equipment'}</p>
                  <p className="text-slate-600 text-[10px] line-clamp-2">{selectedTaskForAttendance.description}</p>
                </div>

                {/* Registered Personnel List */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[8px] font-black uppercase tracking-widest text-slate-400">Personnel Register</h4>
                    <span className="text-[8px] font-bold text-slate-500">
                      {(selectedTaskForAttendance.attendanceRegister?.entries || []).length || 1} Registered
                    </span>
                  </div>

                  <div className="space-y-1.5 border border-slate-200/80 rounded-2xl bg-white p-2.5 shadow-sm">
                    {/* Team Lead */}
                    <div className="flex items-center justify-between text-xs py-1">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-black text-slate-900 text-[11px]">{selectedTaskForAttendance.technicianName}</span>
                          <span className="text-[7.5px] font-black uppercase px-1.5 py-0.2 rounded bg-slate-900 text-white">Lead</span>
                        </div>
                        <p className="text-[9px] text-slate-500 mt-0.5 font-mono">
                          {selectedTaskForAttendance.attendanceRegister?.shift || 'Day Shift'} ({selectedTaskForAttendance.attendanceRegister?.startTime || '07:30'} - {selectedTaskForAttendance.attendanceRegister?.endTime || '16:30'})
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-black uppercase">
                        <CheckCircle2 size={10} />
                        Verified
                      </span>
                    </div>

                    {/* Team Members */}
                    {selectedTaskForAttendance.attendanceRegister?.entries
                      ?.filter(e => e.employeeId !== selectedTaskForAttendance.technicianId)
                      .map((entry, idx) => {
                        const isUserThisMember = entry.employeeId === currentUser.id;
                        const isVerified = entry.status === 'Verified';

                        return (
                          <div key={idx} className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-100">
                            <div>
                              <div className="flex items-center space-x-1.5">
                                <span className="font-black text-slate-900 text-[11px]">{entry.employeeName}</span>
                                {isUserThisMember && (
                                  <span className="text-[7.5px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">You</span>
                                )}
                              </div>
                              <p className="text-[9px] text-slate-500 mt-0.5 font-mono">
                                {entry.shift} ({entry.startTime} - {entry.endTime})
                              </p>
                            </div>

                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                              isVerified 
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                                : 'bg-amber-50 border-amber-200 text-amber-700'
                            }`}>
                              {isVerified ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                              {entry.status}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Self-Service Shift Inputs */}
                <div className="bg-[#0F1135] text-white p-3.5 rounded-2xl space-y-2.5 shadow-md">
                  <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                      <UserCheck size={13} className="text-emerald-400" />
                      Self-Service Sign-In ({currentUser.name})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <label className="block text-[7.5px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Shift</label>
                      <select
                        value={myShiftInput}
                        onChange={e => setMyShiftInput(e.target.value)}
                        className="w-full bg-white/10 border border-white/10 rounded-xl px-2 py-1 text-[10px] font-bold text-white outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        <option value="Day Shift (07:00 - 17:00)" className="bg-slate-900 text-white">Day Shift (07:00 - 17:00)</option>
                        <option value="Night Shift (19:00 - 07:00)" className="bg-slate-900 text-white">Night Shift (19:00 - 07:00)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[7.5px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Start Time</label>
                      <input
                        type="time"
                        value={myStartTimeInput}
                        onChange={e => setMyStartTimeInput(e.target.value)}
                        className="w-full bg-white/10 border border-white/10 rounded-xl px-2 py-1 text-[10px] font-bold text-white outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[7.5px] font-black uppercase tracking-widest text-slate-400 mb-0.5">End Time</label>
                      <input
                        type="time"
                        value={myEndTimeInput}
                        onChange={e => setMyEndTimeInput(e.target.value)}
                        className="w-full bg-white/10 border border-white/10 rounded-xl px-2 py-1 text-[10px] font-bold text-white outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyMyAttendance}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase tracking-wider text-[9px] py-2 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <Check size={14} />
                    <span>Sign & Confirm My Attendance</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setIsAttendanceModalOpen(false)}
                  className="px-5 py-2 rounded-xl border border-slate-200 text-slate-600 font-black uppercase tracking-wider text-[9px] hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT TASK MODAL */}
      {isEditModalOpen && editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Edit3 size={18} className="text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider">Edit Task Record</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Job Card: {editingTask.jobCardNumber}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingTask(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEditTask} className="p-6 space-y-4 overflow-y-auto flex-1 text-slate-800">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Date */}
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">
                    Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={e => setEditDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-black transition-all"
                  />
                </div>

                {/* Job Card # */}
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">
                    Job Card # <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editJobCardNumber}
                    onChange={e => setEditJobCardNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 outline-none focus:bg-white focus:border-black transition-all"
                  />
                </div>
              </div>

              {/* Lead Technician & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">
                    Team Lead / Technician <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editTechId}
                    onChange={e => {
                      const emp = masterEmployees.find(m => m.id === e.target.value);
                      setEditTechId(e.target.value);
                      if (emp) setEditTechName(emp.name);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-black transition-all"
                  >
                    {masterEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.department || 'Staff'})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editCategory}
                    onChange={e => setEditCategory(e.target.value as TechnicianTaskLog['category'])}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-black transition-all"
                  >
                    <option value="Mechanical">Mechanical</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Civil & Plumbing">Civil & Plumbing</option>
                    <option value="HVAC">HVAC</option>
                    <option value="IT Services">IT Services</option>
                    <option value="Power Plant">Power Plant</option>
                    <option value="General Maintenance">General Maintenance</option>
                  </select>
                </div>
              </div>

              {/* Team Members Multi-Select */}
              <div>
                <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">
                  Additional Team Members (Assisting Staff)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-28 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                  {masterEmployees
                    .filter(emp => emp.id !== editTechId)
                    .map(emp => {
                      const isSelected = editSelectedTeamMemberIds.includes(emp.id);
                      return (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setEditSelectedTeamMemberIds(editSelectedTeamMemberIds.filter(id => id !== emp.id));
                            } else {
                              setEditSelectedTeamMemberIds([...editSelectedTeamMemberIds, emp.id]);
                            }
                          }}
                          className={`px-2 py-1 rounded-lg text-[9px] font-bold text-left transition-all border flex items-center justify-between ${
                            isSelected 
                              ? 'bg-slate-900 text-white border-slate-900' 
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <span className="truncate">{emp.name.split(' ')[0]}</span>
                          {isSelected && <Check size={10} className="shrink-0" />}
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Equipment Reference & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">
                    Equipment / Asset Ref (Location / Area)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Server Room B, DG-01, CCTV Tower, Workshop Area"
                    value={editEquipmentRef}
                    onChange={e => setEditEquipmentRef(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-black transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">
                    Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as TechnicianTaskLog['status'])}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-black transition-all"
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Work Description */}
              <div>
                <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">
                  Work Description & Actions Taken <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail the technical tasks performed, tests conducted, and outcomes..."
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-black transition-all resize-none"
                />
              </div>

              {/* Spares Used Text */}
              <div>
                <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">
                  Issued / Consumed Spares Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2x 10A Breaker, 1L Hydraulic Oil"
                  value={editSparesUsed}
                  onChange={e => setEditSparesUsed(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-black transition-all"
                />
              </div>

              {/* Auto Mark Attendance Options */}
              {isEditTechnicianAttendanceAlreadyLogged ? (
                <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-800">
                        Daily Attendance Already Logged
                      </span>
                    </div>
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Single Register
                    </span>
                  </div>
                  <p className="text-[8.5px] text-emerald-700 font-medium">
                    Attendance for this technician on {editDate} is already logged in the primary register.
                  </p>
                </div>
              ) : (
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editAutoMarkAttendance}
                        onChange={e => setEditAutoMarkAttendance(e.target.checked)}
                        className="rounded border-slate-300 text-black focus:ring-black h-4 w-4"
                      />
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">
                        Sync to Attendance Register Ledger
                      </span>
                    </label>
                  </div>

                  {editAutoMarkAttendance && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-200">
                      <div>
                        <label className="block text-[7.5px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Shift</label>
                        <select
                          value={editAttendanceShift}
                          onChange={e => setEditAttendanceShift(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-800 outline-none focus:border-black"
                        >
                          <option value="Day Shift (07:00 - 17:00)">Day Shift (07:00 - 17:00)</option>
                          <option value="Night Shift (19:00 - 07:00)">Night Shift (19:00 - 07:00)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[7.5px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Start Time</label>
                        <input
                          type="time"
                          value={editAttendanceStartTime}
                          onChange={e => setEditAttendanceStartTime(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-800 outline-none focus:border-black font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[7.5px] font-black uppercase tracking-widest text-slate-500 mb-0.5">End Time</label>
                        <input
                          type="time"
                          value={editAttendanceEndTime}
                          onChange={e => setEditAttendanceEndTime(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-800 outline-none focus:border-black font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingTask(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-black uppercase tracking-wider text-[9px] hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 rounded-xl bg-black hover:bg-slate-800 text-white font-black uppercase tracking-wider text-[9px] transition-all cursor-pointer shadow-sm active:scale-95 flex items-center space-x-1.5"
                >
                  {isSavingEdit ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      <span>Saving Updates...</span>
                    </>
                  ) : (
                    <>
                      <Save size={12} />
                      <span>Save & Sync Task</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 p-6 space-y-4 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Delete Task Record?</h3>
              <p className="text-xs text-slate-500 font-medium">
                Are you sure you want to permanently delete Job Card <strong className="font-mono text-slate-900">{taskToDelete.jobCardNumber}</strong> for <strong className="text-slate-900">{taskToDelete.technicianName}</strong>?
              </p>
              <p className="text-[10px] text-rose-600 font-bold mt-1">This will remove the entry from both local storage and the live Spreadsheet database.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setTaskToDelete(null)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 font-black uppercase tracking-wider text-[9.5px] hover:bg-slate-50 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-wider text-[9.5px] transition-all cursor-pointer shadow-sm active:scale-95 flex items-center justify-center space-x-1.5"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={12} />
                    <span>Delete Record</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE JOB CARD PREVIEW & PDF DOWNLOAD MODAL */}
      {previewTask && (
        <div className="fixed inset-0 z-[650] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[94vh] animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-md shrink-0">
                  <FileText size={20} />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-black uppercase tracking-tight">Job Card Document</h3>
                    <span className="font-mono text-xs font-black text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-700/50">
                      {previewTask.jobCardNumber}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-semibold tracking-wide mt-0.5">
                    {previewTask.date}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleDownloadJobCardPDF(previewTask)}
                  disabled={isDownloadingPdfId === previewTask.id}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                >
                  {isDownloadingPdfId === previewTask.id ? (
                    <Loader2 size={13} className="animate-spin text-white" />
                  ) : (
                    <FileDown size={13} />
                  )}
                  <span>Download PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTask(null)}
                  className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Document Body (Print-Ready Layout) */}
            <div className="relative p-6 overflow-y-auto space-y-4 text-slate-800 text-xs bg-slate-50/50">
              {(previewTask.status === 'Completed' || previewTask.status === 'Closed') && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
                  <div className="text-emerald-600/10 font-black text-5xl sm:text-6xl uppercase tracking-widest rotate-[-25deg] border-4 border-dashed border-emerald-600/15 px-8 py-3 rounded-2xl select-none">
                    CLOSED / COMPLETED
                  </div>
                </div>
              )}
              
              {/* Header Box */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[8px] font-black tracking-widest uppercase text-slate-400 block">Organization & Facility</span>
                    <h4 className="text-xs font-black text-slate-900 uppercase">STARTECH COMMUNICATION LTD</h4>
                    <p className="text-[9px] text-slate-500">Job Card & Technical Work Order Sheet</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[8.5px] font-black uppercase tracking-wider border ${
                    previewTask.status === 'Completed'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}>
                    {previewTask.status}
                  </span>
                </div>

                {/* Key Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-[10px]">
                  <div>
                    <span className="text-[7.5px] font-black uppercase text-slate-400 block">Job Card No.</span>
                    <span className="font-mono font-black text-slate-900">{previewTask.jobCardNumber}</span>
                  </div>
                  <div>
                    <span className="text-[7.5px] font-black uppercase text-slate-400 block">Date of Work</span>
                    <span className="font-bold text-slate-800">{previewTask.date}</span>
                  </div>
                  <div>
                    <span className="text-[7.5px] font-black uppercase text-slate-400 block">Category</span>
                    <span className="font-bold text-slate-800">{previewTask.category}</span>
                  </div>
                  <div>
                    <span className="text-[7.5px] font-black uppercase text-slate-400 block">Equipment / Location</span>
                    <span className="font-bold text-slate-800">{previewTask.equipmentRef || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Personnel Box */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2">
                <h5 className="text-[8.5px] font-black uppercase tracking-wider text-slate-500">Technical Team Assignment</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10.5px]">
                  <div>
                    <span className="text-[8px] font-bold text-slate-400 block">Lead Technician:</span>
                    <span className="font-black text-slate-900">{previewTask.technicianName}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-bold text-slate-400 block">Assisting Team Members:</span>
                    <span className="font-bold text-slate-800">
                      {previewTask.teamMembers && previewTask.teamMembers.length > 0 
                        ? previewTask.teamMembers.map(m => m.name).join(', ') 
                        : 'None (Sole Assigned)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Work Description Box */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1.5">
                <h5 className="text-[8.5px] font-black uppercase tracking-wider text-slate-500">Detailed Scope of Work</h5>
                <p className="text-[11px] text-slate-800 leading-relaxed font-medium bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-wrap">
                  {previewTask.description || 'No detailed work description recorded.'}
                </p>
              </div>

              {/* Spares & Parts Utilized */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1.5">
                <h5 className="text-[8.5px] font-black uppercase tracking-wider text-slate-500">Spares & Materials Issued</h5>
                {previewTask.sparesUsed ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-bold">
                    <PackageCheck size={16} className="text-amber-700 shrink-0" />
                    <span>{previewTask.sparesUsed}</span>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 italic">No replacement spares or parts logged for this job card.</p>
                )}
              </div>

              {/* Attendance Log (if linked) */}
              {previewTask.attendanceRegister && (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-[8.5px] font-black uppercase tracking-wider text-slate-500">Linked Attendance Register</h5>
                    <span className="text-[8px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Timesheet Synced ({previewTask.attendanceRegister.startTime} - {previewTask.attendanceRegister.endTime})
                    </span>
                  </div>
                  <div className="space-y-1 text-[9.5px]">
                    {(previewTask.attendanceRegister.entries || []).map((entry, idx) => (
                      <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                        <span className="font-bold text-slate-800">{entry.employeeName}</span>
                        <span className="text-slate-500 font-mono">{entry.shift} • {entry.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Authorization Sign-off Blocks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-2">
                  <span className="text-[8px] font-black uppercase text-slate-400 block">Lead Technician Sign-off</span>
                  <div className="text-[10px] space-y-0.5">
                    <p className="font-bold text-slate-900">{previewTask.technicianName}</p>
                    <p className="text-slate-500 text-[8.5px]">Date: {previewTask.date}</p>
                    <div className="pt-2 text-[8px] text-slate-400 font-mono">Signature: [Verified in Logbook]</div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-2">
                  <span className="text-[8px] font-black uppercase text-slate-400 block">Supervisor Sign-off</span>
                  <div className="text-[10px] space-y-0.5">
                    <p className="font-bold text-slate-900">{previewTask.supervisorSignoff || 'Pending Sign-off'}</p>
                    <p className="text-slate-500 text-[8.5px]">Status: {previewTask.status === 'Completed' ? 'Approved & Closed' : 'In Review'}</p>
                    <div className="pt-2 text-[8px] text-slate-400 font-mono">Signature: [Verified by Supervisor]</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-white flex items-center justify-between shrink-0">
              <span className="text-[9px] text-slate-400 font-medium">
                Official PDF generated with vector formatting & digital sign-off blocks.
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setPreviewTask(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-black uppercase tracking-wider text-[9px] hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadJobCardPDF(previewTask)}
                  disabled={isDownloadingPdfId === previewTask.id}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-wider text-[9px] shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
                >
                  {isDownloadingPdfId === previewTask.id ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      <span>Generating PDF...</span>
                    </>
                  ) : (
                    <>
                      <FileDown size={12} />
                      <span>Download PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechnicianTasksTab;
