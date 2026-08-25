import React from 'react';
import { Check } from 'lucide-react';
import { Employee } from '../../types';

interface RotationalMatrixMobileProps {
  filteredEmployees: Employee[];
  activePreviewMemberId: string | null;
  setSelectedPreviewMemberId: (id: string | null) => void;
  getNormalizedDepartment: (emp: Employee) => string;
  calculateRowSums: (emp: Employee) => { p: number; r: number; s: number; l: number };
  activePreviewMember: Employee | null;
  selectedYear: number;
  selectedMonth: number;
  daysArray: number[];
  holidays: Record<string, string>;
  getDailyStatus: (emp: Employee, year: number, month: number, day: number) => string;
  isWeekendDay: (year: number, month: number, day: number) => { isWeekend: boolean, isSunday: boolean, isSaturday: boolean, dayName: string };
  activeCellPicker: { empId: string; day: number } | null;
  setActiveCellPicker: (state: { empId: string; day: number } | null) => void;
  isSupervisor: boolean;
  handleToggleDayStatus: (emp: Employee, year: number, month: number, day: number) => Promise<void>;
  handleSelectCellStatus: (emp: Employee, year: number, month: number, day: number, status: string) => Promise<void>;
  showP?: boolean;
  showR?: boolean;
  showL?: boolean;
}

