import React, { useState, useRef, useMemo } from 'react';
import { 
  X, 
  Camera, 
  Trash2, 
  Plus, 
  Search, 
  Wrench, 
  User, 
  History, 
  ChevronRight, 
  Archive, 
  Minus, 
  CheckCircle2, 
  Calendar, 
  ClipboardList, 
  CheckSquare, 
  Square, 
  Table as TableIcon, 
  MessageSquare,
  ShieldCheck,
  PackageX
} from 'lucide-react';
import { ToolAsset, Employee, ToolCondition, PhysicalLogbookRecord, ShiftType } from '../../types';

interface LogbookDigitizerModalProps {
  tools: ToolAsset[];
  staff: Employee[];
  currentUser: Employee;
  initialRecord?: PhysicalLogbookRecord | null;
  startAtAudit?: boolean;
  onSave: (log: PhysicalLogbookRecord, discrepancies: { toolId: string, staffId: string, condition: ToolCondition, quantity: number, notes: string }[]) => void;
  onCancel: () => void;
}

const LogbookDigitizerModal: React.FC<LogbookDigitizerModalProps> = ({ 
  tools, 
  staff, 
  currentUser, 
  onSave, 
  onCancel, 
  initialRecord,
  startAtAudit = false
}) => {
  const [step, setStep] = useState<1 | 2>(startAtAudit ? 2 : 1);
  const [logImages, setLogImages] = useState<string[]>(initialRecord?.imageUrls || []);
  
  const detectShift = () => {
    const hour = new Date().getHours();
    return (hour >= 7 && hour < 19) ? ShiftType.DAY : ShiftType.NIGHT;
  };

  const [meta, setMeta] = useState({ 
    date: initialRecord?.date || new Date().toISOString().split('T')[0], 
    shiftType: initialRecord?.shiftType || detectShift(), 
    page: initialRecord?.pageNumber || `LOG-${Date.now().toString().slice(-4)}` 
  });
  
  const [discrepancies, setDiscrepancies] = useState<{ toolId: string, staffId: string, condition: ToolCondition, quantity: number, notes: string }[]>([]);
  const [toolSearch, setToolSearch] = useState('');
  const [staffSearch, setStaffSearch] = useState('');
  
  const [selectedToolIds, setSelectedToolIds] = useState<Set<string>>(new Set());
  const [batchQuantities, setBatchQuantities] = useState<Record<string, number>>({});
  // Status is now strictly 'Unreturned' or 'Present'
  const [batchPieceStatus, setBatchPieceStatus] = useState<Record<string, Record<string, 'Unreturned' | 'Present'>>>({});
  
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [manualNote, setManualNote] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleToolSelection = (toolId: string) => {
    setSelectedToolIds(prev => {
      const next = new Set(prev);
      if (next.has(toolId)) {
        next.delete(toolId);
      } else {
        const tool = tools.find(x => x.id === toolId);
        if (tool && tool.available <= 0) {
          alert("Inventory Alert: This tool has 0 units in stock and cannot be reported as unreturned from the store.");
          return prev;
        }

        next.add(toolId);
        if (!batchQuantities[toolId]) setBatchQuantities(q => ({...q, [toolId]: 1}));
        
        // When a toolbox/set is selected, default ALL pieces to UNRETURNED (Ticked) as requested
        if (tool?.composition && !batchPieceStatus[toolId]) {
          const initial: Record<string, 'Unreturned' | 'Present'> = {};
          tool.composition.forEach(p => initial[p] = 'Unreturned');
          setBatchPieceStatus(s => ({...s, [toolId]: initial}));
        }
      }
      return next;
    });
  };

  const updateToolQty = (id: string, delta: number) => {
    const tool = tools.find(t => t.id === id);
    const maxAvailable = tool ? tool.available : 1;
    setBatchQuantities(prev => ({
      ...prev,
      [id]: Math.max(1, Math.min(maxAvailable, (prev[id] || 1) + delta))
    }));
  };

  const toggleToolPiece = (toolId: string, piece: string) => {
    setBatchPieceStatus(prev => {
      const toolStatus = prev[toolId] || {};
      const current = toolStatus[piece] || 'Present';
      const next = current === 'Present' ? 'Unreturned' : 'Present';
      return { ...prev, [toolId]: { ...toolStatus, [piece]: next } };
    });
  };

  const setAllPiecesPresent = (toolId: string) => {
    const tool = tools.find(x => x.id === toolId);
    if (!tool?.composition) return;
    const next: Record<string, 'Unreturned' | 'Present'> = {};
    tool.composition.forEach(p => next[p] = 'Present');
    setBatchPieceStatus(prev => ({ ...prev, [toolId]: next }));
  };

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => setLogImages(prev => [...prev, reader.result as string]);
        reader.readAsDataURL(file as Blob);
      });
    }
  };

  const addDiscrepanciesToQueue = () => {
    if (selectedToolIds.size === 0) return alert("Select tool(s) to proceed.");
    const effectiveStaffId = selectedStaffId || currentUser.id;
    
    const newDiscrepancies = Array.from(selectedToolIds).map(toolId => {
      const tool = tools.find(x => x.id === toolId);
      const qty = batchQuantities[toolId] || 1;
      const toolStatus = batchPieceStatus[toolId] || {};
      
      let finalItemNote = manualNote;
      if (tool?.assetClass === 'Set' || tool?.assetClass === 'Toolbox') {
        const unreturnedPieces = Object.entries(toolStatus).filter(([_, s]) => s === 'Unreturned').map(([p]) => p);
        if (unreturnedPieces.length > 0) {
          const forensicString = `[UNRETURNED PIECES: ${unreturnedPieces.join(', ')}]`;
          finalItemNote = finalItemNote ? `${finalItemNote} | ${forensicString}` : forensicString;
        }
      }
      return { toolId, staffId: effectiveStaffId, condition: 'Unreturned' as ToolCondition, quantity: qty, notes: finalItemNote };
    });

    setDiscrepancies(prev => [...prev, ...newDiscrepancies]);
    setSelectedToolIds(new Set());
    setBatchQuantities({});
    setBatchPieceStatus({});
    setToolSearch('');
    setStaffSearch('');
    setSelectedStaffId('');
    setManualNote('');
  };

  const filteredTools = useMemo(() => tools.filter(t => (t.name || '').toLowerCase().includes(toolSearch.toLowerCase()) || (t.id || '').toLowerCase().includes(toolSearch.toLowerCase())), [tools, toolSearch]);
  const filteredStaff = useMemo(() => staff.filter(st => (st.name || '').toLowerCase().includes(staffSearch.toLowerCase()) || (st.id || '').toLowerCase().includes(staffSearch.toLowerCase())), [staff, staffSearch]);

  const handleFinalize = () => {
    if (logImages.length === 0) return alert("Upload at least one page scan.");
    onSave({ 
      id: initialRecord?.id || `PL-${Date.now()}`, 
      date: meta.date, 
      shiftType: meta.shiftType, 
      attendantId: currentUser.id, 
      attendantName: currentUser.name, 
      imageUrls: logImages, 
      pageNumber: meta.page, 
      timestamp: initialRecord?.timestamp || new Date().toLocaleString() 
    }, discrepancies);
  };

  const groupedDiscrepancies = useMemo(() => {
    const groups: Record<string, typeof discrepancies> = {};
    discrepancies.forEach(d => {
      if (!groups[d.staffId]) groups[d.staffId] = [];
      groups[d.staffId].push(d);
    });
    return groups;
  }, [discrepancies]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-sm overflow-y-auto no-scrollbar">
      <div className="bg-[#F8FAFF] w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/20 animate-in zoom-in-95 duration-300 my-auto max-h-[95vh]">
        
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#0F1135] rounded-xl flex items-center justify-center text-white shadow-lg"><Archive size={20} /></div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{step === 1 ? 'Step 1: Scans' : 'Step 2: Unreturned Report'}</h3>
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">Digitizing Physical Logbooks</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-slate-300 hover:text-slate-900 transition-colors p-2"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-white/50 no-scrollbar space-y-6">
          {step === 1 ? (
            <div className="space-y-6 animate-in fade-in duration-300">
               <div className="min-h-[300px] bg-slate-50/50 rounded-[2rem] border border-slate-100 p-6 shadow-inner relative group cursor-pointer" onClick={() => !logImages.length && fileInputRef.current?.click()}>
                  {logImages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center space-y-4 py-20">
                      <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-slate-200 border border-slate-100 shadow-sm group-hover:scale-110 transition-transform">
                         <Camera size={32} />
                      </div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Capture Logbook Pages</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-in fade-in">
                      {logImages.map((img, idx) => (
                        <div key={idx} className="relative aspect-[3/4] bg-white rounded-[1.2rem] overflow-hidden border border-slate-100 shadow-sm group/img">
                           <img src={img} className="w-full h-full object-cover" />
                           <button onClick={(e) => { e.stopPropagation(); setLogImages(prev => prev.filter((_, i) => i !== idx)); }} className="absolute top-2 right-2 w-7 h-7 bg-white/90 text-rose-500 rounded-lg flex items-center justify-center shadow-lg opacity-0 group-hover/img:opacity-100 transition-all"><Trash2 size={14} /></button>
                        </div>
                      ))}
                      <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="aspect-[3/4] rounded-[1.2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 hover:bg-white transition-all space-y-1">
                         <Plus size={24} />
                         <span className="text-[7px] font-black uppercase tracking-widest">Add Page</span>
                      </button>
                    </div>
                  )}
               </div>
               <input type="file" ref={fileInputRef} onChange={handleCapture} className="hidden" accept="image/*" multiple />
               
               <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-white border border-slate-100 p-3.5 rounded-xl shadow-sm flex items-center space-x-3">
                     <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600"><User size={14}/></div>
                     <div className="min-w-0">
                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Recording Officer</p>
                        <p className="text-[9px] font-black text-slate-800 uppercase truncate">{currentUser.name}</p>
                     </div>
                  </div>
                  <div className="bg-white border border-slate-100 p-3.5 rounded-xl shadow-sm flex items-center space-x-3">
                     <div className="p-1.5 bg-orange-50 rounded-lg text-orange-600"><Calendar size={14}/></div>
                     <div>
                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Log Date</p>
                        <p className="text-[9px] font-black text-slate-800 uppercase">{meta.date}</p>
                     </div>
                  </div>
               </div>
            </div>
          ) : (
            <div className="space-y-5 animate-in slide-in-from-right-4 duration-500">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                     <label className="text-[8.5px] font-black text-slate-900 uppercase tracking-widest ml-1">Select Unreturned Tools</label>
                     <div className="relative group">
                        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                        <input className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-[9px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm" value={toolSearch} onChange={e => setToolSearch(e.target.value)} placeholder="Search tools..." />
                     </div>
                     <div className="bg-white border border-slate-100 rounded-xl h-72 overflow-y-auto no-scrollbar p-1.5 space-y-1 shadow-inner">
                        {filteredTools.map(t => {
                           const isSelected = selectedToolIds.has(t.id);
                           const currentQty = batchQuantities[t.id] || 1;
                           const tStatus = batchPieceStatus[t.id] || {};
                           const isOut = t.available <= 0;

                           return (
                             <div key={t.id} className={`rounded-lg transition-all flex flex-col p-1.5 border ${isSelected ? 'bg-indigo-50/50 border-indigo-100 shadow-sm' : 'border-transparent hover:bg-slate-50'} ${isOut ? 'opacity-50 grayscale' : ''}`}>
                                <button 
                                  disabled={isOut}
                                  onClick={() => toggleToolSelection(t.id)} 
                                  className="w-full text-left p-2 rounded-md flex items-center justify-between group"
                                >
                                   <div className="flex items-center space-x-2.5 min-w-0">
                                      <div className={`p-1.5 rounded-lg border shadow-inner ${isSelected ? 'bg-indigo-600 text-white' : 'bg-white text-slate-300 border-slate-100'}`}><Wrench size={12} /></div>
                                      <div className="min-w-0">
                                         <p className={`text-[9px] font-black uppercase truncate leading-none ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                                            {t.name}
                                         </p>
                                         <p className={`text-[6.5px] font-bold uppercase mt-1 tracking-widest ${isOut ? 'text-rose-500' : 'text-slate-400'}`}>
                                            {isOut ? 'STOCK ZERO' : `STORE STOCK: ${t.available}`}
                                         </p>
                                      </div>
                                   </div>
                                   {isSelected ? <CheckSquare size={16} className="text-indigo-600" /> : <Square size={16} className="text-slate-200" />}
                                </button>
                                {isSelected && (
                                  <div className="mt-1.5 pt-2.5 px-2 pb-2 border-t border-indigo-100 space-y-4 animate-in slide-in-from-top-1">
                                     <div className="flex items-center justify-between bg-white border border-indigo-100 rounded-xl p-2 shadow-sm shrink-0">
                                        <div className="flex flex-col ml-1">
                                           <span className="text-[7.5px] font-black text-indigo-400 uppercase leading-none">Unreturned Qty:</span>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                           <button onClick={() => updateToolQty(t.id, -1)} className="w-7 h-7 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600"><Minus size={12}/></button>
                                           <span className="text-xs font-black text-slate-900 tabular-nums">{currentQty}</span>
                                           <button onClick={() => updateToolQty(t.id, 1)} className="w-7 h-7 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600"><Plus size={12}/></button>
                                        </div>
                                     </div>

                                     {(t.assetClass === 'Set' || t.assetClass === 'Toolbox') && t.composition && (
                                       <div className="bg-white border border-indigo-100 rounded-[1.5rem] p-3 space-y-2.5 shadow-sm">
                                          <div className="flex items-center justify-between">
                                             <div className="flex items-center space-x-1.5">
                                                <ClipboardList size={12} className="text-indigo-600" />
                                                <span className="text-[7.5px] font-black text-slate-900 uppercase">Piece Sighting</span>
                                             </div>
                                             <button onClick={() => setAllPiecesPresent(t.id)} className="text-[7px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-tighter">Untick All</button>
                                          </div>
                                          <div className="grid grid-cols-1 gap-1.5 max-h-32 overflow-y-auto no-scrollbar pr-1">
                                             {t.composition.map((piece, i) => {
                                                const pStat = tStatus[piece] || 'Present';
                                                const isUnreturned = pStat === 'Unreturned';
                                                return (
                                                  <button 
                                                    key={i} 
                                                    onClick={() => toggleToolPiece(t.id, piece)} 
                                                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all text-left ${isUnreturned ? 'bg-indigo-50/50 border-indigo-200' : 'bg-white border-slate-100'}`}
                                                  >
                                                     <span className={`text-[9px] font-black uppercase truncate pr-2 ${isUnreturned ? 'text-indigo-700' : 'text-slate-400'}`}>{piece}</span>
                                                     {isUnreturned ? <CheckSquare size={14} className="text-indigo-600" /> : <Square size={14} className="text-slate-200" />}
                                                  </button>
                                                );
                                             })}
                                          </div>
                                       </div>
                                     )}
                                  </div>
                                )}
                             </div>
                           );
                        })}
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div className="space-y-2">
                        <label className="text-[8.5px] font-black text-slate-900 uppercase tracking-widest ml-1">Responsible Staff</label>
                        <div className="relative group">
                           <User size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                           <input className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-[9px] font-bold text-slate-700 outline-none shadow-sm" value={staffSearch} onChange={e => setStaffSearch(e.target.value)} placeholder="Search personnel..." />
                        </div>
                        <div className="bg-white border border-slate-100 rounded-xl h-48 overflow-y-auto no-scrollbar p-1.5 space-y-1 shadow-inner">
                           {filteredStaff.map(s => (
                              <button key={s.id} onClick={() => { setStaffSearch(s.name); setSelectedStaffId(s.id); }} className={`w-full text-left p-2.5 rounded-lg flex items-center justify-between transition-all group ${selectedStaffId === s.id ? 'bg-[#0F1135] text-white shadow-md' : 'hover:bg-indigo-50 border border-transparent'}`}>
                                 <div className="flex items-center space-x-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] transition-colors ${selectedStaffId === s.id ? 'bg-indigo-500 text-white' : 'bg-slate-50 text-indigo-400 shadow-inner'}`}>{s.name.charAt(0)}</div>
                                    <div className="min-w-0">
                                       <p className={`text-[10px] font-black uppercase leading-none truncate ${selectedStaffId === s.id ? 'text-white' : 'text-slate-800'}`}>{s.name}</p>
                                    </div>
                                 </div>
                                 {selectedStaffId === s.id && <CheckCircle2 size={14} className="text-emerald-400" />}
                              </button>
                           ))}
                        </div>
                     </div>

                     <div className="space-y-2">
                        <label className="text-[8.5px] font-black text-slate-900 uppercase tracking-widest ml-1">Case Notes</label>
                        <textarea className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[10px] font-medium text-slate-700 outline-none h-20 shadow-inner placeholder:text-slate-300 focus:ring-1 focus:ring-indigo-500" placeholder="Details for unreturned report..." value={manualNote} onChange={e => setManualNote(e.target.value)} />
                     </div>

                     <button onClick={addDiscrepanciesToQueue} disabled={selectedToolIds.size === 0} className="w-full bg-[#0F1135] text-white py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 disabled:opacity-40 active:scale-[0.98]">
                        <Plus size={16}/>
                        <span>Add to Registry Exceptions</span>
                     </button>
                  </div>
               </div>

               <div className="bg-white border border-slate-200 rounded-[2.2rem] shadow-sm flex flex-col overflow-hidden animate-in fade-in duration-500">
                  <div className="px-6 py-4 bg-[#0F1135] flex items-center justify-between shrink-0">
                     <div className="flex items-center space-x-3">
                        <div className="p-1.5 bg-white/10 rounded-lg text-indigo-400 shadow-inner"><History size={14}/></div>
                        <h5 className="text-[10px] font-black text-white uppercase tracking-[0.15em]">Pending Reports (Exceptions)</h5>
                     </div>
                  </div>
                  
                  <div className="flex-1 max-h-[350px] overflow-y-auto no-scrollbar bg-slate-50/30">
                     {discrepancies.length === 0 ? (
                        <div className="py-16 flex flex-col items-center justify-center text-center opacity-40 space-y-4">
                           <TableIcon size={36} className="text-slate-200" />
                           <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 px-12">No unreturned tools reported.</p>
                        </div>
                     ) : (
                       <div className="p-5 space-y-6">
                          {(Object.entries(groupedDiscrepancies) as [string, typeof discrepancies][]).map(([staffId, items]) => {
                             const custodian = staff.find(s => s.id === staffId);
                             return (
                               <div key={staffId} className="bg-white border border-slate-100 rounded-[1.8rem] shadow-sm overflow-hidden animate-in slide-in-from-bottom-2">
                                  <div className="bg-slate-900 px-5 py-2.5 flex items-center justify-between">
                                     <div className="flex items-center space-x-3">
                                        <div className="p-1.5 bg-indigo-500 rounded-lg text-white shadow-sm"><User size={10} /></div>
                                        <span className="text-[8.5px] font-black text-white uppercase truncate max-w-[180px]">{custodian?.name || staffId}</span>
                                     </div>
                                     <span className="text-[7px] font-black text-white/40 uppercase tracking-widest">{items.length} Reports</span>
                                  </div>

                                  <div className="divide-y divide-slate-50">
                                     {items.map((d, i) => {
                                        const tool = tools.find(t => t.id === d.toolId);
                                        return (
                                          <div key={i} className="group p-3 flex items-center justify-between hover:bg-indigo-50/10 transition-colors">
                                             <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                   <p className="text-[9.5px] font-black text-slate-800 uppercase truncate leading-none">{tool?.name || d.toolId}</p>
                                                   <span className="text-[9px] font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded tabular-nums">x{d.quantity}</span>
                                                </div>
                                                <p className="text-[6.5px] font-bold text-slate-300 uppercase mt-1">STATUS: UNRETURNED</p>
                                             </div>
                                             <button 
                                               onClick={() => setDiscrepancies(discrepancies.filter(disc => disc !== d))}
                                               className="p-1.5 text-slate-200 hover:text-rose-500 rounded-lg transition-all"
                                             >
                                                <Trash2 size={12}/>
                                             </button>
                                          </div>
                                        );
                                     })}
                                  </div>
                               </div>
                             );
                          })}
                       </div>
                     )}
                  </div>
               </div>
            </div>
          )}
        </div>

        <div className="px-6 py-5 bg-white border-t border-slate-100 flex justify-between shrink-0 items-center">
          <div>{step === 2 && (<button onClick={() => setStep(1)} className="px-8 py-3.5 rounded-xl border border-slate-200 text-slate-400 text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95">Back to Scan</button>)}</div>
          <div className="flex items-center gap-4">
             <button onClick={() => step === 1 ? (logImages.length > 0 ? setStep(2) : alert("Please upload a scan first.")) : handleFinalize()} className="px-12 py-4 bg-[#0F1135] text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.1em] shadow-2xl flex items-center gap-4 transition-all hover:bg-indigo-600 active:scale-95 group">
                <span>{step === 1 ? 'Report Unreturned Tools' : 'Commit Records'}</span>
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogbookDigitizerModal;