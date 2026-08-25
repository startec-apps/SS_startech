import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Clock, Scale, Info, Layers, Settings2, ShieldAlert, Wrench, 
  Database, CheckCircle, RefreshCw, Fingerprint, FileSpreadsheet, ExternalLink, 
  CheckCircle2, Code2, Copy, Check, AlertCircle, Link2, Sparkles, Terminal
} from 'lucide-react';
import { Shift, ShiftConfiguration, ShiftType, Employee, VisibilityScope } from '../types';
import Card from '../components/Card';
import PrivilegesTab from '../components/hr/PrivilegesTab';
import { 
  getStoredSpreadsheetId, 
  getStoredSpreadsheetTitle, 
  setStoredSpreadsheetId, 
  createMasterSpreadsheet, 
  getAccessToken,
  getStoredAppsScriptUrl,
  setStoredAppsScriptUrl,
  getActiveBackendMode,
  testAppsScriptConnection,
  GOOGLE_APPS_SCRIPT_CODE_TEMPLATE
} from '../services/googleSheets';

const SettingsPage: React.FC<{
  shifts: Shift[];
  config: ShiftConfiguration;
  onUpdateShifts: (shifts: Shift[]) => void;
  onUpdateConfig: (config: ShiftConfiguration) => void;
  currentUser: Employee;
  tierDefaults: Record<string, { permissions: string[], scope: VisibilityScope }>;
}> = ({ shifts, config, onUpdateShifts, onUpdateConfig, currentUser, tierDefaults }) => {
  const [activeTab, setActiveTab] = useState<'shifts' | 'policy' | 'roster' | 'matrix' | 'sheets'>('shifts');
  const [localShifts, setLocalShifts] = useState(shifts);
  const [localConfig, setLocalConfig] = useState(config);
  const [isSaving, setIsSaving] = useState(false);
  const [sheetId, setSheetId] = useState<string | null>(getStoredSpreadsheetId());
  const [sheetTitle, setSheetTitle] = useState<string>(getStoredSpreadsheetTitle());
  const [customSheetInput, setCustomSheetInput] = useState('');
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  
  // Apps Script State
  const [appsScriptUrl, setAppsScriptUrl] = useState<string>(getStoredAppsScriptUrl() || '');
  const [appsScriptInput, setAppsScriptInput] = useState<string>(getStoredAppsScriptUrl() || '');
  const [isTestingScript, setIsTestingScript] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [showScriptViewer, setShowScriptViewer] = useState(false);

  const handleSaveAppsScriptUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = appsScriptInput.trim();
    setStoredAppsScriptUrl(cleanUrl || null);
    setAppsScriptUrl(cleanUrl);
    setTestResult(null);

    if (cleanUrl) {
      setIsTestingScript(true);
      const res = await testAppsScriptConnection(cleanUrl);
      setIsTestingScript(false);
      if (res.success) {
        setTestResult({
          success: true,
          message: `Connected successfully to spreadsheet "${res.data?.spreadsheetName || 'Master'}" (${(res.data?.sheets || []).length} tabs detected)!`,
          data: res.data
        });
        if (res.data?.spreadsheetId) {
          setSheetId(res.data.spreadsheetId);
          setSheetTitle(res.data.spreadsheetName || sheetTitle);
        }
      } else {
        setTestResult({
          success: false,
          message: res.error || 'Failed to connect. Ensure Web App is deployed with "Who has access: Anyone".'
        });
      }
    } else {
      setTestResult({
        success: true,
        message: 'Apps Script URL cleared. Application will use Direct Google OAuth.'
      });
    }
  };

  const handleRunManualTest = async () => {
    if (!appsScriptUrl) return;
    setIsTestingScript(true);
    const res = await testAppsScriptConnection(appsScriptUrl);
    setIsTestingScript(false);
    if (res.success) {
      setTestResult({
        success: true,
        message: `Verified connection to "${res.data?.spreadsheetName || 'Spreadsheet'}" with ${(res.data?.sheets || []).length} tabs!`,
        data: res.data
      });
    } else {
      setTestResult({
        success: false,
        message: res.error || 'Connection failed.'
      });
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE_TEMPLATE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleSaveSheetId = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSheetInput.trim()) return;
    setStoredSpreadsheetId(customSheetInput.trim());
    setSheetId(customSheetInput.trim());
    setCustomSheetInput('');
    alert('Google Spreadsheet ID linked successfully!');
  };

  const handleCreateNewSheet = async () => {
    try {
      setIsCreatingSheet(true);
      const token = await getAccessToken();
      if (!token) {
        alert("Please sign in with Google to create a spreadsheet.");
        return;
      }
      const newSheet = await createMasterSpreadsheet(token);
      setSheetId(newSheet.id);
      setSheetTitle(newSheet.title);
      alert(`Created master spreadsheet: ${newSheet.title}`);
    } catch (err: any) {
      alert(`Failed to create spreadsheet: ${err.message}`);
    } finally {
      setIsCreatingSheet(false);
    }
  };

  useEffect(() => {
    if (shifts && shifts.length > 0) {
      setLocalShifts(shifts);
    }
  }, [shifts]);

  useEffect(() => {
    if (config) {
      setLocalConfig(config);
    }
  }, [config]);

  const updateShift = (id: string, updates: Partial<Shift>) => {
    setLocalShifts(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const addNewShift = () => {
    const nextLetter = String.fromCharCode(65 + localShifts.length);
    const newShift: Shift = {
      id: `s${Date.now()}`,
      name: `Shift ${nextLetter}`,
      type: ShiftType.DAY,
      startTime: '08:00',
      endTime: '17:00'
    };
    setLocalShifts([...localShifts, newShift]);
  };

  const removeShift = (id: string) => {
    if (localShifts.length <= 1) return;
    if (confirm("Are you sure you want to delete this shift? Personnel assignments will be cleared.")) {
      setLocalShifts(prev => prev.filter(s => s.id !== id));
    }
  };

  const saveAll = async () => {
    setIsSaving(true);
    onUpdateShifts(localShifts);
    onUpdateConfig(localConfig);
    alert('Settings updated successfully.');
    setIsSaving(false);
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">Admin Settings</h2>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">System Configuration</p>
        </div>
        {activeTab !== 'matrix' && (
          <button 
            onClick={saveAll}
            disabled={isSaving}
            className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-indigo-600 shadow-xl shadow-slate-200 transition-all flex items-center space-x-2 disabled:bg-slate-300"
          >
            {isSaving ? <Layers className="animate-spin" size={12} /> : <Settings2 size={12} />}
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        )}
      </div>

      <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-2xl w-fit border border-slate-200/50 mb-6">
        <button onClick={() => setActiveTab('shifts')} className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'shifts' ? 'bg-white text-indigo-700 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}>
          <Clock size={12} /><span>Shifts</span>
        </button>
        <button onClick={() => setActiveTab('policy')} className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'policy' ? 'bg-white text-indigo-700 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}>
          <ShieldAlert size={12} /><span>Policy</span>
        </button>
        <button onClick={() => setActiveTab('roster')} className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'roster' ? 'bg-white text-indigo-700 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}>
          <Wrench size={12} /><span>Sections</span>
        </button>
        <button onClick={() => setActiveTab('matrix')} className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'matrix' ? 'bg-white text-indigo-700 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}>
          <Fingerprint size={12} /><span>Permissions</span>
        </button>
        <button onClick={() => setActiveTab('sheets')} className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'sheets' ? 'bg-white text-emerald-700 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}>
          <FileSpreadsheet size={12} /><span>Google Sheets</span>
        </button>
      </div>

      {activeTab === 'matrix' ? (
        <PrivilegesTab currentUser={currentUser} tierDefaults={tierDefaults} />
      ) : (
        <>
          {activeTab === 'shifts' && (
            <Card title="" headerAction={
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Shift Schedule</span>
                <button onClick={addNewShift} className="text-indigo-600 hover:text-indigo-800 flex items-center text-[9px] font-black uppercase tracking-widest">
                  <Plus size={12} className="mr-1" /> Add Shift
                </button>
              </div>
            }>
              <div className="space-y-2 mt-4">
                {localShifts.map((shift) => (
                  <div key={shift.id} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 border border-slate-100 rounded-xl items-center bg-white hover:border-indigo-100 transition-all shadow-sm">
                    <div className="flex flex-col space-y-1">
                      <label className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Shift Name</label>
                      <input type="text" value={shift.name || ''} onChange={(e) => updateShift(shift.id, { name: e.target.value })} className="border border-slate-100 rounded-lg px-2 py-1.5 font-black text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-[10px]" />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Type</label>
                      <div className="flex bg-slate-100 p-0.5 rounded-lg">
                        <button onClick={() => updateShift(shift.id, { type: ShiftType.DAY })} className={`flex-1 py-1 rounded-md text-[8px] font-black uppercase transition-all ${shift.type === ShiftType.DAY ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400'}`}>Day</button>
                        <button onClick={() => updateShift(shift.id, { type: ShiftType.NIGHT })} className={`flex-1 py-1 rounded-md text-[8px] font-black uppercase transition-all ${shift.type === ShiftType.NIGHT ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Night</button>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Start Time</label>
                      <input type="time" value={shift.startTime || '00:00'} onChange={(e) => updateShift(shift.id, { startTime: e.target.value })} className="border border-slate-100 rounded-lg px-2 py-1.5 font-bold outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-[10px]" />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="text-[8px] text-slate-400 font-black uppercase tracking-widest">End Time</label>
                      <input type="time" value={shift.endTime || '00:00'} onChange={(e) => updateShift(shift.id, { endTime: e.target.value })} className="border border-slate-100 rounded-lg px-2 py-1.5 font-bold outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-[10px]" />
                    </div>
                    <div className="flex justify-end pt-2">
                       <button onClick={() => removeShift(shift.id)} className="text-rose-300 hover:text-rose-500 p-2 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === 'policy' && (
            <div className="space-y-6">
              <Card title="">
                 <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-indigo-600 rounded-xl text-white"><ShieldAlert size={14} /></div>
                    <div>
                      <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Company Policy</h4>
                      <p className="text-[8px] text-slate-400 font-bold uppercase">Work Rules and Rates</p>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex flex-col">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Notes</label>
                        <textarea className="w-full border border-slate-100 rounded-xl p-3 text-[10px] font-bold outline-none h-20 bg-slate-50/50" value={localConfig.nightToDayTransition} onChange={(e) => setLocalConfig({...localConfig, nightToDayTransition: e.target.value})} />
                      </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
                       <div className="flex items-center space-x-2 text-indigo-600 mb-2"><Scale size={14} /><span className="text-[9px] font-black uppercase">Standard Rates</span></div>
                       <ul className="text-[10px] text-slate-500 font-bold space-y-2 italic">
                         <li>• Weekday Overtime: 1.5x Rate</li>
                         <li>• Weekend/Holiday Overtime: 2.0x Rate</li>
                       </ul>
                    </div>
                 </div>
              </Card>
            </div>
          )}

          {activeTab === 'roster' && (
            <Card title="Roster Departments">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {['Technical', 'Operators', 'Admin', 'Other'].map((sec, idx) => (
                  <div key={idx} className="bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-100 text-[9px] font-black text-slate-900 uppercase flex justify-between items-center justify-center">
                    <span>{sec}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === 'sheets' && (
            <div className="space-y-6">
              {/* CROSS-ACCOUNT GOOGLE APPS SCRIPT CONNECTOR */}
              <Card title="Cross-Account Google Spreadsheet Connector (Apps Script)">
                <div className="space-y-6 mt-4">
                  <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-xs">
                          <Code2 size={20} />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">Google Apps Script Web App</h4>
                            <span className="bg-indigo-100 text-indigo-800 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Multi-Account Ready
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                            Connect seamlessly to a Google Spreadsheet hosted in any other personal or organizational Google account.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={handleCopyScript}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer"
                        >
                          {copiedScript ? <Check size={13} className="text-emerald-300" /> : <Copy size={13} />}
                          <span>{copiedScript ? 'Code Copied!' : 'Copy Apps Script Code'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowScriptViewer(!showScriptViewer)}
                          className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer"
                        >
                          <Terminal size={13} />
                          <span>{showScriptViewer ? 'Hide Code' : 'View Code'}</span>
                        </button>
                      </div>
                    </div>

                    {/* APPS SCRIPT URL INPUT */}
                    <form onSubmit={handleSaveAppsScriptUrl} className="space-y-2 pt-2 border-t border-indigo-100/80">
                      <label className="text-[9px] font-black text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                        <Link2 size={12} className="text-indigo-600" />
                        <span>Apps Script Web App Deployment URL</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={appsScriptInput}
                          onChange={(e) => setAppsScriptInput(e.target.value)}
                          placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                          className="flex-1 bg-white border border-indigo-200/80 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                        <button
                          type="submit"
                          disabled={isTestingScript}
                          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-1.5"
                        >
                          {isTestingScript ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                          <span>{isTestingScript ? 'Verifying...' : 'Connect URL'}</span>
                        </button>
                      </div>
                    </form>

                    {/* TEST RESULT FEEDBACK */}
                    {testResult && (
                      <div className={`p-3 rounded-xl border text-xs font-medium flex items-start space-x-2 ${
                        testResult.success 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                          : 'bg-rose-50 border-rose-200 text-rose-900'
                      }`}>
                        {testResult.success ? (
                          <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                        )}
                        <div className="space-y-1">
                          <p className="text-[11px] font-bold">{testResult.message}</p>
                          {testResult.data?.sheets && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {testResult.data.sheets.map((s: string, idx: number) => (
                                <span key={idx} className="bg-emerald-100/80 text-emerald-800 text-[8px] font-black px-2 py-0.5 rounded-md uppercase">
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* SCRIPT CODE VIEWER (IF TOGGLED) */}
                    {showScriptViewer && (
                      <div className="space-y-2 pt-2 border-t border-indigo-100">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black text-slate-700 uppercase tracking-wider">
                            Google Apps Script Backend Source Code (.gs)
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyScript}
                            className="text-[9px] font-black text-indigo-600 hover:text-indigo-800 uppercase flex items-center space-x-1 cursor-pointer"
                          >
                            <Copy size={11} />
                            <span>{copiedScript ? 'Copied' : 'Copy All Code'}</span>
                          </button>
                        </div>
                        <pre className="max-h-64 overflow-y-auto bg-slate-900 text-slate-200 text-[10px] font-mono p-4 rounded-xl border border-slate-800 select-all leading-relaxed">
                          {GOOGLE_APPS_SCRIPT_CODE_TEMPLATE}
                        </pre>
                      </div>
                    )}

                    {/* 3-STEP SETUP GUIDE */}
                    <div className="border-t border-indigo-100/80 pt-4 space-y-3">
                      <span className="text-[9px] font-black text-indigo-900 uppercase tracking-widest block">
                        3-Step Setup Guide for Target Google Account
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="bg-white p-3.5 rounded-xl border border-indigo-100/60 space-y-1.5 shadow-2xs">
                          <div className="flex items-center space-x-1.5 text-indigo-600">
                            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-black">1</span>
                            <span className="text-[10px] font-black uppercase tracking-tight">Open Apps Script</span>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-snug">
                            In your Google Sheet (in the other account), click <strong>Extensions</strong> → <strong>Apps Script</strong>.
                          </p>
                        </div>

                        <div className="bg-white p-3.5 rounded-xl border border-indigo-100/60 space-y-1.5 shadow-2xs">
                          <div className="flex items-center space-x-1.5 text-indigo-600">
                            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-black">2</span>
                            <span className="text-[10px] font-black uppercase tracking-tight">Paste & Save</span>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-snug">
                            Click <strong>"Copy Apps Script Code"</strong> above, replace the script file content, and click <strong>Save</strong>.
                          </p>
                        </div>

                        <div className="bg-white p-3.5 rounded-xl border border-indigo-100/60 space-y-1.5 shadow-2xs">
                          <div className="flex items-center space-x-1.5 text-indigo-600">
                            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-black">3</span>
                            <span className="text-[10px] font-black uppercase tracking-tight">Deploy as Web App</span>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-snug">
                            Click <strong>Deploy → New Deployment</strong>, choose <strong>Web app</strong>, set <em>Execute as:</em> <strong>Me</strong> & <em>Who has access:</em> <strong>Anyone</strong>, then paste the URL here.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* MASTER SPREADSHEET STATUS & LIVE LINK */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileSpreadsheet className="text-emerald-600" size={18} />
                        <span className="text-xs font-black text-slate-900 uppercase tracking-tight">Active Master Spreadsheet</span>
                      </div>
                      <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>{appsScriptUrl ? 'Connected via Apps Script' : 'Connected via Google OAuth'}</span>
                      </span>
                    </div>

                    <div className="pt-2">
                      <label className="text-[8px] text-slate-400 font-black uppercase tracking-widest block mb-1">Spreadsheet Title</label>
                      <p className="text-xs font-bold text-slate-800">{sheetTitle || 'Startech Hub - Site Operations & Resource Management'}</p>
                    </div>

                    {sheetId && (
                      <div>
                        <label className="text-[8px] text-slate-400 font-black uppercase tracking-widest block mb-1">Spreadsheet ID</label>
                        <p className="font-mono text-[10px] bg-white border border-slate-200 rounded-xl p-2.5 text-slate-700 select-all truncate">{sheetId}</p>
                      </div>
                    )}

                    {sheetId && (
                      <div className="pt-2 flex flex-wrap gap-2">
                        <a
                          href={`https://docs.google.com/spreadsheets/d/${sheetId}/edit`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition-all shadow-xs"
                        >
                          <FileSpreadsheet size={15} />
                          <span>Open Live in Google Sheets</span>
                          <ExternalLink size={12} />
                        </a>

                        {appsScriptUrl && (
                          <button
                            type="button"
                            onClick={handleRunManualTest}
                            disabled={isTestingScript}
                            className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer"
                          >
                            <RefreshCw size={13} className={isTestingScript ? 'animate-spin' : ''} />
                            <span>Test Apps Script Sync</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* DIRECT GOOGLE SHEETS ID CONNECTION (OAUTH MODE) */}
                  <div className="border-t border-slate-100 pt-5 space-y-4">
                    <form onSubmit={handleSaveSheetId} className="space-y-2">
                      <label className="text-[9px] font-black text-slate-900 uppercase tracking-wider block">
                        Link Direct Google Spreadsheet ID (For Same Google Account)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customSheetInput}
                          onChange={(e) => setCustomSheetInput(e.target.value)}
                          placeholder="Paste Google Spreadsheet ID here (e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms)..."
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                        <button
                          type="submit"
                          disabled={!customSheetInput.trim()}
                          className="px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                        >
                          Save ID
                        </button>
                      </div>
                    </form>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Need to initialize a brand new spreadsheet?</span>
                      <button
                        type="button"
                        onClick={handleCreateNewSheet}
                        disabled={isCreatingSheet}
                        className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Database size={12} />
                        <span>{isCreatingSheet ? 'Creating...' : 'Create New Master Spreadsheet'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SettingsPage;