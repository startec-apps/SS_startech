import React from 'react';
import { ArrowDownLeft, X, ShieldCheck } from 'lucide-react';
import { SpareItem } from './types';
import { Employee } from '../../../types';

interface ReceiveSpareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  recId: string;
  setRecId: (val: string) => void;
  recName: string;
  setRecName: (val: string) => void;
  recDate: string;
  setRecDate: (val: string) => void;
  recQty: number;
  setRecQty: (val: number) => void;
  recNotes: string;
  setRecNotes: (val: string) => void;
  currentUser: Employee;
  spares: SpareItem[];
  generateNextSpareId: () => string;
}

export const ReceiveSpareModal: React.FC<ReceiveSpareModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  recId,
  setRecId,
  recName,
  setRecName,
  recDate,
  setRecDate,
  recQty,
  setRecQty,
  recNotes,
  setRecNotes,
  currentUser,
  spares,
  generateNextSpareId
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="relative bg-[#F8FAFF] w-full max-w-md rounded-3xl shadow-2xl border border-white/20 animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[96vh]">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-md shrink-0">
              <ArrowDownLeft size={16} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">
                Receive Spare Part
              </h3>
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">Stock Inflow Entry</p>
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
            {/* Officer in Charge */}
            <div>
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-0.5 block">Received By</label>
              <input
                type="text"
                readOnly
                disabled
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-black text-slate-800 outline-none cursor-not-allowed truncate"
                value={currentUser.name}
              />
            </div>

            {/* Spare Part Name */}
            <div>
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-0.5 block">Spare Part Name *</label>
              <input
                type="text"
                required
                list="existing-spares-list"
                placeholder="e.g. Oil Pump Valve"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] sm:text-[11px] font-black uppercase text-slate-800 outline-none focus:border-indigo-500 shadow-sm"
                value={recName}
                onChange={(e) => {
                  const val = e.target.value;
                  setRecName(val);
                  const matched = spares.find(s => (s.name || '').trim().toLowerCase() === val.trim().toLowerCase());
                  if (matched) {
                    setRecId(matched.id);
                  } else {
                    setRecId('');
                  }
                }}
              />
              <datalist id="existing-spares-list">
                {spares.map((s, idx) => (
                  <option key={`${s.id || 'spare'}-${s.name || ''}-${idx}`} value={s.name}>{s.currentStock} in stock</option>
                ))}
              </datalist>
            </div>

            {/* Quantity Received & Receiving Date */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-0.5 block">Quantity Received *</label>
                <input
                  type="number"
                  required
                  min={1}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-black text-slate-800 outline-none focus:border-indigo-500 shadow-sm"
                  value={recQty}
                  onChange={(e) => setRecQty(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>

              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-0.5 block">Receiving Date *</label>
                <input
                  type="date"
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-black text-slate-800 outline-none focus:border-indigo-500 shadow-sm cursor-pointer"
                  value={recDate}
                  onChange={(e) => setRecDate(e.target.value)}
                />
              </div>
            </div>

            {/* Reference Note */}
            <div>
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-0.5 block">Reference / Notes (Optional)</label>
              <input
                type="text"
                placeholder="Invoice or delivery note..."
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-800 outline-none focus:border-indigo-500 shadow-sm"
                value={recNotes}
                onChange={(e) => setRecNotes(e.target.value)}
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
              <span>Save Received Stock</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
