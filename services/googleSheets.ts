import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut as firebaseSignOut 
} from "firebase/auth";
import firebaseAppletConfig from "../firebase-applet-config.json";
import { 
  Employee, 
  ToolAsset, 
  AttendanceRecord, 
  MaintenanceRecord, 
  Bulletin, 
  StaffDocument, 
  ExternalResource, 
  PerformanceObservation, 
  GrievanceRecord, 
  EngagementInquiry 
} from "../types";

const env = (import.meta as any).env || {};
export const DEFAULT_SCRIPT_URL = import.meta.env.VITE_SCRIPT_URL || "";

export const firebaseConfig = {
  apiKey: firebaseAppletConfig.apiKey || env.VITE_FIREBASE_API_KEY,
  authDomain: firebaseAppletConfig.authDomain || env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: firebaseAppletConfig.projectId || env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: firebaseAppletConfig.storageBucket || env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: firebaseAppletConfig.messagingSenderId || env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: firebaseAppletConfig.appId || env.VITE_FIREBASE_APP_ID,
  measurementId: firebaseAppletConfig.measurementId || env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase App for Google Authentication / OAuth token acquisition
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Configure Google OAuth Provider with Google Sheets & Google Drive scopes
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("https://www.googleapis.com/auth/spreadsheets");
googleProvider.addScope("https://www.googleapis.com/auth/drive.file");
googleProvider.setCustomParameters({ prompt: 'select_account' });

// In-Memory Cached Access Token
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const setAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  if (token) {
    sessionStorage.setItem("STARTECH_GOOGLE_ACCESS_TOKEN", token);
  } else {
    sessionStorage.removeItem("STARTECH_GOOGLE_ACCESS_TOKEN");
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken) return cachedAccessToken;
  const saved = sessionStorage.getItem("STARTECH_GOOGLE_ACCESS_TOKEN") || sessionStorage.getItem("STARTEC_GOOGLE_ACCESS_TOKEN");
  if (saved) {
    cachedAccessToken = saved;
    return saved;
  }
  return null;
};

