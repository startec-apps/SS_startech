import React from 'react';
import { Award, Trash2, Plus } from 'lucide-react';

interface HolidaysPanelProps {
  holidays: Record<string, string>;
  setHolidays: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  selectedYear: number;
  selectedMonth: number;
  setSelectedYear: (y: number) => void;
  setSelectedMonth: (m: number) => void;
  isSupervisor: boolean;
  monthNames: string[];
  newHolidayDate: string;
  setNewHolidayDate: (d: string) => void;
  newHolidayName: string;
  setNewHolidayName: (n: string) => void;
}

export const HolidaysPanel: React.FC<HolidaysPanelProps> = ({
  holidays,
  setHolidays,
  selectedYear,
  selectedMonth,
  setSelectedYear,
  setSelectedMonth,
  isSupervisor,
  monthNames,
  newHolidayDate,
  setNewHolidayDate,
  newHolidayName,
  setNewHolidayName
}) => {
  return (
    <div className="mt-4 p-4 bg-fuchsia-50/50 border border-fuchsia-100 rounded-2xl animate-in slide-in-from-top-2 duration-155 space-y-3">
      <div className="flex items-center justify-between border-b border-fuchsia-100 pb-2">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded bg-fuchsia-100 text-fuchsia-700">
            <Award size={13} />
          </span>
          <h4 className="text-[10px] font-black uppercase text-fuchsia-900 tracking-wider">Institution Public Holidays & Shutdowns</h4>
        </div>
        <span className="text-[8px] font-bold uppercase text-fuchsia-500">Active for Calendar overrides</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column: Registered Holidays for the CURRENT SELECTED MONTH */}
        <div className="space-y-2">
          <p className="text-[9px] font-extrabold text-slate-500 uppercase">
            Holidays in {monthNames[selectedMonth]} {selectedYear}
          </p>
          {(() => {
            const monthPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
            const activeInMonth = Object.entries(holidays).filter(([date]) => date.startsWith(monthPrefix));

            if (activeInMonth.length === 0) {
              return (
                <div className="p-4 rounded-xl bg-white border border-dashed border-slate-200 text-center text-slate-400 text-[9px] uppercase font-bold">
                  No registered holidays for this month selector scope
                </div>
              );
            }

            return (
              <div className="divide-y divide-slate-100 bg-white border border-slate-200 rounded-xl max-h-[160px] overflow-y-auto">
                {activeInMonth.map(([date, name]) => (
                  <div key={date} className="flex items-center justify-between px-3 py-2 text-[10px] text-slate-700">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[9px] font-black bg-fuchsia-50 text-fuchsia-700 px-1 py-0.5 rounded">
                        {date.split('-')[2]}
                      </span>
                      <span className="font-bold truncate" title={name}>{name}</span>
                    </div>
                    {isSupervisor && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Remove holiday "${name}"?`)) {
                            const updated = { ...holidays };
                            delete updated[date];
                            setHolidays(updated);
                          }
                        }}
                        className="text-slate-400 hover:text-red-600 p-1 rounded-md transition-colors cursor-pointer"
                        title="Delete Holiday"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Right Column: Add New Holiday Form (For Supervisor role) */}
        <div className="space-y-2">
          <p className="text-[9px] font-extrabold text-slate-500 uppercase">Add Holiday Entry</p>
          {isSupervisor ? (
            <div className="bg-white border border-slate-200 p-3 rounded-xl space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[7.5px] font-bold text-slate-450 uppercase block mb-1">Date</label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 border border-slate-205 focus:border-slate-350 p-1.5 rounded-lg text-xs font-bold outline-none text-slate-700"
                    value={newHolidayDate}
                    onChange={(e) => setNewHolidayDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[7.5px] font-bold text-slate-450 uppercase block mb-1">Holiday Label</label>
                  <input
                    type="text"
                    placeholder="e.g. Youth Day"
                    className="w-full bg-slate-50 border border-slate-205 focus:border-slate-350 p-1.5 rounded-lg text-xs font-bold outline-none text-slate-700 placeholder:text-slate-300"
                    value={newHolidayName}
                    onChange={(e) => setNewHolidayName(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (!newHolidayDate || !newHolidayName.trim()) {
                      alert("Please select a date and enter a holiday name.");
                      return;
                    }
                    const updated = {
                      ...holidays,
                      [newHolidayDate]: newHolidayName.trim()
                    };
                    setHolidays(updated);
                    setNewHolidayName('');
                    const parsedYear = parseInt(newHolidayDate.split('-')[0]);
                    const parsedMonth = parseInt(newHolidayDate.split('-')[1]) - 1;
                    if (parsedYear && !isNaN(parsedMonth)) {
                      setSelectedYear(parsedYear);
                      setSelectedMonth(parsedMonth);
                    }
                  }}
                  className="bg-fuchsia-900 border border-fuchsia-950 text-white font-black uppercase text-[8.5px] tracking-wider px-3 py-1.5 rounded-lg hover:bg-fuchsia-950 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={11} />
                  Add Holiday
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-[9px] text-slate-450 uppercase font-black bg-slate-50 rounded-xl border border-dashed tracking-wider">
              Read Only • Restricted to Supervisors
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
