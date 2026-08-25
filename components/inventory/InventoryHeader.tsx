import React from 'react';
import { Search, Camera, LayoutGrid, HardHat, ShieldCheck, Filter, MapPin, Tags, Activity, Hammer, User, Layers, PlusCircle, AlertTriangle, History, Wrench, Package } from 'lucide-react';
import { ToolCondition, Employee } from '../../types';

interface InventoryHeaderProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  
  // Registry Filters
  categoryFilter: string;
  setCategoryFilter: (val: string) => void;
  zoneFilter: string;
  setZoneFilter: (val: string) => void;
  conditionFilter: string;
  setConditionFilter: (val: string) => void;
  
  // Archive Filters
  archiveStatusFilter: string;
  setArchiveStatusFilter: (val: any) => void;
  archiveOfficerFilter: string;
  setArchiveOfficerFilter: (val: string) => void;
  masterEmployees?: Employee[];
  
  onDigitize: () => void;
  onEnrollTool?: () => void;
  hasPermission: (module: string, action?: any, subHub?: string) => boolean;
}

const InventoryHeader: React.FC<InventoryHeaderProps> = ({ 
  activeTab, setActiveTab, searchTerm, setSearchTerm, 
  categoryFilter, setCategoryFilter,
  zoneFilter, setZoneFilter,
  conditionFilter, setConditionFilter,
  archiveStatusFilter, setArchiveStatusFilter,
  archiveOfficerFilter, setArchiveOfficerFilter,
  masterEmployees = [],
  onDigitize, onEnrollTool, hasPermission 
}) => {
  if (activeTab === 'spares') {
    return null;
  }

  const tabs = [
    { id: 'inventory', icon: <Wrench size={13}/>, label: 'Tools Registry' },
    { id: 'sectional', icon: <HardHat size={13}/>, label: 'Sectional Hold' },
    { id: 'audit', icon: <ShieldCheck size={13}/>, label: 'Inspections' }
  ];

  const categories = ['Power tools', 'Electrical tools', 'Hand tools', 'Calibration Tools', 'Hydraulics', 'Pneumatics'];
  
  const technicianOptions = React.useMemo(() => {
    const names = new Set<string>();
    (masterEmployees || []).forEach(e => {
      if (e.name && e.name.trim()) names.add(e.name.trim());
    });
    return Array.from(names).sort();
  }, [masterEmployees]);

  const canDigitize = hasPermission('inventory', 'create', 'archives');
  const canEnroll = hasPermission('inventory', 'create', 'master');

  return (
    <div className="space-y-4">
      <div className="flex justify-center w-full mt-2 px-1">
        <div className="flex flex-wrap justify-center items-center gap-2 bg-slate-50/80 backdrop-blur-md p-2 rounded-[2rem] border border-slate-200 shadow-sm transition-all max-w-full overflow-hidden">
          {tabs.map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id as any)} 
              className={`flex items-center space-x-2.5 px-6 py-3.5 rounded-[1.2rem] font-black uppercase text-[10px] tracking-widest transition-all cursor-pointer active:scale-95 whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-white text-indigo-600 shadow-lg border border-indigo-100 ring-4 ring-indigo-50/50' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-white/50 border border-transparent'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {activeTab !== 'spares' && (
        <div className="bg-white border border-slate-100 rounded-[2.2rem] p-4 shadow-sm space-y-4 mx-1">
          <div className="flex flex-col xl:flex-row items-center justify-between gap-4">
            <div className="relative w-full xl:w-96 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={14} />
              <input 
                type="text" 
                placeholder={activeTab === 'archives' ? "Search daily logs..." : "Search registry..."}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-11 pr-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 shadow-inner"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
              {activeTab === 'inventory' && (
                <>
                  <div className="flex items-center space-x-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl flex-1 md:flex-none">
                    <Tags size={12} className="text-slate-400" />
                    <select 
                      value={categoryFilter}
                      onChange={e => setCategoryFilter(e.target.value)}
                      className="bg-transparent text-[9px] font-black uppercase text-slate-600 outline-none cursor-pointer w-full"
                    >
                      <option value="ALL">All Categories</option>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="flex items-center space-x-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl flex-1 md:flex-none">
                    <User size={12} className="text-slate-400" />
                    <select 
                      value={zoneFilter}
                      onChange={e => setZoneFilter(e.target.value)}
                      className="bg-transparent text-[9px] font-black uppercase text-slate-600 outline-none cursor-pointer w-full"
                    >
                      <option value="ALL">All Technicians</option>
                      {technicianOptions.map(t => <option key={t} value={t}>{t}</option>)}
                      <option value="Main Store">Main Store (Unassigned)</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl flex-1 md:flex-none">
                    <Activity size={12} className="text-slate-400" />
                    <select 
                      value={conditionFilter}
                      onChange={e => setConditionFilter(e.target.value)}
                      className="bg-transparent text-[9px] font-black uppercase text-slate-600 outline-none cursor-pointer w-full"
                    >
                      <option value="ALL">Health & Variance</option>
                      <optgroup label="Discrepancy Checks">
                        <option value="VARIANCE">Discrepancies Only</option>
                        <option value="OUT_OF_STOCK">Out of Stock</option>
                        <option value="IRREPARABLE">Decommissioned (-1)</option>
                      </optgroup>
                      <optgroup label="Core Conditions">
                        <option value="Excellent">Excellent</option>
                        <option value="Good">Good</option>
                        <option value="Damaged">Damaged</option>
                        <option value="Lost">Lost</option>
                      </optgroup>
                    </select>
                  </div>

                  {canEnroll && (
                    <button onClick={onEnrollTool} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-[#0F1135] shadow-xl shadow-indigo-100 transition-all flex items-center justify-center space-x-2 active:scale-95">
                        <PlusCircle size={14} /><span>Enroll New Asset</span>
                    </button>
                  )}
                </>
              )}

              {activeTab === 'archives' && (
                <>
                  <div className="flex items-center space-x-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl flex-1 md:flex-none">
                    <User size={12} className="text-slate-400" />
                    <select 
                      value={archiveOfficerFilter}
                      onChange={e => setArchiveOfficerFilter(e.target.value)}
                      className="bg-transparent text-[9px] font-black uppercase text-slate-600 outline-none cursor-pointer w-full"
                    >
                      <option value="ALL">All Officers</option>
                      {masterEmployees.filter(e => e.role.includes('Supervisor') || e.role.includes('Attendant') || e.role.includes('Manager')).map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center space-x-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl flex-1 md:flex-none">
                    <Layers size={12} className="text-slate-400" />
                    <select 
                      value={archiveStatusFilter}
                      onChange={e => setArchiveStatusFilter(e.target.value)}
                      className="bg-transparent text-[9px] font-black uppercase text-slate-600 outline-none cursor-pointer w-full"
                    >
                      <option value="ALL">All Records</option>
                      <option value="ISSUES">With Issues</option>
                      <option value="CLEAR">Cleared</option>
                    </select>
                  </div>

                  {canDigitize && (
                    <button onClick={onDigitize} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-[#0F1135] shadow-xl shadow-indigo-100 transition-all flex items-center justify-center space-x-2 active:scale-95">
                        <Camera size={14} /><span>Upload Daily Log</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryHeader;