import React, { useState, useMemo, useEffect } from 'react';
import { 
  CalendarDays, 
  RotateCcw, 
  Save, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  ShieldCheck, 
  UserCheck, 
  Users, 
  Info, 
  ChevronDown, 
  MessageSquare, 
  Calculator,
  User,
  Check,
  AlertCircle,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Calendar,
  Layers,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import Card from '../components/Card';
import { Team, Shift, AttendanceRecord, DayType, Employee } from '../types';

interface AttendancePageProps { 
  teams: Team[]; 
  shifts: Shift[]; 
  history: AttendanceRecord[];
  masterEmployees?: Employee[];
  onSave: (records: AttendanceRecord[]) => void;
  setSystemBusy: (busy: boolean) => void;
  hasPermission: (module: string, action?: any, subHub?: string) => boolean;
  currentUser: Employee;
}

const AttendancePage: React.FC<AttendancePageProps> = ({ 
  teams, 
  shifts, 
  history, 
  masterEmployees = [],
  onSave, 
  setSystemBusy, 
  hasPermission, 
  currentUser 
}) => {
  const [activeTab, setActiveTab] = useState<'log' | 'review'>('log');
  const [selectedShiftId, setSelectedShiftId] = useState(shifts[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isHoliday, setIsHoliday] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Row selection & Search states for register matrix
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedTeamFilterId, setSelectedTeamFilterId] = useState('ALL');

  // Month navigation logic - defaults to selectedDate's month/year
  const [gridYear, setGridYear] = useState(() => new Date().getFullYear());
  const [gridMonth, setGridMonth] = useState(() => new Date().getMonth());

  // Mobile active member preview lookup (matches leaves planner style)
  const [activeMobileMemberId, setActiveMobileMemberId] = useState<string | null>(null);

  // Cell editing Modal state
  const [editingCell, setEditingCell] = useState<{
    employeeId: string;
    employeeName: string;
    date: string;
    dayNum: number;
    status: 'Present' | 'Absent';
    startTime: string;
    endTime: string;
    hoursWorked: number;
    comment: string;
    isApproved: boolean;
  } | null>(null);

  // Review states
  const [reviewFilter, setReviewFilter] = useState<'all_pending' | 'by_date'>('all_pending');
  const [selectedReviewTeamId, setSelectedReviewTeamId] = useState<string>('ALL');

  const isSupervisor = useMemo(() => {
    const level = currentUser.accessLevel || 'Staff';
    const roleLower = (currentUser.role || '').toLowerCase();
    return ['Supervisor', 'Manager', 'Admin', 'HR', 'HSSEQ', 'Director'].includes(level) ||
      roleLower.includes('supervisor') || roleLower.includes('manager');
  }, [currentUser]);

  const scope = isSupervisor ? 'ALL' : (currentUser.visibilityScope || 'SELF');

  // Load custom holidays from localStorage
  const holidays = useMemo<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('HUB_CALENDAR_HOLIDAYS');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  }, []);

  // Sync grid view month when core selectedDate is changed by the user
  useEffect(() => {
    const d = new Date(selectedDate);
    if (!isNaN(d.getTime())) {
      setGridYear(d.getFullYear());
      setGridMonth(d.getMonth());
    }
  }, [selectedDate]);

  // Extract all unique employees across master staff directory and all teams
  const allEmployees = useMemo(() => {
    const map = new Map<string, Employee>();
    
    // 1. First add all personnel from master staff directory
    if (masterEmployees && masterEmployees.length > 0) {
      masterEmployees.forEach(m => {
        if (m && m.id) {
          map.set(m.id, m);
        }
      });
    }

    // 2. Also incorporate personnel from teams if not yet in map
    teams.forEach(t => {
      t.members.forEach(m => {
        if (m && m.id && !map.has(m.id)) {
          map.set(m.id, m);
        }
      });
    });

    return Array.from(map.values());
  }, [teams, masterEmployees]);

  // Standardized map employee department to standardized group
  const getNormalizedDepartment = (emp: Employee): string => {
    const dept = (emp.department || emp.role || '').toLowerCase().trim();
    if (dept.includes('hr') || dept.includes('admin') || dept.includes('management') || dept.includes('compliance') || dept.includes('hse')) {
      return 'HR Team';
    }
    if (dept.includes('tech') || dept.includes('workshop') || dept.includes('mechanic') || dept.includes('welder') || dept.includes('electrician') || dept.includes('fitter')) {
      return 'Technical Team';
    }
    if (dept.includes('operator') || dept.includes('driver') || dept.includes('store') || dept.includes('attendant') || dept.includes('rig') || dept.includes('drill')) {
      return 'Operators';
    }
    if (emp.department && emp.department.trim()) {
      return emp.department.trim();
    }
    return 'Technical Team';
  };

  // Fetch status from the off-period planner based on standard calendar calculations
  const getPlannerPlannedStatus = (emp: Employee, dateStr: string): string => {
    if (!dateStr) return 'p';
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return 'p';
    
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();
    const day = dateObj.getDate();

    // 1. Direct graphical override check from supervisor
    if (emp.dayOverrides && emp.dayOverrides[dateStr]) {
      return emp.dayOverrides[dateStr];
    }

    // 2. National / Public Holidays Check
    if (holidays[dateStr]) {
      return 'H';
    }

    // 3. Check if there is an active leave override
    if (emp.offPeriodStart && emp.offPeriodEnd && dateStr >= emp.offPeriodStart && dateStr <= emp.offPeriodEnd) {
      const type = emp.offPeriodType || '';
      if (type.toLowerCase().includes('sick')) return 'S';
      if (type.toLowerCase().includes('rest') || type.toLowerCase().includes('off')) return 'R';
      return 'L';
    }

    // 4. Rotational cycle pattern
    const monthIndex = (year - 2026) * 12 + month;
    const hashValue = Array.from(emp.id || emp.name || '').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
    
    // Fetch values from localStorage or default
    const savedRotOn = localStorage.getItem('HUB_ROT_ON_DURATION');
    const rotOnDuration = savedRotOn ? parseInt(savedRotOn, 10) : 3;
    
    const savedRotOff = localStorage.getItem('HUB_ROT_OFF_DURATION');
    const rotOffDuration = savedRotOff ? parseInt(savedRotOff, 10) : 1;
    
    const savedStagger = localStorage.getItem('HUB_STAGGER_MODE');
    const staggerMode = savedStagger !== null ? savedStagger === 'true' : true;

    const staggerShift = staggerMode ? (hashValue % (rotOnDuration + rotOffDuration)) : 0;
    
    const cycleUnit = rotOnDuration + rotOffDuration;
    const adjustedMonthIndex = (monthIndex + staggerShift) % cycleUnit;

    const isRestMonth = adjustedMonthIndex >= rotOnDuration;
    if (isRestMonth) {
      return 'L';
    }

    // Weekend rest days
    const restOffset = hashValue % 7;
    const weekdayIndicator = (day + restOffset) % 7;
    if (weekdayIndicator === 0 || weekdayIndicator === 6) {
      return 'R';
    }

    return 'p';
  };

  const getRankDisplay = (emp: Employee): string => {
    if (!emp) return 'STAFF';
    const r = (emp.role || emp.department || 'STAFF').toUpperCase();
    if (r.includes('TECH') || r.includes('MECHANIC') || r.includes('WELDER') || r.includes('ELECTRICIAN')) return 'TECH';
    if (r.includes('SUPERVISOR') || r.includes('SUPV')) return 'SUPV';
    if (r.includes('MANAGER') || r.includes('MGR')) return 'MGR';
    if (r.includes('ATTENDANT') || r.includes('STORE')) return 'STORE';
    if (r.includes('OPERATOR') || r.includes('DRIVER')) return 'OPER';
    return r.slice(0, 6);
  };

  // Extract unique departments matching staff directory
  const departments = useMemo(() => {
    const base = ['Technical Team', 'Operators', 'HR Team'];
    const set = new Set<string>(base);
    allEmployees.forEach(e => {
      const d = getNormalizedDepartment(e);
      if (d) set.add(d);
    });
    return Array.from(set);
  }, [allEmployees]);

  // Map employees based on filters & permission scope
  const filteredEmployees = useMemo(() => {
    return allEmployees.filter(emp => {
      // 1. Permission level constraint
      if (scope === 'TEAM') {
        const isInSameTeam = emp.teamId === currentUser.teamId || emp.teamName === currentUser.teamName;
        if (!isInSameTeam && emp.id !== currentUser.id) return false;
      } else if (scope === 'SELF') {
        if (emp.id !== currentUser.id) return false;
      }

      // 2. Department filter
      if (selectedDepartment !== 'ALL') {
        const normDept = getNormalizedDepartment(emp);
        if (normDept !== selectedDepartment) return false;
      }

      // 3. Team filter
      if (selectedTeamFilterId !== 'ALL' && emp.teamId !== selectedTeamFilterId) {
        return false;
      }

      // 4. Name search query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesName = (emp.name || '').toLowerCase().includes(query);
        const matchesId = (emp.id || '').toLowerCase().includes(query);
        if (!matchesName && !matchesId) return false;
      }

      return true;
    });
  }, [allEmployees, scope, currentUser, selectedDepartment, selectedTeamFilterId, searchQuery]);

  // Dynamic department groups for matrix ledger rendering
  const displayDepartmentGroups = useMemo(() => {
    const ordered = ['Technical Team', 'Operators', 'HR Team'];
    const list: string[] = [];
    ordered.forEach(d => {
      if (filteredEmployees.some(e => getNormalizedDepartment(e) === d)) {
        list.push(d);
      }
    });
    filteredEmployees.forEach(e => {
      const norm = getNormalizedDepartment(e);
      if (!list.includes(norm)) {
        list.push(norm);
      }
    });
    return list.length > 0 ? list : ['Technical Team', 'Operators', 'HR Team'];
  }, [filteredEmployees]);

  // Dynamic preview member for mobile view
  const activeMobileMember = useMemo(() => {
    if (activeMobileMemberId) {
      return filteredEmployees.find(e => e.id === activeMobileMemberId) || null;
    }
    return filteredEmployees[0] || null;
  }, [activeMobileMemberId, filteredEmployees]);

  // Sync active mobile member
  useEffect(() => {
    if (activeMobileMember && !activeMobileMemberId) {
      setActiveMobileMemberId(activeMobileMember.id);
    }
  }, [activeMobileMember, activeMobileMemberId]);

  // Compute number of days in the navigated month
  const daysArray = useMemo(() => {
    const totalDays = new Date(gridYear, gridMonth + 1, 0).getDate();
    return Array.from({ length: totalDays }, (_, i) => i + 1);
  }, [gridYear, gridMonth]);

  // Week pagination segment selectors for supreme responsiveness without scrolls
  const [activeWeekIndex, setActiveWeekIndex] = useState<number>(5); // 5 = Full Month (1-31) by default

  const visibleDaysArray = useMemo(() => {
    if (activeWeekIndex === 5) return daysArray;
    if (activeWeekIndex === 0) return daysArray.slice(0, 7);
    if (activeWeekIndex === 1) return daysArray.slice(7, 14);
    if (activeWeekIndex === 2) return daysArray.slice(14, 21);
    if (activeWeekIndex === 3) return daysArray.slice(21, 28);
    return daysArray.slice(28);
  }, [daysArray, activeWeekIndex]);

  const weeks = useMemo(() => [
    { label: "Full Month (1 - 31)", index: 5 },
    { label: "Day 1 - 7", index: 0 },
    { label: "Day 8 - 14", index: 1 },
    { label: "Day 15 - 21", index: 2 },
    { label: "Day 22 - 28", index: 3 },
    { label: "Day 29 - End", index: 4 }
  ], []);

  // Export Excel Attendance Register exactly matching official image template
  const handleExportToExcel = () => {
    const monthStr = String(gridMonth + 1).padStart(2, '0');
    const yearShort = String(gridYear).slice(-2);
    const totalDays = daysArray.length;

    let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Attendance Register</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        table { border-collapse: collapse; font-family: Calibri, Arial, sans-serif; font-size: 10pt; }
        th, td { border: 1px solid #000000; text-align: center; vertical-align: middle; padding: 4px; }
        .hdr { font-weight: bold; background-color: #FFFFFF; font-size: 8pt; text-transform: uppercase; }
        .v-text { writing-mode: tb-rl; -webkit-writing-mode: vertical-rl; transform: rotate(180deg); white-space: nowrap; font-size: 8pt; font-weight: bold; height: 65px; }
        .staff-bg { background-color: #FDEADA; font-weight: bold; }
        .team-row { background-color: #F2F2F2; color: #1F4E79; font-weight: bold; font-size: 11pt; text-align: center; }
        .summary-title { background-color: #FFC000; font-weight: bold; font-size: 10pt; text-align: center; }
        .summary-value { background-color: #FFC000; font-weight: bold; font-size: 10pt; text-align: center; }
      </style>
    </head>
    <body>
      <table>
        <thead>
          <tr>
            <th style="width: 45px;" class="hdr">SN O</th>
            <th style="width: 220px; text-align: left; padding-left: 8px;" class="hdr">EMPLOYEE NAME</th>
    `;

    daysArray.forEach(d => {
      const dStr = `${String(d).padStart(2, '0')}/${monthStr}/${yearShort}`;
      html += `<th style="width: 32px;" class="hdr v-text">${dStr}</th>`;
    });

    html += `
            <th style="width: 90px;" class="hdr">TOTAL DE HORAS DURANTE O MES</th>
            <th style="width: 85px;" class="hdr">TOTAL DE DIAS TRABALHADOS</th>
          </tr>
        </thead>
        <tbody>
    `;

    let globalCounter = 1;
    let overallTotalHours = 0;

    displayDepartmentGroups.forEach(dept => {
      const deptEmployees = filteredEmployees.filter(e => getNormalizedDepartment(e) === dept);
      if (deptEmployees.length === 0) return;

      const teamHeaderName = dept === 'Technical Team' ? 'STARTECH TEAM' : `${dept.toUpperCase()} TEAM`;
      const colSpanTotal = 2 + totalDays + 2;

      html += `
        <tr>
          <td colSpan="${colSpanTotal}" class="team-row">${teamHeaderName}</td>
        </tr>
      `;

      deptEmployees.forEach(emp => {
        const sums = calculateRowSums(emp.id);
        overallTotalHours += sums.totalHoursLogged;
        const sNo = globalCounter++;

        html += `
          <tr>
            <td class="staff-bg">${sNo}</td>
            <td class="staff-bg" style="text-align: left; padding-left: 8px;">${emp.name}</td>
        `;

        daysArray.forEach(d => {
          const match = getCellAttendance(emp, d);
          const cellDateStr = `${gridYear}-${monthStr}-${String(d).padStart(2, '0')}`;
          let hours = 0;
          if (match) {
            if (match.status === 'Present') {
              if (match.hoursWorked !== undefined && match.hoursWorked !== null && !isNaN(Number(match.hoursWorked))) {
                hours = Number(match.hoursWorked);
              } else if (match.startTime && match.endTime) {
                hours = calculateHoursFromTimes(match.startTime, match.endTime);
              } else {
                hours = getStandardHoursForDate(cellDateStr);
              }
            } else {
              hours = 0;
            }
          }
          html += `<td style="background-color: #FFFFFF;">${hours}</td>`;
        });

        html += `
            <td class="staff-bg">${sums.totalHoursLogged}</td>
            <td class="staff-bg">${sums.present}</td>
          </tr>
        `;
      });
    });

    // Summary row at bottom
    html += `
        <tr>
          <td colSpan="2" class="staff-bg"></td>
          <td colSpan="${totalDays}" class="summary-title">TOTAL HOURS</td>
          <td class="summary-value">${overallTotalHours}</td>
          <td class="staff-bg"></td>
        </tr>
      </tbody>
    </table>
    </body>
    </html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Attendance_Register_${monthNames[gridMonth]}_${gridYear}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Sunday, Saturday, Holiday classifications
  const isWeekendDay = (year: number, month: number, day: number) => {
    const d = new Date(year, month, day);
    const dayOfWeek = d.getDay();
    const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    return {
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      isSunday: dayOfWeek === 0,
      isSaturday: dayOfWeek === 6,
      dayName: dayNames[dayOfWeek]
    };
  };

  // Weekday is 9 hours, Saturday is 4 hours, Sunday is 0 hours (Rest Day)
  const getStandardHoursForDate = (dateString: string) => {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 9;
    const day = d.getDay();
    if (day === 0) return 0; // Sunday rest day
    if (day === 6) return 4; // Saturday half day
    return 9; // Weekdays standard workdays is 9 hours
  };

  // Helper to compute total working time between two 24h clock timestamps
  const calculateHoursFromTimes = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    let diffMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    if (diffMinutes < 0) {
      // Over midnight transition shift
      diffMinutes += 24 * 60;
    }
    return Math.round((diffMinutes / 60) * 10) / 10;
  };

  // Standard label for navigation header
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setGridMonth(prev => {
      if (prev === 0) {
        setGridYear(y => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setGridMonth(prev => {
      if (prev === 11) {
        setGridYear(y => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const handleGoToTodayMonth = () => {
    const today = new Date();
    setGridYear(today.getFullYear());
    setGridMonth(today.getMonth());
    setSelectedDate(today.toISOString().split('T')[0]);
  };

  // Helper to normalize any date format (YYYY-MM-DD, YYYY/MM/DD, ISO timestamps, etc.)
  const normalizeDate = (dStr: string) => {
    if (!dStr) return '';
    const clean = dStr.split('T')[0].trim();
    const parts = clean.split(/[-/]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      } else if (parts[2].length === 4) {
        // DD-MM-YYYY
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    return clean;
  };

  // Find exact attendance document match in system records across ID, Name, and normalized Date
  const getCellAttendance = (empIdOrObj: string | Employee, dayNum: number) => {
    const formattedDate = `${gridYear}-${String(gridMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    const empObj = typeof empIdOrObj === 'object' ? empIdOrObj : allEmployees.find(e => e.id === empIdOrObj || e.name === empIdOrObj);
    const idLower = (typeof empIdOrObj === 'string' ? empIdOrObj : empIdOrObj.id || '').trim().toLowerCase();
    const nameLower = (empObj?.name || (typeof empIdOrObj === 'string' ? empIdOrObj : '')).trim().toLowerCase();

    return history.find(h => {
      const hDate = normalizeDate(h.date);
      if (hDate !== formattedDate) return false;
      const hEmpIdLower = (h.employeeId || '').trim().toLowerCase();
      if (idLower && hEmpIdLower === idLower) return true;
      if (nameLower && hEmpIdLower === nameLower) return true;
      return false;
    }) || null;
  };

  // Lock status check for normal personnel
  const isCellLocked = (empId: string, dateStr: string) => {
    if (isSupervisor) return false;

    const todayStr = new Date().toISOString().split('T')[0];
    if (dateStr > todayStr) return true; // future dates locked always for staff

    const empIdLower = (empId || '').trim().toLowerCase();
    const targetNorm = normalizeDate(dateStr);
    const match = history.find(h => normalizeDate(h.date) === targetNorm && (h.employeeId || '').trim().toLowerCase() === empIdLower);
    if (match) {
      // Lock as soon as they logged it previously
      return true;
    }
    return false;
  };

  // Trigger editing form modal for cell
  const handleCellClick = (emp: Employee, dayNum: number) => {
    const dateStr = `${gridYear}-${String(gridMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    if (isCellLocked(emp.id, dateStr)) {
      alert("This cell is locked. Standard staff can only submit registers for the current day once. Please request a supervisor override to update submitted logs.");
      return;
    }

    const match = getCellAttendance(emp, dayNum);
    const dayInfo = isWeekendDay(gridYear, gridMonth, dayNum);
    const dateFormatted = `${gridYear}-${String(gridMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

    if (match) {
      const matchHours = (match.hoursWorked !== undefined && match.hoursWorked !== null && !isNaN(Number(match.hoursWorked)))
        ? Number(match.hoursWorked)
        : (match.startTime && match.endTime ? calculateHoursFromTimes(match.startTime, match.endTime) : (match.status === 'Present' ? (dayInfo.isSaturday ? 4 : 9) : 0));

      setEditingCell({
        employeeId: emp.id,
        employeeName: emp.name,
        date: dateFormatted,
        dayNum,
        status: match.status,
        startTime: match.startTime || (match.status === 'Present' ? '08:00' : ''),
        endTime: match.endTime || (match.status === 'Present' ? (dayInfo.isSaturday ? '12:00' : '17:00') : ''),
        hoursWorked: matchHours,
        comment: match.comment || '',
        isApproved: !!match.isApproved
      });
    } else {
      // Default presets based on weekday vs Saturday vs Sunday
      const standardStatus = dayInfo.isSunday ? 'Absent' : 'Present';
      const defaultHours = dayInfo.isSunday ? 0 : (dayInfo.isSaturday ? 4 : 9);
      setEditingCell({
        employeeId: emp.id,
        employeeName: emp.name,
        date: dateFormatted,
        dayNum,
        status: standardStatus,
        startTime: standardStatus === 'Present' ? '08:00' : '',
        endTime: standardStatus === 'Present' ? (dayInfo.isSaturday ? '12:00' : '17:00') : '',
        hoursWorked: defaultHours,
        comment: '',
        isApproved: false
      });
    }
  };

  // Handle modal timesheet updates
  const handleModalStatusToggle = (status: 'Present' | 'Absent') => {
    if (!editingCell) return;
    const dayInfo = isWeekendDay(gridYear, gridMonth, editingCell.dayNum);
    const defaultHours = status === 'Present' ? (dayInfo.isSaturday ? 4 : 9) : 0;
    
    setEditingCell(prev => prev ? {
      ...prev,
      status,
      startTime: status === 'Present' ? '08:00' : '',
      endTime: status === 'Present' ? (dayInfo.isSaturday ? '12:00' : '17:00') : '',
      hoursWorked: defaultHours
    } : null);
  };

  // Handle modal time value updates
  const handleModalTimeValueChange = (field: 'startTime' | 'endTime', value: string) => {
    if (!editingCell) return;
    const nextCell = { ...editingCell, [field]: value };
    if (nextCell.startTime && nextCell.endTime && nextCell.status === 'Present') {
      nextCell.hoursWorked = calculateHoursFromTimes(nextCell.startTime, nextCell.endTime);
    }
    setEditingCell(nextCell);
  };

  // Submit single cell register log
  const handleSaveCellRegister = async () => {
    if (!editingCell) return;
    setIsSyncing(true);
    setSystemBusy(true);

    const standardHours = getStandardHoursForDate(editingCell.date);
    const ot = Math.max(0, editingCell.hoursWorked - standardHours);
    const isSun = new Date(editingCell.date).getDay() === 0;

    const record: AttendanceRecord = {
      date: editingCell.date,
      employeeId: editingCell.employeeId,
      shiftId: selectedShiftId || shifts[0]?.id || 'SH-1',
      status: editingCell.status,
      overtimeHours: ot,
      comment: editingCell.comment,
      dayType: isHoliday ? DayType.HOLIDAY : (isSun ? DayType.SUNDAY : DayType.STANDARD),
      hoursWorked: editingCell.hoursWorked,
      startTime: editingCell.startTime,
      endTime: editingCell.endTime,
      isApproved: isSupervisor ? true : false,
      approvedBy: isSupervisor ? currentUser.name : '',
      approvedDate: isSupervisor ? new Date().toISOString().split('T')[0] : ''
    };

    try {
      onSave([record]);
      setEditingCell(null);
      setSuccessMessage(`Register for ${editingCell.employeeName} on ${editingCell.date} saved perfectly.`);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);
    } catch (e) {
      alert("Error: Saving attendance failed.");
    } finally {
      setIsSyncing(false);
      setSystemBusy(false);
    }
  };

  // Quick Action: Auto bulk prefill all unmarked personnel for currently selected date
  const handleBulkPreFillRegister = async () => {
    const unmarked = filteredEmployees.filter(emp => {
      const empIdLower = (emp.id || '').trim().toLowerCase();
      const match = history.find(h => (h.employeeId || '').trim().toLowerCase() === empIdLower && h.date === selectedDate);
      return !match;
    });

    if (unmarked.length === 0) {
      alert("All active filtered personnel already have a timesheet log for the selected date!");
      return;
    }

    const confirmFill = window.confirm(`Auto-log standard shift hours (9h for weekdays, 4h for Saturday) for ${unmarked.length} unmarked personnel on ${selectedDate}?`);
    if (!confirmFill) return;

    setIsSyncing(true);
    setSystemBusy(true);

    const dayInfo = getDayInfo(selectedDate);
    const isSun = new Date(selectedDate).getDay() === 0;

    const defaultStatus = isSun ? 'Absent' : 'Present';
    const defaultHours = isSun ? 0 : (dayInfo.isSaturday ? 4 : 9);
    const defaultStart = defaultStatus === 'Present' ? '08:00' : '';
    const defaultEnd = defaultStatus === 'Present' ? (dayInfo.isSaturday ? '12:00' : '17:00') : '';

    const bulkRecords: AttendanceRecord[] = unmarked.map(emp => {
      return {
        date: selectedDate,
        employeeId: emp.id,
        shiftId: selectedShiftId || shifts[0]?.id || 'SH-1',
        status: defaultStatus,
        overtimeHours: 0,
        comment: 'Standard Auto-Logged Shift Times',
        dayType: isHoliday ? DayType.HOLIDAY : (isSun ? DayType.SUNDAY : DayType.STANDARD),
        hoursWorked: defaultHours,
        startTime: defaultStart,
        endTime: defaultEnd,
        isApproved: isSupervisor ? true : false,
        approvedBy: isSupervisor ? currentUser.name : '',
        approvedDate: isSupervisor ? new Date().toISOString().split('T')[0] : ''
      };
    });

    try {
      onSave(bulkRecords);
      setSuccessMessage(`Automated bulk timesheets processed for ${bulkRecords.length} staff members.`);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5500);
    } catch (e) {
      alert("Error logging bulk registers.");
    } finally {
      setIsSyncing(false);
      setSystemBusy(false);
    }
  };

  const getDayInfo = (dateString: string) => {
    const d = new Date(dateString);
    const day = d.getDay();
    return {
      isSunday: day === 0,
      isSaturday: day === 6,
      isWeekday: day >= 1 && day <= 5,
    };
  };

  // Compile individual stats for visual dashboard indicators
  const stats = useMemo(() => {
    const filteredEmployeeIds = new Set(filteredEmployees.map(e => (e.id || '').trim().toLowerCase()));

    const activeLogsToday = history.filter(h => 
      h.date === selectedDate && filteredEmployeeIds.has((h.employeeId || '').trim().toLowerCase())
    );
    const presentTodayCount = activeLogsToday.filter(l => l.status === 'Present').length;
    const absentTodayCount = activeLogsToday.filter(l => l.status === 'Absent').length;

    return {
      totalStaff: filteredEmployees.length,
      presentToday: presentTodayCount,
      absentToday: absentTodayCount,
      pendingToday: Math.max(0, filteredEmployees.length - activeLogsToday.length)
    };
  }, [history, selectedDate, filteredEmployees]);

  // Bulk Approve pending logs across the departments
  const pendingApprovals = useMemo(() => {
    const list: Array<{
      employee: Employee;
      date: string;
      shiftId: string;
      shiftName: string;
      status: 'Present' | 'Absent';
      hoursWorked: number;
      startTime?: string;
      endTime?: string;
      comment: string;
    }> = [];

    const targetEmployees = selectedReviewTeamId === 'ALL' 
      ? allEmployees 
      : allEmployees.filter(e => e.teamId === selectedReviewTeamId);

    targetEmployees.forEach(member => {
      const matchRecords = history.filter(h => h.employeeId === member.id && !h.isApproved);
      matchRecords.forEach(mr => {
        if (reviewFilter === 'by_date' && mr.date !== selectedDate) return;

        const matchedShiftName = shifts.find(s => s.id === mr.shiftId)?.name || 'Custom Shift';
        const defaultHours = getStandardHoursForDate(mr.date);

        list.push({
          employee: member,
          date: mr.date,
          shiftId: mr.shiftId,
          shiftName: matchedShiftName,
          status: mr.status,
          hoursWorked: mr.hoursWorked !== undefined ? mr.hoursWorked : (mr.status === 'Present' ? defaultHours : 0),
          startTime: mr.startTime,
          endTime: mr.endTime,
          comment: mr.comment || ''
        });
      });
    });

    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [history, allEmployees, selectedReviewTeamId, reviewFilter, selectedDate, shifts]);

  const approveRecord = async (empId: string, dateStr: string, matchedShiftId: string) => {
    setSystemBusy(true);
    const mr = history.find(h => h.employeeId === empId && h.date === dateStr);
    if (!mr) return;

    const standardHours = getStandardHoursForDate(dateStr);
    const ot = Math.max(0, (mr.hoursWorked || 0) - standardHours);

    const updated: AttendanceRecord = {
      ...mr,
      isApproved: true,
      overtimeHours: ot,
      approvedBy: currentUser.name,
      approvedDate: new Date().toISOString().split('T')[0]
    };

    try {
      onSave([updated]);
      setSuccessMessage(`Attendance timesheet for employee ${empId} approved successfully.`);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);
    } catch {
      alert("Verification update failed.");
    } finally {
      setSystemBusy(false);
    }
  };

  const bulkApproveList = async () => {
    if (pendingApprovals.length === 0) return;
    setSystemBusy(true);

    const updatedList: AttendanceRecord[] = pendingApprovals.map(item => {
      const orig = history.find(h => h.employeeId === item.employee.id && h.date === item.date)!;
      const standardHours = getStandardHoursForDate(item.date);
      const ot = Math.max(0, (orig.hoursWorked || 0) - standardHours);

      return {
        ...orig,
        isApproved: true,
        overtimeHours: ot,
        approvedBy: currentUser.name,
        approvedDate: new Date().toISOString().split('T')[0]
      };
    });

    try {
      onSave(updatedList);
      setSuccessMessage(`Verified & Approved all ${updatedList.length} timesheets successfully.`);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    } catch {
      alert("Bulk timesheet approval failed.");
    } finally {
      setSystemBusy(false);
    }
  };

  const calculateRowSums = (empIdOrObj: string | Employee) => {
    const empObj = typeof empIdOrObj === 'object' ? empIdOrObj : allEmployees.find(e => e.id === empIdOrObj || e.name === empIdOrObj);
    const idLower = (typeof empIdOrObj === 'string' ? empIdOrObj : empIdOrObj.id || '').trim().toLowerCase();
    const nameLower = (empObj?.name || (typeof empIdOrObj === 'string' ? empIdOrObj : '')).trim().toLowerCase();
    const targetMonthPrefix = `${gridYear}-${String(gridMonth + 1).padStart(2, '0')}`;

    const records = history.filter(h => {
      const hDate = normalizeDate(h.date);
      if (!hDate.startsWith(targetMonthPrefix)) return false;
      const hEmpIdLower = (h.employeeId || '').trim().toLowerCase();
      if (idLower && hEmpIdLower === idLower) return true;
      if (nameLower && hEmpIdLower === nameLower) return true;
      return false;
    });

    let present = 0;
    let absent = 0;
    let approved = 0;
    let totalHoursLogged = 0;

    records.forEach(r => {
      if (r.status === 'Present') {
        present++;
        const cellDateStr = normalizeDate(r.date);
        let hrs = 0;
        if (r.hoursWorked !== undefined && r.hoursWorked !== null && !isNaN(Number(r.hoursWorked))) {
          hrs = Number(r.hoursWorked);
        } else if (r.startTime && r.endTime) {
          hrs = calculateHoursFromTimes(r.startTime, r.endTime);
        } else {
          hrs = getStandardHoursForDate(cellDateStr);
        }
        totalHoursLogged += hrs;
      } else {
        absent++;
      }
      if (r.isApproved) approved++;
    });

    return { present, absent, approved, totalHoursLogged };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-full">
      {/* Banner / Tab Headers */}
      {scope !== 'ALL' && (
        <div className="bg-indigo-50 text-indigo-700 p-3 rounded-2xl border border-indigo-100 flex items-center space-x-2.5 mx-1">
          <ShieldCheck size={14} className="text-indigo-600" />
          <p className="text-[9.5px] font-black uppercase tracking-widest leading-none">
            Scope Level: {scope === 'TEAM' ? 'Team Roster Access' : 'Private Timesheet Mode'}
          </p>
        </div>
      )}

      {showSuccess && (
        <div className="bg-emerald-600 text-white p-3.5 rounded-2xl shadow-lg flex items-center justify-between mx-1 animate-in slide-in-from-top-1.5 duration-300">
          <div className="flex items-center space-x-2">
            <CheckCircle2 size={15} />
            <p className="text-[10px] font-black uppercase tracking-wider leading-none">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Primary Navigation Mode Tabs (Grid Logger vs. Reviewer) */}
      <div className="flex justify-start w-full px-1 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('log')}
          className={`px-5 py-3 font-bold uppercase text-[10.5px] tracking-widest transition-all border-b-2 outline-none -mb-[2px] flex items-center space-x-2 ${
            activeTab === 'log' 
              ? 'border-indigo-600 text-indigo-600 font-extrabold' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Calendar size={13} />
          <span>Attendance Register</span>
        </button>

        {isSupervisor && (
          <button 
            onClick={() => setActiveTab('review')}
            className={`px-5 py-3 font-bold uppercase text-[10.5px] tracking-widest transition-all border-b-2 outline-none -mb-[2px] flex items-center space-x-2 ${
              activeTab === 'review' 
                ? 'border-indigo-600 text-indigo-600 font-extrabold' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <UserCheck size={13} />
            <span>Attendance Verification</span>
            {pendingApprovals.length > 0 && (
              <span className="bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">
                {pendingApprovals.length}
              </span>
            )}
          </button>
        )}
      </div>

      {activeTab === 'log' ? (
        <>
          {/* Timesheet Matrix Filter Controls */}
          <div className="p-5 bg-white border border-slate-200/60 rounded-3xl shadow-sm mx-1 space-y-4">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                {/* Search query */}
                <div className="relative flex-1 md:flex-initial min-w-[180px]">
                  <span className="absolute inset-y-0 left-3 flex items-center justify-center text-slate-400 pointer-events-none">
                    <Search size={13} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search personnel name..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Department Select */}
                <div className="relative">
                  <select
                    className="appearance-none bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-[10px] font-bold uppercase text-slate-750 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer text-slate-700"
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                  >
                    <option value="ALL">All Departments</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
                </div>

                {/* Team selector */}
                <div className="relative">
                  <select
                    className="appearance-none bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-[10px] font-bold uppercase text-slate-750 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer text-slate-700"
                    value={selectedTeamFilterId}
                    onChange={(e) => setSelectedTeamFilterId(e.target.value)}
                  >
                    <option value="ALL">All Teams</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
                </div>
              </div>

              {/* Go to month / Date picker / Auto bulk logs */}
              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto self-stretch lg:self-auto justify-end">
                {/* Master calendar month nav */}
                <div className="flex items-center space-x-1 border border-slate-200 rounded-xl p-0.5 bg-slate-50">
                  <button onClick={handlePrevMonth} className="p-1.5 rounded-lg hover:bg-white text-slate-500 hover:text-indigo-600 transition-colors">
                    <ChevronLeft size={13} />
                  </button>
                  <span className="text-[9.5px] font-black text-slate-700 px-3 uppercase tracking-wider min-w-[110px] text-center">
                    {monthNames[gridMonth]} {gridYear}
                  </span>
                  <button onClick={handleNextMonth} className="p-1.5 rounded-lg hover:bg-white text-slate-500 hover:text-indigo-600 transition-colors">
                    <ChevronRight size={13} />
                  </button>
                </div>

                <button 
                  onClick={handleGoToTodayMonth}
                  className="px-3.5 py-2 hover:bg-slate-50 border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-wider text-slate-600"
                  title="Return to the current calendar month"
                >
                  Current Month
                </button>

                <button 
                  onClick={handleExportToExcel}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-[9px] font-black uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5 cursor-pointer border border-emerald-900"
                  title="Download Attendance Register as Excel File"
                >
                  <FileSpreadsheet size={13} />
                  <span>Export Excel</span>
                </button>

                {isSupervisor && (
                  <button 
                    onClick={handleBulkPreFillRegister}
                    disabled={isSyncing}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-700 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md transition-all flex items-center gap-1.5"
                    title={`Auto fill standard registers on ${selectedDate}`}
                  >
                    <Sparkles size={11} />
                    <span>Quick Fill Selected Date ({new Date(selectedDate).getDate()})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Sub informational selectors specifically linking highlighted day */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100/70 text-[8.5px] font-black uppercase tracking-wider text-slate-500">
               <div className="flex flex-wrap items-center gap-3">
                 <div className="flex items-center space-x-2">
                    <CalendarDays size={12} className="text-slate-400" />
                    <span>Highlighted Register Date:</span>
                    <input 
                      type="date"
                      className="bg-slate-100 border border-slate-200/50 rounded px-2 py-0.5 font-bold outline-none text-slate-800"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                 </div>
               </div>

               <div className="flex flex-wrap gap-x-3 gap-y-1 items-center font-bold text-[8px] bg-slate-50 p-2 rounded-xl text-slate-500 border border-slate-100 uppercase">
                 <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-indigo-100 border border-indigo-300"></span>Weekday (9 Hrs)</span>
                 <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-100 border border-amber-300"></span>Saturday (4 Hrs)</span>
                 <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-rose-100 border border-rose-300"></span>Sunday (Rest / Off)</span>
               </div>
            </div>
          </div>

          {/* Timesheet matrix statistics cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mx-1">
             <div className="bg-white border border-slate-150 p-3.5 rounded-2xl shadow-sm flex items-center justify-between">
                <div>
                   <p className="text-[7.5px] font-black uppercase text-slate-400 tracking-widest">Selected Personnel Roster</p>
                   <p className="text-base font-black text-slate-900 mt-1">{stats.totalStaff} Members</p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500">
                   <Users size={14} />
                </div>
             </div>

             <div className="bg-white border border-slate-150 p-3.5 rounded-2xl shadow-sm flex items-center justify-between">
                <div>
                   <p className="text-[7.5px] font-black uppercase text-slate-400 tracking-widest">Present (Selected day)</p>
                   <p className="text-base font-black text-slate-900 mt-1">{stats.presentToday} Logged</p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                   <Check size={14} className="stroke-[3]" />
                </div>
             </div>

             <div className="bg-white border border-slate-150 p-3.5 rounded-2xl shadow-sm flex items-center justify-between">
                <div>
                   <p className="text-[7.5px] font-black uppercase text-slate-400 tracking-widest">Absent (Selected day)</p>
                   <p className="text-base font-black text-slate-900 mt-1">{stats.absentToday} Logged</p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
                   <X size={14} className="stroke-[3]" />
                </div>
             </div>

             <div className="bg-white border border-slate-150 p-3.5 rounded-2xl shadow-sm flex items-center justify-between">
                <div>
                   <p className="text-[7.5px] font-black uppercase text-slate-400 tracking-widest">Unmarked (Selected day)</p>
                   <p className="text-base font-black text-slate-900 mt-1">{stats.pendingToday} Unmarked</p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 animate-pulse">
                   <Clock size={14} />
                </div>
             </div>
          </div>

          {/* HIGH-FIDELITY SPREADSHEET MATRIX (DESKTOP) */}
          <div className="hidden lg:block bg-white border border-slate-900 rounded-2xl overflow-hidden shadow-sm mx-1">
            {/* View switcher header */}
            <div className="px-6 py-3 bg-slate-100 border-b border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="space-y-0.5">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Attendance Register Ledger</h3>
                <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Format matching official register spreadsheet</p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={handleExportToExcel}
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-[8.5px] font-black uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5 border border-emerald-900 cursor-pointer"
                  title="Download Attendance Register in Excel format matching the official spreadsheet layout"
                >
                  <FileSpreadsheet size={13} />
                  <span>Download Excel Register</span>
                </button>
                <div className="flex bg-slate-200 p-0.5 rounded-xl border border-slate-400 max-w-max">
                  {weeks.map(wk => (
                    <button
                      key={wk.index}
                      onClick={() => setActiveWeekIndex(wk.index)}
                      className={`px-3 py-1 rounded-lg text-[8.5px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        activeWeekIndex === wk.index 
                          ? 'bg-slate-900 text-white shadow-sm' 
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {wk.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse border border-slate-900 text-[9.5px] font-mono select-none antialiased">
                <thead>
                  <tr className="bg-white text-slate-900 border-b border-slate-900 font-extrabold uppercase text-[8.5px]">
                    <th className="w-10 text-center border border-slate-900 bg-white py-2 px-1 text-slate-900 font-black">SN O</th>
                    <th className="w-48 text-left border border-slate-900 bg-white py-2 px-3 text-slate-900 font-black">EMPLOYEE NAME</th>
                    {visibleDaysArray.map(d => {
                      const dStr = `${String(d).padStart(2, '0')}/${String(gridMonth + 1).padStart(2, '0')}/${String(gridYear).slice(-2)}`;
                      const isActiveTargetDay = Number(selectedDate.split('-')[2]) === d && Number(selectedDate.split('-')[1]) === (gridMonth+1) && Number(selectedDate.split('-')[0]) === gridYear;

                      return (
                        <th 
                          key={d} 
                          className={`border border-slate-900 text-center py-2 px-0.5 min-w-[28px] duration-100 select-none ${
                            isActiveTargetDay ? 'bg-amber-200 text-black font-black' : 'bg-white text-black'
                          }`}
                        >
                          <div className="[writing-mode:vertical-rl] rotate-180 font-mono font-bold text-[8.5px] text-slate-900 tracking-tight mx-auto py-1 whitespace-nowrap">
                            {dStr}
                          </div>
                        </th>
                      );
                    })}
                    <th className="w-28 text-center border border-slate-900 bg-white py-2 px-1 text-slate-900 font-black text-[7.5px] leading-snug uppercase">
                      TOTAL DE HORAS DURANTE O MES
                    </th>
                    <th className="w-24 text-center border border-slate-900 bg-white py-2 px-1 text-slate-900 font-black text-[7.5px] leading-snug uppercase">
                      TOTAL DE DIAS TRABALHADOS
                    </th>
                  </tr>
                </thead>
                
                <tbody className="divide-y divide-slate-900">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={visibleDaysArray.length + 4} className="text-center py-12 font-sans text-xs uppercase font-bold text-slate-400 tracking-widest border border-slate-900">
                        No personnel matched current filters
                      </td>
                    </tr>
                  ) : (
                    (() => {
                      let globalCounter = 1;
                      return displayDepartmentGroups.map(dept => {
                        const deptEmployees = filteredEmployees.filter(e => getNormalizedDepartment(e) === dept);
                        if (deptEmployees.length === 0) return null;

                        const teamHeaderName = dept === 'Technical Team' ? 'STARTECH TEAM' : `${dept.toUpperCase()} TEAM`;

                        return (
                          <React.Fragment key={dept}>
                            {/* Team Banner Row */}
                            <tr className="bg-slate-50 text-[#1F4E79] font-black text-[11px] uppercase tracking-widest h-7 border border-slate-900">
                              <td colSpan={visibleDaysArray.length + 4} className="text-center font-sans font-extrabold py-1 border border-slate-900 bg-slate-100/80">
                                {teamHeaderName}
                              </td>
                            </tr>

                            {deptEmployees.map((emp) => {
                              const sums = calculateRowSums(emp);
                              const sNo = globalCounter++;

                              return (
                                <tr key={emp.id} className="hover:bg-amber-100/40 text-slate-900 border border-slate-900">
                                  <td className="text-center font-bold text-slate-900 bg-[#FDEADA] border border-slate-900 text-xs py-1.5">
                                    {sNo}
                                  </td>
                                  <td className="pl-3 pr-2 font-bold text-slate-900 bg-[#FDEADA] border border-slate-900 text-xs py-1.5 truncate max-w-[200px]" title={emp.name}>
                                    {emp.name}
                                  </td>

                                  {visibleDaysArray.map(d => {
                                    const match = getCellAttendance(emp, d);
                                    const cellDateStr = `${gridYear}-${String(gridMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                                    let hours = 0;
                                    if (match) {
                                      if (match.status === 'Present') {
                                        if (match.hoursWorked !== undefined && match.hoursWorked !== null && !isNaN(Number(match.hoursWorked))) {
                                          hours = Number(match.hoursWorked);
                                        } else if (match.startTime && match.endTime) {
                                          hours = calculateHoursFromTimes(match.startTime, match.endTime);
                                        } else {
                                          hours = getStandardHoursForDate(cellDateStr);
                                        }
                                      } else {
                                        hours = 0;
                                      }
                                    }

                                    return (
                                      <td 
                                        key={d} 
                                        onClick={() => handleCellClick(emp, d)}
                                        className={`text-center border border-slate-900 font-mono font-bold text-xs hover:bg-amber-200/60 cursor-pointer py-1.5 transition-colors ${
                                          hours > 0 ? 'bg-amber-50/50 text-slate-900' : 'bg-white text-slate-600'
                                        }`}
                                        title={`Day ${d}: ${hours} hours (Click to edit)`}
                                      >
                                        {hours}
                                      </td>
                                    );
                                  })}

                                  <td className="text-center font-extrabold border border-slate-900 bg-[#FDEADA] text-slate-900 font-mono text-xs py-1.5">
                                    {sums.totalHoursLogged}
                                  </td>
                                  <td className="text-center font-extrabold border border-slate-900 bg-[#FDEADA] text-slate-900 font-mono text-xs py-1.5">
                                    {sums.present}
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      });
                    })()
                  )}

                  {/* Summary Row */}
                  {filteredEmployees.length > 0 && (
                    <tr className="bg-white border border-slate-900">
                      <td colSpan={2} className="border border-slate-900 bg-[#FDEADA]"></td>
                      <td colSpan={visibleDaysArray.length} className="border border-slate-900 bg-[#FFC000] text-black font-black text-center text-xs py-2 uppercase tracking-widest font-sans">
                        TOTAL HOURS
                      </td>
                      <td className="border border-slate-900 bg-[#FFC000] text-black font-extrabold text-center font-mono text-xs py-2">
                        {filteredEmployees.reduce((acc, emp) => acc + calculateRowSums(emp.id).totalHoursLogged, 0)}
                      </td>
                      <td className="border border-slate-900 bg-[#FDEADA]"></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* COMPACT INTERACTIVE LIST & PREVIEW (MOBILE/COMPACT SCREENS) */}
          <div className="block lg:hidden space-y-3">
            <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm space-y-3">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Choose crew member to open card timesheet</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full">
                {filteredEmployees.map(emp => {
                  const isChosen = activeMobileMemberId === emp.id;
                  const sums = calculateRowSums(emp);

                  return (
                    <button
                      key={emp.id}
                      onClick={() => setActiveMobileMemberId(emp.id)}
                      className={`px-3 py-2 rounded-2xl border text-left transition-all relative w-full ${
                        isChosen 
                        ? 'bg-slate-900 border-slate-950 text-white shadow-md scale-102' 
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                      }`}
                    >
                      <p className="text-[9.5px] font-bold uppercase tracking-tight leading-none truncate">{emp.name}</p>
                      <p className={`text-[7px] font-bold uppercase mt-1 ${isChosen ? 'text-slate-450' : 'text-slate-500'}`}>{emp.role}</p>
                      <div className="flex items-center space-x-1 font-mono text-[7px] font-black tracking-tighter mt-2 text-slate-400">
                        <span className="bg-slate-800 text-slate-200 px-1 py-0.5 rounded">P:{sums.present}</span>
                        <span className="bg-slate-800 text-slate-200 px-1 py-0.5 rounded">H:{sums.totalHoursLogged}h</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {activeMobileMember ? (
              <div className="bg-slate-900 border border-slate-950 text-slate-100 rounded-3xl p-5 shadow-xl space-y-4">
                <div className="border-b border-white/10 pb-3 flex justify-between items-center">
                  <div>
                    <p className="text-[8px] font-bold text-indigo-300 uppercase tracking-widest">Active Timesheet Calendar Card</p>
                    <h4 className="text-xs font-black uppercase text-white mt-1">{activeMobileMember.name}</h4>
                    <p className="text-[8px] text-slate-400 font-semibold uppercase mt-0.5">{activeMobileMember.department} • {activeMobileMember.role}</p>
                  </div>
                  
                  {/* Current month text indicator */}
                  <div className="text-right">
                    <span className="text-[10px] font-black text-white bg-slate-800 px-3 py-1.5 rounded-xl uppercase border border-slate-700">
                      {monthNames[gridMonth].substring(0,3)} '{String(gridYear).substring(2)}
                    </span>
                  </div>
                </div>

                {/* 7 column monthly layout */}
                <div className="grid grid-cols-7 gap-1.5 font-mono text-center col-span-7">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((t, idx) => {
                    let headerColor = "text-slate-500";
                    if (idx === 0) headerColor = "text-rose-400 font-black";
                    if (idx === 6) headerColor = "text-amber-450 font-black";
                    return (
                      <div key={t} className={`text-[8px] uppercase tracking-wider ${headerColor}`}>{t}</div>
                    );
                  })}

                  {/* Padding empty days */}
                  {Array.from({ length: new Date(gridYear, gridMonth, 1).getDay() }).map((_, emptyIdx) => (
                    <div key={`empty-${emptyIdx}`} className="aspect-square"></div>
                  ))}

                  {daysArray.map(dayNum => {
                    const match = getCellAttendance(activeMobileMember, dayNum);
                    const wInfo = isWeekendDay(gridYear, gridMonth, dayNum);
                    const cellDateStr = `${gridYear}-${String(gridMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    const isCellHoliday = !!holidays[cellDateStr];
                    const isActiveTargetDay = Number(selectedDate.split('-')[2]) === dayNum && Number(selectedDate.split('-')[1]) === (gridMonth+1) && Number(selectedDate.split('-')[0]) === gridYear;

                    let cellBg = 'bg-slate-850 text-slate-400 border border-slate-800/40';
                    let displayChar = dayNum;
                    let bottomText = '—';

                    if (match) {
                      if (match.status === 'Present') {
                        cellBg = match.isApproved 
                          ? 'bg-emerald-600 text-white font-extrabold shadow-sm ring-1 ring-emerald-500' 
                          : 'bg-indigo-600 text-white font-bold shadow-sm ring-1 ring-indigo-500';
                        const matchHours = (match.hoursWorked !== undefined && match.hoursWorked !== null && !isNaN(Number(match.hoursWorked)))
                          ? Number(match.hoursWorked)
                          : (match.startTime && match.endTime ? calculateHoursFromTimes(match.startTime, match.endTime) : getStandardHoursForDate(cellDateStr));
                        bottomText = `${matchHours}h`;
                      } else {
                        cellBg = 'bg-rose-600 text-white font-bold ring-1 ring-rose-500';
                        bottomText = 'ABS';
                      }
                    } else {
                      if (wInfo.isSunday) {
                        cellBg = 'bg-rose-950/20 text-rose-400 border border-rose-900/40';
                        bottomText = 'REST';
                      } else if (isCellHoliday) {
                        cellBg = 'bg-fuchsia-950/20 text-fuchsia-400 border border-fuchsia-900/40';
                        bottomText = 'HOLI';
                      }
                    }

                    return (
                      <button
                        key={dayNum}
                        onClick={() => handleCellClick(activeMobileMember, dayNum)}
                        className={`aspect-square rounded-xl flex flex-col justify-center items-center text-[9px] transition-all relative ${cellBg} ${
                          isActiveTargetDay ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-900' : ''
                        }`}
                      >
                        <span className="font-extrabold">{dayNum}</span>
                        <span className="text-[6px] uppercase tracking-tighter opacity-80 mt-0.5">{bottomText}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </>
      ) : (
        /* SUPERVISOR VERIFICATION REVIEW TAB */
        <div className="space-y-4">
          <div className="p-4 bg-white border border-slate-200/60 rounded-3xl shadow-sm mx-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="space-y-1">
                <label className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest ml-1">Team Filter</label>
                <div className="relative">
                  <select 
                    className="bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-[10px] font-bold text-slate-700 outline-none appearance-none uppercase"
                    value={selectedReviewTeamId}
                    onChange={(e) => setSelectedReviewTeamId(e.target.value)}
                  >
                    <option value="ALL">All Teams</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest ml-1">Date Scope Filter</label>
                <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                  <button 
                    onClick={() => setReviewFilter('all_pending')}
                    className={`px-3.5 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${reviewFilter === 'all_pending' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                  >
                    All Pending Verification
                  </button>
                  <button 
                    onClick={() => setReviewFilter('by_date')}
                    className={`px-3.5 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${reviewFilter === 'by_date' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                  >
                    Selected Date ({selectedDate})
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-end self-end md:self-center">
              <button 
                onClick={bulkApproveList}
                disabled={pendingApprovals.length === 0}
                className={`py-2 px-5 rounded-2xl font-black uppercase text-[9px] tracking-widest shadow-md transition-all flex items-center space-x-2 ${
                  pendingApprovals.length === 0 
                  ? 'bg-slate-100 text-slate-300 cursor-not-allowed border border-slate-200' 
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                <CheckCircle2 size={13} />
                <span>Verify & Approve Backlog ({pendingApprovals.length})</span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm mx-1">
            <div className="hidden md:grid grid-cols-12 bg-slate-50/80 backdrop-blur-md text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-200 px-8 py-3.5">
               <div className="col-span-4">Staff Member & Timesheet Date</div>
               <div className="col-span-3 text-center">In/Out Stamp (Hours)</div>
               <div className="col-span-2 text-center">Overtime Overages</div>
               <div className="col-span-3 text-right">Actions</div>
            </div>

            <div className="divide-y divide-slate-100 font-sans">
              {pendingApprovals.length === 0 ? (
                <div className="py-20 text-center">
                  <UserCheck size={44} className="mx-auto text-emerald-300 mb-3 animate-bounce" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">All timesheets verified and up-to-date!</p>
                  <p className="text-[8px] text-slate-300 uppercase mt-1.5 tracking-widest">No pending registers match the criteria</p>
                </div>
              ) : pendingApprovals.map(item => {
                const standardHours = getStandardHoursForDate(item.date);
                const ot = Math.max(0, item.hoursWorked - standardHours);
                const dayName = isWeekendDay(Number(item.date.split('-')[0]), Number(item.date.split('-')[1]) - 1, Number(item.date.split('-')[2])).dayName;

                return (
                  <div key={`${item.date}_${item.employee.id}`} className="p-5 md:px-8 md:py-3.5 hover:bg-slate-50/50 transition-colors">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      <div className="col-span-1 md:col-span-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8.5 h-8.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-xs shrink-0">
                            {item.employee.name.charAt(0)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-slate-800 text-xs truncate uppercase tracking-tight">{item.employee.name}</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{item.date} ({dayName}) • {item.shiftName}</span>
                            {item.comment && (
                              <div className="text-[7.5px] italic text-slate-500 bg-slate-50 p-1 rounded border border-slate-100 mt-1 max-w-xs break-words font-mono leading-tight">
                                "{item.comment}"
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="col-span-1 md:col-span-3 text-center flex flex-col items-center justify-center">
                        <div className="flex items-center space-x-1 font-mono text-xs font-bold text-slate-700">
                          {item.startTime && item.endTime ? (
                            <span>{item.startTime} - {item.endTime}</span>
                          ) : (
                            <span>Manual Entry</span>
                          )}
                          <span className="text-[9px] text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded ml-1.5 font-bold uppercase">{item.hoursWorked}h</span>
                        </div>
                        <span className="text-[7.5px] font-bold text-slate-350 uppercase tracking-widest mt-0.5">Logged work hours</span>
                      </div>

                      <div className="col-span-1 md:col-span-2 text-center">
                        <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${
                          ot > 0 
                          ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' 
                          : 'bg-slate-50 text-slate-450 border border-slate-200'
                        }`}>
                          {ot > 0 ? `+${ot.toFixed(1)} hrs OT` : 'Standard Shift'}
                        </span>
                      </div>

                      <div className="col-span-1 md:col-span-3 text-right">
                        <button 
                          onClick={() => approveRecord(item.employee.id, item.date, item.shiftId)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[8.5px] uppercase tracking-wider rounded-xl shadow-sm flex items-center space-x-1.5 ml-auto transition-transform active:scale-95 cursor-pointer"
                        >
                          <Check size={11} className="stroke-[3]" />
                          <span>Verify & Approve</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {/* CELL REGISTER LOGGING popover core MODAL */}
      {editingCell && (
        <div className="fixed inset-0 bg-[#06112C]/60 backdrop-blur-sm z-[200] flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div>
                <span className="text-[7.5px] font-bold tracking-[0.25em] text-indigo-300 uppercase block">Timesheet Register Ledger</span>
                <span className="text-xs font-black uppercase text-white tracking-wide mt-0.5 block truncate max-w-[260px]">
                  {editingCell.employeeName}
                </span>
                <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 block mt-0.5">
                  ID: {editingCell.employeeId} • {editingCell.date} ({isWeekendDay(Number(editingCell.date.split('-')[0]), Number(editingCell.date.split('-')[1]) - 1, Number(editingCell.date.split('-')[2])).dayName})
                </span>
              </div>
              <button 
                onClick={() => setEditingCell(null)}
                className="w-7 h-7 bg-slate-800 hover:bg-slate-705 text-slate-300 rounded-lg flex items-center justify-center transition-colors shrink-0"
              >
                <X size={14} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-3 font-sans">
              
              {/* Off-Period Planner Feed Banner */}
              {(() => {
                const empObj = allEmployees.find(e => e.id === editingCell.employeeId);
                if (empObj) {
                  const plannedStatus = getPlannerPlannedStatus(empObj, editingCell.date);
                  if (plannedStatus !== 'p') {
                    let alertTitle = 'Planned Rest Day';
                    let alertDesc = 'REST DAY scheduled today on rotation.';
                    let badgeStyle = 'bg-rose-50 border-rose-150 text-rose-850';
                    let textAccent = 'text-rose-955';

                    if (plannedStatus === 'L') {
                      alertTitle = 'Rotation Leave / Off Period';
                      alertDesc = 'Calendar leave scheduled.';
                      badgeStyle = 'bg-amber-50 border-amber-200 text-amber-800';
                      textAccent = 'text-amber-955';
                    } else if (plannedStatus === 'S') {
                      alertTitle = 'Medical / Sick Leave';
                      alertDesc = 'Medical sick leave registered.';
                      badgeStyle = 'bg-rose-50 border-rose-200 text-rose-800';
                      textAccent = 'text-rose-955';
                    } else if (plannedStatus === 'H') {
                      alertTitle = 'Public Holiday';
                      alertDesc = 'Global public holiday marked.';
                      badgeStyle = 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-800';
                      textAccent = 'text-fuchsia-955';
                    }

                    return (
                      <div className={`border rounded-xl px-2.5 py-1.5 flex items-center gap-2 text-[8px] font-bold uppercase tracking-wide leading-none ${badgeStyle}`}>
                        <ShieldAlert size={11} className="shrink-0 text-indigo-700 animate-pulse" />
                        <span className={`font-black tracking-tight ${textAccent}`}>
                          Planner: {alertTitle}
                        </span>
                        <span className="font-medium italic tracking-wide font-sans normal-case text-slate-500 ml-auto">
                          ({alertDesc})
                        </span>
                      </div>
                    );
                  }
                }
                return null;
              })()}

              {/* Status Selector */}
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
                <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest">Attendance Status</span>
                <div className="flex gap-1.5 shrink-0">
                   <button
                     type="button"
                     onClick={() => handleModalStatusToggle('Present')}
                     className={`px-3 py-1.5 rounded-lg text-[8.5px] font-black uppercase tracking-wide border transition-all ${
                       editingCell.status === 'Present'
                       ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                       : 'bg-slate-50 border-slate-200 hover:border-slate-350 text-slate-550'
                     }`}
                   >
                     Present / On Duty
                   </button>

                   <button
                     type="button"
                     onClick={() => handleModalStatusToggle('Absent')}
                     className={`px-3 py-1.5 rounded-lg text-[8.5px] font-black uppercase tracking-wide border transition-all ${
                       editingCell.status === 'Absent'
                       ? 'bg-rose-600 border-rose-600 text-white shadow-sm'
                       : 'bg-slate-50 border-slate-200 hover:border-slate-350 text-slate-550'
                     }`}
                   >
                     Absent / Off Duty
                   </button>
                </div>
              </div>

              {/* Working time details */}
              {editingCell.status === 'Present' && (
                <div className="bg-slate-50 p-2.5 border border-slate-150 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center text-[7px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>In/Out Stamps</span>
                    <span className="text-indigo-600 font-extrabold normal-case font-sans">
                      Standard shift: {getStandardHoursForDate(editingCell.date)}h
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col">
                      <span className="text-[6.5px] font-bold text-slate-400 uppercase tracking-widest mb-1">In Stamp</span>
                      <input 
                        type="time"
                        className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-[10px] h-7 font-bold text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500"
                        value={editingCell.startTime}
                        onChange={(e) => handleModalTimeValueChange('startTime', e.target.value)}
                      />
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[6.5px] font-bold text-slate-400 uppercase tracking-widest mb-1">Out Stamp</span>
                      <input 
                        type="time"
                        className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-[10px] h-7 font-bold text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500"
                        value={editingCell.endTime}
                        onChange={(e) => handleModalTimeValueChange('endTime', e.target.value)}
                      />
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[6.5px] font-bold text-slate-400 uppercase tracking-widest mb-1">Hours</span>
                      <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2 h-7">
                        <input 
                          type="number" 
                          step="0.5"
                          min="0"
                          max="24"
                          className="w-full text-center bg-transparent border-none text-[10px] font-black outline-none font-mono py-0"
                          value={editingCell.hoursWorked}
                          onChange={(e) => setEditingCell({ ...editingCell, hoursWorked: Math.max(0, Number(e.target.value)) })}
                        />
                        <span className="text-[8px] text-slate-450 font-mono tracking-tight ml-0.5">h</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Comments Note input */}
              <div className="space-y-1">
                <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Register Comments / Reason</span>
                <input
                  type="text"
                  placeholder="E.g., completed scheduled tasks, delayed, sickness..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-[10px] font-semibold text-slate-750 placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                  value={editingCell.comment}
                  onChange={(e) => setEditingCell({ ...editingCell, comment: e.target.value })}
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="bg-slate-50/80 px-4 py-2 border-t border-slate-150 flex justify-end gap-1.5">
              <button
                type="button"
                onClick={() => setEditingCell(null)}
                className="px-3 py-1 font-bold text-[8.5px] uppercase tracking-wider text-slate-400 hover:text-slate-600 bg-transparent transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveCellRegister}
                disabled={isSyncing}
                className="px-4 py-1.5 bg-slate-900 border border-slate-950 text-white font-black text-[8.5px] uppercase tracking-wider rounded-lg hover:bg-slate-950 shadow-sm transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
              >
                {isSyncing ? <RotateCcw className="animate-spin" size={12} /> : <Check size={11} className="stroke-[3]" />}
                <span>{isSyncing ? 'Saving...' : 'Save Ledger'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AttendancePage;
