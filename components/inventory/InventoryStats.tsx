
import React from 'react';
import { Wrench, AlertTriangle, RotateCcw, ShieldCheck } from 'lucide-react';
import Card from '../Card';

interface InventoryStatsProps {
  stats: {
    totalAssets?: number;
    totalUnits?: number;
    totalValue?: number;
    criticalIssues: number;
    outstandingCount: number;
    lastInspection: string;
  };
}

const InventoryStats: React.FC<InventoryStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <Card className="flex items-center space-x-3 p-3 border-none shadow-sm bg-white rounded-[1rem]">
        <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 shrink-0"><Wrench size={16} /></div>
        <div className="min-w-0">
          <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest truncate">Total Assets</p>
          <p className="text-sm font-black text-slate-900 truncate">{stats.totalAssets || 0} ({stats.totalUnits || 0} Units)</p>
        </div>
      </Card>
      <Card className="flex items-center space-x-3 p-3 border-none shadow-sm bg-white rounded-[1rem]">
        <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600 shrink-0"><AlertTriangle size={16} /></div>
        <div className="min-w-0">
          <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest truncate">Damaged/Lost</p>
          <p className="text-sm font-black text-slate-900 truncate">{stats.criticalIssues}</p>
        </div>
      </Card>
      <Card className="flex items-center space-x-3 p-3 border-none shadow-sm bg-white rounded-[1rem]">
        <div className="p-2.5 bg-orange-50 rounded-xl text-orange-600 shrink-0"><RotateCcw size={16} /></div>
        <div className="min-w-0">
          <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest truncate">Section Held</p>
          <p className="text-sm font-black text-slate-900 truncate">{stats.outstandingCount}</p>
        </div>
      </Card>
      <Card className="flex items-center space-x-3 p-3 border-none shadow-sm bg-slate-900 rounded-[1rem]">
        <div className="p-2.5 bg-white/10 rounded-xl text-emerald-400 shrink-0"><ShieldCheck size={16} /></div>
        <div className="min-w-0">
          <p className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest truncate">Last Audit</p>
          <p className="text-sm font-black text-white truncate">{stats.lastInspection}</p>
        </div>
      </Card>
    </div>
  );
};

export default InventoryStats;
