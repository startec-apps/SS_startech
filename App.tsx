
import React, { useState } from 'react';
import { RotateCcw, Activity, ClipboardCheck, Users, History, BarChart3, ShieldCheck, ShieldAlert, TrendingUp, MonitorCheck } from 'lucide-react';
import { Employee } from './types';
import { syncStaffToGoogleSheets, deleteStaffFromGoogleSheets } from './services/googleSheets';

// Specialized Logic & Components
import { useAppLogic } from './hooks/useAppLogic';
import Layout from './components/Layout';
import LoginScreen from './components/LoginScreen';
import { LogoutModal, RotationModal } from './components/Modals';
import GlobalOverlay from './components/GlobalOverlay';

// Page Imports
import Dashboard from './pages/Dashboard';
import TeamsPage from './pages/TeamsPage';
import AttendancePage from './pages/AttendancePage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import StaffRegistryPage from './pages/StaffRegistryPage';
import InventoryPage from './pages/InventoryPage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import GlobalAuditPage from './pages/GlobalAuditPage';
import OperationalSnapshotPage from './pages/OperationalSnapshotPage';
import OffPeriodPlannerPage from './pages/OffPeriodPlannerPage';
import TechnicianTasksPage from './pages/TechnicianTasksPage';
import AccountabilityMonitor from './components/inventory/AccountabilityMonitor';

