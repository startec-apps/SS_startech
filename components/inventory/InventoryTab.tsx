import React, { useState, useMemo } from 'react';
import { 
  Wrench, 
  Edit2, 
  Trash2,
  MapPin, 
  User,
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  X,
  Box,
  CheckCircle2,
  History,
  Calendar,
  UserCheck,
  ShieldCheck,
  Activity,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  Info,
  Clock,
  Fingerprint,
  PackageX,
  Users
} from 'lucide-react';
import { ToolAsset, ToolUsageRecord, ToolCondition } from '../../types';

interface InventoryTabProps {
  filteredTools: ToolAsset[];
  onEnroll: () => void;
  onEdit: (tool: ToolAsset) => void;
  onDelete?: (id: string) => void;
  usageLogs: ToolUsageRecord[];
  hasPermission: (module: string, action?: any, subHub?: string) => boolean;
  onUpdateTools?: (tools: ToolAsset[]) => void;
  isSystemBusy?: boolean;
  setSystemBusy?: (busy: boolean) => void;
}

const InventoryTab: React.FC<InventoryTabProps> = ({ 
  filteredTools, 
  onEdit, 
  onDelete, 
  usageLogs, 
  hasPermission
}) => {
  const [expandedToolId, setExpandedToolId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const canUpdate = hasPermission('inventory', 'update', 'master');
  const canDelete = hasPermission('inventory', 'delete', 'master');

  const toggleToolDropdown = (id: string) => {
    setExpandedToolId(prev => (prev === id ? null : id));
  };

  // ADVANCED SORTING LOGIC: PENDING/ISSUES TO THE TOP
  const sortedTools = useMemo(() => {
    return [...filteredTools].sort((a, b) => {
      const getToolMetrics = (tool: ToolAsset) => {
        const toolLogs = usageLogs.filter(l => l.toolId === tool.id && !l.isReturned);
        const inDeployment = toolLogs.filter(l => l.issuanceType === 'Daily' || l.issuanceType === 'Section-Held').length;
        const variations = toolLogs.filter(l => l.issuanceType === 'Outstanding').length;
        const isOutOfStock = tool.available < tool.quantity;
        
        // Priority Score Calculation
        let score = 0;
        if (variations > 0) score += 100; // Critical: Unresolved variances (lost/damaged leaks)
        if (inDeployment > 0) score += 50; // High: Currently with staff
        if (isOutOfStock) score += 10;    // Medium: General stock delta
        
        return score;
      };

      const scoreA = getToolMetrics(a);
      const scoreB = getToolMetrics(b);

      if (scoreA !== scoreB) return scoreB - scoreA;
      
      // Secondary sort by name
      return a.name.localeCompare(b.name);
    });
  }, [filteredTools, usageLogs]);

  const totalPages = Math.ceil(sortedTools.length / itemsPerPage);
  const paginatedTools = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedTools.slice(start, start + itemsPerPage);
  }, [sortedTools, currentPage]);

  return (
    <div className="space-y-4 animate-in fade-in duration-500 max-w-full pb-10">
      {previewImage && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4">
           <button onClick={() => setPreviewImage(null)} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors bg-white/10 p-3 rounded-2xl">
              <X size={24}/>
           </button>
           <img src={previewImage} className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" alt="Tool" />
        </div>
      )}

      <div className="bg-white border border-slate-100 shadow-xl rounded-[2.5rem] overflow-hidden mx-1">
        <div className="hidden lg:grid grid-cols-12 bg-slate-50/80 backdrop-blur-md text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 px-10 py-5">
           <div className="col-span-4">Asset Identification</div>
           <div className="col-span-3 text-center">Submission Date</div>
           <div className="col-span-3">Stock & Technician</div>
           <div className="col-span-2 text-right">Actions</div>
        </div>

        <div className="divide-y divide-slate-50">
          {sortedTools.length === 0 ? (
            <div className="py-32 text-center">
               <Wrench size={48} className="mx-auto mb-4 text-slate-100 opacity-50" />
               <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No matching technical records</p>
            </div>
          ) : paginatedTools.map(tool => {
            const isExpanded = expandedToolId === tool.id;
            const submission = tool.submissionDate || '---';
            const lastUpdate = tool.lastVerified || '---';
            const addedBy = tool.addedBy || 'System';

            // INTELLIGENT VARIANCE TRACING
            const toolLogs = usageLogs.filter(l => l.toolId === tool.id && !l.isReturned);
            const deployments = toolLogs.filter(l => l.issuanceType === 'Daily' || l.issuanceType === 'Section-Held');
            const inDeployment = deployments.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
            const variations = toolLogs.filter(l => l.issuanceType === 'Outstanding');
            
            const detailedVariations = variations.map(v => {
               const comment = (v.comment || '').toUpperCase();
               let source = 'Manual Entry';
               if (comment.includes('[AUDIT]')) source = 'Audit Inspection';
               else if (comment.includes('[LOGBOOK]')) source = 'Logbook Digitalization';
               else if (comment.includes('[AUDIT_RECOVERY]')) source = 'Audit Follow-up';
               
               const piecesMatch = comment.match(/(?:MISSING|UNRETURNED PIECES|CHECK):\s*([^|\]]+)/i);
               const pieces = piecesMatch ? piecesMatch[1].split(',').map(s => s.trim().toUpperCase()) : [];

               return {
                 qty: v.quantity,
                 source,
                 date: v.date,
                 staff: v.staffName,
                 id: v.id,
                 pieces
               };
            });

            const totalLeaks = variations.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
            const hasRegistryVariance = totalLeaks > 0;
            
            const variationHint = [
               `${inDeployment} currently issued to staff`,
               totalLeaks > 0 ? `LEAKS: ${detailedVariations.map(v => `${v.qty}u ${v.source}`).join(' | ')}` : 'Registry Intact'
            ].join(' \n ');

            const flaggedPieces = new Set<string>();
            detailedVariations.forEach(dv => dv.pieces.forEach(p => flaggedPieces.add(p)));

            return (
              <React.Fragment key={tool.id}>
                <div 
                  onClick={() => toggleToolDropdown(tool.id)}
                  className={`group p-6 lg:px-10 lg:py-5 hover:bg-indigo-50/20 transition-all cursor-pointer ${isExpanded ? 'bg-indigo-50/30' : ''}`}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                      <div className="col-span-1 lg:col-span-4">
                        <div className="flex items-center space-x-5">
                          <div 
                            onClick={(e) => { if (tool.imageUrl) { e.stopPropagation(); setPreviewImage(tool.imageUrl); } }}
                            className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-indigo-600 font-black shrink-0 shadow-sm overflow-hidden group-hover:border-indigo-400 transition-all"
                          >
                             {tool.imageUrl ? <img src={tool.imageUrl} className="w-full h-full object-cover" /> : <Wrench size={20} />}
                          </div>
                          <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-700 text-sm uppercase truncate leading-none">{tool.name}</span>
                                {(hasRegistryVariance || inDeployment > 0) && (
                                   <div className="w-3 h-3 flex items-center justify-center text-indigo-500 animate-pulse" title={variationHint}>
                                      <Info size={10} strokeWidth={3} />
                                   </div>
                                )}
                              </div>
                              <div className="flex items-center space-x-2 mt-2">
                                <span className="text-[7.5px] font-medium text-slate-300 uppercase tracking-widest">Last Update: {lastUpdate}</span>
                                <span className="text-[7.5px] font-bold text-slate-300 uppercase tracking-tighter opacity-30">| UID: {tool.id}</span>
                              </div>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-1 lg:col-span-3 text-center flex items-center lg:block">
                        <div className="flex flex-col items-center justify-center space-y-1">
                           <div className="flex items-center space-x-1.5 text-slate-900">
                              <Calendar size={11} className="text-indigo-600" />
                              <span className="text-[9.5px] font-black uppercase tracking-widest">{submission}</span>
                           </div>
                           <div className="flex items-center space-x-1 text-slate-400">
                              <span className="text-[7.5px] font-bold uppercase tracking-tight truncate max-w-[120px]">
                                 ENROLLED BY: {addedBy}
                              </span>
                           </div>
                        </div>
                      </div>

                      <div className="col-span-1 lg:col-span-3 flex items-center lg:block">
                        <div className="flex items-center space-x-4">
                           <div className="flex flex-col">
                              <div className="flex items-center gap-1">
                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Available</p>
                                {/* Fix: Moved title to span wrapper as Lucide icons do not accept title prop directly */}
                                <span title={variationHint} className="inline-flex">
                                  <Info size={8} className="text-indigo-400 cursor-help" />
                                </span>
                              </div>
                              <span className={`text-base font-black ${tool.available === 0 ? 'text-rose-600' : 'text-slate-900'}`}>{tool.available} / {tool.quantity}</span>
                           </div>
                           <div className="h-6 w-px bg-slate-100"></div>
                           <div className="flex flex-col min-w-0">
                              <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Technician</p>
                              <span className="text-[10px] font-black text-slate-700 uppercase truncate">{tool.zone || 'Unassigned'}</span>
                           </div>
                        </div>
                      </div>

                      <div className="col-span-1 lg:col-span-2">
                         <div className="flex items-center justify-between lg:justify-end gap-3 border-t lg:border-t-0 border-slate-50 pt-4 lg:pt-0">
                            <span className={`px-2.5 py-1 rounded-lg text-[7px] font-black uppercase border tracking-widest ${
                                 tool.condition === 'Excellent' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 
                                 tool.condition === 'Lost' || tool.condition === 'Irreparable' ? 'text-white bg-slate-900 border-slate-900' : 
                                 'text-rose-600 bg-rose-50 border-rose-200'
                               }`}>{tool.condition}</span>

                            <div className="flex items-center space-x-1.5">
                               {canUpdate && (
                                 <button onClick={(e) => { e.stopPropagation(); onEdit(tool); }} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-indigo-600 bg-white border border-slate-100 rounded-lg transition-all active:scale-90 shadow-sm">
                                   <Edit2 size={14} />
                                 </button>
                               )}
                               {canDelete && (
                                 <button onClick={(e) => { e.stopPropagation(); onDelete?.(tool.id); }} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-rose-600 bg-white border border-slate-100 rounded-lg transition-all active:scale-90 shadow-sm">
                                   <Trash2 size={14} />
                                 </button>
                               )}
                            </div>
                            <ChevronDown size={18} className={`transition-transform duration-500 text-slate-400 ${isExpanded ? 'rotate-180 text-indigo-600' : ''}`} />
                         </div>
                      </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="bg-slate-50 border-y border-slate-100 p-6 lg:p-10 animate-in slide-in-from-top-4 duration-500 shadow-inner">
                    <div className="max-w-6xl mx-auto space-y-6">
                       <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                          
                          <div className="xl:col-span-5 space-y-4">
                             <div className="bg-white border border-slate-200 rounded-[2.2rem] p-6 shadow-sm space-y-6">
                                <div className="flex items-center justify-between">
                                   <div className="flex items-center space-x-3 text-slate-900">
                                      <Activity size={18} className="text-indigo-600" />
                                      <h4 className="text-[11px] font-black uppercase tracking-widest">Operational Status</h4>
                                   </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                   <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner text-center">
                                      <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest mb-2">Inventory Total</p>
                                      <div className="flex flex-col items-center">
                                         <span className="text-2xl font-black text-slate-900 tabular-nums">{tool.quantity}</span>
                                         <span className="text-[6.5px] font-black text-slate-400 uppercase mt-1">Registry Lock Active</span>
                                      </div>
                                   </div>
                                   <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner text-center">
                                      <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest mb-2">Available Now</p>
                                      <span className={`text-2xl font-black tabular-nums ${tool.available === 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{tool.available}</span>
                                      <p className="text-[7px] font-bold text-slate-300 uppercase mt-1">In Storage</p>
                                   </div>
                                </div>

                                {/* ACTIVE DEPLOYMENTS SECTION - WHERE IS THE STOCK? */}
                                <div className="space-y-4 pt-2">
                                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Deployments:</p>
                                   <div className="space-y-2">
                                      {deployments.length > 0 ? (
                                        deployments.map((log, idx) => (
                                          <div key={log.id} className="flex items-center justify-between p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl animate-in fade-in slide-in-from-left-1" style={{ animationDelay: `${idx * 50}ms` }}>
                                             <div className="flex items-center space-x-3 min-w-0">
                                                <div className="w-8 h-8 rounded-lg bg-white border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                                                   <Users size={14} />
                                                </div>
                                                <div className="min-w-0">
                                                   <p className="text-[10px] font-black text-indigo-900 uppercase truncate">{log.staffName}</p>
                                                   <p className="text-[7px] font-bold text-indigo-400 uppercase mt-0.5 flex items-center gap-1">
                                                      <Clock size={8} /> {log.date} • {log.issuanceType}
                                                   </p>
                                                </div>
                                             </div>
                                             <span className="text-[11px] font-black text-indigo-900 bg-white px-2 py-1 rounded-lg border border-indigo-100 tabular-nums">x{log.quantity}</span>
                                          </div>
                                        ))
                                      ) : (
                                        <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center opacity-40">
                                           <p className="text-[7px] font-black text-slate-400 uppercase">No active field deployments</p>
                                        </div>
                                      )}
                                   </div>
                                </div>

                                <div className="space-y-4 pt-2">
                                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Registry Variances:</p>
                                   <div className="grid grid-cols-1 gap-2">
                                      <div className={`flex flex-col p-3 border rounded-xl transition-all ${totalLeaks > 0 ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100 opacity-40'}`}>
                                         <div className="flex items-center justify-between w-full mb-3">
                                            <div className="flex items-center space-x-2.5">
                                               <AlertTriangle size={14} className={totalLeaks > 0 ? 'text-rose-600' : 'text-slate-400'} />
                                               <span className={`text-[9px] font-black uppercase ${totalLeaks > 0 ? 'text-rose-700' : 'text-slate-500'}`}>Loss/Damage Leaks</span>
                                            </div>
                                            <span className={`text-[11px] font-black tabular-nums ${totalLeaks > 0 ? 'text-rose-900' : 'text-slate-600'}`}>{totalLeaks} U</span>
                                         </div>
                                         
                                         {totalLeaks > 0 && (
                                           <div className="max-h-40 overflow-y-auto no-scrollbar space-y-3 pt-3 border-t border-rose-100/50">
                                              {detailedVariations.map((v, idx) => (
                                                <div key={v.id} className="flex flex-col gap-2 p-2 bg-white/50 rounded-lg animate-in fade-in" style={{ animationDelay: `${idx * 40}ms` }}>
                                                   <div className="flex items-center justify-between">
                                                      <div className="flex items-center space-x-2 min-w-0">
                                                         <Fingerprint size={10} className="text-rose-300 shrink-0" />
                                                         <div className="flex flex-col">
                                                            <span className="text-[7px] font-black text-slate-500 uppercase leading-none">Origin: {v.source}</span>
                                                            <span className="text-[6px] font-bold text-slate-400 uppercase mt-1">Ref: {v.staff}</span>
                                                         </div>
                                                      </div>
                                                      <div className="text-right shrink-0">
                                                         <p className="text-[9px] font-black text-rose-600 leading-none">-{v.qty}U</p>
                                                         <p className="text-[5px] font-bold text-slate-300 mt-1">{v.date}</p>
                                                      </div>
                                                   </div>
                                                </div>
                                              ))}
                                           </div>
                                         )}
                                      </div>
                                   </div>
                                </div>

                                <div className="p-4 bg-indigo-50/30 rounded-2xl border border-indigo-50 flex items-center space-x-4">
                                   <div className="p-2 bg-white rounded-xl shadow-sm text-indigo-600"><User size={16}/></div>
                                   <div className="min-w-0">
                                      <p className="text-[7.5px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Assigned Technician</p>
                                      <p className="text-[11px] font-black text-slate-900 uppercase truncate">{tool.zone || 'Unassigned'}</p>
                                   </div>
                                </div>
                             </div>
                          </div>

                          <div className="xl:col-span-7 space-y-4">
                             <div className="bg-white border border-slate-200 rounded-[2.2rem] overflow-hidden shadow-sm h-full flex flex-col">
                                <div className="px-8 py-5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between shrink-0">
                                   <div className="flex items-center space-x-3">
                                      <History size={16} className="text-indigo-600" />
                                      <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Asset Manifest Data</h4>
                                   </div>
                                   <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">UID: {tool.id}</span>
                                </div>
                                <div className="p-8 flex-1">
                                   {tool.composition && tool.composition.length > 0 ? (
                                     <div className="space-y-4">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Itemized Component Ledger:</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                           {tool.composition.map((piece, i) => {
                                             const isMissing = piece.includes('(MISSING)');
                                             const isDamaged = piece.includes('(DAMAGED)');
                                             const cleanName = piece.replace(/\s*\(MISSING\)/g, '').replace(/\s*\(DAMAGED\)/g, '').toUpperCase();
                                             
                                             const isTemporaryVariance = flaggedPieces.has(cleanName);

                                             return (
                                               <div key={i} className={`flex items-center justify-between p-4 bg-slate-50 border rounded-2xl group/piece transition-all shadow-sm ${isMissing || isTemporaryVariance ? 'border-rose-100 bg-rose-50/30' : isDamaged ? 'border-amber-100 bg-amber-50/30' : 'border-slate-100 hover:border-indigo-200'}`}>
                                                  <div className="flex items-center space-x-3 min-w-0">
                                                     <div className={`w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center transition-colors shadow-inner ${isMissing || isTemporaryVariance ? 'text-rose-400' : isDamaged ? 'text-amber-400' : 'text-slate-300'}`}>
                                                        {isTemporaryVariance ? <PackageX size={14} className="animate-pulse" /> : <Box size={14} />}
                                                     </div>
                                                     <div className="min-w-0">
                                                        <span className={`text-[10px] font-black uppercase truncate block ${isMissing || isTemporaryVariance ? 'text-rose-700 line-through' : isDamaged ? 'text-amber-700' : 'text-slate-700'}`}>{cleanName}</span>
                                                        {(isMissing || isTemporaryVariance) && <span className="text-[6px] font-black text-rose-500 uppercase tracking-widest">{isTemporaryVariance ? 'NOT RETURNED (LOG)' : 'Registry Variance'}</span>}
                                                        {isDamaged && <span className="text-[6px] font-black text-amber-500 uppercase tracking-widest">Maintenance Required</span>}
                                                     </div>
                                                  </div>
                                                  <CheckCircle2 size={14} className={`transition-opacity ${isMissing || isTemporaryVariance ? 'text-rose-400' : isDamaged ? 'text-amber-400' : 'text-emerald-500 opacity-20 group-hover/piece:opacity-100'}`} />
                                               </div>
                                             );
                                           })}
                                        </div>
                                     </div>
                                   ) : (
                                     <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40 grayscale py-12">
                                        <Box size={48} className="text-slate-200" />
                                        <div className="space-y-1">
                                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unitary Asset Structure</p>
                                           <p className="text-[8px] font-medium text-slate-400 uppercase tracking-widest">No complex manifest data recorded.</p>
                                        </div>
                                     </div>
                                   )}
                                </div>
                                <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between shrink-0">
                                   <div className="flex items-center space-x-1.5">
                                      <UserCheck size={12} className="text-emerald-50" />
                                      <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest">Custodian: {addedBy}</span>
                                   </div>
                                   <div className="flex items-center space-x-1.5">
                                      <ShieldCheck size={12} className="text-indigo-400" />
                                      <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest">Registry Integrity Verified</span>
                                   </div>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* FULLY RESPONSIVE PAGINATION CONTROLS */}
        {filteredTools.length > 0 && (() => {
          const totalRecords = filteredTools.length;
          const startIndex = totalRecords === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
          const endIndex = Math.min(currentPage * itemsPerPage, totalRecords);

          return (
            <div className="mt-4 bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px]">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-slate-600 font-bold">
                <span>
                  Showing <strong className="text-slate-900 font-black">{startIndex}</strong> to <strong className="text-slate-900 font-black">{endIndex}</strong> of <strong className="text-slate-900 font-black">{totalRecords}</strong> records
                </span>

                <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-xl">
                  <span className="text-[8.5px] font-black uppercase text-slate-400">Rows:</span>
                  <select
                    value={itemsPerPage}
                    onChange={e => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-transparent text-slate-800 font-black outline-none cursor-pointer text-[10px]"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
                <button
                  onClick={() => {
                    setCurrentPage(prev => Math.max(1, prev - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === 1}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-800 font-black flex items-center space-x-1 transition-all cursor-pointer active:scale-95"
                  title="Previous Page"
                >
                  <ChevronLeft size={14} />
                  <span className="hidden sm:inline uppercase text-[9px] tracking-wider">Prev</span>
                </button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .map((p, idx, arr) => {
                      const prevPage = arr[idx - 1];
                      const showEllipsis = prevPage && p - prevPage > 1;

                      return (
                        <React.Fragment key={p}>
                          {showEllipsis && <span className="px-1 text-slate-400 font-mono text-[9px]">...</span>}
                          <button
                            onClick={() => {
                              setCurrentPage(p);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl font-black text-[10px] transition-all cursor-pointer active:scale-95 flex items-center justify-center ${
                              currentPage === p
                                ? 'bg-black text-white shadow-xs'
                                : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {p}
                          </button>
                        </React.Fragment>
                      );
                    })}
                </div>

                <button
                  onClick={() => {
                    setCurrentPage(prev => Math.min(totalPages, prev + 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-800 font-black flex items-center space-x-1 transition-all cursor-pointer active:scale-95"
                  title="Next Page"
                >
                  <span className="hidden sm:inline uppercase text-[9px] tracking-wider">Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default InventoryTab;