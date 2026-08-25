import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Send, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  Scale, 
  Info,
  Clock,
  Briefcase,
  ChevronRight,
  UserCheck,
  MessageSquare,
  Search,
  Filter,
  Eye,
  Trash2,
  Globe,
  ChevronDown,
  ArrowUpRight,
  Stamp,
  Activity,
  XCircle
} from 'lucide-react';
import { Employee, EngagementInquiry, EngagementStatus } from '../../types';

interface EngagementHubProps {
  currentUser: Employee;
  inquiries: EngagementInquiry[];
  setInquiries: React.Dispatch<React.SetStateAction<EngagementInquiry[]>>;
  setSystemBusy: (busy: boolean) => void;
}

const EngagementHub: React.FC<EngagementHubProps> = ({ currentUser, inquiries, setInquiries, setSystemBusy }) => {
  const [newInquiry, setNewInquiry] = useState({ subject: '', message: '' });
  const [filter, setFilter] = useState<EngagementStatus | 'ALL'>('ALL');
  
  const isAdmin = currentUser.accessLevel === 'Admin';
  const canCurate = currentUser.permissions?.includes('hr-vault_engagement_curate') || isAdmin;
  const isDirector = currentUser.permissions?.includes('hr-vault_engagement_directors') || isAdmin;
  const isHR = currentUser.accessLevel === 'HR' || isAdmin;

  const handleStaffSubmit = async () => {
    if (!newInquiry.subject || !newInquiry.message) return;
    setSystemBusy(true);
    const inquiry: EngagementInquiry = {
      id: `ENQ-${Date.now()}`,
      staffId: currentUser.id,
      subject: newInquiry.subject,
      message: newInquiry.message,
      timestamp: new Date().toLocaleString(),
      status: 'Submitted',
      isEscalated: false
    };

    try {
      setInquiries(prev => [inquiry, ...prev]);
      setNewInquiry({ subject: '', message: '' });
      alert("Inquiry Submitted.");
    } finally { setSystemBusy(false); }
  };

  const handleUpdateStatus = async (id: string, nextStatus: EngagementStatus, updates: Partial<EngagementInquiry> = {}) => {
    const target = inquiries.find(i => i.id === id);
    if (!target) return;

    setSystemBusy(true);
    const updated: EngagementInquiry = { ...target, status: nextStatus, ...updates };

    try {
      setInquiries(prev => prev.map(i => i.id === id ? updated : i));
    } finally { 
      setSystemBusy(false); 
    }
  };

  const filteredInquiries = useMemo(() => {
    const list = filter === 'ALL' ? inquiries : inquiries.filter(i => i.status === filter);
    if (!canCurate && !isHR && !isDirector) return list.filter(i => i.status === 'Published');
    return list;
  }, [inquiries, filter, canCurate, isHR, isDirector]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-full">
      <div className="bg-white border border-indigo-100 rounded-[2.5rem] shadow-xl overflow-hidden">
        <div className="px-8 py-6 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><Users size={24}/></div>
              <div>
                  <h3 className="text-sm font-black uppercase tracking-tight leading-none">Engagement Portal</h3>
                  <p className="text-[8px] text-indigo-300 font-bold uppercase tracking-[0.2em] mt-2">Personnel Inquiries</p>
              </div>
            </div>
            <div className="bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 flex items-center space-x-2">
              <Lock size={12} className="text-emerald-400" />
              <span className="text-[8px] font-black uppercase tracking-widest">Secure Submission</span>
            </div>
        </div>
        <div className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Inquiry Subject</label>
              <input 
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-black uppercase text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-300" 
                placeholder="SUBJECT"
                value={newInquiry.subject}
                onChange={e => setNewInquiry({...newInquiry, subject: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Inquiry Details</label>
              <textarea 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-sm font-bold text-slate-700 outline-none min-h-[120px] focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-300" 
                placeholder="Details..."
                value={newInquiry.message}
                onChange={e => setNewInquiry({...newInquiry, message: e.target.value})}
              />
            </div>
            <button 
              onClick={handleStaffSubmit}
              disabled={!newInquiry.subject || !newInquiry.message}
              className="w-full py-4 bg-[#0F1135] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-indigo-600 shadow-2xl transition-all disabled:opacity-40 active:scale-[0.99]"
            >
              Submit Inquiry
            </button>
        </div>
      </div>

      {(canCurate || isHR || isDirector) && (
        <div className="space-y-6">
           <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-2">
              <div className="flex items-center space-x-3 self-start">
                 <Scale size={20} className="text-indigo-600" />
                 <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">Inquiry Management</h3>
              </div>
              <div className="flex bg-white p-1 rounded-xl border border-slate-100 shadow-sm overflow-x-auto no-scrollbar max-w-full">
                 {['ALL', 'Submitted', 'EEC_Review', 'HR_Pending', 'Director_Wait', 'Published'].map(s => (
                   <button 
                    key={s} 
                    onClick={() => setFilter(s as any)}
                    className={`px-4 py-2 rounded-lg text-[7.5px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter === s ? 'bg-[#0F1135] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                   >
                     {s.replace('_', ' ')}
                   </button>
                 ))}
              </div>
           </div>

           <div className="space-y-6">
              {filteredInquiries.length === 0 ? (
                <div className="py-24 bg-white border border-slate-100 rounded-[2.5rem] text-center shadow-sm">
                   <CheckCircle2 size={48} className="mx-auto text-slate-100 mb-4" />
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Queue Clear</p>
                </div>
              ) : filteredInquiries.map(inq => (
                <InquiryGovernanceCard 
                  key={inq.id} 
                  inquiry={inq} 
                  currentUser={currentUser} 
                  onAction={handleUpdateStatus}
                  isDirector={isDirector}
                  canCurate={canCurate}
                  isHR={isHR}
                  isAdmin={isAdmin}
                />
              ))}
           </div>
        </div>
      )}

      <div className="space-y-6">
          <div className="flex items-center space-x-3 px-2">
            <Globe size={18} className="text-indigo-600" />
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">Published Guidance</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {inquiries.filter(i => i.status === 'Published').length === 0 ? (
               <div className="md:col-span-2 py-16 bg-slate-50 border border-dashed border-slate-200 rounded-[2.5rem] text-center">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No Active Guidance</p>
               </div>
            ) : inquiries.filter(i => i.status === 'Published').map(inq => (
                <div key={inq.id} className="bg-white border border-slate-100 p-6 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all flex flex-col">
                  <div className="flex items-center justify-between mb-5">
                      <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 uppercase tracking-widest">RELEASED: {inq.publishedDate}</span>
                      <CheckCircle2 size={16} className="text-emerald-500" />
                  </div>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-3 leading-tight">{inq.subject}</h4>
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-5">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Technical Question:</p>
                      <p className="text-[11px] font-medium text-slate-600 italic leading-relaxed">"{inq.message}"</p>
                  </div>
                  <div className="space-y-1.5 mt-auto">
                      <p className="text-[8px] font-black text-indigo-600 uppercase tracking-widest mb-1.5 flex items-center">
                        <ShieldCheck size={10} className="mr-1.5" /> Response:
                      </p>
                      <p className="text-[11px] font-bold text-slate-800 leading-relaxed border-l-2 border-indigo-200 pl-4">{inq.finalGuidance}</p>
                  </div>
                </div>
            ))}
          </div>
      </div>
    </div>
  );
};

const InquiryGovernanceCard = ({ inquiry, currentUser, onAction, isDirector, canCurate, isHR, isAdmin }: any) => {
  const [answer, setAnswer] = useState('');
  const matchesStatus = (s: string) => inquiry.status?.toLowerCase() === s.toLowerCase();

  const stages = [
    { id: 'Submitted', label: 'Submit', color: 'bg-indigo-600' },
    { id: 'EEC_Review', label: 'EEC Vet', color: 'bg-amber-500' },
    { id: 'HR_Pending', label: 'HR Admin', color: 'bg-emerald-600' },
    { id: 'Director_Wait', label: 'Director', color: 'bg-rose-600' },
    { id: 'Published', label: 'Released', color: 'bg-slate-900' }
  ];

  const currentStageIdx = stages.findIndex(s => s.id.toLowerCase() === (inquiry.status?.toLowerCase() || ''));

  const handleDismiss = async () => {
    if (confirm("Permanent dismissal of this inquiry?")) {
      try {
        await onAction(inquiry.id, 'Published', { 
          finalGuidance: 'Inquiry closed. Determined out of scope.', 
          publishedDate: new Date().toLocaleDateString() 
        });
      } catch (e) {
        console.error("Dismissal Failure:", e);
      }
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
       <div className="bg-slate-50 border-b border-slate-100 px-8 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 w-full max-w-lg">
             {stages.map((stage, idx) => (
               <React.Fragment key={stage.id}>
                  <div className="flex flex-col items-center gap-1 group relative">
                     <div className={`w-3 h-3 rounded-full border-2 transition-all duration-700 ${
                       idx <= currentStageIdx ? `${stage.color} border-white shadow-sm scale-110` : 'bg-white border-slate-200'
                     }`}></div>
                     <span className={`text-[6px] font-black uppercase tracking-tighter ${idx <= currentStageIdx ? 'text-slate-900' : 'text-slate-300'}`}>{stage.label}</span>
                  </div>
                  {idx < stages.length - 1 && (
                    <div className={`flex-1 h-0.5 rounded-full mx-1 transition-all duration-1000 ${idx < currentStageIdx ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
                  )}
               </React.Fragment>
             ))}
          </div>
          <div className="hidden sm:flex items-center space-x-2 text-[7px] font-black uppercase text-slate-400 tracking-widest">
             <Activity size={10} className="text-indigo-400" />
             <span>ID: {inquiry.id?.split('-')?.pop() || 'N/A'}</span>
          </div>
       </div>

       <div className="p-6 md:p-8 space-y-6">
          <div className="flex items-center space-x-4">
             <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <MessageSquare size={24}/>
             </div>
             <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                   <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-tight truncate">{inquiry.subject}</h4>
                   <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase border tracking-widest shrink-0 shadow-sm ${
                      matchesStatus('Published') ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse'
                   }`}>
                      PHASE: {inquiry.status?.replace('_', ' ') || 'STATUS_ERROR'}
                   </span>
                </div>
                <div className="flex items-center gap-3 mt-2">
                   <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest flex items-center"><Clock size={10} className="mr-1.5"/> Logged: {inquiry.timestamp}</span>
                </div>
             </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-[1.8rem] border border-slate-100">
             <p className="text-[11px] font-medium text-slate-600 leading-relaxed italic">"{inquiry.message}"</p>
          </div>

          <div className="pt-6 border-t border-slate-100 space-y-5">
             {(canCurate || isAdmin) && (matchesStatus('Submitted') || matchesStatus('EEC_Review')) && (
                <div className="animate-in fade-in slide-in-from-top-2">
                   {matchesStatus('Submitted') && (
                     <div className="flex flex-wrap gap-3">
                        <button onClick={() => onAction(inquiry.id, 'EEC_Review')} className="flex-1 sm:flex-none px-8 py-3 bg-[#0F1135] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg active:scale-95">Verify for EEC Review</button>
                        <button onClick={handleDismiss} className="flex-1 sm:flex-none px-8 py-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-100 active:scale-95 transition-all">Dismiss</button>
                     </div>
                   )}
                   
                   {matchesStatus('EEC_Review') && (
                     <div className="space-y-4">
                        <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100">
                           <div className="flex items-center space-x-2 mb-2">
                              <ShieldCheck size={14} className="text-indigo-600" />
                              <span className="text-[9px] font-black text-indigo-700 uppercase tracking-widest">EEC Verification</span>
                           </div>
                           <p className="text-[10px] text-indigo-900 leading-relaxed font-bold">Inquiry vetted. Protocol permits transfer to HR Governance.</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                           <button onClick={() => onAction(inquiry.id, 'HR_Pending')} className="w-full sm:w-auto px-10 py-3.5 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#0F1135] transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95">
                              <ArrowRight size={14}/> Submit to HR
                           </button>
                           <button onClick={handleDismiss} className="w-full sm:w-auto px-10 py-3.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-100 active:scale-95 flex items-center justify-center gap-2">
                              <XCircle size={14}/> Dismiss
                           </button>
                        </div>
                     </div>
                   )}
                </div>
             )}

             {(isHR || isAdmin) && matchesStatus('HR_Pending') && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                   <div className="flex items-center space-x-2 px-1">
                      <Stamp size={16} className="text-emerald-600" />
                      <label className="text-[8px] font-black text-slate-900 uppercase tracking-widest">HR Verdict</label>
                   </div>
                   <textarea 
                     className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-bold text-slate-700 outline-none min-h-[100px] focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
                     placeholder="Official response..."
                     value={answer}
                     onChange={e => setAnswer(e.target.value)}
                   />
                   <div className="flex flex-wrap gap-3 pt-2">
                      <button 
                        disabled={!answer}
                        onClick={() => onAction(inquiry.id, 'Published', { finalGuidance: answer, publishedDate: new Date().toLocaleDateString() })} 
                        className="flex-1 sm:flex-none px-10 py-3.5 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-30 shadow-xl active:scale-95"
                      >
                         Publish Guidance
                      </button>
                      <button 
                        disabled={!answer}
                        onClick={() => onAction(inquiry.id, 'Director_Wait', { hrAnswer: answer, isEscalated: true })} 
                        className="flex-1 sm:flex-none px-10 py-3.5 bg-[#0F1135] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 disabled:opacity-30 shadow-xl active:scale-95"
                      >
                         Escalate to Board
                      </button>
                   </div>
                </div>
             )}

             {(isDirector || isAdmin) && matchesStatus('Director_Wait') && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                   <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 flex items-start space-x-3 shadow-inner">
                      <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest mb-1">HR Recommendation:</p>
                        <p className="text-sm font-bold text-slate-600 italic">"{inquiry.hrAnswer}"</p>
                      </div>
                   </div>
                   <textarea 
                     className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-bold text-slate-700 outline-none min-h-[100px] focus:ring-2 focus:ring-rose-500 shadow-inner"
                     placeholder="Executive Decree..."
                     value={answer}
                     onChange={e => setAnswer(e.target.value)}
                   />
                   <div className="flex items-center gap-4">
                      <button 
                        disabled={!answer}
                        onClick={() => onAction(inquiry.id, 'Published', { finalGuidance: answer, publishedDate: new Date().toLocaleDateString() })} 
                        className="flex-1 px-12 py-4 bg-[#0F1135] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 disabled:opacity-30 shadow-2xl active:scale-95 transition-all"
                      >
                         Seal & Publish Final Consensus
                      </button>
                      <button onClick={handleDismiss} className="px-6 py-4 border border-rose-100 text-rose-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-50">Veto & Close</button>
                   </div>
                </div>
             )}

             {matchesStatus('Published') && (
                <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[1.8rem] space-y-4 shadow-inner">
                   <div className="flex items-center space-x-3 text-emerald-600">
                      <CheckCircle2 size={18}/>
                      <span className="text-[10px] font-black uppercase tracking-widest">Released Guidance</span>
                   </div>
                   <p className="text-[12px] font-black text-slate-800 leading-relaxed border-l-2 border-emerald-200 pl-5 italic">"{inquiry.finalGuidance}"</p>
                </div>
             )}
          </div>
       </div>
    </div>
  );
};

export default EngagementHub;