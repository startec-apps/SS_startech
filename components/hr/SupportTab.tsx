
import React, { useState, useMemo } from 'react';
import { 
  MessageSquare, 
  Send, 
  User, 
  ShieldCheck, 
  Lock, 
  Eye, 
  ShieldAlert, 
  History, 
  Scale, 
  AlertCircle,
  Clock,
  UserX,
  FileCheck,
  ChevronRight,
  Globe,
  Info,
  ChevronLeft
} from 'lucide-react';
import { GrievanceRecord, Employee, SupportCategory } from '../../types';

interface SupportTabProps {
  grievances: GrievanceRecord[];
  currentUser: Employee;
  onPostGrievance: (g: GrievanceRecord) => Promise<void>;
  onResolveGrievance: (id: string, ruling: string, isPublic: boolean) => Promise<void>;
}

const SupportTab: React.FC<SupportTabProps> = ({ grievances, currentUser, onPostGrievance, onResolveGrievance }) => {
  const [newGrievance, setNewGrievance] = useState({ 
    subject: '', 
    message: '', 
    category: 'Policy Clarification' as SupportCategory, 
    isAnonymous: false 
  });
  
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [rulingText, setRulingText] = useState('');
  const [isPublicRuling, setIsPublicRuling] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const isHR = currentUser.accessLevel === 'Admin' || currentUser.accessLevel === 'HR';
  const categories: SupportCategory[] = ['Policy Clarification', 'Safety Concern', 'Welfare/Payroll', 'Whistleblower', 'Other'];

  const handleSubmit = async () => {
    if (!newGrievance.subject || !newGrievance.message) return;
    
    const record: GrievanceRecord = {
      id: `GRV-${Date.now()}`,
      staffId: currentUser.id,
      staffName: currentUser.name,
      category: newGrievance.category,
      subject: newGrievance.subject,
      message: newGrievance.message,
      timestamp: new Date().toLocaleString(),
      status: 'Pending',
      isAnonymous: newGrievance.isAnonymous
    };

    await onPostGrievance(record);
    setNewGrievance({ subject: '', message: '', category: 'Policy Clarification', isAnonymous: false });
  };

  const handleResolve = async (id: string) => {
    if (!rulingText) return;
    const timestamp = new Date().toLocaleString();
    const forensicRuling = `[AUTHORIZED BY: ${currentUser.name} | DATE: ${timestamp}] — ${rulingText}`;
    
    await onResolveGrievance(id, forensicRuling, isPublicRuling);
    setResolvingId(null);
    setRulingText('');
    setIsPublicRuling(false);
  };

  const totalPages = Math.ceil(grievances.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return grievances.slice(start, start + itemsPerPage);
  }, [grievances, currentPage]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
       {!isHR && (
         <div className="bg-white border border-indigo-100 rounded-[2.5rem] shadow-xl overflow-hidden">
            <div className="px-8 py-6 bg-slate-900 text-white flex items-center justify-between">
               <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg"><MessageSquare size={24}/></div>
                  <div>
                     <h3 className="text-sm font-black uppercase tracking-widest">Institutional Inquiry Portal</h3>
                     <p className="text-[8px] text-indigo-300 font-bold uppercase tracking-[0.2em] mt-1">Submit Formal Case for Review</p>
                  </div>
               </div>
               <div className="flex items-center space-x-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                  <Lock size={12} className="text-emerald-400" />
                  <span className="text-[8px] font-black uppercase tracking-widest">AES-256 Encrypted</span>
               </div>
            </div>

            <div className="p-8 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Case Subject</label>
                     <input 
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-[10px] font-black uppercase text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500" 
                        placeholder="E.G. OVERTIME MULTIPLIER QUERY"
                        value={newGrievance.subject}
                        onChange={e => setNewGrievance({...newGrievance, subject: e.target.value})}
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Classification</label>
                     <select 
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-[10px] font-black uppercase text-slate-700 outline-none cursor-pointer"
                        value={newGrievance.category}
                        onChange={e => setNewGrievance({...newGrievance, category: e.target.value as SupportCategory})}
                     >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                     </select>
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Narrative Context</label>
                  <textarea 
                     className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-[10px] font-bold text-slate-700 outline-none h-32 focus:ring-2 focus:ring-indigo-500" 
                     placeholder="State factual details for administrative review..."
                     value={newGrievance.message}
                     onChange={e => setNewGrievance({...newGrievance, message: e.target.value})}
                  />
               </div>

               <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                  <button 
                     onClick={() => setNewGrievance({...newGrievance, isAnonymous: !newGrievance.isAnonymous})}
                     className={`flex items-center space-x-3 px-6 py-3 rounded-2xl border transition-all ${newGrievance.isAnonymous ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-inner' : 'bg-white border-slate-200 text-slate-400'}`}
                  >
                     {newGrievance.isAnonymous ? <UserX size={18}/> : <User size={18}/>}
                     <div className="text-left">
                        <p className="text-[9px] font-black uppercase leading-none">{newGrievance.isAnonymous ? 'Whistleblower Mode' : 'Standard Submission'}</p>
                        <p className="text-[7px] font-bold uppercase mt-1 opacity-70">{newGrievance.isAnonymous ? 'Identity Masked from Unit' : 'Identity Logged in Trace'}</p>
                     </div>
                  </button>

                  <button 
                     onClick={handleSubmit}
                     disabled={!newGrievance.subject || !newGrievance.message}
                     className="w-full sm:w-auto px-12 py-4 bg-[#0F1135] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-indigo-600 shadow-2xl transition-all flex items-center justify-center space-x-3 disabled:opacity-40"
                  >
                     <Send size={16} />
                     <span>Commit Submission</span>
                  </button>
               </div>
            </div>
         </div>
       )}

       <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
             <div className="flex items-center space-x-3">
                <History size={20} className="text-indigo-600" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Active Support Tickets ({grievances.length})</h3>
             </div>
          </div>

          <div className="space-y-4">
             {paginatedItems.length === 0 ? (
                <div className="py-32 bg-white border border-slate-100 rounded-[2.5rem] text-center">
                   <ShieldCheck size={48} className="mx-auto text-slate-100 mb-4" />
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">No Active Cases Found</p>
                </div>
             ) : paginatedItems.map(record => {
                const isMyGrievance = record.staffId === currentUser.id;
                const showIdentity = isHR || isMyGrievance || !record.isAnonymous;
                const isPending = record.status === 'Pending';

                return (
                  <div key={record.id} className="bg-white border border-slate-100 rounded-[2.2rem] shadow-sm hover:shadow-md transition-all overflow-hidden">
                     <div className="p-6 md:p-8 space-y-6">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                           <div className="flex items-center space-x-4">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                                 record.category === 'Whistleblower' ? 'bg-rose-600' : 'bg-[#0F1135]'
                              }`}>
                                 {record.isAnonymous ? <Lock size={22}/> : <User size={22}/>}
                              </div>
                              <div className="min-w-0">
                                 <div className="flex items-center space-x-3 mb-1.5">
                                    <h4 className="text-base font-black text-slate-900 uppercase tracking-tight truncate">{record.subject}</h4>
                                    <span className={`px-2.5 py-1 rounded-lg text-[7px] font-black uppercase border tracking-widest ${
                                       record.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse'
                                    }`}>
                                       {record.status}
                                    </span>
                                 </div>
                                 <div className="flex flex-wrap items-center gap-3">
                                    <span className="text-[7.5px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase">{record.category}</span>
                                    <span className="text-slate-300">|</span>
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{showIdentity ? record.staffName : 'ANONYMOUS CUSTODIAN'}</span>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest flex items-center"><Clock size={10} className="mr-1"/> {record.timestamp}</span>
                                 </div>
                              </div>
                           </div>

                           {isHR && isPending && (
                             <button 
                                onClick={() => setResolvingId(record.id)}
                                className="w-full md:w-auto px-8 py-3 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl active:scale-95 flex items-center justify-center space-x-2"
                             >
                                <Scale size={14} />
                                <span>Provide Ruling</span>
                             </button>
                           )}
                        </div>

                        <div className="bg-slate-50 p-6 rounded-[1.8rem] border border-slate-100 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700"></div>
                           <p className="text-[11px] font-medium text-slate-600 leading-relaxed italic relative z-10 pr-4">
                              "{record.message}"
                           </p>
                        </div>

                        {(record.response || resolvingId === record.id) && (
                          <div className="mt-8 border-t border-slate-50 pt-8 animate-in slide-in-from-top-2">
                             <div className="flex items-center space-x-3 mb-6 px-1">
                                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 shadow-inner"><FileCheck size={16}/></div>
                                <div>
                                   <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Institutional Ruling</h5>
                                   <p className="text-[7px] font-bold text-slate-400 uppercase mt-0.5">Formal Administrative Verdict</p>
                                </div>
                             </div>

                             {resolvingId === record.id ? (
                               <div className="space-y-4 bg-indigo-50/30 p-6 rounded-[2rem] border border-indigo-100 shadow-inner">
                                  <textarea 
                                     className="w-full bg-white border border-indigo-100 rounded-2xl px-6 py-5 text-[10px] font-bold text-slate-700 outline-none h-32 focus:ring-2 focus:ring-emerald-500 shadow-sm"
                                     placeholder="Detail the official resolution and SOP alignment..."
                                     value={rulingText}
                                     onChange={e => setRulingText(e.target.value)}
                                  />
                                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                     <button 
                                        onClick={() => setIsPublicRuling(!isPublicRuling)}
                                        className={`flex items-center space-x-2.5 px-5 py-2.5 rounded-xl border transition-all ${isPublicRuling ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-200'}`}
                                     >
                                        {isPublicRuling ? <Globe size={14}/> : <Lock size={14}/>}
                                        <span className="text-[8px] font-black uppercase tracking-widest">{isPublicRuling ? 'Public Broadcast Ruling' : 'Private Archive Ruling'}</span>
                                     </button>
                                     <div className="flex items-center gap-3 w-full sm:w-auto">
                                        <button onClick={() => setResolvingId(null)} className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[8.5px] font-black text-slate-400 uppercase tracking-widest hover:bg-white transition-colors">Abort</button>
                                        <button 
                                           onClick={() => handleResolve(record.id)}
                                           className="flex-1 sm:flex-none px-10 py-2.5 bg-emerald-600 text-white rounded-xl text-[8.5px] font-black uppercase tracking-widest hover:bg-[#0F1135] shadow-xl active:scale-95 transition-all"
                                        >
                                           Authorize & Resolve
                                        </button>
                                     </div>
                                  </div>
                               </div>
                             ) : (
                               <div className="bg-[#FAF9F6] border border-amber-100 p-8 rounded-[2rem] relative shadow-inner overflow-hidden">
                                  <div className="absolute top-4 right-4 opacity-5"><FileCheck size={120} /></div>
                                  <div className="flex items-center justify-between mb-4 relative z-10">
                                     <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 rounded-lg bg-[#0F1135] text-white flex items-center justify-center font-black text-[10px] shadow-md">{record.responderName?.charAt(0) || 'H'}</div>
                                        <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight leading-none">{record.responderName || 'HR MANAGEMENT'}</p>
                                     </div>
                                     {record.isPublicResponse && (
                                       <span className="text-[7px] font-black text-indigo-600 uppercase flex items-center bg-indigo-50 px-2 py-1 rounded border border-indigo-100"><Globe size={10} className="mr-1"/> Public Resource</span>
                                     )}
                                  </div>
                                  <p className="text-[11px] font-bold text-slate-800 leading-[1.8] relative z-10">
                                     {record.response}
                                  </p>
                                  <div className="mt-6 flex items-center space-x-2 opacity-30 relative z-10">
                                     <ShieldCheck size={12}/>
                                     <span className="text-[7px] font-black uppercase tracking-[0.3em]">Verified Institutional Resolution</span>
                                  </div>
                               </div>
                             )}
                          </div>
                        )}
                     </div>
                  </div>
                );
             })}
          </div>

          {/* NEXT CONTROLS */}
          {totalPages > 1 && (
             <div className="px-8 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center justify-between">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Phase {currentPage} / {totalPages}</span>
                <div className="flex items-center space-x-2">
                   <button 
                     onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                     disabled={currentPage === 1}
                     className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all active:scale-90"
                   >
                      <ChevronLeft size={16} />
                   </button>
                   <button 
                     onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                     disabled={currentPage === totalPages}
                     className="flex items-center space-x-2 px-5 py-2 bg-[#0F1135] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-90 disabled:opacity-30"
                   >
                      <span>Next Cases</span>
                      <ChevronRight size={14} />
                   </button>
                </div>
             </div>
          )}
       </div>
    </div>
  );
};

export default SupportTab;