const App: React.FC = () => {
  const { auth, navigation, data, notifications, modals, system, isCloudLoading } = useAppLogic();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!auth.isAuthenticated) {
    return (
      <LoginScreen 
        onLogin={auth.handleLogin} 
        onGoogleLogin={auth.handleGoogleLogin}
        isAuthenticating={auth.isAuthenticating} 
        loginSuccess={auth.loginSuccess}
        error={auth.authError} 
        isReady={!isCloudLoading} 
      />
    );
  }

  return (
    <Layout 
      activeTab={navigation.activeTab} 
      onTabChange={navigation.setActiveTab}
      isCollapsed={navigation.isSidebarCollapsed}
      setIsCollapsed={navigation.setIsSidebarCollapsed}
      onLogout={() => setShowLogoutConfirm(true)}
      onRefresh={system.onRefresh}
      notifications={notifications}
      shiftsSubPage={navigation.shiftsSubPage}
      managerialSubPage={navigation.managerialSubPage}
      currentUser={auth.currentUser}
      hasPermission={navigation.hasPermission}
      shifts={data.shifts} 
      isSyncingBackground={system.isSyncingBackground}
      isOffline={system.isOffline}
      isCloudLoading={isCloudLoading}
    >
      <GlobalOverlay isVisible={system.isBusy} />

      {showLogoutConfirm && (
        <LogoutModal onConfirm={() => { setShowLogoutConfirm(false); auth.handleLogout(); }} onCancel={() => setShowLogoutConfirm(false)} />
      )}
      
      {navigation.activeTab === 'dashboard' && navigation.hasPermission('dashboard') && (
        <Dashboard 
          teams={data.teams} 
          shifts={data.shifts} 
          history={data.attendanceHistory} 
          masterEmployees={data.masterEmployees}
          tools={data.inventory.tools}
          usageLogs={data.inventory.usageLogs}
          maintenanceRecords={data.inventory.maintenanceHistory}
        />
      )}
      
      {navigation.activeTab === 'registry' && navigation.hasPermission('registry') && (
        <StaffRegistryPage 
          teams={data.teams} masterEmployees={data.masterEmployees} history={data.attendanceHistory}
          sections={data.sections} tierDefaults={data.tierDefaults} onAddMember={data.addMember} 
          onUpdateMember={data.updateMember} onDeleteMember={data.deleteMember} 
          currentUser={auth.currentUser!} isSystemBusy={system.isBusy} setSystemBusy={system.setBusy}
          hasPermission={navigation.hasPermission}
        />
      )}
      
      {navigation.activeTab === 'inventory' && navigation.hasPermission('inventory') && (
        <InventoryPage 
          masterEmployees={data.masterEmployees} currentUser={auth.currentUser!} cloudTools={data.inventory.tools}
          cloudUsageLogs={data.inventory.usageLogs} cloudPhysicalLogs={data.inventory.physicalLogs}
          cloudAuditHistory={data.inventory.auditHistory} 
          cloudMaintenanceHistory={data.inventory.maintenanceHistory}
          onUpdateTools={data.inventory.setTools}
          onDeleteTool={data.inventory.deleteTool}
          onUpdateUsageLogs={data.inventory.setUsageLogs} onUpdatePhysicalLogs={data.inventory.setPhysicalLogs}
          onUpdateAuditHistory={data.inventory.setAuditHistory} isSystemBusy={system.isBusy} setSystemBusy={system.setBusy}
          hasPermission={navigation.hasPermission}
          initialTab="inventory"
        />
      )}

      {navigation.activeTab === 'spares' && navigation.hasPermission('inventory') && (
        <InventoryPage 
          masterEmployees={data.masterEmployees} currentUser={auth.currentUser!} cloudTools={data.inventory.tools}
          cloudUsageLogs={data.inventory.usageLogs} cloudPhysicalLogs={data.inventory.physicalLogs}
          cloudAuditHistory={data.inventory.auditHistory} 
          cloudMaintenanceHistory={data.inventory.maintenanceHistory}
          onUpdateTools={data.inventory.setTools}
          onDeleteTool={data.inventory.deleteTool}
          onUpdateUsageLogs={data.inventory.setUsageLogs} onUpdatePhysicalLogs={data.inventory.setPhysicalLogs}
          onUpdateAuditHistory={data.inventory.setAuditHistory} isSystemBusy={system.isBusy} setSystemBusy={system.setBusy}
          hasPermission={navigation.hasPermission}
          initialTab="spares"
        />
      )}

      {navigation.activeTab === 'technician_tasks' && (
        <TechnicianTasksPage 
          masterEmployees={data.masterEmployees}
          currentUser={auth.currentUser!}
          hasPermission={navigation.hasPermission}
          inventoryTools={data.inventory.tools}
          onUpdateTools={data.inventory.setTools}
          onSyncAttendance={(records) => {
            data.setAttendanceHistory(prev => {
              const next = [...prev];
              records.forEach(r => {
                const idx = next.findIndex(n => n.employeeId === r.employeeId && n.date === r.date);
                if (idx > -1) {
                  next[idx] = r;
                } else {
                  next.push(r);
                }
              });
              return next;
            });
          }}
        />
      )}

      {navigation.activeTab === 'attendance' && (
        <AttendancePage 
          teams={data.teams} 
          shifts={data.shifts} 
          history={data.attendanceHistory}
          masterEmployees={data.masterEmployees}
          onSave={(rec) => {
            data.setAttendanceHistory(prev => {
              const next = [...prev];
              rec.forEach(r => {
                const idx = next.findIndex(n => n.employeeId === r.employeeId && n.date === r.date);
                if (idx > -1) {
                  next[idx] = r;
                } else {
                  next.push(r);
                }
              });
              return next;
            });
          }} 
          setSystemBusy={system.setBusy} 
          hasPermission={navigation.hasPermission} 
          currentUser={auth.currentUser!} 
        />
      )}

      {navigation.activeTab === 'managerial' && navigation.hasPermission('managerial') && (
        <div className="space-y-6">
          <div className="flex justify-center w-full mt-2 px-1">
            <div className="flex flex-wrap justify-center items-center gap-2 bg-slate-50/80 backdrop-blur-md p-2 rounded-[2rem] border border-slate-200 shadow-sm transition-all max-w-full overflow-hidden">
              {[
                { id: 'snapshot', icon: <MonitorCheck size={14} />, label: 'Operational Snapshot', perm: 'managerial_snapshot_view' },
                { id: 'audit', icon: <ShieldCheck size={14} />, label: 'Compliance Audit', perm: 'managerial_audit_view' },
                { id: 'resolution', icon: <ShieldAlert size={14} />, label: 'Resolution Hub', perm: 'managerial_resolution_view' }
              ].filter(t => navigation.hasPermission('managerial', 'view', t.id)).map(tab => (
                <button 
                  key={tab.id} 
                  onClick={() => navigation.setManagerialSubPage(tab.id as any)} 
                  className={`flex items-center space-x-2.5 px-6 py-3.5 rounded-[1.2rem] font-black uppercase text-[10px] tracking-widest transition-all cursor-pointer active:scale-95 whitespace-nowrap ${
                    navigation.managerialSubPage === tab.id 
                      ? 'bg-white text-indigo-600 shadow-lg border border-indigo-100 ring-4 ring-indigo-50/50' 
                      : 'text-slate-400 hover:text-slate-600 hover:bg-white/50 border border-transparent'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="pt-2">
            {navigation.managerialSubPage === 'snapshot' && navigation.hasPermission('managerial', 'view', 'snapshot') && (
              <OperationalSnapshotPage history={data.attendanceHistory} teams={data.teams} masterEmployees={data.masterEmployees} shifts={data.shifts} />
            )}
            {navigation.managerialSubPage === 'audit' && navigation.hasPermission('managerial', 'view', 'audit') && (
              <GlobalAuditPage history={data.attendanceHistory} teams={data.teams} masterEmployees={data.masterEmployees} currentUser={auth.currentUser!} resolveStaffIdentity={data.resolveStaffIdentity} />
            )}
            {navigation.managerialSubPage === 'resolution' && navigation.hasPermission('managerial', 'view', 'resolution') && (
              <div className="animate-in fade-in duration-700">
                <AccountabilityMonitor 
                  monitoredItems={data.inventory.usageLogs.filter(l => l.escalationStatus !== 'Resolved')}
                  staffRegistry={data.masterEmployees}
                  currentUser={auth.currentUser!}
                  onVerify={async (log) => {
                    system.setBusy(true);
                    try {
                      const isDamaged = log.conditionOnReturn === 'Damaged' || (log.comment || '').toUpperCase().includes('DAMAGED');
                      const timestamp = new Date().toLocaleString();
                      
                      const updatedLog = { 
                        ...log, 
                        escalationStatus: 'Resolved' as const, 
                        isReturned: true,
                        comment: (log.comment || '') + ` | RECOVERY VERIFIED BY ${auth.currentUser?.name} | ${timestamp}`,
                        actionHistory: [...(log.actionHistory || []), {
                           stage: log.escalationStage || 'Supervisor',
                           actorName: auth.currentUser?.name || 'Authorized Personnel',
                           action: 'PHYSICAL RECOVERY',
                           timestamp: timestamp,
                           notes: isDamaged ? 'Asset recovered in damaged condition. Staged for maintenance.' : 'Asset restored to master inventory.'
                        }]
                      };
                      data.inventory.setUsageLogs(data.inventory.usageLogs.map(l => l.id === log.id ? updatedLog : l));
                      
                      const tool = data.inventory.tools.find(t => t.id === log.toolId);
                      if (tool) {
                        // Registry Restore Engine: When verifying recovery, we also clean the master composition list of any variance tags
                        const nextComp = tool.composition?.map(p => p.replace(/\s*\(MISSING\)/g, '').replace(/\s*\(DAMAGED\)/g, ''));
                        
                        const updatedTool = { 
                          ...tool, 
                          available: isDamaged ? tool.available : Math.min(tool.quantity, tool.available + log.quantity),
                          condition: isDamaged ? 'Maintenance' as any : 'Good' as any,
                          lastVerified: new Date().toISOString().split('T')[0],
                          composition: nextComp
                        };
                        data.inventory.setTools(data.inventory.tools.map(t => t.id === tool.id ? updatedTool : t));

                        if (isDamaged) {
                           const m = {
                              id: `MNT-RES-${Date.now()}`, toolId: tool.id, toolName: tool.name,
                              reportedBy: auth.currentUser?.name || 'Manager', reportedDate: updatedTool.lastVerified,
                              breakdownContext: `[AUTO_PUSH] Resolution hub identified damage during final recovery. Original custodian: ${log.staffName}.`,
                              isRepairable: null, status: 'Staged' as const
                           };
                           data.inventory.setMaintenanceHistory([m, ...data.inventory.maintenanceHistory]);
                        }
                      }
                    } finally { system.setBusy(false); }
                  }}
                  onResolve={async (logId, action, notes) => {
                    system.setBusy(true);
                    try {
                      const log = data.inventory.usageLogs.find(l => l.id === logId);
                      if (!log) return;

                      let nextStage = log.escalationStage || 'Supervisor';
                      let nextStatus = log.escalationStatus || 'Pending';
                      let nextExpiry = log.graceExpiryDate;

                      if (action === 'grant_grace') {
                        const exp = new Date();
                        exp.setDate(exp.getDate() + 30);
                        nextExpiry = exp.toISOString().split('T')[0];
                        nextStatus = 'In-Grace-Period';
                      } else if (action === 'escalate_to_manager') {
                        nextStage = 'Manager';
                        nextStatus = 'Pending';
                      } else if (action === 'hr_escalate') {
                        nextStatus = 'Escalated-to-HR';
                      } else if (action === 'cancel_case') {
                        nextStatus = 'Resolved';
                      } else if (action === 'request_further_search') {
                        nextStage = 'Supervisor';
                        nextStatus = 'Pending';
                      }

                      const updatedLog = { 
                        ...log, 
                        escalationStage: nextStage, 
                        escalationStatus: nextStatus as any, 
                        graceExpiryDate: nextExpiry,
                        actionHistory: [...(log.actionHistory || []), {
                          stage: log.escalationStage || 'Supervisor',
                          actorName: auth.currentUser?.name || 'Authority',
                          action: action.toUpperCase().replace(/_/g, ' '),
                          timestamp: new Date().toLocaleString(),
                          notes: notes || 'Command Directive Issued'
                        }]
                      };
                      data.inventory.setUsageLogs(data.inventory.usageLogs.map(l => l.id === logId ? updatedLog : l));
                    } finally { system.setBusy(false); }
                  }}
                  onStartSweep={() => navigation.setActiveTab('inventory')}
                  hasPermission={navigation.hasPermission}
                  resolveStaffIdentity={data.resolveStaffIdentity}
                />
              </div>
            )}
          </div>
        </div>
      )}
      
      {navigation.activeTab === 'profile' && (
        <ProfileSettingsPage currentUser={auth.currentUser!} onUpdateProfile={async (updated) => {
            system.setBusy(true);
            try {
              await syncStaffToGoogleSheets(updated);
              data.updateMember(updated);
            } finally { system.setBusy(false); }
          }}
        />
      )}

      {navigation.activeTab === 'off-planner' && navigation.hasPermission('shifts') && (
        <OffPeriodPlannerPage 
          masterEmployees={data.masterEmployees}
          teams={data.teams}
          currentUser={auth.currentUser!}
          onUpdateMember={async (m) => {
            system.setBusy(true);
            try {
              await syncStaffToGoogleSheets(m);
              data.updateMember(m);
            } finally {
              system.setBusy(false);
            }
          }}
          isSystemBusy={system.isBusy}
          setSystemBusy={system.setBusy}
          hasPermission={navigation.hasPermission}
        />
      )}
      
      {navigation.activeTab === 'shifts' && navigation.hasPermission('shifts') && (
        <div className="space-y-6">
          <div className="flex justify-center w-full mt-2 px-1">
            <div className="flex flex-wrap justify-center items-center gap-2 bg-slate-50/80 backdrop-blur-md p-2 rounded-[2rem] border border-slate-200 shadow-sm transition-all max-w-full overflow-hidden">
              {[
                { id: 'attendance', icon: <ClipboardCheck size={14} />, label: 'Daily Register', perm: 'shifts_attendance_view' },
                { id: 'teams', icon: <Users size={14} />, label: 'Teams & Roster', perm: 'shifts_teams_view' },
                { id: 'history', icon: <History size={14} />, label: 'Archive Logs', perm: 'shifts_history_view' }
              ].filter(t => navigation.hasPermission('shifts', 'view', t.id)).map(tab => (
                <button 
                  key={tab.id} 
                  onClick={() => navigation.setShiftsSubPage(tab.id as any)} 
                  className={`flex items-center space-x-2.5 px-6 py-3.5 rounded-[1.2rem] font-black uppercase text-[10px] tracking-widest transition-all cursor-pointer active:scale-95 whitespace-nowrap ${
                    navigation.shiftsSubPage === tab.id 
                      ? 'bg-white text-indigo-600 shadow-lg border border-indigo-100 ring-4 ring-indigo-50/50' 
                      : 'text-slate-400 hover:text-slate-600 hover:bg-white/50 border border-transparent'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            {navigation.shiftsSubPage === 'attendance' && navigation.hasPermission('shifts', 'view', 'attendance') && (
              <AttendancePage 
                teams={data.teams} 
                shifts={data.shifts} 
                history={data.attendanceHistory}
                masterEmployees={data.masterEmployees}
                onSave={(rec) => {
                  data.setAttendanceHistory(prev => {
                    const next = [...prev];
                    rec.forEach(r => {
                      const idx = next.findIndex(n => n.employeeId === r.employeeId && n.date === r.date);
                      if (idx > -1) {
                        next[idx] = r;
                      } else {
                        next.push(r);
                      }
                    });
                    return next;
                  });
                }} 
                setSystemBusy={system.setBusy} 
                hasPermission={navigation.hasPermission} 
                currentUser={auth.currentUser!} 
              />
            )}
            {navigation.shiftsSubPage === 'teams' && navigation.hasPermission('shifts', 'view', 'teams') && (
              <TeamsPage 
                teams={data.teams} 
                shifts={data.shifts} 
                sections={data.sections} 
                onMoveMember={async (employeeId: string, targetTeamId: string) => {
                  const member = data.masterEmployees.find(e => e.id === employeeId);
                  if (member) {
                    system.setBusy(true);
                    try {
                      const targetTeam = data.teams.find(t => t.id === targetTeamId);
                      const updated = { 
                        ...member, 
                        teamId: targetTeamId, 
                        teamName: targetTeam?.name || '' 
                      };
                      await syncStaffToGoogleSheets(updated);
                      data.updateMember(updated);
                    } catch (e) {
                      console.error(e);
                      alert("Error moving roster placement.");
                    } finally {
                      system.setBusy(false);
                    }
                  }
                }} 
                onAddMember={async (memberData) => {
                  system.setBusy(true);
                  try {
                    const id = memberData.id || `SP-${Math.floor(100 + Math.random() * 900)}`;
                    const isSpv = ['Supervisor', 'Manager', 'Admin', 'HR', 'HSSEQ', 'Director'].includes(memberData.accessLevel || '') ||
                      (memberData.role || '').toLowerCase().includes('supervisor') ||
                      (memberData.role || '').toLowerCase().includes('manager');

                    const finalMember: Employee = {
                      ...memberData,
                      id,
                      name: memberData.name || '',
                      role: memberData.role || 'Staff',
                      department: memberData.department || 'Operations',
                      section: memberData.section || 'General',
                      teamId: memberData.teamId || '',
                      teamName: memberData.teamName || '',
                      supervisorName: memberData.supervisorName || '',
                      contractHours: memberData.contractHours || 48,
                      status: memberData.status || 'Active',
                      hasSystemAccess: memberData.hasSystemAccess !== undefined ? memberData.hasSystemAccess : (isSpv || !!memberData.username || !!memberData.tempPassword),
                      accessLevel: memberData.accessLevel || (isSpv ? 'Supervisor' : 'Staff'),
                      visibilityScope: memberData.visibilityScope || (isSpv ? 'ALL' : 'SELF'),
                      permissions: memberData.permissions || [],
                      email: memberData.email || '',
                      username: memberData.username || memberData.email || '',
                      tempPassword: memberData.tempPassword || '',
                      offPeriodStart: memberData.offPeriodStart || '',
                      offPeriodEnd: memberData.offPeriodEnd || '',
                      offPeriodType: memberData.offPeriodType || ''
                    };
                    await syncStaffToGoogleSheets(finalMember);
                    data.addMember(finalMember);
                  } catch (e) {
                    console.error(e);
                    alert("Error enrolling candidate.");
                  } finally {
                    system.setBusy(false);
                  }
                }} 
                onUpdateMember={async (memberData) => {
                  system.setBusy(true);
                  try {
                    await syncStaffToGoogleSheets(memberData as Employee);
                    data.updateMember(memberData as Employee);
                  } catch (e) {
                    console.error(e);
                    alert("Error updating roster records.");
                  } finally {
                    system.setBusy(false);
                  }
                }} 
                onDeleteMember={async (employeeId) => {
                  system.setBusy(true);
                  try {
                    await deleteStaffFromGoogleSheets(employeeId);
                    data.deleteMember(employeeId);
                  } catch (e) {
                    console.error(e);
                     alert("Error releasing roster placement.");
                  } finally {
                    system.setBusy(false);
                  }
                }} 
                hasPermission={navigation.hasPermission} 
              />
            )}
            {navigation.shiftsSubPage === 'history' && navigation.hasPermission('shifts', 'view', 'history') && (
              <HistoryPage history={data.attendanceHistory} shifts={data.shifts} teams={data.teams} currentUser={auth.currentUser!} resolveStaffIdentity={data.resolveStaffIdentity} />
            )}
          </div>
        </div>
      )}
      
      {navigation.activeTab === 'settings' && navigation.hasPermission('settings') && (
        <SettingsPage 
          shifts={data.shifts} 
          config={data.config} 
          onUpdateShifts={data.setShifts} 
          onUpdateConfig={data.setConfig} 
          currentUser={auth.currentUser!}
          tierDefaults={data.tierDefaults}
        />
      )}
    </Layout>
  );
};

export default App;