// Listen to auth state
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const token = await getAccessToken();
      if (token && onAuthSuccess) {
        onAuthSuccess(user, token);
      } else if (!isSigningIn && onAuthFailure) {
        onAuthFailure();
      }
    } else {
      setAccessToken(null);
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Google Sign-In with Popup
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to obtain OAuth access token from Google Sign-In.");
    }
    const token = credential.accessToken;
    setAccessToken(token);
    return { user: result.user, accessToken: token };
  } catch (error: any) {
    console.error("Google Sign-In Error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const logoutGoogle = async () => {
  setAccessToken(null);
  await firebaseSignOut(auth);
};

// =========================================================================
// SPREADSHEET SCHEMA & METADATA CONFIGURATION
// =========================================================================
export const SPREADSHEET_TITLE = "Startech Hub - Site Operations & Resource Management";
const SPREADSHEET_ID_KEY = "STARTECH_GOOGLE_SHEETS_SPREADSHEET_ID";
const SPREADSHEET_TITLE_KEY = "STARTECH_GOOGLE_SHEETS_SPREADSHEET_TITLE";

const APPS_SCRIPT_URL_KEY = "STARTECH_GOOGLE_APPS_SCRIPT_URL";

export interface SheetTabDefinition {
  title: string;
  headers: string[];
}

export const getStoredAppsScriptUrl = (): string | null => {
  return localStorage.getItem(APPS_SCRIPT_URL_KEY) || localStorage.getItem("STARTEC_GOOGLE_APPS_SCRIPT_URL") || env.VITE_APPS_SCRIPT_URL || DEFAULT_SCRIPT_URL || null;
};

export const setStoredAppsScriptUrl = (url: string | null) => {
  if (url && url.trim()) {
    localStorage.setItem(APPS_SCRIPT_URL_KEY, url.trim());
  } else {
    localStorage.removeItem(APPS_SCRIPT_URL_KEY);
    localStorage.removeItem("STARTEC_GOOGLE_APPS_SCRIPT_URL");
  }
};

export const getActiveBackendMode = (): 'apps_script' | 'google_oauth' => {
  return getStoredAppsScriptUrl() ? 'apps_script' : 'google_oauth';
};

/**
 * Production-ready Google Apps Script backend code template.
 * Copy-paste directly into Extensions -> Apps Script on the target Google Account spreadsheet.
 */
export const GOOGLE_APPS_SCRIPT_CODE_TEMPLATE = `/**
 * ============================================================================
 * STARTECH HUB - CROSS-ACCOUNT GOOGLE SPREADSHEET BACKEND (Apps Script)
 * ============================================================================
 * Instructions for Setup in Target Google Account:
 * 1. In your Google Spreadsheet, open: Extensions -> Apps Script
 * 2. Delete any default code and paste this ENTIRE code block.
 * 3. Click Save (disk icon or Ctrl+S).
 * 4. Click Deploy -> New Deployment.
 * 5. Click the gear icon next to "Select type" and select "Web app".
 * 6. Set Description: "Startech Hub Connector"
 * 7. Set "Execute as": "Me" (your Google account)
 * 8. Set "Who has access": "Anyone"
 * 9. Click "Deploy" (authorize permissions when prompted).
 * 10. Copy the Web App URL (starts with https://script.google.com/macros/s/...)
 * 11. Paste that URL into Startech Hub (Settings -> Google Sheets -> Apps Script URL).
 * ============================================================================
 */

var SHEETS_SCHEMA = {
  "Staff_Registry": [
    "Staff ID", "Full Name", "Role", "Department", "Section", "Team ID", "Team Name",
    "Supervisor", "Status", "Phone", "Email", "Username", "System Access", "Access Level",
    "Permissions", "Temp Password", "Visibility Scope", "Contract Hours", "Off Period Start",
    "Off Period End", "Off Period Type", "Updated At"
  ],
  "Attendance_Logs": [
    "Date", "Employee ID", "Shift ID", "Status", "Overtime Hours", "Comment", "Day Type",
    "Hours Worked", "Start Time", "End Time", "Is Approved", "Approved By", "Approved Date", "Updated At"
  ],
  "Workshop_Tools": [
    "Tool ID", "Tool Name", "Category", "Zone", "Quantity", "Available", "Condition",
    "Monetary Value", "Last Verified", "Submission Date", "Added By", "Image URL",
    "Asset Class", "Composition JSON", "Updated At"
  ],
  "Tool_Usage_Logs": [
    "Log ID", "Batch ID", "Tool ID", "Tool Name", "Quantity", "Staff ID", "Staff Name",
    "Shift Type", "Date", "Time Out", "Time In", "Is Returned", "Condition On Return",
    "Attendant ID", "Attendant Name", "Issuance Type", "Escalation Status", "Escalation Stage",
    "Grace Expiry Date", "Monetary Value", "Physical Archive ID", "Comment", "Updated At"
  ],
  "Spares_Registry": [
    "Spare ID", "Part Number", "Description", "Category", "Quantity In Stock", "Min Stock Level",
    "Unit Cost", "Storage Location", "Supplier", "Last Restocked Date", "Notes", "Updated At"
  ],
  "Spares_Receipt_Logs": [
    "Receipt ID", "Spare ID", "Part Number", "Description", "Quantity Received", "Unit Cost",
    "Supplier", "Invoice Number", "Received By", "Date", "Notes"
  ],
  "Spares_Issue_Logs": [
    "Issue ID", "Spare ID", "Part Number", "Description", "Quantity Issued", "Issued To Staff ID",
    "Issued To Name", "Job Card / Ref", "Issued By", "Date", "Notes"
  ],
  "Technician_Tasks": [
    "Task ID", "Job Card Number", "Title", "Description", "Status", "Priority",
    "Technician ID", "Technician Name", "Department", "Section", "Assigned Date",
    "Target Date", "Completed Date", "Tools Used JSON", "Spares Used JSON", "Notes", "Updated At"
  ],
  "Team_Off_Schedules": [
    "Schedule ID", "Team Name", "Members JSON", "Leave Camp Date", "Arrival Zambia Date",
    "Depart Zambia Date", "Return Camp Date", "Status", "Notes", "Created At", "Updated At"
  ],
  "Night_Shift_Schedules": [
    "Assignment ID", "Employee ID", "Employee Name", "Department", "Role", "Shift Hours",
    "Location", "Contact Number", "Status", "Notes", "Updated At"
  ],
  "Weekend_Standby_Schedules": [
    "Assignment ID", "Weekend Dates", "Lead Employee ID", "Lead Employee Name",
    "Backup Employee ID", "Backup Employee Name", "Department", "Role Type",
    "Contact Number", "Coverage Area", "Status", "Notes", "Updated At"
  ],
  "HR_Inquiries": [
    "Inquiry ID", "Staff ID", "Subject", "Message", "Timestamp", "Status",
    "HR Answer", "Director Answer", "Final Guidance", "Published Date", "Is Escalated", "Updated At"
  ]
};

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.tryLock(30000);
  } catch (err) {
    return jsonResponse({ status: "error", message: "Server busy, please retry in a moment." });
  }

  try {
    var params = (e && e.parameter) ? e.parameter : {};
    var body = {};
    if (e && e.postData && e.postData.contents) {
      try {
        body = JSON.parse(e.postData.contents);
      } catch (ex) {
        body = {};
      }
    }

    var action = body.action || params.action || "ping";
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. PING / STATUS TEST
    if (action === "ping") {
      var sheetNames = ss.getSheets().map(function(s) { return s.getName(); });
      return jsonResponse({
        status: "ok",
        spreadsheetId: ss.getId(),
        spreadsheetName: ss.getName(),
        sheets: sheetNames,
        serverTime: new Date().toISOString()
      });
    }

    // 2. READ ALL DATA IN ONE FAST BATCH
    if (action === "readAll") {
      var allData = {};
      for (var tab in SHEETS_SCHEMA) {
        var sheet = ss.getSheetByName(tab);
        if (sheet) {
          var values = sheet.getDataRange().getValues();
          allData[tab] = values.length > 1 ? values.slice(1) : [];
        } else {
          allData[tab] = [];
        }
      }
      return jsonResponse({
        status: "ok",
        spreadsheetId: ss.getId(),
        spreadsheetName: ss.getName(),
        data: allData
      });
    }

    // 3. READ SINGLE SHEET
    if (action === "readSheet") {
      var sheetName = body.sheetName || params.sheetName;
      if (!sheetName) return jsonResponse({ status: "error", message: "Missing sheetName." });
      var targetSheet = getOrCreateTab(ss, sheetName);
      var values = targetSheet.getDataRange().getValues();
      return jsonResponse({
        status: "ok",
        sheetName: sheetName,
        values: values.length > 1 ? values.slice(1) : []
      });
    }

    // 4. APPEND OR UPDATE ROW
    if (action === "appendOrUpdate") {
      var sheetName = body.sheetName;
      var idCol = body.idColumnIndex !== undefined ? Number(body.idColumnIndex) : 0;
      var idVal = String(body.idValue || "").trim().toLowerCase();
      var rowVals = body.rowValues || [];

      if (!sheetName) return jsonResponse({ status: "error", message: "Missing sheetName." });
      var targetSheet = getOrCreateTab(ss, sheetName);
      var existingData = targetSheet.getDataRange().getValues();
      var foundRow = -1;

      for (var i = 1; i < existingData.length; i++) {
        var cellVal = String(existingData[i][idCol] || "").trim().toLowerCase();
        if (cellVal === idVal) {
          foundRow = i + 1;
          break;
        }
      }

      if (foundRow > 0) {
        targetSheet.getRange(foundRow, 1, 1, rowVals.length).setValues([rowVals]);
        return jsonResponse({ status: "ok", action: "updated", row: foundRow });
      } else {
        targetSheet.appendRow(rowVals);
        return jsonResponse({ status: "ok", action: "appended", row: targetSheet.getLastRow() });
      }
    }

    // 5. DELETE ROW
    if (action === "delete") {
      var sheetName = body.sheetName;
      var idCol = body.idColumnIndex !== undefined ? Number(body.idColumnIndex) : 0;
      var idVal = String(body.idValue || "").trim().toLowerCase();

      if (!sheetName) return jsonResponse({ status: "error", message: "Missing sheetName." });
      var targetSheet = ss.getSheetByName(sheetName);
      if (!targetSheet) return jsonResponse({ status: "ok", deleted: false });

      var existingData = targetSheet.getDataRange().getValues();
      for (var i = 1; i < existingData.length; i++) {
        var cellVal = String(existingData[i][idCol] || "").trim().toLowerCase();
        if (cellVal === idVal) {
          targetSheet.deleteRow(i + 1);
          return jsonResponse({ status: "ok", deleted: true, row: i + 1 });
        }
      }
      return jsonResponse({ status: "ok", deleted: false });
    }

    // 6. BULK OVERWRITE
    if (action === "bulkWrite") {
      var sheetName = body.sheetName;
      var rows = body.rows || [];
      if (!sheetName) return jsonResponse({ status: "error", message: "Missing sheetName." });

      var targetSheet = getOrCreateTab(ss, sheetName);
      var lastRow = targetSheet.getLastRow();
      var lastCol = targetSheet.getLastColumn();
      if (lastRow > 1 && lastCol > 0) {
        targetSheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
      }
      if (rows.length > 0) {
        targetSheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
      }
      return jsonResponse({ status: "ok", count: rows.length });
    }

    // 7. INITIALIZE ALL TABS WITH HEADERS
    if (action === "initAllTabs") {
      for (var tabName in SHEETS_SCHEMA) {
        getOrCreateTab(ss, tabName);
      }
      return jsonResponse({ status: "ok", message: "All Startech Hub tabs initialized." });
    }

    return jsonResponse({ status: "error", message: "Unknown action: " + action });
  } catch (err) {
    return jsonResponse({ status: "error", error: err.toString() });
  } finally {
    try { lock.releaseLock(); } catch(e) {}
  }
}

function getOrCreateTab(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    var headers = SHEETS_SCHEMA[sheetName] || ["ID", "Name", "Data", "Updated At"];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setBackground("#0B0D26")
      .setFontColor("#FFFFFF")
      .setFontWeight("bold")
      .setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

/**
 * Tests connection to an Apps Script Web App endpoint.
 */
export const testAppsScriptConnection = async (testUrl?: string): Promise<{ success: boolean; data?: any; error?: string }> => {
  const url = (testUrl || getStoredAppsScriptUrl() || "").trim();
  if (!url) return { success: false, error: "Please enter a valid Google Apps Script Web App URL." };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "ping" })
    });

    if (!res.ok) {
      // Try GET ping fallback
      const getUrl = new URL(url);
      getUrl.searchParams.set("action", "ping");
      const getRes = await fetch(getUrl.toString());
      if (getRes.ok) {
        const data = await getRes.json();
        if (data.status === "ok") {
          if (data.spreadsheetId) setStoredSpreadsheetId(data.spreadsheetId, data.spreadsheetName);
          return { success: true, data };
        }
      }
      return { success: false, error: `Apps Script returned HTTP status ${res.status}` };
    }

    const data = await res.json();
    if (data && data.status === "ok") {
      if (data.spreadsheetId) setStoredSpreadsheetId(data.spreadsheetId, data.spreadsheetName);
      return { success: true, data };
    }
    return { success: false, error: data?.error || data?.message || "Invalid response from Apps Script." };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to reach Google Apps Script Web App. Please ensure 'Who has access: Anyone' is set on deployment." };
  }
};

/**
 * Executes a request against the Google Apps Script Web App.
 */
export const executeAppsScript = async (action: string, payload: any = {}): Promise<any> => {
  const url = getStoredAppsScriptUrl();
  if (!url) return null;

  try {
    const fullPayload = { action, ...payload };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(fullPayload)
    });

    if (!res.ok) {
      if (action === "ping" || action === "readAll" || action === "readSheet") {
        const getUrl = new URL(url);
        getUrl.searchParams.set("action", action);
        if (payload.sheetName) getUrl.searchParams.set("sheetName", payload.sheetName);
        const getRes = await fetch(getUrl.toString());
        if (getRes.ok) return await getRes.json();
      }
      return null;
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.debug(`Apps Script action [${action}] notice:`, err);
    return null;
  }
};

export const SHEETS_SCHEMA: Record<string, SheetTabDefinition> = {
  Staff_Registry: {
    title: "Staff_Registry",
    headers: [
      "Staff ID", "Full Name", "Role", "Department", "Section", "Team ID", "Team Name",
      "Supervisor", "Status", "Phone", "Email", "Username", "System Access", "Access Level",
      "Permissions", "Temp Password", "Visibility Scope", "Contract Hours", "Off Period Start",
      "Off Period End", "Off Period Type", "Updated At"
    ]
  },
  Attendance_Logs: {
    title: "Attendance_Logs",
    headers: [
      "Date", "Employee ID", "Shift ID", "Status", "Overtime Hours", "Comment", "Day Type",
      "Hours Worked", "Start Time", "End Time", "Is Approved", "Approved By", "Approved Date", "Updated At"
    ]
  },
  Workshop_Tools: {
    title: "Workshop_Tools",
    headers: [
      "Tool ID", "Tool Name", "Category", "Zone", "Quantity", "Available", "Condition",
      "Monetary Value", "Last Verified", "Submission Date", "Added By", "Image URL",
      "Asset Class", "Composition JSON", "Updated At"
    ]
  },
  Tool_Usage_Logs: {
    title: "Tool_Usage_Logs",
    headers: [
      "Log ID", "Batch ID", "Tool ID", "Tool Name", "Quantity", "Staff ID", "Staff Name",
      "Shift Type", "Date", "Time Out", "Time In", "Is Returned", "Condition On Return",
      "Attendant ID", "Attendant Name", "Issuance Type", "Escalation Status", "Escalation Stage",
      "Grace Expiry Date", "Monetary Value", "Physical Archive ID", "Comment", "Updated At"
    ]
  },
  Spares_Registry: {
    title: "Spares_Registry",
    headers: [
      "Spare ID", "Part Number", "Description", "Category", "Quantity In Stock", "Min Stock Level",
      "Unit Cost", "Storage Location", "Supplier", "Last Restocked Date", "Notes", "Updated At"
    ]
  },
  Spares_Receipt_Logs: {
    title: "Spares_Receipt_Logs",
    headers: [
      "Receipt ID", "Spare ID", "Part Number", "Description", "Quantity Received", "Unit Cost",
      "Supplier", "Invoice Number", "Received By", "Date", "Notes"
    ]
  },
  Spares_Issue_Logs: {
    title: "Spares_Issue_Logs",
    headers: [
      "Issue ID", "Spare ID", "Part Number", "Description", "Quantity Issued", "Issued To Staff ID",
      "Issued To Name", "Job Card / Ref", "Issued By", "Date", "Notes"
    ]
  },
  Technician_Tasks: {
    title: "Technician_Tasks",
    headers: [
      "Task ID", "Job Card Number", "Title", "Description", "Status", "Priority",
      "Technician ID", "Technician Name", "Department", "Section", "Assigned Date",
      "Target Date", "Completed Date", "Tools Used JSON", "Spares Used JSON", "Notes", "Updated At"
    ]
  },
  Team_Off_Schedules: {
    title: "Team_Off_Schedules",
    headers: [
      "Schedule ID", "Team Name", "Members JSON", "Leave Camp Date", "Arrival Zambia Date",
      "Depart Zambia Date", "Return Camp Date", "Status", "Notes", "Created At", "Updated At"
    ]
  },
  Night_Shift_Schedules: {
    title: "Night_Shift_Schedules",
    headers: [
      "Assignment ID", "Employee ID", "Employee Name", "Department", "Role", "Shift Hours",
      "Location", "Contact Number", "Status", "Notes", "Updated At"
    ]
  },
  Weekend_Standby_Schedules: {
    title: "Weekend_Standby_Schedules",
    headers: [
      "Assignment ID", "Weekend Dates", "Lead Employee ID", "Lead Employee Name",
      "Backup Employee ID", "Backup Employee Name", "Department", "Role Type",
      "Contact Number", "Coverage Area", "Status", "Notes", "Updated At"
    ]
  },
  HR_Inquiries: {
    title: "HR_Inquiries",
    headers: [
      "Inquiry ID", "Subject", "Category", "Message", "Employee ID", "Employee Name",
      "Status", "Response / Ruling", "Date Submitted", "Updated At"
    ]
  }
};

// =========================================================================
// GOOGLE SHEETS CORE API METHODS
// =========================================================================

export const getStoredSpreadsheetId = (): string | null => {
  return localStorage.getItem(SPREADSHEET_ID_KEY) || null;
};

export const setStoredSpreadsheetId = (id: string, title?: string) => {
  localStorage.setItem(SPREADSHEET_ID_KEY, id);
  if (title) localStorage.setItem(SPREADSHEET_TITLE_KEY, title);
};

export const getStoredSpreadsheetTitle = (): string => {
  return localStorage.getItem(SPREADSHEET_TITLE_KEY) || SPREADSHEET_TITLE;
};

/**
 * Creates a complete, professionally formatted Google Spreadsheet with all Startech tabs and headers.
 */
export const createMasterSpreadsheet = async (token: string, title = SPREADSHEET_TITLE): Promise<{ id: string; url: string; title: string }> => {
  const sheetsPayload = Object.values(SHEETS_SCHEMA).map((sheetDef) => ({
    properties: {
      title: sheetDef.title,
      gridProperties: {
        frozenRowCount: 1
      }
    },
    data: [
      {
        startRow: 0,
        startColumn: 0,
        rowData: [
          {
            values: sheetDef.headers.map((h) => ({
              userEnteredValue: { stringValue: h },
              userEnteredFormat: {
                backgroundColor: { red: 0.05, green: 0.07, blue: 0.15 },
                textFormat: {
                  foregroundColor: { red: 1, green: 1, blue: 1 },
                  bold: true,
                  fontSize: 10
                },
                horizontalAlignment: "CENTER"
              }
            }))
          }
        ]
      }
    ]
  }));

  const res = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      properties: {
        title
      },
      sheets: sheetsPayload
    })
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(`Failed to create Google Spreadsheet: ${errBody?.error?.message || res.statusText}`);
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  setStoredSpreadsheetId(spreadsheetId, title);
  return { id: spreadsheetId, url: spreadsheetUrl, title };
};

/**
 * Finds existing spreadsheet or provisions a new one.
 */
export const getOrCreateSpreadsheet = async (): Promise<{ id: string; url: string; title: string } | null> => {
  const token = await getAccessToken();
  const existingId = getStoredSpreadsheetId();

  if (existingId) {
    return {
      id: existingId,
      url: `https://docs.google.com/spreadsheets/d/${existingId}/edit`,
      title: getStoredSpreadsheetTitle()
    };
  }

  if (!token) return null;

  try {
    // 1. Search Google Drive for an existing spreadsheet
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(
      SPREADSHEET_TITLE
    )}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false&fields=files(id,name,webViewLink)`;
    
    const driveRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (driveRes.ok) {
      const driveData = await driveRes.json();
      if (driveData.files && driveData.files.length > 0) {
        const file = driveData.files[0];
        setStoredSpreadsheetId(file.id, file.name);
        return {
          id: file.id,
          url: file.webViewLink || `https://docs.google.com/spreadsheets/d/${file.id}/edit`,
          title: file.name
        };
      }
    }

    // 2. Create fresh master spreadsheet
    return await createMasterSpreadsheet(token, SPREADSHEET_TITLE);
  } catch (err) {
    console.warn("Spreadsheet auto-discovery note:", err);
    return null;
  }
};

