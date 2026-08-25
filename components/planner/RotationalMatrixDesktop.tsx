import React from 'react';
import { Check } from 'lucide-react';
import { Employee } from '../../types';

interface RotationalMatrixDesktopProps {
  daysArray: number[];
  selectedYear: number;
  selectedMonth: number;
  holidays: Record<string, string>;
  filteredEmployees: Employee[];
  getNormalizedDepartment: (emp: Employee) => string;
  calculateRowSums: (emp: Employee) => { p: number; r: number; s: number; l: number };
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

export const RotationalMatrixDesktop: React.FC<RotationalMatrixDesktopProps> = ({
  daysArray,
  selectedYear,
  selectedMonth,
  holidays,
  filteredEmployees,
  getNormalizedDepartment,
  calculateRowSums,
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
    <div className="hidden lg:block bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
      <table className="w-full border-collapse text-[9.5px] font-mono select-none antialiased">
        <thead>
          <tr className="bg-slate-100 text-slate-800 border-b border-slate-200 h-8 font-extrabold uppercase text-[8px]">
            <th className="w-8 text-center border-r border-slate-200 text-slate-400">#</th>
            <th className="w-36 text-left border-r border-slate-200 pl-3">NAME</th>
            {daysArray.map(d => {
              const wInfo = isWeekendDay(selectedYear, selectedMonth, d);
              const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              const hasHoliday = !!holidays[dateStr];

              let headerStyle = "text-slate-500 hover:bg-slate-50";
              if (hasHoliday) {
                headerStyle = "bg-fuchsia-100 text-fuchsia-800 font-extrabold border-b-2 border-b-fuchsia-400";
              } else if (wInfo.isSunday) {
                headerStyle = "bg-rose-100 text-rose-800 font-extrabold border-b-2 border-b-rose-450";
              } else if (wInfo.isSaturday) {
                headerStyle = "bg-amber-100 text-amber-800 font-extrabold border-b-2 border-b-amber-450";
              }

              return (
                <th 
                  key={d} 
                  className={`border-r border-slate-200 text-center text-[7.5px] py-1 select-none transition-colors duration-150 ${headerStyle}`}
                  title={hasHoliday ? `Public Holiday: ${holidays[dateStr]}` : `${wInfo.dayName} - Day ${d}`}
                >
                  <span className="block text-[8px] font-black leading-none">{d}</span>
                  <span className="block text-[6.5px] uppercase tracking-tighter opacity-80 mt-0.5">{wInfo.dayName}</span>
                </th>
              );
            })}
            <th className="w-10 text-center border-r border-slate-200 text-slate-900 bg-indigo-50/60 font-black" title="Days Present/Work in Month">PRES</th>
            <th className="w-10 text-center border-r border-slate-200 text-rose-600 bg-rose-50/40 font-black" title="Days Rest in Month">REST</th>
            <th className="w-10 text-center border-r border-slate-200 text-amber-600 bg-amber-50/40 font-black" title="Days Sick in Month">SICK</th>
            <th className="w-14 text-center text-indigo-750 bg-indigo-50/60 font-black" title="Days Leave in Month">LEAV</th>
          </tr>
        </thead>
        
        <tbody className="divide-y divide-slate-150">
          {['Operators', 'Technical Team', 'HR Team'].map(dept => {
            const deptEmployees = filteredEmployees.filter(e => getNormalizedDepartment(e) === dept);
            if (deptEmployees.length === 0) return null;

            return (
              <React.Fragment key={dept}>
                <tr className="bg-slate-50 text-slate-700 font-extrabold text-[8.5px] uppercase h-6">
                  <td colSpan={daysArray.length + 6} className="pl-3 font-sans font-bold tracking-wider">
                    {dept}
                  </td>
                </tr>

                {deptEmployees.map((emp, idx) => {
                  const sums = calculateRowSums(emp);

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/50 h-7 border-b border-slate-100 text-slate-800">
                      <td className="text-center font-bold text-slate-400 bg-slate-50/30 border-r border-slate-200">
                        {idx + 1}
                      </td>
                      <td className="pl-3 font-sans font-medium text-slate-900 border-r border-slate-200 truncate max-w-[144px]">
                        {emp.name}
                      </td>

                      {daysArray.map(d => {
                        const status = getDailyStatus(emp, selectedYear, selectedMonth, d);
                        const wInfo = isWeekendDay(selectedYear, selectedMonth, d);
                        const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                        const hasHoliday = !!holidays[dateStr];

                        let fontColor = 'text-slate-450';
                        let displayChar = 'p';

                        if (status === 'R') {
                          fontColor = 'text-sky-600 font-black';
                          displayChar = 'R';
                        } else if (status === 'L') {
                          fontColor = 'text-rose-650 font-black';
                          displayChar = 'L';
                        } else if (status === 'S') {
                          fontColor = 'text-amber-650 font-black';
                          displayChar = 'S';
                        } else if (status === 'H') {
                          fontColor = 'text-fuchsia-700 font-black';
                          displayChar = 'H';
                        }

                        // Set up beautiful high-fidelity labels matching AttendancePage
                        let displayPill = '—';
                        let pillStyle = '';

                        if (status === 'p') {
                          displayPill = `${wInfo.isSaturday ? 4 : 9}h`;
                          pillStyle = 'bg-indigo-50 border border-indigo-150 text-indigo-700 font-bold px-1.5 py-0.5 rounded text-[8px] inline-block';
                        } else if (status === 'R') {
                          displayPill = 'REST';
                          pillStyle = 'text-rose-455 bg-rose-50/25 border border-rose-100/50 px-1 py-0.5 rounded text-[7px] font-black inline-block';
                        } else if (status === 'L') {
                          displayPill = 'OFF';
                          pillStyle = 'bg-rose-50 border border-rose-100 text-rose-700 px-1 py-0.5 rounded text-[7.5px] font-black uppercase tracking-tight inline-block';
                        } else if (status === 'S') {
                          displayPill = 'SICK';
                          pillStyle = 'bg-rose-100 border border-rose-200 text-rose-800 px-1 py-0.5 rounded text-[7.5px] font-bold uppercase tracking-tight inline-block';
                        } else if (status === 'H') {
                          displayPill = 'HOLI';
                          pillStyle = 'text-fuchsia-455 bg-fuchsia-50/25 border border-fuchsia-100/50 px-1 py-0.5 rounded text-[7px] font-black inline-block';
                        }

                        const isHidden = (status === 'p' && !showP) || (status === 'R' && !showR) || (status === 'L' && !showL);
                        if (isHidden) {
                          pillStyle = 'opacity-0 select-none pointer-events-none transition-all duration-150 ';
                        }

                        // High-contrast clean background indicators for weekends and public holidays
                        let cellBg = '';
                        if (hasHoliday) {
                          cellBg = 'bg-fuchsia-50/30 hover:bg-fuchsia-100/40';
                        } else if (wInfo.isSunday) {
                          cellBg = 'bg-rose-50/35 hover:bg-rose-100/45';
                        } else if (wInfo.isSaturday) {
                          cellBg = 'bg-amber-50/35 hover:bg-amber-100/45';
                        }

                        const isPickerOpen = activeCellPicker?.empId === emp.id && activeCellPicker?.day === d;

                        return (
                          <td 
                            key={d} 
                            onClick={() => handleToggleDayStatus(emp, selectedYear, selectedMonth, d)}
                            className={`text-center border-r border-slate-150 h-10 leading-none transition-all select-none relative ${cellBg} ${
                              isSupervisor 
                                ? 'hover:bg-slate-100 cursor-pointer text-[10px]' 
                                : 'cursor-not-allowed opacity-85 text-[9.5px]'
                            } ${fontColor}`}
                            title={
                              hasHoliday 
                                ? `Holiday: ${holidays[dateStr]} (${displayPill})` 
                                : isSupervisor 
                                  ? `Day ${d}: ${displayPill} (Click to set)` 
                                  : `Day ${d}: ${displayPill}`
                            }
                          >
                            <span className={`inline-block transition-transform duration-100 hover:scale-105 ${pillStyle}`}>
                              {displayPill}
                            </span>

                            {/* Absolute dropdown modal for status editing */}
                            {isPickerOpen && isSupervisor && (
                              <>
                                {/* Non-blocking transparent overlay to close picker upon clicking outside */}
                                <div 
                                  className="fixed inset-0 z-40 bg-transparent cursor-default" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveCellPicker(null);
                                  }}
                                />
                                <div 
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute z-50 left-1/2 -translate-x-1/2 top-full mt-1 bg-slate-950 text-white rounded-xl shadow-2xl p-1.5 border border-slate-800 text-left min-w-[128px] pointer-events-auto space-y-0.5 animate-in fade-in zoom-in-95 duration-75"
                                >
                                  <p className="text-[7px] font-black uppercase text-slate-400 px-2.5 py-1 leading-none tracking-widest border-b border-slate-900 pb-1.5 font-sans">
                                    Set day {d}
                                  </p>
                                  {[
                                    { key: 'p', label: 'Present / Work', desc: 'p' },
                                    { key: 'R', label: 'Rest Day', desc: 'R' },
                                    { key: 'L', label: 'On Leave', desc: 'L' },
                                    { key: 'S', label: 'Sick', desc: 'S' },
                                    { key: 'H', label: 'Holiday', desc: 'H' },
                                  ].map(opt => (
                                    <button
                                      key={opt.key}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelectCellStatus(emp, selectedYear, selectedMonth, d, opt.key);
                                      }}
                                      className="w-full text-left text-[8.5px] px-2 py-1.5 rounded-lg font-sans font-bold transition-all uppercase flex justify-between items-center cursor-pointer hover:bg-slate-900 text-slate-100"
                                    >
                                      <span>{opt.label}</span>
                                      {status === opt.key && <Check size={11} className="text-emerald-500 shrink-0" />}
                                    </button>
                                  ))}
                                  
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectCellStatus(emp, selectedYear, selectedMonth, d, 'Auto');
                                    }}
                                    className="w-full text-left font-sans text-[7.5px] px-2 py-1 rounded text-rose-450 hover:bg-rose-950/40 font-bold transition-all uppercase mt-1 border-t border-slate-900 pt-1 cursor-pointer"
                                  >
                                    Restore Auto
                                  </button>
                                </div>
                              </>
                            )}
                          </td>
                        );
                      })}

                      <td className="text-center font-bold border-r border-slate-200 bg-indigo-50/20 text-indigo-950">{sums.p}</td>
                      <td className="text-center font-bold border-r border-slate-200 bg-rose-50/10 text-rose-600">{sums.r}</td>
                      <td className="text-center font-bold border-r border-slate-200 bg-amber-50/10 text-amber-600">{sums.s}</td>
                      <td className="text-center font-black bg-indigo-50/35 text-indigo-700 font-mono">{sums.l}</td>
                    </tr>
                  );
                })}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
