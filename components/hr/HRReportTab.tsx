import React, { useMemo, useState } from 'react';
import { 
  Printer, 
  ShieldCheck, 
  User, 
  History, 
  CheckCircle2, 
  FileText, 
  Briefcase,
  Stamp,
  Scale,
  MessageSquare,
  Eye,
  X,
  Search,
  FolderLock,
  Database,
  Fingerprint,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Archive,
  ArrowRight
} from 'lucide-react';
import { Employee, GrievanceRecord, PerformanceObservation, ToolUsageRecord, Bulletin, StaffDocument } from '../../types';

interface HRReportTabProps {
  currentUser: Employee;
  grievances?: GrievanceRecord[];
  observations?: PerformanceObservation[];
  toolLogs?: ToolUsageRecord[];
  bulletins?: Bulletin[];
  documents?: StaffDocument[];
}

const HRReportTab: React.FC<HRReportTabProps> = ({ 
  currentUser, 
  grievances = [], 
  observations = [], 
  toolLogs = [],
  bulletins = [],
  documents = []
}) => {
  const [isViewingReport, setIsViewingReport] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  
  const archiveEntries = useMemo(() => {
    const entries: any[] = [];

    // FIX: Comprehensive string casting for all backend data prior to .split() calls
    grievances.forEach(g => {
      entries.push({
        id: g.id,
        trace: `GRV-${String(g.id || '').split('-')?.pop() || '000'}`,
        category: 'GOVERNANCE',
        subject: g.subject,
        date: String(g.timestamp || '').split(' ')[0] || '---',
        context: g.response || g.message,
        status: g.status === 'Resolved' ? 'COMMITTED' : 'PENDING',
        priority: 'MEDIUM',
        icon: <MessageSquare size={18}/>,
        type: 'Support Case'
      });
    });

    observations.forEach(o => {
      if (o.isEscalatedToHR) {
        entries.push({
          id: o.id,
          trace: `OBS-${String(o.id || '').split('-')?.pop() || '000'}`,
          category: 'PERFORMANCE',
          subject: o.category,
          date: String(o.timestamp || '').split('T')[0] || '---',
          context: o.note,
          status: o.status === 'Resolved' ? 'COMMITTED' : 'AWARENESS',
          priority: o.isPositive ? 'LOW' : 'HIGH',
          icon: <User size={18}/>,
          type: 'Forensic sighting'
        });
      }
    });

    toolLogs.forEach(l => {
      if (l.escalationStatus === 'Escalated-to-HR' || l.escalationStatus === 'Resolved') {
        entries.push({
          id: l.id,
          trace: `AST-${String(l.id || '').split('-')?.pop() || '000'}`,
          category: 'ASSET CONTROL',
          subject: `${l.toolName} Variance`,
          date: l.discoveryDate || l.date,
          context: l.comment,
          status: l.escalationStatus === 'Resolved' ? 'COMMITTED' : 'RECOVERY',
          priority: 'CRITICAL',
          icon: <Briefcase size={18}/>,
          type: 'Technical Liability'
        });
      }
    });

    bulletins.forEach(b => {
      entries.push({
        id: b.id,
        trace: `NOT-${String(b.id || '').split('-')?.pop() || '000'}`,
        category: 'PROTOCOL',
        subject: b.title,
        date: b.date,
        context: b.content,
        status: 'PUBLISHED',
        priority: 'LOW',
        icon: <Megaphone size={18}/>,
        type: 'Institutional Notice'
      });
    });

    documents.forEach(d => {
      entries.push({
        id: d.id,
        trace: `DOC-${String(d.id || '').split('-')?.pop() || '000'}`,
        category: 'DOCUMENTATION',
        subject: d.title,
        date: d.dateUploaded,
        context: `Record Class: ${d.type}`,
        status: 'ARCHIVED',
        priority: 'MEDIUM',
        icon: <FileText size={18}/>,
        type: 'Technical Registry'
      });
    });

    return entries
      .filter(e => 
        (String(e.subject || '').toLowerCase()).includes(searchTerm.toLowerCase()) || 
        (String(e.trace || '').toLowerCase()).includes(searchTerm.toLowerCase()) ||
        (String(e.category || '').toLowerCase()).includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  }, [grievances, observations, toolLogs, bulletins, documents, searchTerm]);

  const totalPages = Math.ceil(archiveEntries.length / itemsPerPage);
  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return archiveEntries.slice(start, start + itemsPerPage);
  }, [archiveEntries, currentPage]);

  const stats = useMemo(() => {
    return {
      total: archiveEntries.length,
      committed: archiveEntries.filter(a => a.status === 'COMMITTED' || a.status === 'ARCHIVED').length,
      lastAudit: archiveEntries.length > 0 ? archiveEntries[0].date : '---'
    };
  }, [archiveEntries]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700 print:hidden">
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <div className="md:col-span-1 bg-[#0F1135] rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-1000"></div>
            <p className="text-[8px] font-black text-indigo-300 uppercase tracking-widest mb-4">Master Ledger</p>
            <h4 className="text-3xl font-black">{stats.total}</h4>
            <p className="text-[9px] font-bold text-slate-400 uppercase mt-2">Historical Instances</p>
         </div>
         <div className="md:col-span-3 bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-10">
               <div className="flex flex-col">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Committed Records</p>
                  <div className="flex items-center space-x-2">
                     <span className="text-xl font-black text-slate-900">{stats.committed}</span>
                     <CheckCircle2 size={16} className="text-emerald-500" />
                  </div>
               </div>
               <div className="h-10 w-px bg-slate-100"></div>
               <div className="flex flex-col">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Archive Integrity</p>
                  <span className="text-[10px] font-black text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">100% Trace-Link</span>
               </div>
               <div className="h-10 w-px bg-slate-100 hidden lg:block"></div>
               <div className="hidden lg:flex flex-col">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Latest Filing</p>
                  <span className="text-[10px] font-black text-slate-700 uppercase">{stats.lastAudit}</span>
               </div>
            </div>
            
            <button 
              onClick={() => setIsViewingReport(true)}
              className="flex items-center space-x-3 px-8 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl active:scale-95"
            >
               <Eye size={16}/>
               <span>View Executive Report</span>
            </button>
         </div>
      </div>

      <div className="flex items-center space-x-4 bg-white border border-slate-100 rounded-2xl p-3 shadow-sm mx-1">
         <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search Master Ledger by Trace ID, Topic, or Unit..."
              className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-4 py-2.5 text-[8px] font-black uppercase tracking-widest text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 shadow-inner"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
         </div>
         <div className="flex items-center space-x-2 text-slate-300 px-2">
            <Archive size={16} />
            <span className="text-[8px] font-black uppercase">Institutional Forensic View</span>
         </div>
      </div>

      <div className="bg-white border border-slate-100 shadow-xl rounded-[2.5rem] overflow-hidden mx-1">
         <div className="hidden lg:grid grid-cols-12 bg-slate-50/80 backdrop-blur-md text-[8px] font-black text-slate-400 uppercase tracking-[0.25em] border-b border-slate-100 px-10 py-5">
            <div className="col-span-3">Trace Identity</div>
            <div className="col-span-3">Archived Context</div>
            <div className="col-span-2 text-center">Archive Class</div>
            <div className="col-span-2 text-center">Filing Status</div>
            <div className="col-span-2 text-right">Commit Stamp</div>
         </div>

         <div className="divide-y divide-slate-50">
            {paginatedEntries.length === 0 ? (
               <div className="py-32 text-center">
                  <Database size={48} className="mx-auto text-slate-100 mb-4" />
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.4em]">Historical Registry Clear</p>
               </div>
            ) : paginatedEntries.map((entry, idx) => (
               <div key={idx} className="group px-6 py-6 lg:px-10 lg:py-4 hover:bg-indigo-50/20 transition-all duration-300">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                     
                     <div className="col-span-1 lg:col-span-3">
                        <div className="flex items-center space-x-4">
                           <div className={`w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center shadow-sm shrink-0 transition-all duration-500 group-hover:shadow-indigo-100 ${entry.priority === 'CRITICAL' ? 'text-rose-600' : 'text-indigo-600'}`}>
                              {entry.icon}
                           </div>
                           <div className="min-w-0">
                              <p className="text-sm font-black text-slate-900 uppercase tracking-tight truncate leading-none">{entry.trace}</p>
                              <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mt-1.5">UID: {String(entry.id || '').split('-')?.pop() || '000'}</p>
                           </div>
                        </div>
                     </div>

                     <div className="col-span-1 lg:col-span-3 flex items-center lg:block">
                        <span className="lg:hidden text-[8px] font-black text-slate-300 uppercase tracking-widest w-20 shrink-0">Topic:</span>
                        <div className="min-w-0">
                           <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-tight truncate leading-none">{entry.subject}</h4>
                           <p className="text-[9px] font-medium text-slate-400 mt-1 line-clamp-1 italic pr-4">"{entry.context}"</p>
                        </div>
                     </div>

                     <div className="col-span-1 lg:col-span-2 text-center flex items-center lg:block">
                        <span className="lg:hidden text-[8px] font-black text-slate-300 uppercase tracking-widest w-20 shrink-0">Type:</span>
                        <div className="flex items-center justify-center space-x-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/30"></div>
                           <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider">{entry.category}</span>
                        </div>
                     </div>

                     <div className="col-span-1 lg:col-span-2 text-center flex items-center lg:block">
                        <span className="lg:hidden text-[8px] font-black text-slate-300 uppercase tracking-widest w-20 shrink-0">Status:</span>
                        <div className="flex items-center justify-center">
                           <span className={`px-2 py-0.5 rounded-[4px] text-[7.5px] font-black uppercase tracking-widest border ${
                              entry.status === 'COMMITTED' || entry.status === 'PUBLISHED' || entry.status === 'ARCHIVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                           }`}>
                              {entry.status}
                           </span>
                        </div>
                     </div>

                     <div className="col-span-1 lg:col-span-2 text-right flex items-center lg:block justify-between border-t lg:border-none pt-4 lg:pt-0">
                        <span className="lg:hidden text-[8px] font-black text-slate-300 uppercase tracking-widest">Date:</span>
                        <div className="flex flex-col items-end">
                           <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight leading-none">{entry.date}</p>
                           <div className="flex items-center space-x-1.5 mt-1.5">
                              <Fingerprint size={10} className="text-indigo-400/50" />
                              <span className="text-[6.5px] font-black text-slate-300 uppercase tracking-[0.2em]">VERIFIED</span>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            ))}
         </div>

         <div className="px-10 py-5 bg-[#FAF9F6] border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-3 text-slate-400">
               <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
               <span className="text-[8px] font-black uppercase tracking-widest">Master Ledger Phase: {currentPage} / {totalPages || 1}</span>
            </div>
            
            <div className="flex items-center space-x-2">
               <button 
                 onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                 disabled={currentPage === 1}
                 className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all shadow-sm active:scale-90"
               >
                  <ChevronLeft size={18} />
               </button>
               <button 
                 onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                 disabled={currentPage === totalPages || totalPages === 0}
                 className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all shadow-sm active:scale-90"
               >
                  <ChevronRight size={18} />
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default HRReportTab;