/**
 * Helper to ensure a specific sheet tab exists in the spreadsheet.
 */
const ensureSheetTabExists = async (token: string, spreadsheetId: string, sheetTitle: string, headers: string[]) => {
  try {
    const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!metaRes.ok) return;
    const meta = await metaRes.json();
    const existingTitles = (meta.sheets || []).map((s: any) => s.properties?.title);
    
    if (!existingTitles.includes(sheetTitle)) {
      // Add sheet
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetTitle,
                  gridProperties: { frozenRowCount: 1 }
                }
              }
            }
          ]
        })
      });

      // Add header row
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetTitle)}!A1:Z1?valueInputOption=USER_ENTERED`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ values: [headers] })
      });
    }
  } catch (e) {
    console.debug("Sheet tab ensure notice:", e);
  }
};

/**
 * Reads all rows from a sheet tab.
 */
export const readSheetData = async (sheetName: string): Promise<any[][]> => {
  const appsScriptUrl = getStoredAppsScriptUrl();
  if (appsScriptUrl) {
    try {
      const resp = await executeAppsScript("readSheet", { sheetName });
      if (resp && resp.status === "ok" && Array.isArray(resp.values)) {
        return resp.values;
      }
    } catch (err) {
      console.debug(`Apps Script read sheet [${sheetName}] notice:`, err);
    }
  }

  const token = await getAccessToken();
  const spreadsheet = await getOrCreateSpreadsheet();
  if (!token || !spreadsheet?.id) return [];

  try {
    const range = `${encodeURIComponent(sheetName)}!A2:Z`;
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet.id}/values/${range}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.status === 404 || res.status === 400) {
      const def = SHEETS_SCHEMA[sheetName];
      if (def) {
        await ensureSheetTabExists(token, spreadsheet.id, def.title, def.headers);
      }
      return [];
    }

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    return data.values || [];
  } catch (err) {
    console.debug(`Read sheet [${sheetName}] notice:`, err);
    return [];
  }
};

/**
 * Appends or updates rows in a sheet tab.
 */
export const appendOrUpdateSheetRow = async (
  sheetName: string,
  idColumnIndex: number,
  idValue: string,
  rowValues: any[]
): Promise<boolean> => {
  const appsScriptUrl = getStoredAppsScriptUrl();
  if (appsScriptUrl) {
    try {
      const resp = await executeAppsScript("appendOrUpdate", {
        sheetName,
        idColumnIndex,
        idValue,
        rowValues
      });
      if (resp && resp.status === "ok") return true;
    } catch (err) {
      console.debug(`Apps Script write [${sheetName}] notice:`, err);
    }
  }

  const token = await getAccessToken();
  const spreadsheet = await getOrCreateSpreadsheet();
  if (!token || !spreadsheet?.id) return true;

  try {
    const def = SHEETS_SCHEMA[sheetName];
    if (def) {
      await ensureSheetTabExists(token, spreadsheet.id, def.title, def.headers);
    }

    // Read existing rows to find match
    const existing = await readSheetData(sheetName);
    const targetId = String(idValue || '').trim().toLowerCase();
    let targetRowIndex = -1;

    for (let i = 0; i < existing.length; i++) {
      const cellVal = String(existing[i]?.[idColumnIndex] || '').trim().toLowerCase();
      if (cellVal === targetId) {
        targetRowIndex = i + 2; // 1-indexed, skipping header row 1
        break;
      }
    }

    if (targetRowIndex > 0) {
      // Update specific row
      const range = `${encodeURIComponent(sheetName)}!A${targetRowIndex}:Z${targetRowIndex}`;
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet.id}/values/${range}?valueInputOption=USER_ENTERED`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ values: [rowValues] })
      });
    } else {
      // Append row
      const range = `${encodeURIComponent(sheetName)}!A1`;
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet.id}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ values: [rowValues] })
      });
    }
    return true;
  } catch (err) {
    console.debug(`Write sheet [${sheetName}] notice:`, err);
    return true;
  }
};

