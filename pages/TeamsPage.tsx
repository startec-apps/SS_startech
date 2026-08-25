import React, { useState, useMemo } from 'react';
import { 
  UserCog, 
  UserPlus, 
  Edit2, 
  UserMinus, 
  ShieldCheck, 
  UserCheck, 
  Sun, 
  Moon, 
  ChevronDown, 
  Calendar, 
  Clock, 
  Check, 
  Plus, 
  X, 
  Users, 
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { Team, Shift, Employee, ShiftType } from '../types';
import Card from '../components/Card';

const TeamsPage: React.FC<{ 
  teams: Team[]; 
  shifts: Shift[]; 
  sections: string[];
  onMoveMember: (employeeId: string, targetTeamId: string) => void;
  onAddMember: (member: Partial<Employee>) => void;
  onUpdateMember: (member: Partial<Employee>) => void;
  onDeleteMember: (employeeId: string) => void;
  hasPermission: (module: string, action?: any, subHub?: string) => boolean;
}> = ({ 
  teams = [], 
  shifts = [], 
  sections = [], 
  onMoveMember, 
  onAddMember, 
  onUpdateMember, 
  onDeleteMember, 
  hasPermission 
}) => {
  const [isManageMode, setIsManageMode] = useState(false);
  const [addingToTeamId, setAddingToTeamId] = useState<string | null>(null);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  
  // Custom created teams and shifts (saved locally in state)
  const [localShifts, setLocalShifts] = useState<Shift[]>([]);
  const [localTeams, setLocalTeams] = useState<Team[]>([]);
  const [localMemberOverrides, setLocalMemberOverrides] = useState<Record<string, { teamId: string; teamName: string }>>({});

  // Form states for creating custom Shift & Group
  const [showShiftCreator, setShowShiftCreator] = useState(false);
  const [customShiftName, setCustomShiftName] = useState('');
  const [customShiftType, setCustomShiftType] = useState<ShiftType>(ShiftType.DAY);
  const [customShiftStart, setCustomShiftStart] = useState('07:30');
  const [customShiftEnd, setCustomShiftEnd] = useState('16:30');

  // Form states for Direct Enroll
  const [enrollFirstName, setEnrollFirstName] = useState('');
  const [enrollLastName, setEnrollLastName] = useState('');
  const [enrollRole, setEnrollRole] = useState<Employee['role']>('Staff');
  const [enrollDept, setEnrollDept] = useState('Operators');

  // Form states for inline editing/update
  const [editRole, setEditRole] = useState<Employee['role']>('Staff');
  const [editDept, setEditDept] = useState('');

  // Off-period planning states
  const [planningOffMemberId, setPlanningOffMemberId] = useState<string | null>(null);
  const [tempOffStart, setTempOffStart] = useState('');
  const [tempOffEnd, setTempOffEnd] = useState('');
  const [tempOffType, setTempOffType] = useState('');

  const canUpdate = hasPermission('shifts', 'update', 'teams');
  const canCreate = hasPermission('shifts', 'create', 'teams');
  const canDelete = hasPermission('shifts', 'delete', 'teams');

  // Match attendance standard normalized departments
  const getNormalizedDepartment = (emp: Employee): string => {
    const dept = (emp.department || '').toLowerCase().trim();
    if (dept.includes('hr') || dept.includes('admin') || dept.includes('management') || dept.includes('compliance') || dept.includes('hse')) {
      return 'HR Team';
    }
    if (dept.includes('tech') || dept.includes('workshop')) {
      return 'Technical Team';
    }
    return 'Operators';
  };

  // Extract all unique master employees across initial teams
  const allMasterEmployees = useMemo(() => {
    const map = new Map<string, Employee>();
    teams.forEach(t => {
      t.members.forEach(m => {
        map.set(m.id, m);
      });
    });
    return Array.from(map.values());
  }, [teams]);

  // Combine original list with custom local lists
  const combinedShifts = useMemo(() => [...shifts, ...localShifts], [shifts, localShifts]);
  const combinedTeams = useMemo(() => [...teams, ...localTeams], [teams, localTeams]);

  // Resolve team members including team movement overrides
  const getTeamMembers = (teamId: string, teamName: string): Employee[] => {
    return allMasterEmployees.filter(m => {
      const override = localMemberOverrides[m.id];
      if (override) {
        return override.teamId === teamId;
      }
      return m.teamId === teamId || m.teamName === teamName;
    });
  };

  // Standard departments listed exactly like attendance summary standards
  const standardDepartments = ['Operators', 'Technical Team', 'HR Team'];

  // Handle dynamic allocation of a new Shift/Team
  const handleCreateShiftTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customShiftName.trim()) {
      alert('Please enter a valid Shift/Team name');
      return;
    }

    const uniqueId = `cust-shift-${Date.now()}`;
    const uniqueTeamId = `cust-team-${Date.now()}`;

    const newShift: Shift = {
      id: uniqueId,
      name: customShiftName.trim(),
      type: customShiftType,
      startTime: customShiftStart,
      endTime: customShiftEnd
    };

    const newTeam: Team = {
      id: uniqueTeamId,
      name: customShiftName.trim(),
      supervisorId: '',
      assistantSupervisorId: '',
      members: []
    };

    setLocalShifts(prev => [...prev, newShift]);
    setLocalTeams(prev => [...prev, newTeam]);
    
    // Reset and close form
    setCustomShiftName('');
    setShowShiftCreator(false);
  };

  // Move member with local overrides fallback to handle newly created teams nicely
  const handleRosterMove = (employeeId: string, targetTeamId: string) => {
    const targetTeam = combinedTeams.find(t => t.id === targetTeamId);
    if (!targetTeam) return;

    // Apply local override for immediate smooth rendering
    setLocalMemberOverrides(prev => ({
      ...prev,
      [employeeId]: { teamId: targetTeamId, teamName: targetTeam.name }
    }));

    // Dispatch global store updates
    onMoveMember(employeeId, targetTeamId);
  };

  const handleRemove = (id: string, name: string) => {
    if (!canDelete) return;
    if (confirm(`Remove ${name} from this roster?`)) {
      onDeleteMember(id);
    }
  };

  const startPlanningOff = (member: Employee) => {
    setPlanningOffMemberId(member.id);
    setTempOffStart(member.offPeriodStart || '');
    setTempOffEnd(member.offPeriodEnd || '');
    setTempOffType(member.offPeriodType || '');
  };

  // Helper to promote/demote within department group to ensure clean single supervisors
  const updateSupervisorStatusInDept = (
    newSupervisorId: string, 
    oldSupervisorId: string | null, 
    deptEmployees: Employee[], 
    targetRole: 'Supervisor' | 'Assistant Supervisor'
  ) => {
    // Demote existing supervisor in this group to general staff to maintain professional standards
    if (oldSupervisorId && oldSupervisorId !== newSupervisorId) {
      const oldSpv = deptEmployees.find(m => m.id === oldSupervisorId);
      if (oldSpv) {
        onUpdateMember({ ...oldSpv, role: 'Staff' });
      }
    }

    // Promote new supervisor
    if (newSupervisorId) {
      const newSpv = deptEmployees.find(m => m.id === newSupervisorId);
      if (newSpv) {
        onUpdateMember({ ...newSpv, role: targetRole });
      }
    }
  };

  // Statistics for top info row
  const totalRostered = useMemo(() => allMasterEmployees.length, [allMasterEmployees]);
  const supervisorCount = useMemo(() => {
    return allMasterEmployees.filter(m => 
      m.role === 'Supervisor' || 
      m.role === 'Workshop Supervisor' || 
      m.role === 'Stores Supervisor' || 
      m.role === 'Loading Supervisor' ||
      m.role === 'Assistant Supervisor'
    ).length;
  }, [allMasterEmployees]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-full font-sans">
      {/* Top Professional Stats Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mx-1">
        <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm">
          <span className="text-[7px] font-black uppercase text-indigo-400 tracking-widest block">Operational Shifts</span>
          <span className="text-lg font-black text-slate-900 mt-1 block">{combinedShifts.length} Active Colors</span>
        </div>
        <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm">
          <span className="text-[7px] font-black uppercase text-indigo-400 tracking-widest block">Total Staffed Roll</span>
          <span className="text-lg font-black text-slate-900 mt-1 block">{totalRostered} Personnel</span>
        </div>
        <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm">
          <span className="text-[7px] font-black uppercase text-indigo-400 tracking-widest block">Department Leads</span>
          <span className="text-lg font-black text-slate-900 mt-1 block">{supervisorCount} Active SPVs</span>
        </div>
        <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm bg-gradient-to-br from-indigo-50/20 to-transparent">
          <span className="text-[7px] font-black uppercase text-indigo-600 tracking-widest block">Att. Classification</span>
          <span className="text-lg font-black text-indigo-900 mt-1 block">3 Main Groups</span>
        </div>
      </div>

      {/* Main Page Header & Actions Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm mx-1">
        <div className="min-w-0">
          <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">Roster Alignment & Shift Planner</h2>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
            Departmental groups, supervisor allocations, and flexible custom shifts
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {canCreate && (
            <button
              onClick={() => setShowShiftCreator(!showShiftCreator)}
              className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black uppercase text-[8.5px] tracking-widest transition-all border border-indigo-100 shadow-sm cursor-pointer"
            >
              <Plus size={14} />
              <span>{showShiftCreator ? 'Close Panel' : 'Create Group / Shift'}</span>
            </button>
          )}

          {canUpdate && (
            <button 
              onClick={() => { 
                setIsManageMode(!isManageMode); 
                setAddingToTeamId(null); 
                setEditingMemberId(null); 
                setPlanningOffMemberId(null);
              }}
              className={`flex-1 md:flex-none flex items-center justify-center space-x-2 px-5 py-2.5 rounded-2xl font-black uppercase text-[8.5px] tracking-widest transition-all border cursor-pointer ${
                isManageMode ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 shadow-sm'
              }`}
            >
              <UserCog size={14} />
              <span>{isManageMode ? 'Done Editing' : 'Customize Roster'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Embedded Shift & Group Creator Screen */}
      {showShiftCreator && (
        <div className="bg-white border border-slate-150 p-5 rounded-3xl mx-1 max-w-3xl shadow-md animate-in slide-in-from-top-3 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">Dynamic Group & Shift Configurator</h3>
              <p className="text-[8px] text-slate-400 font-medium uppercase mt-0.5">Define a customized operational team roster and shift stamps</p>
            </div>
            <button onClick={() => setShowShiftCreator(false)} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleCreateShiftTeamSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Group / Shift Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shift D, Weekend Overtime, Standby Crew"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400 tracking-tight"
                  value={customShiftName}
                  onChange={e => setCustomShiftName(e.target.value)}
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Classification Category</label>
                <select
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-705 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  value={customShiftType}
                  onChange={e => setCustomShiftType(e.target.value as ShiftType)}
                >
                  <option value={ShiftType.DAY}>Day Shift Operations</option>
                  <option value={ShiftType.NIGHT}>Night Shift Operations</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">In Stamp (Start Time)</label>
                <input
                  type="time"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  value={customShiftStart}
                  onChange={e => setCustomShiftStart(e.target.value)}
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Out Stamp (End Time)</label>
                <input
                  type="time"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  value={customShiftEnd}
                  onChange={e => setCustomShiftEnd(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowShiftCreator(false)}
                className="px-4 py-2 text-[9px] font-bold uppercase text-slate-400 hover:text-slate-600 bg-transparent transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-slate-900 hover:bg-slate-950 text-white text-[9px] font-black uppercase tracking-wider rounded-xl shadow-sm transition-all"
              >
                Register Operational Group
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Fully Responsive Shift / Roster Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mx-1">
        {combinedShifts.map((shift) => {
          const team = combinedTeams.find(t => t.id === shift.id || t.name === shift.name);
          if (!team) return null;

          const teamMembers = getTeamMembers(team.id, team.name);
          const totalMembersInTeam = teamMembers.length;

          return (
            <Card 
              key={shift.id} 
              className="p-0 overflow-hidden border border-slate-100 shadow-md rounded-[2rem] bg-white flex flex-col" 
              title="" 
              headerAction={
                <div className="flex flex-col gap-3 p-5 w-full border-b border-slate-100 bg-slate-50/20">
                  <div className="flex items-center justify-between w-full">
                    {/* Shift & Time Details */}
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border ${
                        shift.type === ShiftType.DAY 
                          ? 'bg-amber-50 text-amber-500 border-amber-100' 
                          : 'bg-slate-900 border-slate-900 text-white'
                      }`}>
                        {shift.type === ShiftType.DAY ? <Sun size={18} /> : <Moon size={18} />}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight truncate leading-tight">{shift.name}</h3>
                        <p className="text-[7.5px] font-bold text-slate-400 uppercase tracking-wider mt-1 flex items-center gap-1">
                          <Clock size={10} className="text-slate-300" />
                          <span>{shift.type} • {shift.startTime} - {shift.endTime}</span>
                        </p>
                      </div>
                    </div>

                    {/* Member Counter */}
                    <div className="text-right shrink-0 bg-slate-100/60 border border-slate-200/50 px-3 py-1.5 rounded-xl">
                      <p className="text-sm font-black text-slate-850 leading-none">{totalMembersInTeam}</p>
                      <p className="text-[6.5px] font-black text-slate-400 uppercase mt-0.5 tracking-wider">Staffed</p>
                    </div>
                  </div>

                  {/* Enroll Inline Trigger button */}
                  {isManageMode && canCreate && (
                    <button 
                      onClick={() => {
                        if (addingToTeamId === team.id) {
                          setAddingToTeamId(null);
                        } else {
                          setAddingToTeamId(team.id);
                          setEnrollFirstName('');
                          setEnrollLastName('');
                          setEnrollRole('Staff');
                          setEnrollDept('Operators');
                        }
                      }}
                      className="w-full bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all flex items-center justify-center border border-indigo-100 shadow-sm cursor-pointer"
                    >
                      <UserPlus size={13} className="mr-1.5" /> Direct Enroll to {shift.name}
                    </button>
                  )}
                </div>
              }
            >
              {/* Add New Member Form Panel */}
              {addingToTeamId === team.id && (
                <div className="p-4 bg-indigo-50/20 border-b border-indigo-50/60 font-sans space-y-3 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between pb-1.5 border-b border-indigo-100/30">
                    <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest">Enrolling New Personnel</span>
                    <button onClick={() => setAddingToTeamId(null)} className="text-indigo-400 hover:text-indigo-600">
                      <X size={13} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="text"
                      className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                      placeholder="First Name"
                      value={enrollFirstName}
                      onChange={e => setEnrollFirstName(e.target.value)}
                    />
                    <input 
                      type="text"
                      className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                      placeholder="Last/Surname"
                      value={enrollLastName}
                      onChange={e => setEnrollLastName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[6.5px] font-bold text-slate-400 uppercase block mb-1">Role Designation</span>
                      <select
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-700 outline-none cursor-pointer"
                        value={enrollRole}
                        onChange={e => setEnrollRole(e.target.value as any)}
                      >
                        <option value="Staff">Regular Staff</option>
                        <option value="Supervisor">Supervisor</option>
                        <option value="Assistant Supervisor">Assistant Supervisor</option>
                        <option value="Workshop Supervisor">Workshop Supervisor</option>
                        <option value="Stores Supervisor">Stores Supervisor</option>
                        <option value="Safety Manager">Safety Manager</option>
                        <option value="HR">HR Officer</option>
                        <option value="Member">General Member</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-[6.5px] font-bold text-slate-400 uppercase block mb-1">Department Aligned</span>
                      <select
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-700 outline-none cursor-pointer"
                        value={enrollDept}
                        onChange={e => setEnrollDept(e.target.value)}
                      >
                        <option value="Operators">Operators</option>
                        <option value="Technical Team">Technical Team</option>
                        <option value="HR Team">HR Team</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-1.5 pt-2 border-t border-indigo-100/20">
                    <button
                      type="button"
                      onClick={() => setAddingToTeamId(null)}
                      className="px-2.5 py-1 text-[8px] font-bold text-slate-400 uppercase"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const finalName = `${enrollFirstName.trim()} ${enrollLastName.trim()}`.trim();
                        if (!finalName) {
                          alert('Please enter a valid name.');
                          return;
                        }
                        onAddMember({
                          name: finalName,
                          role: enrollRole,
                          department: enrollDept,
                          teamId: team.id,
                          teamName: shift.name
                        });
                        setAddingToTeamId(null);
                      }}
                      className="px-3.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[8px] font-black uppercase tracking-wider"
                    >
                      Save Enrollment
                    </button>
                  </div>
                </div>
              )}

              {/* Roster lists organized exactly by Attendance Register standardized departments */}
              <div className="divide-y divide-slate-100 overflow-hidden">
                {standardDepartments.map((dept) => {
                  const deptMembers = teamMembers.filter(m => getNormalizedDepartment(m) === dept);

                  // Extract designated primary & assistant supervisors specifically for this department group
                  const primarySpv = deptMembers.find(m => 
                    m.role === 'Supervisor' || 
                    m.role === 'Workshop Supervisor' || 
                    m.role === 'Stores Supervisor' || 
                    m.role === 'Loading Supervisor' ||
                    m.role.toLowerCase() === 'supervisor'
                  );

                  const assistantSpv = deptMembers.find(m => 
                    m.role === 'Assistant Supervisor' || 
                    m.role.toLowerCase() === 'assistant supervisor'
                  );

                  return (
                    <div key={dept} className="flex flex-col p-0.5">
                      
                      {/* Department Heading Banner with Quick Supervisors Designations */}
                      <div className="bg-slate-50 border-y border-slate-100/50 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-3.5 bg-indigo-600 rounded-sm shrink-0"></span>
                          <h4 className="text-[9px] font-black text-slate-800 uppercase tracking-widest">{dept} Group</h4>
                        </div>

                        {/* Visual Display / Selector of Supervisors */}
                        <div className="flex flex-wrap items-center gap-2">
                          {isManageMode ? (
                            <div className="flex items-center gap-1.5 scale-95 origin-right">
                              {/* Set Primary Supervisor Dropdown */}
                              <div className="flex items-center">
                                <span className="text-[6.5px] text-slate-400 font-bold uppercase mr-1">SPV:</span>
                                <select
                                  className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[7.5px] font-bold text-slate-650 tracking-tight"
                                  value={primarySpv?.id || ''}
                                  onChange={e => updateSupervisorStatusInDept(e.target.value, primarySpv?.id || null, deptMembers, 'Supervisor')}
                                >
                                  <option value="">No Lead...</option>
                                  {deptMembers.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Set Assistant Supervisor Dropdown */}
                              <div className="flex items-center">
                                <span className="text-[6.5px] text-slate-400 font-bold uppercase mr-1">AST:</span>
                                <select
                                  className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[7.5px] font-bold text-slate-650 tracking-tight"
                                  value={assistantSpv?.id || ''}
                                  onChange={e => updateSupervisorStatusInDept(e.target.value, assistantSpv?.id || null, deptMembers, 'Assistant Supervisor')}
                                >
                                  <option value="">No Assistant...</option>
                                  {deptMembers.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              {/* Visual Badges for Supervisors */}
                              {primarySpv ? (
                                <div className="flex items-center bg-amber-50 text-amber-800 border border-amber-250/60 px-2.5 py-0.5 rounded-full text-[7.5px] font-black uppercase tracking-wider">
                                  <ShieldCheck size={9} className="mr-1 text-amber-500 shrink-0" />
                                  <span>SPV: {primarySpv.name}</span>
                                </div>
                              ) : null}

                              {assistantSpv ? (
                                <div className="flex items-center bg-slate-50 text-slate-700 border border-slate-200/50 px-2.5 py-0.5 rounded-full text-[7.5px] font-bold uppercase tracking-wide">
                                  <UserCheck size={9} className="mr-1 text-indigo-400 shrink-0" />
                                  <span>AST: {assistantSpv.name}</span>
                                </div>
                              ) : null}

                              {!primarySpv && !assistantSpv ? (
                                <span className="text-[7.5px] text-slate-400 font-bold italic">No Assigned Leads</span>
                              ) : null}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Display Members of Department */}
                      <div className="divide-y divide-slate-50 bg-white">
                        {deptMembers.length === 0 ? (
                          <div className="p-4 text-center">
                            <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest block">No staff registered under {dept}</span>
                          </div>
                        ) : (
                          deptMembers.map(member => {
                            const isSupervisor = member.id === primarySpv?.id;
                            const isAssistant = member.id === assistantSpv?.id;

                            return (
                              <div key={member.id} className="group hover:bg-slate-50/20 transition-all duration-155">
                                {editingMemberId === member.id ? (
                                  /* Inline Member Editor */
                                  <div className="p-4 bg-slate-50 border-y border-slate-150 space-y-3 font-sans">
                                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-150">
                                      <span className="text-[8.5px] font-black text-slate-700 uppercase">Updating Roster Record</span>
                                      <button onClick={() => setEditingMemberId(null)} className="text-slate-400 hover:text-slate-600">
                                        <X size={14} />
                                      </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <span className="text-[6.5px] text-slate-400 font-black uppercase block mb-1">Set Staff Role</span>
                                        <select
                                          className="w-full bg-white border border-slate-250 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-705 outline-none"
                                          value={editRole}
                                          onChange={e => setEditRole(e.target.value as any)}
                                        >
                                          <option value="Staff">Regular Staff</option>
                                          <option value="Supervisor">Supervisor</option>
                                          <option value="Assistant Supervisor">Assistant Supervisor</option>
                                          <option value="Workshop Supervisor">Workshop Supervisor</option>
                                          <option value="Stores Supervisor">Stores Supervisor</option>
                                          <option value="Safety Manager">Safety Manager</option>
                                          <option value="HR">HR Officer</option>
                                          <option value="Member">General Member</option>
                                        </select>
                                      </div>

                                      <div>
                                        <span className="text-[6.5px] text-slate-400 font-black uppercase block mb-1">Set Department</span>
                                        <select
                                          className="w-full bg-white border border-slate-250 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-750 outline-none"
                                          value={editDept}
                                          onChange={e => setEditDept(e.target.value)}
                                        >
                                          <option value="Operators">Operators</option>
                                          <option value="Technical Team">Technical Team</option>
                                          <option value="HR Team">HR Team</option>
                                        </select>
                                      </div>
                                    </div>

                                    <div className="flex justify-end gap-1 border-t border-slate-150 pt-2">
                                      <button
                                        type="button"
                                        onClick={() => setEditingMemberId(null)}
                                        className="px-2.5 py-1 text-[8px] font-bold text-slate-400"
                                      >
                                        Dismiss
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          onUpdateMember({
                                            ...member,
                                            role: editRole,
                                            department: editDept
                                          });
                                          setEditingMemberId(null);
                                        }}
                                        className="px-3.5 py-1 bg-indigo-650 hover:bg-indigo-700 text-white rounded text-[8px] font-black uppercase tracking-wider"
                                      >
                                        Apply Config
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  /* Standard Member List Row */
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 gap-2.5">
                                    <div className="flex items-center space-x-3 min-w-0">
                                      {/* Initials Badge */}
                                      <div className={`w-9 h-9 border rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-sm transition-transform group-hover:scale-105 ${
                                        isSupervisor
                                          ? 'bg-amber-50 border-amber-200 text-amber-600'
                                          : isAssistant
                                          ? 'bg-slate-50 border-slate-200 text-slate-600'
                                          : 'bg-indigo-50/50 border-indigo-100 text-indigo-650'
                                      }`}>
                                        {member.name.charAt(0).toUpperCase()}
                                      </div>

                                      <div className="flex flex-col min-w-0">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                          <span className="text-xs font-bold text-slate-900 truncate leading-tight tracking-tight">{member.name}</span>
                                          {isSupervisor && (
                                            <span className="text-[6.5px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 px-1 py-0.2 rounded">
                                              SPV Lead
                                            </span>
                                          )}
                                          {isAssistant && (
                                            <span className="text-[6.5px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 px-1 py-0.2 rounded">
                                              AST Lead
                                            </span>
                                          )}
                                          {!isSupervisor && !isAssistant && member.role !== 'Staff' && (
                                            <span className="text-[6.5px] font-extrabold uppercase bg-indigo-50 text-indigo-600 border border-indigo-100/30 px-1 py-0.2 rounded">
                                              {member.role}
                                            </span>
                                          )}
                                        </div>

                                        <div className="flex items-center gap-1.5 mt-1">
                                          <span className="text-[7px] text-slate-350 font-mono tracking-tight uppercase leading-none">{member.id}</span>
                                          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                          <span className="text-[7px] text-slate-400 capitalize">{dept} Division</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Action Row */}
                                    <div className="flex items-center space-x-1.5 ml-12 sm:ml-0 shrink-0">
                                      {canUpdate && (
                                        <button
                                          onClick={() => startPlanningOff(member)}
                                          title="Configure Off-Period Range"
                                          className={`p-2 rounded-lg border transition-all ${
                                            member.offPeriodStart && member.offPeriodEnd
                                              ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-600'
                                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-400'
                                          }`}
                                        >
                                          <Calendar size={11} />
                                        </button>
                                      )}

                                      {isManageMode && (
                                        <div className="flex items-center gap-1">
                                          {/* Move Dropdown picker */}
                                          <div className="relative">
                                            <select
                                              className="text-[7.5px] font-bold uppercase bg-white border border-slate-200 rounded-lg pl-2 pr-6 py-1.5 appearance-none text-indigo-700 w-24 shadow-sm cursor-pointer outline-none"
                                              value={team.id}
                                              onChange={(e) => handleRosterMove(member.id, e.target.value)}
                                              disabled={!canUpdate}
                                            >
                                              {combinedTeams.map(t => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                              ))}
                                            </select>
                                            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={9} />
                                          </div>

                                          <button
                                            onClick={() => {
                                              setEditRole(member.role);
                                              setEditDept(member.department || dept);
                                              setEditingMemberId(member.id);
                                            }}
                                            className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                                            title="Edit Role & Division"
                                          >
                                            <Edit2 size={11} />
                                          </button>

                                          <button
                                            onClick={() => handleRemove(member.id, member.name)}
                                            className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                                            title="Remove from roster"
                                          >
                                            <UserMinus size={11} />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Under-Card Planned Off Period Banner */}
                                {member.offPeriodStart && member.offPeriodEnd && (
                                  <div className="px-4 pb-3.5 pl-14 animate-in slide-in-from-left-2 duration-200">
                                    {(() => {
                                      const todayStr = new Date().toISOString().split('T')[0];
                                      const isActive = todayStr >= member.offPeriodStart && todayStr <= member.offPeriodEnd;
                                      return (
                                        <div className={`p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-1 shadow-sm ${
                                          isActive 
                                            ? 'bg-amber-50 border-amber-200/50 text-amber-800 animate-pulse' 
                                            : 'bg-indigo-50/20 border-indigo-100/40 text-indigo-800'
                                        }`}>
                                          <span className="text-[8.5px] font-black uppercase tracking-tight flex items-center gap-1">
                                            <span>{isActive ? '🌴 Current Status: ON LEAVE' : '🗓️ Planned Off-Duty Rest'}</span>
                                          </span>
                                          <span className="text-[8px] font-bold">
                                            {member.offPeriodType || 'Off-Duty'}: <span className="font-extrabold">{member.offPeriodStart}</span> to <span className="font-extrabold">{member.offPeriodEnd}</span>
                                          </span>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                )}

                                {/* Interactive Leave Overrides Configurator Panel */}
                                {planningOffMemberId === member.id && (
                                  <div className="mx-4 mb-4 ml-14 p-3.5 bg-indigo-50/40 rounded-xl border border-indigo-100/70 space-y-2.5 animate-in slide-in-from-top-1 duration-150">
                                    <div className="flex items-center justify-between pb-1 border-b border-indigo-100/10">
                                      <span className="text-[8.5px] font-black text-indigo-950 uppercase tracking-wider">Leave & Off-Duty Planner</span>
                                      <button 
                                        onClick={() => {
                                          if (confirm("Clear this personnel's planned leave schedule?")) {
                                            onUpdateMember({
                                              ...member,
                                              offPeriodStart: '',
                                              offPeriodEnd: '',
                                              offPeriodType: ''
                                            });
                                            setPlanningOffMemberId(null);
                                          }
                                        }}
                                        className="text-[7.5px] font-bold text-rose-500 hover:underline uppercase"
                                      >
                                        Clear Schedule
                                      </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                      <div>
                                        <span className="text-[6.5px] font-bold text-slate-450 uppercase block mb-1">Start Date</span>
                                        <input 
                                          type="date"
                                          className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[9px] font-bold text-slate-700 outline-none"
                                          value={tempOffStart}
                                          onChange={e => setTempOffStart(e.target.value)}
                                        />
                                      </div>
                                      <div>
                                        <span className="text-[6.5px] font-bold text-slate-450 uppercase block mb-1">End Date</span>
                                        <input 
                                          type="date"
                                          className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[9px] font-bold text-slate-700 outline-none"
                                          value={tempOffEnd}
                                          onChange={e => setTempOffEnd(e.target.value)}
                                        />
                                      </div>
                                      <div>
                                        <span className="text-[6.5px] font-bold text-slate-455 uppercase block mb-1">Classification</span>
                                        <select
                                          className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[9px] font-bold text-slate-700 outline-none cursor-pointer"
                                          value={tempOffType}
                                          onChange={e => setTempOffType(e.target.value)}
                                        >
                                          <option value="">Choose Category...</option>
                                          <option value="Annual Leave">Annual Leave</option>
                                          <option value="Sick Leave">Sick Leave</option>
                                          <option value="Rest Day / Off">Rest Day / Off</option>
                                          <option value="Emergency Leave">Emergency Leave</option>
                                          <option value="Other">Other</option>
                                        </select>
                                      </div>
                                    </div>

                                    <div className="flex justify-end gap-1 pt-1.5 border-t border-indigo-100/10">
                                      <button 
                                        onClick={() => setPlanningOffMemberId(null)}
                                        className="px-2 py-1 text-[8px] font-bold text-slate-400"
                                      >
                                        Discard
                                      </button>
                                      <button 
                                        onClick={() => {
                                          onUpdateMember({
                                            ...member,
                                            offPeriodStart: tempOffStart,
                                            offPeriodEnd: tempOffEnd,
                                            offPeriodType: tempOffType
                                          });
                                          setPlanningOffMemberId(null);
                                        }}
                                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[8px] font-black uppercase tracking-wider"
                                      >
                                        Save Plan
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default TeamsPage;
