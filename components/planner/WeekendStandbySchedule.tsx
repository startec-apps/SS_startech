import React, { useState, useEffect } from 'react';
import { Calendar, Users, Search, Plus, Edit3, Trash2, ShieldCheck, Phone, Clock, MapPin, X, CheckCircle2 } from 'lucide-react';
import { Employee } from '../../types';
import { fetchWeekendStandbyFromGoogleSheets, syncWeekendStandbyToGoogleSheets, deleteWeekendStandbyFromGoogleSheets } from '../../services/googleSheets';

export interface WeekendStandbyAssignment {
  id: string;
  weekendDates: string; // e.g. "08 Aug - 09 Aug 2026"
  leadEmpId: string;
  leadEmpName: string;
  backupEmpId?: string;
  backupEmpName?: string;
  department: string;
  roleType: 'Primary Lead' | 'Secondary Backup' | 'Emergency Tech';
  contactNumber: string;
  coverageArea: string;
  status: 'On Call' | 'Active Response' | 'Completed';
  notes?: string;
}

interface WeekendStandbyScheduleProps {
  masterEmployees: Employee[];
  isSupervisor: boolean;
}

export const WeekendStandbySchedule: React.FC<WeekendStandbyScheduleProps> = ({
  masterEmployees = [],
  isSupervisor
}) => {
  const [standbyList, setStandbyList] = useState<WeekendStandbyAssignment[]>([]);

  useEffect(() => {
    fetchWeekendStandbyFromGoogleSheets().then((remoteData) => {
      setStandbyList(remoteData || []);
    }).catch((err) => {
      console.debug('Google Sheets Weekend Standby fetch notice:', err);
    });
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WeekendStandbyAssignment | null>(null);

  // Form states
  const [weekendDates, setWeekendDates] = useState('');
  const [leadEmpId, setLeadEmpId] = useState('');
  const [backupEmpId, setBackupEmpId] = useState('');
  const [roleType, setRoleType] = useState<'Primary Lead' | 'Secondary Backup' | 'Emergency Tech'>('Primary Lead');
  const [contactNumber, setContactNumber] = useState('');
  const [coverageArea, setCoverageArea] = useState('');
  const [status, setStatus] = useState<'On Call' | 'Active Response' | 'Completed'>('On Call');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setWeekendDates('');
    setLeadEmpId('');
    setBackupEmpId('');
    setRoleType('Primary Lead');
    setContactNumber('');
    setCoverageArea('');
    setStatus('On Call');
    setNotes('');
    setEditingItem(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: WeekendStandbyAssignment) => {
    setEditingItem(item);
    setWeekendDates(item.weekendDates);
    setLeadEmpId(item.leadEmpId);
    setBackupEmpId(item.backupEmpId || '');
    setRoleType(item.roleType);
    setContactNumber(item.contactNumber);
    setCoverageArea(item.coverageArea);
    setStatus(item.status);
    setNotes(item.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveStandby = (e: React.FormEvent) => {
    e.preventDefault();
    const leadEmp = masterEmployees.find(m => m.id === leadEmpId);
    const backupEmp = masterEmployees.find(m => m.id === backupEmpId);

    if (!leadEmp && !editingItem) {
      alert('Please select a Primary Standby Lead.');
      return;
    }

    const leadEmpName = leadEmp ? leadEmp.name : editingItem?.leadEmpName || 'Staff Member';
    const backupEmpName = backupEmp ? backupEmp.name : (backupEmpId ? 'Team Member' : '');
    const dept = leadEmp ? leadEmp.department : editingItem?.department || 'Technical Team';

    if (editingItem) {
      const updatedItem: WeekendStandbyAssignment = {
        ...editingItem,
        weekendDates: weekendDates || editingItem.weekendDates,
        leadEmpId: leadEmpId || editingItem.leadEmpId,
        leadEmpName,
        backupEmpId,
        backupEmpName,
        department: dept,
        roleType,
        contactNumber,
        coverageArea,
        status,
        notes
      };
      setStandbyList(prev => prev.map(s => s.id === editingItem.id ? updatedItem : s));
      syncWeekendStandbyToGoogleSheets(updatedItem);
    } else {
      const newEntry: WeekendStandbyAssignment = {
        id: `WSB-${String(Date.now()).slice(-4)}`,
        weekendDates: weekendDates || 'Upcoming Weekend',
        leadEmpId,
        leadEmpName,
        backupEmpId,
        backupEmpName,
        department: dept,
        roleType,
        contactNumber: contactNumber || leadEmp?.phone || '---',
        coverageArea: coverageArea || 'All Site Equipment',
        status,
        notes
      };
      setStandbyList([newEntry, ...standbyList]);
      syncWeekendStandbyToGoogleSheets(newEntry);
    }

    setIsModalOpen(false);
    resetForm();
  };

  const handleDeleteStandby = (id: string) => {
    if (confirm('Remove this weekend standby assignment?')) {
      setStandbyList(prev => prev.filter(s => s.id !== id));
      deleteWeekendStandbyFromGoogleSheets(id);
    }
  };

  const filteredList = standbyList.filter(s => {
    return s.leadEmpName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           s.weekendDates.toLowerCase().includes(searchTerm.toLowerCase()) ||
           s.coverageArea.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-3 animate-in fade-in duration-200">
      
      {/* Top Filter Bar */}
      <div className="bg-white p-3.5 border border-slate-200/80 rounded-2xl shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
          <input
            type="text"
            placeholder="Search standby personnel or dates..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-indigo-500"
          />
        </div>

        {isSupervisor && (
          <button
            onClick={handleOpenAddModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-98 shrink-0"
          >
            <Plus size={14} />
            <span>Schedule Weekend Standby</span>
          </button>
        )}
      </div>

      {/* Standby Duty Cards */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        
        <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <ShieldCheck size={15} className="text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Weekend Standby Roster</span>
          </div>
          <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-mono">
            {filteredList.length} Weekends Scheduled
          </span>
        </div>

        {filteredList.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-2">
            <Calendar className="mx-auto text-slate-300" size={32} />
            <p className="text-xs font-semibold">No weekend standby coverage scheduled.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredList.map((item) => (
              <div key={item.id} className="p-3.5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                
                {/* Details */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 uppercase">{item.weekendDates}</span>
                    <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded border ${
                      item.status === 'On Call' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : item.status === 'Active Response' 
                        ? 'bg-amber-50 text-amber-700 border-amber-200' 
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {item.status}
                    </span>
                    <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded text-[8px] font-bold uppercase">
                      {item.roleType}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[10.5px] text-slate-700 font-semibold flex-wrap">
                    <span className="flex items-center gap-1">
                      <Users size={12} className="text-indigo-600" />
                      <span>Lead: <strong className="text-slate-900">{item.leadEmpName}</strong></span>
                    </span>

                    {item.backupEmpName && (
                      <span className="flex items-center gap-1 text-slate-500">
                        <span>• Backup: <strong>{item.backupEmpName}</strong></span>
                      </span>
                    )}

                    <span className="flex items-center gap-1 font-mono text-slate-700">
                      <Phone size={11} className="text-slate-400" />
                      <span>{item.contactNumber}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[9.5px] text-slate-500 font-medium">
                    <MapPin size={11} className="text-slate-400 shrink-0" />
                    <span>Coverage Area: {item.coverageArea}</span>
                  </div>

                  {item.notes && (
                    <p className="text-[9px] text-slate-500 italic">"{item.notes}"</p>
                  )}
                </div>

                {/* Actions */}
                {isSupervisor && (
                  <div className="flex items-center gap-1 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => handleOpenEditModal(item)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Edit Standby Schedule"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteStandby(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Standby Schedule"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative bg-[#F8FAFF] w-full max-w-md rounded-3xl shadow-2xl border border-white/20 overflow-hidden my-auto flex flex-col max-h-[96vh] animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-md shrink-0">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">
                    {editingItem ? 'Edit Weekend Standby' : 'Schedule Weekend Standby'}
                  </h3>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">Weekend Standby Roster</p>
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
            <form onSubmit={handleSaveStandby} className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3 text-slate-800">
              
              <div className="space-y-2.5">
                <div>
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-0.5 block">Weekend Dates *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 08 Aug - 09 Aug 2026"
                    value={weekendDates}
                    onChange={e => setWeekendDates(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] sm:text-[11px] font-black uppercase text-slate-800 outline-none focus:border-indigo-500 shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-0.5 block">Primary Lead *</label>
                    <select
                      required
                      value={leadEmpId}
                      onChange={e => {
                        setLeadEmpId(e.target.value);
                        const emp = masterEmployees.find(m => m.id === e.target.value);
                        if (emp && emp.phone) setContactNumber(emp.phone);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] sm:text-[11px] font-black uppercase text-slate-800 outline-none focus:border-indigo-500 shadow-sm cursor-pointer"
                    >
                      <option value="">-- Choose Lead --</option>
                      {masterEmployees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-0.5 block">Secondary Backup</label>
                    <select
                      value={backupEmpId}
                      onChange={e => setBackupEmpId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] sm:text-[11px] font-black uppercase text-slate-800 outline-none focus:border-indigo-500 shadow-sm cursor-pointer"
                    >
                      <option value="">-- None / Optional --</option>
                      {masterEmployees.filter(m => m.id !== leadEmpId).map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-0.5 block">Role Designation *</label>
                    <select
                      value={roleType}
                      onChange={e => setRoleType(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-black uppercase text-slate-800 outline-none focus:border-indigo-500 shadow-sm cursor-pointer"
                    >
                      <option value="Primary Lead">Primary Lead</option>
                      <option value="Secondary Backup">Secondary Backup</option>
                      <option value="Emergency Tech">Emergency Tech</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-0.5 block">Standby Status *</label>
                    <select
                      value={status}
                      onChange={e => setStatus(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-black uppercase text-slate-800 outline-none focus:border-indigo-500 shadow-sm cursor-pointer"
                    >
                      <option value="On Call">On Call</option>
                      <option value="Active Response">Active Response</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
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

                  <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-0.5 block">Coverage Area</label>
                    <input
                      type="text"
                      placeholder="e.g. Pit Mesh & Workshop"
                      value={coverageArea}
                      onChange={e => setCoverageArea(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-800 outline-none focus:border-indigo-500 shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-0.5 block">Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="Standby duty instructions or priorities..."
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
                  <span>{editingItem ? 'Update Standby' : 'Save Standby'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
