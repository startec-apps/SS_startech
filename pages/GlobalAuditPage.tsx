import React, { useMemo, useState } from 'react';
import { ShieldCheck, User, Calendar, Clock, ChevronDown, ChevronUp, Search, TrendingUp, Filter, Info, Calculator } from 'lucide-react';
import { AttendanceRecord, Team, Employee, DayType } from '../types';

const GlobalAuditPage: React.FC<{ 
  history: AttendanceRecord[]; 
  teams: Team[]; 
  masterEmployees: Employee[];
  currentUser: Employee;
  resolveStaffIdentity: (id: string) => Partial<Employee>;
}> = ({ history = [], teams = [], masterEmployees = [], currentUser, resolveStaffIdentity }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const allEmployees = useMemo(() => 
    masterEmployees.length > 0 ? masterEmployees : teams.flatMap(t => t.members), 
  [masterEmployees, teams]);

  const filteredEmployees = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return allEmployees.filter(e => 
      (e.name || '').toLowerCase().includes(s) || 
      (e.id || '').toLowerCase().includes(s) || 
      (e.department || '').toLowerCase().includes(s)
    );
  }, [allEmployees, searchTerm]);

  const statsByEmployee = useMemo(() => {
    const map: Record<string, { present: number; absent: number; totalOT: number; records: AttendanceRecord[] }> = {};
    history.forEach(rec => {
      if (!map[rec.employeeId]) {
        map[rec.employeeId] = { present: 0, absent: 0, totalOT: 0, records: [] };
      }
      if (rec.status === 'Present') map[rec.employeeId].present++;
      else map[rec.employeeId].absent++;
      map[rec.employeeId].totalOT += (rec.overtimeHours || 0);
      map[rec.employeeId].records.push(rec);
    });
    return map;
  }, [history]);

  return (
    <div className="space-y-4 animate-in fade-in duration-500 max-w-full">
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 mx-1">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-[#0F1135] rounded-xl text-white shadow-lg shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight leading-none">Attendance Audit</h3>
            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">Detailed Staff Performance Records</p>
          </div>
        </div>
        <div className="relative w-full md:w-64">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
          <input 
            type="text" 
            placeholder="Search Name or ID..." 
            className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-9 pr-3 py-2 text-[9px] font-black uppercase tracking-widest outline-none focus:ring-1 focus:ring-indigo-500"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white border border-slate-100 shadow-xl rounded-[2rem] overflow-hidden mx-1">
        <div className="hidden md:grid grid-cols-12 bg-slate-50/80 backdrop-blur-md text-[8px] font-black text-slate-400 uppercase tracking-[0.25em] border-b border-slate-100 px-8 py-4">
           <div className="col-span-4">Staff Member</div>
           <div className="col-span-2 text-center">Attendance Rate</div>
           <div className="col-span-2 text-center">Days (P/A)</div>
           <div className="col-span-2 text-center">Total Overtime</div>
           <div className="col-span-2 text-right">Records</div>
        </div>

        <div className="divide-y divide-slate-50">
          {filteredEmployees.length === 0 ? (
            <div className="py-24 text-center">
              <Search size={48} className="mx-auto text-slate-100 mb-4" />
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">No Records Found</p>
            </div>
          ) : filteredEmployees.map(emp => {
            const empStats = statsByEmployee[emp.id] || { present: 0, absent: 0, totalOT: 0, records: [] };
            const total = empStats.present + empStats.absent;
            const reliability = total > 0 ? (empStats.present / total) * 100 : 0;
            const isExpanded = expandedId === emp.id;

            return (
              <React.Fragment key={emp.id}>
                <div 
                  onClick={() => setExpandedId(isExpanded ? null : emp.id)}
                  className={`group p-5 md:px-8 md:py-4 hover:bg-indigo-50/20 transition-all duration-300 cursor-pointer ${isExpanded ? 'bg-indigo-50/30' : ''}`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                      <div className="col-span-1 md:col-span-4">
                        <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 border border-slate-100 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-sm group-hover:shadow-indigo-100 transition-all duration-500 ${emp.status === 'Inactive' ? 'bg-slate-100 text-slate-400' : 'bg-white text-indigo-600'}`}>
                              {emp.name.charAt(0)}
                          </div>
                          <div className="flex flex-col min-w-0">
                              <span className={`font-black text-sm uppercase tracking-tight truncate ${emp.status === 'Inactive' ? 'text-slate-400 italic' : 'text-slate-900'}`}>{emp.name}</span>
                              <div className="flex items-center space-x-2 mt-0.5">
                                <span className="text-[8px] font-black text-slate-200 uppercase tracking-widest">{emp.id}</span>
                                <span className="text-[8px] font-bold text-slate-100">|</span>
                                <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest truncate">{emp.department || 'Other'}</span>
                              </div>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-1 md:col-span-2 text-center">
                        <div className="flex md:flex-col items-center md:items-center justify-between">
                           <span className="md:hidden text-[8px] font-black text-slate-300 uppercase tracking-widest">Rate:</span>
                           <div className="flex items-center space-x-2">
                             <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden md:block">
                                <div className={`h-full ${reliability >= 90 ? 'bg-emerald-500' : reliability >= 75 ? 'bg-indigo-500' : 'bg-rose-500'}`} style={{ width: `${reliability}%` }}></div>
                             </div>
                             <span className={`text-[10px] font-black ${reliability >= 90 ? 'text-emerald-600' : 'text-slate-900'}`}>{reliability.toFixed(0)}%</span>
                           </div>
                        </div>
                      </div>

                      <div className="col-span-1 md:col-span-2 text-center">
                        <div className="flex md:flex-col items-center md:items-center justify-between">
                           <span className="md:hidden text-[8px] font-black text-slate-300 uppercase tracking-widest">Days:</span>
                           <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{empStats.present}P • {empStats.absent}A</span>
                        </div>
                      </div>

                      <div className="col-span-1 md:col-span-2 text-center">
                         <div className="flex md:flex-col items-center md:items-center justify-between">
                            <span className="md:hidden text-[8px] font-black text-slate-300 uppercase tracking-widest">OT:</span>
                            <span className={`text-[10px] font-black ${empStats.totalOT > 0 ? 'text-indigo-600' : 'text-slate-200'}`}>
                               {empStats.totalOT > 0 ? `+${empStats.totalOT.toFixed(1)}h` : '0h'}
                            </span>
                         </div>
                      </div>

                      <div className="col-span-1 md:col-span-2 text-right">
                         <div className="flex items-center justify-end space-x-3">
                            <ChevronDown size={14} className={`text-slate-300 transition-transform duration-500 ${isExpanded ? 'rotate-180 text-indigo-600' : ''}`} />
                         </div>
                      </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="bg-slate-50/50 border-y border-slate-100/50 p-6 md:px-12 animate-in slide-in-from-top-4 duration-500 shadow-inner">
                    <div className="bg-white border border-slate-200 rounded-[1.8rem] overflow-hidden shadow-xl">
                      <div className="hidden md:grid grid-cols-12 bg-slate-50 text-[7px] font-black text-slate-400 uppercase tracking-widest px-8 py-3 border-b border-slate-100">
                         <div className="col-span-4">Date</div>
                         <div className="col-span-3 text-center">Status</div>
                         <div className="col-span-5 text-right">Hours</div>
                      </div>
                      <div className="divide-y divide-slate-50">
                        {empStats.records.length === 0 ? (
                          <div className="py-12 text-center">
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">No detailed history</p>
                          </div>
                        ) : empStats.records.sort((a,b) => b.date.localeCompare(a.date)).map((rec, idx) => (
                          <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-4 px-8 py-3.5 items-center hover:bg-slate-50/50 transition-colors">
                             <div className="col-span-1 md:col-span-4">
                                <div className="flex items-center space-x-3">
                                   <div className="w-8 h-8 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-indigo-600 shrink-0">
                                      <Calendar size={12} />
                                   </div>
                                   <div className="flex flex-col">
                                      <span className="text-[10px] font-black text-slate-800 uppercase leading-none">{rec.date}</span>
                                      <span className="text-[7.5px] font-black text-slate-300 uppercase mt-1 tracking-wider">{rec.dayType}</span>
                                   </div>
                                </div>
                             </div>
                             <div className="col-span-1 md:col-span-3 text-center">
                                <div className="flex items-center justify-between md:justify-center">
                                   <span className="md:hidden text-[7px] font-black text-slate-300 uppercase tracking-widest">Flag:</span>
                                   <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md border ${rec.status === 'Present' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                      {rec.status === 'Present' ? 'Present' : 'Absent'}
                                   </span>
                                </div>
                             </div>
                             <div className="col-span-1 md:col-span-5 text-right">
                                <div className="flex flex-col items-end">
                                   <span className={`text-[10px] font-black ${rec.overtimeHours > 0 ? 'text-indigo-600' : 'text-slate-200'}`}>
                                      {rec.overtimeHours > 0 ? `+${rec.overtimeHours.toFixed(1)}h OT` : '8.0h'}
                                   </span>
                                   {rec.comment && <span className="text-[6.5px] font-bold text-slate-300 uppercase italic truncate max-w-[150px]">{rec.comment}</span>}
                                </div>
                             </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="px-8 py-4 bg-[#0F1135] rounded-[1.5rem] flex flex-col md:flex-row items-center justify-between text-white shadow-2xl border border-white/5 gap-3 mx-1">
         <div className="flex items-center space-x-3">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em]">Attendance System Active</p>
         </div>
         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em]">Total Staff in Audit: <span className="text-white font-black ml-1.5">{filteredEmployees.length}</span></p>
      </div>
    </div>
  );
};

export default GlobalAuditPage;