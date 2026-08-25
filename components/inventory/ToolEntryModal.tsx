
import React, { useState, useRef } from 'react';
import { Wrench, Plus, ShieldCheck, Camera, Edit2, X, Box, Layers, Briefcase, Trash2, History } from 'lucide-react';
import { ToolAsset, AssetClass, Employee } from '../../types';

interface ToolEntryModalProps {
  onSave: (tool: ToolAsset) => void;
  onCancel: () => void;
  currentUser: Employee;
  initialData?: ToolAsset | null;
  masterEmployees?: Employee[];
}

const ToolEntryModal: React.FC<ToolEntryModalProps> = ({ onSave, onCancel, currentUser, initialData, masterEmployees = [] }) => {
  const [formData, setFormData] = useState<Partial<ToolAsset>>(initialData || {
    name: '',
    category: 'General Tools',
    zone: 'Main Store',
    quantity: 1,
    available: 1,
    condition: 'Excellent',
    monetaryValue: 0,
    imageUrl: '',
    assetClass: 'Pc',
    composition: []
  });

  const [compInput, setCompInput] = useState('');
  const [isCustomZone, setIsCustomZone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Build clean unique technician names list from staff directory
  const staffList = React.useMemo<string[]>(() => {
    if (masterEmployees && masterEmployees.length > 0) {
      const names = new Set<string>();
      masterEmployees.forEach(e => {
        if (e.name && e.name.trim()) names.add(e.name.trim());
      });
      return Array.from(names).sort();
    }
    return ['John Doe', 'Jane Smith'];
  }, [masterEmployees]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addComp = () => {
    if (!compInput.trim()) return;
    setFormData(prev => ({
      ...prev,
      composition: [...(prev.composition || []), compInput.trim()]
    }));
    setCompInput('');
  };

  const removeComp = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      composition: (prev.composition || []).filter((_, i) => i !== idx)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return alert("Asset name is required.");
    if ((formData.assetClass === 'Set' || formData.assetClass === 'Toolbox') && (!formData.composition || formData.composition.length === 0)) {
      return alert(`Institutional Protocol: A ${formData.assetClass} must contain specific item records.`);
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    onSave({
      ...formData as ToolAsset,
      category: formData.category || 'General Tools',
      id: formData.id || `T-${Date.now().toString().slice(-4)}`,
      lastVerified: today,
      submissionDate: initialData?.submissionDate || today,
      addedBy: initialData?.addedBy || currentUser.name
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="relative bg-[#F8FAFF] w-full max-w-md rounded-3xl shadow-2xl border border-white/20 animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[96vh]">
        
        {/* Compact Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className={`w-9 h-9 ${initialData ? 'bg-amber-500 text-white' : 'bg-indigo-600 text-white'} rounded-xl flex items-center justify-center shadow-md shrink-0`}>
              {initialData ? <Edit2 size={16} /> : <Plus size={18} />}
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">
                {initialData ? 'Edit Asset' : 'Add New Asset'}
              </h3>
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">Tools Master Registry</p>
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

        {/* Responsive, No-Scroll Compact Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3">
          
          {/* Classification Selection */}
          <div className="space-y-1">
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Classification</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'Pc', label: 'Single Unit', icon: <Box size={13} /> },
                { id: 'Set', label: 'Tool Set', icon: <Layers size={13} /> },
                { id: 'Toolbox', label: 'Toolbox', icon: <Briefcase size={13} /> }
              ].map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, assetClass: tier.id as AssetClass })}
                  className={`py-2 px-2.5 rounded-xl border transition-all flex items-center justify-center gap-1.5 text-center ${
                    formData.assetClass === tier.id 
                      ? 'bg-[#0F1135] text-white border-[#0F1135] shadow-sm' 
                      : 'bg-white border-slate-200/80 text-slate-500 hover:border-indigo-200'
                  }`}
                >
                  {tier.icon}
                  <span className="text-[9.5px] font-black uppercase tracking-tight">{tier.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Photo & Designation Row */}
          <div className="flex items-center gap-3">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-16 h-16 sm:w-20 sm:h-20 bg-white border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer hover:border-indigo-300 transition-all shrink-0 shadow-sm"
            >
              {formData.imageUrl ? (
                <>
                  <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Tool" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                    <Camera className="text-white" size={18} />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center text-slate-300">
                  <Camera size={18} className="mb-0.5" />
                  <span className="text-[6.5px] font-black uppercase tracking-wider text-center">Add Photo</span>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex flex-col">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-0.5">Asset Designation</label>
                <div className="relative">
                  <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={13} />
                  <input 
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-[10px] sm:text-[11px] font-black uppercase text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm"
                    placeholder="e.g. Torque Wrench 1/2"
                    value={formData.name || ''}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />
          </div>

          {/* Conditional Manifest for Set/Toolbox */}
          {(formData.assetClass === 'Set' || formData.assetClass === 'Toolbox') && (
            <div className="bg-white border border-indigo-100 rounded-2xl p-2.5 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <History size={13} className="text-indigo-600" />
                  <h4 className="text-[8.5px] font-black text-slate-800 uppercase tracking-wider">Set Pieces ({formData.composition?.length || 0})</h4>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5">
                <input 
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[9.5px] font-black uppercase text-slate-700 outline-none focus:border-indigo-500"
                  placeholder="Piece description..."
                  value={compInput}
                  onChange={e => setCompInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addComp())}
                />
                <button 
                  type="button"
                  onClick={addComp}
                  className="w-7 h-7 bg-[#0F1135] text-white rounded-lg flex items-center justify-center shadow active:scale-95 shrink-0"
                >
                  <Plus size={14} />
                </button>
              </div>

              {formData.composition && formData.composition.length > 0 && (
                <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto no-scrollbar">
                  {formData.composition.map((piece, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 text-[8px] font-bold uppercase rounded-md">
                      {piece}
                      <button type="button" onClick={() => removeComp(idx)} className="text-slate-400 hover:text-rose-600">
                        <Trash2 size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Technician Name & Quantity Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-2 flex flex-col">
              <div className="flex items-center justify-between mb-1 ml-0.5">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Technician Name</label>
                <button 
                  type="button" 
                  onClick={() => setIsCustomZone(!isCustomZone)} 
                  className="text-[7px] font-black text-indigo-600 uppercase underline"
                >
                  {isCustomZone ? 'Staff Directory' : 'Custom Name'}
                </button>
              </div>
              {isCustomZone ? (
                <input 
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-black uppercase text-slate-700 outline-none focus:border-indigo-500 shadow-sm"
                  placeholder="Enter technician name"
                  value={formData.zone || ''}
                  onChange={e => setFormData({...formData, zone: e.target.value})}
                />
              ) : (
                <select 
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-black uppercase text-slate-700 outline-none cursor-pointer focus:border-indigo-500 shadow-sm"
                  value={formData.zone || ''}
                  onChange={e => setFormData({...formData, zone: e.target.value})}
                >
                  <option value="">-- Select Technician --</option>
                  <option value="Main Store">Main Store (Unassigned)</option>
                  {staffList.map((name, idx) => (
                    <option key={`tech-${idx}`} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex flex-col">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-0.5">Total Units</label>
              <input 
                type="number"
                min="1"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-black text-slate-800 outline-none focus:border-indigo-500 shadow-sm"
                value={formData.quantity || 1}
                onChange={e => {
                  const val = parseInt(e.target.value) || 1;
                  setFormData({...formData, quantity: val, available: val});
                }}
              />
            </div>
          </div>
        </form>

        {/* Compact Footer Actions */}
        <div className="px-5 py-3.5 bg-white border-t border-slate-100 flex items-center gap-2.5 shrink-0">
          <button 
            type="button" 
            onClick={onCancel} 
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-black uppercase tracking-wider text-[9px] hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={handleSubmit}
            className={`flex-[1.4] py-2.5 rounded-xl ${initialData ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#0F1135] hover:bg-indigo-700'} text-white font-black uppercase tracking-wider text-[9px] shadow-lg transition-all flex items-center justify-center space-x-1.5 active:scale-95`}
          >
            <ShieldCheck size={15} />
            <span>{initialData ? 'Update Asset' : 'Save Asset'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToolEntryModal;
