
import React, { useState, useMemo } from 'react';
import { FileText, Briefcase, Paperclip, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { StaffDocument, Employee, BulletinAttachment } from '../../types';

interface HRArchivesTabProps {
  documents: StaffDocument[];
  isHRAdmin: boolean;
  currentUser: Employee;
  onShowUploadModal: () => void;
  onOpenAttachment: (att: BulletinAttachment) => void;
}

const HRArchivesTab: React.FC<HRArchivesTabProps> = ({ documents, isHRAdmin, currentUser, onShowUploadModal, onOpenAttachment }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(documents.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return documents.slice(start, start + itemsPerPage);
  }, [documents, currentPage]);

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center justify-between px-1 mb-2">
          <div className="flex items-center space-x-2 text-indigo-600">
             <Briefcase size={16} />
             <span className="text-[10px] font-black uppercase tracking-widest">Active Archives ({documents.length})</span>
          </div>
          {isHRAdmin && (
             <button 
               onClick={onShowUploadModal}
               className="flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#0F1135] transition-all shadow-xl shadow-indigo-100"
             >
                <Briefcase size={14}/><span>Commit New Record</span>
             </button>
          )}
       </div>

      <div className="bg-white border border-slate-100 shadow-xl rounded-[2rem] overflow-hidden">
         <div className="hidden md:grid grid-cols-12 bg-slate-50/80 backdrop-blur-md text-[8px] font-black text-slate-400 uppercase tracking-[0.25em] border-b border-slate-100 px-8 py-4">
            <div className="col-span-5">Archive Trace Identity</div>
            <div className="col-span-2 text-center">Filing Integrity</div>
            <div className="col-span-2 text-center">Artifacts</div>
            <div className="col-span-3 text-right">Archive Date</div>
         </div>
         <div className="divide-y divide-slate-50">
            {paginatedItems.length === 0 ? (
               <div className="py-24 text-center">
                  <FileText size={48} className="mx-auto text-slate-100 mb-4" />
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Institutional Vault Clear</p>
               </div>
            ) : paginatedItems.map(doc => (
              <div key={doc.id} className="group p-6 lg:px-8 lg:py-4 hover:bg-indigo-50/20 transition-all duration-300">
                 <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="col-span-1 md:col-span-5">
                       <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${doc.isBroadcast ? 'bg-[#0F1135] border-[#0F1135] text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 shadow-sm'}`}>
                             <FileText size={18} />
                          </div>
                          <div className="min-w-0">
                             <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight truncate group-hover:text-indigo-600 transition-colors">{doc.title}</h4>
                             <p className="text-[7.5px] font-black text-indigo-500 uppercase tracking-widest mt-1">{doc.type} • REPOSITORY ARCHIVE</p>
                          </div>
                       </div>
                    </div>
                    <div className="col-span-1 md:col-span-2 flex items-center md:justify-center">
                       <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded border ${doc.status === 'Signed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                          {doc.status}
                       </span>
                    </div>
                    <div className="col-span-1 md:col-span-2 text-center">
                       {doc.attachments && doc.attachments.length > 0 ? (
                         <div className="flex items-center justify-center space-x-1.5 text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100 w-fit mx-auto">
                            <Paperclip size={10} />
                            <span className="text-[8px] font-black uppercase">{doc.attachments.length} ASSETS</span>
                         </div>
                       ) : (
                         <span className="text-[7px] font-black text-slate-300 uppercase">NO FILES</span>
                       )}
                    </div>
                    <div className="col-span-1 md:col-span-3 text-right">
                       <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{doc.dateUploaded}</p>
                       <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest mt-1">REF: {doc.id.split('-').pop()}</p>
                    </div>
                 </div>
                 
                 {doc.attachments && doc.attachments.length > 0 && (
                   <div className="mt-4 flex flex-wrap gap-2 md:pl-14 animate-in slide-in-from-left-2">
                      {doc.attachments.map((att, i) => {
                         const isImg = att.url.startsWith('data:image/') || att.url.match(/\.(jpeg|jpg|gif|png|webp)$/i);
                         return (
                           <button 
                             key={i} 
                             onClick={() => onOpenAttachment(att)}
                             className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-slate-100 rounded-lg text-[7px] font-black uppercase text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm active:scale-95 group/btn"
                           >
                              {isImg ? <ImageIcon size={10} /> : <FileText size={10} />}
                              <span>{att.name}</span>
                           </button>
                         );
                      })}
                   </div>
                 )}
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
                     <span>Next Records</span>
                     <ChevronRight size={14} />
                  </button>
               </div>
            </div>
         )}
      </div>
    </div>
  );
};

export default HRArchivesTab;
