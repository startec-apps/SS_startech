import React, { useRef, useEffect, useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Layers, 
  Settings, 
  LogOut, 
  Bell, 
  Wrench, 
  UserCircle, 
  Clock, 
  Sun, 
  Moon, 
  RefreshCw, 
  Info, 
  AlertCircle, 
  CheckCircle2, 
  Inbox, 
  ShieldAlert, 
  Calendar, 
  ClipboardList, 
  ClipboardCheck, 
  Grid3X3, 
  ArrowLeft, 
  Package,
  FileSpreadsheet,
  ExternalLink,
  X,
  Database
} from 'lucide-react';
import { 
  getStoredSpreadsheetId, 
  getStoredSpreadsheetTitle, 
  setStoredSpreadsheetId, 
  createMasterSpreadsheet, 
  getAccessToken,
  getStoredAppsScriptUrl,
  setStoredAppsScriptUrl,
  testAppsScriptConnection,
  GOOGLE_APPS_SCRIPT_CODE_TEMPLATE
} from '../services/googleSheets';
import { Employee, Shift, ShiftType } from '../types';
import { Code2, Copy, Check, Link2 } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: any) => void;
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
  onLogout: () => void;
  onRefresh?: () => void;
  notifications: any;
  shiftsSubPage: string;
  managerialSubPage: string;
  currentUser: Employee | null;
  hasPermission: (tab: string) => boolean;
  shifts: Shift[];
  isSyncingBackground?: boolean;
  isOffline?: boolean;
  isCloudLoading?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  onTabChange, 
  onLogout, 
  onRefresh,
  notifications, 
  currentUser,
  hasPermission,
  shifts = [],
  isSyncingBackground = false,
  isOffline = false,
  isCloudLoading = false
}) => {
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showSheetModal, setShowSheetModal] = useState(false);
  const [sheetId, setSheetId] = useState<string | null>(getStoredSpreadsheetId());
  const [sheetTitle, setSheetTitle] = useState<string>(getStoredSpreadsheetTitle());
  const [customInputId, setCustomInputId] = useState('');
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [appsScriptUrl, setAppsScriptUrl] = useState<string>(getStoredAppsScriptUrl() || '');
  const [appsScriptInput, setAppsScriptInput] = useState<string>(getStoredAppsScriptUrl() || '');
  const [isTestingScript, setIsTestingScript] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  const handleUpdateAppsScriptUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = appsScriptInput.trim();
    setStoredAppsScriptUrl(clean || null);
    setAppsScriptUrl(clean);
    if (clean) {
      setIsTestingScript(true);
      const res = await testAppsScriptConnection(clean);
      setIsTestingScript(false);
      if (res.success && res.data?.spreadsheetId) {
        setSheetId(res.data.spreadsheetId);
        setSheetTitle(res.data.spreadsheetName || sheetTitle);
      }
    }
    if (onRefresh) onRefresh();
  };

  const handleCopyScriptCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE_TEMPLATE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleUpdateCustomId = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInputId.trim()) return;
    setStoredSpreadsheetId(customInputId.trim());
    setSheetId(customInputId.trim());
    setShowSheetModal(false);
    if (onRefresh) onRefresh();
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
      setShowSheetModal(false);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(`Failed to create spreadsheet: ${err.message}`);
    } finally {
      setIsCreatingSheet(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000); 
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        notifications.setShow(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifications]);

  const activeShift = useMemo(() => {
    if (!shifts || shifts.length === 0) return null;
    const now = currentTime.getHours() * 60 + currentTime.getMinutes();
    return shifts.find(s => {
      const [startH, startM] = s.startTime.split(':').map(Number);
      const [endH, endM] = s.endTime.split(':').map(Number);
      const start = startH * 60 + startM;
      const end = endH * 60 + endM;
      return start < end ? (now >= start && now < end) : (now >= start || now < end);
    });
  }, [shifts, currentTime]);

  const unreadCount = notifications.list.filter((n: any) => !n.read).length;

  // Clean, professional Black & White main menu items
  const mainMenuItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard, 
      perm: 'dashboard'
    },
    { 
      id: 'registry', 
      label: 'Staff Directory', 
      icon: Users, 
      perm: 'registry'
    },
    { 
      id: 'off-planner', 
      label: 'Off Planner', 
      icon: Calendar, 
      perm: 'shifts'
    },
    { 
      id: 'inventory', 
      label: 'Tools Inventory', 
      icon: Wrench, 
      perm: 'inventory'
    },
    { 
      id: 'spares', 
      label: 'Spares Inventory', 
      icon: Package, 
      perm: 'inventory'
    },
    { 
      id: 'technician_tasks', 
      label: 'Daily Tasks/Projects', 
      icon: ClipboardList, 
      perm: 'inventory'
    },
    { 
      id: 'attendance', 
      label: 'Attendance Logs', 
      icon: ClipboardCheck, 
      perm: 'always'
    },
  ];

  const getPageTitle = () => {
    switch(activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'registry': return 'Staff Directory';
      case 'shifts': return 'Shift Schedule';
      case 'off-planner': return 'Off Planner';
      case 'inventory': return 'Tools Inventory';
      case 'spares': return 'Spares Inventory';
      case 'technician_tasks': return 'Technician Tasks';
      case 'attendance': return 'Attendance Register Logs';
      case 'managerial': return 'Management Control';
      case 'profile': return 'My Profile';
      case 'settings': return 'Settings';
      default: return 'Main Menu';
    }
  };

  const isLauncher = activeTab === 'launcher' || activeTab === 'menu' || !children;

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-inter text-slate-900">
      {/* TOP BRAND & CORNER PROFILE HEADER */}
      <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-2.5 shrink-0 z-30 shadow-xs">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-3">
          
          {/* LEFT: BRAND LOGO & HOME GRID BUTTON */}
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => onTabChange('launcher')}
              className="w-10 h-10 bg-black hover:bg-slate-800 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-xs shrink-0 transition-transform active:scale-95 cursor-pointer border border-black"
              title="Return to Main Menu Grid"
            >
              S
            </button>

            {activeTab === 'technician_tasks' ? (
              <button 
                onClick={() => onTabChange('launcher')}
                className="p-2 rounded-xl bg-black hover:bg-slate-800 text-white transition-all shadow-xs cursor-pointer border border-black active:scale-95 group flex items-center justify-center shrink-0"
                title="Back to Main Menu"
              >
                <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
              </button>
            ) : (
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-sm md:text-base font-black text-slate-900 leading-none uppercase tracking-tight">
                    Startech Hub
                  </h1>

                  {!isLauncher && (
                    <button 
                      onClick={() => onTabChange('launcher')}
                      className="p-2 rounded-xl bg-black hover:bg-slate-800 text-white transition-all shadow-xs cursor-pointer border border-black active:scale-95 group flex items-center justify-center shrink-0"
                      title="Back to Main Menu"
                    >
                      <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 mt-0.5">
                  <p className="text-[8px] md:text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                    Startech Operations Hub
                  </p>
                  {!isLauncher && (
                    <span className="text-[8px] md:text-[9px] font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md uppercase tracking-tight">
                      / {getPageTitle()}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* CENTER: SYSTEM STATUS */}
          <div className="flex items-center space-x-2">
            {(isCloudLoading || isSyncingBackground) && (
              <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200/80 text-emerald-700 px-3 py-1.5 rounded-2xl text-[8.5px] font-black uppercase tracking-wider shadow-2xs">
                <RefreshCw size={11} className="animate-spin text-emerald-600 shrink-0" />
                <span className="hidden sm:inline">Syncing...</span>
                <span className="sm:hidden">Syncing...</span>
              </div>
            )}

            {activeTab !== 'technician_tasks' && (
              <div className="hidden md:flex items-center space-x-3 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-2xl">
                <div className="flex items-center space-x-1.5">
                  <div className={`w-2 h-2 rounded-full ${isOffline ? 'bg-rose-500' : 'bg-emerald-500'} animate-pulse`}></div>
                  <span className={`text-[8.5px] font-black uppercase tracking-wider ${isOffline ? 'text-rose-500' : 'text-emerald-600'}`}>
                    {isOffline ? 'Offline' : 'Online'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: REFRESH, NOTIFICATIONS & CORNER PROFILE */}
          <div className="flex items-center space-x-2.5 shrink-0">
            {(isSyncingBackground || onRefresh) && (
              <button 
                onClick={onRefresh} 
                disabled={isSyncingBackground || isOffline}
                className="p-2 text-slate-600 hover:text-black bg-slate-50 hover:bg-slate-100 rounded-xl transition-all active:scale-90 border border-slate-200 cursor-pointer"
                title={isCloudLoading || isSyncingBackground ? "Syncing with Google Spreadsheet..." : "Sync Sheets Data"}
              >
                <RefreshCw size={16} className={(isSyncingBackground || isCloudLoading) ? 'animate-spin text-emerald-600' : ''} />
              </button>
            )}

            {/* NOTIFICATIONS */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => notifications.setShow(!notifications.show)} 
                className={`p-2 rounded-xl border transition-all relative shrink-0 cursor-pointer ${
                  notifications.show ? 'bg-black text-white border-black shadow-md' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-400'
                }`}
                title="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-rose-600 border-2 border-white rounded-full text-[7px] font-black text-white flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifications.show && (
                <div className="absolute right-0 mt-3 w-[290px] sm:w-[360px] bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-200 overflow-hidden z-[60] animate-in slide-in-from-top-2 duration-300">
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Site Operations Alerts</h4>
                      <p className="text-[7px] text-slate-400 font-bold uppercase mt-0.5">Live Updates</p>
                    </div>
                    <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-[6px] font-black text-slate-400 uppercase">System Active</span>
                    </div>
                  </div>

                  <div className="max-h-[380px] overflow-y-auto no-scrollbar divide-y divide-slate-100">
                    {notifications.list.length === 0 ? (
                      <div className="py-16 text-center">
                        <Inbox size={32} className="mx-auto text-slate-200 mb-3" />
                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em]">No Messages</p>
                      </div>
                    ) : (
                      notifications.list.map((n: any) => (
                        <div key={n.id} className={`p-4 hover:bg-slate-50 transition-colors flex gap-3.5 items-start ${!n.read ? 'bg-slate-50/80' : ''}`}>
                          <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center shadow-xs border ${
                            n.type === 'alert' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                            n.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                            'bg-slate-100 text-slate-800 border-slate-200'
                          }`}>
                            {n.type === 'alert' ? <AlertCircle size={15} /> :
                             n.type === 'success' ? <CheckCircle2 size={15} /> :
                             <Info size={15} />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-tight truncate leading-none mb-1">{n.title}</h5>
                            <p className="text-[9px] font-medium text-slate-600 leading-relaxed mb-1.5">{n.message}</p>
                            <div className="flex items-center gap-1.5 text-[7px] font-black text-slate-400 uppercase tracking-widest">
                              <Clock size={10} />
                              <span>{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {!n.read && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-black font-black">New</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-center">
                    <button 
                      onClick={() => notifications.setShow(false)}
                      className="text-[8px] font-black text-slate-500 uppercase tracking-widest hover:text-black transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* TOP RIGHT CORNER PROFESSIONAL PROFILE BUTTON */}
            <div className="relative" ref={profileDropdownRef}>
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-black text-white hover:bg-slate-800 transition-all border border-black shadow-xs cursor-pointer group active:scale-95"
                title="Profile & Account"
              >
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white text-black font-extrabold text-xs flex items-center justify-center shrink-0">
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                
                <div className="hidden sm:flex flex-col items-start leading-none text-left pr-0.5">
                  <span className="text-[10px] font-bold text-white group-hover:text-slate-200">
                    {currentUser?.name?.split(' ')[0] || 'User'}
                  </span>
                  <span className="text-[7px] text-slate-300 font-medium uppercase tracking-wider mt-0.5">
                    {currentUser?.accessLevel || 'Staff'}
                  </span>
                </div>
              </button>

              {/* PROFILE DROPDOWN MENU - SIMPLE BLACK & WHITE DESIGN */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 sm:w-52 bg-white rounded-2xl shadow-xl border border-black p-2 z-[60] animate-in slide-in-from-top-2 duration-150">
                  {/* USER HEADER */}
                  <div className="px-3 py-2 bg-black text-white rounded-xl mb-1.5">
                    <p className="text-[10.5px] font-bold uppercase tracking-tight truncate">{currentUser?.name || 'Staff Member'}</p>
                    <p className="text-[8px] font-medium text-slate-300 uppercase tracking-wider mt-0.5">{currentUser?.accessLevel || 'Staff'}</p>
                  </div>

                  {/* MENU ITEMS */}
                  <button 
                    onClick={() => {
                      onTabChange('profile');
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-black hover:text-white text-black text-[9.5px] font-bold uppercase tracking-wider transition-colors cursor-pointer group"
                  >
                    <UserCircle size={15} className="text-black group-hover:text-white transition-colors shrink-0" />
                    <span>My Profile</span>
                  </button>

                  {hasPermission('settings') && (
                    <button 
                      onClick={() => {
                        onTabChange('settings');
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-black hover:text-white text-black text-[9.5px] font-bold uppercase tracking-wider transition-colors cursor-pointer group"
                    >
                      <Settings size={15} className="text-black group-hover:text-white transition-colors shrink-0" />
                      <span>Settings</span>
                    </button>
                  )}

                  <div className="h-px bg-slate-200 my-1"></div>

                  <button 
                    onClick={() => {
                      setShowProfileMenu(false);
                      onLogout();
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-black hover:text-white text-black text-[9.5px] font-bold uppercase tracking-wider transition-colors cursor-pointer group"
                  >
                    <LogOut size={15} className="text-black group-hover:text-white transition-colors shrink-0" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 overflow-y-auto bg-slate-50/50 p-2 sm:p-4 md:p-6 lg:p-8 flex flex-col min-h-0">
        {isLauncher ? (
          <div className="flex-1 w-full flex flex-col justify-center items-center my-auto overflow-hidden py-1">
            <div className="w-full max-w-4xl mx-auto flex flex-col justify-center h-full max-h-[600px] px-2">
              
              {/* 3x3 RESPONSIVE CLEAN MONOCHROME ICON GRID - NO CIRCLES/BOXES AROUND ICONS, NO CLUTTER INFO */}
              <div className="grid grid-cols-3 gap-3 sm:gap-5 md:gap-6 w-full max-w-3xl mx-auto my-auto shrink-0">
                {mainMenuItems.map((item) => {
                  if (item.perm !== 'always' && !hasPermission(item.perm)) return null;
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      onClick={() => onTabChange(item.id)}
                      className="group relative flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-200/80 bg-white hover:bg-black hover:text-white shadow-xs hover:shadow-2xl transition-all duration-200 hover:-translate-y-1 active:scale-95 cursor-pointer text-center overflow-hidden"
                    >
                      {/* PURE SIMPLE ICON - NO CIRCLE/BOX CONTAINER AROUND IT */}
                      <Icon className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-slate-900 group-hover:text-white transition-all duration-200 group-hover:scale-110 mb-2 sm:mb-3 shrink-0" />

                      {/* CLEAN MODULE TITLE */}
                      <span className="text-[10px] sm:text-xs md:text-sm font-bold text-slate-900 group-hover:text-white uppercase tracking-tight text-center leading-tight line-clamp-1 transition-colors">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>

            </div>
          </div>
        ) : (
          <div className="max-w-[1400px] mx-auto w-full pb-10">
            {/* PROMINENT BACK NAVIGATION BAR */}
            <div className="mb-4 flex items-center justify-between">
              <button 
                onClick={() => onTabChange('launcher')}
                className="w-9 h-9 bg-white hover:bg-black hover:text-white text-slate-900 border border-slate-200 rounded-xl shadow-xs flex items-center justify-center transition-all active:scale-95 cursor-pointer group shrink-0"
                title="Back to Main Menu"
              >
                <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
              </button>

              <div className="flex items-center space-x-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest hidden sm:inline-block">Active Module:</span>
                <span className="text-[9.5px] font-black text-slate-800 bg-white border border-slate-200 px-3 py-1.5 rounded-xl uppercase tracking-tight shadow-2xs">
                  {getPageTitle()}
                </span>
              </div>
            </div>

            {children}
          </div>
        )}
      </main>

      {/* GOOGLE SHEETS SPREADSHEET MANAGER MODAL */}
      {showSheetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                    Google Spreadsheet Connection
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    Cloud Operational Data Storage
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSheetModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              {/* CROSS-ACCOUNT APPS SCRIPT FIELD */}
              <div className="bg-indigo-50/70 rounded-2xl p-4 border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Code2 size={16} className="text-indigo-600" />
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">
                      Apps Script Bridge (Cross-Account)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyScriptCode}
                    className="text-[9px] font-black text-indigo-600 hover:text-indigo-800 uppercase flex items-center space-x-1 cursor-pointer"
                  >
                    {copiedScript ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                    <span>{copiedScript ? 'Copied Script!' : 'Copy .gs Script'}</span>
                  </button>
                </div>

                <form onSubmit={handleUpdateAppsScriptUrl} className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={appsScriptInput}
                      onChange={(e) => setAppsScriptInput(e.target.value)}
                      placeholder="Paste Apps Script Web App URL..."
                      className="flex-1 bg-white border border-indigo-200 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={isTestingScript}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-1"
                    >
                      {isTestingScript ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                      <span>{isTestingScript ? 'Checking' : 'Save'}</span>
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                    Status
                  </span>
                  <div className="flex items-center space-x-1.5 bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{appsScriptUrl ? 'Apps Script Connected' : 'Connected & Active'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                    Spreadsheet Name
                  </span>
                  <span className="text-xs font-bold text-slate-800 truncate max-w-[240px]">
                    {sheetTitle || 'Startech Hub - Site Operations & Resource Management'}
                  </span>
                </div>

                {sheetId && (
                  <div className="pt-2 border-t border-slate-200/60">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                      Spreadsheet ID
                    </span>
                    <p className="font-mono text-[10px] bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 select-all truncate">
                      {sheetId}
                    </p>
                  </div>
                )}
              </div>

              {sheetId && (
                <div className="flex gap-2">
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${sheetId}/edit`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-xs"
                  >
                    <FileSpreadsheet size={15} />
                    <span>Open in Google Sheets</span>
                    <ExternalLink size={12} />
                  </a>

                  {onRefresh && (
                    <button
                      onClick={() => {
                        onRefresh();
                        setShowSheetModal(false);
                      }}
                      className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <RefreshCw size={14} />
                      <span>Sync Now</span>
                    </button>
                  )}
                </div>
              )}

              {/* CONNECT CUSTOM ID / CREATE NEW */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <form onSubmit={handleUpdateCustomId} className="space-y-2">
                  <label className="text-[9px] font-bold text-slate-700 uppercase tracking-wider block">
                    Link Direct Google Spreadsheet ID (Same Account)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customInputId}
                      onChange={(e) => setCustomInputId(e.target.value)}
                      placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                    <button
                      type="submit"
                      disabled={!customInputId.trim()}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Link
                    </button>
                  </div>
                </form>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    Need a fresh spreadsheet?
                  </span>
                  <button
                    type="button"
                    onClick={handleCreateNewSheet}
                    disabled={isCreatingSheet}
                    className="text-emerald-700 hover:text-emerald-900 font-black text-[10px] uppercase tracking-wider flex items-center space-x-1 cursor-pointer"
                  >
                    <Database size={12} />
                    <span>{isCreatingSheet ? 'Creating Sheet...' : 'Create New Master Sheet'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
