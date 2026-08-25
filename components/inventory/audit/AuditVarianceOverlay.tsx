import React from 'react';
import { AlertTriangle, PackageX, Minus, Plus } from 'lucide-react';
import { ToolCondition } from '../../../types';

interface AuditVarianceOverlayProps {
  type: 'DAM' | 'LOS';
  tempValue: number;
  maxAvailable: number;
  onUpdateTempValue: (val: number) => void;
  onCancel: () => void;
  onAuthorize: (condition: ToolCondition, val: number) => void;
}

const AuditVarianceOverlay: React.FC<AuditVarianceOverlayProps> = ({ 
  type, 
  tempValue, 
  maxAvailable, 
  onUpdateTempValue, 
  onCancel, 
  onAuthorize 
}) => (
  <div className="absolute inset-0 z-30 bg-[#0F1135] rounded-[2.2rem] p-6 flex flex-col justify-center items-center text-center animate-in zoom-in-95 duration-200">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-4 shadow-xl ${type === 'DAM' ? 'bg-amber-500' : 'bg-rose-500'}`}>
      {type === 'DAM' ? <AlertTriangle size={28}/> : <PackageX size={28}/>}
    </div>
    <h4 className="text-xs font-black text-white uppercase tracking-widest mb-1">Quantity Check</h4>
    <p className="text-[8px] font-black text-indigo-300 uppercase tracking-[0.15em] mb-6">How many tools are {type === 'DAM' ? 'broken' : 'missing'}?</p>
    
    <div className="flex items-center space-x-6 mb-8 bg-white/5 p-4 rounded-3xl border border-white/10 w-full justify-between">
      <button 
        onClick={() => onUpdateTempValue(Math.max(1, tempValue - 1))}
        className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-90"
      >
        <Minus size={20}/>
      </button>
      <div className="flex flex-col">
        <span className="text-3xl font-black text-white tabular-nums leading-none">{tempValue}</span>
        <span className="text-[7px] font-black text-white/40 uppercase mt-1">OF {maxAvailable} TOTAL</span>
      </div>
      <button 
        onClick={() => onUpdateTempValue(Math.min(maxAvailable, tempValue + 1))}
        className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-90"
      >
        <Plus size={20}/>
      </button>
    </div>

    <div className="grid grid-cols-2 gap-3 w-full">
      <button onClick={onCancel} className="py-3 bg-white/5 rounded-xl text-white/50 text-[9px] font-black uppercase tracking-widest hover:bg-white/10">Back</button>
      <button 
        onClick={() => onAuthorize(type === 'DAM' ? 'Damaged' : 'Lost', tempValue)} 
        className="py-3 bg-white text-[#0F1135] rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
      >
        Confirm
      </button>
    </div>
  </div>
);

export default AuditVarianceOverlay;