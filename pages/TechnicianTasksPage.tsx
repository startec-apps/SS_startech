import React from 'react';
import { Employee, ToolAsset } from '../types';
import { TechnicianTasksTab } from '../components/inventory/TechnicianTasksTab';

interface TechnicianTasksPageProps {
  masterEmployees: Employee[];
  currentUser: Employee;
  hasPermission: (module: string, action?: any, subHub?: string) => boolean;
  inventoryTools?: ToolAsset[];
  onUpdateTools?: (tools: ToolAsset[]) => void;
  onSyncAttendance?: (records: any[]) => void;
}

const TechnicianTasksPage: React.FC<TechnicianTasksPageProps> = ({
  masterEmployees,
  currentUser,
  hasPermission,
  inventoryTools = [],
  onUpdateTools,
  onSyncAttendance
}) => {
  return (
    <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-xs">
      <TechnicianTasksTab 
        masterEmployees={masterEmployees}
        currentUser={currentUser}
        hasPermission={hasPermission}
        inventoryTools={inventoryTools}
        onUpdateTools={onUpdateTools}
        onSyncAttendance={onSyncAttendance}
      />
    </div>
  );
};

export default TechnicianTasksPage;
