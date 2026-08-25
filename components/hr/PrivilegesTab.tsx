import React from 'react';
import { Fingerprint, ShieldCheck, Globe, Circle, ShieldAlert, Info, LayoutDashboard, Contact, Layers, Wrench, Settings } from 'lucide-react';
import { Employee, VisibilityScope } from '../../types';
import Card from '../Card';

const MODULE_PERMISSIONS = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={14}/> },
  { 
    id: 'registry', 
    label: 'Staff List', 
    icon: <Contact size={14}/>,
    subHubs: [
      { id: 'enrollment', label: 'Enrollment' },
      { id: 'audit', label: 'Audit Vault' }
    ]
  },
  { 
    id: 'shifts', 
    label: 'Shifts', 
    icon: <Layers size={14}/>,
    subHubs: [
      { id: 'attendance', label: 'Daily Register' },
      { id: 'teams', label: 'Teams & Roster' },
      { id: 'history', label: 'Archive' }
    ]
  },
  { 
    id: 'inventory', 
    label: 'Tools', 
    icon: <Wrench size={14}/>,
    subHubs: [
      { id: 'master', label: 'Tool Registry' },
      { id: 'sectional', label: 'Section Tools' },
      { id: 'archives', label: 'Daily Logs' },
      { id: 'audit', label: 'Inspection' },
      { id: 'resolution', label: 'Repairs' }
    ]
  },
  { id: 'settings', label: 'System Settings', icon: <Settings size={14}/> }
];

const ActionDot = ({ active, color = 'bg-indigo-600' }: { active: boolean, color?: string }) => (
  <div className={`w-2 h-2 rounded-full transition-all duration-500 ${active ? color + ' shadow-[0_0_8px_rgba(79,70,229,0.4)] scale-110' : 'bg-slate-100 opacity-20'}`}></div>
);

interface PrivilegesTabProps {
  currentUser: Employee;
  tierDefaults?: Record<string, { permissions: string[], scope: VisibilityScope }>;
}

