
import React, { useState, useMemo } from 'react';
import { ShieldCheck, UserCheck, PackageX, History, User, ChevronLeft, ChevronRight } from 'lucide-react';

interface CaseFile {
  id: string;
  staffId: string;
  staffName: string;
  type: 'Behavioral' | 'Asset Liability';
  category: string;
  date: string;
  summary: string;
  priority: string;
  source: string; 
  raw: any;
}

interface CasesTabProps {
  cases: CaseFile[];
  onReview: (caseFile: CaseFile) => void;
}

const CasesTab: React.FC<CasesTabProps> = ({ cases, onReview }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(cases.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return cases.slice(start, start + itemsPerPage);
  }, [cases, currentPage]);

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
       <div className="flex items-center justify-between px-1 mb-2">
          <div className="flex items-center space-x-2 text-rose-600">
             <ShieldCheck size={16} />
             <span className="text-[10px] font-black uppercase tracking-widest">Escalated Priority Cases ({cases.length})</span>
          </div>
       </div>

       <div className="bg-white border border-slate-100 shadow-xl rounded-[2rem] overflow-hidden">
         <div className="hidden md:grid grid-cols-12 bg-slate-50/80 backdrop-blur-md text-[8px] font-black text-slate-400 uppercase tracking-[0.25em] border-b border-slate-100 px-8 py-4">
            <div className="col-span-5">Personnel Identity</div>
            <div className="col-span-4 text-center">Escalation Source</div>
            <div className="col-span-3 text-right">Filing Trace</div>
         </div>
         <div className="divide-y divide-slate-50">
            {paginatedItems.length === 0 ? (
               <div className="py-24 text-center">
                  <ShieldCheck size={48} className="mx-auto text-slate-100 mb-4" />
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Forensic Case-files Synchronized</p>
               </div>
            ) : paginatedItems.map((caseFile) => (
              <div key={caseFile.id} className="p-6 lg:px-8 lg:py-5 hover:bg-indigo-50/5 transition-all group">
                 <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                    <div className="col-span-1 md:col-span-5">
                       <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner border transition-all ${caseFile.type === 'Behavioral' ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                             {caseFile.type === 'Behavioral' ? <UserCheck size={18} /> : <PackageX size={18} />}
                          </div>
                          <div className="min-w-0">
                             <h5 className="text-sm font-black text-slate-900 uppercase tracking-tight truncate group-hover:text-indigo-600 transition-colors">{caseFile.staffName}</h5>
                             <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest mt-1">CODE: {caseFile.staffId}</p>
                          </div>
                       </div>
                    </div>
                    <div className="col-span-1 md:col-span-4 text-center flex items-center lg:block">
                       <span className="lg:hidden text-[8px] font-black text-slate-300 uppercase tracking-widest w-24 shrink-0 text-left">Source:</span>
                       <div className="flex flex-col items-center">
                          <div className="flex items-center space-x-1.5 px-3 py-1 bg-white border border-slate-100 rounded-lg shadow-sm">
                             <User size={10} className="text-indigo-400" />
                             <span className="text-[8.5px] font-black text-slate-700 uppercase tracking-tight truncate max-w-[150px]">
                                {caseFile.source}
                             </span>
                          </div>
                          <p className="text-[6.5px] font-black text-slate-300 uppercase mt-1.5 tracking-widest">{caseFile.category}</p>
                       </div>
                    </div>
                    <div className="col-span-1 md:col-span-3 text-right flex items-center lg:block justify-between">
                       <span className="lg:hidden text-[8px] font-black text-slate-300 uppercase tracking-widest">Date:</span>
                       <div>
                          <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{caseFile.date}</p>
                          <p className={`text-[7px] font-black uppercase tracking-tighter mt-1 px-1.5 py-0.5 rounded inline-block ${caseFile.type === 'Behavioral' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                             {caseFile.type}
                          </p>
                       </div>
                    </div>
                 </div>
                 <div className={`mt-4 p-4 rounded-2xl border text-[10px] font-bold italic transition-all group-hover:bg-white ${caseFile.type === 'Behavioral' ? 'bg-slate-50 border-slate-100 text-slate-600' : 'bg-rose-50/50 border-rose-100 text-rose-800'}`}>
                    "{caseFile.summary}"
                 </div>
                 <div className="flex justify-end mt-4 gap-3">
                    <button 
                      onClick={() => onReview(caseFile)}
                      className="px-6 py-2.5 bg-[#0F1135] text-white rounded-xl text-[8.5px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg active:scale-95 flex items-center gap-2"
                    >
                       <History size={14} />
                       <span>Analyze Case</span>
                    </button>
                 </div>
              </div>
            ))}
         </div>

         {/* NEXT CONTROLS */}
         {totalPages > 1 && (
            <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Phase {currentPage} / {totalPages}</span>
               <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all active:scale-90"
                  >
                     <ChevronLeft size={16} />
                  </button>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center space-x-2 px-5 py-2 bg-[#0F1135] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-90 disabled:opacity-30"
                  >
                     <span>Next Case Files</span>
                     <ChevronRight size={14} />
                  </button>
               </div>
            </div>
         )}
       </div>
    </div>
  );
};

export default CasesTab;
