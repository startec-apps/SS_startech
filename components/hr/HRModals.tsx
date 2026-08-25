
import React, { useState, useMemo, useRef } from 'react';
import { X, Megaphone, Send, FileText, Briefcase, Link, Fingerprint, Search, User, UserCheck, Users, ChevronDown, Plus, Trash2, Paperclip, Upload, Globe, FileWarning, CheckCircle2, ExternalLink, ShieldCheck, Image as ImageIcon } from 'lucide-react';
import { Employee, StaffDocument, Bulletin, ExternalResource, BulletinAttachment } from '../../types';

export const ArtifactViewerModal: React.FC<{ 
  attachment: BulletinAttachment, 
  onClose: () => void 
}> = ({ attachment, onClose }) => {
  const isImage = attachment.url.startsWith('data:image/') || 
                  attachment.url.match(/\.(jpeg|jpg|gif|png|webp)$/i);

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative bg-white w-full max-w-6xl h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-[#0F1135] rounded-2xl flex items-center justify-center text-white shadow-lg">
              {isImage ? <ImageIcon size={24} /> : <FileText size={24} />}
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">{attachment.name}</h3>
              <div className="flex items-center space-x-2 mt-1.5">
                 <ShieldCheck size={12} className="text-emerald-500" />
                 <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.2em]">Institutional Secure Viewport</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
             <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 px-5 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-200">
                <ExternalLink size={14} />
                <span className="hidden sm:inline">Download Artifact</span>
             </a>
             <button onClick={onClose} className="w-11 h-11 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-100 transition-colors shadow-sm">
                <X size={20} />
             </button>
          </div>
        </div>
        <div className="flex-1 bg-slate-100 relative overflow-hidden flex items-center justify-center">
          {isImage ? (
            <div className="w-full h-full overflow-auto p-8 flex items-center justify-center no-scrollbar">
              <img src={attachment.url} alt={attachment.name} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-white/20" />
            </div>
          ) : (
            <iframe src={attachment.url} className="w-full h-full border-none" title={attachment.name} />
          )}
        </div>
        <div className="px-8 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-center">
           <p className="text-[7px] font-black text-slate-300 uppercase tracking-[0.4em]">Forensic Trace Active • AES-256 Protocol • Technical Artifact</p>
        </div>
      </div>
    </div>
  );
};

