
import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Calendar, Sun, Moon, ShieldCheck, Clock, Users, Database, FileText, MessageSquare, History, UserCheck, Camera, Download } from 'lucide-react';
import { AttendanceRecord, Shift, Team, DayType, ShiftType, Employee } from '../types';
import Card from '../components/Card';

const HistoryPage: React.FC<{ 
  history: AttendanceRecord[]; 
  shifts: Shift[]; 
  teams: Team[];
  currentUser: Employee;
  resolveStaffIdentity: (id: string) => Partial<Employee>;
}> = ({ history = [], shifts = [], teams = [], currentUser, resolveStaffIdentity }) => {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const allEmployees = useMemo(() => teams.flatMap(t => t.members || []), [teams]);

  interface GroupedHistoryItem {
    key: string;
    date: string;
    shiftId: string;
    present: number;
    absent: number;
    totalOT: number;
    dayType: DayType;
    records: AttendanceRecord[];
  }

  const handleSaveAsImage = async (key: string, date: string, shiftName: string) => {
    const element = document.getElementById(`register-capture-${key}`);
    if (!element || typeof (window as any).html2canvas === 'undefined') return;

    setIsExporting(key);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await (window as any).html2canvas(element, {
        backgroundColor: '#f8fafc',
        scale: 2,
        logging: false,
        useCORS: true
      });

      const link = document.createElement('a');
      link.download = `Register_${date}_${shiftName.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error("Export Error:", error);
      alert("Failed to generate image.");
    } finally {
      setIsExporting(null);
    }
  };
  const isSupervisor = useMemo(() => {
    const roleLower = (currentUser.role || '').toLowerCase();
    const accessLower = (currentUser.accessLevel || '').toLowerCase();
    return (
      roleLower.includes('supervisor') || 
      roleLower.includes('manager') || 
      roleLower.includes('director') || 
      roleLower.includes('hr') ||
      accessLower === 'supervisor' || 
      accessLower === 'manager' || 
      accessLower === 'admin' || 
      accessLower === 'director' ||
      accessLower === 'hsseq' ||
      accessLower === 'hr'
    );
  }, [currentUser]);

  const scope = isSupervisor ? 'ALL' : (currentUser.visibilityScope || 'SELF');

  const filteredHistory = useMemo(() => {
    if (scope === 'ALL' || isSupervisor) return history;
    if (scope === 'TEAM') {
       const teamMemberIds = allEmployees.filter(e => e.teamId === currentUser.teamId || e.teamName === currentUser.teamName).map(e => e.id);
       return history.filter(rec => teamMemberIds.includes(rec.employeeId));
    }
    return history.filter(rec => rec.employeeId === currentUser.id);
  }, [history, scope, currentUser, allEmployees, isSupervisor]);

  const grouped = useMemo(() => (filteredHistory || []).reduce((acc, rec) => {
    if (!rec || !rec.date) return acc;
    const shiftId = rec.shiftId || 's1';
    const key = `${rec.date}-${shiftId}`;
    if (!acc[key]) {
      acc[key] = { key, date: rec.date, shiftId, present: 0, absent: 0, totalOT: 0, records: [], dayType: rec.dayType || DayType.STANDARD };
    }
    const item = acc[key];
    if (rec.status === 'Present') item.present++; else item.absent++;
    item.totalOT += (rec.overtimeHours || 0);
    item.records.push(rec);
    return acc;
  }, {} as Record<string, GroupedHistoryItem>), [filteredHistory]);

  const sortedHistory = useMemo(() => (Object.values(grouped) as GroupedHistoryItem[]).sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))), [grouped]);

  // Excel compliance export state variables
  const [exportPeriod, setExportPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'all'>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(''); 
  const [selectedMonth, setSelectedMonth] = useState<string>(''); 
  const [selectedWeek, setSelectedWeek] = useState<string>(''); 

  // Custom filter states
  const [filterStaffId, setFilterStaffId] = useState<string>('all');
  const [filterTeamId, setFilterTeamId] = useState<string>('all');
  const [filterDept, setFilterDept] = useState<string>('all');

  const exportEmployees = useMemo(() => {
    const map = new Map<string, string>();
    allEmployees.forEach(e => {
      map.set(e.id, e.name);
    });
    filteredHistory.forEach(rec => {
      const name = resolveStaffIdentity(rec.employeeId)?.name;
      if (name && name !== rec.employeeId) {
        map.set(rec.employeeId, name);
      } else if (!map.has(rec.employeeId)) {
        map.set(rec.employeeId, rec.employeeId);
      }
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allEmployees, filteredHistory, resolveStaffIdentity]);

  const latestHistoryDate = useMemo(() => {
    if (filteredHistory.length === 0) return new Date().toISOString().split('T')[0];
    const dates = filteredHistory.map(h => String(h.date || '').split(' ')[0]);
    dates.sort();
    return dates[dates.length - 1];
  }, [filteredHistory]);

  const activeDate = selectedDate || latestHistoryDate || new Date().toISOString().split('T')[0];
  const activeMonth = selectedMonth || (activeDate ? activeDate.substring(0, 7) : '2026-06');
  const activeWeek = selectedWeek || activeDate;

  // Timezone-safe local date parser
  const parseLocalDate = (str: string) => {
    const parts = str.split(' ')[0].split('T')[0].split('-');
    if (parts.length < 3) return new Date();
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  };

  const getWeekRange = (dateStr: string) => {
    const date = parseLocalDate(dateStr);
    const day = date.getDay();
    const diff = date.getDate() - day; // Adjust to Sunday
    const sunday = new Date(date.setDate(diff));
    sunday.setHours(0, 0, 0, 0);
    const saturday = new Date(sunday.getTime() + 6 * 24 * 60 * 60 * 1000);
    saturday.setHours(23, 59, 59, 999);
    return { sunday, saturday };
  };

  const csvRow = (row: (string | number)[]) => {
    return row.map(val => {
      const text = String(val === undefined || val === null ? '' : val);
      const escaped = text.replace(/"/g, '""');
      return `"${escaped}"`;
    }).join(',');
  };

  const handleExcelExport = () => {
    let selectedRecords = [...filteredHistory];
    let periodTitle = '';

    if (exportPeriod === 'daily') {
      selectedRecords = selectedRecords.filter(rec => {
        const recDateOnly = String(rec.date || '').split(' ')[0].split('T')[0];
        return recDateOnly === activeDate;
      });
      periodTitle = `Daily Audit Roll - ${activeDate}`;
    } else if (exportPeriod === 'weekly') {
      const range = getWeekRange(activeWeek);
      if (range) {
        selectedRecords = selectedRecords.filter(rec => {
          const recDateOnly = String(rec.date || '').split(' ')[0].split('T')[0];
          const recLocalDate = parseLocalDate(recDateOnly);
          return recLocalDate >= range.sunday && recLocalDate <= range.saturday;
        });
        const pad = (n: number) => n.toString().padStart(2, '0');
        const startFmt = `${range.sunday.getFullYear()}-${pad(range.sunday.getMonth() + 1)}-${pad(range.sunday.getDate())}`;
        const endFmt = `${range.saturday.getFullYear()}-${pad(range.saturday.getMonth() + 1)}-${pad(range.saturday.getDate())}`;
        periodTitle = `Weekly Timesheet Register - Week of ${startFmt} to ${endFmt}`;
      }
    } else if (exportPeriod === 'monthly') {
      selectedRecords = selectedRecords.filter(rec => {
        const recDateOnly = String(rec.date || '').split(' ')[0].split('T')[0];
        return recDateOnly.startsWith(activeMonth);
      });
      periodTitle = `Monthly Attendance Ledger - ${activeMonth}`;
    } else {
      periodTitle = `Comprehensive Archive Dump - All Time`;
    }

    // Apply specific level filters
    if (filterStaffId !== 'all') {
      selectedRecords = selectedRecords.filter(rec => rec.employeeId === filterStaffId);
      const staffName = resolveStaffIdentity(filterStaffId)?.name || filterStaffId;
      periodTitle += ` [Staff: ${staffName}]`;
    }

    if (filterTeamId !== 'all') {
      selectedRecords = selectedRecords.filter(rec => rec.shiftId === filterTeamId);
      const teamName = shifts.find(s => s.id === filterTeamId)?.name || filterTeamId;
      periodTitle += ` [Group: ${teamName}]`;
    }

    if (filterDept !== 'all') {
      const getNormalizedDepartmentLocal = (emp: any): string => {
        const dept = (emp?.department || '').toLowerCase().trim();
        if (dept.includes('hr') || dept.includes('admin') || dept.includes('management') || dept.includes('compliance') || dept.includes('hse')) {
          return 'HR Team';
        }
        if (dept.includes('tech') || dept.includes('workshop')) {
          return 'Technical Team';
        }
        return 'Operators';
      };
      selectedRecords = selectedRecords.filter(rec => {
        const employee = resolveStaffIdentity(rec.employeeId);
        return getNormalizedDepartmentLocal(employee) === filterDept;
      });
      periodTitle += ` [Dept: ${filterDept}]`;
    }

    if (selectedRecords.length === 0) {
      alert("No records found matching the selected filters and parameters.");
      return;
    }

    const sortedExportRecords = [...selectedRecords].sort((a, b) => {
      const dateComp = String(b.date || '').localeCompare(String(a.date || ''));
      if (dateComp !== 0) return dateComp;
      const empA = resolveStaffIdentity(a.employeeId)?.name || a.employeeId;
      const empB = resolveStaffIdentity(b.employeeId)?.name || b.employeeId;
      return empA.localeCompare(empB);
    });

    const csvRows: string[] = [];
    csvRows.push(csvRow(["WORKSHOP HUB - PROFESSIONAL COMPLIANCE ATTENDANCE REGISTER"]));
    csvRows.push(csvRow(["ORGANIZATIONAL AUDIT & ROLL REGISTER LEDGER"]));
    csvRows.push(csvRow([]));
    csvRows.push(csvRow(["Report Title:", periodTitle]));
    csvRows.push(csvRow(["Export Timestamp:", new Date().toLocaleString()]));
    csvRows.push(csvRow(["Filing Personnel:", currentUser.name || 'System Operator']));
    csvRows.push(csvRow(["Roster Visibility Scope:", scope]));
    csvRows.push(csvRow(["Total Logged Entries:", sortedExportRecords.length]));
    csvRows.push(csvRow([]));
    csvRows.push(csvRow(["LEGEND KEY:", "P = Present / On Duty", "A = Absent / Off Duty", "Approved = Certified Shift", "Pending = Needs Supervisor Approval"]));
    csvRows.push(csvRow([]));

    csvRows.push(csvRow([
      "Index",
      "Filing Date",
      "Employee ID",
      "Employee Name",
      "Department/Division",
      "Operational Shift",
      "Shift Class",
      "In Stamp",
      "Out Stamp",
      "Standard Hours",
      "Overtime Hours",
      "Total Logged Hours",
      "Attendance Status",
      "Approval Status",
      "Register Comments & Override Explanations"
    ]));

    let totalPresentCount = 0;
    let totalAbsentCount = 0;
    let totalStandardHours = 0;
    let totalOvertimeHours = 0;
    let totalLoggedHours = 0;
    const uniqueStaffSet = new Set<string>();

    sortedExportRecords.forEach((rec, idx) => {
      const employee = resolveStaffIdentity(rec.employeeId);
      const displayName = (employee?.name && employee.name !== rec.employeeId) 
        ? employee.name 
        : (rec.employeeId === 'UNKNOWN' ? 'System Personnel' : rec.employeeId);
      
      const getNormalizedDepartmentLocal = (emp: any): string => {
        const dept = (emp?.department || '').toLowerCase().trim();
        if (dept.includes('hr') || dept.includes('admin') || dept.includes('management') || dept.includes('compliance') || dept.includes('hse')) {
          return 'HR Team';
        }
        if (dept.includes('tech') || dept.includes('workshop')) {
          return 'Technical Team';
        }
        return 'Operators';
      };

      const displayDept = getNormalizedDepartmentLocal(employee);
      const shift = shifts.find(s => s.id === rec.shiftId);
      const shiftName = shift?.name || "Shift";
      const shiftType = shift?.type || ShiftType.DAY;
      
      const isPresent = rec.status === 'Present';
      if (isPresent) totalPresentCount++; else totalAbsentCount++;

      const inStamp = rec.startTime || (shift ? shift.startTime : '07:30');
      const outStamp = rec.endTime || (shift ? shift.endTime : '16:30');
      
      const calculatedWorked = rec.hoursWorked !== undefined 
        ? rec.hoursWorked 
        : (isPresent ? 8 : 0);
      const otWorked = rec.overtimeHours || 0;
      
      totalStandardHours += isPresent ? (calculatedWorked - otWorked >= 0 ? calculatedWorked - otWorked : calculatedWorked) : 0;
      totalOvertimeHours += otWorked;
      totalLoggedHours += isPresent ? (calculatedWorked + otWorked) : 0;
      uniqueStaffSet.add(rec.employeeId);

      csvRows.push(csvRow([
        idx + 1,
        String(rec.date || '').split(' ')[0],
        rec.employeeId,
        displayName,
        displayDept,
        shiftName,
        shiftType,
        isPresent ? inStamp : '-',
        isPresent ? outStamp : '-',
        isPresent ? (calculatedWorked).toFixed(1) : "0.0",
        (otWorked).toFixed(1),
        isPresent ? (calculatedWorked + otWorked).toFixed(1) : "0.0",
        rec.status,
        rec.isApproved ? "Approved" : "Pending Review",
        rec.comment || ""
      ]));
    });

    csvRows.push(csvRow([]));
    csvRows.push(csvRow([]));
    csvRows.push(csvRow([]));

    csvRows.push(csvRow(["COMPLIANCE METRIC SUMMARY TABLES"]));
    csvRows.push(csvRow(["Metric Name", "Value", "Unit", "Standards Reference"]));
    csvRows.push(csvRow(["Total Unique Personnel Count", uniqueStaffSet.size, "Employees", "Payroll Active Roll"]));
    csvRows.push(csvRow(["Total Present Registrations", totalPresentCount, "Shift Days", "Direct Active On-site Count"]));
    csvRows.push(csvRow(["Total Absent Registrations", totalAbsentCount, "Shift Days", "Approved Rest/Furlough Logs"]));
    csvRows.push(csvRow(["Overall Regular Hours Served", totalStandardHours.toFixed(1), "Hours", "Base Employment Contract"]));
    csvRows.push(csvRow(["Overall Overtime Hours Served", totalOvertimeHours.toFixed(1), "Hours", "Extraordinary Shift Allocations"]));
    csvRows.push(csvRow(["Grand Net Logged Hours", totalLoggedHours.toFixed(1), "Hours", "Consolidated Billing Stamp"]));
    csvRows.push(csvRow(["Average Net Daily Roll-rate", ((totalPresentCount / (totalPresentCount + totalAbsentCount || 1)) * 100).toFixed(1) + "%", "Attendance Percentage", "Operational Yield Monitor"]));

    const csvContent = csvRows.join('\r\n');
    const sanitizedTitle = periodTitle.replace(/[^\w\s-]/gi, '').replace(/\s+/g, '_');
    const fileName = `Attendance_Register_${sanitizedTitle}.csv`;

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 max-w-full">
      {/* PROFESSIONAL ATTENDANCE PRINT / EXPORT ENGINE CONTROL PANEL */}
      {isSupervisor && (
        <div className="bg-white border border-slate-100 shadow-lg rounded-[2rem] p-5 mx-1 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">Attendance Ledger Export Center</h3>
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                Generate custom spreadsheets filtered by interval, crew, staff, or department
              </p>
            </div>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1 self-start sm:self-auto">
              <ShieldCheck size={11} className="stroke-[3]" />
              Supervisor Portal
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 items-end">
            {/* Period Selector */}
            <div className="flex flex-col space-y-1">
              <span className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider">Interval</span>
              <select
                className="w-full bg-slate-50 border border-slate-200 outline-none rounded-xl px-2.5 py-2 text-xs font-bold text-slate-700 cursor-pointer hover:border-slate-300 transition-all font-sans"
                value={exportPeriod}
                onChange={e => setExportPeriod(e.target.value as any)}
              >
                <option value="daily">Daily Extract</option>
                <option value="weekly">Weekly Roll Registry</option>
                <option value="monthly">Monthly Timesheet</option>
                <option value="all">Comprehensive Dump</option>
              </select>
            </div>

            {/* Dynamic Date Pickers depending on period type */}
            {exportPeriod === 'daily' && (
              <div className="flex flex-col space-y-1">
                <span className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider">Select Date</span>
                <input
                  type="date"
                  className="w-full bg-slate-50 border border-slate-200 outline-none rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-705 font-sans"
                  value={activeDate}
                  onChange={e => setSelectedDate(e.target.value)}
                />
              </div>
            )}

            {exportPeriod === 'weekly' && (
              <div className="flex flex-col space-y-1">
                <span className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider">Select Day of Week</span>
                <input
                  type="date"
                  className="w-full bg-slate-50 border border-slate-200 outline-none rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-705 font-sans"
                  value={activeWeek}
                  onChange={e => setSelectedWeek(e.target.value)}
                />
              </div>
            )}

            {exportPeriod === 'monthly' && (
              <div className="flex flex-col space-y-1">
                <span className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider">Choose Month</span>
                <input
                  type="month"
                  className="w-full bg-slate-50 border border-slate-200 outline-none rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-705 font-sans"
                  value={activeMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                />
              </div>
            )}

            {exportPeriod === 'all' && (
              <div className="flex flex-col space-y-1">
                <span className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider">Duration Specified</span>
                <div className="bg-slate-50 text-slate-400 rounded-xl border border-slate-100 px-2.5 py-2.5 text-xs font-bold italic select-none">
                  All Timestamps Selected
                </div>
              </div>
            )}

            {/* Staff Filter */}
            <div className="flex flex-col space-y-1">
              <span className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider">Staff Member</span>
              <select
                className="w-full bg-slate-50 border border-slate-200 outline-none rounded-xl px-2.5 py-2 text-xs font-bold text-slate-700 cursor-pointer hover:border-slate-300 transition-all font-sans"
                value={filterStaffId}
                onChange={e => setFilterStaffId(e.target.value)}
              >
                <option value="all">All Staff Personnel</option>
                {exportEmployees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>

            {/* Group or Team / Shift Filter */}
            <div className="flex flex-col space-y-1">
              <span className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider">Team / Shift</span>
              <select
                className="w-full bg-slate-50 border border-slate-200 outline-none rounded-xl px-2.5 py-2 text-xs font-bold text-slate-700 cursor-pointer hover:border-slate-300 transition-all font-sans"
                value={filterTeamId}
                onChange={e => setFilterTeamId(e.target.value)}
              >
                <option value="all">All Groups & Teams</option>
                {shifts.map(sh => (
                  <option key={sh.id} value={sh.id}>{sh.name}</option>
                ))}
              </select>
            </div>

            {/* Department Filter */}
            <div className="flex flex-col space-y-1">
              <span className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider">Department</span>
              <select
                className="w-full bg-slate-50 border border-slate-200 outline-none rounded-xl px-2.5 py-2 text-xs font-bold text-slate-700 cursor-pointer hover:border-slate-300 transition-all font-sans"
                value={filterDept}
                onChange={e => setFilterDept(e.target.value)}
              >
                <option value="all">All Departments</option>
                <option value="Operators">Operators</option>
                <option value="Technical Team">Technical Team</option>
                <option value="HR Team">HR Team</option>
              </select>
            </div>

            {/* Main Action Trigger Button */}
            <div>
              <button
                type="button"
                onClick={handleExcelExport}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:shadow-md cursor-pointer flex items-center justify-center gap-2 border border-emerald-700 active:scale-95"
              >
                <Download size={14} className="stroke-[2.5]" />
                <span>Download Report</span>
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white border border-slate-100 shadow-xl rounded-[2rem] overflow-hidden mx-1">
        <div className="hidden md:grid grid-cols-12 bg-slate-50/80 backdrop-blur-md text-[8px] font-black text-slate-400 uppercase tracking-[0.25em] border-b border-slate-100 px-8 py-4">
           <div className="col-span-3">Filing Date</div>
           <div className="col-span-3 text-center">Domain</div>
           <div className="col-span-3 text-center">Metrics</div>
           <div className="col-span-3 text-right">Registry Hash</div>
        </div>

        <div className="divide-y divide-slate-50">
          {sortedHistory.length === 0 ? (
            <div className="py-24 text-center">
              <Database size={48} className="mx-auto text-slate-100 mb-4" />
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">No archive records</p>
            </div>
          ) : sortedHistory.map((item) => {
            const shift = shifts.find(s => s.id === item.shiftId);
            const shiftIdx = shifts.findIndex(s => s.id === item.shiftId);
            const team = teams[shiftIdx];
            const supervisor = team?.members.find(m => m.id === team.supervisorId) || team?.members.find(m => m.role.includes('Supervisor'));
            const supervisorName = supervisor?.name || "Shift Supervisor";
            
            const isExpanded = expandedKey === item.key;
            const displayDate = String(item.date || '').split(' ')[0].split('T')[0];
            
            return (
              <React.Fragment key={item.key}>
                <div 
                  onClick={() => setExpandedKey(isExpanded ? null : item.key)} 
                  className={`group p-5 md:px-8 md:py-5 hover:bg-indigo-50/20 transition-all duration-300 cursor-pointer ${isExpanded ? 'bg-indigo-50/30' : ''}`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="col-span-1 md:col-span-3">
                      <div className="flex items-center space-x-3">
                        <div className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl shadow-lg shadow-indigo-100 animate-in slide-in-from-left-2">
                           <span className="text-[11px] font-black tracking-tight uppercase">{displayDate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-1 md:col-span-3 text-center">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center space-x-2 justify-center">
                           <div className={`p-1.5 rounded-lg border shadow-inner ${shift?.type === ShiftType.DAY ? 'bg-orange-50 border-orange-100 text-orange-600' : 'bg-slate-900 border-slate-800 text-white'}`}>
                              {shift?.type === ShiftType.DAY ? <Sun size={12} /> : <Moon size={12} />}
                           </div>
                           <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{shift?.name || 'Shift'}</span>
                        </div>
                        <p className="text-[7px] font-bold text-slate-400 uppercase mt-1 tracking-widest truncate max-w-[120px]">Sup: {supervisorName}</p>
                      </div>
                    </div>

                    <div className="col-span-1 md:col-span-3 text-center">
                       <div className="flex items-center justify-center space-x-3">
                          <span className="text-[9px] font-black text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{item.present}P</span>
                          <span className="text-[9px] font-black text-rose-600 uppercase bg-rose-50 px-2 py-0.5 rounded border border-rose-100">{item.absent}A</span>
                          <span className="text-[9px] font-black text-indigo-600 uppercase">+{item.totalOT.toFixed(1)}H</span>
                       </div>
                    </div>

                    <div className="col-span-1 md:col-span-3 text-right">
                       <div className="flex items-center justify-end space-x-4">
                          <div className="flex items-center space-x-1.5 text-slate-300 font-bold uppercase tracking-[0.15em] text-[8px] opacity-40 group-hover:opacity-100 transition-opacity">
                             <History size={10} className="opacity-50" />
                             <span>ID: {item.key.split('-')[0]}</span>
                          </div>
                          <ChevronDown size={18} className={`transition-transform duration-500 text-slate-300 ${isExpanded ? 'rotate-180 text-indigo-600' : ''}`} />
                       </div>
                    </div>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="bg-slate-50 border-y border-slate-100 p-6 md:px-12 animate-in slide-in-from-top-4 duration-500 shadow-inner">
                    <div className="mb-4 flex items-center justify-between px-2">
                       <div className="flex items-center space-x-2 text-indigo-600">
                          <UserCheck size={14}/>
                          <span className="text-[9px] font-black uppercase tracking-widest">Certified By: {supervisorName}</span>
                       </div>
                       <div className="flex items-center space-x-4">
                          <button 
                            onClick={() => handleSaveAsImage(item.key, displayDate, shift?.name || 'Shift')}
                            disabled={isExporting === item.key}
                            className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
                          >
                            {isExporting === item.key ? (
                              <History size={12} className="animate-spin" />
                            ) : (
                              <Camera size={12} />
                            )}
                            <span>{isExporting === item.key ? 'Processing...' : 'Save as Image'}</span>
                          </button>
                          <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Master Register Log</div>
                       </div>
                    </div>
                    
                    <div id={`register-capture-${item.key}`} className="bg-white border border-slate-200 rounded-[1.8rem] overflow-hidden shadow-xl">
                      {/* Internal Capture Header (Hidden in app, shown in export) */}
                      <div className="hidden export-only p-8 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                         <div>
                            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Shift Register Export</h1>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Institutional Accountability Ledger</p>
                         </div>
                         <div className="text-right">
                            <p className="text-[14px] font-black text-indigo-600 uppercase">{displayDate}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                               {shift?.name} ({shift?.startTime} - {shift?.endTime})
                            </p>
                         </div>
                      </div>

                      <div className="divide-y divide-slate-50">
                        {item.records.map((rec, idx) => {
                          const employee = resolveStaffIdentity(rec.employeeId);
                          const displayName = (employee?.name && employee.name !== rec.employeeId) 
                            ? employee.name 
                            : (rec.employeeId === 'UNKNOWN' ? 'System Personnel' : rec.employeeId);
                          const displayDept = employee?.department || 'Operations';

                          return (
                            <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-4 px-8 py-4 items-center">
                               <div className="col-span-1 md:col-span-6">
                                  <div className="flex items-center space-x-4">
                                     <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 font-black text-[10px] border border-slate-100 shadow-inner">
                                        {displayName.charAt(0)}
                                     </div>
                                     <div className="flex flex-col min-w-0">
                                        <div className="flex items-center space-x-2">
                                          <span className="text-[11px] font-black uppercase text-slate-800 truncate">{displayName}</span>
                                          <span className="text-[8px] font-bold text-slate-400 opacity-60">| {displayDept}</span>
                                        </div>
                                        {rec.comment && (
                                          <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                                             <MessageSquare size={8} />
                                             {rec.comment}
                                          </span>
                                        )}
                                        <span className="text-[8px] font-medium text-slate-400 uppercase tracking-widest opacity-30 mt-0.5">Trace Ref: {rec.employeeId}</span>
                                     </div>
                                  </div>
                               </div>
                               <div className="col-span-1 md:col-span-3 text-center">
                                  <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-lg border tracking-widest ${rec.status === 'Present' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                     {rec.status}
                                  </span>
                               </div>
                               <div className="col-span-1 md:col-span-3 text-right">
                                  <div className="flex flex-col items-end">
                                     <span className="text-[10px] font-medium text-slate-950 tabular-nums">{(rec.hoursWorked !== undefined ? rec.hoursWorked : (rec.status === 'Present' ? 8 + rec.overtimeHours : 0)).toFixed(1)}H Logged</span>
                                     {rec.overtimeHours > 0 && <span className="text-[7px] font-black text-indigo-500 uppercase">+{rec.overtimeHours.toFixed(1)}H OT</span>}
                                     {rec.isApproved ? (
                                       <span className="text-[7px] font-bold text-emerald-600 bg-emerald-50/50 border border-emerald-100 px-1 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 mt-1 font-sans">
                                          <ShieldCheck size={8} className="shrink-0" /> Approved
                                       </span>
                                     ) : (
                                        <span className="text-[7px] font-bold text-amber-600 bg-amber-50/50 border border-amber-100 px-1 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 mt-1 font-sans">
                                           <Clock size={8} className="shrink-0" /> Pending Review
                                        </span>
                                     )}
                                  </div>
                               </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* External Capture Footer */}
                      <div className="hidden export-only px-8 py-4 bg-slate-900 text-white flex items-center justify-between">
                         <div className="flex items-center space-x-2">
                            <ShieldCheck size={12} className="text-emerald-400" />
                            <span className="text-[7px] font-black uppercase tracking-[0.2em]">Verified Startech Hub Archive Record</span>
                         </div>
                         <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Printed on {new Date().toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        #root .export-only { display: none; }
        [id^="register-capture-"] .export-only { display: flex !important; }
      ` }} />
    </div>
  );
};

export default HistoryPage;
