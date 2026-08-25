
import React, { useState, useEffect } from 'react';
import { X, RotateCcw, ShieldAlert, RefreshCw, Lock, Edit2, ArrowRight, Clock, ShieldCheck, Sun, Moon, Info, CalendarClock } from 'lucide-react';
import { Shift, Team, ShiftType } from '../types';

export const LogoutModal: React.FC<{ onConfirm: () => void; onCancel: () => void }> = ({ onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onCancel}></div>
    <div className="relative bg-white w-full max-w-sm rounded-[1.5rem] shadow-2xl p-6 text-center animate-in zoom-in-95">
      <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500 mx-auto mb-4"><ShieldAlert size={24} /></div>
      <h3 className="text-base font-black text-slate-900 uppercase tracking-tight mb-1">Logout?</h3>
      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Ending active operational session.</p>
      <div className="grid grid-cols-2 gap-3 mt-6">
        <button onClick={onCancel} className="py-3 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-100">Cancel</button>
        <button onClick={onConfirm} className="py-3 bg-rose-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-rose-100 hover:bg-rose-700">Logout</button>
      </div>
    </div>
  </div>
);

export const RotationModal: React.FC<{
  shifts: Shift[];
  teams: Team[];
  mode: 'standard' | 'maintain' | 'manual';
  setMode: (m: 'standard' | 'maintain' | 'manual') => void;
  onConfirm: (assignments: string[]) => void;
  onCancel: () => void;
}> = ({ shifts, teams, mode, setMode, onConfirm, onCancel }) => {
  const [tempAssignments, setTempAssignments] = useState<string[]>([]);

  useEffect(() => {
    if (mode === 'standard') {
      const ids = [...teams.map(t => t.id)];
      const last = ids.pop()!;
      ids.unshift(last);
      setTempAssignments(ids);
    } else {
      setTempAssignments(teams.map(t => t.id));
    }
  }, [mode, teams]);

  const getTransitionStatus = (teamId: string, targetShift: Shift) => {
    const currentIndex = teams.findIndex(t => t.id === teamId);
    const currentShift = shifts[currentIndex];
    
    if (!currentShift) return null;
    if (currentShift.type === targetShift.type) {
      return { 
        label: `MAINTAINING ${targetShift.type}`, 
        color: 'text-slate-400 bg-slate-50 border-slate-100',
        icon: <Clock size={10} />,
        note: `No phase change required.`
      };
    }

    if (targetShift.type === ShiftType.DAY) {
      return { 
        label: 'SWITCH TO DAY', 
        color: 'text-orange-600 bg-orange-50 border-orange-100',
        icon: <Sun size={10} />,
        note: 'Night ends 05:00. Resumes Day 07:30 (48h Rest).',
        warning: '48h Rest'
      };
    }

    return { 
      label: 'SWITCH TO NIGHT', 
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
      icon: <Moon size={10} />,
      note: 'Day ends 16:30. Resumes Night next cycle at 20:00.',
    };
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onCancel}></div>
      <div className="relative bg-white w-full max-w-md rounded-[1.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/30 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white"><RotateCcw size={14} /></div>
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Cycle Protocol</h3>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Transition Control</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-1 text-slate-300 hover:text-slate-900"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto no-scrollbar">
          <div className="flex p-1 bg-slate-100 rounded-xl space-x-1 shadow-inner">
            {[
              { id: 'standard', icon: <RefreshCw size={10} />, label: 'Auto' },
              { id: 'maintain', icon: <Lock size={10} />, label: 'Stay' },
              { id: 'manual', icon: <Edit2 size={10} />, label: 'Map' }
            ].map((m) => (
              <button 
                key={m.id} 
                onClick={() => setMode(m.id as any)} 
                className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${mode === m.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-400'}`}
              >
                {m.icon}
                <span>{m.label}</span>
              </button>
            ))}
          </div>

          <div className="space-y-2.5">
            {shifts.map((shift, idx) => {
              const targetTeamId = tempAssignments[idx];
              const targetTeam = teams.find(t => t.id === targetTeamId);
              const transition = targetTeam ? getTransitionStatus(targetTeamId, shift) : null;

              return (
                <div key={shift.id} className="relative flex flex-col p-3.5 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${shift.type === ShiftType.DAY ? 'bg-orange-50 text-orange-600' : 'bg-slate-900 text-white'}`}>
                        {shift.type === ShiftType.DAY ? <Sun size={14} /> : <Moon size={14} />}
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none mb-0.5">{shift.name}</p>
                        <p className="text-[11px] font-black text-slate-900 uppercase">{shift.type} OPS</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <ArrowRight className="text-slate-200" size={14} />
                      <div className="text-right">
                        {mode === 'manual' ? (
                          <select 
                            className="bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-[9px] font-black text-indigo-600" 
                            value={tempAssignments[idx]} 
                            onChange={e => {
                              const next = [...tempAssignments];
                              next[idx] = e.target.value;
                              setTempAssignments(next);
                            }}
                          >
                            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                        ) : (
                          <div className="flex flex-col items-end">
                            <p className="text-[11px] font-black text-indigo-600 uppercase leading-none">{targetTeam?.name || '---'}</p>
                            <p className="text-[7px] font-bold text-slate-300 uppercase mt-0.5">Assigned</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {transition && (
                    <div className={`mt-2.5 flex flex-col space-y-1 px-2.5 py-1.5 rounded-lg border transition-all ${transition.color}`}>
                       <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1.5">
                             {transition.icon}
                             <span className="text-[8px] font-black uppercase tracking-wider">{transition.label}</span>
                          </div>
                          {transition.warning && (
                            <span className="text-[7px] font-black px-1.5 py-0.5 bg-white/50 rounded-md uppercase tracking-tighter border border-current/10">
                               {transition.warning}
                            </span>
                          )}
                       </div>
                       <p className="text-[7px] font-bold uppercase tracking-widest opacity-80 leading-relaxed flex items-center">
                          <CalendarClock size={9} className="mr-1.5" />
                          {transition.note}
                       </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-slate-50 space-y-4 bg-slate-50/30 flex-shrink-0">
          <div className="flex items-start space-x-2.5 p-3 bg-white border border-slate-100 rounded-xl">
             <Info size={12} className="text-indigo-400 mt-0.5" />
             <p className="text-[8px] font-bold text-slate-500 leading-normal uppercase tracking-widest">
                Protocol: Day-to-Night resumes next cycle @ 20:00. Night-to-Day triggers 48h rest period.
             </p>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-emerald-600">
              <ShieldCheck size={12} />
              <span className="text-[8px] font-black uppercase tracking-widest">Ready</span>
            </div>
            <button 
              onClick={() => onConfirm(tempAssignments)} 
              className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all active:scale-95"
            >
              Execute Cycle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