/**
 * Bulk writes/overwrites rows for high performance.
 */
export const bulkWriteSheetData = async (sheetName: string, headers: string[], rows: any[][]): Promise<boolean> => {
  const appsScriptUrl = getStoredAppsScriptUrl();
  if (appsScriptUrl) {
    try {
      const resp = await executeAppsScript("bulkWrite", { sheetName, rows });
      if (resp && resp.status === "ok") return true;
    } catch (err) {
      console.debug(`Apps Script bulk write [${sheetName}] notice:`, err);
    }
  }

  const token = await getAccessToken();
  const spreadsheet = await getOrCreateSpreadsheet();
  if (!token || !spreadsheet?.id) return true;

  try {
    await ensureSheetTabExists(token, spreadsheet.id, sheetName, headers);
    // Clear and overwrite range
    const clearRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet.id}/values/${encodeURIComponent(sheetName)}!A2:Z:clear`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    });

    if (rows.length > 0) {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet.id}/values/${encodeURIComponent(sheetName)}!A2?valueInputOption=USER_ENTERED`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ values: rows })
      });
    }
    return true;
  } catch (err) {
    console.debug(`Bulk write [${sheetName}] notice:`, err);
    return true;
  }
};

/**
 * Deletes a row from a sheet.
 */
export const deleteSheetRow = async (sheetName: string, idColumnIndex: number, idValue: string): Promise<boolean> => {
  const appsScriptUrl = getStoredAppsScriptUrl();
  if (appsScriptUrl) {
    try {
      const resp = await executeAppsScript("delete", { sheetName, idColumnIndex, idValue });
      if (resp && resp.status === "ok") return true;
    } catch (err) {
      console.debug(`Apps Script delete [${sheetName}] notice:`, err);
    }
  }

  const token = await getAccessToken();
  const spreadsheet = await getOrCreateSpreadsheet();
  if (!token || !spreadsheet?.id) return true;

  try {
    const existing = await readSheetData(sheetName);
    const targetId = String(idValue || '').trim().toLowerCase();
    const filteredRows = existing.filter(r => String(r[idColumnIndex] || '').trim().toLowerCase() !== targetId);

    const def = SHEETS_SCHEMA[sheetName];
    if (def) {
      await bulkWriteSheetData(sheetName, def.headers, filteredRows);
    }
    return true;
  } catch (err) {
    console.debug(`Delete sheet row [${sheetName}] notice:`, err);
    return true;
  }
};

// =========================================================================
// 1. STAFF REGISTRY & PERSONNEL PROFILES
// =========================================================================
const STAFF_CACHE_KEY = "STARTECH_STAFF_REGISTRY_CACHE";

