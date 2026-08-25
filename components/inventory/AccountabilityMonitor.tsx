
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ShieldAlert, 
  AlertCircle,
  ChevronDown, 
  Wrench, 
  AlertTriangle, 
  ShieldCheck, 
  Timer, 
  History,
  Clock,
  User,
  X,
  ArrowRight,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Shield,
  Fingerprint,
  MessageSquare,
  MonitorCheck,
  CheckCircle2,
  Trash2,
  BellRing,
  RotateCcw,
  Info,
  Scale,
  Gavel,
  ArrowUpRight,
  Search,
  PenTool,
  AlertOctagon,
  ShieldX,
  PackageX,
  Hammer
} from 'lucide-react';
import { ToolUsageRecord, Employee, AssetClass } from '../../types';

interface AccountabilityMonitorProps {
  monitoredItems: ToolUsageRecord[];
  staffRegistry?: Employee[];
  currentUser: Employee;
  onVerify: (log: ToolUsageRecord) => void;
  onResolve: (logId: string, action: string, notes: string) => void;
  onStartSweep: () => void;
  initialFilter?: string;
  hasPermission: (module: string, action?: any, subHub?: string) => boolean;
  resolveStaffIdentity: (id: string) => Partial<Employee>;
}

const AccountabilityMonitor: React.FC<AccountabilityMonitorProps> = ({ 
  monitoredItems, 
  currentUser,
  onVerify, 
  onResolve,
  initialFilter = '',
  resolveStaffIdentity
}) => {
  const [filterText, setFilterText] = useState(initialFilter);
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filteredItems = useMemo(() => {
    const s = filterText.toLowerCase();
    return monitoredItems.filter(l => 
      l.toolName.toLowerCase().includes(s) || 
      l.staffName.toLowerCase().includes(s) ||
      l.id.toLowerCase().includes(s)
    ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [monitoredItems, filterText]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleExpand = (id: string) => {
    setExpandedLogIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const getStatusConfig = (item: ToolUsageRecord) => {
    if (item.escalationStatus === 'In-Grace-Period') {
      return { 
        label: 'RESTITUTION GRANTED', 
        color: 'text-emerald-600 bg-emerald-50 border-emerald-100', 
        icon: <Timer size={14}/>, 
        desc: 'Staff has 30 days to replace' 
      };
    }
    if (item.escalationStatus === 'Escalated-to-HR') {
      return { 
        label: 'HR TRIBUNAL ACTIVE', 
        color: 'text-rose-600 bg-rose-50 border-rose-100 shadow-sm animate-pulse', 
        icon: <ShieldX size={14}/>, 
        desc: 'Formal disciplinary inquiry' 
      };
    }
    if (item.escalationStage === 'Manager') {
      return { 
        label: 'MANAGERIAL REVIEW', 
        color: 'text-white bg-[#0F1135] border-[#0F1135] shadow-lg', 
        icon: <Gavel size={14}/>, 
        desc: 'Awaiting executive verdict' 
      };
    }
    if (item.escalationStage === 'Supervisor') {
      return { 
        label: 'SUPERVISOR TRACE', 
        color: 'text-amber-600 bg-amber-50 border-amber-100', 
        icon: <Search size={14}/>, 
        desc: 'Active custodial search' 
      };
    }
    return { 
      label: 'PENDING VERIFICATION', 
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100', 
      icon: <Clock size={14}/>, 
      desc: 'Registry exception flagged' 
    };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 mx-1">
         <div className="flex items-center space-x-5">
            <div className="w-14 h-14 bg-rose-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-rose-100 shrink-0">
               <ShieldAlert size={28} />
            </div>
            <div>
               <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">Resolution Hub</h2>
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Institutional Liability Management</p>
            </div>
         </div>
         
         <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80 group">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={16} />
               <input 
                 type="text" 
                 placeholder="Search Case or Staff..." 
                 className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-11 pr-4 py-3 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                 value={filterText}
                 onChange={e => setFilterText(e.target.value)}
               />
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 gap-4 mx-1">
         {paginatedItems.length === 0 ? (
           <div className="py-32 bg-white border border-slate-100 rounded-[2.5rem] text-center shadow-sm">
              <ShieldCheck size={64} className="mx-auto text-emerald-50 text-emerald-100 mb-6" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-1">Operational Integrity 100%</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Zero Outstanding Variances Detected</p>
           </div>
         ) : paginatedItems.map(item => {
           const isExpanded = expandedLogIds.has(item.id);
           const config = getStatusConfig(item);
           const priorityLevel = (item.monetaryValue || 0) > 200 ? 'CRITICAL' : (item.monetaryValue || 0) > 50 ? 'HIGH' : 'STANDARD';

           return (
             <div key={item.id} className={`bg-white border rounded-[2.5rem] shadow-sm transition-all duration-500 overflow-hidden ${isExpanded ? 'border-indigo-200 shadow-xl ring-4 ring-indigo-50/30' : 'border-slate-100 hover:border-indigo-100'}`}>
                <div 
                  onClick={() => toggleExpand(item.id)}
                  className={`p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer ${isExpanded ? 'bg-indigo-50/10' : 'hover:bg-slate-50/50'}`}
                >
                   <div className="flex items-center space-x-6 min-w-0 flex-1">
                      <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 shadow-inner transition-colors duration-500 ${priorityLevel === 'CRITICAL' ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-slate-50 border-slate-100 text-indigo-600'}`}>
                         {item.conditionOnReturn === 'Lost' ? <PackageX size={24}/> : item.conditionOnReturn === 'Damaged' ? <Hammer size={24}/> : <Wrench size={24}/>}
                      </div>
                      <div className="min-w-0 flex-1">
                         <div className="flex flex-wrap items-center gap-3 mb-2">
                            <h4 className="text-base font-black text-slate-900 uppercase tracking-tight truncate leading-none">{item.toolName}</h4>
                            <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase border tracking-tighter ${priorityLevel === 'CRITICAL' ? 'bg-rose-600 text-white border-rose-600' : 'bg-slate-900 text-white border-slate-900'}`}>{priorityLevel} PRIORITY</span>
                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 tabular-nums">x{item.quantity}</span>
                         </div>
                         <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center space-x-2">
                               <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-black text-[9px] text-indigo-600 shadow-sm">{item.staffName.charAt(0)}</div>
                               <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">{item.staffName}</span>
                            </div>
                            <div className="flex items-center space-x-1.5 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                               <Clock size={12} className="text-indigo-400" />
                               <span>Logged: {item.date}</span>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="flex items-center gap-6 md:justify-end shrink-0 border-t md:border-none pt-4 md:pt-0">
                      <div className="text-right hidden sm:block">
                         <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{config.desc}</p>
                         <div className={`px-3 py-1.5 rounded-xl border flex items-center justify-center gap-2 shadow-sm transition-all ${config.color}`}>
                            {config.icon}
                            <span className="text-[8.5px] font-black uppercase tracking-[0.1em]">{config.label}</span>
                         </div>
                      </div>
                      <ChevronDown size={24} className={`transition-transform duration-500 text-slate-300 ${isExpanded ? 'rotate-180 text-indigo-600' : ''}`} />
                   </div>
                </div>

                {isExpanded && (
                  <div className="px-8 pb-8 space-y-8 animate-in slide-in-from-top-4 duration-500">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-slate-50 p-6 rounded-[1.8rem] border border-slate-100 shadow-inner space-y-4">
                           <div className="flex items-center gap-2 text-indigo-600">
                              <Fingerprint size={16}/>
                              <span className="text-[10px] font-black uppercase tracking-widest">Case Forensics</span>
                           </div>
                           <div className="space-y-3">
                              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                 <span className="text-[8px] font-black text-slate-400 uppercase">Case ID</span>
                                 <span className="text-[10px] font-black text-slate-800 font-mono">#{item.id.split('-').pop()}</span>
                              </div>
                              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                 <span className="text-[8px] font-black text-slate-400 uppercase">Registry Ref</span>
                                 <span className="text-[10px] font-black text-slate-800">{item.toolId}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                 <span className="text-[8px] font-black text-slate-400 uppercase">Replacement Cost</span>
                                 <span className="text-[10px] font-black text-rose-600 tabular-nums">${item.monetaryValue || '0.00'}</span>
                              </div>
                           </div>
                        </div>

                        <div className="md:col-span-2 bg-white border border-slate-200 rounded-[1.8rem] p-6 shadow-sm space-y-4 flex flex-col">
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-indigo-600">
                                 <MessageSquare size={16}/>
                                 <span className="text-[10px] font-black uppercase tracking-widest">Contextual Trace History</span>
                              </div>
                              <span className="text-[7px] font-black bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded uppercase">Encrypted</span>
                           </div>
                           <div className="flex-1 bg-slate-50/50 rounded-2xl p-4 border border-slate-100 relative">
                              <p className="text-[11px] font-medium text-slate-600 italic leading-relaxed">
                                 "{item.comment || 'No contextual notes recorded.'}"
                              </p>
                           </div>
                        </div>
                     </div>

                     <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                           <button 
                             onClick={() => onVerify(item)}
                             className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-3 active:scale-95"
                           >
                              <ShieldCheck size={18}/>
                              <span>Registry Recovery Protocol</span>
                           </button>
                           
                           {item.escalationStatus !== 'Escalated-to-HR' && (
                             <button 
                               onClick={() => onResolve(item.id, 'hr_escalate', 'Case referred to HR for disciplinary determination.')}
                               className="px-10 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] hover:bg-rose-700 transition-all shadow-xl shadow-rose-100 flex items-center justify-center gap-3 active:scale-95"
                             >
                                <ShieldX size={18}/>
                                <span>Escalate to HR Vault</span>
                             </button>
                           )}
                        </div>

                        <div className="flex items-center space-x-3 text-slate-300">
                           <Shield size={14}/>
                           <span className="text-[8px] font-black uppercase tracking-widest">Authorized Resolution Access: {currentUser.accessLevel}</span>
                        </div>
                     </div>
                  </div>
                )}
             </div>
           );
         })}
      </div>

      <div className="px-8 py-5 bg-[#FAF9F6] border border-slate-100 rounded-[2.5rem] flex items-center justify-between mx-1 shadow-sm">
         <div className="flex items-center space-x-3 text-slate-400">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
            <span className="text-[8px] font-black uppercase tracking-widest">Active Resolution Hub Phase: {currentPage} / {totalPages || 1}</span>
         </div>
         
         <div className="flex items-center space-x-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all shadow-sm active:scale-90">
               <ChevronLeft size={18} />
            </button>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all shadow-sm active:scale-90">
               <ChevronRight size={18} />
            </button>
         </div>
      </div>
    </div>
  );
};

export default AccountabilityMonitor;
