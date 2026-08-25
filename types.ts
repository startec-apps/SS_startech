
export enum ShiftType {
  DAY = 'DAY',
  NIGHT = 'NIGHT'
}

export interface Shift {
  id: string;
  name: string;
  type: ShiftType;
  startTime: string;
  endTime: string;
}

export enum DayType {
  STANDARD = 'STANDARD',
  SUNDAY = 'SUNDAY',
  HOLIDAY = 'HOLIDAY'
}

export type StaffStatus = 'Active' | 'Inactive';

export type VisibilityScope = 'SELF' | 'TEAM' | 'ALL';

export type AccessLevel = 
  | 'Admin'
  | 'Manager'
  | 'Supervisor'
  | 'Audit'
  | 'Stores'
  | 'HSSEQ'
  | 'Fleet'
  | 'Staff'
  | 'HR'
  | 'Director'
  | 'Guest';

export interface Employee {
  id: string;
  name: string;
  role: 
    | 'Director'
    | 'Supervisor'
    | 'HR'
    | 'Staff'
    | 'Group Maintenance Manager'
    | 'Lead Manager'
    | 'Workshop Supervisor'
    | 'Quality Controller'
    | 'Operations Manager' 
    | 'Workshop Manager' 
    | 'Driver Manager' 
    | 'Loading Supervisor' 
    | 'Security Personnel' 
    | 'Safety Manager' 
    | 'Stores Supervisor'
    | 'Assistant Supervisor' 
    | 'Member'; 
  department: string;
  section: string;
  teamId: string;
  teamName: string;
  supervisorName: string;
  contractHours: number;
  status: StaffStatus;
  phone?: string;
  gender?: string;
  email?: string;
  hasSystemAccess?: boolean;
  username?: string;
  tempPassword?: string;
  accessLevel?: AccessLevel;
  permissions?: string[];
  visibilityScope?: VisibilityScope;
  offPeriodStart?: string;
  offPeriodEnd?: string;
  offPeriodType?: string;
  dayOverrides?: Record<string, string>;
}

export type ToolCondition = 'Excellent' | 'Good' | 'Fair' | 'Maintenance' | 'Damaged' | 'Lost' | 'Irreparable' | 'Unreturned';
export type AssetClass = 'Pc' | 'Set' | 'Toolbox';
export type WorkshopZone = string;

export interface ToolAsset {
  id: string;
  serialNumber?: string;
  name: string;
  category: string;
  zone: WorkshopZone;
  quantity: number;
  available: number;
  condition: ToolCondition;
  responsibleStaffId?: string;
  monetaryValue: number;
  lastVerified: string;
  submissionDate: string;
  addedBy: string;
  imageUrl?: string;
  assetClass?: AssetClass;
  composition?: string[];
}

export type EscalationStage = 'Store' | 'Supervisor' | 'Manager';

export interface EscalationLogEntry {
  stage: EscalationStage;
  actorName: string;
  action: string;
  timestamp: string;
  notes: string;
}

export interface ToolUsageRecord {
  id: string;
  batchId?: string;
  toolId: string;
  toolName: string;
  quantity: number;
  staffId: string;
  staffName: string;
  shiftType: ShiftType;
  date: string;
  timeOut: string;
  timeIn?: string;
  isReturned: boolean;
  conditionOnReturn?: ToolCondition;
  attendantId: string;
  attendantName: string;
  issuanceType: 'Daily' | 'Section-Held' | 'Outstanding';
  comment?: string;
  recipientSignature?: string;
  escalationStatus?: 'Pending' | 'In-Grace-Period' | 'Resolved' | 'Escalated-to-HR' | 'Manager-Reviewed';
  escalationStage?: EscalationStage;
  graceExpiryDate?: string;
  actionHistory?: EscalationLogEntry[];
  discoveryDate?: string;
  monetaryValue?: number;
  evidenceImage?: string;
  physicalArchiveId?: string;
}

export type MaintenanceStatus = 'Staged' | 'In_Repair' | 'Restored' | 'Decommissioned';

export interface MaintenanceRecord {
  id: string;
  toolId: string;
  toolName: string;
  reportedBy: string;
  reportedDate: string;
  breakdownContext: string;
  isRepairable: boolean | null;
  status: MaintenanceStatus;
  assignedStaffId?: string;
  assignedStaffName?: string;
  resolutionDate?: string;
  technicianNotes?: string;
  estimatedCost?: number;
  isEscalatedToSupervisor?: boolean;
  escalationNotes?: string;
}

export interface PhysicalLogbookRecord {
  id: string;
  date: string;
  shiftType: ShiftType;
  attendantId: string;
  attendantName?: string;
  imageUrls: string[];
  pageNumber?: string;
  notes?: string;
  timestamp: string;
}

export interface Team {
  id: string;
  name: string;
  supervisorId: string;
  assistantSupervisorId: string;
  members: Employee[];
}

export interface AttendanceRecord {
  date: string;
  employeeId: string;
  shiftId: string;
  status: 'Present' | 'Absent';
  overtimeHours: number;
  comment?: string;
  dayType: DayType;
  hoursWorked?: number;
  isApproved?: boolean;
  approvedBy?: string;
  approvedDate?: string;
  startTime?: string;
  endTime?: string;
}

export interface ShiftConfiguration {
  standardHoursPerDay: number;
  standardDaysPerWeek: number;
  rotationIntervalWeeks: number;
  nightToDayTransition: string; 
  dayToNightTransition: string;
  sections: string[]; 
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'alert' | 'success';
  timestamp: Date;
  read: boolean;
}

export interface BulletinAttachment {
  name: string;
  url: string;
}

export interface Bulletin {
  id: string;
  title: string;
  content: string;
  type: string;
  date: string;
  postedBy: string;
  attachments?: BulletinAttachment[];
}

export interface StaffDocument {
  id: string;
  title: string;
  type: string;
  staffId: string;
  status: string;
  isBroadcast: boolean;
  dateUploaded: string;
  fileUrl: string;
  attachments?: BulletinAttachment[];
}

export interface ExternalResource {
  id: string;
  title: string;
  url: string;
  category: 'Payroll' | 'Insurance' | 'Training' | 'Benefits' | 'Other';
}

export type SupportCategory = 'Policy Clarification' | 'Safety Concern' | 'Welfare/Payroll' | 'Whistleblower' | 'Other';

export interface GrievanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  category: SupportCategory;
  subject: string;
  message: string;
  timestamp: string;
  status: 'Pending' | 'Resolved' | 'Closed';
  isAnonymous: boolean;
  response?: string;
  responderName?: string;
  isPublicResponse?: boolean;
}

export interface PerformanceObservation {
  id: string;
  staffId: string;
  observerId: string;
  observerName: string;
  category: string;
  note: string;
  timestamp: string;
  isPositive: boolean;
  isEscalatedToHR: boolean;
  status: 'Pending' | 'Resolved';
}

export type EngagementStatus = 'Submitted' | 'EEC_Review' | 'HR_Pending' | 'Director_Wait' | 'Published';

export interface EngagementInquiry {
  id: string;
  staffId: string;
  subject: string;
  message: string;
  timestamp: string;
  status: EngagementStatus;
  hrAnswer?: string;
  directorAnswer?: string;
  finalGuidance?: string;
  publishedDate?: string;
  isEscalated: boolean;
}