const getLocalStaffCache = (): Employee[] => {
  try {
    const raw = localStorage.getItem(STAFF_CACHE_KEY) || localStorage.getItem("STARTEC_STAFF_REGISTRY_CACHE");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalStaffCache = (list: Employee[]) => {
  try {
    localStorage.setItem(STAFF_CACHE_KEY, JSON.stringify(list));
  } catch {}
};

export const fetchStaffFromGoogleSheets = async (): Promise<Employee[]> => {
  try {
    const rows = await readSheetData("Staff_Registry");
    if (rows && rows.length > 0) {
      const list: Employee[] = rows.map((r) => {
        const id = String(r[0] || '').trim();
        const perms = typeof r[14] === 'string' ? r[14].split(',').filter(Boolean) : [];
        return {
          id: id || `SP-${Date.now()}`,
          name: r[1] || 'Personnel',
          role: r[2] || 'Member',
          department: r[3] || 'Operations',
          section: r[4] || 'General',
          teamId: String(r[5] || ''),
          teamName: r[6] || '',
          supervisorName: r[7] || '',
          status: (r[8] as any) || 'Active',
          phone: r[9] || '',
          email: r[10] || '',
          username: r[11] || '',
          hasSystemAccess: String(r[12]).toUpperCase() !== 'FALSE',
          accessLevel: (r[13] as any) || 'Staff',
          permissions: perms,
          tempPassword: r[15] || '',
          visibilityScope: (r[16] as any) || 'SELF',
          contractHours: parseFloat(r[17]) || 48,
          offPeriodStart: r[18] || '',
          offPeriodEnd: r[19] || '',
          offPeriodType: r[20] || ''
        };
      }).filter(e => e.id);

      if (list.length > 0) {
        saveLocalStaffCache(list);
        return list;
      }
    }
  } catch (err) {
    console.debug("Sheets staff fetch notice:", err);
  }
  return getLocalStaffCache();
};

export const syncStaffToGoogleSheets = async (employee: Employee): Promise<boolean> => {
  const docId = employee.id || `SP-${Date.now()}`;
  const record: Employee = { ...employee, id: docId };

  const current = getLocalStaffCache();
  const idx = current.findIndex(e => e.id === docId);
  if (idx >= 0) current[idx] = record; else current.unshift(record);
  saveLocalStaffCache(current);

  const rowValues = [
    record.id,
    record.name,
    record.role,
    record.department || 'Operations',
    record.section || 'General',
    record.teamId || '',
    record.teamName || '',
    record.supervisorName || '',
    record.status || 'Active',
    record.phone || '',
    record.email || '',
    record.username || '',
    record.hasSystemAccess !== false ? 'TRUE' : 'FALSE',
    record.accessLevel || 'Staff',
    (record.permissions || []).join(','),
    record.tempPassword || '',
    record.visibilityScope || 'SELF',
    record.contractHours || 48,
    record.offPeriodStart || '',
    record.offPeriodEnd || '',
    record.offPeriodType || '',
    new Date().toISOString()
  ];

  return appendOrUpdateSheetRow("Staff_Registry", 0, docId, rowValues);
};

export const deleteStaffFromGoogleSheets = async (id: string): Promise<boolean> => {
  const current = getLocalStaffCache().filter(e => e.id !== id);
  saveLocalStaffCache(current);
  return deleteSheetRow("Staff_Registry", 0, id);
};

export const inviteStaffToGoogleSheets = async (
  staff: Partial<Employee>,
  initialPassword?: string
): Promise<{ success: boolean; authCreated: boolean; message: string; email?: string; tempPassword?: string; staffRecord?: Employee }> => {
  const rawEmail = (staff.email || staff.username || '').trim();
  const rawUsername = (staff.username || rawEmail.split('@')[0] || 'user').trim();
  
  let authEmail = rawEmail;
  if (!authEmail || !authEmail.includes('@')) {
    const cleanUser = rawUsername.toLowerCase().replace(/[^a-z0-9._-]/g, '') || 'user';
    authEmail = `${cleanUser}@startech.com`;
  }

  let rawPassword = (initialPassword || staff.tempPassword || 'Startech2026!').trim();
  if (rawPassword.length < 6) {
    rawPassword = `${rawPassword}2026!`;
  }

  const staffRecord: Employee = {
    id: staff.id || `SP-${Date.now().toString().slice(-4)}`,
    name: staff.name || 'New Staff',
    role: staff.role || 'Member',
    department: staff.department || 'Operations',
    section: staff.section || 'General',
    teamId: staff.teamId || '',
    teamName: staff.teamName || 'General',
    supervisorName: staff.supervisorName || '',
    contractHours: staff.contractHours || 48,
    status: staff.status || 'Active',
    phone: staff.phone || '',
    email: authEmail,
    username: rawUsername,
    hasSystemAccess: staff.hasSystemAccess !== false,
    accessLevel: staff.accessLevel || 'Staff',
    permissions: staff.permissions || [],
    visibilityScope: staff.visibilityScope || 'SELF',
    tempPassword: rawPassword
  };

  const ok = await syncStaffToGoogleSheets(staffRecord);

  return {
    success: ok,
    authCreated: true,
    message: `Staff personnel record (${staffRecord.name}) synchronized to Google Spreadsheet.`,
    email: authEmail,
    tempPassword: rawPassword,
    staffRecord
  };
};

// =========================================================================
// 2. ATTENDANCE REGISTER LEDGER & DAILY LOGS
// =========================================================================
const ATTENDANCE_CACHE_KEY = "STARTECH_ATTENDANCE_CACHE";

const getLocalAttendanceCache = (): AttendanceRecord[] => {
  try {
    const raw = localStorage.getItem(ATTENDANCE_CACHE_KEY) || localStorage.getItem("STARTEC_ATTENDANCE_CACHE");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalAttendanceCache = (list: AttendanceRecord[]) => {
  try {
    localStorage.setItem(ATTENDANCE_CACHE_KEY, JSON.stringify(list));
  } catch {}
};

export const fetchAttendanceFromGoogleSheets = async (): Promise<AttendanceRecord[]> => {
  try {
    const rows = await readSheetData("Attendance_Logs");
    if (rows && rows.length > 0) {
      const list: AttendanceRecord[] = rows.map((r) => ({
        date: r[0],
        employeeId: r[1],
        shiftId: r[2] || 'SHIFT-DAY',
        status: (r[3] === 'Absent' ? 'Absent' : 'Present') as 'Present' | 'Absent',
        overtimeHours: parseFloat(r[4]) || 0,
        comment: r[5] || '',
        dayType: r[6] || 'STANDARD',
        hoursWorked: r[7] !== undefined ? parseFloat(r[7]) : 8,
        startTime: r[8] || '',
        endTime: r[9] || '',
        isApproved: String(r[10]).toUpperCase() !== 'FALSE',
        approvedBy: r[11] || '',
        approvedDate: r[12] || ''
      })).filter(a => a.date && a.employeeId);

      if (list.length > 0) {
        saveLocalAttendanceCache(list);
        return list;
      }
    }
  } catch (err) {
    console.debug("Sheets attendance fetch notice:", err);
  }
  return getLocalAttendanceCache();
};

export const syncAttendanceToGoogleSheets = async (record: AttendanceRecord): Promise<boolean> => {
  if (!record || !record.employeeId || !record.date) return false;
  const current = getLocalAttendanceCache();
  const idx = current.findIndex(r => r.employeeId === record.employeeId && r.date === record.date);
  if (idx >= 0) current[idx] = { ...current[idx], ...record }; else current.push(record);
  saveLocalAttendanceCache(current);

  const rowValues = [
    record.date,
    record.employeeId,
    record.shiftId || 'SHIFT-DAY',
    record.status,
    record.overtimeHours || 0,
    record.comment || '',
    record.dayType || 'STANDARD',
    record.hoursWorked !== undefined ? record.hoursWorked : 8,
    record.startTime || '',
    record.endTime || '',
    record.isApproved !== false ? 'TRUE' : 'FALSE',
    record.approvedBy || '',
    record.approvedDate || '',
    new Date().toISOString()
  ];

  const compositeKey = `${record.date}_${record.employeeId}`;
  return appendOrUpdateSheetRow("Attendance_Logs", 0, record.date, rowValues);
};

export const syncAttendanceBulkToGoogleSheets = async (records: AttendanceRecord[]): Promise<boolean> => {
  if (!Array.isArray(records) || records.length === 0) return true;
  
  const map = new Map<string, AttendanceRecord>();
  getLocalAttendanceCache().forEach(r => map.set(`${r.date}_${r.employeeId}`, r));
  records.forEach(r => {
    if (r && r.employeeId && r.date) {
      map.set(`${r.date}_${r.employeeId}`, r);
    }
  });
  const allRecords = Array.from(map.values());
  saveLocalAttendanceCache(allRecords);

  const rows = allRecords.map(rec => [
    rec.date,
    rec.employeeId,
    rec.shiftId || 'SHIFT-DAY',
    rec.status,
    rec.overtimeHours || 0,
    rec.comment || '',
    rec.dayType || 'STANDARD',
    rec.hoursWorked !== undefined ? rec.hoursWorked : 8,
    rec.startTime || '',
    rec.endTime || '',
    rec.isApproved !== false ? 'TRUE' : 'FALSE',
    rec.approvedBy || '',
    rec.approvedDate || '',
    new Date().toISOString()
  ]);

  return bulkWriteSheetData("Attendance_Logs", SHEETS_SCHEMA.Attendance_Logs.headers, rows);
};

// =========================================================================
// 3. WORKSHOP TOOLS & ASSETS
// =========================================================================
export const isMockTool = (data: any): boolean => {
  if (!data) return true;
  if (data.isMock === true) return true;
  const idStr = String(data.id || '').toUpperCase();
  if (['T-101', 'T-102', 'T-103', 'T-104'].includes(idStr)) return true;
  return false;
};

const TOOLS_CACHE_KEY = "STARTECH_WORKSHOP_TOOLS_CACHE";

const getLocalToolsCache = (): ToolAsset[] => {
  try {
    const raw = localStorage.getItem(TOOLS_CACHE_KEY) || localStorage.getItem("STARTEC_WORKSHOP_TOOLS_CACHE");
    return (raw ? JSON.parse(raw) : []).filter((t: any) => !isMockTool(t));
  } catch {
    return [];
  }
};

const saveLocalToolsCache = (list: ToolAsset[]) => {
  try {
    localStorage.setItem(TOOLS_CACHE_KEY, JSON.stringify(list.filter(t => !isMockTool(t))));
  } catch {}
};

export const fetchToolsFromGoogleSheets = async (): Promise<ToolAsset[]> => {
  try {
    const rows = await readSheetData("Workshop_Tools");
    if (rows && rows.length > 0) {
      const list: ToolAsset[] = rows.map((r) => {
        let composition: string[] = [];
        try {
          composition = r[13] ? JSON.parse(r[13]) : [];
        } catch {
          composition = r[13] ? String(r[13]).split(',').map(s => s.trim()) : [];
        }

        return {
          id: String(r[0] || ''),
          name: r[1] || 'Workshop Tool',
          category: r[2] || 'Hand Tools',
          zone: r[3] || 'Zone A',
          quantity: parseInt(r[4]) || 1,
          available: parseInt(r[5]) || 0,
          condition: (r[6] as any) || 'Good',
          monetaryValue: parseFloat(r[7]) || 0,
          lastVerified: r[8] || '',
          submissionDate: r[9] || '',
          addedBy: r[10] || '',
          imageUrl: r[11] || '',
          assetClass: (r[12] as any) || 'Pc',
          composition: Array.isArray(composition) ? composition : []
        };
      }).filter(t => t.id && !isMockTool(t));

      if (list.length > 0) {
        saveLocalToolsCache(list);
        return list;
      }
    }
  } catch (err) {
    console.debug("Sheets tools fetch notice:", err);
  }
  return getLocalToolsCache();
};

export const syncToolToGoogleSheets = async (tool: ToolAsset): Promise<boolean> => {
  if (isMockTool(tool)) return false;
  const docId = tool.id || `T-${Date.now()}`;
  const record = { ...tool, id: docId };

  const current = getLocalToolsCache();
  const idx = current.findIndex(t => t.id === docId);
  if (idx >= 0) current[idx] = record; else current.unshift(record);
  saveLocalToolsCache(current);

  const rowValues = [
    record.id,
    record.name,
    record.category,
    record.zone,
    record.quantity,
    record.available,
    record.condition,
    record.monetaryValue || 0,
    record.lastVerified || '',
    record.submissionDate || '',
    record.addedBy || '',
    record.imageUrl || '',
    record.assetClass || 'Pc',
    JSON.stringify(record.composition || []),
    new Date().toISOString()
  ];

  return appendOrUpdateSheetRow("Workshop_Tools", 0, docId, rowValues);
};

export const deleteToolFromGoogleSheets = async (id: string): Promise<boolean> => {
  const current = getLocalToolsCache().filter(t => t.id !== id);
  saveLocalToolsCache(current);
  return deleteSheetRow("Workshop_Tools", 0, id);
};

// =========================================================================
// 4. SPARES & CONSUMABLES INVENTORY
// =========================================================================
const isMockSpare = (data: any) => !data || data.isMock === true;

const getLocalSparesCache = (): { spares: any[]; receipts: any[]; issues: any[] } => {
  try {
    const rawSpares = localStorage.getItem("STARTECH_SPARES") || localStorage.getItem("STARTEC_SPARES") || localStorage.getItem("workshop_spares") || "[]";
    const rawReceipts = localStorage.getItem("STARTECH_SPARES_RECEIPTS") || localStorage.getItem("STARTEC_SPARES_RECEIPTS") || localStorage.getItem("workshop_spares_receipts") || "[]";
    const rawIssues = localStorage.getItem("STARTECH_SPARES_ISSUES") || localStorage.getItem("STARTEC_SPARES_ISSUES") || localStorage.getItem("workshop_spares_issues") || "[]";

    const spares = JSON.parse(rawSpares);
    const receipts = JSON.parse(rawReceipts);
    const issues = JSON.parse(rawIssues);
    return { 
      spares: Array.isArray(spares) ? spares : [], 
      receipts: Array.isArray(receipts) ? receipts : [], 
      issues: Array.isArray(issues) ? issues : [] 
    };
  } catch {
    return { spares: [], receipts: [], issues: [] };
  }
};

const saveLocalSparesCache = (spares?: any[], receipts?: any[], issues?: any[]) => {
  try {
    if (spares) {
      localStorage.setItem("STARTECH_SPARES", JSON.stringify(spares));
      localStorage.setItem("STARTEC_SPARES", JSON.stringify(spares));
      localStorage.setItem("workshop_spares", JSON.stringify(spares));
    }
    if (receipts) {
      localStorage.setItem("STARTECH_SPARES_RECEIPTS", JSON.stringify(receipts));
      localStorage.setItem("STARTEC_SPARES_RECEIPTS", JSON.stringify(receipts));
      localStorage.setItem("workshop_spares_receipts", JSON.stringify(receipts));
    }
    if (issues) {
      localStorage.setItem("STARTECH_SPARES_ISSUES", JSON.stringify(issues));
      localStorage.setItem("STARTEC_SPARES_ISSUES", JSON.stringify(issues));
      localStorage.setItem("workshop_spares_issues", JSON.stringify(issues));
    }
  } catch {}
};

export const fetchSparesFromGoogleSheets = async (): Promise<{ spares: any[]; receipts: any[]; issues: any[] }> => {
  try {
    const [sparesRows, receiptsRows, issuesRows] = await Promise.all([
      readSheetData("Spares_Registry"),
      readSheetData("Spares_Receipt_Logs"),
      readSheetData("Spares_Issue_Logs")
    ]);

    const spares = (sparesRows || []).map((r, idx) => {
      const id = r[0] ? String(r[0]).trim() : (r[1] ? String(r[1]).trim() : (r[2] ? `SPR-${1001 + idx}` : ''));
      const partNumber = r[1] ? String(r[1]).trim() : id;
      const description = r[2] ? String(r[2]).trim() : '';
      const name = description || partNumber || id;
      const category = r[3] ? String(r[3]).trim() : 'General';
      const stockVal = parseInt(r[4], 10) || 0;
      const minStockLevel = parseInt(r[5], 10) || 0;
      const unitCost = parseFloat(r[6]) || 0;
      const location = r[7] ? String(r[7]).trim() : 'Main Workshop';
      const supplier = r[8] ? String(r[8]).trim() : '';
      const receivedDate = r[9] ? String(r[9]).trim() : new Date().toISOString().split('T')[0];
      const notes = r[10] ? String(r[10]).trim() : '';

      return {
        id,
        partNumber,
        description,
        name,
        category,
        quantityInStock: stockVal,
        currentStock: stockVal,
        initialStock: stockVal,
        minStockLevel,
        unitCost,
        storageLocation: location,
        location,
        supplier,
        lastRestockedDate: receivedDate,
        receivedDate,
        receivedBy: supplier || 'Admin',
        notes
      };
    }).filter(s => s.id && !s.id.startsWith('RCV-') && !s.id.startsWith('REC-') && !s.id.startsWith('ISS-') && !isMockSpare(s));

    const receipts = (receiptsRows || []).map(r => {
      const id = r[0] ? String(r[0]).trim() : '';
      const spareId = r[1] ? String(r[1]).trim() : '';
      const partNumber = r[2] ? String(r[2]).trim() : '';
      const description = r[3] ? String(r[3]).trim() : '';
      const spareName = description || partNumber || 'Spare Part';
      const qty = parseInt(r[4], 10) || 0;
      const unitCost = parseFloat(r[5]) || 0;
      const supplier = r[6] ? String(r[6]).trim() : '';
      const invoiceNumber = r[7] ? String(r[7]).trim() : '';
      const receivedBy = r[8] ? String(r[8]).trim() : 'Admin';
      const date = r[9] ? String(r[9]).trim() : new Date().toISOString().split('T')[0];
      const notes = r[10] ? String(r[10]).trim() : '';

      return {
        id,
        spareId,
        partNumber,
        description,
        spareName,
        quantityReceived: qty,
        quantity: qty,
        unitCost,
        supplier,
        invoiceNumber,
        receivedBy,
        date,
        notes
      };
    }).filter(r => r.id && !isMockSpare(r));

    const issues = (issuesRows || []).map(r => {
      const id = r[0] ? String(r[0]).trim() : '';
      const spareId = r[1] ? String(r[1]).trim() : '';
      const partNumber = r[2] ? String(r[2]).trim() : '';
      const description = r[3] ? String(r[3]).trim() : '';
      const spareName = description || partNumber || 'Spare Part';
      const qty = parseInt(r[4], 10) || 0;
      const issuedToStaffId = r[5] ? String(r[5]).trim() : '';
      const issuedToName = r[6] ? String(r[6]).trim() : 'Staff Member';
      const jobCardReference = r[7] ? String(r[7]).trim() : '';
      const issuedBy = r[8] ? String(r[8]).trim() : 'Storekeeper';
      const date = r[9] ? String(r[9]).trim() : new Date().toISOString().split('T')[0];
      const notes = r[10] ? String(r[10]).trim() : '';
      const time = r[11] ? String(r[11]).trim() : '12:00';

      return {
        id,
        spareId,
        partNumber,
        description,
        spareName,
        quantityIssued: qty,
        quantity: qty,
        issuedToStaffId,
        issuedToId: issuedToStaffId,
        issuedToName,
        jobCardReference,
        workOrderNumber: jobCardReference,
        issuedBy,
        date,
        time,
        purpose: jobCardReference ? `Work Order #${jobCardReference}` : (notes || 'Workshop Maintenance'),
        comments: notes,
        notes
      };
    }).filter(i => i.id && !isMockSpare(i));

    if (spares.length > 0 || receipts.length > 0 || issues.length > 0) {
      saveLocalSparesCache(spares, receipts, issues);
      return { spares, receipts, issues };
    }
  } catch (err) {
    console.debug("Sheets spares fetch notice:", err);
  }
  return getLocalSparesCache();
};

export const syncSpareToGoogleSheets = async (spare: any): Promise<boolean> => {
  if (isMockSpare(spare)) return false;
  const docId = spare.id || `SPR-${Date.now()}`;
  const name = spare.name || spare.description || spare.partNumber || 'Spare Part';
  const stockVal = spare.currentStock ?? spare.quantityInStock ?? spare.quantity ?? 0;
  const location = spare.location || spare.storageLocation || 'Main Workshop';
  const receivedDate = spare.receivedDate || spare.lastRestockedDate || spare.date || new Date().toISOString().split('T')[0];

  const record = { 
    ...spare, 
    id: docId,
    name,
    description: spare.description || name,
    category: spare.category || 'General',
    quantityInStock: stockVal,
    currentStock: stockVal,
    unitCost: spare.unitCost || 0,
    storageLocation: location,
    location,
    supplier: spare.supplier || '',
    lastRestockedDate: receivedDate,
    receivedDate,
    notes: spare.notes || ''
  };

  const cache = getLocalSparesCache();
  const idx = cache.spares.findIndex(s => s.id === docId);
  if (idx >= 0) cache.spares[idx] = record; else cache.spares.unshift(record);
  saveLocalSparesCache(cache.spares);

  const rowValues = [
    record.id,
    record.partNumber || record.id,
    record.description || record.name,
    record.category || 'General',
    stockVal,
    record.minStockLevel || 0,
    record.unitCost || 0,
    location,
    record.supplier || '',
    receivedDate,
    record.notes || '',
    new Date().toISOString()
  ];

  return appendOrUpdateSheetRow("Spares_Registry", 0, docId, rowValues);
};

export const syncSpareReceiptToGoogleSheets = async (receipt: any): Promise<boolean> => {
  if (isMockSpare(receipt)) return false;
  const docId = receipt.id || `RCV-${Date.now()}`;
  const spareName = receipt.spareName || receipt.description || 'Spare Part';
  const qty = Number(receipt.quantity) || Number(receipt.quantityReceived) || 0;
  const date = receipt.date || new Date().toISOString().split('T')[0];
  const receivedBy = receipt.receivedBy || 'Admin';

  const record = { 
    ...receipt, 
    id: docId,
    spareName,
    quantity: qty,
    quantityReceived: qty,
    date,
    receivedBy
  };

  const cache = getLocalSparesCache();
  const idx = cache.receipts.findIndex(r => r.id === docId);
  if (idx >= 0) cache.receipts[idx] = record; else cache.receipts.unshift(record);
  saveLocalSparesCache(undefined, cache.receipts);

  const rowValues = [
    record.id,
    record.spareId || '',
    record.partNumber || record.spareId || '',
    spareName,
    qty,
    record.unitCost || 0,
    record.supplier || '',
    record.invoiceNumber || '',
    receivedBy,
    date,
    record.notes || ''
  ];

  return appendOrUpdateSheetRow("Spares_Receipt_Logs", 0, docId, rowValues);
};

export const syncSpareIssueToGoogleSheets = async (issue: any): Promise<boolean> => {
  if (isMockSpare(issue)) return false;
  const docId = issue.id || `ISS-${Date.now()}`;
  const spareName = issue.spareName || issue.description || 'Spare Part';
  const qty = Number(issue.quantity) || Number(issue.quantityIssued) || 0;
  const issuedToId = issue.issuedToId || issue.issuedToStaffId || '';
  const issuedToName = issue.issuedToName || '';
  const jobCardRef = issue.jobCardReference || issue.workOrderNumber || '';
  const issuedBy = issue.issuedBy || 'Storekeeper';
  const date = issue.date || new Date().toISOString().split('T')[0];
  const notes = issue.notes || issue.comments || issue.purpose || '';

  const record = { 
    ...issue, 
    id: docId,
    spareName,
    quantity: qty,
    quantityIssued: qty,
    issuedToId,
    issuedToStaffId: issuedToId,
    issuedToName,
    jobCardReference: jobCardRef,
    workOrderNumber: jobCardRef,
    issuedBy,
    date,
    notes
  };

  const cache = getLocalSparesCache();
  const idx = cache.issues.findIndex(i => i.id === docId);
  if (idx >= 0) cache.issues[idx] = record; else cache.issues.unshift(record);
  saveLocalSparesCache(undefined, undefined, cache.issues);

  const rowValues = [
    record.id,
    record.spareId || '',
    record.partNumber || record.spareId || '',
    spareName,
    qty,
    issuedToId,
    issuedToName,
    jobCardRef,
    issuedBy,
    date,
    notes
  ];

  return appendOrUpdateSheetRow("Spares_Issue_Logs", 0, docId, rowValues);
};

export const deleteSpareFromGoogleSheets = async (id: string): Promise<boolean> => {
  const cache = getLocalSparesCache();
  const filtered = cache.spares.filter(s => s.id !== id);
  saveLocalSparesCache(filtered);
  return deleteSheetRow("Spares_Registry", 0, id);
};

// =========================================================================
// 5. TECHNICIAN TASKS & JOB CARDS
// =========================================================================
const TASKS_CACHE_KEY = "STARTECH_TECHNICIAN_TASKS_CACHE";

export const fetchTechnicianTasksFromGoogleSheets = async (): Promise<any[]> => {
  try {
    const rows = await readSheetData("Technician_Tasks");
    if (rows && rows.length > 0) {
      const list = rows.map(r => ({
        id: r[0],
        jobCardNumber: r[1],
        title: r[2],
        description: r[3],
        status: r[4] || 'Pending',
        priority: r[5] || 'Medium',
        technicianId: r[6],
        technicianName: r[7],
        department: r[8],
        section: r[9],
        assignedDate: r[10],
        targetDate: r[11],
        completedDate: r[12],
        toolsUsed: r[13] ? (typeof r[13] === 'string' ? JSON.parse(r[13] || '[]') : r[13]) : [],
        sparesUsed: r[14] ? (typeof r[14] === 'string' ? JSON.parse(r[14] || '[]') : r[14]) : [],
        notes: r[15]
      })).filter(t => t.id);

      if (list.length > 0) {
        localStorage.setItem(TASKS_CACHE_KEY, JSON.stringify(list));
        return list;
      }
    }
  } catch (err) {
    console.debug("Sheets tasks fetch notice:", err);
  }
  try {
    return JSON.parse(localStorage.getItem(TASKS_CACHE_KEY) || "[]");
  } catch {
    return [];
  }
};

export const syncTechnicianTaskToGoogleSheets = async (task: any): Promise<boolean> => {
  const docId = task.id || `TASK-${Date.now()}`;
  const record = { ...task, id: docId };

  try {
    const current = JSON.parse(localStorage.getItem(TASKS_CACHE_KEY) || "[]");
    const idx = current.findIndex((t: any) => t.id === docId || (task.jobCardNumber && t.jobCardNumber === task.jobCardNumber));
    if (idx >= 0) current[idx] = record; else current.unshift(record);
    localStorage.setItem(TASKS_CACHE_KEY, JSON.stringify(current));
  } catch {}

  const rowValues = [
    record.id,
    record.jobCardNumber || '',
    record.title || record.taskDescription || 'Technician Task',
    record.description || '',
    record.status || 'Pending',
    record.priority || 'Medium',
    record.technicianId || '',
    record.technicianName || '',
    record.department || '',
    record.section || '',
    record.assignedDate || record.date || '',
    record.targetDate || '',
    record.completedDate || '',
    JSON.stringify(record.toolsUsed || []),
    JSON.stringify(record.sparesUsed || []),
    record.notes || '',
    new Date().toISOString()
  ];

  return appendOrUpdateSheetRow("Technician_Tasks", 0, docId, rowValues);
};

export const deleteTechnicianTaskFromGoogleSheets = async (id: string): Promise<boolean> => {
  try {
    const current = JSON.parse(localStorage.getItem(TASKS_CACHE_KEY) || "[]").filter((t: any) => t.id !== id);
    localStorage.setItem(TASKS_CACHE_KEY, JSON.stringify(current));
  } catch {}
  return deleteSheetRow("Technician_Tasks", 0, id);
};

// =========================================================================
// 6. ROSTER SCHEDULES (TEAM OFF, NIGHT SHIFT, WEEKEND STANDBY)
// =========================================================================
const TEAM_OFF_KEY = "STARTECH_TEAM_OFF_CACHE";

export const fetchTeamOffSchedulesFromGoogleSheets = async (): Promise<any[]> => {
  try {
    const rows = await readSheetData("Team_Off_Schedules");
    if (rows && rows.length > 0) {
      const list = rows.map(r => ({
        id: r[0],
        teamName: r[1],
        members: r[2] ? (typeof r[2] === 'string' ? JSON.parse(r[2] || '[]') : r[2]) : [],
        leaveMineCampDate: r[3],
        arrivalZambiaDate: r[4],
        departZambiaDate: r[5],
        returnMineCampDate: r[6],
        status: r[7] || 'Upcoming',
        notes: r[8],
        createdAt: r[9]
      })).filter(s => s.id);

      if (list.length > 0) {
        localStorage.setItem(TEAM_OFF_KEY, JSON.stringify(list));
        return list;
      }
    }
  } catch (err) {
    console.debug("Sheets team off fetch notice:", err);
  }
  try {
    return JSON.parse(localStorage.getItem(TEAM_OFF_KEY) || "[]");
  } catch {
    return [];
  }
};

export const syncTeamOffScheduleToGoogleSheets = async (sched: any): Promise<boolean> => {
  const docId = sched.id || `TOS-${Date.now()}`;
  const record = { ...sched, id: docId };

  try {
    const current = JSON.parse(localStorage.getItem(TEAM_OFF_KEY) || "[]");
    const idx = current.findIndex((s: any) => s.id === docId);
    if (idx >= 0) current[idx] = record; else current.unshift(record);
    localStorage.setItem(TEAM_OFF_KEY, JSON.stringify(current));
  } catch {}

  const rowValues = [
    record.id,
    record.teamName || '',
    JSON.stringify(record.members || []),
    record.leaveMineCampDate || '',
    record.arrivalZambiaDate || '',
    record.departZambiaDate || '',
    record.returnMineCampDate || '',
    record.status || 'Upcoming',
    record.notes || '',
    record.createdAt || new Date().toISOString(),
    new Date().toISOString()
  ];

  return appendOrUpdateSheetRow("Team_Off_Schedules", 0, docId, rowValues);
};

export const deleteTeamOffScheduleFromGoogleSheets = async (id: string): Promise<boolean> => {
  try {
    const current = JSON.parse(localStorage.getItem(TEAM_OFF_KEY) || "[]").filter((s: any) => s.id !== id);
    localStorage.setItem(TEAM_OFF_KEY, JSON.stringify(current));
  } catch {}
  return deleteSheetRow("Team_Off_Schedules", 0, id);
};

const NIGHT_SHIFT_KEY = "STARTECH_NIGHT_SHIFT_CACHE";

export const fetchNightShiftsFromGoogleSheets = async (): Promise<any[]> => {
  try {
    const rows = await readSheetData("Night_Shift_Schedules");
    if (rows && rows.length > 0) {
      const list = rows.map(r => ({
        id: r[0],
        empId: r[1],
        empName: r[2],
        department: r[3],
        role: r[4],
        shiftHours: r[5],
        location: r[6],
        contactNumber: r[7],
        status: r[8] || 'Active Duty',
        notes: r[9]
      })).filter(s => s.id);

      if (list.length > 0) {
        localStorage.setItem(NIGHT_SHIFT_KEY, JSON.stringify(list));
        return list;
      }
    }
  } catch (err) {
    console.debug("Sheets night shift fetch notice:", err);
  }
  try {
    return JSON.parse(localStorage.getItem(NIGHT_SHIFT_KEY) || "[]");
  } catch {
    return [];
  }
};

export const syncNightShiftToGoogleSheets = async (shift: any): Promise<boolean> => {
  const docId = shift.id || `NS-${Date.now()}`;
  const record = { ...shift, id: docId };

  try {
    const current = JSON.parse(localStorage.getItem(NIGHT_SHIFT_KEY) || "[]");
    const idx = current.findIndex((s: any) => s.id === docId);
    if (idx >= 0) current[idx] = record; else current.unshift(record);
    localStorage.setItem(NIGHT_SHIFT_KEY, JSON.stringify(current));
  } catch {}

  const rowValues = [
    record.id,
    record.empId || '',
    record.empName || '',
    record.department || '',
    record.role || '',
    record.shiftHours || '',
    record.location || '',
    record.contactNumber || '',
    record.status || 'Active Duty',
    record.notes || '',
    new Date().toISOString()
  ];

  return appendOrUpdateSheetRow("Night_Shift_Schedules", 0, docId, rowValues);
};

export const deleteNightShiftFromGoogleSheets = async (id: string): Promise<boolean> => {
  try {
    const current = JSON.parse(localStorage.getItem(NIGHT_SHIFT_KEY) || "[]").filter((s: any) => s.id !== id);
    localStorage.setItem(NIGHT_SHIFT_KEY, JSON.stringify(current));
  } catch {}
  return deleteSheetRow("Night_Shift_Schedules", 0, id);
};

const WEEKEND_STANDBY_KEY = "STARTECH_WEEKEND_STANDBY_CACHE";

export const fetchWeekendStandbyFromGoogleSheets = async (): Promise<any[]> => {
  try {
    const rows = await readSheetData("Weekend_Standby_Schedules");
    if (rows && rows.length > 0) {
      const list = rows.map(r => ({
        id: r[0],
        weekendDates: r[1],
        leadEmpId: r[2],
        leadEmpName: r[3],
        backupEmpId: r[4],
        backupEmpName: r[5],
        department: r[6],
        roleType: r[7] || 'Primary Lead',
        contactNumber: r[8],
        coverageArea: r[9],
        status: r[10] || 'On Call',
        notes: r[11]
      })).filter(s => s.id);

      if (list.length > 0) {
        localStorage.setItem(WEEKEND_STANDBY_KEY, JSON.stringify(list));
        return list;
      }
    }
  } catch (err) {
    console.debug("Sheets standby fetch notice:", err);
  }
  try {
    return JSON.parse(localStorage.getItem(WEEKEND_STANDBY_KEY) || "[]");
  } catch {
    return [];
  }
};

export const syncWeekendStandbyToGoogleSheets = async (standby: any): Promise<boolean> => {
  const docId = standby.id || `WSB-${Date.now()}`;
  const record = { ...standby, id: docId };

  try {
    const current = JSON.parse(localStorage.getItem(WEEKEND_STANDBY_KEY) || "[]");
    const idx = current.findIndex((s: any) => s.id === docId);
    if (idx >= 0) current[idx] = record; else current.unshift(record);
    localStorage.setItem(WEEKEND_STANDBY_KEY, JSON.stringify(current));
  } catch {}

  const rowValues = [
    record.id,
    record.weekendDates || '',
    record.leadEmpId || '',
    record.leadEmpName || '',
    record.backupEmpId || '',
    record.backupEmpName || '',
    record.department || '',
    record.roleType || 'Primary Lead',
    record.contactNumber || '',
    record.coverageArea || '',
    record.status || 'On Call',
    record.notes || '',
    new Date().toISOString()
  ];

  return appendOrUpdateSheetRow("Weekend_Standby_Schedules", 0, docId, rowValues);
};

export const deleteWeekendStandbyFromGoogleSheets = async (id: string): Promise<boolean> => {
  try {
    const current = JSON.parse(localStorage.getItem(WEEKEND_STANDBY_KEY) || "[]").filter((s: any) => s.id !== id);
    localStorage.setItem(WEEKEND_STANDBY_KEY, JSON.stringify(current));
  } catch {}
  return deleteSheetRow("Weekend_Standby_Schedules", 0, id);
};

// =========================================================================
// 7. HR INQUIRIES & COMPLIANCE
// =========================================================================
export const fetchEngagementInquiriesFromGoogleSheets = async (): Promise<EngagementInquiry[]> => {
  try {
    const rows = await readSheetData("HR_Inquiries");
    if (rows && rows.length > 0) {
      return rows.map(r => ({
        id: r[0],
        staffId: r[1] || '',
        subject: r[2] || '',
        message: r[3] || '',
        timestamp: r[4] || new Date().toISOString(),
        status: (r[5] || 'Submitted') as any,
        hrAnswer: r[6] || undefined,
        directorAnswer: r[7] || undefined,
        finalGuidance: r[8] || undefined,
        publishedDate: r[9] || undefined,
        isEscalated: String(r[10]).toUpperCase() === 'TRUE'
      })).filter(i => i.id);
    }
  } catch (err) {
    console.debug("Sheets inquiries fetch notice:", err);
  }
  return [];
};

export const syncEngagementInquiryToGoogleSheets = async (inquiry: EngagementInquiry): Promise<boolean> => {
  const docId = inquiry.id || `ENQ-${Date.now()}`;
  const record = { ...inquiry, id: docId };

  const rowValues = [
    record.id,
    record.staffId || '',
    record.subject || '',
    record.message || '',
    record.timestamp || new Date().toISOString(),
    record.status || 'Submitted',
    record.hrAnswer || '',
    record.directorAnswer || '',
    record.finalGuidance || '',
    record.publishedDate || '',
    record.isEscalated ? 'TRUE' : 'FALSE',
    new Date().toISOString()
  ];

  return appendOrUpdateSheetRow("HR_Inquiries", 0, docId, rowValues);
};

export const deleteEngagementInquiryFromGoogleSheets = async (id: string): Promise<boolean> => {
  return deleteSheetRow("HR_Inquiries", 0, id);
};
