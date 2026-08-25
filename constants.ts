
import { Shift, ShiftType, ShiftConfiguration, Employee, Team, AccessLevel, VisibilityScope } from './types';

export const POSITION_MAPPING: Record<string, string> = {
  'Operations Manager': 'Management',
  'Workshop Manager': 'Workshop',
  'Workshop Supervisor': 'Workshop',
  'Safety Manager': 'HSE & Compliance',
  'Driver Manager': 'Transport',
  'Loading Supervisor': 'Logistics',
  'Stores Supervisor': 'Inventory',
  'Security Personnel': 'Security',
  'Electrician': 'Electrical',
  'Senior Mechanic': 'Mechanical',
  'Junior Mechanic': 'Mechanical',
  'Intern Mechanic': 'Mechanical',
  'Welders': 'Fabrication',
  'Tools Attendant': 'Logistics',
  'Auto body Mechanic': 'Bodywork',
  'Stores': 'Inventory',
  'General': 'Operations'
};

export const DEFAULT_SECTIONS = Object.keys(POSITION_MAPPING);

export const INITIAL_SHIFTS: Shift[] = [
  { id: 's1', name: 'Day Shift (07:00 - 17:00)', type: ShiftType.DAY, startTime: '07:00', endTime: '17:00' },
  { id: 's2', name: 'Night Shift (19:00 - 07:00)', type: ShiftType.NIGHT, startTime: '19:00', endTime: '07:00' },
];

export const INITIAL_CONFIG: ShiftConfiguration = {
  standardHoursPerDay: 8,
  standardDaysPerWeek: 6,
  rotationIntervalWeeks: 1,
  nightToDayTransition: 'Saturday 05:00 to Monday 07:30',
  dayToNightTransition: '1 Full Day Off (Sunday)',
  sections: DEFAULT_SECTIONS
};

export const MOCK_EMPLOYEES: Employee[] = [];

export const INITIAL_TEAMS: Team[] = [
  { id: 't1', name: 'Shift A', supervisorId: '', assistantSupervisorId: '', members: [] },
  { id: 't2', name: 'Shift B', supervisorId: '', assistantSupervisorId: '', members: [] },
  { id: 't3', name: 'Shift C', supervisorId: '', assistantSupervisorId: '', members: [] },
];

