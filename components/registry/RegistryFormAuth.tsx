import React from 'react';
import { Shield, ShieldCheck, Fingerprint, Settings2, ChevronDown, Check, LayoutDashboard, Contact, Layers, Wrench, Settings, Circle, MonitorCheck } from 'lucide-react';
import { Employee, AccessLevel, VisibilityScope } from '../../types';
import { INSTITUTIONAL_PERMISSIONS_SCHEMA } from '../../constants';

const MODULE_PERMISSIONS = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={12}/> },
  { 
    id: 'registry', 
    label: 'Staff List', 
    icon: <Contact size={12}/>,
    subHubs: [
      { id: 'enrollment', label: 'Enrollment' },
      { id: 'audit', label: 'Audit Vault' }
    ]
  },
  { 
    id: 'shifts', 
    label: 'Shifts', 
    icon: <Layers size={12}/>,
    subHubs: [
      { id: 'attendance', label: 'Daily Register' },
      { id: 'teams', label: 'Teams & Roster' },
      { id: 'history', label: 'Archive' }
    ]
  },
  { 
    id: 'inventory', 
    label: 'Tools', 
    icon: <Wrench size={12}/>,
    subHubs: [
      { id: 'master', label: 'Tool Registry' },
      { id: 'sectional', label: 'Section Tools' },
      { id: 'archives', label: 'Daily Logs' },
      { id: 'audit', label: 'Inspection' },
      { id: 'maintenance', label: 'Repairs' }
    ]
  },
  { 
    id: 'managerial', 
    label: 'Management', 
    icon: <MonitorCheck size={12}/>,
    subHubs: [
      { id: 'snapshot', label: 'Operational Snapshot' },
      { id: 'audit', label: 'Compliance Audit' },
      { id: 'resolution', label: 'Resolution Hub' }
    ]
  },
  { id: 'settings', label: 'System Settings', icon: <Settings size={12}/> }
];

const GatewayToggle: React.FC<{ 
  checked: boolean; 
  onChange: (v: boolean) => void;
  label: string;
  subtitle: string;
}> = ({ checked, onChange, label, subtitle }) => (
  <div className="flex items-center space-x-2">
    <button 
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-8 h-4 rounded-full relative transition-all duration-300 flex-shrink-0 ${checked ? 'bg-indigo-600' : 'bg-slate-300'}`}
    >
      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-md transition-transform duration-300 ${checked ? 'translate-x-4' : 'translate-x-1'}`} />
    </button>
    <div className="flex flex-col">
      <span className="text-[9px] font-black text-slate-800 uppercase tracking-tight leading-none">{label}</span>
      <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{subtitle}</span>
    </div>
  </div>
);

