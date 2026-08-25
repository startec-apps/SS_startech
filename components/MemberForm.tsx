import React, { useState, useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { Employee } from '../types';

interface MemberFormProps {
  initialMember?: Partial<Employee>;
  teamId: string;
  sections: string[];
  onSave: (data: Partial<Employee>) => void;
  onCancel: () => void;
}

const MemberForm: React.FC<MemberFormProps> = ({ initialMember, teamId, sections = [], onSave, onCancel }) => {
  const [firstName, setFirstName] = useState('');
  const [secondName, setSecondName] = useState('');
  const [otherNames, setOtherNames] = useState('');
  const [role, setRole] = useState<Employee['role']>(initialMember?.role || 'Staff');
  const [department, setDepartment] = useState(initialMember?.department || 'Other');
  const [offPeriodStart, setOffPeriodStart] = useState(initialMember?.offPeriodStart || '');
  const [offPeriodEnd, setOffPeriodEnd] = useState(initialMember?.offPeriodEnd || '');
  const [offPeriodType, setOffPeriodType] = useState(initialMember?.offPeriodType || '');

  useEffect(() => {
    const term = (initialMember?.name || '').trim();
    if (term) {
      const nameParts = term.split(/\s+/);
      setFirstName(nameParts[0] || '');
      setSecondName(nameParts[1] || '');
      setOtherNames(nameParts.slice(2).join(' ') || '');
    }
  }, [initialMember?.name]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = [firstName.trim(), secondName.trim(), otherNames.trim()].filter(Boolean).join(' ');
    if (!finalName) return alert("Please specify a name.");
    const finalSection = initialMember?.section || 'General';
    onSave({ 
      name: finalName, 
      role, 
      department,
      section: finalSection, 
      teamId: initialMember?.teamId || teamId, 
      id: initialMember?.id
    });
  };

  return (
    <tr className="bg-indigo-50/30">
      <td colSpan={6} className="py-6 px-10">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">First Name</label>
              <input 
                autoFocus
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Last Name / Surname</label>
              <input 
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
                value={secondName}
                onChange={(e) => setSecondName(e.target.value)}
                placeholder="Last Name / Surname"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Other Names</label>
              <input 
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
                value={otherNames}
                onChange={(e) => setOtherNames(e.target.value)}
                placeholder="Other Names"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Role</label>
              <select 
                className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm appearance-none cursor-pointer"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
              >
                <option value="Director">Director</option>
                <option value="Supervisor">Supervisor</option>
                <option value="HR">HR</option>
                <option value="Staff">Staff</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Department</label>
              <select 
                className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm appearance-none cursor-pointer"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <option value="Operators">Operators</option>
                <option value="Technical Team">Technical Team</option>
                <option value="HR Team">HR Team</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 border-t border-slate-100 pt-4">
            <button 
              type="submit" 
              className="bg-slate-900 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 flex items-center shadow-xl shadow-indigo-100 transition-all active:scale-95"
            >
              <CheckCircle2 size={14} className="mr-2" /> Save
            </button>
            <button 
              type="button" 
              onClick={onCancel}
              className="bg-white border border-slate-200 text-slate-400 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 flex items-center transition-all"
            >
              <X size={14} className="mr-2" /> Cancel
            </button>
          </div>
        </form>
      </td>
    </tr>
  );
};

export default MemberForm;