const PrivilegesTab: React.FC<PrivilegesTabProps> = ({ currentUser }) => {
  const userPermissions = currentUser.permissions || [];
  const userScope = currentUser.visibilityScope || 'SELF';

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="bg-[#0F1135] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full"></div>
         <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center space-x-5">
               <div className="w-16 h-16 bg-white/10 rounded-2xl border border-white/10 flex items-center justify-center text-indigo-400 shadow-inner">
                  <Fingerprint size={32} />
               </div>
               <div>
                  <h3 className="text-xl font-black uppercase tracking-tight leading-none">Authorization Matrix</h3>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.25em] mt-2">Personal Security & Access Blueprint</p>
               </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-[2rem] px-6 py-4 flex items-center space-x-5 shadow-inner">
               <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-black">
                     {currentUser.name.charAt(0)}
                  </div>
                  <div>
                     <p className="text-sm font-black uppercase tracking-tight text-white">{currentUser.name}</p>
                     <p className="text-[7.5px] font-black text-indigo-400 uppercase tracking-widest mt-0.5">Tier: {currentUser.accessLevel}</p>
                  </div>
               </div>
               <div className="h-8 w-px bg-white/10 hidden sm:block"></div>
               <div className="hidden sm:flex items-center space-x-2 text-emerald-400">
                  <ShieldCheck size={14} />
                  <span className="text-[8px] font-black uppercase tracking-widest">Active Identity Verified</span>
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
         <Card title="" className="p-0 overflow-hidden border-slate-100 rounded-[2.5rem] shadow-xl">
            <div className="px-8 py-5 border-b border-slate-100 bg-white flex items-center justify-between">
               <div className="flex items-center space-x-4">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-indigo-600 shadow-sm"><ShieldAlert size={20} /></div>
                  <div>
                     <h4 className="text-[12px] font-black text-slate-900 uppercase tracking-widest">Functional Hub Permissions</h4>
                     <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Granular Authorized Activity Ledger</p>
                  </div>
               </div>
               <div className="hidden md:flex items-center space-x-6 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                  <div className="flex items-center space-x-2"><ActionDot active color="bg-indigo-600" /><span>READ</span></div>
                  <div className="flex items-center space-x-2"><ActionDot active color="bg-emerald-500" /><span>CREATE</span></div>
                  <div className="flex items-center space-x-2"><ActionDot active color="bg-amber-500" /><span>UPDATE</span></div>
                  <div className="flex items-center space-x-2"><ActionDot active color="bg-rose-500" /><span>DELETE</span></div>
               </div>
            </div>

            <div className="overflow-x-auto no-scrollbar">
               <table className="w-full text-left table-fixed">
                  <thead className="bg-slate-50/80 backdrop-blur-md text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                     <tr>
                        <th className="py-5 px-10 w-[45%]">Operational Unit / Hub</th>
                        <th className="py-5 px-4 text-center">Authorization Status</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {MODULE_PERMISSIONS.map(mod => {
                        const hasModuleView = userPermissions.includes(`${mod.id}_view`);
                        return (
                           <React.Fragment key={mod.id}>
                              <tr className={`transition-all duration-300 ${hasModuleView ? 'bg-white' : 'bg-slate-50/20 grayscale opacity-40'}`}>
                                 <td className="py-4 px-10">
                                    <div className="flex items-center space-x-4">
                                       <div className={`p-2 rounded-xl border ${hasModuleView ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-white border-slate-100 text-slate-300 shadow-inner'}`}>
                                          {mod.icon}
                                       </div>
                                       <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{mod.label}</span>
                                    </div>
                                 </td>
                                 <td className="py-4 px-4">
                                    <div className="flex items-center justify-center space-x-3">
                                       <ActionDot active={userPermissions.includes(`${mod.id}_view`)} color="bg-indigo-600" />
                                       <ActionDot active={userPermissions.includes(`${mod.id}_create`)} color="bg-emerald-500" />
                                       <ActionDot active={userPermissions.includes(`${mod.id}_update`)} color="bg-amber-500" />
                                       <ActionDot active={userPermissions.includes(`${mod.id}_delete`)} color="bg-rose-500" />
                                    </div>
                                 </td>
                              </tr>
                              {mod.subHubs?.map(sub => {
                                 const hasSubView = userPermissions.includes(`${mod.id}_${sub.id}_view`);
                                 return (
                                    <tr key={`${mod.id}_${sub.id}`} className={`border-l-8 transition-all duration-300 ${hasSubView ? 'border-indigo-100 bg-white' : 'border-transparent bg-slate-50/20 grayscale opacity-30'}`}>
                                       <td className="py-3 px-16">
                                          <div className="flex items-center space-x-3">
                                             <Circle size={6} className={hasSubView ? 'text-indigo-300' : 'text-slate-200'} />
                                             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{sub.label}</span>
                                          </div>
                                       </td>
                                       <td className="py-3 px-4">
                                          <div className="flex items-center justify-center space-x-3 opacity-60">
                                             <ActionDot active={userPermissions.includes(`${mod.id}_${sub.id}_view`)} color="bg-indigo-600" />
                                             <ActionDot active={userPermissions.includes(`${mod.id}_${sub.id}_create`)} color="bg-emerald-500" />
                                             <ActionDot active={userPermissions.includes(`${mod.id}_${sub.id}_update`)} color="bg-amber-500" />
                                             <ActionDot active={userPermissions.includes(`${mod.id}_${sub.id}_delete`)} color="bg-rose-500" />
                                          </div>
                                       </td>
                                    </tr>
                                 );
                              })}
                           </React.Fragment>
                        );
                     })}
                  </tbody>
               </table>
            </div>
         </Card>

         <div className="p-8 bg-[#FAF9F6] border border-slate-100 rounded-[2.5rem] grid grid-cols-1 md:grid-cols-2 gap-10 shadow-sm">
            <div className="space-y-4">
               <div className="flex items-center space-x-3 text-indigo-600">
                  <Globe size={20} />
                  <h5 className="text-[11px] font-black uppercase tracking-[0.3em]">Data Sovereignty Perimeter</h5>
               </div>
               <p className="text-[10px] font-medium text-slate-500 uppercase leading-relaxed max-w-md">
                  Your visibility scope is restricted by institutional governance protocols. This perimeter dictates the breadth of personnel and asset data accessible during your session.
               </p>
            </div>
            <div className="flex items-center md:justify-end">
               <div className={`p-6 border rounded-[2rem] shadow-sm flex items-center space-x-5 transition-all duration-700 ${
                  userScope === 'ALL' ? 'bg-[#0F1135] border-[#0F1135] text-white shadow-indigo-100' :
                  userScope === 'TEAM' ? 'bg-indigo-50 border-indigo-100 text-indigo-700' :
                  'bg-white border-slate-200 text-slate-600'
               }`}>
                  <div className="text-right">
                     <p className="text-[8px] font-black uppercase tracking-widest mb-1 opacity-60">Active Visibility Scope</p>
                     <p className="text-sm font-black uppercase tracking-tight">
                        {userScope === 'ALL' ? 'Global Institutional Access' : userScope === 'TEAM' ? 'Unit-Restricted Hub' : 'Individual Filing Path'}
                     </p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner ${userScope === 'ALL' ? 'bg-indigo-500' : 'bg-white'}`}>
                     <ShieldAlert size={24} className={userScope === 'ALL' ? 'text-white' : 'text-indigo-600'} />
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className="px-8 py-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center space-x-3">
         <Info size={14} className="text-slate-400" />
         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Protocol: SOP-SEC-PRIV-V5 • Identity: {currentUser.id} • Trace Index: Enabled</p>
      </div>
    </div>
  );
};

export default PrivilegesTab;