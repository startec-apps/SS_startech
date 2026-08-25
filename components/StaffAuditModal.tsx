import React, { useState, useMemo } from 'react';
import { 
  X, 
  TrendingUp, 
  Calendar, 
  User, 
  Eye, 
  Clock,
  HardHat,
  UserCheck,
  Phone,
  Lock,
  Briefcase,
  ShieldCheck,
  Fingerprint
} from 'lucide-react';
import { Employee, AttendanceRecord } from '../types';

interface StaffAuditModalProps {
  staff: Employee;
  history: AttendanceRecord[];
  onClose: () => void;
  currentUser: Employee;
  setSystemBusy: (busy: boolean) => void;
}

const StaffAuditModal: React.FC<StaffAuditModalProps> = ({ staff, history, onClose }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');

  const staffLogs = useMemo(() => 
    history.filter(log => log.employeeId === staff.id)
    .sort((a, b) => b.date.localeCompare(a.date)),
  [history, staff.id]);

  const stats = useMemo(() => {
    const present = staffLogs.filter(l => l.status === 'Present').length;
    const total = staffLogs.length;
    return {
      present,
      reliability: total > 0 ? (present / total) * 100 : 0
    };
  }, [staffLogs]);

  return (
    <div className="fixed inset-0 z-[160] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-lg h-full sm:h-auto sm:rounded-[2rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 flex flex-col sm:max-h-[90vh]">
        
        {/* Header - Fixed Height */}
        <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-[#0F1135] rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
              <User size={20} className="md:size-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm md:text-base font-black text-slate-900 uppercase tracking-tight leading-none truncate">{staff.name}</h3>
              <p className="text-[7px] md:text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1.5 truncate">TRACE ID: {staff.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-900 transition-colors p-2">
            <X size={24} />
          </button>
        </div>

        {/* Navigation - Fixed Height */}
        <div className="flex bg-slate-50/80 px-5 md:px-6 py-2 gap-2 border-b border-slate-100 shrink-0">
          <button 
            onClick={() => setActiveTab('details')}
            className={`flex-1 sm:flex-none px-4 md:px-6 py-2.5 text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all rounded-xl border ${
              activeTab === 'details' 
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                : 'bg-white text-slate-400 border-slate-200 hover:text-indigo-600'
            }`}
          >
            General Info
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 sm:flex-none px-4 md:px-6 py-2.5 text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all rounded-xl border ${
              activeTab === 'history' 
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                : 'bg-white text-slate-400 border-slate-200 hover:text-indigo-600'
            }`}
          >
            Attendance
          </button>
        </div>

        {/* Scrollable Content Area - Replaces inner scroll where possible by utilizing flex-1 */}
        <div className="flex-1 p-5 md:p-8 space-y-5 md:space-y-6 overflow-y-auto no-scrollbar bg-white">
          {activeTab === 'details' && (
            <div className="space-y-5 md:space-y-6 animate-in fade-in duration-300">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div className="bg-slate-50 p-4 md:p-5 rounded-[1.2rem] md:rounded-[1.5rem] border border-slate-100 flex items-center space-x-4 shadow-sm">
                  <div className="p-2 md:p-2.5 bg-white rounded-xl shadow-sm text-indigo-600 border border-slate-100">
                    <HardHat size={18} className="md:size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest">Shift Domain</p>
                    <p className="text-[10px] md:text-[11px] font-black text-slate-900 uppercase truncate mt-0.5">{staff.teamName || 'Unassigned'}</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 md:p-5 rounded-[1.2rem] md:rounded-[1.5rem] border border-slate-100 flex items-center space-x-4 shadow-sm">
                  <div className="p-2 md:p-2.5 bg-white rounded-xl shadow-sm text-indigo-600 border border-slate-100">
                    <UserCheck size={18} className="md:size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest">Supervisor</p>
                    <p className="text-[10px] md:text-[11px] font-black text-slate-900 uppercase truncate mt-0.5">{staff.supervisorName || 'Not Assigned'}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div className="bg-white p-4 md:p-5 rounded-[1.2rem] md:rounded-[1.5rem] border border-slate-100 flex items-center space-x-4 shadow-sm">
                  <div className="p-2 md:p-2.5 bg-slate-50 rounded-xl text-slate-400 border border-slate-100">
                    <Briefcase size={18} className="md:size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest">Unit / Role</p>
                    <p className="text-[10px] md:text-[11px] font-black text-slate-800 uppercase mt-0.5">{staff.section || 'Unspecified'}</p>
                  </div>
                </div>

                <div className="bg-white p-4 md:p-5 rounded-[1.2rem] md:rounded-[1.5rem] border border-slate-100 flex items-center space-x-4 shadow-sm">
                  <div className="p-2 md:p-2.5 bg-slate-50 rounded-xl text-slate-400 border border-slate-100">
                    <Phone size={18} className="md:size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest">Phone Link</p>
                    <p className="text-[10px] md:text-[11px] font-black text-slate-800 uppercase mt-0.5">{staff.phone || 'None Recorded'}</p>
                  </div>
                </div>
              </div>

              <div className={`p-5 md:p-6 rounded-[1.5rem] border flex items-center justify-between transition-colors shadow-sm ${staff.hasSystemAccess ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center space-x-4">
                  <div className={`p-2.5 md:p-3 rounded-xl md:rounded-2xl shadow-sm ${staff.hasSystemAccess ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                    <Lock size={18} className="md:size-5" />
                  </div>
                  <div>
                    <p className="text-[8px] md:text-[9px] font-black text-slate-900 uppercase tracking-widest">Digital Access</p>
                    <p className={`text-[10px] md:text-[11px] font-black uppercase mt-0.5 ${staff.hasSystemAccess ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {staff.hasSystemAccess ? 'Session Enabled' : 'Access Restricted'}
                    </p>
                  </div>
                </div>
                {staff.hasSystemAccess && (
                  <div className="text-right hidden sm:block">
                    <p className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Authorization</p>
                    <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[8px] md:text-[9px] font-black text-slate-700 uppercase shadow-sm">
                      {staff.accessLevel || 'Staff'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-5 md:space-y-6 animate-in slide-in-from-right-4">
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="bg-slate-50 p-4 md:p-5 rounded-[1.2rem] md:rounded-[1.5rem] border border-slate-100 text-center shadow-inner">
                  <p className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Integrity Rate</p>
                  <div className="flex items-center justify-center space-x-2">
                    <TrendingUp size={12} className="text-emerald-500 md:size-3.5" />
                    <span className="text-xl md:text-2xl font-black text-slate-900">{stats.reliability.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 md:p-5 rounded-[1.2rem] md:rounded-[1.5rem] border border-slate-100 text-center shadow-inner">
                  <p className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Days Logged</p>
                  <span className="text-xl md:text-2xl font-black text-slate-900">{stats.present}</span>
                </div>
              </div>

              <div className="border border-slate-100 rounded-[1.5rem] overflow-hidden shadow-sm">
                 <div className="bg-slate-50 px-5 py-3 border-b border-slate-100">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Deployment Archive</span>
                 </div>
                 <div className="max-h-64 sm:max-h-48 overflow-y-auto no-scrollbar divide-y divide-slate-50">
                    {staffLogs.slice(0, 10).map((log, idx) => (
                       <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                          <div className="flex items-center space-x-3">
                             <Calendar size={14} className="text-slate-300" />
                             <span className="text-[9px] md:text-[10px] font-black text-slate-700 uppercase">{log.date}</span>
                          </div>
                          <span className={`text-[7px] md:text-[8px] font-black px-2.5 py-1 rounded border tracking-widest ${log.status === 'Present' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{log.status === 'Present' ? 'SIGHTED' : 'ABSENT'}</span>
                       </div>
                    ))}
                    {staffLogs.length === 0 && (
                       <p className="py-16 text-center text-[9px] md:text-[10px] font-black text-slate-200 uppercase tracking-widest">No deployment history</p>
                    )}
                 </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Fixed Height with Adaptive Padding */}
        <div className="p-5 md:p-6 bg-slate-50 border-t border-slate-100 shrink-0 flex items-center justify-between pb-8 sm:pb-6">
          <div className="flex items-center space-x-2 text-slate-400">
            <ShieldCheck size={14} />
            <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest">VERIFIED IDENTITY</span>
          </div>
          <button onClick={onClose} className="px-6 md:px-8 py-3 bg-[#0F1135] text-white rounded-xl font-black uppercase tracking-[0.2em] text-[9px] hover:bg-indigo-600 transition-all shadow-xl active:scale-95">
            Close Entry
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffAuditModal;