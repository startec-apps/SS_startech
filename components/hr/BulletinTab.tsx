
import React, { useState, useMemo } from 'react';
import { Megaphone, Plus, Paperclip, Image as ImageIcon, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { Bulletin, BulletinAttachment } from '../../types';

interface BulletinTabProps {
  bulletins: Bulletin[];
  isHRAdmin: boolean;
  onShowPostModal: () => void;
  onOpenAttachment: (att: BulletinAttachment) => void;
}

const BulletinTab: React.FC<BulletinTabProps> = ({ bulletins, isHRAdmin, onShowPostModal, onOpenAttachment }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(bulletins.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return bulletins.slice(start, start + itemsPerPage);
  }, [bulletins, currentPage]);

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
       <div className="flex items-center justify-between px-1 mb-2">
          <div className="flex items-center space-x-2 text-indigo-600">
             <Megaphone size={16} />
             <span className="text-[10px] font-black uppercase tracking-widest">Active Bulletins ({bulletins.length})</span>
          </div>
          {isHRAdmin && (
             <button 
               onClick={onShowPostModal}
               className="flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#0F1135] transition-all shadow-xl shadow-indigo-100"
             >
                <Plus size={14}/><span>Broadcast New Protocol</span>
             </button>
          )}
       </div>

       <div className="bg-white border border-slate-100 shadow-xl rounded-[2rem] overflow-hidden">
         <div className="hidden md:grid grid-cols-12 bg-slate-50/80 backdrop-blur-md text-[8px] font-black text-slate-400 uppercase tracking-[0.25em] border-b border-slate-100 px-8 py-4">
            <div className="col-span-5">Notice Identification</div>
            <div className="col-span-2 text-center">Protocol Class</div>
            <div className="col-span-2 text-center">Resources</div>
            <div className="col-span-3 text-right">Archive Date</div>
         </div>
         <div className="divide-y divide-slate-50">
           {paginatedItems.length === 0 ? (
              <div className="py-24 text-center">
                 <Megaphone size={48} className="mx-auto text-slate-100 mb-4" />
                 <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">No Active Notices</p>
              </div>
           ) : paginatedItems.map(b => (
              <div key={b.id} className="group p-6 lg:px-8 lg:py-4 hover:bg-indigo-50/20 transition-all duration-300">
                 <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="col-span-1 md:col-span-5">
                       <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-indigo-600 shrink-0 shadow-sm transition-all group-hover:shadow-indigo-100">
                             <Megaphone size={16} />
                          </div>
                          <div className="min-w-0">
                             <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight truncate group-hover:text-indigo-600 transition-colors">{b.title}</h4>
                             <p className="text-[10px] font-medium text-slate-500 line-clamp-1 mt-1">{b.content}</p>
                          </div>
                       </div>
                    </div>
                    <div className="col-span-1 md:col-span-2 flex items-center md:justify-center">
                       <span className="px-3 py-1 rounded-lg text-[8px] font-black uppercase border tracking-widest bg-slate-50 text-slate-500 border-slate-100">
                          {b.type}
                       </span>
                    </div>
                    <div className="col-span-1 md:col-span-2 text-center">
                       {b.attachments && b.attachments.length > 0 ? (
                         <div className="flex items-center justify-center space-x-1.5 text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100 w-fit mx-auto">
                            <Paperclip size={10} />
                            <span className="text-[8px] font-black uppercase">{b.attachments.length} ARTIFACTS</span>
                         </div>
                       ) : (
                         <span className="text-[7px] font-black text-slate-300 uppercase">NO ASSETS</span>
                       )}
                    </div>
                    <div className="col-span-1 md:col-span-3 text-right">
                       <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{b.date}</p>
                       <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest mt-1">SOURCE: {b.postedBy}</p>
                    </div>
                 </div>
                 
                 {b.attachments && b.attachments.length > 0 && (
                   <div className="mt-4 flex flex-wrap gap-2 md:pl-14">
                      {b.attachments.map((att, i) => {
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
                     <span>Next Notices</span>
                     <ChevronRight size={14} />
                  </button>
               </div>
            </div>
         )}
       </div>
    </div>
  );
};

export default BulletinTab;
