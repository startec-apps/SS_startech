
import React, { useMemo, useState } from 'react';
import { Users, UserX, CheckCircle2, ShieldCheck, Sun, Moon, Calendar, ChevronDown, MonitorCheck, LayoutGrid, Clock, History } from 'lucide-react';
import { AttendanceRecord, Team, Employee, Shift, ShiftType } from '../types';
import Card from '../components/Card';

interface OperationalSnapshotPageProps {
  history: AttendanceRecord[];
  teams: Team[];
  masterEmployees: Employee[];
  shifts: Shift[];
}

const OperationalSnapshotPage: React.FC<OperationalSnapshotPageProps> = ({ history, teams, masterEmployees, shifts }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const dailyRecords = useMemo(() => {
    return history.filter(h => h.date === selectedDate);
  }, [history, selectedDate]);

  const rosterStats = useMemo(() => {
    return shifts.map((shift, idx) => {
      const shiftRecords = dailyRecords.filter(r => r.shiftId === shift.id);
      const team = teams[idx] || { members: [] };
      const present = shiftRecords.filter(r => r.status === 'Present').length;
      const absent = shiftRecords.filter(r => r.status === 'Absent').length;
      const total = team.members.length;
      
      return {
        shift,
        team,
        present,
        absent,
        total,
        isFiled: shiftRecords.length > 0
      };
    });
  }, [dailyRecords, shifts, teams]);

  const absenceList = useMemo(() => {
    return dailyRecords
      .filter(r => r.status === 'Absent')
      .map(r => {
        const emp = masterEmployees.find(e => e.id === r.employeeId);
        const shift = shifts.find(s => s.id === r.shiftId);
        return {
          ...r,
          employeeName: emp?.name || 'Unknown',
          employeeDept: emp?.department || 'Operations',
          shiftName: shift?.name || 'Unknown'
        };
      });
  }, [dailyRecords, masterEmployees, shifts]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-full">
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 mx-1">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shrink-0">
            <MonitorCheck size={18} />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight leading-none">Operational Snapshot</h3>
            <div className="flex items-center space-x-2 mt-1.5">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
               <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Verified View: {new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </div>
        <div className="relative w-full md:w-64">
          <Calendar size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
          <input 
            type="date" 
            className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-9 pr-3 py-2 text-[9px] font-black uppercase tracking-widest outline-none focus:ring-1 focus:ring-indigo-500 shadow-inner"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mx-1">
        {rosterStats.map((stat, idx) => (
          <div key={idx} className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm flex flex-col hover:shadow-md transition-all">
            <div className={`p-6 border-b border-slate-50 flex items-center justify-between ${stat.shift.type === ShiftType.DAY ? 'bg-orange-50/10' : 'bg-slate-900/5'}`}>
               <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${stat.shift.type === ShiftType.DAY ? 'bg-orange-50 text-orange-600' : 'bg-slate-900 text-white'}`}>
                     {stat.shift.type === ShiftType.DAY ? <Sun size={18}/> : <Moon size={18}/>}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">{stat.shift.name}</h4>
                    <p className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest">{stat.shift.type} OPS</p>
                  </div>
               </div>
               {!stat.isFiled ? (
                 <span className="text-[7px] font-black bg-rose-50 text-rose-500 px-2 py-0.5 rounded border border-rose-100">UNFILED</span>
               ) : (
                 <span className="text-[7px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded border border-emerald-100 shadow-sm shadow-emerald-100/50">COMMITTED</span>
               )}
            </div>
            
            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest mb-1.5 text-center">Present</p>
                <p className="text-xl font-black text-emerald-600 tabular-nums text-center">{stat.present}</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest mb-1.5 text-center">Absent</p>
                <p className="text-xl font-black text-rose-600 tabular-nums text-center">{stat.absent}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mx-1">
        <Card title="" className="lg:col-span-12 p-0 overflow-hidden border-slate-100 shadow-xl rounded-[2.5rem]">
          <div className="px-8 py-5 border-b border-slate-50 flex items-center justify-between bg-white">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-rose-50 rounded-2xl text-rose-600 shadow-sm"><UserX size={20} /></div>
              <div>
                 <h4 className="text-[12px] font-black text-slate-900 uppercase tracking-widest">Registry Exceptions</h4>
                 <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Staff Absence Ledger</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 bg-slate-900 text-white px-4 py-2 rounded-xl shadow-lg border border-white/10">
               <History size={14} className="text-indigo-400" />
               <span className="text-[9px] font-black uppercase tracking-widest">Records Trace Active</span>
            </div>
          </div>

          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
                  <th className="py-4 px-10">Personnel Identity</th>
                  <th className="py-4 px-4">Shift</th>
                  <th className="py-4 px-10 text-right">Verification Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {absenceList.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-20 text-center">
                       <p className="text-[10px] font-black text-slate-200 uppercase tracking-widest">Operational Integrity Verified: 100% Attendance</p>
                    </td>
                  </tr>
                ) : absenceList.map((item, idx) => (
                  <tr key={idx} className="hover:bg-rose-50/20 transition-all duration-300 group">
                    <td className="py-4 px-10">
                      <div className="flex items-center space-x-4">
                         <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center text-rose-400 font-black text-[10px] border border-rose-100">
                            {item.employeeName.charAt(0)}
                         </div>
                         <div className="flex flex-col min-w-0">
                           <span className="text-[11px] font-black text-slate-900 uppercase truncate leading-none">{item.employeeName}</span>
                           <span className="text-[7.5px] font-black text-[#A13507] uppercase mt-1.5 tracking-widest">{item.employeeDept}</span>
                         </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                       <span className="text-[9px] font-black text-slate-700 uppercase tracking-tighter">{item.shiftName}</span>
                    </td>
                    <td className="py-4 px-10 text-right">
                       <p className="text-[9px] font-medium text-rose-600 italic line-clamp-1">"{item.comment || 'N/A'}"</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default OperationalSnapshotPage;
