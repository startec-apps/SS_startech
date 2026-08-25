import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { Employee, Team } from '../../types';

interface IdentitySectionProps {
  formData: Partial<Employee>;
  setFormData: (data: any) => void;
  teams?: Team[];
  sections?: string[];
  isCustomRole: boolean;
  setIsCustomRole: (v: boolean) => void;
  isCustomSection: boolean;
  setIsCustomSection: (v: boolean) => void;
  activeTeamData?: { supervisorName: string; memberCount: number } | null;
}

export const RegistryFormIdentity: React.FC<IdentitySectionProps> = ({
  formData,
  setFormData,
  teams,
  sections,
  isCustomRole,
  setIsCustomRole,
  isCustomSection,
  setIsCustomSection,
  activeTeamData
}) => {
  const [firstName, setFirstName] = useState('');
  const [secondName, setSecondName] = useState('');
  const [otherNames, setOtherNames] = useState('');

  useEffect(() => {
    const term = (formData.name || '').trim();
    const currentCombined = [firstName.trim(), secondName.trim(), otherNames.trim()].filter(Boolean).join(' ');
    if (term !== currentCombined) {
      const nameParts = term.split(/\s+/);
      setFirstName(nameParts[0] || '');
      setSecondName(nameParts[1] || '');
      setOtherNames(nameParts.slice(2).join(' ') || '');
    }
  }, [formData.name]);

  const updateName = (f: string, s: string, o: string) => {
    setFirstName(f);
    setSecondName(s);
    setOtherNames(o);
    const combined = [f.trim(), s.trim(), o.trim()].filter(Boolean).join(' ');
    setFormData((prev: any) => ({ ...prev, name: combined }));
  };

  return (
    <div className="space-y-3">
      {/* Name Segment: Separate Fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="flex flex-col">
          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">First Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={13} />
            <input 
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-[10px] font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm transition-all"
              placeholder="First Name"
              value={firstName}
              onChange={e => updateName(e.target.value, secondName, otherNames)}
            />
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Last Name / Surname</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={13} />
            <input 
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-[10px] font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm transition-all"
              placeholder="Last Name / Surname"
              value={secondName}
              onChange={e => updateName(firstName, e.target.value, otherNames)}
            />
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Other Names</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={13} />
            <input 
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-[10px] font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm transition-all"
              placeholder="Other Names"
              value={otherNames}
              onChange={e => updateName(firstName, secondName, e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Role Field */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-1 ml-1">
             <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Role</label>
             <button type="button" onClick={() => setIsCustomRole(!isCustomRole)} className="text-[7px] font-black text-indigo-500 uppercase tracking-tighter hover:underline">
                {isCustomRole ? 'Use List' : 'Custom'}
             </button>
          </div>
          {isCustomRole ? (
            <input 
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-[10px] font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
              placeholder="Role Title"
              value={formData.role || ''}
              onChange={e => setFormData({...formData, role: e.target.value as any})}
            />
          ) : (
            <select 
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-[10px] font-bold text-slate-700 outline-none appearance-none cursor-pointer"
              value={formData.role || 'Staff'}
              onChange={e => setFormData({...formData, role: e.target.value as any})}
            >
              <option value="Director">Director</option>
              <option value="Supervisor">Supervisor</option>
              <option value="HR">HR</option>
              <option value="Staff">Staff</option>
              <option value="Other">Other</option>
            </select>
          )}
        </div>

        {/* Department / Category Field */}
        <div className="flex flex-col">
          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Department</label>
          <select 
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[10px] font-bold text-slate-700 outline-none appearance-none cursor-pointer"
            value={formData.department || 'Operators'}
            onChange={e => setFormData({...formData, department: e.target.value})}
          >
            <option value="Operators">Operators</option>
            <option value="Technical Team">Technical Team</option>
            <option value="HR Team">HR Team</option>
          </select>
        </div>
      </div>
    </div>
  );
};