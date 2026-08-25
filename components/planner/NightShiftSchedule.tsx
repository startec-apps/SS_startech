import React, { useState, useEffect } from 'react';
import { Moon, Users, Search, Plus, Edit3, Trash2, CheckCircle, ShieldCheck, Clock, Phone, MapPin, X } from 'lucide-react';
import { Employee } from '../../types';
import { fetchNightShiftsFromGoogleSheets, syncNightShiftToGoogleSheets, deleteNightShiftFromGoogleSheets } from '../../services/googleSheets';

export interface NightShiftAssignment {
  id: string;
  empId: string;
  empName: string;
  department: string;
  role: string;
  shiftHours: string; // e.g. "19:00 - 07:00"
  location: string;
  contactNumber: string;
  status: 'Active Duty' | 'Standby' | 'Off Shift';
  notes?: string;
}

interface NightShiftScheduleProps {
  masterEmployees: Employee[];
  isSupervisor: boolean;
}

export const NightShiftSchedule: React.FC<NightShiftScheduleProps> = ({
  masterEmployees = [],
  isSupervisor
}) => {
  const [shifts, setShifts] = useState<NightShiftAssignment[]>([]);

  useEffect(() => {
    fetchNightShiftsFromGoogleSheets().then((remoteData) => {
      setShifts(remoteData || []);
    }).catch((err) => {
      console.debug('Google Sheets Night Shift fetch notice:', err);
    });
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<NightShiftAssignment | null>(null);

  // Form states
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [shiftHours, setShiftHours] = useState('19:00 - 07:00');
  const [location, setLocation] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [status, setStatus] = useState<'Active Duty' | 'Standby' | 'Off Shift'>('Active Duty');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setSelectedEmpId('');
    setShiftHours('19:00 - 07:00');
    setLocation('');
    setContactNumber('');
    setStatus('Active Duty');
    setNotes('');
    setEditingShift(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: NightShiftAssignment) => {
    setEditingShift(item);
    setSelectedEmpId(item.empId);
    setShiftHours(item.shiftHours);
    setLocation(item.location);
    setContactNumber(item.contactNumber);
    setStatus(item.status);
    setNotes(item.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveShift = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = masterEmployees.find(m => m.id === selectedEmpId);
    if (!emp && !editingShift) {
      alert('Please select a valid staff member.');
      return;
    }

    const empName = emp ? emp.name : editingShift?.empName || 'Staff Member';
    const dept = emp ? emp.department : editingShift?.department || 'General';
    const role = emp ? emp.role : editingShift?.role || 'Staff';

    if (editingShift) {
      const updatedShift: NightShiftAssignment = {
        ...editingShift,
        empId: selectedEmpId || editingShift.empId,
        empName,
        department: dept,
        role,
        shiftHours,
        location,
        contactNumber,
        status,
        notes
      };
      setShifts(prev => prev.map(s => s.id === editingShift.id ? updatedShift : s));
      syncNightShiftToGoogleSheets(updatedShift);
    } else {
      const newEntry: NightShiftAssignment = {
        id: `NS-${String(Date.now()).slice(-4)}`,
        empId: selectedEmpId,
        empName,
        department: dept,
        role,
        shiftHours,
        location: location || 'Main Site',
        contactNumber: contactNumber || emp?.phone || '---',
        status,
        notes
      };
      setShifts([newEntry, ...shifts]);
      syncNightShiftToGoogleSheets(newEntry);
    }

    setIsModalOpen(false);
    resetForm();
  };

  const handleDeleteShift = (id: string) => {
    if (confirm('Remove this staff member from the night shift roster?')) {
      setShifts(prev => prev.filter(s => s.id !== id));
      deleteNightShiftFromGoogleSheets(id);
    }
  };

  const filteredShifts = shifts.filter(s => {
    const matchSearch = s.empName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        s.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (s.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = selectedDept === 'All' || s.department.toLowerCase().includes(selectedDept.toLowerCase());
    return matchSearch && matchDept;
  });

  return (
    <div className="space-y-3 animate-in fade-in duration-200">
      
      {/* Night Shift Controls & Filter Bar */}
      <div className="bg-white p-3.5 border border-slate-200/80 rounded-2xl shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        
        <div className="flex flex-1 flex-col sm:flex-row items-center gap-2">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
            <input
              type="text"
              placeholder="Search night shift crew..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-indigo-500"
            />
          </div>

          {/* Department filter */}
          <select
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:border-indigo-500 cursor-pointer"
          >
            <option value="All">All Departments</option>
            <option value="Technical">Technical Team</option>
            <option value="Operator">Operators</option>
            <option value="HR">HR & Admin</option>
          </select>
        </div>

        {/* Add Button */}
        {isSupervisor && (
          <button
            onClick={handleOpenAddModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-98 shrink-0"
          >
            <Plus size={14} />
            <span>Assign Night Shift</span>
          </button>
        )}
      </div>

      {/* Roster Cards / Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        
        {/* Header bar */}
        <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Moon size={15} className="text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Night Shift Roster (19:00 - 07:00)</span>
          </div>
          <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-2 py-0.5 rounded-full font-mono">
            {filteredShifts.length} Personnel Assigned
          </span>
        </div>

        {filteredShifts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-2">
            <Moon className="mx-auto text-slate-300" size={32} />
            <p className="text-xs font-semibold">No night shift personnel assigned.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredShifts.map((shift) => (
              <div key={shift.id} className="p-3.5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                
                {/* Left: Staff info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 uppercase">{shift.empName}</span>
                    <span className="text-[9px] font-bold text-slate-400 font-mono">({shift.empId})</span>
                    <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded border ${
                      shift.status === 'Active Duty' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : shift.status === 'Standby' 
                        ? 'bg-amber-50 text-amber-700 border-amber-200' 
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {shift.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock size={11} className="text-indigo-600" />
                      <span>{shift.shiftHours}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={11} className="text-slate-400" />
                      <span>{shift.location}</span>
                    </span>
                    <span className="flex items-center gap-1 font-mono text-slate-700">
                      <Phone size={11} className="text-slate-400" />
                      <span>{shift.contactNumber}</span>
                    </span>
                  </div>

                  {shift.notes && (
                    <p className="text-[9px] text-slate-500 italic">"{shift.notes}"</p>
                  )}
                </div>

                {/* Right: Actions */}
                {isSupervisor && (
                  <div className="flex items-center gap-1 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => handleOpenEditModal(shift)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Edit Shift"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteShift(shift.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Shift"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for Assigning / Editing Night Shift */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative bg-[#F8FAFF] w-full max-w-md rounded-3xl shadow-2xl border border-white/20 overflow-hidden my-auto flex flex-col max-h-[96vh] animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-[#0F1135] text-indigo-300 rounded-xl flex items-center justify-center shadow-md shrink-0">
                  <Moon size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">
                    {editingShift ? 'Edit Night Shift Duty' : 'Assign Night Shift Duty'}
                  </h3>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">Operational Roster</p>
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
            <form onSubmit={handleSaveShift} className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3 text-slate-800">
              
              <div className="space-y-2.5">
                {!editingShift && (
                  <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-0.5 block">Personnel (Technician) *</label>
                    <select
                      required
                      value={selectedEmpId}
                      onChange={e => {
                        setSelectedEmpId(e.target.value);
                        const emp = masterEmployees.find(m => m.id === e.target.value);
                        if (emp && emp.phone) setContactNumber(emp.phone);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] sm:text-[11px] font-black uppercase text-slate-800 outline-none focus:border-indigo-500 shadow-sm cursor-pointer"
                    >
                      <option value="">-- Choose Staff Member --</option>
                      {masterEmployees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-0.5 block">Shift Hours *</label>
                    <input
                      type="text"
                      required
                      value={shiftHours}
                      onChange={e => setShiftHours(e.target.value)}
                      placeholder="19:00 - 07:00"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-black text-slate-800 outline-none focus:border-indigo-500 shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-0.5 block">Duty Status *</label>
                    <select
                      value={status}
                      onChange={e => setStatus(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-black uppercase text-slate-800 outline-none focus:border-indigo-500 shadow-sm cursor-pointer"
                    >
                      <option value="Active Duty">Active Duty</option>
                      <option value="Standby">Standby</option>
                      <option value="Off Shift">Off Shift</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-0.5 block">Duty Station</label>
                    <input
                      type="text"
                      placeholder="e.g. Pit Mesh Node"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-800 outline-none focus:border-indigo-500 shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-0.5 block">Contact Phone</label>
                    <input
                      type="text"
                      placeholder="+260 977..."
                      value={contactNumber}
                      onChange={e => setContactNumber(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-800 outline-none focus:border-indigo-500 shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-0.5 block">Shift Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="Handover instructions or priorities..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-800 outline-none focus:border-indigo-500 shadow-sm"
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
                  <span>{editingShift ? 'Update Night Shift' : 'Save Night Shift'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