export const RotationalMatrixMobile: React.FC<RotationalMatrixMobileProps> = ({
  filteredEmployees,
  activePreviewMemberId,
  setSelectedPreviewMemberId,
  getNormalizedDepartment,
  calculateRowSums,
  activePreviewMember,
  selectedYear,
  selectedMonth,
  daysArray,
  holidays,
  getDailyStatus,
  isWeekendDay,
  activeCellPicker,
  setActiveCellPicker,
  isSupervisor,
  handleToggleDayStatus,
  handleSelectCellStatus,
  showP = true,
  showR = true,
  showL = true
}) => {
  return (
    <div className="block lg:hidden space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        
        {/* Left Column: Personnel Card List */}
        <div className="space-y-2 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Personnel Roster List</p>
          {filteredEmployees.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-[10px] font-bold uppercase transition-all">No personnel matched</div>
          ) : (
            <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
              {filteredEmployees.map((emp) => {
                const sums = calculateRowSums(emp);
                const isSelected = activePreviewMemberId === emp.id;
                const normDept = getNormalizedDepartment(emp);

                return (
                  <div
                    key={emp.id}
                    onClick={() => setSelectedPreviewMemberId(emp.id)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                      isSelected 
                        ? 'bg-slate-900 border-slate-950 text-white' 
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200/60 text-slate-800'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase leading-none truncate">{emp.name}</p>
                      <p className={`text-[7px] font-bold uppercase mt-1 ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>{normDept}</p>
                    </div>
                    <div className="flex items-center space-x-1.5 font-mono text-[8px] font-black pl-3 shrink-0">
                      <span className="bg-slate-200/80 text-slate-700 px-1.5 py-0.5 rounded text-[7.5px]">P:{sums.p}</span>
                      <span className="bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded text-[7.5px]">R:{sums.r}</span>
                      <span className="bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded text-[7.5px]">L:{sums.l}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Mini Wrapped Calendar View (Zero scrolling!) */}
        <div className="bg-slate-900 text-slate-100 p-4 rounded-3xl border border-slate-800 shadow-sm space-y-3">
          {activePreviewMember ? (
            <>
              <div className="border-b border-slate-800 pb-2">
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest text-emerald-400">Crew Member Calendar Preview</p>
                <h4 className="text-xs font-black uppercase text-white mt-1">{activePreviewMember.name}</h4>
                <p className="text-[8px] text-slate-400 font-semibold uppercase mt-0.5">{getNormalizedDepartment(activePreviewMember)}</p>
              </div>

              {/* Simple Status Legend */}
              <div className="flex flex-wrap gap-x-2 gap-y-1 items-center bg-slate-850 p-2 rounded-xl text-[8px] font-bold uppercase text-slate-350">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>Work</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>Rest</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Sick</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>Off</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500"></span>Holiday</span>
              </div>

              {/* 7-column calendar cells layout (NO SCROLLS!) */}
              <div className="grid grid-cols-7 gap-1 font-mono text-center col-span-7">
                {/* Standard Days Sunday - Saturday headers with specific colorings */}
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((dayTitle, idx) => {
                  let headerColor = "text-slate-550";
                  if (idx === 0) headerColor = "text-rose-400 font-bold";
                  else if (idx === 6) headerColor = "text-amber-450 font-bold";
                  return (
                    <div key={dayTitle} className={`text-[7.5px] uppercase py-0.5 ${headerColor}`}>{dayTitle}</div>
                  );
                })}

                {/* Align Month calendar start using padding days */}
                {Array.from({ length: new Date(selectedYear, selectedMonth, 1).getDay() }).map((_, emptyIdx) => (
                  <div key={`empty-${emptyIdx}`} className="aspect-square"></div>
                ))}

                 {daysArray.map(dayNum => {
                  const status = getDailyStatus(activePreviewMember, selectedYear, selectedMonth, dayNum);
                  const wInfo = isWeekendDay(selectedYear, selectedMonth, dayNum);
                  const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const hasHoliday = !!holidays[dateStr];

                  const isHidden = (status === 'p' && !showP) || (status === 'R' && !showR) || (status === 'L' && !showL);

                  let bgClass = 'bg-slate-800 text-slate-350';
                  if (!isHidden) {
                    if (status === 'R') bgClass = 'bg-sky-500 text-white font-extrabold';
                    else if (status === 'L') bgClass = 'bg-rose-650 text-white font-extrabold';
                    else if (status === 'S') bgClass = 'bg-amber-500 text-white font-extrabold';
                    else if (status === 'H') bgClass = 'bg-fuchsia-600 text-white font-extrabold';
                    else if (status === 'p') {
                      bgClass = 'bg-slate-800 text-slate-350';
                      if (hasHoliday) bgClass = 'bg-fuchsia-950/40 text-fuchsia-400 border border-fuchsia-800';
                      else if (wInfo.isSunday) bgClass = 'bg-rose-950/40 text-rose-450';
                      else if (wInfo.isSaturday) bgClass = 'bg-amber-950/40 text-amber-450';
                    }
                  } else {
                    bgClass = 'bg-slate-850/40 text-slate-550 border border-slate-800/20';
                  }

                  const isPickerOpen = activeCellPicker?.empId === activePreviewMember.id && activeCellPicker?.day === dayNum;

                  return (
                    <div 
                      key={dayNum} 
                      onClick={() => handleToggleDayStatus(activePreviewMember, selectedYear, selectedMonth, dayNum)}
                      className={`aspect-square flex flex-col justify-center items-center text-[9px] rounded-md transition-all select-none relative ${
                        isSupervisor 
                          ? 'hover:scale-105 active:scale-95 cursor-pointer bg-opacity-95' 
                          : 'cursor-not-allowed opacity-85'
                      } ${bgClass}`}
                      title={
                        hasHoliday 
                          ? `Holiday: ${holidays[dateStr]} (${status})` 
                          : isSupervisor 
                            ? `Click to set status (day ${dayNum})` 
                            : `Day ${dayNum} status`
                      }
                    >
                      <span className={isHidden ? 'opacity-40 text-[7px]' : ''}>{dayNum}</span>
                      {!isHidden && (
                        <span className="text-[6.5px] opacity-90 font-sans uppercase font-black tracking-tighter">{status}</span>
                      )}

                      {/* Absolute dropdown for status editing on mobile calendar view */}
                      {isPickerOpen && isSupervisor && (
                        <>
                          <div 
                            className="fixed inset-0 z-40 bg-transparent cursor-default" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveCellPicker(null);
                            }}
                          />
                          <div 
                            onClick={(e) => e.stopPropagation()}
                            className="absolute z-50 left-1/2 -translate-x-1/2 top-full mt-1 bg-slate-950 text-white rounded-xl shadow-2xl p-1 border border-slate-800 text-left min-w-[124px] pointer-events-auto space-y-0.5"
                          >
                            <p className="text-[7px] font-black uppercase text-slate-400 px-2.5 py-1 leading-none tracking-widest border-b border-slate-900 pb-1.5 font-sans">
                              Set Status
                            </p>
                            {[
                              { key: 'p', label: 'Present', desc: 'p' },
                              { key: 'R', label: 'Rest Day (R)', desc: 'R' },
                              { key: 'L', label: 'On Leave (L)', desc: 'L' },
                              { key: 'S', label: 'Sick (S)', desc: 'S' },
                              { key: 'H', label: 'Holiday (H)', desc: 'H' },
                            ].map(opt => (
                              <button
                                key={opt.key}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectCellStatus(activePreviewMember, selectedYear, selectedMonth, dayNum, opt.key);
                                }}
                                className="w-full text-left text-[8px] px-2 py-1.5 rounded font-sans font-bold transition-all uppercase flex justify-between items-center cursor-pointer hover:bg-slate-900 text-slate-100"
                              >
                                <span>{opt.label}</span>
                                {status === opt.key && <Check size={10} className="text-emerald-500 shrink-0" />}
                              </button>
                            ))}
                            
                            <button
                              type="button"
                              onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectCellStatus(activePreviewMember, selectedYear, selectedMonth, dayNum, 'Auto');
                              }}
                              className="w-full text-left font-sans text-[7.5px] px-2 py-1 rounded text-rose-450 hover:bg-rose-950/40 font-bold transition-all uppercase mt-1 border-t border-slate-900 pt-1 cursor-pointer"
                            >
                              Restore Auto
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="py-24 text-center text-[10px] text-slate-400 font-bold uppercase font-sans">Select a personnel card above to preview calendar</div>
          )}
        </div>

      </div>
    </div>
  );
};