export const INSTITUTIONAL_PERMISSIONS_SCHEMA: Record<AccessLevel, { permissions: string[], scope: VisibilityScope }> = {
  'Admin': {
    scope: 'ALL',
    permissions: [
      'dashboard_view', 'dashboard_create', 'dashboard_update', 'dashboard_delete',
      'registry_view', 'registry_create', 'registry_update', 'registry_delete',
      'shifts_view', 'shifts_create', 'shifts_update', 'shifts_delete',
      'shifts_attendance_view', 'shifts_attendance_create', 'shifts_attendance_update', 'shifts_attendance_delete',
      'shifts_teams_view', 'shifts_teams_create', 'shifts_teams_update', 'shifts_teams_delete',
      'shifts_history_view', 'shifts_history_delete',
      'inventory_view', 'inventory_create', 'inventory_update', 'inventory_delete',
      'inventory_master_view', 'inventory_master_create', 'inventory_master_update', 'inventory_master_delete',
      'inventory_sectional_view', 'inventory_sectional_create', 'inventory_sectional_update', 'inventory_sectional_delete',
      'inventory_archives_view', 'inventory_archives_create', 'inventory_archives_update', 'inventory_archives_delete',
      'inventory_audit_view', 'inventory_audit_create', 'inventory_audit_update', 'inventory_audit_delete',
      'inventory_maintenance_view', 'inventory_maintenance_create', 'inventory_maintenance_update', 'inventory_maintenance_delete',
      'managerial_view', 'managerial_snapshot_view', 'managerial_audit_view', 'managerial_resolution_view',
      'settings_view', 'settings_create', 'settings_update', 'settings_delete'
    ]
  },
  'Manager': {
    scope: 'ALL',
    permissions: [
      'dashboard_view',
      'registry_view', 'registry_update',
      'shifts_view', 'shifts_attendance_view', 'shifts_attendance_create', 'shifts_teams_view', 'shifts_history_view',
      'inventory_view', 'inventory_master_view', 'inventory_sectional_view', 'inventory_archives_view', 'inventory_audit_view', 'inventory_maintenance_view', 'inventory_maintenance_update',
      'managerial_view', 'managerial_snapshot_view', 'managerial_audit_view', 'managerial_resolution_view'
    ]
  },
  'Supervisor': {
    scope: 'ALL',
    permissions: [
      'dashboard_view',
      'registry_view', 'registry_create', 'registry_update', 'registry_delete',
      'shifts_view', 'shifts_attendance_view', 'shifts_attendance_create', 'shifts_teams_view', 'shifts_history_view',
      'inventory_view', 'inventory_sectional_view', 'inventory_sectional_create', 'inventory_sectional_update', 
      'inventory_maintenance_view', 'inventory_maintenance_update',
      'managerial_view', 'managerial_resolution_view'
    ]
  },
  'Stores': {
    scope: 'ALL',
    permissions: [
      'inventory_view', 'inventory_update', 'inventory_master_view', 'inventory_master_create', 'inventory_master_update', 
      'inventory_sectional_view', 'inventory_sectional_create', 'inventory_sectional_update',
      'inventory_archives_view', 'inventory_archives_create', 
      'inventory_maintenance_view', 'inventory_maintenance_create', 'inventory_maintenance_update'
    ]
  },
  'Audit': {
    scope: 'ALL',
    permissions: [
      'dashboard_view',
      'registry_view', 'shifts_view', 'shifts_history_view',
      'inventory_view', 'inventory_master_view', 'inventory_archives_view', 'inventory_audit_view', 'inventory_maintenance_view',
      'managerial_view', 'managerial_audit_view'
    ]
  },
  'HR': {
    scope: 'ALL',
    permissions: [
      'dashboard_view',
      'registry_view', 'registry_update', 'registry_create',
      'managerial_view', 'managerial_audit_view', 'managerial_resolution_view'
    ]
  },
  'HSSEQ': {
    scope: 'ALL',
    permissions: [
      'dashboard_view',
      'managerial_view', 'managerial_audit_view'
    ]
  },
  'Fleet': {
    scope: 'ALL',
    permissions: [
      'shifts_view', 'shifts_teams_view', 'shifts_history_view'
    ]
  },
  'Staff': {
    scope: 'SELF',
    permissions: [
       'dashboard_view',
       'shifts_view',
       'inventory_view', 'inventory_sectional_view'
    ]
  },
  'Director': {
    scope: 'ALL',
    permissions: [
      'dashboard_view', 'dashboard_create', 'dashboard_update', 'dashboard_delete',
      'registry_view', 'registry_create', 'registry_update', 'registry_delete',
      'shifts_view', 'shifts_create', 'shifts_update', 'shifts_delete',
      'shifts_attendance_view', 'shifts_attendance_create', 'shifts_attendance_update', 'shifts_attendance_delete',
      'shifts_teams_view', 'shifts_teams_create', 'shifts_teams_update', 'shifts_teams_delete',
      'shifts_history_view', 'shifts_history_delete',
      'inventory_view', 'inventory_create', 'inventory_update', 'inventory_delete',
      'inventory_master_view', 'inventory_master_create', 'inventory_master_update', 'inventory_master_delete',
      'inventory_sectional_view', 'inventory_sectional_create', 'inventory_sectional_update', 'inventory_sectional_delete',
      'inventory_archives_view', 'inventory_archives_create', 'inventory_archives_update', 'inventory_archives_delete',
      'inventory_audit_view', 'inventory_audit_create', 'inventory_audit_update', 'inventory_audit_delete',
      'inventory_maintenance_view', 'inventory_maintenance_create', 'inventory_maintenance_update', 'inventory_maintenance_delete',
      'managerial_view', 'managerial_snapshot_view', 'managerial_audit_view', 'managerial_resolution_view',
      'settings_view', 'settings_create', 'settings_update', 'settings_delete'
    ]
  },
  'Guest': {
    scope: 'SELF',
    permissions: [
       'dashboard_view',
       'shifts_view',
       'inventory_view'
    ]
  }
};
