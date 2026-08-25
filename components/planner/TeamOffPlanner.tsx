import React, { useState, useEffect } from 'react';
import { Calendar, Users, Plus, Trash2, Edit3, MapPin, Search, Filter, Home, X, ArrowUpRight, ArrowDownLeft, Clock, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { Employee, Team } from '../../types';
import { fetchTeamOffSchedulesFromGoogleSheets, syncTeamOffScheduleToGoogleSheets, deleteTeamOffScheduleFromGoogleSheets } from '../../services/googleSheets';

export interface TeamOffSchedule {
  id: string;
  teamName: string;
  members: string[];
  leaveMineCampDate: string;
  arrivalZambiaDate: string;
  departZambiaDate: string;
  returnMineCampDate: string;
  notes?: string;
  status?: 'Upcoming' | 'In Transit' | 'In Zambia' | 'Returning' | 'Completed';
  createdAt: string;
}

interface TeamOffPlannerProps {
  masterEmployees: Employee[];
  teams: Team[];
  isSupervisor: boolean;
}

const INITIAL_SCHEDULES: TeamOffSchedule[] = [];

// Helper to calculate days between two dates
const getDaysBetween = (startStr: string, endStr: string): number => {
  if (!startStr || !endStr) return 0;
  const [y1, m1, d1] = startStr.split('-').map(Number);
  const [y2, m2, d2] = endStr.split('-').map(Number);
  if (!y1 || !m1 || !d1 || !y2 || !m2 || !d2) return 0;
  const start = new Date(y1, m1 - 1, d1);
  const end = new Date(y2, m2 - 1, d2);
  const diffTime = end.getTime() - start.getTime();
  if (diffTime < 0) return 0;
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
};

export const TeamOffPlanner: React.FC<TeamOffPlannerProps> = ({
  masterEmployees = [],
  teams = [],
  isSupervisor
}) => {
  const [schedules, setSchedules] = useState<TeamOffSchedule[]>([]);

  // Sync with Google Sheets on mount
  useEffect(() => {
    fetchTeamOffSchedulesFromGoogleSheets().then((remoteData) => {
      setSchedules(remoteData || []);
    }).catch((err) => {
      console.debug('Google Sheets Team Off load notice:', err);
    });
  }, []);

  useEffect(() => {
    localStorage.setItem('HUB_TEAM_OFF_SCHEDULES', JSON.stringify(schedules));
  }, [schedules]);

  // Filters & State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('All');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedMonth]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<TeamOffSchedule | null>(null);

  // Form State
  const [formSelectedMembers, setFormSelectedMembers] = useState<string[]>([]);
  const [customMemberInput, setCustomMemberInput] = useState('');
  const [formLeaveCamp, setFormLeaveCamp] = useState('');
  const [formArriveZambia, setFormArriveZambia] = useState('');
  const [formDepartZambia, setFormDepartZambia] = useState('');
  const [formReturnCamp, setFormReturnCamp] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Reset Form
  const resetForm = () => {
    setFormSelectedMembers([]);
    setCustomMemberInput('');
    setFormLeaveCamp('');
    setFormArriveZambia('');
    setFormDepartZambia('');
    setFormReturnCamp('');
    setFormNotes('');
    setEditingSchedule(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: TeamOffSchedule) => {
    setEditingSchedule(item);
    setFormSelectedMembers(item.members || []);
    setFormLeaveCamp(item.leaveMineCampDate);
    setFormArriveZambia(item.arrivalZambiaDate);
    setFormDepartZambia(item.departZambiaDate);
    setFormReturnCamp(item.returnMineCampDate);
    setFormNotes(item.notes || '');
    setIsModalOpen(true);
  };

  const handleAddMemberTag = (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !formSelectedMembers.includes(trimmed)) {
      setFormSelectedMembers([...formSelectedMembers, trimmed]);
      setCustomMemberInput('');
    }
  };

  const handleRemoveMemberTag = (name: string) => {
    setFormSelectedMembers(formSelectedMembers.filter(m => m !== name));
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();

    if (formSelectedMembers.length === 0) {
      alert('Please select or add at least one team member.');
      return;
    }
    if (!formLeaveCamp || !formArriveZambia || !formDepartZambia || !formReturnCamp) {
      alert('Please fill in all 4 travel dates (Leave Camp, Arrive Zambia, Depart Zambia, Return Camp).');
      return;
    }

    const derivedTeamName = formSelectedMembers.join(', ');

    if (editingSchedule) {
      const updatedSchedule: TeamOffSchedule = {
        ...editingSchedule,
        teamName: derivedTeamName,
        members: formSelectedMembers,
        leaveMineCampDate: formLeaveCamp,
        arrivalZambiaDate: formArriveZambia,
        departZambiaDate: formDepartZambia,
        returnMineCampDate: formReturnCamp,
        notes: formNotes
      };
      setSchedules(prev => prev.map(s => s.id === editingSchedule.id ? updatedSchedule : s));
      syncTeamOffScheduleToGoogleSheets(updatedSchedule);
    } else {
      const newEntry: TeamOffSchedule = {
        id: `TOS-${String(Date.now()).slice(-4)}`,
        teamName: derivedTeamName,
        members: formSelectedMembers,
        leaveMineCampDate: formLeaveCamp,
        arrivalZambiaDate: formArriveZambia,
        departZambiaDate: formDepartZambia,
        returnMineCampDate: formReturnCamp,
        notes: formNotes,
        createdAt: new Date().toISOString()
      };
      setSchedules([newEntry, ...schedules]);
      syncTeamOffScheduleToGoogleSheets(newEntry);
    }

    setIsModalOpen(false);
    resetForm();
  };

  const handleDeleteSchedule = (id: string) => {
    if (confirm('Are you sure you want to delete this team off-period schedule?')) {
      setSchedules(prev => prev.filter(s => s.id !== id));
      deleteTeamOffScheduleFromGoogleSheets(id);
    }
  };

  // Helper to determine status relative to today
  const getTravelStatus = (sched: TeamOffSchedule) => {
    const today = new Date().toISOString().split('T')[0];
    if (today < sched.leaveMineCampDate) {
      return { label: 'Upcoming Off', color: 'bg-indigo-50 border-indigo-100 text-indigo-700' };
    }
    if (today >= sched.leaveMineCampDate && today < sched.arrivalZambiaDate) {
      return { label: 'Leaving Camp', color: 'bg-amber-50 border-amber-100 text-amber-700' };
    }
    if (today >= sched.arrivalZambiaDate && today <= sched.departZambiaDate) {
      return { label: 'In Zambia (On Off)', color: 'bg-emerald-50 border-emerald-100 text-emerald-700' };
    }
    if (today > sched.departZambiaDate && today <= sched.returnMineCampDate) {
      return { label: 'Returning to Camp', color: 'bg-blue-50 border-blue-100 text-blue-700' };
    }
    return { label: 'Completed', color: 'bg-slate-100 border-slate-200 text-slate-500' };
  };

  // Format nice dates
  const formatDateNice = (dateStr: string) => {
    if (!dateStr) return '---';
    const [year, month, day] = dateStr.split('-');
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Extract unique months for filter
  const monthsList = Array.from(new Set(schedules.map(s => {
    if (!s.leaveMineCampDate) return '';
    const [y, m] = s.leaveMineCampDate.split('-');
    const dateObj = new Date(parseInt(y), parseInt(m) - 1, 1);
    return dateObj.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  }).filter(Boolean)));

  // Filtered list
  const filteredSchedules = schedules.filter(s => {
    const matchesSearch = s.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.members.some(m => m.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (selectedMonth !== 'All') {
      const [y, m] = s.leaveMineCampDate.split('-');
      const monthStr = new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      if (monthStr !== selectedMonth) return false;
    }

    return true;
  });

  const paginatedSchedules = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSchedules.slice(start, start + itemsPerPage);
  }, [filteredSchedules, currentPage, itemsPerPage]);

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      
      {/* Top Filter Bar + Add Button */}
      <div className="bg-white p-4 border border-slate-100 rounded-[2rem] shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* Search & Month Filter */}
        <div className="flex flex-1 flex-col sm:flex-row items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Search team or member..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-9 pr-3 py-2 text-[10px] font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <Filter size={13} className="text-slate-400 shrink-0 ml-1" />
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto cursor-pointer"
            >
              <option value="All">All Months</option>
              {monthsList.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Action button */}
        {isSupervisor && (
          <button
            onClick={handleOpenAddModal}
            className="bg-indigo-600 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold uppercase tracking-wider text-[8.5px] transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm hover:shadow-md active:scale-95 shrink-0"
          >
            <Plus size={14} />
            <span>New Team Off Schedule</span>
          </button>
        )}
      </div>

      {/* Main Display List */}
      <div className="space-y-3">
        {filteredSchedules.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-[2.2rem] p-12 text-center max-w-md mx-auto space-y-3 shadow-sm">
            <Calendar className="mx-auto text-slate-200" size={40} />
            <h4 className="text-xs font-black uppercase text-slate-600 tracking-wider">No Off Schedules Found</h4>
            <p className="text-[9px] text-slate-400 font-medium">Click "New Team Off Schedule" to schedule monthly rest travel for your teams.</p>
          </div>
        ) : (
          paginatedSchedules.map(sched => {
            const status = getTravelStatus(sched);
            const totalAway = getDaysBetween(sched.leaveMineCampDate, sched.returnMineCampDate);
            const zambiaDays = getDaysBetween(sched.arrivalZambiaDate, sched.departZambiaDate);

            return (
              <div 
                key={sched.id}
                className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all space-y-3 relative overflow-hidden group"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100/80 pb-2.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[8.5px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md">
                        {sched.id}
                      </span>
                      <h3 className="text-slate-900 text-xs sm:text-sm font-bold uppercase tracking-tight">
                        {sched.teamName}
                      </h3>
                      <span className={`px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded-md border ${status.color}`}>
                        {status.label}
                      </span>
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[8px] font-bold font-mono">
                        {totalAway} Days Away ({zambiaDays} Rest)
                      </span>
                    </div>

                    {/* Member Tags */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <Users size={11} className="text-slate-400 shrink-0" />
                      {sched.members.map((m, idx) => (
                        <span key={idx} className="bg-slate-50 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md text-[8.5px] font-semibold">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right Actions */}
                  {isSupervisor && (
                    <div className="flex items-center gap-1 self-end sm:self-center">
                      <button
                        onClick={() => handleOpenEditModal(sched)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-all cursor-pointer"
                        title="Edit Schedule"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteSchedule(sched.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                        title="Delete Schedule"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Simplified 4-Stage Travel Milestone Display */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50/60 p-2.5 rounded-xl border border-slate-100">
                  
                  {/* Step 1: Leave Mine Camp */}
                  <div className="bg-white p-2 rounded-lg border border-slate-100 space-y-0.5">
                    <div className="flex items-center justify-between text-[7.5px] font-bold uppercase tracking-wider text-slate-400">
                      <span>1. Leave Camp</span>
                      <ArrowUpRight size={11} className="text-amber-500" />
                    </div>
                    <div className="text-[10.5px] font-bold text-slate-900 font-mono">
                      {formatDateNice(sched.leaveMineCampDate)}
                    </div>
                  </div>

                  {/* Step 2: Date in Zambia */}
                  <div className="bg-white p-2 rounded-lg border border-slate-100 space-y-0.5">
                    <div className="flex items-center justify-between text-[7.5px] font-bold uppercase tracking-wider text-slate-400">
                      <span>2. Arrive Zambia</span>
                      <MapPin size={11} className="text-emerald-500" />
                    </div>
                    <div className="text-[10.5px] font-bold text-slate-900 font-mono">
                      {formatDateNice(sched.arrivalZambiaDate)}
                    </div>
                  </div>

                  {/* Step 3: Date Start from Zambia */}
                  <div className="bg-white p-2 rounded-lg border border-slate-100 space-y-0.5">
                    <div className="flex items-center justify-between text-[7.5px] font-bold uppercase tracking-wider text-slate-400">
                      <span>3. Depart Zambia</span>
                      <ArrowDownLeft size={11} className="text-blue-500" />
                    </div>
                    <div className="text-[10.5px] font-bold text-slate-900 font-mono">
                      {formatDateNice(sched.departZambiaDate)}
                    </div>
                  </div>

                  {/* Step 4: Back in Mine Camp */}
                  <div className="bg-white p-2 rounded-lg border border-slate-100 space-y-0.5">
                    <div className="flex items-center justify-between text-[7.5px] font-bold uppercase tracking-wider text-slate-400">
                      <span>4. Back in Camp</span>
                      <Home size={11} className="text-indigo-600" />
                    </div>
                    <div className="text-[10.5px] font-bold text-slate-900 font-mono">
                      {formatDateNice(sched.returnMineCampDate)}
                    </div>
                  </div>

                </div>

                {/* Notes footer */}
                {sched.notes && (
                  <div className="text-[8.5px] text-slate-600 font-medium bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60 flex items-center gap-1.5">
                    <span className="font-bold uppercase text-slate-700">Note:</span>
                    <span>{sched.notes}</span>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* FULLY RESPONSIVE PAGINATION CONTROLS */}
        {filteredSchedules.length > 0 && (() => {
          const totalRecords = filteredSchedules.length;
          const startIndex = totalRecords === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
          const endIndex = Math.min(currentPage * itemsPerPage, totalRecords);
          const totalPages = Math.ceil(totalRecords / itemsPerPage) || 1;

          return (
            <div className="bg-white border border-slate-100 rounded-[1.8rem] p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px]">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-slate-600 font-bold">
                <span>
                  Showing <strong className="text-slate-900 font-black">{startIndex}</strong> to <strong className="text-slate-900 font-black">{endIndex}</strong> of <strong className="text-slate-900 font-black">{totalRecords}</strong> records
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
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-800 font-black flex items-center space-x-1 transition-all cursor-pointer active:scale-95"
                  title="Next Page"
                >
                  <span className="hidden sm:inline uppercase text-[9px] tracking-wider">Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Add / Edit Schedule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative bg-[#F8FAFF] w-full max-w-md rounded-3xl shadow-2xl border border-white/20 overflow-hidden my-auto flex flex-col max-h-[96vh] animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-md shrink-0">
                  <Calendar size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">
                    {editingSchedule ? 'Edit Team Off Schedule' : 'New Team Off Schedule'}
                  </h3>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">Travel & Rotation Plan</p>
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

            {/* Responsive, No-Scroll Compact Form Body */}
            <form onSubmit={handleSaveSchedule} className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3 text-slate-800">
              
              <div className="space-y-2.5">
                {/* Members Selection */}
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Team Members *</label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {/* Existing employees dropdown */}
                    <select
                      onChange={e => {
                        if (e.target.value) {
                          handleAddMemberTag(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-[10px] font-bold text-slate-700 outline-none focus:border-indigo-500 shadow-sm cursor-pointer"
                    >
                      <option value="">+ Select Staff...</option>
                      {masterEmployees.map(emp => (
                        <option key={emp.id} value={emp.name}>{emp.name}</option>
                      ))}
                    </select>

                    {/* Custom member input */}
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        placeholder="Or custom name..."
                        value={customMemberInput}
                        onChange={e => setCustomMemberInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddMemberTag(customMemberInput);
                          }
                        }}
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-[10px] font-bold text-slate-800 outline-none focus:border-indigo-500 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddMemberTag(customMemberInput)}
                        className="px-2.5 py-1.5 bg-[#0F1135] hover:bg-indigo-600 text-white rounded-xl text-[8.5px] font-black uppercase transition-colors shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Active Member Tags */}
                  {formSelectedMembers.length > 0 && (
                    <div className="flex flex-wrap gap-1 max-h-12 overflow-y-auto pt-0.5">
                      {formSelectedMembers.map((m, idx) => (
                        <span key={idx} className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase flex items-center gap-1">
                          <span>{m}</span>
                          <button type="button" onClick={() => handleRemoveMemberTag(m)} className="hover:text-rose-600 cursor-pointer">
                            <X size={9} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4 Travel Date Inputs */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <label className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1 truncate">
                      <ArrowUpRight size={10} className="text-amber-500 shrink-0" />
                      <span>Leave Mine Camp</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formLeaveCamp}
                      onChange={e => setFormLeaveCamp(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-[10px] font-bold text-slate-800 outline-none focus:border-indigo-500 font-mono shadow-sm"
                    />
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1 truncate">
                      <MapPin size={10} className="text-emerald-500 shrink-0" />
                      <span>Arrive Zambia</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formArriveZambia}
                      onChange={e => setFormArriveZambia(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-[10px] font-bold text-slate-800 outline-none focus:border-indigo-500 font-mono shadow-sm"
                    />
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1 truncate">
                      <ArrowDownLeft size={10} className="text-blue-500 shrink-0" />
                      <span>Depart Zambia</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formDepartZambia}
                      onChange={e => setFormDepartZambia(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-[10px] font-bold text-slate-800 outline-none focus:border-indigo-500 font-mono shadow-sm"
                    />
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1 truncate">
                      <Home size={10} className="text-indigo-600 shrink-0" />
                      <span>Back in Mine Camp</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formReturnCamp}
                      onChange={e => setFormReturnCamp(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-[10px] font-bold text-slate-800 outline-none focus:border-indigo-500 font-mono shadow-sm"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Remarks / Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="Travel details or rotation notes..."
                    value={formNotes}
                    onChange={e => setFormNotes(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[10px] font-medium text-slate-800 outline-none focus:border-indigo-500 shadow-sm"
                  />
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
                  <span>{editingSchedule ? 'Update Schedule' : 'Save Schedule'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
