
import React, { useState } from 'react';
import { User, Phone, Mail, ShieldCheck, Fingerprint, HardHat, Save, RotateCcw, Lock, KeyRound, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { Employee, AccessLevel } from '../types';

interface ProfileSettingsPageProps {
  currentUser: Employee;
  onUpdateProfile: (updated: Employee) => Promise<void>;
}

const ProfileSettingsPage: React.FC<ProfileSettingsPageProps> = ({ currentUser, onUpdateProfile }) => {
  const [formData, setFormData] = useState({
    phone: currentUser.phone || '',
    email: currentUser.email || ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPass, setShowPass] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailChanged = formData.email !== currentUser.email;
    
    if (emailChanged) {
      const proceed = confirm("Updating email address will also update your login username. Proceed?");
      if (!proceed) return;
    }

    setIsSaving(true);
    try {
      await onUpdateProfile({
        ...currentUser,
        phone: formData.phone,
        email: formData.email,
        username: emailChanged ? formData.email : currentUser.username
      });

      alert("Profile updated successfully.");
    } catch (error) {
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.currentPassword !== currentUser.tempPassword) {
      return alert("Current password is incorrect.");
    }

    if (!passwordData.newPassword) return alert("Please enter a new password.");
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return alert("New passwords do not match.");
    }

    if (passwordData.newPassword === passwordData.currentPassword) {
      return alert("New password must be different from current password.");
    }

    setIsUpdatingPass(true);
    try {
      await onUpdateProfile({
        ...currentUser,
        tempPassword: passwordData.newPassword
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      alert("Password updated successfully.");
    } catch (error) {
      alert("Failed to update password. Please try again.");
    } finally {
      setIsUpdatingPass(false);
    }
  };

  const privilegeMatrix: Record<AccessLevel, string[]> = {
    'Admin': ['Full System Configuration', 'Global Registry Management', 'Shift Protocol Control', 'Inventory Governance', 'HR Vault Oversight'],
    'Manager': ['Lead Workshop Management', 'Team Roster Control', 'Inventory Auditing', 'Shift Monitoring'],
    'Supervisor': ['Shift Command & Attendance Authorization', 'Technical Asset Custodian Authority', 'Floor-Level Tool Issuance & Returns', 'Sectional Liability Identification', 'Field Performance Observations'],
    'Audit': ['Quality Control Verifications', 'Inventory Sightings', 'Read-only Dashboards'],
    'HR': ['Staff Records Management', 'Payroll & Document Management', 'Performance Case Review'],
    'Stores': ['Inventory Lifecycle Management', 'Tool Procurement', 'Asset Verification'],
    'HSSEQ': ['Safety Compliance Audits', 'Institutional Bulletins', 'Incident Reporting'],
    'Fleet': ['Shift Deployment Management', 'Fleet Specific Records'],
    'Staff': ['Personal Document Portal', 'Corporate Bulletin Access', 'Helpdesk Ticketing'],
    'Director': ['Full System Oversight', 'Strategic Planning Access', 'Oversight Controls', 'Performance Inspections'],
    'Guest': ['Read-only Viewer access', 'Basic Dashboard Access', 'Operation schedules viewing']
  };

  const userPrivileges = privilegeMatrix[currentUser.accessLevel || 'Staff'];

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 animate-in fade-in duration-300 pb-12">
      
      {/* USER PROFILE HEADER CARD - CLEAN WHITE & BLACK */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 w-full sm:w-auto">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-black text-white rounded-2xl flex items-center justify-center font-black text-lg sm:text-xl shrink-0 shadow-xs">
            {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
          </div>
          
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight truncate">
                {currentUser.name}
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-black text-white text-[8px] font-black uppercase tracking-wider shrink-0">
                {currentUser.accessLevel || 'Staff'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[9px] font-bold text-slate-500 mt-1">
              <div className="flex items-center space-x-1">
                <Fingerprint size={12} className="text-slate-400" />
                <span className="font-mono text-slate-800">{currentUser.id}</span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center space-x-1">
                <HardHat size={12} className="text-slate-400" />
                <span>{currentUser.teamName || 'General Staff'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TWO COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        
        {/* LEFT COLUMN: CONTACT INFO & SECURITY CREDENTIALS */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-6">
          
          {/* CONTACT INFO CARD */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <User size={16} className="text-slate-800" />
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-900">Contact Information</h4>
            </div>

            <form onSubmit={handleSubmitProfile} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[8.5px] font-black text-slate-500 uppercase tracking-wider">Contact Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                    <input 
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-[10px] font-bold text-slate-900 outline-none focus:bg-white focus:border-black transition-all"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      placeholder="e.g. +260 971 000 000"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[8.5px] font-black text-slate-500 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                    <input 
                      type="email"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-[10px] font-bold text-slate-900 outline-none focus:bg-white focus:border-black transition-all"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      placeholder="user@company.com"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-black hover:bg-slate-800 text-white border border-black py-2.5 rounded-xl font-black uppercase tracking-wider text-[9px] transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? <RotateCcw size={13} className="animate-spin" /> : <Save size={13} />}
                  <span>Save Contact Details</span>
                </button>
              </div>
            </form>
          </div>

          {/* SECURITY CREDENTIALS CARD */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Lock size={16} className="text-slate-800" />
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-900">Security & Password</h4>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[8.5px] font-black text-slate-500 uppercase tracking-wider">Current Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                  <input 
                    type={showPass ? "text" : "password"}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-9 py-2 text-[10px] font-bold text-slate-900 outline-none focus:bg-white focus:border-black transition-all"
                    placeholder="Enter current password"
                    value={passwordData.currentPassword}
                    onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[8.5px] font-black text-slate-500 uppercase tracking-wider">New Password</label>
                  <input 
                    type="password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-900 outline-none focus:bg-white focus:border-black transition-all"
                    placeholder="••••••••"
                    value={passwordData.newPassword}
                    onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8.5px] font-black text-slate-500 uppercase tracking-wider">Confirm Password</label>
                  <input 
                    type="password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-900 outline-none focus:bg-white focus:border-black transition-all"
                    placeholder="••••••••"
                    value={passwordData.confirmPassword}
                    onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-1">
                <button 
                  type="submit"
                  disabled={isUpdatingPass}
                  className="w-full bg-black hover:bg-slate-800 text-white border border-black py-2.5 rounded-xl font-black uppercase tracking-wider text-[9px] transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                >
                  {isUpdatingPass ? <RotateCcw size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* RIGHT COLUMN: ACCESS PRIVILEGES */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <ShieldCheck size={16} className="text-slate-800" />
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-900">Access Privileges</h4>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-[9px] font-black text-slate-900 uppercase tracking-wider block mb-2">
                  {currentUser.accessLevel} Permissions
                </span>
                <div className="space-y-2">
                  {userPrivileges.map((p, i) => (
                    <div key={i} className="flex items-start space-x-2 text-slate-700">
                      <CheckCircle2 size={12} className="text-slate-900 mt-0.5 shrink-0" />
                      <span className="text-[9px] font-bold uppercase tracking-tight leading-snug">{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default ProfileSettingsPage;