const CustomCheckbox = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
  <button 
    type="button"
    onClick={onChange}
    className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
      checked ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300 hover:border-indigo-400'
    }`}
  >
    {checked && <Check size={12} className="text-white" strokeWidth={4} />}
  </button>
);

interface AuthSectionProps {
  formData: Partial<Employee>;
  setFormData: (data: any) => void;
  autoUsername: boolean;
  setAutoUsername: (v: boolean) => void;
  availableTiers: string[];
  showGranular: boolean;
  setShowGranular: (v: boolean) => void;
  applyTierDefaults: (level: AccessLevel) => void;
  togglePermission: (permKey: string) => void;
  getModuleScope: (moduleId: string) => VisibilityScope;
  setModuleScope: (moduleId: string, scope: VisibilityScope) => void;
}

export const RegistryFormAuth: React.FC<AuthSectionProps> = ({
  formData,
  setFormData,
  autoUsername,
  setAutoUsername,
  availableTiers,
  showGranular,
  setShowGranular,
  applyTierDefaults,
  togglePermission,
  getModuleScope,
  setModuleScope
}) => {
  return (
    <div className="pt-4 border-t border-slate-100 space-y-3 md:space-y-4">
      <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-2xl border border-slate-100 shadow-inner">
         <GatewayToggle 
           checked={!!formData.hasSystemAccess} 
           onChange={(v) => setFormData({...formData, hasSystemAccess: v})}
           label="Login Access"
           subtitle="Enable for this user"
         />
         {formData.hasSystemAccess && (
           <button 
             type="button"
             onClick={() => setShowGranular(!showGranular)}
             className="flex items-center space-x-1 text-[8.5px] font-black text-indigo-600 uppercase tracking-widest"
           >
             <Settings2 size={12} />
             <span>{showGranular ? 'Hide' : 'Edit'} Permissions</span>
           </button>
         )}
      </div>

      {formData.hasSystemAccess && (
        <div className="space-y-3 md:space-y-4 animate-in slide-in-from-top-4 duration-500">
          <div className="bg-white p-4 rounded-[1.5rem] border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between mb-1">
               <div className="flex items-center space-x-2">
                  <Fingerprint size={14} className="text-indigo-600" />
                  <span className="text-[9px] font-black uppercase text-slate-900 tracking-widest">Account Details</span>
               </div>
               <div className="flex items-center space-x-1.5">
                  <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Suggest Email</label>
                  <CustomCheckbox checked={autoUsername} onChange={() => setAutoUsername(!autoUsername)} />
               </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                <input 
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[10px] font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Username"
                  value={formData.username || ''}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                <input 
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[10px] font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Initial Password"
                  value={formData.tempPassword || ''}
                  onChange={e => setFormData({...formData, tempPassword: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
             <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Role Permission Tier</label>
             <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={13} />
                <select 
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-10 py-3 text-xs font-black text-slate-900 outline-none appearance-none shadow-sm"
                  value={formData.accessLevel || ''}
                  onChange={e => {
                    const level = e.target.value as AccessLevel;
                    setFormData((prev: any) => ({ ...prev, accessLevel: level }));
                    applyTierDefaults(level);
                  }}
                >
                  <option value="" disabled>Select Level...</option>
                  <option value="Staff">Staff</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="HR">HR</option>
                  <option value="Director">Director</option>
                  <option value="Guest">Guest</option>
                  {formData.accessLevel && !['Staff', 'Supervisor', 'HR', 'Director', 'Guest'].includes(formData.accessLevel) && (
                    <option value={formData.accessLevel}>{formData.accessLevel}</option>
                  )}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
             </div>
          </div>

          {showGranular && (
            <div className="space-y-2.5 animate-in zoom-in-95">
              <div className="flex items-center justify-between px-1">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck size={14} className="text-indigo-600" />
                    <h4 className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Access Controls</h4>
                  </div>
                  <button 
                    type="button"
                    onClick={() => formData.accessLevel && applyTierDefaults(formData.accessLevel as AccessLevel)}
                    className="text-[8px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                  >
                    Reset Defaults
                  </button>
              </div>

              <div className="bg-white border border-slate-100 rounded-[1.5rem] overflow-hidden shadow-sm">
                  <table className="w-full text-left table-fixed">
                    <thead className="bg-slate-50">
                      <tr className="text-[7px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <th className="py-2 px-4 w-[40%]">Feature</th>
                        <th className="py-2 px-1 text-center">R</th>
                        <th className="py-2 px-1 text-center">C</th>
                        <th className="py-2 px-1 text-center">U</th>
                        <th className="py-2 px-1 text-center">D</th>
                        <th className="py-2 px-4 text-right w-[25%]">Scope</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {MODULE_PERMISSIONS.map(mod => {
                         const userPerms = formData.permissions || [];
                         const currentScope = getModuleScope(mod.id);
                         return (
                           <React.Fragment key={mod.id}>
                             <tr className="hover:bg-slate-50/50 transition-colors">
                               <td className="py-1.5 px-4">
                                  <span className="text-[9px] font-black text-slate-800 uppercase truncate block">{mod.label}</span>
                               </td>
                               <td className="py-1.5 px-1 text-center"><CustomCheckbox checked={userPerms.includes(`${mod.id}_view`)} onChange={() => togglePermission(`${mod.id}_view`)} /></td>
                               <td className="py-1.5 px-1 text-center"><CustomCheckbox checked={userPerms.includes(`${mod.id}_create`)} onChange={() => togglePermission(`${mod.id}_create`)} /></td>
                               <td className="py-1.5 px-1 text-center"><CustomCheckbox checked={userPerms.includes(`${mod.id}_update`)} onChange={() => togglePermission(`${mod.id}_update`)} /></td>
                               <td className="py-1.5 px-1 text-center"><CustomCheckbox checked={userPerms.includes(`${mod.id}_delete`)} onChange={() => togglePermission(`${mod.id}_delete`)} /></td>
                               <td className="py-1.5 px-4 text-right">
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      const nextScope: VisibilityScope = currentScope === 'SELF' ? 'TEAM' : currentScope === 'TEAM' ? 'ALL' : 'SELF';
                                      setModuleScope(mod.id, nextScope);
                                    }}
                                    className="px-2 py-0.5 rounded bg-slate-50 border border-slate-100 text-[6.5px] font-black text-slate-500 uppercase tracking-widest hover:border-indigo-200"
                                  >
                                     {currentScope === 'SELF' ? 'Self' : currentScope === 'TEAM' ? 'Unit' : 'Global'}
                                  </button>
                               </td>
                             </tr>
                             {mod.subHubs?.map(sub => (
                               <tr key={`${mod.id}_${sub.id}`} className="bg-slate-50/30 hover:bg-slate-100/50 transition-colors">
                                 <td className="py-1.5 px-8">
                                    <div className="flex items-center space-x-2">
                                       <Circle size={4} className="text-slate-300" />
                                       <span className="text-[8px] font-black text-slate-500 uppercase truncate block">{sub.label}</span>
                                    </div>
                                 </td>
                                 <td className="py-1.5 px-1 text-center"><CustomCheckbox checked={userPerms.includes(`${mod.id}_${sub.id}_view`)} onChange={() => togglePermission(`${mod.id}_${sub.id}_view`)} /></td>
                                 <td className="py-1.5 px-1 text-center"><CustomCheckbox checked={userPerms.includes(`${mod.id}_${sub.id}_create`)} onChange={() => togglePermission(`${mod.id}_${sub.id}_create`)} /></td>
                                 <td className="py-1.5 px-1 text-center"><CustomCheckbox checked={userPerms.includes(`${mod.id}_${sub.id}_update`)} onChange={() => togglePermission(`${mod.id}_${sub.id}_update`)} /></td>
                                 <td className="py-1.5 px-1 text-center"><CustomCheckbox checked={userPerms.includes(`${mod.id}_${sub.id}_delete`)} onChange={() => togglePermission(`${mod.id}_${sub.id}_delete`)} /></td>
                                 <td className="py-1.5 px-4 text-right"></td>
                               </tr>
                             ))}
                           </React.Fragment>
                         );
                      })}
                    </tbody>
                  </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};