import { 
  AlertCircle, AlertTriangle, Box, Briefcase, CheckCircle2, CheckSquare, 
  ChevronDown, ClipboardList, Clock, Fingerprint, Hammer, Info, Lock, Minus, 
  PackageX, Plus, Shield, ShieldAlert, ShieldCheck, Timer, UserCheck, Users, X,
  Check, Search, Activity, RotateCcw
} from 'lucide-react';
import React, { useMemo } from 'react';
import { Employee, ToolAsset, ToolCondition, ToolUsageRecord } from '../../../types';
import AuditVarianceOverlay from './AuditVarianceOverlay';

interface AuditCardProps {
  tool: ToolAsset;
  res: any;
  activeHolders: ToolUsageRecord[];
  usageLogs: ToolUsageRecord[]; 
  isMaintenance: boolean;
  completion: number;
  isVariance: boolean;
  isLockedByCase?: boolean;
  isHighlightError?: boolean;
  staffSearch: string;
  filteredStaff: Employee[];
  isPrompting: boolean;
  variancePromptType: 'DAM' | 'LOS' | null;
  varianceTempValue: number;
  onToggleVerification: (id: string) => void;
  onTogglePieceStatus: (id: string, piece: string) => void;
  onMarkAllPiecesFound: (id: string) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onUpdateCondition: (id: string, cond: ToolCondition) => void;
  onStaffSearchChange: (id: string, val: string) => void;
  onLiabilityAssignment: (id: string, staffId: string, staffName: string) => void;
  onUpdatePromptValue: (val: number) => void;
  onNoteChange: (id: string, note: string) => void;
  onExecuteConditionUpdate: (id: string, cond: ToolCondition, val: number) => void;
  onCancelPrompt: () => void;
}

const AuditCard: React.FC<AuditCardProps> = ({ 
  tool, res, activeHolders, usageLogs, isMaintenance, completion, isVariance, isLockedByCase = false, isHighlightError = false,
  staffSearch, filteredStaff, isPrompting, variancePromptType, 
  varianceTempValue, onToggleVerification, onTogglePieceStatus, onMarkAllPiecesFound,
  onUpdateQuantity, onUpdateCondition, onStaffSearchChange, 
  onLiabilityAssignment, onNoteChange, onExecuteConditionUpdate, 
  onCancelPrompt, onUpdatePromptValue 
}) => {
  const isMulti = tool.assetClass === 'Set' || tool.assetClass === 'Toolbox';

  const unresolvedVariances = useMemo(() => {
    return usageLogs.filter(l => l.toolId === tool.id && l.issuanceType === 'Outstanding' && !l.isReturned && l.escalationStatus !== 'Resolved');
  }, [usageLogs, tool.id]);

  const leakedQty = useMemo(() => unresolvedVariances.reduce((acc, curr) => acc + (curr.quantity || 0), 0), [unresolvedVariances]);

  const flaggedPieces = useMemo(() => {
    const pieces = new Set<string>();
    unresolvedVariances.forEach(v => {
      const comment = (v.comment || '').toUpperCase();
      const missingMatch = comment.match(/\[MISSING:\s*([^\]]+)\]/i);
      const damagedMatch = comment.match(/\[DAMAGED:\s*([^\]]+)\]/i);
      
      if (missingMatch) missingMatch[1].split(',').forEach(p => pieces.add(p.trim().toUpperCase()));
      if (damagedMatch) damagedMatch[1].split(',').forEach(p => pieces.add(p.trim().toUpperCase()));
    });
    return pieces;
  }, [unresolvedVariances]);

  const hasLegacyVariance = unresolvedVariances.length > 0;

  const getConditionConfig = (c: string) => {
    switch (c) {
      case 'Excellent': return { label: 'GOOD', color: 'text-emerald-600', active: 'bg-emerald-500 text-white border-emerald-600 shadow-emerald-200', border: 'border-emerald-200', dot: 'bg-emerald-500' };
      case 'Damaged': return { label: 'BROKEN', color: 'text-amber-600', active: 'bg-amber-500 text-white border-amber-600 shadow-amber-200', border: 'border-amber-200', dot: 'bg-amber-500' };
      case 'Lost': return { label: 'MISSING', color: 'text-rose-600', active: 'bg-rose-500 text-white border-rose-600 shadow-rose-200', border: 'border-rose-200', dot: 'bg-rose-500' };
      default: return { label: 'CHECK', color: 'text-slate-400', active: 'bg-slate-900 text-white', border: 'border-slate-200', dot: 'bg-slate-300' };
    }
  };

  const currentQty = res?.quantity ?? (tool?.available || 0);
  const heldCount = tool.quantity - tool.available;
  const holdersNames = activeHolders
    .map(h => h.staffName.split(' ')[0])
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(', ');

  return (
    <div className={`bg-white border rounded-[2.2rem] p-5 shadow-sm transition-all duration-500 flex flex-col space-y-4 relative overflow-hidden ${
      isLockedByCase ? 'border-indigo-200 bg-indigo-50/10 opacity-60' : 
      isHighlightError ? 'border-rose-500 ring-4 ring-rose-100 shadow-xl shadow-rose-100' :
      res?.verified ? (isVariance ? 'border-rose-400 ring-2 ring-rose-50 shadow-lg' : 'border-indigo-500 ring-2 ring-indigo-50 shadow-lg') : 
      'border-slate-100 hover:border-indigo-200'
    }`}>
      
      {(res?.verified && !isVariance) && (
        <div className="absolute -top-2 -right-2 opacity-10 pointer-events-none rotate-12">
          <ShieldCheck size={100} className="text-indigo-600" />
        </div>
      )}

      {hasLegacyVariance && (
        <div className="absolute top-0 right-0 left-0 bg-[#0F1135] py-1.5 text-center shadow-lg z-20">
           <p className="text-[7.5px] font-black text-indigo-300 uppercase tracking-[0.2em] flex items-center justify-center gap-1.5">
             <ShieldAlert size={10} className="text-rose-500" /> {leakedQty} UNIT{leakedQty > 1 ? 'S' : ''} UNDER PROCESS
           </p>
        </div>
      )}

      {isHighlightError && (
        <div className="absolute top-0 right-0 left-0 bg-rose-600 py-1.5 text-center shadow-lg z-20">
           <p className="text-[7.5px] font-black text-white uppercase tracking-[0.2em] flex items-center justify-center gap-1.5">
             <AlertTriangle size={10}/> ACTION REQUIRED
           </p>
        </div>
      )}

      {isPrompting && variancePromptType && (
        <AuditVarianceOverlay 
          type={variancePromptType}
          tempValue={varianceTempValue}
          maxAvailable={tool.available}
          onUpdateTempValue={onUpdatePromptValue}
          onCancel={onCancelPrompt}
          onAuthorize={(c, v) => onExecuteConditionUpdate(tool.id, c, v)}
        />
      )}

      <div className={`flex items-center space-x-3 relative z-10 ${(isHighlightError || hasLegacyVariance) ? 'mt-4' : ''}`}>
        <button 
          onClick={() => !isLockedByCase && onToggleVerification(tool.id)} 
          disabled={isLockedByCase}
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
            isLockedByCase ? 'bg-indigo-100 text-indigo-600 cursor-default' :
            isHighlightError ? 'bg-rose-50 text-rose-600 border-2 border-rose-200' :
            res?.verified ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-300 border border-slate-100 hover:border-indigo-300'
          }`}
        >
          {isLockedByCase ? <Lock size={22} /> : isHighlightError ? <AlertCircle size={22} /> : <ShieldCheck size={22} />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className={`text-sm font-black uppercase tracking-tight leading-[1.2] line-clamp-2 transition-colors ${isHighlightError ? 'text-rose-700' : 'text-slate-900'}`}>{tool.name}</h4>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{tool.category}</span>
            {hasLegacyVariance && <span className="text-[7px] font-black text-rose-500 uppercase tracking-tighter">Variance Active</span>}
          </div>
        </div>
      </div>

      {isMulti && (
        <div className="space-y-2 relative z-10">
          <div className={`p-4 rounded-2xl border transition-all ${res?.verified ? 'bg-white/90 border-slate-100' : 'bg-white border-indigo-200 ring-2 ring-indigo-50 shadow-md'}`}>
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center space-x-2">
                <ClipboardList size={14} className="text-indigo-600" />
                <h4 className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Kits Check</h4>
              </div>
              <button 
                onClick={() => onMarkAllPiecesFound(tool.id)}
                className="text-[7.5px] font-black text-indigo-600 uppercase border border-indigo-200 px-2 py-0.5 rounded hover:bg-indigo-50"
              >
                Find All
              </button>
            </div>
            <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto no-scrollbar pr-1">
              {tool.composition?.map((piece, i) => {
                const pStat = res?.pieceStatus?.[piece];
                const cleanName = piece.replace(/\s*\(MISSING\)/g, '').replace(/\s*\(DAMAGED\)/g, '').toUpperCase();
                const isLegacyFlagged = flaggedPieces.has(cleanName);

                return (
                  <button 
                    key={i} 
                    disabled={isLockedByCase || isLegacyFlagged}
                    onClick={() => onTogglePieceStatus(tool.id, piece)} 
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-left ${
                      isLegacyFlagged ? 'bg-slate-900 border-slate-900 cursor-not-allowed text-white shadow-sm' :
                      isLockedByCase ? 'bg-slate-50 border-slate-100 cursor-not-allowed opacity-60' :
                      !pStat ? 'bg-slate-50 border-slate-100 hover:bg-slate-100 hover:border-slate-200' :
                      pStat === 'Present' ? 'bg-emerald-50/30 border-emerald-200 hover:border-emerald-300 shadow-sm' : 
                      pStat === 'Missing' ? 'bg-rose-50 border-rose-200 shadow-sm' : 
                      'bg-amber-50 border-amber-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`text-[9px] font-black uppercase truncate ${
                        isLegacyFlagged ? 'text-indigo-300' : !pStat ? 'text-slate-400' : pStat === 'Present' ? 'text-emerald-700' : pStat === 'Missing' ? 'text-rose-700' : 'text-amber-700'
                      }`}>{piece}</span>
                      {isLegacyFlagged && <span className="text-[6px] font-black text-rose-500 uppercase tracking-tighter bg-white/10 px-1 rounded">PROCESS ACTIVE</span>}
                    </div>
                    {isLegacyFlagged ? <Lock size={12} className="text-rose-500" /> : !pStat ? <Box size={12} className="text-slate-200" /> : pStat === 'Present' ? <Check size={12} className="text-emerald-500"/> : pStat === 'Missing' ? <PackageX size={12} className="text-rose-500"/> : <Hammer size={12} className="text-amber-500" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {res?.verified && isVariance && (
        <div className="space-y-3 animate-in slide-in-from-top-2 duration-300 bg-slate-50 p-4 rounded-2xl border border-rose-100 shadow-inner relative z-10">
           <div className="space-y-1.5 relative">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Responsible Staff</label>
              <div className="relative group">
                 <UserCheck size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                 <input 
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-[9px] font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm transition-all" 
                    placeholder="Personnel search (blank for self)..."
                    value={staffSearch}
                    onChange={e => onStaffSearchChange(tool.id, e.target.value)}
                 />
                 {filteredStaff.length > 0 && staffSearch && (
                    <div className="absolute bottom-full left-0 right-0 z-50 bg-white border border-slate-200 rounded-xl mb-1 shadow-2xl overflow-hidden max-h-32 overflow-y-auto no-scrollbar">
                       {filteredStaff.map(s => (
                          <button key={s.id} onClick={() => onLiabilityAssignment(tool.id, s.id, s.name)} className="w-full text-left px-4 py-2 hover:bg-indigo-50 flex items-center justify-between border-b border-slate-50 last:border-0 transition-colors">
                             <div className="flex flex-col">
                               <span className="text-[9px] font-black uppercase text-slate-800">{s.name}</span>
                               <span className="text-[7px] font-bold text-slate-400 uppercase">{s.id}</span>
                             </div>
                             <Plus size={12} className="text-indigo-600" />
                          </button>
                       ))}
                    </div>
                 )}
              </div>
              {res.responsibleStaffName && (
                <div className="mt-1.5 flex items-center justify-between px-2 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg animate-in fade-in duration-300">
                   <div className="flex items-center gap-2">
                      <ShieldCheck size={10} className="text-indigo-600" />
                      <span className="text-[8px] font-black text-indigo-700 uppercase truncate max-w-[120px]">{res.responsibleStaffName}</span>
                   </div>
                   <button onClick={() => onLiabilityAssignment(tool.id, '', '')} className="text-indigo-400 hover:text-rose-500 p-1"><X size={10}/></button>
                </div>
              )}
           </div>
           <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                 <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Case Notes</label>
                 <Info size={10} className="text-slate-300" />
              </div>
              <textarea 
                 className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[10px] font-medium text-slate-700 outline-none h-16 focus:ring-1 focus:ring-indigo-500 shadow-sm resize-none"
                 placeholder="Sighting context..."
                 value={res.notes || ''}
                 onChange={e => onNoteChange(tool.id, e.target.value)}
              />
           </div>
        </div>
      )}

      <div className="mt-auto space-y-4 pt-2 relative z-10">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900 border border-white/5 rounded-[1.5rem] p-4 text-center shadow-xl shadow-slate-900/10 relative group overflow-hidden flex flex-col justify-center min-h-[90px]">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 opacity-50"></div>
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 leading-none">Expected</p>
            <div className="flex flex-col items-center">
               <p className="text-2xl font-black text-white tabular-nums leading-none">{tool.available}</p>
               <p className="text-[7px] font-black text-slate-400 uppercase mt-1 tracking-tighter">System Total: {tool.quantity}</p>
            </div>
            {heldCount > 0 && (
              <div className="mt-2 pt-2 border-t border-white/5">
                <p className="text-[6.5px] font-bold text-indigo-400 uppercase tracking-widest leading-tight">
                   Held By: {holdersNames || 'External Registry'}
                </p>
              </div>
            )}
          </div>
          <div className={`rounded-[1.5rem] p-4 text-center border transition-all relative group flex flex-col justify-center min-h-[90px] ${isLockedByCase ? 'bg-indigo-100 border-indigo-200 shadow-inner' : res?.verified ? (isVariance ? 'bg-rose-50 border-rose-300 shadow-xl shadow-rose-100' : 'bg-indigo-50 border-indigo-200 shadow-lg shadow-indigo-100') : 'bg-white border-slate-100 shadow-sm'}`}>
            <p className={`text-[8px] font-black uppercase tracking-widest mb-1 leading-none ${isLockedByCase ? 'text-indigo-600' : res?.verified ? (isVariance ? 'text-rose-600' : 'text-indigo-600') : 'text-slate-400'}`}>Sighted</p>
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center space-x-4">
                <button disabled={isLockedByCase} onClick={() => onUpdateQuantity(tool.id, -1)} className={`w-8 h-8 rounded-lg bg-white/20 border border-current/10 flex items-center justify-center text-slate-300 hover:text-indigo-600 active:scale-90 transition-all ${isLockedByCase ? 'opacity-20 cursor-not-allowed' : ''}`}><Minus size={18}/></button>
                <span className={`text-2xl font-black tabular-nums leading-none ${isLockedByCase ? 'text-indigo-700' : isVariance ? 'text-rose-700' : 'text-indigo-700'}`}>{currentQty}</span>
                <button disabled={isLockedByCase || currentQty >= tool.available} onClick={() => onUpdateQuantity(tool.id, 1)} className={`w-8 h-8 rounded-lg bg-white/20 border border-current/10 flex items-center justify-center text-slate-300 hover:text-indigo-600 active:scale-90 transition-all ${isLockedByCase || currentQty >= tool.available ? 'opacity-20 cursor-not-allowed' : ''}`}><Plus size={18}/></button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-1.5 p-1.5 bg-slate-100/50 rounded-[1.4rem] shadow-inner border border-slate-200/50">
          {['Excellent', 'Damaged', 'Lost'].map(c => {
            const isActive = res?.condition === c;
            const config = getConditionConfig(c);
            return (
              <button 
                key={c} 
                disabled={isLockedByCase}
                onClick={() => !isLockedByCase && onUpdateCondition(tool.id, c as any)} 
                className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 relative group ${
                  isActive 
                    ? `${config.active} scale-[1.05] z-10 shadow-xl ring-4 ring-white/20` 
                    : `text-slate-400 border border-dashed border-slate-300 hover:border-slate-400 hover:bg-white hover:text-slate-600 ${isLockedByCase ? 'opacity-40 cursor-not-allowed' : ''}`
                }`}
              >
                <span className="relative z-10">{config.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AuditCard;