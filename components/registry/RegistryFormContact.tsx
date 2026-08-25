
import React from 'react';
import { Phone, Mail } from 'lucide-react';
import { Employee } from '../../types';

interface ContactSectionProps {
  formData: Partial<Employee>;
  setFormData: (data: any) => void;
}

export const RegistryFormContact: React.FC<ContactSectionProps> = ({ formData, setFormData }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-slate-100 pt-4">
      <div className="flex flex-col">
        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Phone Number</label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={13} />
          <input 
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-[10px] font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
            placeholder="+254 --- ---"
            value={formData.phone || ''}
            onChange={e => setFormData({...formData, phone: e.target.value})}
          />
        </div>
      </div>
      <div className="flex flex-col">
        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Personal Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={13} />
          <input 
            type="email"
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-[10px] font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
            placeholder="staff@company.com"
            value={formData.email || ''}
            onChange={e => setFormData({...formData, email: e.target.value})}
          />
        </div>
      </div>
    </div>
  );
};
