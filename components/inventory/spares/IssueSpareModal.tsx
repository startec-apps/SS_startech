import React from 'react';
import { ArrowUpRight, X, ShieldCheck } from 'lucide-react';
import { SpareItem } from './types';
import { Employee } from '../../../types';

interface IssueSpareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  issueSpareId: string;
  setIssueSpareId: (val: string) => void;
  selectedWorkOrder: string;
  setSelectedWorkOrder: (val: string) => void;
  issueToId: string;
  setIssueToId: (val: string) => void;
  issueQty: number;
  setIssueQty: (val: number) => void;
  issuePurpose: string;
  setIssuePurpose: (val: string) => void;
  currentUser: Employee;
  masterEmployees: Employee[];
  spares: SpareItem[];
  dailyTasks: any[];
}

export const IssueSpareModal: React.FC<IssueSpareModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  issueSpareId,
  setIssueSpareId,
  selectedWorkOrder,
  setSelectedWorkOrder,
  issueToId,
  setIssueToId,
  issueQty,
  setIssueQty,
  issuePurpose,
  setIssuePurpose,
  currentUser,
  masterEmployees,
  spares,
  dailyTasks
}) => {
  if (!isOpen) return null;

  const availableSpares = spares.filter(s => s.currentStock > 0);
  const selectedSpareObj = spares.find(s => s.id === issueSpareId);

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="relative bg-[#F8FAFF] w-full max-w-md rounded-3xl shadow-2xl border border-white/20 animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[96vh]">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-rose-600 text-white rounded-xl flex items-center justify-center shadow-md shrink-0">
              <ArrowUpRight size={16} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">
                Issue Spare Part
              </h3>
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">Stock Outflow Handover</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-800 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Responsive, No-Scroll Compact Form Body */}
        <form onSubmit={onSubmit} className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3 text-slate-800">
          
          <div className="space-y-2.5">
            {/* Select Spare Part */}
            <div>
              <div className="flex items-center justify-between mb-1 ml-0.5">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Select Spare Part *</label>
                {selectedSpareObj && (
                  <span className="text-[7.5px] font-black text-rose-600 uppercase">
                    In Stock: {selectedSpareObj.currentStock}
                  </span>
                )}
              </div>
              <select
                required
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] sm:text-[11px] font-black uppercase text-slate-800 outline-none focus:border-indigo-500 shadow-sm cursor-pointer"
                value={issueSpareId}
                onChange={(e) => setIssueSpareId(e.target.value)}
              >
                <option value="">-- Choose Spare Item --</option>
                {availableSpares.map((s, idx) => (
                  <option key={`${s.id || 'spare'}-${idx}`} value={s.id}>
                    {s.name} ({s.currentStock} in stock)
                  </option>
                ))}
              </select>
            </div>

            {/* Issued To (Clean names) & Quantity */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="sm:col-span-2">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-0.5 block">Issued To (Technician) *</label>
                <select
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] sm:text-[11px] font-black uppercase text-slate-800 outline-none focus:border-indigo-500 shadow-sm cursor-pointer"
                  value={issueToId}
                  onChange={(e) => setIssueToId(e.target.value)}
                >
                  <option value="">-- Select Technician --</option>
                  {masterEmployees.map((e, idx) => (
                    <option key={`${e.id || 'emp'}-${idx}`} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-0.5 block">Quantity *</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={selectedSpareObj ? selectedSpareObj.currentStock : undefined}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-black text-slate-900 outline-none focus:border-indigo-500 shadow-sm"
                  value={issueQty}
                  onChange={(e) => setIssueQty(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
            </div>

            {/* Work Order Selection */}
            <div>
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-0.5 block">Work Order / Task Reference (Optional)</label>
              <select
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-black uppercase text-slate-800 outline-none focus:border-indigo-500 shadow-sm cursor-pointer"
                value={selectedWorkOrder}
                onChange={(e) => setSelectedWorkOrder(e.target.value)}
              >
                <option value="">-- None / General Maintenance --</option>
                {dailyTasks.map((task, idx) => (
                  <option key={`${task.id || task.jobCardNumber || 'task'}-${idx}`} value={task.jobCardNumber || task.id}>
                    {task.jobCardNumber} — {task.equipmentRef || task.description || 'Task'} ({task.technicianName})
                  </option>
                ))}
              </select>
            </div>

            {/* Issue Purpose / Comment */}
            <div>
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-0.5 block">Remarks / Reason (Optional)</label>
              <input
                type="text"
                placeholder="Reason or notes for issuance..."
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-800 outline-none focus:border-indigo-500 shadow-sm"
                value={issuePurpose}
                onChange={(e) => setIssuePurpose(e.target.value)}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2.5">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-black uppercase tracking-wider text-[9px] hover:bg-slate-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-[1.4] py-2.5 rounded-xl bg-[#0F1135] hover:bg-indigo-700 text-white font-black uppercase tracking-wider text-[9px] shadow-lg transition-all flex items-center justify-center space-x-1.5 active:scale-95 cursor-pointer"
            >
              <ShieldCheck size={15} />
              <span>Save Issue Record</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