export const PostBulletinModal: React.FC<{ onSave: (b: Bulletin) => void, onCancel: () => void, currentUser: Employee }> = ({ onSave, onCancel, currentUser }) => {
  const [formData, setFormData] = useState<Partial<Bulletin>>({
    title: '', content: '', type: 'Notice', date: new Date().toISOString().split('T')[0], attachments: []
  });
  const [isCustomType, setIsCustomType] = useState(false);
  const [linkName, setLinkName] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [pendingFile, setPendingFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPendingFile(reader.result as string);
        if (!fileName) setFileName(file.name.split('.')[0].toUpperCase());
      };
      reader.readAsDataURL(file);
    }
  };

  const addLinkAttachment = () => {
    if (!linkName || !linkUrl) return;
    const newAtt = { name: linkName.trim().toUpperCase(), url: linkUrl.trim() };
    setFormData(prev => ({ ...prev, attachments: [...(prev.attachments || []), newAtt] }));
    setLinkName(''); setLinkUrl('');
  };

  const addFileAttachment = () => {
    if (!fileName || !pendingFile) return;
    const newAtt = { name: fileName.trim().toUpperCase(), url: pendingFile };
    setFormData(prev => ({ ...prev, attachments: [...(prev.attachments || []), newAtt] }));
    setFileName(''); setPendingFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setFormData(prev => ({ ...prev, attachments: (prev.attachments || []).filter((_, i) => i !== index) }));
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
       <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[92vh]">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
             <div className="flex items-center space-x-3 text-slate-900 font-black uppercase text-sm">
                <Megaphone size={20} className="text-indigo-600" />
                <span>Publish Institutional Bulletin</span>
             </div>
             <button onClick={onCancel} className="text-slate-300 hover:text-slate-900 transition-colors"><X size={20}/></button>
          </div>
          <div className="p-6 space-y-6 overflow-y-auto no-scrollbar flex-1">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                   <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Notice Subject</label>
                   <input className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-[10px] font-black uppercase text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 shadow-inner" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="E.G. QUARTERLY SAFETY AUDIT" />
                </div>
                <div className="space-y-1.5">
                   <div className="flex items-center justify-between mb-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Protocol Type</label>
                      <button type="button" onClick={() => setIsCustomType(!isCustomType)} className="text-[7.5px] font-black text-indigo-600 uppercase tracking-tighter hover:underline">
                         {isCustomType ? 'USE PRESETS' : 'ENTER CUSTOM'}
                      </button>
                   </div>
                   {isCustomType ? (
                      <input className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-[10px] font-black uppercase text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 shadow-inner" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} placeholder="ENTER CLASS..." />
                   ) : (
                      <select className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-[10px] font-black uppercase text-slate-700 outline-none cursor-pointer shadow-inner" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                         <option value="Notice">Notice</option>
                         <option value="Update">Policy Update</option>
                         <option value="Event">Institutional Event</option>
                         <option value="Alert">Critical Alert</option>
                      </select>
                   )}
                </div>
             </div>
             <div className="space-y-1.5">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Protocol Context (Body)</label>
                <textarea className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 text-[10px] font-medium text-slate-700 outline-none h-24 focus:ring-1 focus:ring-indigo-500 shadow-inner" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} placeholder="Provide comprehensive institutional narrative..." />
             </div>
             <div className="pt-6 border-t border-slate-50 space-y-4">
                <div className="flex items-center space-x-2 px-1">
                   <Paperclip size={14} className="text-indigo-600" />
                   <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Multi-Source Artifact Repository</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="bg-slate-50 p-4 rounded-[1.8rem] border border-slate-100 space-y-3 shadow-sm">
                      <div className="flex items-center space-x-2 text-indigo-600 mb-1">
                         <Globe size={12}/>
                         <span className="text-[8px] font-black uppercase tracking-widest">Digital Link Architecture</span>
                      </div>
                      <input className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[9px] font-black uppercase outline-none focus:ring-1 focus:ring-indigo-500" placeholder="LINK DESIGNATION" value={linkName} onChange={e => setLinkName(e.target.value)} />
                      <input className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[9px] font-bold text-indigo-600 outline-none focus:ring-1 focus:ring-indigo-500" placeholder="HTTPS://PATH..." value={linkUrl} onChange={e => setLinkUrl(e.target.value)} />
                      <button type="button" onClick={addLinkAttachment} disabled={!linkName || !linkUrl} className="w-full py-2 bg-indigo-600 text-white rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-[#0F1135] transition-all flex items-center justify-center gap-2 disabled:opacity-30">
                         <Plus size={12}/> Stage Link
                      </button>
                   </div>
                   <div className="bg-slate-50 p-4 rounded-[1.8rem] border border-slate-100 space-y-3 shadow-sm">
                      <div className="flex items-center space-x-2 text-emerald-600 mb-1">
                         <Upload size={12}/>
                         <span className="text-[8px] font-black uppercase tracking-widest">Local Binary Archive</span>
                      </div>
                      <input className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[9px] font-black uppercase outline-none focus:ring-1 focus:ring-indigo-500" placeholder="FILE DESIGNATION" value={fileName} onChange={e => setFileName(e.target.value)} />
                      <div className="flex gap-2">
                        <button type="button" onClick={() => fileInputRef.current?.click()} className={`flex-1 py-2 border-2 border-dashed rounded-xl text-[8px] font-black uppercase transition-all ${pendingFile ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-300'}`}>
                           {pendingFile ? 'BINARY CAPTURED' : 'SELECT ARCHIVE'}
                        </button>
                        {pendingFile && (
                          <button onClick={() => {setPendingFile(null); if(fileInputRef.current) fileInputRef.current.value='';}} className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center border border-rose-100"><Trash2 size={16}/></button>
                        )}
                      </div>
                      <button type="button" onClick={addFileAttachment} disabled={!fileName || !pendingFile} className="w-full py-2 bg-emerald-700 text-white rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-emerald-800 transition-all flex items-center justify-center gap-2 disabled:opacity-30">
                         <Plus size={12}/> Stage File
                      </button>
                   </div>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,.pdf" />
                {formData.attachments && formData.attachments.length > 0 && (
                  <div className="space-y-2 pt-2">
                     <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Staged Artifact Manifest:</p>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {formData.attachments.map((att, idx) => {
                           const isLocal = att.url.startsWith('data:');
                           const isImg = att.url.startsWith('data:image/');
                           return (
                             <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-indigo-200 transition-all group">
                                <div className="flex items-center space-x-3 min-w-0">
                                   <div className={`p-2 rounded-xl shrink-0 ${isLocal ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                      {isImg ? <ImageIcon size={12}/> : isLocal ? <FileText size={12}/> : <Globe size={12}/>}
                                   </div>
                                   <div className="min-w-0">
                                      <p className="text-[9px] font-black text-slate-800 uppercase truncate leading-none">{att.name}</p>
                                      <p className="text-[6.5px] font-bold text-slate-400 uppercase mt-1 tracking-widest">{isLocal ? 'BINARY STORAGE' : 'CLOUD LINK'}</p>
                                   </div>
                                </div>
                                <button onClick={() => removeAttachment(idx)} className="p-2 text-slate-200 hover:text-rose-500 transition-colors"><Trash2 size={14}/></button>
                             </div>
                           );
                        })}
                     </div>
                  </div>
                )}
             </div>
          </div>
          <div className="p-6 bg-slate-50 border-t border-slate-100 shrink-0">
             <button onClick={() => onSave({...formData as Bulletin, id: `B-${Date.now()}`, postedBy: currentUser.name})} className="w-full bg-[#0F1135] text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-indigo-600 transition-all flex items-center justify-center space-x-3 shadow-2xl shadow-indigo-900/20 active:scale-[0.98]">
                <Send size={16} /><span>Broadcast Institutional Notice</span>
             </button>
          </div>
       </div>
    </div>
  );
};

export const UploadDocumentModal: React.FC<{ onSave: (d: StaffDocument) => void, onCancel: () => void, masterEmployees: Employee[] }> = ({ onSave, onCancel, masterEmployees }) => {
  const [formData, setFormData] = useState<Partial<StaffDocument>>({
    title: '', type: 'Policy', staffId: 'ALL', status: 'Published', isBroadcast: true, attachments: []
  });
  const [staffSearch, setStaffSearch] = useState('');
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);
  const [isCustomType, setIsCustomType] = useState(false);
  
  // Dual-State for Adding Multi-Artifacts to Archives
  const [linkName, setLinkName] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [pendingFile, setPendingFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredStaff = useMemo(() => {
    const s = staffSearch.toLowerCase();
    return masterEmployees.filter(e => (e.name || '').toLowerCase().includes(s) || (e.id || '').toLowerCase().includes(s)).slice(0, 50);
  }, [masterEmployees, staffSearch]);

  const selectedStaffName = useMemo(() => {
    if (formData.staffId === 'ALL') return 'Institutional Broadcast (All Staff)';
    return masterEmployees.find(e => e.id === formData.staffId)?.name || 'Unknown Personnel';
  }, [formData.staffId, masterEmployees]);

  const handleSelectStaff = (id: string) => {
    setFormData({ ...formData, staffId: id, isBroadcast: id === 'ALL' });
    setStaffSearch(''); setShowStaffDropdown(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPendingFile(reader.result as string);
        if (!fileName) setFileName(file.name.split('.')[0].toUpperCase());
      };
      reader.readAsDataURL(file);
    }
  };

  const addLinkAttachment = () => {
    if (!linkName || !linkUrl) return;
    const newAtt = { name: linkName.trim().toUpperCase(), url: linkUrl.trim() };
    setFormData(prev => ({ ...prev, attachments: [...(prev.attachments || []), newAtt] }));
    setLinkName(''); setLinkUrl('');
  };

  const addFileAttachment = () => {
    if (!fileName || !pendingFile) return;
    const newAtt = { name: fileName.trim().toUpperCase(), url: pendingFile };
    setFormData(prev => ({ ...prev, attachments: [...(prev.attachments || []), newAtt] }));
    setFileName(''); setPendingFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setFormData(prev => ({ ...prev, attachments: (prev.attachments || []).filter((_, i) => i !== index) }));
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
       <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[92vh]">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
             <div className="flex items-center space-x-3 text-slate-900 font-black uppercase text-sm">
                <Briefcase size={20} className="text-indigo-600" />
                <span>Commit to Institutional Archives</span>
             </div>
             <button onClick={onCancel} className="text-slate-300 hover:text-slate-900 transition-colors"><X size={20}/></button>
          </div>
          <div className="p-6 space-y-6 overflow-y-auto no-scrollbar flex-1">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                   <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Document Subject</label>
                   <input className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-[10px] font-black uppercase text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 shadow-inner" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="E.G. CONTRACT AMENDMENT 2025" />
                </div>
                <div className="space-y-1.5">
                   <div className="flex items-center justify-between mb-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Archive Class</label>
                      <button type="button" onClick={() => setIsCustomType(!isCustomType)} className="text-[7.5px] font-black text-indigo-600 uppercase tracking-tighter hover:underline">
                         {isCustomType ? 'USE PRESETS' : 'ENTER CUSTOM'}
                      </button>
                   </div>
                   {isCustomType ? (
                      <input className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-[10px] font-black uppercase text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 shadow-inner" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} placeholder="ENTER CLASS..." />
                   ) : (
                      <select className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-[10px] font-black uppercase text-slate-700 outline-none cursor-pointer shadow-inner" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                         <option value="Policy">Policy/SOP</option>
                         <option value="Contract">Employment Contract</option>
                         <option value="Payslip">Payslip Record</option>
                         <option value="Certification">Safety Certification</option>
                      </select>
                   )}
                </div>
             </div>

             <div className="space-y-1.5 relative">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Archive Identity (Target)</label>
                <div className="relative">
                   <div onClick={() => setShowStaffDropdown(!showStaffDropdown)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-[10px] font-black uppercase text-slate-700 cursor-pointer flex items-center justify-between shadow-inner">
                      <div className="flex items-center space-x-2 truncate">
                         {formData.staffId === 'ALL' ? <Users size={12} className="text-indigo-500" /> : <User size={12} className="text-indigo-500" />}
                         <span className="truncate">{selectedStaffName}</span>
                      </div>
                      <ChevronDown size={14} className={`text-slate-400 transition-transform ${showStaffDropdown ? 'rotate-180' : ''}`} />
                   </div>
                   {showStaffDropdown && (
                     <div className="absolute top-full left-0 right-0 z-[310] bg-white border border-slate-200 rounded-[1.5rem] mt-2 shadow-2xl overflow-hidden animate-in slide-in-from-top-2">
                        <div className="p-3 border-b border-slate-50 bg-slate-50/50">
                           <div className="relative">
                              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                              <input autoFocus className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-[9px] font-black uppercase outline-none focus:ring-1 focus:ring-indigo-500" placeholder="SEARCH NAME OR ID..." value={staffSearch} onChange={e => setStaffSearch(e.target.value)} />
                           </div>
                        </div>
                        <div className="max-h-60 overflow-y-auto no-scrollbar">
                           <button onClick={() => handleSelectStaff('ALL')} className="w-full text-left px-4 py-3 hover:bg-indigo-50 border-b border-slate-50 flex items-center space-x-3"><div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg"><Users size={12}/></div><span className="text-[10px] font-black uppercase text-slate-900">Institutional Broadcast</span></button>
                           {filteredStaff.map(e => (
                             <button key={e.id} onClick={() => handleSelectStaff(e.id)} className="w-full text-left px-4 py-3 hover:bg-indigo-50 border-b border-slate-50 last:border-0 transition-colors flex items-center space-x-3"><div className="p-1.5 bg-slate-100 text-slate-400 rounded-lg"><User size={12}/></div><div><p className="text-[10px] font-black uppercase text-slate-800 leading-none">{e.name}</p><p className="text-[7px] font-bold text-slate-400 uppercase mt-1">{e.id}</p></div></button>
                           ))}
                        </div>
                     </div>
                   )}
                </div>
             </div>

             <div className="pt-6 border-t border-slate-50 space-y-4">
                <div className="flex items-center space-x-2 px-1">
                   <Paperclip size={14} className="text-indigo-600" />
                   <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Permanent Archive Repository</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="bg-slate-50 p-4 rounded-[1.8rem] border border-slate-100 space-y-3 shadow-sm">
                      <div className="flex items-center space-x-2 text-indigo-600 mb-1">
                         <Globe size={12}/>
                         <span className="text-[8px] font-black uppercase tracking-widest">Institutional Cloud Link</span>
                      </div>
                      <input className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[9px] font-black uppercase outline-none focus:ring-1 focus:ring-indigo-500" placeholder="ARTIFACT NAME" value={linkName} onChange={e => setLinkName(e.target.value)} />
                      <input className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[9px] font-bold text-indigo-600 outline-none focus:ring-1 focus:ring-indigo-500" placeholder="HTTPS://SECURE-VAULT..." value={linkUrl} onChange={e => setLinkUrl(e.target.value)} />
                      <button type="button" onClick={addLinkAttachment} disabled={!linkName || !linkUrl} className="w-full py-2 bg-indigo-600 text-white rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-[#0F1135] transition-all flex items-center justify-center gap-2 disabled:opacity-30">
                         <Plus size={12}/> Stage Link
                      </button>
                   </div>
                   <div className="bg-slate-50 p-4 rounded-[1.8rem] border border-slate-100 space-y-3 shadow-sm">
                      <div className="flex items-center space-x-2 text-emerald-600 mb-1">
                         <Upload size={12}/>
                         <span className="text-[8px] font-black uppercase tracking-widest">Binary Scan Archive</span>
                      </div>
                      <input className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[9px] font-black uppercase outline-none focus:ring-1 focus:ring-indigo-500" placeholder="SCAN NAME (E.G. PAGE 1)" value={fileName} onChange={e => setFileName(e.target.value)} />
                      <div className="flex gap-2">
                        <button type="button" onClick={() => fileInputRef.current?.click()} className={`flex-1 py-2 border-2 border-dashed rounded-xl text-[8px] font-black uppercase transition-all ${pendingFile ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-300'}`}>
                           {pendingFile ? 'SCAN CAPTURED' : 'SELECT SCAN'}
                        </button>
                        {pendingFile && (
                          <button onClick={() => {setPendingFile(null); if(fileInputRef.current) fileInputRef.current.value='';}} className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center border border-rose-100"><Trash2 size={16}/></button>
                        )}
                      </div>
                      <button type="button" onClick={addFileAttachment} disabled={!fileName || !pendingFile} className="w-full py-2 bg-emerald-700 text-white rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-emerald-800 transition-all flex items-center justify-center gap-2 disabled:opacity-30">
                         <Plus size={12}/> Stage Scan
                      </button>
                   </div>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,.pdf" />
                {formData.attachments && formData.attachments.length > 0 && (
                  <div className="space-y-2 pt-2">
                     <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Archive Manifest Queue:</p>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {formData.attachments.map((att, idx) => {
                           const isLocal = att.url.startsWith('data:');
                           const isImg = att.url.startsWith('data:image/');
                           return (
                             <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-indigo-200 transition-all group animate-in slide-in-from-bottom-1">
                                <div className="flex items-center space-x-3 min-w-0">
                                   <div className={`p-2 rounded-xl shrink-0 ${isLocal ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                      {isImg ? <ImageIcon size={12}/> : isLocal ? <FileText size={12}/> : <Globe size={12}/>}
                                   </div>
                                   <div className="min-w-0">
                                      <p className="text-[9px] font-black text-slate-800 uppercase truncate leading-none">{att.name}</p>
                                      <p className="text-[6.5px] font-bold text-slate-400 uppercase mt-1 tracking-widest">{isLocal ? 'Binary Archival' : 'Cloud Entry'}</p>
                                   </div>
                                </div>
                                <button onClick={() => removeAttachment(idx)} className="p-2 text-slate-200 hover:text-rose-500 transition-colors"><Trash2 size={14}/></button>
                             </div>
                           );
                        })}
                     </div>
                  </div>
                )}
             </div>
          </div>
          <div className="p-6 bg-slate-50 border-t border-slate-100 shrink-0">
             <button onClick={() => onSave({...formData as StaffDocument, id: `DOC-${Date.now()}`, dateUploaded: new Date().toISOString().split('T')[0], fileUrl: '#'})} className="w-full bg-[#0F1135] text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-indigo-600 transition-all flex items-center justify-center space-x-3 shadow-2xl active:scale-[0.98]">
                <FileText size={16} /><span>Commit Technical Record</span>
             </button>
          </div>
       </div>
    </div>
  );
};

export const LinkResourceModal: React.FC<{ onSave: (r: ExternalResource) => void, onCancel: () => void }> = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<ExternalResource>>({ title: '', url: '', category: 'Other' });
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
       <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
             <div className="flex items-center space-x-3 text-slate-900 font-black uppercase text-sm">
                <Link size={20} className="text-indigo-600" />
                <span>Map Institutional Portal</span>
             </div>
             <button onClick={onCancel} className="text-slate-300 hover:text-slate-900"><X size={20}/></button>
          </div>
          <div className="p-6 space-y-4">
             <div className="space-y-1.5">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Portal Name</label>
                <input className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-[10px] font-black uppercase text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
             </div>
             <div className="space-y-1.5">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Institutional URL</label>
                <input className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-[10px] font-bold text-indigo-600 outline-none focus:ring-1 focus:ring-indigo-500" placeholder="https://" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} />
             </div>
             <div className="space-y-1.5">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Categorization</label>
                <select className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-[10px] font-black uppercase text-slate-700 outline-none cursor-pointer" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})}>
                   <option value="Payroll">Payroll</option><option value="Insurance">Insurance</option><option value="Training">Training</option><option value="Benefits">Benefits</option><option value="Other">Other Institutional</option>
                </select>
             </div>
             <button onClick={() => onSave({...formData as ExternalResource, id: `LNK-${Date.now()}`})} className="w-full bg-[#0F1135] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-600 transition-all flex items-center justify-center space-x-2">
                <Fingerprint size={14} /><span>Bind Portal</span>
             </button>
          </div>
       </div>
    </div>
  );
};
