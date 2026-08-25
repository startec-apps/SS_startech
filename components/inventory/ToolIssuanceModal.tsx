
import React, { useState, useMemo } from 'react';
import { 
  X, 
  Send, 
  Wrench, 
  Search, 
  HardHat, 
  CheckSquare, 
  Square, 
  Plus, 
  Minus, 
  UserCheck,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  PackageX,
  Layers,
  History
} from 'lucide-react';
import { ToolAsset, Employee, ToolUsageRecord, ShiftType } from '../../types';

interface ToolIssuanceModalProps {
  availableTools: ToolAsset[];
  staffRegistry: Employee[];
  currentUser: Employee;
  onConfirm: (issuance: Partial<ToolUsageRecord>, selectedToolIds: string[], quantities: Record<string, number>) => void;
  onCancel: () => void;
}

const ToolIssuanceModal: React.FC<ToolIssuanceModalProps> = ({ availableTools, staffRegistry, currentUser, onConfirm, onCancel }) => {
  const [selectedToolIds, setSelectedToolIds] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedPieces, setSelectedPieces] = useState<Record<string, Set<string>>>({});
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [toolSearch, setToolSearch] = useState('');
  const [staffSearch, setStaffSearch] = useState('');
  const [comment, setComment] = useState('');

  const filteredTools = useMemo(() => {
    const s = toolSearch.toLowerCase();
    return availableTools.filter(t => t.name.toLowerCase().includes(s) || t.id.toLowerCase().includes(s));
  }, [availableTools, toolSearch]);

  const filteredStaff = useMemo(() => {
    const s = staffSearch.toLowerCase();
    return staffRegistry.filter(st => st.name.toLowerCase().includes(s) || st.id.toLowerCase().includes(s));
  }, [staffRegistry, staffSearch]);

  const toggleToolSelection = (toolId: string) => {
    setSelectedToolIds(prev => {
      const next = new Set(prev);
      if (next.has(toolId)) {
        next.delete(toolId);
        setQuantities(q => { const n = {...q}; delete n[toolId]; return n; });
        setSelectedPieces(p => { const n = {...p}; delete n[toolId]; return n; });
      } else {
        next.add(toolId);
        setQuantities(q => ({ ...q, [toolId]: 1 }));
        const tool = availableTools.find(t => t.id === toolId);
        if (tool?.composition) {
          const validPieces = tool.composition.filter(p => !p.includes('(MISSING)'));
          setSelectedPieces(p => ({ ...p, [toolId]: new Set(validPieces) }));
        }
      }
      return next;
    });
  };

  const updateQty = (toolId: string, delta: number) => {
    const tool = availableTools.find(t => t.id === toolId);
    if (!tool) return;
    setQuantities(prev => ({
      ...prev,
      [toolId]: Math.max(1, Math.min(Math.max(1, tool.available), (prev[toolId] || 1) + delta))
    }));
  };

  const togglePiece = (toolId: string, piece: string) => {
    if (piece.includes('(MISSING)')) return;
    
    setSelectedPieces(prev => {
      const nextSet = new Set(prev[toolId] || []);
      if (nextSet.has(piece)) nextSet.delete(piece);
      else nextSet.add(piece);
      return { ...prev, [toolId]: nextSet };
    });
  };

  const handleDispatch = () => {
    const staff = staffRegistry.find(s => s.id === selectedStaffId);
    if (selectedToolIds.size === 0 || !staff) return;

    const toolIdsArray = Array.from(selectedToolIds);
    const manifestNotes = toolIdsArray.map(tid => {
      const tool = availableTools.find(t => t.id === tid);
      if (tool?.composition) {
        const selected = Array.from(selectedPieces[tid] || []);
        const validPiecesInRegistry = tool.composition.filter(p => !p.includes('(MISSING)'));
        if (selected.length < validPiecesInRegistry.length) {
          const missingItems = validPiecesInRegistry.filter(p => !selected.includes(p)).map(p => p.replace(/\s*\(DAMAGED\)/g, ''));
          return `[${tool.name} PARTIAL DISPATCH: MISSING ${missingItems.join(', ')}]`;
        }
      }
      return null;
    }).filter(Boolean).join(' | ');

    const fullComment = manifestNotes ? `${comment} ${manifestNotes}`.trim() : comment;

    onConfirm({
      staffId: staff.id,
      staffName: staff.name,
      shiftType: ShiftType.DAY, 
      timeOut: new Date().toLocaleTimeString(),
      issuanceType: 'Section-Held',
      attendantId: currentUser.id,
      attendantName: currentUser.name,
      comment: fullComment
    }, toolIdsArray, quantities);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
      <div className="relative bg-[#F8FAFF] w-full max-w-2xl sm:rounded-[2rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 flex flex-col h-full sm:h-auto sm:max-h-[90vh]">
        
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg">
              <HardHat size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Technical Item Issuance</h3>
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Handover Protocol</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-slate-300 hover:text-slate-900 p-2"><X size={24} /></button>
        </div>

        <div className="p-4 md:p-6 space-y-4 overflow-y-auto no-scrollbar flex-1 bg-white sm:bg-transparent">
          <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 px-5 py-3 rounded-2xl">
             <div className="flex items-center space-x-3">
                <UserCheck size={16} className="text-indigo-600" />
                <div>
                   <p className="text-[7px] font-black text-indigo-400 uppercase tracking-widest">Issuing Officer</p>
                   <p className="text-[10px] font-black text-indigo-700 uppercase">{currentUser.name}</p>
                </div>
             </div>
             <span className="text-[7px] font-black bg-white/50 text-indigo-400 px-2 py-0.5 rounded border border-indigo-100 uppercase">Authorized</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-900 uppercase ml-1">1. Select Asset</label>
              <div className="relative">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                <input className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-[9px] font-bold text-slate-700 outline-none" placeholder="Find tool..." value={toolSearch} onChange={e => setToolSearch(e.target.value)} />
              </div>
              <div className="bg-white border border-slate-100 rounded-xl h-72 overflow-y-auto no-scrollbar p-1.5 space-y-2 shadow-inner">
                {filteredTools.map(t => {
                  const isSelected = selectedToolIds.has(t.id);
                  const isMulti = t.assetClass === 'Set' || t.assetClass === 'Toolbox';
                  const isOutOfStock = t.available <= 0;
                  const hasMissingPieces = t.composition?.some(p => p.includes('(MISSING)'));
                  
                  return (
                    <div key={t.id} className={`p-1.5 rounded-xl border transition-all ${isSelected ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'hover:bg-slate-50 border-transparent'}`}>
                      <div className="flex items-center justify-between cursor-pointer p-1" onClick={() => toggleToolSelection(t.id)}>
                        <div className="flex items-center space-x-2.5 min-w-0">
                           <div className={`p-1.5 rounded-lg border shadow-inner ${isSelected ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-50 text-slate-300 border-slate-100'}`}>
                              <Wrench size={12} />
                           </div>
                           <div className="min-w-0">
                              <p className={`text-[9.5px] font-black uppercase truncate leading-none ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>{t.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                 <p className={`text-[6.5px] font-bold uppercase tracking-widest ${isOutOfStock ? 'text-rose-500' : 'text-slate-400'}`}>
                                    {isOutOfStock ? 'OUT OF STOCK' : `Stock: ${t.available}`}
                                 </p>
                                 {hasMissingPieces && (
                                    <span className="text-[6px] font-black bg-rose-50 text-rose-600 px-1 py-0.5 rounded border border-rose-100 uppercase">Variances</span>
                                 )}
                              </div>
                           </div>
                        </div>
                        {isSelected ? <CheckSquare size={16} className="text-indigo-600" /> : <Square size={16} className="text-slate-200" />}
                      </div>

                      {isSelected && (
                        <div className="mt-2.5 pt-2.5 border-t border-indigo-100 space-y-3 animate-in slide-in-from-top-1 duration-300">
                           <div className="flex items-center justify-between bg-white border border-indigo-100 rounded-lg p-1.5 shadow-sm px-3">
                              <span className="text-[7.5px] font-black text-indigo-400 uppercase">Quantity</span>
                              <div className="flex items-center space-x-3">
                                 <button onClick={(e) => { e.stopPropagation(); updateQty(t.id, -1); }} className="w-6 h-6 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600"><Minus size={12}/></button>
                                 <span className="text-[10px] font-black text-slate-900 tabular-nums w-4 text-center">{quantities[t.id] || 1}</span>
                                 <button onClick={(e) => { e.stopPropagation(); updateQty(t.id, 1); }} className="w-6 h-6 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600"><Plus size={12}/></button>
                              </div>
                           </div>

                           {isMulti && t.composition && (
                             <div className="bg-white/50 border border-indigo-100 rounded-xl p-2.5 space-y-2">
                                <div className="flex items-center justify-between mb-1.5">
                                   <div className="flex items-center space-x-1.5">
                                      <ClipboardList size={10} className="text-indigo-400" />
                                      <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest">Verified Pieces</span>
                                   </div>
                                </div>
                                <div className="grid grid-cols-1 gap-1">
                                   {t.composition.map((piece, i) => {
                                      const isMissing = piece.includes('(MISSING)');
                                      const isDamaged = piece.includes('(DAMAGED)');
                                      const isPieceSelected = selectedPieces[t.id]?.has(piece);
                                      const cleanName = piece.replace(/\s*\(MISSING\)/g, '').replace(/\s*\(DAMAGED\)/g, '');

                                      return (
                                        <button 
                                          key={i} 
                                          disabled={isMissing}
                                          onClick={(e) => { e.stopPropagation(); togglePiece(t.id, piece); }} 
                                          className={`flex items-center justify-between p-2 rounded-lg border transition-all text-left ${
                                            isMissing ? 'bg-rose-50 border-rose-100 opacity-60 cursor-not-allowed' :
                                            isPieceSelected ? 'bg-indigo-50/50 border-indigo-100' : 'bg-white border-slate-100'
                                          }`}
                                        >
                                           <div className="min-w-0 flex flex-col">
                                              <span className={`text-[8.5px] font-black uppercase truncate ${isMissing ? 'text-rose-400 line-through' : isPieceSelected ? 'text-indigo-700' : 'text-slate-400'}`}>
                                                 {cleanName}
                                              </span>
                                              <div className="flex gap-1">
                                                 {isMissing && <span className="text-[6px] font-black text-rose-600 uppercase">MISSING FROM STORE</span>}
                                                 {isDamaged && <span className="text-[6px] font-black text-amber-600 uppercase flex items-center gap-0.5"><AlertTriangle size={6}/> DAMAGED</span>}
                                              </div>
                                           </div>
                                           {isMissing ? <PackageX size={12} className="text-rose-300" /> : isPieceSelected ? <CheckSquare size={12} className="text-indigo-600" /> : <Square size={12} className="text-slate-200" />}
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

            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-900 uppercase ml-1">2. Assign Custodian</label>
              <div className="relative">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                <input className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-[9px] font-bold text-slate-700 outline-none" placeholder="Find staff..." value={staffSearch} onChange={e => setStaffSearch(e.target.value)} />
              </div>
              <div className="bg-white border border-slate-100 rounded-xl h-72 overflow-y-auto no-scrollbar p-1.5 space-y-1 shadow-inner">
                {filteredStaff.map(s => (
                  <div key={s.id} className={`p-2.5 rounded-lg cursor-pointer flex items-center justify-between transition-all ${selectedStaffId === s.id ? 'bg-[#0F1135] text-white shadow-md' : 'hover:bg-indigo-50'}`} onClick={() => setSelectedStaffId(s.id)}>
                    <div className="flex items-center space-x-3">
                       <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${selectedStaffId === s.id ? 'bg-white/10' : 'bg-slate-50 text-indigo-400'}`}>{s.name.charAt(0)}</div>
                       <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase truncate leading-none">{s.name}</p>
                          <p className={`text-[6.5px] font-bold uppercase mt-1 ${selectedStaffId === s.id ? 'text-indigo-300' : 'text-slate-400'}`}>ID: {s.id}</p>
                       </div>
                    </div>
                    {selectedStaffId === s.id && <CheckCircle2 size={14} className="text-emerald-400" />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* FAINT MANIFEST TABLE SUMMARY - ULTRA COMPACT */}
          {selectedToolIds.size > 0 && Array.from(selectedToolIds).some(tid => {
            const tool = availableTools.find(x => x.id === tid);
            return tool?.assetClass === 'Set' || tool?.assetClass === 'Toolbox';
          }) && (
            <div className="space-y-1.5 mt-2 border-t border-slate-100 pt-4 animate-in fade-in duration-700">
               <div className="flex items-center space-x-2 text-slate-400 px-1">
                  <Layers size={10} />
                  <span className="text-[7px] font-black uppercase tracking-widest">Draft Manifest Summary</span>
               </div>
               <div className="bg-slate-50/50 border border-slate-100 rounded-lg overflow-hidden shadow-sm">
                  <table className="w-full text-left table-fixed border-collapse">
                     <thead className="bg-white border-b border-slate-100">
                        <tr className="text-[6px] font-black text-slate-300 uppercase tracking-widest">
                           <th className="py-1.5 px-3 w-1/2">Item Description</th>
                           <th className="py-1.5 px-3">Issuance State</th>
                           <th className="py-1.5 px-3 text-right">Kit Ref</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {Array.from(selectedToolIds).map(tid => {
                           const tool = availableTools.find(x => x.id === tid);
                           if (!tool?.composition) return null;
                           
                           return tool.composition.map((piece, pIdx) => {
                              const isMissing = piece.includes('(MISSING)');
                              const isIssued = selectedPieces[tid]?.has(piece);
                              const cleanName = piece.replace(/\s*\(MISSING\)/g, '').replace(/\s*\(DAMAGED\)/g, '');

                              return (
                                <tr key={`${tid}-${pIdx}`} className="hover:bg-white transition-colors group">
                                   <td className="py-1 px-3">
                                      <span className={`text-[7px] font-medium uppercase truncate block ${isMissing ? 'text-slate-300 line-through' : isIssued ? 'text-slate-600 font-bold' : 'text-slate-400 italic'}`}>
                                         {cleanName}
                                      </span>
                                   </td>
                                   <td className="py-1 px-3">
                                      <div className="flex items-center gap-1">
                                         <div className={`w-1 h-1 rounded-full ${isMissing ? 'bg-rose-300' : isIssued ? 'bg-emerald-400' : 'bg-amber-300'}`}></div>
                                         <span className={`text-[6.5px] font-black uppercase ${isMissing ? 'text-rose-400' : isIssued ? 'text-emerald-600' : 'text-amber-500'}`}>
                                            {isMissing ? 'UNAVAILABLE (MISSING)' : isIssued ? 'ISSUED' : 'RETAINED IN STORE'}
                                         </span>
                                      </div>
                                   </td>
                                   <td className="py-1 px-3 text-right">
                                      <span className="text-[6px] font-bold text-slate-200 uppercase group-hover:text-slate-300 transition-colors truncate block">{tool.name}</span>
                                   </td>
                                </tr>
                              );
                           });
                        })}
                     </tbody>
                  </table>
               </div>
            </div>
          )}

          <div className="space-y-2 pt-2">
             <label className="text-[9px] font-black text-slate-900 uppercase ml-1">3. Handover Context</label>
             <textarea className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-[10px] font-medium text-slate-700 outline-none h-16 shadow-inner focus:ring-1 focus:ring-indigo-500" placeholder="Any specific instructions or notes..." value={comment} onChange={e => setComment(e.target.value)} />
          </div>
        </div>

        <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3 shrink-0 pb-10 sm:pb-6">
          <button onClick={onCancel} className="w-full sm:flex-1 py-3.5 rounded-xl border border-slate-200 text-slate-400 font-black uppercase text-[9px] tracking-widest hover:bg-white">Abort</button>
          <button 
            onClick={handleDispatch}
            disabled={selectedToolIds.size === 0 || !selectedStaffId}
            className="w-full sm:flex-[2] py-3.5 rounded-xl bg-indigo-600 text-white font-black uppercase text-[9px] tracking-[0.15em] hover:bg-indigo-700 transition-all flex items-center justify-center space-x-2 disabled:opacity-40 shadow-xl shadow-indigo-100 active:scale-[0.98]"
          >
            <Send size={16} />
            <span>Finish Issuance</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToolIssuanceModal;
