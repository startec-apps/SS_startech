import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, PenTool, RotateCcw, ShieldCheck, X, AlertTriangle, PackageSearch } from 'lucide-react';
import { Employee, MaintenanceRecord, ToolAsset, ToolCondition, ToolUsageRecord, WorkshopZone, ShiftType } from '../../types';
import AuditCard from './audit/AuditCard';
import AuditFooter from './audit/AuditFooter';
import AuditHeader from './audit/AuditHeader';
import AuditZoneNav from './audit/AuditZoneNav';

interface WeeklyAuditModalProps {
  tools: ToolAsset[];
  usageLogs: ToolUsageRecord[];
  maintenanceHistory?: MaintenanceRecord[];
  staff?: Employee[];
  currentUser: Employee;
  targetZone: WorkshopZone | 'Full Store';
  onSave: (findings: any[], signature: string, auditType: 'weekly' | 'monthly') => void;
  onCancel: () => void;
}

interface AuditResult {
  condition: ToolCondition | null; 
  verified: boolean; 
  notes: string; 
  quantity: number; 
  damagedQuantity: number;
  pieceStatus: Record<string, 'Present' | 'Missing' | 'Damaged'>;
  responsibleStaffId?: string;
  responsibleStaffName?: string;
}

const WeeklyAuditModal: React.FC<WeeklyAuditModalProps> = ({ tools, usageLogs, maintenanceHistory = [], staff = [], targetZone, onSave, onCancel, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [auditType, setAuditType] = useState<'weekly' | 'monthly'>('weekly');
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [auditResults, setAuditResults] = useState<Record<string, AuditResult>>({});
  const [staffSearch, setStaffSearch] = useState<Record<string, string>>({});
  const [errorIds, setErrorIds] = useState<Set<string>>(new Set());
  
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    if (showSignaturePad && canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#0F1135';
        ctx.lineWidth = 2.5;
        contextRef.current = ctx;
      }
    }
  }, [showSignaturePad]);

  const getPointerPos = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!contextRef.current) return;
    const { x, y } = getPointerPos(e);
    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
    setIsDrawing(true);
    if ('touches' in e) e.preventDefault();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !contextRef.current) return;
    const { x, y } = getPointerPos(e);
    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();
    if ('touches' in e) e.preventDefault();
  };

  const stopDrawing = () => {
    if (contextRef.current) contextRef.current.closePath();
    setIsDrawing(false);
  };

  const auditTools = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return tools.filter(t => (targetZone === 'Full Store' || t.zone === targetZone))
                .filter(t => (t.name || '').toLowerCase().includes(s) || (t.id || '').toLowerCase().includes(s));
  }, [tools, targetZone, searchTerm]);

  const uniqueZones = useMemo(() => Array.from(new Set(auditTools.map(t => t.zone))).sort(), [auditTools]);
  const currentZoneSection = uniqueZones[currentSectionIndex];
  const toolsInSection = useMemo(() => auditTools.filter(t => t.zone === currentZoneSection), [auditTools, currentZoneSection]);

  const focusFirstError = (ids: string[]) => {
    if (ids.length === 0) return;
    const firstId = ids[0];
    const element = document.getElementById(`audit-card-${firstId}`);
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const toggleVerification = (toolId: string) => {
    const tool = tools.find(t => t.id === toolId);
    if (!tool) return;
    setAuditResults(prev => {
      const current = prev[toolId] || { condition: 'Excellent' as ToolCondition, verified: false, notes: '', quantity: tool.available || 0, damagedQuantity: 0, pieceStatus: {} };
      return { ...prev, [toolId]: { ...current, verified: !current.verified } };
    });
    setErrorIds(prev => {
      const next = new Set(prev);
      next.delete(toolId);
      return next;
    });
  };

  const markAllPiecesFound = (toolId: string) => {
    const tool = tools.find(t => t.id === toolId);
    if (!tool || !tool.composition) return;
    const nextPieceStatus: Record<string, 'Present'> = {};
    tool.composition.forEach(p => nextPieceStatus[p] = 'Present');
    setAuditResults(prev => ({
      ...prev,
      [toolId]: {
        // Fix: Ensure all AuditResult properties are present in fallback
        ...(prev[toolId] || { condition: 'Excellent' as ToolCondition, verified: false, notes: '', quantity: tool.available, damagedQuantity: 0, pieceStatus: {} }),
        pieceStatus: nextPieceStatus,
        condition: 'Excellent' as ToolCondition,
        verified: true
      }
    }));
    setErrorIds(prev => {
      const next = new Set(prev);
      next.delete(toolId);
      return next;
    });
  };

  const togglePieceStatus = (toolId: string, piece: string) => {
    setAuditResults(prev => {
      const tool = tools.find(t => t.id === toolId);
      const current = prev[toolId] || { condition: 'Excellent' as ToolCondition, verified: false, notes: '', quantity: tool?.available || 0, damagedQuantity: 0, pieceStatus: {} };
      const currentStatus = current.pieceStatus[piece];
      let nextStatus: 'Present' | 'Missing' | 'Damaged' = 'Present';
      if (!currentStatus) nextStatus = 'Present';
      else if (currentStatus === 'Present') nextStatus = 'Missing';
      else if (currentStatus === 'Missing') nextStatus = 'Damaged';
      else if (currentStatus === 'Damaged') nextStatus = 'Present';
      const nextPieceStatus = { ...current.pieceStatus, [piece]: nextStatus };
      let nextCondition: ToolCondition = 'Excellent';
      if (Object.values(nextPieceStatus).some(s => s === 'Missing')) nextCondition = 'Lost';
      else if (Object.values(nextPieceStatus).some(s => s === 'Damaged')) nextCondition = 'Damaged';
      return { ...prev, [toolId]: { ...current, pieceStatus: nextPieceStatus, condition: nextCondition, verified: true } };
    });
    setErrorIds(prev => {
      const next = new Set(prev);
      next.delete(toolId);
      return next;
    });
  };

  const [promptData, setPromptData] = useState<{toolId: string, type: 'DAM' | 'LOS', val: number} | null>(null);

  const initiateConditionUpdate = (toolId: string, type: 'DAM' | 'LOS') => {
    const tool = tools.find(t => t.id === toolId);
    if (!tool) return;
    setPromptData({ toolId, type, val: 1 });
  };

  const executeConditionUpdate = (toolId: string, cond: ToolCondition, val: number) => {
    const tool = tools.find(t => t.id === toolId);
    if (!tool) return;
    setAuditResults(prev => ({
      ...prev,
      [toolId]: {
        // Fix: Ensure all AuditResult properties are present in fallback
        ...(prev[toolId] || { condition: 'Excellent' as ToolCondition, verified: false, notes: '', quantity: tool.available, damagedQuantity: 0, pieceStatus: {} }),
        condition: cond,
        quantity: (cond === 'Lost' || cond === 'Damaged') ? Math.max(0, tool.available - val) : tool.available,
        verified: true
      }
    }));
    setPromptData(null);
    setErrorIds(prev => {
      const next = new Set(prev);
      next.delete(toolId);
      return next;
    });
  };

  const handleFinalize = () => {
    const sigData = canvasRef.current?.toDataURL('image/png') || '';
    const findings = (Object.entries(auditResults) as [string, AuditResult][])
      .filter(([_, res]) => res.verified)
      .map(([id, res]) => {
        const tool = tools.find(t => t.id === id);
        const isVariance = (res.quantity || 0) < (tool?.available || 0) || res.condition === 'Lost' || res.condition === 'Damaged';
        const finalStaffId = isVariance ? (res.responsibleStaffId || currentUser.id) : undefined;
        const finalStaffName = isVariance ? (res.responsibleStaffName || currentUser.name) : undefined;
        
        let finalNotes = res.notes;
        if (tool?.assetClass === 'Set' || tool?.assetClass === 'Toolbox') {
          const missingPieces = Object.entries(res.pieceStatus).filter(([_, s]) => s === 'Missing').map(([p]) => p);
          const damagedPieces = Object.entries(res.pieceStatus).filter(([_, s]) => s === 'Damaged').map(([p]) => p);
          
          if (missingPieces.length > 0 || damagedPieces.length > 0) {
            const missingSection = missingPieces.length > 0 ? `[MISSING: ${missingPieces.join(', ')}]` : '';
            const damagedSection = damagedPieces.length > 0 ? `[DAMAGED: ${damagedPieces.join(', ')}]` : '';
            const pieceDetails = `${missingSection} ${damagedSection}`.trim();
            finalNotes = finalNotes ? `${finalNotes} | ${pieceDetails}` : pieceDetails;
          }
        }
        
        return { toolId: id, condition: res.condition || 'Excellent', notes: finalNotes, quantity: res.quantity, expectedQty: tool?.available || 0, responsibleStaffId: finalStaffId, responsibleStaffName: finalStaffName, pieceStatus: res.pieceStatus };
      });
    onSave(findings, sigData, auditType);
  };

  const filteredStaff = (query: string) => {
    const q = query.toLowerCase();
    return staff.filter(s => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)).slice(0, 5);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-md overflow-y-auto no-scrollbar">
      <div className="relative bg-[#F8FAFF] w-full max-w-7xl h-full sm:h-auto sm:rounded-[2rem] shadow-2xl border border-white/10 animate-in zoom-in-95 duration-300 flex flex-col sm:max-h-[90vh]">
        <AuditHeader currentZone={currentZoneSection} targetZone={targetZone} searchTerm={searchTerm} onSearchChange={setSearchTerm} onCancel={onCancel} />
        
        {/* Inspection Interval Selector */}
        <div className="bg-white border-b border-slate-100 py-3 px-6 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            <div>
              <p className="text-[9px] font-black text-slate-800 uppercase tracking-widest leading-none">Inspection Scope Checklist</p>
              <p className="text-[7.5px] font-bold text-slate-400 uppercase tracking-tight mt-1">Select periodic frequency audit depth</p>
            </div>
          </div>
          <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/50 max-w-xs w-full sm:w-auto">
            <button
              onClick={() => setAuditType('weekly')}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-[8.5px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                auditType === 'weekly'
                  ? 'bg-[#0F1135] text-white shadow'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Weekly Standard
            </button>
            <button
              onClick={() => setAuditType('monthly')}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-[8.5px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                auditType === 'monthly'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Monthly Deep
            </button>
          </div>
        </div>

        <AuditZoneNav zones={uniqueZones} activeIndex={currentSectionIndex} onZoneSelect={(idx) => {
          const unverifiedIds = toolsInSection.filter(t => !auditResults[t.id]?.verified).map(t => t.id);
          if (unverifiedIds.length === 0 || idx < currentSectionIndex) setCurrentSectionIndex(idx);
          else { setErrorIds(new Set(unverifiedIds)); focusFirstError(unverifiedIds); }
        }} />
        <div className="flex-1 p-4 md:p-6 overflow-y-auto no-scrollbar bg-slate-50/30">
           {errorIds.size > 0 && (
             <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2">
                <AlertTriangle className="text-rose-600" size={20} />
                <p className="text-[10px] font-black text-rose-700 uppercase tracking-widest">Action Required: Please check the {errorIds.size} remaining items highlighted below.</p>
             </div>
           )}
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {toolsInSection.map(tool => {
                const res = auditResults[tool.id] || { verified: false, condition: 'Excellent', quantity: tool.available, pieceStatus: {} };
                const isVariance = res.verified && (res.quantity < tool.available || res.condition === 'Lost' || res.condition === 'Damaged');
                return (
                  <div key={tool.id} id={`audit-card-${tool.id}`}>
                    <AuditCard 
                      tool={tool} res={res} activeHolders={usageLogs.filter(l => l.toolId === tool.id && !l.isReturned)}
                      usageLogs={usageLogs}
                      isMaintenance={tool.condition === 'Maintenance'} completion={tool.composition ? Math.round((Object.keys(res.pieceStatus).length / tool.composition.length) * 100) : 0}
                      isVariance={isVariance} isHighlightError={errorIds.has(tool.id)} onToggleVerification={toggleVerification} onTogglePieceStatus={togglePieceStatus}
                      onMarkAllPiecesFound={() => markAllPiecesFound(tool.id)} onUpdateQuantity={(id, delta) => {
                        setAuditResults(prev => {
                          // Fix: Ensure all AuditResult properties are present in fallback
                          const current = prev[id] || { condition: 'Excellent' as ToolCondition, verified: false, notes: '', quantity: tool.available, damagedQuantity: 0, pieceStatus: {} };
                          const newQty = Math.min(tool.available, Math.max(0, (current.quantity ?? tool.available) + delta));
                          let nextCondition = current.condition;
                          if (newQty < tool.available) nextCondition = 'Lost';
                          else if (newQty === tool.available && current.condition === 'Lost') nextCondition = 'Excellent';
                          return { ...prev, [id]: { ...current, quantity: newQty, condition: nextCondition, verified: true } };
                        });
                        setErrorIds(prev => { const n = new Set(prev); n.delete(id); return n; });
                      }}
                      onUpdateCondition={(id, cond) => {
                        if (cond === 'Excellent') {
                          setAuditResults(prev => ({ 
                            ...prev, 
                            [id]: { 
                              // Fix: Ensure all AuditResult properties are present in fallback and update
                              ...(prev[id] || { condition: 'Excellent' as ToolCondition, verified: false, notes: '', quantity: tool.available, damagedQuantity: 0, pieceStatus: {} }), 
                              condition: 'Excellent' as ToolCondition, 
                              quantity: tool.available, 
                              verified: true 
                            } 
                          }));
                          setErrorIds(prev => { const n = new Set(prev); n.delete(id); return n; });
                        } else initiateConditionUpdate(id, cond === 'Damaged' ? 'DAM' : 'LOS');
                      }}
                      onNoteChange={(id, note) => setAuditResults(prev => ({ ...prev, [id]: { ...prev[id], notes: note } as any }))}
                      staffSearch={staffSearch[tool.id] || ''} filteredStaff={filteredStaff(staffSearch[tool.id] || '')}
                      onStaffSearchChange={(id, val) => setStaffSearch(prev => ({ ...prev, [id]: val }))}
                      onLiabilityAssignment={(tid, sid, sname) => {
                        setAuditResults(prev => ({ ...prev, [tid]: { ...prev[tid], responsibleStaffId: sid, responsibleStaffName: sname } as any }));
                        setStaffSearch(prev => ({ ...prev, [tid]: '' }));
                      }}
                      isPrompting={promptData?.toolId === tool.id} variancePromptType={promptData?.type || null} varianceTempValue={promptData?.val || 1}
                      onExecuteConditionUpdate={executeConditionUpdate} onCancelPrompt={() => setPromptData(null)} onUpdatePromptValue={(v) => setPromptData(p => p ? {...p, val: v} : null)}
                    />
                  </div>
                );
              })}
           </div>
        </div>
        <AuditFooter 
          verifiedCount={(Object.values(auditResults) as AuditResult[]).filter(r => r.verified).length} totalCount={auditTools.length}
          flagCount={(Object.entries(auditResults) as [string, AuditResult][]).filter(([id, res]) => {
            const tool = tools.find(t => t.id === id);
            return res.verified && ((res.quantity || 0) < (tool?.available || 0) || res.condition === 'Lost' || res.condition === 'Damaged');
          }).length}
          isFirstSection={currentSectionIndex === 0} isLastSection={currentSectionIndex === uniqueZones.length - 1}
          onBack={() => setCurrentSectionIndex(p => p - 1)} onNext={() => {
            const unverifiedIds = toolsInSection.filter(t => !auditResults[t.id]?.verified).map(t => t.id);
            if (unverifiedIds.length === 0) setCurrentSectionIndex(p => p + 1);
            else { setErrorIds(new Set(unverifiedIds)); focusFirstError(unverifiedIds); }
          }}
          onFinalize={() => {
            const unverifiedIds = toolsInSection.filter(t => !auditResults[t.id]?.verified).map(t => t.id);
            if (unverifiedIds.length === 0) setShowSignaturePad(true);
            else { setErrorIds(new Set(unverifiedIds)); focusFirstError(unverifiedIds); }
          }}
        />
        {showSignaturePad && (
          <div className="absolute inset-0 z-[250] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-6">
             <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl flex flex-col border border-white/20 animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-8">
                   <div>
                      <h3 className="font-black uppercase text-xs text-slate-900">Sign Your Name</h3>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Audit Certification</p>
                   </div>
                   <button onClick={() => setShowSignaturePad(false)} className="text-slate-300 hover:text-slate-900"><X size={20}/></button>
                </div>
                <div className="border-2 border-dashed border-slate-200 h-48 bg-slate-50 mb-8 rounded-[1.8rem] relative overflow-hidden group">
                   <canvas 
                      ref={canvasRef} className="w-full h-full cursor-crosshair touch-none relative z-10" 
                      onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
                   />
                   <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none text-[8px] font-black uppercase tracking-[0.4em] text-slate-400">Sign Below</div>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => { if (contextRef.current && canvasRef.current) contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); }} className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase text-[9px] hover:bg-slate-200">Clear</button>
                  <button onClick={handleFinalize} className="flex-[2] py-4 bg-[#0F1135] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-indigo-600 transition-all active:scale-95 flex items-center justify-center space-x-2"><ShieldCheck size={20} /> <span>Finish Audit</span></button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeeklyAuditModal;