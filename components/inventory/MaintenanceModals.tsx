import React, { useState, useMemo } from 'react';
import { X, Hammer, AlertCircle, ShieldCheck, Search, UserCheck, Plus, Trash2, RefreshCw, CheckCircle2, Timer, XCircle } from 'lucide-react';
import { ToolAsset, Employee, MaintenanceRecord, MaintenanceStatus } from '../../types';

export const ReassignTechnicianModal: React.FC<{
  record: MaintenanceRecord;
  staff: Employee[];
  onConfirm: (techId: string, techName: string) => Promise<void>;
  onCancel: () => void;
}> = ({ record, staff, onConfirm, onCancel }) => {
  const [selectedTechId, setSelectedTechId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedTech = staff.find(s => s.id === selectedTechId);

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative bg-[#F8FAFF] w-full max-w-md rounded-3xl shadow-2xl border border-white/20 overflow-hidden my-auto flex flex-col max-h-[96vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-[#0F1135] text-indigo-300 rounded-xl flex items-center justify-center shadow-md shrink-0">
              <RefreshCw size={16} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">Reassign Technician</h3>
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">Asset: {record.toolName}</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onCancel} 
            className="text-slate-400 hover:text-slate-800 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Compact Form Body */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3 text-slate-800">
          <div className="space-y-3">
            <div className="bg-indigo-50/70 border border-indigo-100/80 p-3 rounded-2xl">
              <p className="text-[7.5px] font-black text-indigo-500 uppercase tracking-wider mb-0.5">Current Assignee</p>
              <p className="text-xs font-black text-indigo-900 uppercase">{record.assignedStaffName || 'Unassigned'}</p>
            </div>

            <div>
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-0.5 block">New Technical Lead *</label>
              <select
                value={selectedTechId}
                onChange={e => setSelectedTechId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] sm:text-[11px] font-black uppercase text-slate-800 outline-none focus:border-indigo-500 shadow-sm cursor-pointer"
              >
                <option value="">-- Choose Replacement Technician --</option>
                {staff.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2.5">
            <button 
              type="button" 
              onClick={onCancel} 
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-black uppercase tracking-wider text-[9px] hover:bg-slate-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedTech || isProcessing}
              onClick={async () => {
                if (!selectedTech) return;
                setIsProcessing(true);
                await onConfirm(selectedTech.id, selectedTech.name);
                setIsProcessing(false);
              }}
              className="flex-[1.4] py-2.5 rounded-xl bg-[#0F1135] hover:bg-indigo-700 text-white font-black uppercase tracking-wider text-[9px] shadow-lg transition-all flex items-center justify-center space-x-1.5 active:scale-95 cursor-pointer disabled:opacity-40"
            >
              <span>{isProcessing ? 'Processing...' : 'Authorize Reassignment'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export const ReportMaintenanceModal: React.FC<{
  tools: ToolAsset[];
  staff: Employee[];
  currentUser: Employee;
  onSave: (records: MaintenanceRecord[]) => Promise<void>;
  onCancel: () => void;
}> = ({ tools, staff, currentUser, onSave, onCancel }) => {
  const [selectedToolIds, setSelectedToolIds] = useState<Set<string>>(new Set());
  const [context, setContext] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [assignedStaffId, setAssignedStaffId] = useState('');

  const toggleTool = (id: string) => {
    setSelectedToolIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCommit = async () => {
    if (selectedToolIds.size === 0 || !context || !assignedStaffId) return;
    setIsProcessing(true);
    
    const assignedStaff = staff.find(s => s.id === assignedStaffId);
    const records: MaintenanceRecord[] = Array.from<string>(selectedToolIds).map((toolId: string) => {
      const tool = tools.find(t => t.id === toolId);
      return {
        id: `MNT-${Date.now()}-${toolId}`,
        toolId: toolId,
        toolName: tool?.name || 'Unknown',
        reportedBy: currentUser.name,
        reportedDate: new Date().toISOString().split('T')[0],
        breakdownContext: context,
        isRepairable: null,
        status: 'Staged',
        assignedStaffId,
        assignedStaffName: assignedStaff?.name || ''
      };
    });

    await onSave(records);
    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative bg-[#F8FAFF] w-full max-w-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden my-auto flex flex-col max-h-[96vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-rose-600 text-white rounded-xl flex items-center justify-center shadow-md shrink-0">
              <AlertCircle size={16} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">Report Tool Breakdown</h3>
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">Maintenance & Repair Request</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onCancel} 
            className="text-slate-400 hover:text-slate-800 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Compact Form Body */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3 text-slate-800">
          <div className="space-y-2.5">
            {/* Tool Selection Dropdown */}
            <div>
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-0.5 block">Select Tool Asset *</label>
              <select
                onChange={e => {
                  if (e.target.value) {
                    toggleTool(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] sm:text-[11px] font-bold text-slate-800 outline-none focus:border-indigo-500 shadow-sm cursor-pointer"
              >
                <option value="">+ Add Tool to Report...</option>
                {tools.filter(t => !selectedToolIds.has(t.id)).map(t => (
                  <option key={t.id} value={t.id}>{t.name} (Qty: {t.quantity})</option>
                ))}
              </select>

              {/* Selected Tool Tags */}
              {selectedToolIds.size > 0 && (
                <div className="flex flex-wrap gap-1 max-h-12 overflow-y-auto pt-1.5">
                  {Array.from<string>(selectedToolIds).map((id: string) => {
                    const tool = tools.find(t => t.id === id);
                    return (
                      <span key={id} className="bg-rose-50 border border-rose-100 text-rose-700 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase flex items-center gap-1">
                        <span>{tool?.name || id}</span>
                        <button type="button" onClick={() => toggleTool(id)} className="hover:text-rose-900 cursor-pointer">
                          <X size={9} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Assign Technician Dropdown */}
            <div>
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-0.5 block">Assign Technician *</label>
              <select
                value={assignedStaffId}
                onChange={e => setAssignedStaffId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] sm:text-[11px] font-black uppercase text-slate-800 outline-none focus:border-indigo-500 shadow-sm cursor-pointer"
              >
                <option value="">-- Choose Assigned Technician --</option>
                {staff.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Breakdown Context */}
            <div>
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-0.5 block">Breakdown Context / Symptoms *</label>
              <input
                type="text"
                placeholder="Describe fault (e.g. motor stall, broken handle)..."
                value={context}
                onChange={e => setContext(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-800 outline-none focus:border-indigo-500 shadow-sm"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2.5">
            <button 
              type="button" 
              onClick={onCancel} 
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-black uppercase tracking-wider text-[9px] hover:bg-slate-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selectedToolIds.size === 0 || !context || !assignedStaffId || isProcessing}
              onClick={handleCommit}
              className="flex-[1.4] py-2.5 rounded-xl bg-[#0F1135] hover:bg-indigo-700 text-white font-black uppercase tracking-wider text-[9px] shadow-lg transition-all flex items-center justify-center space-x-1.5 active:scale-95 cursor-pointer disabled:opacity-40"
            >
              <span>{isProcessing ? 'Saving...' : `Report (${selectedToolIds.size}) Breakdown`}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export const MaintenanceResolutionModal: React.FC<{
  record: MaintenanceRecord;
  staff: Employee[];
  onConfirm: (updates: Partial<MaintenanceRecord>, nextStatus: MaintenanceStatus) => Promise<void>;
  onCancel: () => void;
}> = ({ record, staff, onConfirm, onCancel }) => {
  const [resolutionType, setResolutionType] = useState<'Restored' | 'Decommissioned' | 'Spares'>(
    record.status === 'In_Repair' ? 'Spares' : 'Restored'
  );
  
  const [notes, setNotes] = useState(record.technicianNotes || '');
  const [cost, setCost] = useState(record.estimatedCost || 0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [assignedStaffId, setAssignedStaffId] = useState(record.assignedStaffId || '');

  const handleFinalize = async () => {
    setIsProcessing(true);
    let nextStatus: MaintenanceStatus = 'In_Repair';
    let isRepairable: boolean | null = null;

    if (resolutionType === 'Restored') {
      nextStatus = 'Restored';
      isRepairable = true;
    } else if (resolutionType === 'Decommissioned') {
      nextStatus = 'Decommissioned';
      isRepairable = false;
    } else {
      nextStatus = 'In_Repair';
      isRepairable = true;
    }
    
    const assignedStaff = staff.find(s => s.id === assignedStaffId);
    await onConfirm({
       isRepairable,
       technicianNotes: notes,
       estimatedCost: cost,
       assignedStaffId,
       assignedStaffName: assignedStaff?.name || record.assignedStaffName || '',
       resolutionDate: nextStatus === 'Restored' || nextStatus === 'Decommissioned' ? new Date().toISOString().split('T')[0] : undefined
    }, nextStatus);
    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative bg-[#F8FAFF] w-full max-w-md rounded-3xl shadow-2xl border border-white/20 overflow-hidden my-auto flex flex-col max-h-[96vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-[#0F1135] text-amber-400 rounded-xl flex items-center justify-center shadow-md shrink-0">
              <Hammer size={16} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">Complete Repair Action</h3>
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">Tool: {record.toolName}</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onCancel} 
            className="text-slate-400 hover:text-slate-800 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Compact Form Body */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3 text-slate-800">
          <div className="space-y-2.5">
            {/* Outcome Selection */}
            <div>
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-0.5 block">Repair Outcome *</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'Restored', label: 'Fixed / Restored', icon: <CheckCircle2 size={12}/> },
                  { id: 'Spares', label: 'Needs Spares', icon: <Timer size={12}/> },
                  { id: 'Decommissioned', label: 'Decommission', icon: <XCircle size={12}/> }
                ].map(path => (
                  <button 
                    key={path.id}
                    type="button"
                    onClick={() => setResolutionType(path.id as any)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-center gap-1 cursor-pointer ${
                      resolutionType === path.id 
                      ? 'bg-[#0F1135] border-[#0F1135] text-white shadow-sm' 
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {path.icon}
                    <span className="text-[8.5px] font-black uppercase tracking-tight leading-none">{path.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Assigned Tech */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-0.5 block">Assigned Tech *</label>
                <select
                  value={assignedStaffId}
                  onChange={e => setAssignedStaffId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-[10px] font-black uppercase text-slate-800 outline-none focus:border-indigo-500 shadow-sm cursor-pointer"
                >
                  <option value="">-- Choose Tech --</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-0.5 block">Repair Cost ($)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={cost || ''}
                  onChange={e => setCost(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-[10px] font-bold text-slate-800 outline-none focus:border-indigo-500 shadow-sm"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-0.5 block">Technician Notes</label>
              <input
                type="text"
                placeholder="Details of repair or replacement parts..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[10px] font-medium text-slate-800 outline-none focus:border-indigo-500 shadow-sm"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2.5">
            <button 
              type="button" 
              onClick={onCancel} 
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-black uppercase tracking-wider text-[9px] hover:bg-slate-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!assignedStaffId || isProcessing}
              onClick={handleFinalize}
              className="flex-[1.4] py-2.5 rounded-xl bg-[#0F1135] hover:bg-indigo-700 text-white font-black uppercase tracking-wider text-[9px] shadow-lg transition-all flex items-center justify-center space-x-1.5 active:scale-95 cursor-pointer disabled:opacity-40"
            >
              <span>{isProcessing ? 'Processing...' : 'Finalize Resolution'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
