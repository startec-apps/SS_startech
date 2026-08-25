import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  CheckCircle2, 
  Sun, 
  Moon, 
  AlertCircle, 
  Clock, 
  Activity, 
  Wrench, 
  ShieldAlert, 
  RefreshCw, 
  Calendar,
  PlaneTakeoff,
  PlaneLanding,
  Phone,
  MapPin,
  ShieldCheck,
  ArrowRight,
  UserCheck,
  UserX,
  Radio
} from 'lucide-react';
import { 
  Team, 
  Shift, 
  AttendanceRecord, 
  ShiftType, 
  ToolAsset, 
  ToolUsageRecord, 
  MaintenanceRecord,
  Employee 
} from '../types';
import { 
  fetchNightShiftsFromGoogleSheets, 
  fetchWeekendStandbyFromGoogleSheets, 
  fetchTeamOffSchedulesFromGoogleSheets 
} from '../services/googleSheets';

interface DashboardProps {
  teams: Team[];
  shifts: Shift[];
  history: AttendanceRecord[];
  masterEmployees?: Employee[];
  tools?: ToolAsset[];
  usageLogs?: ToolUsageRecord[];
  maintenanceRecords?: MaintenanceRecord[];
}

interface NightShiftItem {
  id: string;
  empId: string;
  empName: string;
  department: string;
  role: string;
  shiftHours: string;
  location: string;
  contactNumber: string;
  status: 'Active Duty' | 'Standby' | 'Off Shift';
  notes?: string;
}

interface WeekendStandbyItem {
  id: string;
  weekendDates: string;
  leadEmpId: string;
  leadEmpName: string;
  backupEmpId?: string;
  backupEmpName?: string;
  department: string;
  roleType: string;
  contactNumber: string;
  coverageArea: string;
  status: string;
  notes?: string;
}

interface TeamOffItem {
  id: string;
  teamName: string;
  members: string[];
  leaveMineCampDate: string;
  arrivalZambiaDate: string;
  departZambiaDate: string;
  returnMineCampDate: string;
  notes?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  teams, 
  shifts, 
  history, 
  masterEmployees = [],
  tools = [], 
  usageLogs = [], 
  maintenanceRecords = [] 
}) => {
  const [nightShifts, setNightShifts] = useState<NightShiftItem[]>([]);
  const [standbyList, setStandbyList] = useState<WeekendStandbyItem[]>([]);
  const [teamOffSchedules, setTeamOffSchedules] = useState<TeamOffItem[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );

  // Load live Google Sheets / Cached Roster Data
  const loadRosters = () => {
    setIsLoadingSchedules(true);
    Promise.all([
      fetchNightShiftsFromGoogleSheets().catch(() => []),
      fetchWeekendStandbyFromGoogleSheets().catch(() => []),
      fetchTeamOffSchedulesFromGoogleSheets().catch(() => [])
    ]).then(([nsData, sbData, toData]) => {
      if (nsData && nsData.length > 0) setNightShifts(nsData);
      if (sbData && sbData.length > 0) setStandbyList(sbData);
      if (toData && toData.length > 0) setTeamOffSchedules(toData);
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setIsLoadingSchedules(false);
    }).catch(() => {
      setIsLoadingSchedules(false);
    });
  };

  useEffect(() => {
    loadRosters();
  }, []);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }, []);

  // Total active workforce calculation
  const allStaff = useMemo(() => {
    if (masterEmployees && masterEmployees.length > 0) return masterEmployees;
    const list: Employee[] = [];
    teams.forEach(t => {
      (t.members || []).forEach(m => {
        if (!list.some(e => e.id === m.id)) list.push(m);
      });
    });
    return list;
  }, [masterEmployees, teams]);

  const totalEmployees = allStaff.length;

  // Attendance metrics for today
  const presentTodayRecords = useMemo(() => {
    return history.filter(h => {
      const hDate = (h.date || '').split('T')[0];
      return hDate === todayStr && h.status === 'Present';
    });
  }, [history, todayStr]);

  const presentTodayCount = presentTodayRecords.length;
  const attendanceRate = totalEmployees > 0 ? Math.round((presentTodayCount / totalEmployees) * 100) : 0;

  // Asset health metrics
  const assetStats = useMemo(() => {
    const totalValue = tools.reduce((acc, t) => acc + (t.monetaryValue * t.quantity), 0);
    const criticalCount = tools.filter(t => t.condition === 'Damaged' || t.condition === 'Lost').length;
    const inUseCount = tools.reduce((acc, t) => acc + Math.max(0, t.quantity - t.available), 0);
    return { totalValue, criticalCount, inUseCount };
  }, [tools]);

  // Active current shift cycle
  const activeShift = useMemo(() => {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    
    return shifts.find(s => {
      if (!s.startTime || !s.endTime) return false;
      const [sh, sm] = s.startTime.split(':').map(Number);
      const [eh, em] = s.endTime.split(':').map(Number);
      const start = sh * 60 + sm;
      const end = eh * 60 + em;
      return start < end ? (currentMins >= start && currentMins < end) : (currentMins >= start || currentMins < end);
    });
  }, [shifts]);

  // Night shift personnel: Current on duty & Incoming rotation
  const nightShiftData = useMemo(() => {
    const activeDuty = nightShifts.filter(n => n.status === 'Active Duty');
    const standbyOrIncoming = nightShifts.filter(n => n.status === 'Standby' || n.status === 'Off Shift');

    // Fallback: if no custom night shift row exists yet, pull night shift members from shifts/teams
    if (activeDuty.length === 0 && standbyOrIncoming.length === 0) {
      const nightTeam = teams.find(t => {
        const tShift = shifts.find(s => s.id === t.shiftId);
        return tShift?.type === ShiftType.NIGHT || t.name.toLowerCase().includes('night');
      });
      if (nightTeam && nightTeam.members.length > 0) {
        const tShift = shifts.find(s => s.id === nightTeam.shiftId);
        const shiftHoursStr = tShift && tShift.startTime && tShift.endTime ? `${tShift.startTime} - ${tShift.endTime}` : '';
        return {
          current: nightTeam.members.map((m, idx) => ({
            id: `NS-DEF-${idx}`,
            empId: m.id,
            empName: m.name,
            department: m.department || 'Technical Team',
            role: m.role || 'Technician',
            shiftHours: shiftHoursStr,
            location: 'Main Site / Pit Node',
            contactNumber: m.phone || '---',
            status: 'Active Duty' as const
          })),
          incoming: []
        };
      }
    }

    return {
      current: activeDuty.length > 0 ? activeDuty : (nightShifts.slice(0, 1) || []),
      incoming: standbyOrIncoming.length > 0 ? standbyOrIncoming : (nightShifts.slice(1, 3) || [])
    };
  }, [nightShifts, teams, shifts]);

  // Weekend Standby personnel: This weekend & Next weekend
  const weekendStandbyData = useMemo(() => {
    if (standbyList.length === 0) {
      return {
        current: null,
        upcoming: null
      };
    }

    const activeItem = standbyList.find(s => s.status === 'On Call' || s.status === 'Active Response') || standbyList[0];
    const nextItem = standbyList.find(s => s.id !== activeItem?.id) || null;

    return {
      current: activeItem || null,
      upcoming: nextItem || null
    };
  }, [standbyList]);

  // Leave & Off-Period Calculations (Currently Off, Departing Soon, Returning Soon)
  const leaveData = useMemo(() => {
    const today = todayStr;
    const currentlyOnLeave: { name: string; type: string; returnDate: string; duration?: string; source: string }[] = [];
    const goingOnLeaveSoon: { name: string; type: string; startDate: string; returnDate: string }[] = [];
    const returningSoon: { name: string; returnDate: string; daysLeft: number }[] = [];

    // 1. Check individual employee leave overrides
    allStaff.forEach(emp => {
      if (emp.offPeriodStart && emp.offPeriodEnd) {
        const start = emp.offPeriodStart;
        const returnD = emp.offPeriodReturnDate || emp.offPeriodEnd;

        if (today >= start && today <= returnD) {
          currentlyOnLeave.push({
            name: emp.name,
            type: emp.offPeriodType || 'Annual Leave',
            returnDate: returnD,
            source: 'Individual'
          });

          const diffDays = Math.ceil((new Date(returnD).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays <= 4) {
            returningSoon.push({
              name: emp.name,
              returnDate: returnD,
              daysLeft: diffDays
            });
          }
        } else if (start > today) {
          const diffStart = Math.ceil((new Date(start).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
          if (diffStart <= 14) {
            goingOnLeaveSoon.push({
              name: emp.name,
              type: emp.offPeriodType || 'Annual Leave',
              startDate: start,
              returnDate: returnD
            });
          }
        }
      }
    });

    // 2. Check team off schedules
    teamOffSchedules.forEach(sched => {
      const leaveDate = sched.leaveMineCampDate;
      const returnDate = sched.returnMineCampDate;

      if (leaveDate && returnDate) {
        if (today >= leaveDate && today <= returnDate) {
          (sched.members || []).forEach(m => {
            if (!currentlyOnLeave.some(l => l.name.toLowerCase() === m.toLowerCase())) {
              currentlyOnLeave.push({
                name: m,
                type: 'Zambia Rest Off',
                returnDate: returnDate,
                source: sched.teamName || 'Team Off'
              });
            }
          });

          const diffDays = Math.ceil((new Date(returnDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays <= 5) {
            (sched.members || []).forEach(m => {
              if (!returningSoon.some(r => r.name.toLowerCase() === m.toLowerCase())) {
                returningSoon.push({
                  name: m,
                  returnDate: returnDate,
                  daysLeft: diffDays
                });
              }
            });
          }
        } else if (leaveDate > today) {
          const diffStart = Math.ceil((new Date(leaveDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
          if (diffStart <= 14) {
            (sched.members || []).forEach(m => {
              if (!goingOnLeaveSoon.some(g => g.name.toLowerCase() === m.toLowerCase())) {
                goingOnLeaveSoon.push({
                  name: m,
                  type: 'Travel to Zambia',
                  startDate: leaveDate,
                  returnDate: returnDate
                });
              }
            });
          }
        }
      }
    });

    return {
      currentlyOnLeave,
      goingOnLeaveSoon,
      returningSoon
    };
  }, [allStaff, teamOffSchedules, todayStr]);

  const formatDateShort = (dateStr: string) => {
    if (!dateStr) return '---';
    try {
      const [y, m, d] = dateStr.split('-');
      if (!y || !m || !d) return dateStr;
      const dObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
      return dObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-4">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-black uppercase tracking-wider text-slate-900 leading-none">
              Operations Dashboard
            </h1>
            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase font-mono">
              {todayFormatted}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5">
            Real-time site presence, active night crew, weekend standby and leave schedules
          </p>
        </div>

        <button 
          onClick={loadRosters}
          disabled={isLoadingSchedules}
          className="flex items-center space-x-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-2.5 py-1.5 rounded-lg shadow-2xs transition-all cursor-pointer text-[9px] font-bold uppercase tracking-wider"
          title="Refresh Rosters"
        >
          <RefreshCw size={11} className={isLoadingSchedules ? "animate-spin text-slate-900" : "text-slate-400"} />
          <span>Sync: {lastSyncTime}</span>
        </button>
      </div>

      {/* 4 Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        
        {/* Total Workforce */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Workforce</p>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-lg font-black text-slate-900 font-mono">{totalEmployees}</span>
              <span className="text-[8.5px] font-bold text-slate-500 uppercase">Personnel</span>
            </div>
            <p className="text-[8px] text-slate-400 mt-0.5">{teams.length} Active Teams</p>
          </div>
          <div className="p-2 bg-slate-50 text-slate-600 rounded-lg border border-slate-100">
            <Users size={15} />
          </div>
        </div>

        {/* Present Today */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Logged Present</p>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-lg font-black text-emerald-700 font-mono">{presentTodayCount}</span>
              <span className="text-[8.5px] font-bold text-emerald-600 uppercase">({attendanceRate}%)</span>
            </div>
            <p className="text-[8px] text-slate-400 mt-0.5">{totalEmployees - presentTodayCount} Off / Unlogged</p>
          </div>
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
            <CheckCircle2 size={15} />
          </div>
        </div>

        {/* Night Shift & Standby */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[9px] font-bold text-slate-700 uppercase tracking-wider">Night & Standby</p>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-lg font-black text-slate-900 font-mono">{nightShiftData.current.length}</span>
              <span className="text-[8.5px] font-bold text-slate-500 uppercase">On Night Duty</span>
            </div>
            <p className="text-[8px] text-slate-500 mt-0.5">
              {weekendStandbyData.current ? `Standby: ${weekendStandbyData.current.leadEmpName}` : 'Standby ready'}
            </p>
          </div>
          <div className="p-2 bg-slate-900 text-white rounded-lg">
            <Moon size={15} />
          </div>
        </div>

        {/* Away on Leave / Off */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[9px] font-bold text-amber-600 uppercase tracking-wider">On Leave / Away</p>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-lg font-black text-amber-700 font-mono">{leaveData.currentlyOnLeave.length}</span>
              <span className="text-[8.5px] font-bold text-amber-600 uppercase">Staff</span>
            </div>
            <p className="text-[8px] text-slate-400 mt-0.5">
              {leaveData.returningSoon.length > 0 ? `${leaveData.returningSoon.length} returning soon` : 'Schedules current'}
            </p>
          </div>
          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
            <PlaneTakeoff size={15} />
          </div>
        </div>

      </div>

      {/* 3 Core Operational Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        
        {/* Panel 1: Night Shift Operations */}
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden flex flex-col justify-between">
          
          <div className="px-3.5 py-2.5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Moon size={13} className="text-slate-300" />
              <h2 className="text-[10px] font-black uppercase tracking-wider text-white">Night Shift</h2>
            </div>
            {nightShiftData.current.length > 0 && (
              <span className="text-[8px] font-bold font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                {nightShiftData.current.length} Active
              </span>
            )}
          </div>

          <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
            
            {/* Active Tonight */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <UserCheck size={10} className="text-emerald-600" />
                  <span>On Duty Tonight</span>
                </span>
                <span className="text-[7.5px] font-bold text-emerald-700 uppercase bg-emerald-50 px-1.5 py-0.5 rounded">
                  Active
                </span>
              </div>

              {nightShiftData.current.length === 0 ? (
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-center text-slate-400 text-[8.5px]">
                  No night shift recorded tonight
                </div>
              ) : (
                <div className="space-y-1.5">
                  {nightShiftData.current.map((item, idx) => (
                    <div key={item.id || idx} className="bg-slate-50 border border-slate-200/70 rounded-lg p-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-slate-900 uppercase truncate">
                          {item.empName}
                        </span>
                        {item.shiftHours && (
                          <span className="text-[8px] font-mono text-slate-500 font-semibold shrink-0">
                            {item.shiftHours}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[8px] text-slate-500 mt-1 gap-2 flex-wrap">
                        <span className="flex items-center gap-1 truncate">
                          <MapPin size={9} className="text-slate-400 shrink-0" />
                          <span className="truncate">{item.location || 'Main Site'}</span>
                        </span>
                        {item.contactNumber && item.contactNumber !== '---' && (
                          <span className="flex items-center gap-1 font-mono text-slate-700 font-semibold shrink-0">
                            <Phone size={9} className="text-slate-400 shrink-0" />
                            <span>{item.contactNumber}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Next Shift Rotation */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <ArrowRight size={10} className="text-slate-500" />
                  <span>Incoming / Next Handover</span>
                </span>
                <span className="text-[7.5px] font-bold text-slate-500 uppercase">Standby</span>
              </div>

              {nightShiftData.incoming.length === 0 ? (
                <p className="text-[8px] text-slate-400 italic">Rotation will follow standard shift cycle</p>
              ) : (
                <div className="space-y-1">
                  {nightShiftData.incoming.slice(0, 2).map((item, idx) => (
                    <div key={item.id || idx} className="bg-slate-50 border border-slate-100 rounded-lg p-1.5 flex items-center justify-between text-[8.5px]">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 uppercase truncate">{item.empName}</p>
                        <p className="text-[7px] text-slate-400 uppercase">{item.department || 'Technical'}</p>
                      </div>
                      <span className="text-[7px] font-bold bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded uppercase font-mono shrink-0">
                        {item.status || 'Next Shift'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Panel 2: Weekend Standby (Saturday & Sunday) */}
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden flex flex-col justify-between">
          
          <div className="px-3.5 py-2.5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck size={13} className="text-slate-300" />
              <h2 className="text-[10px] font-black uppercase tracking-wider text-white">Weekend Standby</h2>
            </div>
            <span className="text-[8px] font-bold font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
              Sat & Sun
            </span>
          </div>

          <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
            
            {/* Current Weekend */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Calendar size={10} className="text-emerald-600" />
                  <span>This Weekend Duty</span>
                </span>
                {weekendStandbyData.current && (
                  <span className="text-[8px] font-mono font-bold text-slate-500">
                    {weekendStandbyData.current.weekendDates}
                  </span>
                )}
              </div>

              {!weekendStandbyData.current ? (
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-center text-slate-400 text-[8.5px]">
                  No weekend standby lead assigned
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200/70 rounded-lg p-2 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-900 uppercase">
                          {weekendStandbyData.current.leadEmpName}
                        </span>
                        <span className="text-[7px] font-black uppercase px-1 py-0.2 bg-emerald-600 text-white rounded">
                          Lead
                        </span>
                      </div>
                      <p className="text-[7.5px] font-bold text-slate-500 uppercase mt-0.5">
                        {weekendStandbyData.current.department || 'Technical Team'}
                      </p>
                    </div>
                    <span className="text-[7.5px] font-bold bg-white border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded uppercase font-mono">
                      {weekendStandbyData.current.status || 'On Call'}
                    </span>
                  </div>

                  {weekendStandbyData.current.backupEmpName && (
                    <div className="bg-white border border-slate-100 rounded px-1.5 py-0.5 flex items-center justify-between text-[7.5px]">
                      <span className="text-slate-400 uppercase font-bold">Secondary Backup:</span>
                      <span className="font-bold text-slate-800 uppercase">{weekendStandbyData.current.backupEmpName}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[8px] text-slate-500 pt-0.5">
                    <span className="flex items-center gap-1 truncate">
                      <MapPin size={9} className="text-slate-400 shrink-0" />
                      <span className="truncate">{weekendStandbyData.current.coverageArea || 'All Site Plants'}</span>
                    </span>
                    {weekendStandbyData.current.contactNumber && (
                      <span className="flex items-center gap-1 font-mono text-slate-700 font-bold shrink-0">
                        <Phone size={9} className="text-slate-400 shrink-0" />
                        <span>{weekendStandbyData.current.contactNumber}</span>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Next Weekend */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <ArrowRight size={10} className="text-slate-500" />
                  <span>Next Weekend Rotation</span>
                </span>
                <span className="text-[7.5px] font-bold text-slate-500 uppercase">Upcoming</span>
              </div>

              {!weekendStandbyData.upcoming ? (
                <p className="text-[8px] text-slate-400 italic">Next standby schedule in review</p>
              ) : (
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-1.5 flex items-center justify-between text-[8.5px]">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 uppercase truncate">{weekendStandbyData.upcoming.leadEmpName}</p>
                    <p className="text-[7px] text-slate-400 uppercase">
                      {weekendStandbyData.upcoming.weekendDates} • {weekendStandbyData.upcoming.department || 'Technical'}
                    </p>
                  </div>
                  <span className="text-[7px] font-bold bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded uppercase font-mono shrink-0">
                    Next Lead
                  </span>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Panel 3: Off-Period & Leave Tracking */}
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden flex flex-col justify-between md:col-span-2 lg:col-span-1">
          
          <div className="px-3.5 py-2.5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <PlaneTakeoff size={13} className="text-slate-300" />
              <h2 className="text-[10px] font-black uppercase tracking-wider text-white">Leave & Off Tracking</h2>
            </div>
            <span className="text-[8px] font-bold font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
              {leaveData.currentlyOnLeave.length} Away
            </span>
          </div>

          <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
            
            {/* Currently Away */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <UserX size={10} className="text-amber-500" />
                  <span>Currently On Leave</span>
                </span>
                <span className="text-[7.5px] font-bold text-amber-700 uppercase bg-amber-50 px-1.5 py-0.5 rounded">
                  {leaveData.currentlyOnLeave.length} Staff
                </span>
              </div>

              {leaveData.currentlyOnLeave.length === 0 ? (
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-center text-slate-400 text-[8.5px]">
                  All staff on regular camp duties
                </div>
              ) : (
                <div className="space-y-1">
                  {leaveData.currentlyOnLeave.slice(0, 2).map((item, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-200/70 rounded-lg p-1.5 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[9.5px] font-bold text-slate-900 uppercase truncate leading-tight">
                          {item.name}
                        </p>
                        <p className="text-[7px] text-slate-400 uppercase mt-0.5 truncate">
                          {item.type}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[7px] text-slate-400 uppercase block">Due Back</span>
                        <span className="text-[8px] font-bold font-mono text-slate-800 uppercase">
                          {formatDateShort(item.returnDate)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {leaveData.currentlyOnLeave.length > 2 && (
                    <p className="text-[7.5px] font-bold text-slate-400 text-center uppercase pt-0.5">
                      + {leaveData.currentlyOnLeave.length - 2} more on off-period
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Departures & Arrivals */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              
              {/* Going on leave */}
              <div className="flex items-center justify-between text-[8px]">
                <span className="font-bold text-slate-400 uppercase flex items-center gap-1">
                  <PlaneTakeoff size={9} className="text-slate-400" />
                  <span>Departing Soon:</span>
                </span>
                {leaveData.goingOnLeaveSoon.length > 0 ? (
                  <span className="font-bold text-slate-800 uppercase">
                    {leaveData.goingOnLeaveSoon[0].name} ({formatDateShort(leaveData.goingOnLeaveSoon[0].startDate)})
                  </span>
                ) : (
                  <span className="text-slate-400 italic">None in 14 days</span>
                )}
              </div>

              {/* Returning soon */}
              <div className="flex items-center justify-between text-[8px]">
                <span className="font-bold text-slate-400 uppercase flex items-center gap-1">
                  <PlaneLanding size={9} className="text-emerald-600" />
                  <span>Returning Soon:</span>
                </span>
                {leaveData.returningSoon.length > 0 ? (
                  <span className="font-bold text-emerald-800 uppercase">
                    {leaveData.returningSoon[0].name} ({formatDateShort(leaveData.returningSoon[0].returnDate)})
                  </span>
                ) : (
                  <span className="text-slate-400 italic">None in 4 days</span>
                )}
              </div>

            </div>

          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
