
import React, { useState, useMemo } from 'react';
import { CalendarDays, Save, RotateCcw, Users, AlertCircle, CheckSquare, Square, Scale } from 'lucide-react';
import { Team, Shift, AttendanceRecord, DayType } from '../types';
import Card from '../components/Card';

const OvertimePage: React.FC<{
  teams: Team[];
  shifts: Shift[];
  onSave: (records: AttendanceRecord[]) => void;
}> = ({ teams, shifts, onSave }) => {
  const [selectedShiftId, setSelectedShiftId] = useState(shifts[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [batchHours, setBatchHours] = useState<number>(0);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [isSyncing, setIsSyncing] = useState(false);

  const shiftIndex = shifts.findIndex(s => s.id === selectedShiftId);
  const activeTeam = teams[shiftIndex];

  const isSunday = useMemo(() => {
    const d = new Date(selectedDate);
    return d.getDay() === 0;
  }, [selectedDate]);

  // For simulation, we'll assume Holiday logic is separate or manually toggled elsewhere, 
  // but for Dispatch, we prioritize Sunday rule.
  const currentDayType = isSunday ? DayType.SUNDAY : DayType.STANDARD;
  const otMultiplier = currentDayType === DayType.STANDARD ? 1.5 : 2.0;

  const toggleMember = (id: string) => {
    setSelectedMembers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (!activeTeam) return;
    if (selectedMembers.size === activeTeam.members.length) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(activeTeam.members.map(m => m.id)));
    }
  };

  const handleCommit = async () => {
    if (!activeTeam || selectedMembers.size === 0) {
      alert("Please select target personnel and define OT hours.");
      return;
    }

    setIsSyncing(true);
    
    const records: AttendanceRecord[] = activeTeam.members
      .filter(m => selectedMembers.has(m.id))
      .map(m => ({
        date: selectedDate,
        employeeId: m.id,
        shiftId: selectedShiftId,
        status: 'Present',
        overtimeHours: batchHours,
        comment: 'Bulk OT Allocation',
        dayType: currentDayType
      }));

    onSave(records);
    setIsSyncing(false);
    alert(`Successfully allocated ${batchHours}h (${(batchHours * otMultiplier).toFixed(1)}h weighted) to ${selectedMembers.size} personnel members.`);
    setSelectedMembers(new Set());
    setBatchHours(0);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Allocation Parameters Panel */}
        <Card title="Allocation Parameters" className="lg:col-span-1">
          <div className="space-y-6">
            <div className="flex flex-col">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Target Operational Date</label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="date" 
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white font-bold text-gray-700"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedMembers(new Set());
                  }}
                />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Shift Domain</label>
              <select 
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white font-bold text-gray-700"
                value={selectedShiftId}
                onChange={(e) => {
                  setSelectedShiftId(e.target.value);
                  setSelectedMembers(new Set());
                }}
              >
                {shifts.map(s => <option key={s.id} value={s.id}>{s.name} ({s.type})</option>)}
              </select>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">OT Dispatch Value</label>
                <div className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter border ${
                  otMultiplier === 2.0 ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-indigo-50 border-indigo-100 text-indigo-600'
                }`}>
                  <Scale size={10} />
                  <span>Rate: {otMultiplier}x</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input 
                  type="number" 
                  step="0.5"
                  min="0"
                  placeholder="0.0"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white font-black text-blue-600 text-lg"
                  value={batchHours || ''}
                  onChange={(e) => setBatchHours(parseFloat(e.target.value) || 0)}
                />
                <span className="font-black text-gray-400 uppercase tracking-widest text-[10px]">Hours</span>
              </div>
              {batchHours > 0 && (
                <p className="mt-2 text-[10px] font-bold text-slate-400 italic">
                  Effective Dispatch: {(batchHours * otMultiplier).toFixed(1)}h weighted / member
                </p>
              )}
            </div>

            <div className="pt-4">
              <button 
                onClick={handleCommit}
                disabled={isSyncing || selectedMembers.size === 0 || batchHours <= 0}
                className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-indigo-600 transition-all shadow-xl shadow-slate-100 flex items-center justify-center space-x-3 disabled:bg-gray-200 disabled:shadow-none"
              >
                {isSyncing ? <RotateCcw className="animate-spin" size={16} /> : <Save size={16} />}
                <span>{isSyncing ? 'Allocating...' : 'Commit Batch OT'}</span>
              </button>
            </div>
          </div>
        </Card>

        {/* Selection Interface Panel */}
        <Card title="Personnel Selection & Dispatch" className="lg:col-span-2" headerAction={
          <button 
            onClick={selectAll}
            className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            {activeTeam && selectedMembers.size === activeTeam.members.length ? <CheckSquare size={16} /> : <Square size={16} />}
            <span>{activeTeam && selectedMembers.size === activeTeam.members.length ? 'Deselect All' : 'Provision for All'}</span>
          </button>
        }>
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="py-4 px-10">Personnel Identification</th>
                  <th className="py-4 px-6">Official Role</th>
                  <th className="py-4 px-10 text-right">Dispatch Selection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {activeTeam?.members.map(member => (
                  <tr 
                    key={member.id} 
                    onClick={() => toggleMember(member.id)}
                    className={`cursor-pointer transition-colors ${selectedMembers.has(member.id) ? 'bg-indigo-50/20' : 'hover:bg-gray-50'}`}
                  >
                    <td className="py-4 px-10">
                      <div className="flex flex-col">
                        <span className={`text-[11px] font-black ${selectedMembers.has(member.id) ? 'text-indigo-700' : 'text-slate-900'}`}>{member.name}</span>
                        <span className="text-[9px] text-indigo-650 font-bold uppercase tracking-tighter">{member.department || 'Other'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${
                        // Fix: Changed comparison from 'Supervisor' to 'Workshop Supervisor'
                        member.role === 'Workshop Supervisor' ? 'bg-purple-600 text-white' : 
                        member.role === 'Assistant Supervisor' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="py-4 px-10 text-right">
                      {selectedMembers.has(member.id) ? (
                        <CheckSquare className="text-indigo-600 ml-auto" size={18} />
                      ) : (
                        <Square className="text-slate-200 ml-auto" size={18} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <Users size={18} className="text-indigo-600" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Target Personnel</p>
                <p className="text-lg font-black text-gray-900 leading-none">{selectedMembers.size}</p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Fiscal Weighted Load</p>
              <p className="text-lg font-black text-indigo-600 leading-none">{(selectedMembers.size * batchHours * otMultiplier).toFixed(1)}h Total</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="p-4 bg-slate-900 rounded-2xl flex items-center space-x-3 shadow-xl shadow-slate-200">
        <AlertCircle className="text-indigo-400" size={16} />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
          <strong>Overtime Policy Legend:</strong> Holiday/Sunday overtime is double (2.0x). Standard Mon-Sat overtime is 1.5x. Dispatch calculations reflect weighted impact.
        </p>
      </div>
    </div>
  );
};

export default OvertimePage;
