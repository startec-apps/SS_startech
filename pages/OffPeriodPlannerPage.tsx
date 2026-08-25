import React, { useState } from 'react';
import { Employee, Team } from '../types';
import { TeamOffPlanner } from '../components/planner/TeamOffPlanner';
import { NightShiftSchedule } from '../components/planner/NightShiftSchedule';
import { WeekendStandbySchedule } from '../components/planner/WeekendStandbySchedule';

interface OffPeriodPlannerPageProps {
  masterEmployees: Employee[];
  teams: Team[];
  currentUser: Employee;
  onUpdateMember: (member: Employee) => Promise<void>;
  isSystemBusy: boolean;
  setSystemBusy: (busy: boolean) => void;
  hasPermission: (module: string, action?: any, subHub?: string) => boolean;
}

const OffPeriodPlannerPage: React.FC<OffPeriodPlannerPageProps> = ({
  masterEmployees = [],
  teams = [],
  currentUser,
}) => {
  const [plannerTab, setPlannerTab] = useState<'teamOff' | 'nightShift' | 'weekendStandby'>('teamOff');

  const isSupervisor = 
    currentUser.accessLevel === 'Admin' || 
    currentUser.accessLevel === 'Manager' || 
    currentUser.accessLevel === 'Supervisor' || 
    currentUser.accessLevel === 'HR' || 
    currentUser.accessLevel === 'Director' ||
    (currentUser.role && currentUser.role.toLowerCase().includes('supervisor')) ||
    (currentUser.role && currentUser.role.toLowerCase().includes('manager'));

  return (
    <div className="space-y-3 animate-in fade-in duration-200 max-w-full pb-6">
      
      {/* Navigation Header / Tab Switcher */}
      <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Off-Period & Shift Planner
        </h2>

        <div className="flex bg-slate-100 p-1 rounded-xl gap-1 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setPlannerTab('teamOff')}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap flex-1 sm:flex-none text-center ${
              plannerTab === 'teamOff'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Team Off Schedule
          </button>
          <button
            onClick={() => setPlannerTab('nightShift')}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap flex-1 sm:flex-none text-center ${
              plannerTab === 'nightShift'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Night Shift Schedule
          </button>
          <button
            onClick={() => setPlannerTab('weekendStandby')}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap flex-1 sm:flex-none text-center ${
              plannerTab === 'weekendStandby'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Weekend Standby Schedule
          </button>
        </div>
      </div>

      {/* TAB 1: TEAM OFF SCHEDULE */}
      {plannerTab === 'teamOff' && (
        <TeamOffPlanner
          masterEmployees={masterEmployees}
          teams={teams}
          isSupervisor={isSupervisor}
        />
      )}

      {/* TAB 2: NIGHT SHIFT SCHEDULE */}
      {plannerTab === 'nightShift' && (
        <NightShiftSchedule
          masterEmployees={masterEmployees}
          isSupervisor={isSupervisor}
        />
      )}

      {/* TAB 3: WEEKEND STANDBY SCHEDULE */}
      {plannerTab === 'weekendStandby' && (
        <WeekendStandbySchedule
          masterEmployees={masterEmployees}
          isSupervisor={isSupervisor}
        />
      )}

    </div>
  );
};

export default OffPeriodPlannerPage;
