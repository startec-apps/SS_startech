
import { ArrowLeft, CheckCircle2, FileText, Printer, ShieldAlert, X, ShieldCheck, History, ChevronDown, Download, Loader2, HardHat } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { ToolAsset, ToolUsageRecord } from '../../../types';

interface AuditReportModalProps {
  report: any;
  tools: ToolAsset[];
  sectionalItems: ToolUsageRecord[];
  activeCases: ToolUsageRecord[];
  onClose: () => void;
}

const AuditReportModal: React.FC<AuditReportModalProps> = ({ report, tools, sectionalItems, activeCases, onClose }) => {
  const [showPrintMenu, setShowPrintMenu] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    const element = document.getElementById('printable-report-content');
    if (!element) return;

    setShowPrintMenu(false);
    setIsPreparing(true);

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `Audit_Report_${report.id}.pdf`,
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
      // Extended delay to ensure large Base64 strings are fully decoded in the browser's paint buffer
      await new Promise(resolve => setTimeout(resolve, 1200));
      await (window as any).html2pdf().from(element).set(opt).save();
    } catch (error) {
      console.error("PDF Generation Error:", error);
    } finally {
      setIsPreparing(false);
    }
  };

  const getDetailedDescription = (log: ToolUsageRecord) => {
    const tool = tools.find(t => t.id === log.toolId);
    const isMulti = tool?.assetClass === 'Set' || tool?.assetClass === 'Toolbox';
    
    if (!isMulti || !log.comment) return `${log.toolName} (x${log.quantity})`;

    const missingMatch = log.comment.match(/\[MISSING:\s*([^\]]+)\]/i);
    const damagedMatch = log.comment.match(/\[DAMAGED:\s*([^\]]+)\]/i);
    
    const pieces = [
      ...(missingMatch ? missingMatch[1].split(',').map(s => `Missing: ${s.trim()}`) : []),
      ...(damagedMatch ? damagedMatch[1].split(',').map(s => `Damaged: ${s.trim()}`) : [])
    ];

    if (pieces.length === 0) {
       const legMissing = log.comment.match(/(?:MISSING(?:\sPIECES)?|PARTIAL(?:\sKIT\sISSUANCE)?):\s*([^|\]]+)/i);
       const legDamaged = log.comment.match(/DAMAGED:\s*([^|\]]+)/i);
       if (legMissing) pieces.push(...legMissing[1].split(',').map(s => `Missing: ${s.trim()}`));
       if (legDamaged) pieces.push(...legDamaged[1].split(',').map(s => `Damaged: ${s.trim()}`));
    }

    if (pieces.length === 0) return `${log.toolName} (x${log.quantity})`;
    return `${log.toolName} (x${log.quantity}) — Pieces: [${pieces.join('; ')}]`;
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-900/95 flex items-start justify-center overflow-y-auto no-scrollbar">
      <div className="relative bg-white w-full max-w-6xl shadow-2xl flex flex-col min-h-screen">
         
         <div className="px-8 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0 sticky top-0 z-30 shadow-sm">
            <button onClick={onClose} className="flex items-center space-x-2 text-slate-400 hover:text-indigo-600 font-black uppercase text-[10px] tracking-widest transition-all">
              <ArrowLeft size={18} /><span>Return to Hub</span>
            </button>
            <div className="flex items-center space-x-3">
               <div className="relative" ref={menuRef}>
                  <button 
                    disabled={isPreparing}
                    onClick={() => setShowPrintMenu(!showPrintMenu)}
                    className="flex items-center space-x-3 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isPreparing ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16}/>}
                    <span>{isPreparing ? 'Generating PDF...' : 'Export Report PDF'}</span>
                    {!isPreparing && <ChevronDown size={14} className={`transition-transform duration-300 ${showPrintMenu ? 'rotate-180' : ''}`} />}
                  </button>

                  {showPrintMenu && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in slide-in-from-top-2">
                       <button onClick={handleDownloadPDF} className="w-full px-5 py-3.5 flex items-center gap-4 hover:bg-indigo-50 text-left transition-colors group">
                          <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                             <Download size={16} />
                          </div>
                          <div>
                             <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">Download PDF</p>
                             <p className="text-[7px] font-bold text-slate-400 uppercase mt-0.5">High-Res Document</p>
                          </div>
                       </button>
                    </div>
                  )}
               </div>
               <button onClick={onClose} className="w-9 h-9 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-100 transition-colors"><X size={18}/></button>
            </div>
         </div>
         
         <div id="printable-report-content" className="p-8 md:p-10 bg-white text-slate-900 font-sans">
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6 mb-8">
               <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-slate-900 rounded-xl flex items-center justify-center text-white shrink-0">
                     <ShieldCheck size={28} />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter leading-none mb-1">Executive Audit Summary</h1>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em]">Official Asset Ledger • FORM SOP-AUD-04</p>
                  </div>
               </div>
               <div className="text-right">
                  <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Audit Reference</p>
                  <p className="text-lg font-black font-mono tracking-tight">{report.id}</p>
               </div>
            </div>

            <div className="grid grid-cols-3 gap-6 mb-8 bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100">
               <div className="space-y-0.5">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Officer</p>
                  <p className="text-[11px] font-black uppercase text-slate-900">{report.inspector}</p>
               </div>
               <div className="space-y-0.5">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Date</p>
                  <p className="text-[11px] font-black uppercase text-slate-900">{report.date}</p>
               </div>
               <div className="space-y-0.5">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Zone</p>
                  <p className="text-[11px] font-black uppercase text-indigo-600">{report.section}</p>
               </div>
            </div>

            <div className="space-y-4 mb-8">
               <h2 className="text-base font-black uppercase tracking-tight flex items-center gap-2">
                  <ShieldAlert size={18} className="text-rose-600" />
                  Technical Discrepancies
               </h2>
               
               <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                     <thead className="bg-slate-900 text-white">
                        <tr className="text-[8px] font-black uppercase tracking-widest">
                           <th className="py-3 px-6 w-[35%]">Asset Designation</th>
                           <th className="py-3 px-4 text-center">System</th>
                           <th className="py-3 px-4 text-center">Sighted</th>
                           <th className="py-3 px-4 text-center">Condition</th>
                           <th className="py-3 px-6 text-right">Observations</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {(report.issues || []).map((issue: any, i: number) => {
                           const tool = tools.find(t => t.id === issue.toolId);
                           const expected = issue.expectedQty || tool?.available || 0;
                           const sighted = issue.quantity;
                           const isShortage = sighted < expected;
                           const conditionLabel = issue.condition === 'Lost' ? 'Missing' : issue.condition;

                           return (
                             <tr key={i} className={`hover:bg-slate-50/50 transition-colors ${isShortage ? 'bg-rose-50/10' : ''}`}>
                                <td className="py-3.5 px-6">
                                   <p className="text-[10px] font-black uppercase text-slate-900">{tool?.name || issue.toolId}</p>
                                   <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">UID: {issue.toolId}</p>
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                   <span className="text-[9px] font-black text-slate-400 tabular-nums">{expected}</span>
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                   <span className={`text-[10px] font-black tabular-nums ${isShortage ? 'text-rose-600' : 'text-slate-900'}`}>
                                      {sighted}
                                   </span>
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                   <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase border ${
                                      issue.condition === 'Excellent' || issue.condition === 'Good' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                                   }`}>
                                      {conditionLabel}
                                   </span>
                                </td>
                                <td className="py-3.5 px-6 text-right">
                                   <p className="text-[9px] font-medium text-slate-500 italic leading-relaxed">
                                      {issue.notes || 'No variances identified.'}
                                   </p>
                                </td>
                             </tr>
                           );
                        })}
                        {(report.issues || []).length === 0 && (
                          <tr><td colSpan={5} className="py-12 text-center text-[9px] font-black uppercase text-slate-300 tracking-[0.4em]">Compliance Certified.</td></tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>

            <div className="hidden grid grid-cols-1 gap-8 mb-10 opacity-40">
               <div className="space-y-3">
                  <h3 className="text-[10px] font-normal uppercase tracking-widest flex items-center gap-2 text-slate-400">
                     <History size={14}/>
                     Store External Custody (Section-Held)
                  </h3>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                     <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                           <tr className="text-[7px] font-normal text-slate-400 uppercase tracking-widest">
                              <th className="py-2 px-6 w-[50%]">Asset & Piece ID</th>
                              <th className="py-2 px-4 text-center">Custodian</th>
                              <th className="py-2 px-6 text-right">Date</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-slate-600">
                           {sectionalItems.map((item, i) => (
                              <tr key={i}>
                                 <td className="py-2.5 px-6 text-[9px] font-normal uppercase">{getDetailedDescription(item)}</td>
                                 <td className="py-2.5 px-4 text-center text-[9px] font-normal uppercase">{item.staffName}</td>
                                 <td className="py-2.5 px-6 text-right text-[9px] font-normal uppercase">{item.date}</td>
                              </tr>
                           ))}
                           {sectionalItems.length === 0 && <tr><td colSpan={3} className="py-6 text-center text-[8px] font-normal text-slate-200 uppercase tracking-widest italic">Zero external records</td></tr>}
                        </tbody>
                     </table>
                  </div>
               </div>

               <div className="space-y-3">
                  <h3 className="text-[10px] font-normal uppercase tracking-widest flex items-center gap-2 text-slate-400">
                     <ShieldAlert size={14}/>
                     Institutional Liability (Pending Issues)
                  </h3>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                     <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                           <tr className="text-[7px] font-normal text-slate-400 uppercase tracking-widest">
                              <th className="py-2 px-6 w-[50%]">Variance Description</th>
                              <th className="py-2 px-4 text-center">Responsible</th>
                              <th className="py-2 px-6 text-right">Status</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-slate-600">
                           {activeCases.map((item, i) => (
                              <tr key={i}>
                                 <td className="py-2.5 px-6 text-[9px] font-normal uppercase">{getDetailedDescription(item)}</td>
                                 <td className="py-2.5 px-4 text-center text-[9px] font-normal uppercase">{item.staffName}</td>
                                 <td className="py-2.5 px-6 text-right">
                                    <span className="text-[8px] font-normal uppercase px-1.5 py-0.5 border border-slate-200 rounded">{item.escalationStatus}</span>
                                 </td>
                              </tr>
                           ))}
                           {activeCases.length === 0 && <tr><td colSpan={3} className="py-6 text-center text-[8px] font-normal text-slate-200 uppercase tracking-widest italic">No pending liability</td></tr>}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>

            <div className="mt-12 pt-8 border-t border-slate-100 flex items-end justify-between">
               <div className="flex flex-col items-center">
                  <div className="h-24 w-56 border-b border-dashed border-slate-200 mb-4 flex items-center justify-center p-2 bg-slate-50/30 rounded-t-xl overflow-hidden relative">
                     {report.signature ? (
                       <img 
                         src={report.signature} 
                         className="max-h-full max-w-full object-contain grayscale" 
                         alt="Digital Certification Signature"
                         width="220"
                         height="90"
                         style={{ display: 'block' }}
                       />
                     ) : (
                       <span className="text-[8px] font-black text-slate-200 uppercase tracking-[0.4em]">Official Stamp Only</span>
                     )}
                  </div>
                  <div className="text-center">
                     <p className="text-[11px] font-black uppercase text-slate-900 leading-none">{report.inspector}</p>
                     <p className="text-[7px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1">Inspecting Officer</p>
                  </div>
               </div>
               
               <div className="text-right space-y-2">
                  <div className="flex items-center justify-end space-x-4 mb-2">
                     <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 border border-emerald-100 shadow-sm">
                        <CheckCircle2 size={24} />
                     </div>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Registry Certification</p>
                  <div className="flex items-center justify-end gap-2 text-[6px] font-bold text-slate-400 uppercase tracking-widest">
                     <History size={8} />
                     <span>SYSTEM HASH: {report.id}</span>
                  </div>
               </div>
            </div>

            <div className="mt-16 text-center opacity-30">
               <p className="text-[7px] font-black uppercase tracking-[0.5em] mb-1">Startech Hub Resource Intelligence System</p>
               <p className="text-[6.5px] font-bold">Electronically generated institutional record. FORM SOP-AUD-04</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default AuditReportModal;
