import React, { useState } from 'react';
import { 
  UserPlus, 
  Search, 
  Edit3, 
  Trash2, 
  Users, 
  Eye,
  CheckCircle2,
  X,
  AlertTriangle,
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Team, Employee, AttendanceRecord } from '../types';
import { syncStaffToGoogleSheets, inviteStaffToGoogleSheets, deleteStaffFromGoogleSheets } from '../services/googleSheets';
import RegistryForm from '../components/RegistryForm';
import StaffAuditModal from '../components/StaffAuditModal';

const StaffRegistryPage: React.FC<{
  teams: Team[];
  masterEmployees?: Employee[];
  history: AttendanceRecord[];
  sections: string[];
  tierDefaults?: Record<string, { permissions: string[], scope: any }>;
  onAddMember: (member: Partial<Employee>) => void;
  onUpdateMember: (member: Partial<Employee>) => void;
  onDeleteMember: (id: string) => void;
  currentUser: Employee;
  isSystemBusy: boolean;
  setSystemBusy: (busy: boolean) => void;
  hasPermission: (module: string, action?: any, subHub?: string) => boolean;
}> = ({ teams = [], masterEmployees = [], history = [], sections = [], tierDefaults = {}, onAddMember, onUpdateMember, onDeleteMember, currentUser, isSystemBusy, setSystemBusy, hasPermission }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Employee>>({});
  const [auditingStaff, setAuditingStaff] = useState<Employee | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const isSupervisor = React.useMemo(() => {
    const level = currentUser?.accessLevel || 'Staff';
    const roleLower = (currentUser?.role || '').toLowerCase();
    return ['Supervisor', 'Manager', 'Admin', 'HR', 'HSSEQ', 'Director'].includes(level) ||
      roleLower.includes('supervisor') || roleLower.includes('manager');
  }, [currentUser]);

  const canEnroll = isSupervisor || hasPermission('registry', 'create', 'enrollment') || hasPermission('registry', 'create');
  const canUpdate = isSupervisor || hasPermission('registry', 'update', 'enrollment') || hasPermission('registry', 'update');
  const canDelete = isSupervisor || hasPermission('registry', 'delete', 'enrollment') || hasPermission('registry', 'delete');
  const canAudit = isSupervisor || hasPermission('registry', 'view', 'audit') || hasPermission('registry', 'view');

  const allEmployees = React.useMemo(() => {
    const map = new Map<string, Employee>();
    (masterEmployees || []).forEach(e => {
      if (e && e.id) map.set(e.id.toLowerCase(), e);
    });
    teams.flatMap(t => t.members || []).forEach(e => {
      if (e && e.id && !map.has(e.id.toLowerCase())) map.set(e.id.toLowerCase(), e);
    });
    return Array.from(map.values());
  }, [masterEmployees, teams]);
  
  const filteredEmployees = allEmployees.filter(emp => {
    const s = (searchTerm || '').trim().toLowerCase();
    if (!s) return true;
    const name = (emp.name || '').toLowerCase();
    const id = (emp.id || '').toLowerCase();
    const role = (emp.role || '').toLowerCase();
    const section = (emp.section || '').toLowerCase();
    const department = (emp.department || '').toLowerCase();
    const email = (emp.email || '').toLowerCase();
    const username = (emp.username || '').toLowerCase();
    return name.includes(s) || id.includes(s) || role.includes(s) || section.includes(s) || department.includes(s) || email.includes(s) || username.includes(s);
  });

  const paginatedEmployees = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEmployees.slice(start, start + itemsPerPage);
  }, [filteredEmployees, currentPage, itemsPerPage]);

  const showFeedback = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleEdit = (emp: Employee) => {
    setEditingId(emp.id);
    setFormData({ ...emp });
    setIsAdding(true);
  };

  const handleSave = async () => {
    if (!formData.name) return alert("Employee name is required.");
    setIsProcessing(true);
    setSystemBusy(true);
    try {
      const isSpv = ['Supervisor', 'Manager', 'Admin', 'HR', 'HSSEQ', 'Director'].includes(formData.accessLevel || '') ||
        (formData.role || '').toLowerCase().includes('supervisor') ||
        (formData.role || '').toLowerCase().includes('manager');

      const finalMember = {
        ...formData,
        id: (formData.id || `SP-${Date.now().toString().slice(-4)}`).toString().trim(),
        status: formData.status || 'Active',
        role: formData.role || 'Member',
        department: formData.department || 'Operations',
        section: formData.section || 'General',
        contractHours: formData.contractHours || 48,
        hasSystemAccess: formData.hasSystemAccess !== undefined ? !!formData.hasSystemAccess : (isSpv || !!formData.username || !!formData.tempPassword),
        accessLevel: formData.accessLevel || (isSpv ? 'Supervisor' : 'Staff'),
        permissions: formData.permissions || [],
        visibilityScope: formData.visibilityScope || (isSpv ? 'ALL' : 'SELF')
      } as Employee;
      
      // Save/provision staff details to Google Sheets
      const inviteResult = await inviteStaffToGoogleSheets(finalMember, finalMember.tempPassword);
      const recordToSave = inviteResult.staffRecord || finalMember;
      
      if (editingId) onUpdateMember(recordToSave);
      else onAddMember(recordToSave);
      
      setIsAdding(false);
      setEditingId(null);
      setFormData({});
      showFeedback(editingId ? "Identity Synchronized to Google Sheets" : "Personnel Enrolled & Saved to Google Sheets");
    } catch (e) {
      console.error(e);
      alert("Error saving employee.");
    } finally {
      setIsProcessing(false);
      setSystemBusy(false);
    }
  };

  const handleExecuteDelete = async () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setSystemBusy(true);
    try {
      await deleteStaffFromGoogleSheets(id);
      onDeleteMember(id);
      setPendingDeleteId(null);
      showFeedback("Record Purged from Google Sheets & System");
    } catch (e) {
      console.error(e);
      alert("Error purging record.");
    } finally {
      setSystemBusy(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-500 pb-20 relative">
      {successMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[500] animate-in slide-in-from-top-4 duration-300">
          <div className="bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-500/50">
            <CheckCircle2 size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">{successMessage}</span>
            <button onClick={() => setSuccessMessage(null)} className="ml-2 hover:opacity-70"><X size={14}/></button>
          </div>
        </div>
      )}

      {isAdding && (
        <RegistryForm 
          formData={formData} 
          setFormData={setFormData} 
          isProcessing={isProcessing} 
          editingId={editingId} 
          onSave={handleSave} 
          onCancel={() => { setIsAdding(false); setEditingId(null); setFormData({}); }} 
          teams={teams} 
          sections={sections} 
          tierDefaults={tierDefaults}
          setSystemBusy={setSystemBusy}
        />
      )}

      {auditingStaff && (
        <StaffAuditModal 
          staff={auditingStaff} 
          history={history} 
          onClose={() => setAuditingStaff(null)} 
          currentUser={currentUser} 
          setSystemBusy={setSystemBusy} 
        />
      )}

      {pendingDeleteId && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 text-center animate-in zoom-in-95">
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                 <AlertTriangle size={32} />
              </div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">Delete Asset?</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed mb-8 px-4">
                 This action will permanently delete this personnel record and all associated credentials.
              </p>
              <div className="grid grid-cols-2 gap-3">
                 <button onClick={() => setPendingDeleteId(null)} className="py-4 bg-slate-50 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">Cancel</button>
                 <button onClick={handleExecuteDelete} className="py-4 bg-rose-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-rose-100 hover:bg-rose-700 active:scale-95 transition-all">Delete</button>
              </div>
           </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center space-x-4">
           <div className="w-12 h-12 bg-[#0F1135] rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
              <Users size={24} />
           </div>
           <div>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">Staff Registry</h2>
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1.5">Last Managed: {new Date().toLocaleDateString()}</p>
           </div>
        </div>

        {canEnroll && (
          <button 
            type="button"
            onClick={() => { setFormData({}); setEditingId(null); setIsAdding(true); }}
            className="bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-black uppercase tracking-[0.15em] text-[9px] hover:bg-[#0F1135] shadow-xl shadow-indigo-100 transition-all flex items-center justify-center space-x-2 active:scale-95"
          >
            <UserPlus size={14} />
            <span>Enroll Personnel</span>
          </button>
        )}
      </div>

      <div className="w-full relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
        <input 
          type="text"
          className="w-full bg-white border border-slate-100 rounded-[1.5rem] pl-16 pr-6 py-5 text-[10px] font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 shadow-sm transition-all placeholder:text-slate-300 uppercase tracking-[0.2em]"
          placeholder="Lookup Name or Role..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white border border-slate-100 shadow-xl rounded-[2rem] overflow-hidden">
        <div className="hidden lg:grid grid-cols-12 bg-slate-50/80 backdrop-blur-md text-[8px] font-black text-slate-400 uppercase tracking-[0.25em] border-b border-slate-100 px-8 py-4">
           <div className="col-span-4">Personnel Information</div>
           <div className="col-span-3">Unit / Role</div>
           <div className="col-span-3">Sync Status</div>
           <div className="col-span-2 text-right">Control</div>
        </div>

        <div className="divide-y divide-slate-50">
          {filteredEmployees.length === 0 ? (
            <div className="py-24 text-center">
              <Users size={48} className="mx-auto text-slate-100 mb-4" />
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">No matching identity found</p>
            </div>
          ) : paginatedEmployees.map(emp => {
            return (
              <div key={emp.id} className="group p-6 lg:px-8 lg:py-4 hover:bg-indigo-50/20 transition-all duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                    <div className="col-span-1 lg:col-span-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-indigo-600 font-black text-sm shrink-0 shadow-sm transition-all duration-500">
                            {emp.name.charAt(0)}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="font-black text-slate-900 text-sm uppercase tracking-tight truncate">{emp.name}</span>
                            <span className="text-[8px] font-black text-slate-200 uppercase tracking-widest">{emp.id}</span>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-1 lg:col-span-3 flex items-center lg:block">
                      <div className="flex items-center space-x-2">
                        <span className="text-[9px] font-black text-indigo-650 uppercase tracking-wider">{emp.department || 'Other'}</span>
                        <span className="text-slate-200">•</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{emp.role === 'Member' ? 'Staff' : emp.role}</span>
                      </div>
                    </div>

                    <div className="col-span-1 lg:col-span-3 flex items-center lg:block">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg border border-emerald-100 shadow-sm shadow-emerald-100/50">
                           <Clock size={10} />
                           <span className="text-[8px] font-black uppercase tracking-widest">Verified Today</span>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-1 lg:col-span-2">
                      <div className="flex items-center justify-start lg:justify-end space-x-1.5 border-t lg:border-t-0 border-slate-50 pt-4 lg:pt-0 relative z-40">
                        {canAudit && (
                          <button 
                            type="button"
                            onClick={() => setAuditingStaff(emp)} 
                            className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-indigo-600 bg-white border border-slate-100 hover:border-indigo-600 rounded-lg transition-all shadow-sm active:scale-90"
                          >
                            <Eye size={16} />
                          </button>
                        )}
                        {canUpdate && (
                          <button 
                            type="button"
                            onClick={() => handleEdit(emp)} 
                            className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-indigo-600 bg-white border border-slate-100 hover:border-indigo-600 rounded-lg transition-all shadow-sm active:scale-90"
                          >
                            <Edit3 size={16} />
                          </button>
                        )}
                        {canDelete && (
                          <button 
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPendingDeleteId(emp.id); }} 
                            className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-rose-600 bg-white border border-slate-100 hover:border-rose-600 rounded-lg transition-all shadow-sm active:scale-90"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* FULLY RESPONSIVE PAGINATION CONTROLS */}
        {filteredEmployees.length > 0 && (() => {
          const totalRecords = filteredEmployees.length;
          const startIndex = totalRecords === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
          const endIndex = Math.min(currentPage * itemsPerPage, totalRecords);
          const totalPages = Math.ceil(totalRecords / itemsPerPage) || 1;

          return (
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px]">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-slate-600 font-bold">
                <span>
                  Showing <strong className="text-slate-900 font-black">{startIndex}</strong> to <strong className="text-slate-900 font-black">{endIndex}</strong> of <strong className="text-slate-900 font-black">{totalRecords}</strong> records
                </span>

                <div className="flex items-center space-x-1.5 bg-white border border-slate-200 px-2 py-1 rounded-xl shadow-2xs">
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
                  className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-800 font-black flex items-center space-x-1 transition-all cursor-pointer active:scale-95 shadow-2xs"
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
                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs'
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
                  className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-800 font-black flex items-center space-x-1 transition-all cursor-pointer active:scale-95 shadow-2xs"
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
    </div>
  );
};

export default StaffRegistryPage;