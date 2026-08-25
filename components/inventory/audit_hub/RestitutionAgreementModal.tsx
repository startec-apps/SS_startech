
import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, FileSignature, Printer, ShieldCheck, X, Scale, User, Calendar, ClipboardCheck, ChevronDown, Download, Loader2 } from 'lucide-react';
import { ToolAsset, ToolUsageRecord, Employee } from '../../../types';

interface RestitutionAgreementModalProps {
  audit: any;
  usageLogs: ToolUsageRecord[];
  tools: ToolAsset[];
  masterEmployees: Employee[];
  onClose: () => void;
}

const RestitutionAgreementModal: React.FC<RestitutionAgreementModalProps> = ({ audit, usageLogs, tools, masterEmployees, onClose }) => {
  const [showPrintMenu, setShowPrintMenu] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const normalizeId = (val: string) => String(val || '').replace(/[^a-z0-9]/gi, '').toLowerCase();
  
  const fiscalCases = usageLogs.filter(log => 
    normalizeId(log.physicalArchiveId || '') === normalizeId(audit.id) && 
    log.escalationStatus === 'In-Grace-Period' && 
    !log.isReturned
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowPrintMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDownloadPDF = async () => {
    const element = document.getElementById('printable-agreement-content');
    if (!element) return;

    setShowPrintMenu(false);
    setIsPreparing(true);

    const opt = {
      margin: [8, 8, 8, 8],
      filename: `Restitution_Agreement_${audit.id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: false, 
        allowTaint: true,
        letterRendering: true,
        logging: false
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      await new Promise(resolve => setTimeout(resolve, 1200));
      await (window as any).html2pdf().from(element).set(opt).save();
    } catch (error) {
      console.error("PDF Generation Error:", error);
    } finally {
      setIsPreparing(false);
    }
  };

  const getDetailedAssetName = (log: ToolUsageRecord) => {
    const tool = tools.find(t => t.id === log.toolId);
    const isMulti = tool?.assetClass === 'Set' || tool?.assetClass === 'Toolbox';
    
    if (!isMulti || !log.comment) return log.toolName;

    const missingMatch = log.comment.match(/\[MISSING:\s*([^\]]+)\]/i);
    const damagedMatch = log.comment.match(/\[DAMAGED:\s*([^\]]+)\]/i);
    
    const pieces = [
      ...(missingMatch ? missingMatch[1].split(',').map(s => `Missing: ${s.trim()}`) : []),
      ...(damagedMatch ? damagedMatch[1].split(',').map(s => `Damaged: ${s.trim()}`) : [])
    ];

    if (pieces.length === 0) return log.toolName;
    return `${log.toolName} (${pieces.join('; ')})`;
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-900/95 flex items-start justify-center overflow-y-auto no-scrollbar">
      <div className="relative bg-white w-full max-w-5xl shadow-2xl flex flex-col min-h-screen">
         
         <div className="px-8 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0 sticky top-0 z-30">
            <button onClick={onClose} className="flex items-center space-x-2 text-slate-400 hover:text-indigo-600 font-black uppercase text-[10px] tracking-widest transition-all">
              <ArrowLeft size={18} /><span>Exit Archive</span>
            </button>
            <div className="flex items-center space-x-2">
               <div className="relative" ref={menuRef}>
                  <button 
                    disabled={isPreparing}
                    onClick={() => setShowPrintMenu(!showPrintMenu)}
                    className="flex items-center space-x-3 px-6 py-2 bg-emerald-600 text-white rounded-xl text-[8.5px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isPreparing ? <Loader2 size={14} className="animate-spin" /> : <Download size={14}/>}
                    <span>{isPreparing ? 'Processing PDF...' : 'Download Agreement'}</span>
                    {!isPreparing && <ChevronDown size={12} className={`transition-transform duration-300 ${showPrintMenu ? 'rotate-180' : ''}`} />}
                  </button>

                  {showPrintMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in slide-in-from-top-2">
                       <button onClick={handleDownloadPDF} className="w-full px-5 py-3 flex items-center gap-3 hover:bg-indigo-50 text-left transition-colors group">
                          <Download size={14} className="text-indigo-600" />
                          <div>
                             <p className="text-[10px] font-black text-slate-900 uppercase">Save as PDF</p>
                             <p className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">1-Page High-Res</p>
                          </div>
                       </button>
                    </div>
                  )}
               </div>
               <button onClick={onClose} className="w-9 h-9 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-100 transition-colors"><X size={18}/></button>
            </div>
         </div>
         
         <div id="printable-agreement-content" className="p-10 bg-white text-slate-900 font-serif leading-tight">
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5 mb-6">
               <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-slate-900 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg">
                     <ShieldCheck size={32} />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight leading-none mb-1 font-sans">Restitution Acknowledgement</h1>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] font-sans">Institutional Asset Recovery Ledger • FSC-01</p>
                  </div>
               </div>
               <div className="text-right font-sans">
                  <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-0.5">FORM REF</p>
                  <p className="text-[11px] font-black font-mono">SOP-REC-01/AUD-{audit.id.split('-').pop()}</p>
               </div>
            </div>

            <div className="space-y-6 mb-8">
               <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100 shadow-inner relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none font-sans font-black text-2xl uppercase rotate-12">Authorized</div>
                  <h2 className="text-sm font-black uppercase tracking-tight mb-3 flex items-center gap-2 font-sans">
                     <Scale size={16} className="text-indigo-600" />
                     Acknowledgment of Liability
                  </h2>
                  <p className="text-[10.5px] leading-relaxed text-slate-700 font-medium">
                     I, the undersigned, acknowledge responsibility for the missing or damaged institutional assets listed below. 
                     I agree to provide identical replacements within 30 days. Non-compliance authorizes institutional payroll recovery per company policy SOP-ASSET-09.
                  </p>
               </div>

               <div className="space-y-4">
                  <h3 className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 font-sans text-slate-400">
                     <ClipboardCheck size={12}/>
                     Asset Schedule
                  </h3>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden font-sans shadow-sm">
                     <table className="w-full text-left">
                        <thead className="bg-slate-900 text-white">
                           <tr className="text-[7.5px] font-black uppercase tracking-widest">
                              <th className="py-2.5 px-6 w-[55%]">Asset / Variance Identification</th>
                              <th className="py-2.5 px-4">Custodian</th>
                              <th className="py-2.5 px-3 text-center">Qty</th>
                              <th className="py-2.5 px-6 text-right">Reprocurement Due</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           {fiscalCases.map((log, idx) => (
                             <tr key={idx} className="bg-white">
                                <td className="py-3 px-6">
                                   <p className="text-[10px] font-black uppercase text-slate-900 leading-none">{getDetailedAssetName(log)}</p>
                                   <p className="text-[6.5px] font-bold text-slate-400 uppercase tracking-widest mt-1">TRACE UID: {log.toolId}</p>
                                </td>
                                <td className="py-3 px-4">
                                   <p className="text-[9px] font-black uppercase text-slate-700 leading-none">{log.staffName}</p>
                                   <p className="text-[6.5px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {log.staffId}</p>
                                </td>
                                <td className="py-3 px-3 text-center">
                                   <span className="text-[11px] font-black text-rose-600 tabular-nums">x{log.quantity}</span>
                                </td>
                                <td className="py-3 px-6 text-right">
                                   <span className="text-[10px] font-black text-emerald-600">{log.graceExpiryDate}</span>
                                   <p className="text-[6px] font-black text-slate-300 uppercase tracking-tighter mt-1">30-DAY WINDOW</p>
                                </td>
                             </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>

            <div className="mt-10 pt-6 border-t border-slate-100">
               <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                  {fiscalCases.slice(0, 2).map((log, idx) => (
                    <div key={idx} className="space-y-4">
                       <div className="h-24 border-b border-dashed border-slate-300 flex items-center justify-center p-2 bg-slate-50/20 rounded-t-xl overflow-hidden relative">
                          {log.recipientSignature ? (
                            <img 
                              src={log.recipientSignature} 
                              className="max-h-full max-w-full object-contain grayscale" 
                              alt="Staff Certification" 
                              style={{ display: 'block' }}
                              width="200"
                              height="80"
                            />
                          ) : (
                            <span className="text-[7px] font-black text-slate-200 uppercase tracking-[0.4em]">Awaiting Signature</span>
                          )}
                       </div>
                       <div className="text-center font-sans">
                          <p className="text-[10px] font-black uppercase text-slate-900 leading-none">{log.staffName}</p>
                          <p className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">Custodian (Acknowledgee)</p>
                       </div>
                    </div>
                  ))}

                  <div className="space-y-4">
                     <div className="h-24 border-b border-dashed border-slate-300 flex items-center justify-center p-2 bg-slate-50/20 rounded-t-xl overflow-hidden relative">
                        {audit.signature ? (
                          <img 
                            src={audit.signature} 
                            className="max-h-full max-w-full object-contain grayscale" 
                            alt="Inspector Certification" 
                            style={{ display: 'block' }}
                            width="200"
                            height="80"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 border border-slate-100">
                             <User size={20} />
                          </div>
                        )}
                     </div>
                     <div className="text-center font-sans">
                        <p className="text-[10px] font-black uppercase text-slate-900 leading-none">{audit.inspector}</p>
                        <p className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">Inspecting Officer</p>
                     </div>
                  </div>
               </div>
            </div>

            <div className="mt-12 text-center space-y-3 font-sans opacity-40">
               <div className="w-10 h-px bg-slate-200 mx-auto"></div>
               <p className="text-[7px] font-black uppercase tracking-[0.4em] text-slate-400">Institutional Archive Entry • SOP-REC-01</p>
               <div className="flex items-center justify-center gap-5">
                  <div className="flex items-center gap-1.5">
                     <ShieldCheck size={10} className="text-emerald-500" />
                     <span className="text-[6.5px] font-bold">DIGITALLY HASHED</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                     <Calendar size={10} className="text-indigo-500" />
                     <span className="text-[6.5px] font-bold uppercase tracking-tighter">STAMPED: {new Date().toLocaleString()}</span>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default RestitutionAgreementModal;
