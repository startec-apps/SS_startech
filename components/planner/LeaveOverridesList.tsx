import React from 'react';
import { Employee } from '../../types';

interface LeaveOverridesListProps {
  filteredEmployees: Employee[];
  isCurrentlyOffDuty: (emp: Employee) => boolean;
  editingMemberId: string | null;
  setEditingMemberId: (id: string | null) => void;
  getNormalizedDepartment: (emp: Employee) => string;
  isSupervisor: boolean;
  formStart: string;
  setFormStart: (s: string) => void;
  formEnd: string;
  setFormEnd: (e: string) => void;
  formType: string;
  setFormType: (t: string) => void;
  handleClearSchedule: (emp: Employee) => Promise<void>;
  handleSaveSchedule: (emp: Employee) => Promise<void>;
}

export const LeaveOverridesList: React.FC<LeaveOverridesListProps> = ({
  filteredEmployees,
  isCurrentlyOffDuty,
  editingMemberId,
  setEditingMemberId,
  getNormalizedDepartment,
  isSupervisor,
  formStart,
  setFormStart,
  formEnd,
  setFormEnd,
  formType,
  setFormType,
  handleClearSchedule,
  handleSaveSchedule
}) => {
  return (
    <div className="space-y-2">
      {filteredEmployees.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-[10px] font-bold uppercase">
          No matching personnel found
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {filteredEmployees.map((emp) => {
            const isOffNow = isCurrentlyOffDuty(emp);
            const isEditing = editingMemberId === emp.id;
            const normDept = getNormalizedDepartment(emp);

            let statusLabel = "On Active Duty";
            let statusColor = "bg-emerald-50 border-emerald-100 text-emerald-700";
            if (isOffNow) {
              statusLabel = `Off duty: ${emp.offPeriodType || 'Leave'}`;
              statusColor = "bg-amber-50 border-amber-200 text-amber-700";
            } else if (emp.offPeriodStart && emp.offPeriodEnd) {
              statusLabel = `Planned (${emp.offPeriodStart})`;
              statusColor = "bg-sky-50 border-sky-150 text-sky-700";
            }

            return (
              <div key={emp.id} className="py-3.5 first:pt-0 last:pb-0">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-extrabold text-slate-900 uppercase tracking-tight">{emp.name}</span>
                      <span className="text-[8px] font-semibold text-slate-400 font-mono">({emp.id})</span>
                      <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded border ${statusColor}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <p className="text-[8px] font-bold text-slate-400 mt-0.5 uppercase tracking-wide">
                      {normDept} • {emp.role === 'Member' ? 'Staff' : emp.role}
                    </p>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center gap-1.5 self-stretch sm:self-auto justify-end shrink-0">
                    {emp.offPeriodStart && emp.offPeriodEnd && (
                      <div className="text-right hidden md:block mr-2">
                        <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-wider block">Duration</span>
                        <span className="text-[9px] font-bold text-slate-700 font-mono uppercase">{emp.offPeriodStart} to {emp.offPeriodEnd}</span>
                      </div>
                    )}

                    {!isEditing ? (
                      <>
                        {isSupervisor ? (
                          <>
                            <button
                              onClick={() => {
                                setEditingMemberId(emp.id);
                                setFormStart(emp.offPeriodStart || '');
                                setFormEnd(emp.offPeriodEnd || '');
                                setFormType(emp.offPeriodType || 'Annual Leave');
                              }}
                              className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-[8.5px] font-black uppercase tracking-wider hover:border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              Plan Leave
                            </button>

                            {(emp.offPeriodStart || emp.offPeriodEnd) && (
                              <button
                                onClick={() => handleClearSchedule(emp)}
                                className="px-2.5 py-1.5 bg-rose-50 border border-rose-100 hover:border-rose-200 text-rose-600 rounded-lg text-[8.5px] font-black uppercase cursor-pointer"
                              >
                                Clear
                              </button>
                            )}
                          </>
                        ) : (
                          <span className="text-[8px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-2 py-1 rounded-md uppercase tracking-wider">
                            Restricted
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-[8px] font-black text-indigo-700 bg-indigo-50 border border-indigo-150 px-2 py-1 rounded-md uppercase">
                        Form Active
                      </span>
                    )}
                  </div>
                </div>

                {/* Editing scheduler dropdown dropdown container form */}
                {isEditing && (
                  <div className="mt-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 animate-in fade-in slide-in-from-top-1">
                    
                    {/* Sizing: Full Grid 100% responsive without scrolls */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="flex flex-col">
                        <label className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Starts Date</label>
                        <input
                          type="date"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none"
                          value={formStart}
                          onChange={(e) => setFormStart(e.target.value)}
                        />
                      </div>

                      <div className="flex flex-col">
                        <label className="text-[7.5px] font-bold text-slate-350 uppercase tracking-widest mb-1.5 ml-1">Ends Date</label>
                        <input
                          type="date"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none"
                          value={formEnd}
                          onChange={(e) => setFormEnd(e.target.value)}
                        />
                      </div>

                      <div className="flex flex-col">
                        <label className="text-[7.5px] font-bold text-slate-350 uppercase tracking-widest mb-1.5 ml-1">Type Classification</label>
                        <select
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-750 outline-none cursor-pointer"
                          value={formType}
                          onChange={(e) => setFormType(e.target.value)}
                        >
                          <option value="Annual Leave">Annual Leave</option>
                          <option value="Sick Leave">Sick Leave</option>
                          <option value="Rest Day / Off">Rest Day / Off</option>
                          <option value="Emergency Leave">Emergency Leave</option>
                          <option value="Study Break">Study Break</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => setEditingMemberId(null)}
                        className="px-3 py-1.5 text-[8.5px] font-bold uppercase text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        Discard
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveSchedule(emp)}
                        className="px-4 py-1.5 text-[8.5px] font-black uppercase text-white bg-slate-900 hover:bg-slate-950 rounded-lg shadow-sm cursor-pointer"
                      >
                        Save constraints
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
