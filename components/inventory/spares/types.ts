import { Employee } from '../../../types';

export interface SpareItem {
  id: string;          // SKU / Part Reference
  name: string;
  category: string;
  location: string;
  receivedDate: string; // Original receipt / stock date
  initialStock: number;
  currentStock: number;
  unitCost: number;
  receivedBy: string;  // Staff ID who managed receipt
  notes?: string;
  partNumber?: string;
  description?: string;
  quantityInStock?: number;
}

export interface SpareReceiptRecord {
  id: string;
  spareId: string;
  spareName: string;
  quantity: number;
  date: string;
  receivedBy: string;
  supplier?: string;
  unitCost?: number;
  partNumber?: string;
  description?: string;
  invoiceNumber?: string;
  notes?: string;
}

export interface SpareIssueRecord {
  id: string;
  spareId: string;
  spareName: string;
  issuedToId: string;
  issuedToName: string;
  quantity: number;
  date: string;
  time: string;
  issuedBy: string;
  purpose: string; // Purpose / Work Order / Comment
  workOrderNumber?: string;
  comments?: string;
}

export interface SparesTabProps {
  masterEmployees: Employee[];
  currentUser: Employee;
  hasPermission: (module: string, action?: any, subHub?: string) => boolean;
}
