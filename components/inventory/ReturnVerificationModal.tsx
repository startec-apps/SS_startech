
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  CheckCircle, 
  X, 
  ShieldCheck, 
  Wrench, 
  Minus, 
  Plus, 
  AlertTriangle, 
  PackageX, 
  Hammer,
  ClipboardList,
  CheckSquare,
  History,
  RotateCcw,
  PenTool,
  Timer,
  UserCheck,
  Activity,
  Fingerprint
} from 'lucide-react';
import { ToolUsageRecord, ToolCondition, AssetClass, Employee } from '../../types';

interface ReturnVerificationModalProps {
  log: ToolUsageRecord & { 
    imageUrl?: string, 
    assetClass?: AssetClass, 
    composition?: string[],
    preselectedCondition?: ToolCondition,
    currentAvailable?: number,
    totalQuantity?: number
  };
  staffRegistry?: Employee[];
  onConfirm: (id: string, condition: ToolCondition, notes: string, returnedQty: number, nextProtocol?: string, signature?: string, updatedComposition?: string[]) => void;
  onCancel: () => void;
}

const ReturnVerificationModal: React.FC<ReturnVerificationModalProps> = ({ log, staffRegistry = [], onConfirm, onCancel }) => {
  const isAuditResolution = String(log.id).startsWith('VAR-') || String(log.comment).includes('AUDIT_TRACE') || String(log.comment).includes('AUDIT_RECOVERY');
  const [condition, setCondition] = useState<ToolCondition>(log.preselectedCondition || log.conditionOnReturn || (isAuditResolution ? 'Lost' : 'Good'));
  const [notes, setNotes] = useState('');
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  
  const issuedQty = log.quantity || 1;
  const [impactedQty, setImpactedQty] = useState(condition === 'Lost' || condition === 'Damaged' ? issuedQty : 0);
  
  const [pieceStatus, setPieceStatus] = useState<Record<string, 'Present' | 'Missing' | 'Damaged'>>({});
  const isMulti = log.assetClass === 'Set' || log.assetClass === 'Toolbox';
  const hasComposition = log.composition && log.composition.length > 0;
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [hasSignature, setHasSignature] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (isMulti && hasComposition) {
      const initial: Record<string, 'Present' | 'Missing' | 'Damaged'> = {};
      const forensicStr = (log.comment || '').toUpperCase();
      const missingMatch = forensicStr.match(/(?:MISSING|CHECK):\s*([^|\]]+)/i);
      const damagedMatch = forensicStr.match(/DAMAGED:\s*([^|\]]+)/i);
      const missingList = missingMatch ? missingMatch[1].replace(/MISSING:\s*/gi, '').split(',').map(s => s.trim()) : [];
      const damagedList = damagedMatch ? damagedMatch[1].split(',').map(s => s.trim()) : [];

      log.composition!.forEach(p => {
        const cleanPieceName = p.replace(/\s*\(MISSING\)/g, '').replace(/\s*\(DAMAGED\)/g, '').trim().toUpperCase();
        if (missingList.includes(cleanPieceName) || p.includes('(MISSING)')) initial[p] = 'Missing';
        else if (damagedList.includes(cleanPieceName) || p.includes('(DAMAGED)')) initial[p] = 'Damaged';
        else initial[p] = 'Present';
      });
      setPieceStatus(initial);
    }
  }, [isMulti, hasComposition, log.composition, log.comment]);

  // AUTO-RECOVERY LOGIC: Reset impacted quantity if user switches to a healthy state
  useEffect(() => {
    const isHealthy = condition === 'Good' || condition === 'Fair' || condition === 'Excellent';
    if (isHealthy) {
      setImpactedQty(0);
    } else {
      setImpactedQty(issuedQty);
    }
  }, [condition, issuedQty]);

  useEffect(() => {
    if (showSignaturePad && canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) { canvas.width = rect.width; canvas.height = rect.height; }
      const ctx = canvas.getContext('2d');
      if (ctx) { ctx.lineCap = 'round'; ctx.strokeStyle = '#0F1135'; ctx.lineWidth = 3; contextRef.current = ctx; }
    }
  }, [showSignaturePad]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; }
    else { clientX = (e as React.MouseEvent).clientX; clientY = (e as React.MouseEvent).clientY; }
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!contextRef.current) return;
    const { x, y } = getCoordinates(e);
    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
    if ('touches' in e) (e as any).preventDefault();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!contextRef.current || !isDrawing) return;
    const { x, y } = getCoordinates(e);
    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();
    if ('touches' in e) (e as any).preventDefault();
  };

  const stopDrawing = () => {
    if (contextRef.current) contextRef.current.closePath();
    setIsDrawing(false);
  };

  const [strategy, setStrategy] = useState<'Search' | 'Replacement' | 'Supervisor'>(
    log.escalationStatus === 'In-Grace-Period' ? 'Replacement' : 
    log.escalationStage === 'Supervisor' ? 'Supervisor' : 'Search'
  );
  
  const isVariance = condition === 'Lost' || condition === 'Damaged';

  const togglePiece = (piece: string) => {
    setPieceStatus(prev => {
      const current = prev[piece];
      let next: 'Present' | 'Missing' | 'Damaged' = 'Present';
      if (current === 'Present') next = 'Missing';
      else if (current === 'Missing') next = 'Damaged';
      return { ...prev, [piece]: next };
    });
  };

  const manifestCompletion = useMemo(() => {
    if (!isMulti || !hasComposition) return 100;
    return Math.round((Object.keys(pieceStatus).length / log.composition!.length) * 100);
  }, [isMulti, hasComposition, log.composition, pieceStatus]);

  const executeCommit = (optionalSignature?: string | null) => {
    const sig = optionalSignature !== undefined ? optionalSignature : canvasRef.current?.toDataURL();
    let finalNotes = notes;
    const updatedComp: string[] = [];
    
    if (isMulti && hasComposition) {
      log.composition!.forEach(p => {
        const status = pieceStatus[p];
        const cleanName = p.replace(/\s*\(MISSING\)/g, '').replace(/\s*\(DAMAGED\)/g, '');
        if (status === 'Missing') updatedComp.push(`${cleanName} (MISSING)`);
        else if (status === 'Damaged') updatedComp.push(`${cleanName} (DAMAGED)`);
        else updatedComp.push(cleanName);
      });
      
      const missing = updatedComp.filter(p => p.includes('(MISSING)')).map(p => p.replace(' (MISSING)', ''));
      const damaged = updatedComp.filter(p => p.includes('(DAMAGED)')).map(p => p.replace(' (DAMAGED)', ''));
      const summary = [missing.length ? `MISSING: ${missing.join(', ')}` : '', damaged.length ? `DAMAGED: ${damaged.join(', ')}` : ''].filter(Boolean).join(' | ');
      if (summary) finalNotes = finalNotes ? `${finalNotes} | [VARIANCE: ${summary}]` : `[VARIANCE: ${summary}]`;
    }

    const actualReturned = issuedQty - impactedQty;
    const nextProtocol = (condition === 'Lost' || (isMulti && updatedComp.some(p => p.includes('MISSING')))) ? (strategy === 'Search' ? 'start_search' : strategy === 'Replacement' ? 'grant_grace' : 'escalate_to_manager') : undefined;
    
    onConfirm(log.id, condition, finalNotes, Math.max(0, actualReturned), nextProtocol, sig || undefined, updatedComp.length > 0 ? updatedComp : undefined);
  };

  const handleFinalize = () => {
    if (isMulti && hasComposition && manifestCompletion < 100) return alert("Please check all items in the kit.");
    const hasPieceLoss = Object.values(pieceStatus).some(s => s === 'Missing');
    if ((condition === 'Lost' || (isMulti && hasPieceLoss)) && strategy === 'Replacement') {
      setShowSignaturePad(true);
    } else {
      executeCommit(null);
    }
  };

  const getSOPConfig = (id: string) => {
    switch(id) {
      case 'Search': return { label: 'START SEARCH', status: 'SEARCHING', color: 'text-indigo-600 bg-indigo-50 border-indigo-100', icon: <Activity size={16}/>, desc: 'Staff will look for the tool' };
      case 'Replacement': return { label: 'STAFF WILL REPLACE', status: '30 DAYS TO REPLACE', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: <Timer size={16}/>, desc: 'Staff agrees to buy a replacement' };
      case 'Supervisor': return { label: 'TELL SUPERVISOR', status: `WAITING FOR SUPERVISOR`, color: 'text-white bg-[#4338CA] border-[#4338CA]', icon: <UserCheck size={16}/>, desc: 'Let management handle this' };
      default: return { label: '', status: '', color: '', icon: null, desc: '' };
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto no-scrollbar">
      <div className="relative bg-[#F8FAFF] w-full max-w-xl rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[95vh] my-auto">
        
        {showSignaturePad && (
          <div className="absolute inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
             <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                   <h3 className="text-sm font-black uppercase tracking-tight">Staff Agreement</h3>
                   <button onClick={() => setShowSignaturePad(false)} className="text-slate-300 hover:text-slate-900 p-2"><X size={20}/></button>
                </div>
                <div className="p-8 space-y-6">
                   <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] h-48 relative overflow-hidden shadow-inner">
                      <canvas ref={canvasRef} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} className="w-full h-full cursor-crosshair" />
                      {!hasSignature && <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-40"><PenTool size={24} className="text-slate-300 mb-2"/><p className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-300 text-center px-8">Sign here to agree to replacement</p></div>}
                   </div>
                   <div className="flex items-center justify-between">
                      <button onClick={() => { contextRef.current?.clearRect(0,0,1000,1000); setHasSignature(false); }} className="text-[9px] font-black text-rose-500 uppercase flex items-center gap-1"><RotateCcw size={12}/> Reset</button>
                      <span className="text-[10px] font-black text-[#0F1135] uppercase">{log.staffName}</span>
                   </div>
                   <button onClick={() => executeCommit()} disabled={!hasSignature} className="w-full py-5 bg-[#0F1135] text-white rounded-[1.8rem] font-black uppercase text-[10px] shadow-2xl disabled:opacity-40 active:scale-95">I Agree to Replace Tool</button>
                </div>
             </div>
          </div>
        )}

        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center space-x-4">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-lg transition-colors duration-500 ${isAuditResolution ? 'bg-rose-600' : 'bg-indigo-600'}`}>
              {isAuditResolution ? <AlertTriangle size={22} /> : <ShieldCheck size={22} />}
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{isAuditResolution ? 'Resolve Audit Variance' : 'Verify Asset Return'}</h3>
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1.5">{isAuditResolution ? 'RECONCILING REGISTRY DELTA' : 'HANDOVER PROTOCOL'}</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-slate-300 hover:text-slate-900 p-2"><X size={24} /></button>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto no-scrollbar flex-1">
          <div className="flex items-center justify-between p-5 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="flex items-center space-x-5 min-w-0 flex-1">
               <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                  {log.imageUrl ? <img src={log.imageUrl} className="w-full h-full object-cover" /> : <Wrench size={24} className="text-slate-300" />}
               </div>
               <div className="min-w-0">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">ASSET IDENTITY</p>
                  <h4 className="text-sm font-black text-slate-900 uppercase truncate leading-tight">{log.toolName}</h4>
                  <div className="flex items-center gap-2 mt-1">
                     <Fingerprint size={10} className="text-indigo-400" />
                     <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">TRACE_REF: {log.id}</span>
                  </div>
               </div>
            </div>
            <div className="text-right shrink-0">
               <div className={`px-4 py-2 rounded-xl border shadow-inner ${isAuditResolution ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
                  <p className={`text-[7px] font-black uppercase tracking-widest ${isAuditResolution ? 'text-rose-400' : 'text-indigo-400'}`}>
                    {isAuditResolution ? 'Qty Missing' : 'In Custody'}
                  </p>
                  <span className={`text-lg font-black tabular-nums ${isAuditResolution ? 'text-rose-600' : 'text-indigo-600'}`}>{issuedQty} UNIT(S)</span>
               </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[8.5px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 px-1">
              <ShieldCheck size={14} className="text-indigo-600" /> Resolution Logic State
            </label>
            <div className="flex bg-slate-100/50 p-1.5 rounded-[1.5rem] gap-1.5 border border-slate-100 shadow-inner">
              {(['Good', 'Fair', 'Damaged', 'Lost'] as ToolCondition[]).map((c) => (
                 <button key={c} type="button" onClick={() => setCondition(c)} className={`flex-1 py-4 rounded-xl text-[8.5px] font-black uppercase tracking-widest transition-all ${condition === c ? (c === 'Lost' ? 'bg-[#0F1135] text-white' : c === 'Damaged' ? 'bg-amber-50 text-white' : 'bg-emerald-600 text-white') + ' shadow-lg scale-[1.02]' : 'bg-white text-slate-400 border border-slate-100'}`}>{c}</button>
              ))}
            </div>
          </div>

          {(condition === 'Lost' || condition === 'Damaged') && !isAuditResolution && (
             <div className="bg-[#0F1135] rounded-[2rem] p-6 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between bg-white/5 p-5 rounded-3xl border border-white/10 shadow-inner">
                   <button onClick={() => setImpactedQty(Math.max(1, impactedQty - 1))} className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white"><Minus size={24}/></button>
                   <div className="flex flex-col items-center">
                      <span className="text-4xl font-black text-white tabular-nums leading-none">{impactedQty}</span>
                      <p className="text-[8px] font-black text-white/40 uppercase mt-2 tracking-widest">WHOLE UNIT(S) {condition.toUpperCase()}</p>
                   </div>
                   <button onClick={() => setImpactedQty(Math.min(issuedQty, impactedQty + 1))} className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white"><Plus size={24}/></button>
                </div>
             </div>
          )}

          {isMulti && hasComposition && (
            <div className={`bg-white border rounded-[2.2rem] p-6 space-y-5 shadow-sm transition-all duration-500 ${manifestCompletion === 100 ? 'border-emerald-100' : 'border-indigo-100'}`}>
               <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                     <div className={`p-2 rounded-xl border ${manifestCompletion === 100 ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}><ClipboardList size={16} /></div>
                     <p className="text-[10px] font-black uppercase tracking-widest">Verify Kit Pieces • {manifestCompletion}%</p>
                  </div>
                  <button onClick={() => {const n:any={}; log.composition?.forEach(p=>n[p]='Present'); setPieceStatus(n);}} className="text-[7px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200 uppercase">Clear All</button>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto no-scrollbar">
                  {log.composition!.map((piece, idx) => {
                    const status = pieceStatus[piece] || 'Missing';
                    const cleanName = piece.replace(/\s*\(MISSING\)/g, '').replace(/\s*\(DAMAGED\)/g, '');
                    return <button key={idx} onClick={() => togglePiece(piece)} className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${status === 'Present' ? 'bg-emerald-50/30 border-emerald-100' : status === 'Missing' ? 'bg-rose-50 border-rose-300' : 'bg-amber-50/50 border-amber-200'}`}><span className={`text-[10px] font-black uppercase truncate pr-2 ${status === 'Present' ? 'text-emerald-700' : status === 'Missing' ? 'text-rose-700' : 'text-amber-700'}`}>{cleanName}</span>{status === 'Present' ? <CheckSquare size={16} className="text-emerald-500"/> : status === 'Missing' ? <PackageX size={16} className="text-rose-500 animate-pulse"/> : <Hammer size={16} className="text-amber-500"/>}</button>;
                  })}
               </div>
            </div>
          )}

          {(condition === 'Lost' || (isMulti && Object.values(pieceStatus).some(s => s === 'Missing'))) && (
            <div className="space-y-4 animate-in slide-in-from-bottom-3">
               <label className="text-[8.5px] font-black text-slate-900 uppercase tracking-widest px-1">Institutional Protocol Directive</label>
               <div className="grid grid-cols-1 gap-4">
                  {(['Search', 'Replacement', 'Supervisor'] as const).map((id) => {
                    const conf = getSOPConfig(id);
                    const isActive = strategy === id;
                    return (
                      <button key={id} type="button" onClick={() => setStrategy(id)} className={`relative flex flex-col p-5 rounded-[2rem] border transition-all text-left ${isActive ? 'bg-white border-indigo-600 shadow-xl ring-2 ring-indigo-50' : 'bg-white border-slate-100 hover:border-indigo-200 shadow-sm'}`}>
                         <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                               <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${isActive ? 'bg-[#0F1135] text-white' : 'bg-slate-50 text-slate-300'}`}>{conf.icon}</div>
                               <div className="min-w-0">
                                  <p className={`text-[11px] font-black uppercase tracking-tight ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>{conf.label}</p>
                                  <p className="text-[7.5px] font-bold text-slate-400 uppercase tracking-[0.1em] mt-2">{conf.desc}</p>
                               </div>
                            </div>
                            {isActive && <CheckCircle size={18} className="text-indigo-600" />}
                         </div>
                         <div className="h-px w-full bg-slate-50 mb-4"></div>
                         <div className="flex items-center justify-between">
                            <div className={`px-3 py-1 rounded-lg border flex items-center gap-1.5 shadow-sm transition-all ${conf.color}`}>
                               {conf.icon && React.cloneElement(conf.icon as React.ReactElement<any>, { size: 10 })}
                               <span className="text-[8px] font-black uppercase tracking-widest">{conf.status}</span>
                            </div>
                         </div>
                      </button>
                    );
                  })}
               </div>
            </div>
          )}

          <div className="space-y-3">
            <label className="text-[8.5px] font-black text-slate-900 uppercase tracking-widest px-1">Case Authorization Notes</label>
            <textarea className="w-full bg-white border border-slate-200 rounded-[1.8rem] px-6 py-5 text-[10px] font-medium text-slate-700 outline-none h-28 shadow-inner focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="Detail any sighting discrepancies or technical state..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>

        <div className="p-8 bg-white border-t border-slate-100 flex flex-col sm:flex-row gap-4 shrink-0">
          <button onClick={onCancel} className="flex-1 py-4 rounded-2xl border border-slate-200 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all">Cancel</button>
          <button onClick={handleFinalize} className={`flex-[1.8] py-4 rounded-2xl text-white font-black uppercase text-[10px] shadow-2xl active:scale-95 transition-all ${condition === 'Lost' || (isMulti && Object.values(pieceStatus).some(s => s === 'Missing')) ? 'bg-[#0F1135] hover:bg-[#1E2045]' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
             <span className="flex items-center justify-center gap-2">
                <ShieldCheck size={18} />
                Authorize & Reconcile
             </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReturnVerificationModal;
