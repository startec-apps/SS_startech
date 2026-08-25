import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, RotateCcw, UserPlus, ShieldCheck, Save } from 'lucide-react';
import { Employee, Team, AccessLevel, VisibilityScope } from '../types';
import { RegistryFormIdentity } from './registry/RegistryFormIdentity';
import { RegistryFormContact } from './registry/RegistryFormContact';
import { RegistryFormAuth } from './registry/RegistryFormAuth';
import { INSTITUTIONAL_PERMISSIONS_SCHEMA } from '../constants';

interface RegistryFormProps {
  formData: Partial<Employee>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Employee>>>;
  isProcessing: boolean;
  editingId: string | null;
  onSave: () => void;
  onCancel: () => void;
  teams: Team[];
  sections: string[];
  tierDefaults?: Record<string, { permissions: string[], scope: VisibilityScope }>;
  setSystemBusy?: (busy: boolean) => void;
}

const RegistryForm: React.FC<RegistryFormProps> = ({ 
  formData, 
  setFormData, 
  isProcessing, 
  editingId, 
  onSave, 
  onCancel, 
  teams, 
  sections = [], 
  tierDefaults = {}, 
}) => {
  const [showGranular, setShowGranular] = useState(false);
  const [isCustomRole, setIsCustomRole] = useState(false);
  const [isCustomSection, setIsCustomSection] = useState(false);
  const [autoUsername, setAutoUsername] = useState(false);

  const activeTeamData = useMemo(() => {
    if (!formData.teamId) return null;
    const team = teams.find(t => t.id === formData.teamId);
    if (!team) return null;
    const supervisor = team.members.find(m => m.id === team.supervisorId || m.role === 'Workshop Supervisor');
    return {
      supervisorName: supervisor?.name || 'Unassigned',
      memberCount: team.members.length
    };
  }, [formData.teamId, teams]);

  useEffect(() => {
    if (autoUsername && formData.email && formData.username !== formData.email) {
      setFormData(prev => (prev.username === prev.email ? prev : { ...prev, username: prev.email }));
    }
  }, [autoUsername, formData.email, formData.username, setFormData]);

  const applyTierDefaults = useCallback((level: AccessLevel) => {
    const defaults = tierDefaults?.[level] || INSTITUTIONAL_PERMISSIONS_SCHEMA[level];
    if (defaults) {
      setFormData(prev => ({ 
        ...prev, 
        accessLevel: level,
        hasSystemAccess: prev.hasSystemAccess === false ? false : true,
        permissions: Array.isArray(defaults.permissions) ? [...defaults.permissions] : [],
        visibilityScope: defaults.scope || 'SELF' 
      }));
    }
  }, [tierDefaults, setFormData]);

  const togglePermission = useCallback((permKey: string) => {
    setFormData(prev => {
      const current = prev.permissions || [];
      const next = current.includes(permKey) 
        ? current.filter(id => id !== permKey) 
        : [...current, permKey];
      return { ...prev, permissions: next };
    });
  }, [setFormData]);

  const getModuleScope = useCallback((moduleId: string): VisibilityScope => {
    const scopePerm = (formData.permissions || []).find(p => p.startsWith(`${moduleId}_scope_`));
    return (scopePerm?.split('_').pop() as VisibilityScope) || 'SELF';
  }, [formData.permissions]);

  const setModuleScope = useCallback((moduleId: string, scope: VisibilityScope) => {
    setFormData(prev => {
      const current = prev.permissions || [];
      const filtered = current.filter(p => !p.startsWith(`${moduleId}_scope_`));
      return { ...prev, permissions: [...filtered, `${moduleId}_scope_${scope}`] };
    });
  }, [setFormData]);

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative bg-[#F8FAFF] w-full max-w-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden my-auto flex flex-col max-h-[96vh] animate-in zoom-in-95 duration-200">
        
        {/* Header - Fixed */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-[#0F1135] text-indigo-300 rounded-xl flex items-center justify-center shadow-md shrink-0">
              <UserPlus size={16} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">{editingId ? 'Update Identity' : 'Enroll Personnel'}</h3>
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">Master Registry Access</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onCancel} 
            className="text-slate-400 hover:text-slate-800 transition-colors p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Area - Fluid Scrollable */}
        <div className="p-4 sm:p-5 flex-1 space-y-4 overflow-y-auto no-scrollbar">
          <RegistryFormIdentity 
            formData={formData} 
            setFormData={setFormData} 
            teams={teams} 
            sections={sections} 
            isCustomRole={isCustomRole}
            setIsCustomRole={setIsCustomRole}
            isCustomSection={isCustomSection}
            setIsCustomSection={setIsCustomSection}
            activeTeamData={activeTeamData}
          />

          <RegistryFormContact 
            formData={formData} 
            setFormData={setFormData} 
          />

          <RegistryFormAuth 
            formData={formData}
            setFormData={setFormData}
            autoUsername={autoUsername}
            setAutoUsername={setAutoUsername}
            availableTiers={Object.keys(tierDefaults || {})}
            showGranular={showGranular}
            setShowGranular={setShowGranular}
            applyTierDefaults={applyTierDefaults}
            togglePermission={togglePermission}
            getModuleScope={getModuleScope}
            setModuleScope={setModuleScope}
          />
        </div>

        {/* Footer - Fixed */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center gap-2.5 shrink-0">
          <button 
            type="button"
            onClick={onCancel} 
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-black uppercase tracking-wider text-[9px] hover:bg-slate-50 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={onSave} 
            disabled={isProcessing}
            className="flex-[1.4] py-2.5 rounded-xl bg-[#0F1135] hover:bg-indigo-700 text-white font-black uppercase tracking-wider text-[9px] shadow-lg transition-all flex items-center justify-center space-x-1.5 active:scale-95 cursor-pointer disabled:opacity-40"
          >
            {isProcessing ? <RotateCcw size={13} className="animate-spin" /> : <Save size={13} />}
            <span>{editingId ? 'Sync Updates' : 'Save'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegistryForm;