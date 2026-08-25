import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileLock2, 
  MessageSquare, 
  ShieldAlert, 
  Megaphone, 
  Briefcase,
  Plus,
  Link,
  Lock,
  ChevronRight,
  ExternalLink,
  FileBarChart,
  Users,
  Fingerprint
} from 'lucide-react';
import { Employee, StaffDocument, GrievanceRecord, AccessLevel, ExternalResource, Bulletin, PerformanceObservation, VisibilityScope, ToolUsageRecord, BulletinAttachment, EngagementInquiry, EngagementStatus } from '../types';
import Card from '../components/Card';

// Sub-component Imports
import BulletinTab from '../components/hr/BulletinTab';
import HRArchivesTab from '../components/hr/HRArchivesTab';
import CasesTab from '../components/hr/CasesTab';
import SupportTab from '../components/hr/SupportTab';
import EngagementHub from '../components/hr/EngagementHub';
import HRReportTab from '../components/hr/HRReportTab';
import CaseReviewModal from '../components/hr/CaseReviewModal';
import { PostBulletinModal, UploadDocumentModal, LinkResourceModal, ArtifactViewerModal } from '../components/hr/HRModals';

interface HRVaultPageProps {
  currentUser: Employee; 
  masterEmployees: Employee[];
  tierDefaults: Record<string, { permissions: string[], scope: VisibilityScope }>;
  observations: PerformanceObservation[];
  onUpdateObservations: (obs: PerformanceObservation[]) => void;
  bulletins: Bulletin[];
  onUpdateBulletins: (b: Bulletin[]) => void;
  documents: StaffDocument[];
  onUpdateDocuments: (d: StaffDocument[]) => void;
  resources: ExternalResource[];
  onUpdateResources: (r: ExternalResource[]) => void;
  toolLogs: ToolUsageRecord[];
  onUpdateUsageLogs?: (logs: ToolUsageRecord[]) => void;
  grievances: GrievanceRecord[];
  onUpdateGrievances: (g: GrievanceRecord[]) => void;
  setSystemBusy: (busy: boolean) => void;
}

const HRVaultPage: React.FC<HRVaultPageProps> = ({ 
  currentUser, 
  masterEmployees, 
  tierDefaults, 
  observations, 
  onUpdateObservations, 
  bulletins, 
  onUpdateBulletins, 
  documents, 
  onUpdateDocuments, 
  resources, 
  onUpdateResources, 
  toolLogs, 
  onUpdateUsageLogs,
  grievances,
  onUpdateGrievances,
  setSystemBusy 
}) => {
  const [activeTab, setActiveTab] = useState<'bulletin' | 'archives' | 'concerns' | 'performance' | 'engagement' | 'report'>('bulletin');
  const [showBulletinModal, setShowBulletinModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [viewingAttachment, setViewingAttachment] = useState<BulletinAttachment | null>(null);
  const [selectedReviewCase, setSelectedReviewCase] = useState<any | null>(null);
  const [engagementInquiries, setEngagementInquiries] = useState<EngagementInquiry[]>([]);
  
  const isHRAdmin = 
    currentUser?.accessLevel === 'Admin' || 
    currentUser?.accessLevel === 'HR' || 
    currentUser?.accessLevel === 'Manager' || 
    currentUser?.accessLevel === 'Supervisor' || 
    currentUser?.accessLevel === 'Director' ||
    (currentUser?.role && (currentUser.role.toLowerCase().includes('supervisor') || currentUser.role.toLowerCase().includes('manager')));

  // Load and Normalize Engagement Data
  useEffect(() => {
    const loadEngagement = async () => {
      try {
        const raw = localStorage.getItem('SHIFTPRO_PERSISTED_DATABASE');
        const data = raw ? JSON.parse(raw) : null;
        if (data?.Engagement_Inquiries) {
        // FUZZY PROPERTY MAPPING: Resolves casing discrepancies in Sheet Headers (e.g. ID vs id vs Id)
        const fuzzyGet = (obj: any, key: string) => {
          const foundKey = Object.keys(obj).find(k => k.toLowerCase().replace(/_/g, '') === key.toLowerCase().replace(/_/g, ''));
          return foundKey ? obj[foundKey] : undefined;
        };

        setEngagementInquiries(data.Engagement_Inquiries.map((i: any) => {
          const rawStatus = (fuzzyGet(i, 'status') || 'Submitted').toString().trim().toUpperCase();
          let normalizedStatus: EngagementStatus = 'Submitted';
          
          if (rawStatus === 'SUBMITTED') normalizedStatus = 'Submitted';
          else if (['EEC_REVIEW', 'EEC REVIEW', 'EECVET'].includes(rawStatus)) normalizedStatus = 'EEC_Review';
          else if (['HR_PENDING', 'HRPENDING', 'HRADMIN'].includes(rawStatus)) normalizedStatus = 'HR_Pending';
          else if (['DIRECTOR_WAIT', 'DIRECTORWAIT', 'DIRECTOR'].includes(rawStatus)) normalizedStatus = 'Director_Wait';
          else if (['PUBLISHED', 'RELEASED'].includes(rawStatus)) normalizedStatus = 'Published';
          else normalizedStatus = (fuzzyGet(i, 'status') as any) || 'Submitted';

          return {
            id: fuzzyGet(i, 'id') || '',
            staffId: fuzzyGet(i, 'staffid') || '',
            subject: fuzzyGet(i, 'subject') || 'UNSPECIFIED',
            message: fuzzyGet(i, 'message') || 'NO_MESSAGE',
            timestamp: fuzzyGet(i, 'timestamp') || '',
            status: normalizedStatus,
            hrAnswer: fuzzyGet(i, 'hranswer') || '',
            directorAnswer: fuzzyGet(i, 'directoranswer') || '',
            finalGuidance: fuzzyGet(i, 'finalguidance') || '',
            publishedDate: fuzzyGet(i, 'publisheddate') || '',
            isEscalated: String(fuzzyGet(i, 'isescalated') || 'FALSE').toUpperCase() === 'TRUE'
          };
        }));
      }
      } catch (e) { console.error(e); }
    };
    loadEngagement();
  }, []);

  const isOver30Days = (dateStr: string) => {
    if (!dateStr) return false;
    const date = new Date(dateStr.split('T')[0].split(' ')[0]);
    return (Date.now() - date.getTime()) > 30 * 24 * 60 * 60 * 1000;
  };

  const activeBulletins = useMemo(() => {
    const sorted = [...bulletins].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    if (sorted.length <= 5) return sorted;
    return sorted.filter((b, idx) => idx < 5 || !isOver30Days(b.date));
  }, [bulletins]);

  const activeDocuments = useMemo(() => {
    const sorted = [...documents].filter(d => isHRAdmin || d.staffId === currentUser?.id || d.staffId === 'ALL')
      .sort((a, b) => (b.dateUploaded || '').localeCompare(a.dateUploaded || ''));
    if (sorted.length <= 5) return sorted;
    return sorted.filter((d, idx) => idx < 5 || !isOver30Days(d.dateUploaded));
  }, [documents, isHRAdmin, currentUser]);

  const activeGrievances = useMemo(() => {
    const base = grievances.filter(g => {
      if (isHRAdmin) return g.status !== 'Resolved' && g.status !== 'Closed';
      return g.staffId === currentUser.id && g.status !== 'Resolved';
    }).sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
    if (base.length <= 5) return base;
    return base.filter((g, idx) => idx < 5 || !isOver30Days(g.timestamp));
  }, [grievances, isHRAdmin, currentUser]);

  const escalatedCases = useMemo(() => {
    const behavioral = observations.filter(o => o.isEscalatedToHR && o.status !== 'Resolved').map(o => ({
       id: o.id,
       staffId: o.staffId,
       staffName: masterEmployees.find(e => e.id === o.staffId)?.name || 'Unknown',
       type: 'Behavioral' as const,
       category: o.category,
       date: String(o.timestamp || '').split('T')[0].split(' ')[0],
       summary: o.note,
       priority: o.isPositive ? 'Low' : 'High',
       source: `Escalated by Superior: ${o.observerName}`,
       raw: o
    }));

    const assetVariances = toolLogs.filter(l => l.escalationStatus === 'Escalated-to-HR').map(l => ({
       id: l.id,
       staffId: l.staffId,
       staffName: l.staffName,
       type: 'Asset Liability' as const,
       category: l.conditionOnReturn || 'Variance',
       date: l.discoveryDate || l.date,
       summary: `Discrepancy: ${l.toolName} (x${l.quantity}). Value: $${l.monetaryValue || 0}`,
       priority: 'Critical',
       source: 'Automated Audit Trace',
       raw: l
    }));

    const allActive = [...behavioral, ...assetVariances].sort((a,b) => (b.date || '').localeCompare(a.date || ''));
    if (allActive.length <= 5) return allActive;
    return allActive.filter((c, idx) => idx < 5 || !isOver30Days(c.date));
  }, [observations, toolLogs, masterEmployees]);

  const handlePostBulletin = async (b: Bulletin) => {
    setSystemBusy(true);
    try {
       onUpdateBulletins([b, ...bulletins]);
       setShowBulletinModal(false);
    } finally { setSystemBusy(false); }
  };

  const handlePostGrievance = async (g: GrievanceRecord) => {
    setSystemBusy(true);
    try {
       onUpdateGrievances([g, ...grievances]);
    } finally { setSystemBusy(false); }
  };

  const handleResolveGrievance = async (id: string, ruling: string, isPublic: boolean) => {
    const target = grievances.find(g => g.id === id);
    if (!target) return;
    setSystemBusy(true);
    try {
       const updated: GrievanceRecord = { 
          ...target, 
          status: 'Resolved', 
          response: ruling, 
          responderName: currentUser.name, 
          isPublicResponse: isPublic 
       };
       onUpdateGrievances(grievances.map(g => g.id === id ? updated : g));
    } finally { setSystemBusy(false); }
  };

  const handleUploadDoc = async (d: StaffDocument) => {
    setSystemBusy(true);
    try {
       onUpdateDocuments([d, ...documents]);
       setShowDocModal(false);
    } finally { setSystemBusy(false); }
  };

  const handleAddResource = async (r: ExternalResource) => {
    setSystemBusy(true);
    try {
       onUpdateResources([r, ...resources]);
       setShowLinkModal(false);
    } finally { setSystemBusy(false); }
  };

  const handleCaseResolution = async (protocol: string, notes: string) => {
    if (!selectedReviewCase) return;
    setSystemBusy(true);
    try {
      const { type, raw } = selectedReviewCase;
      const timestamp = new Date().toLocaleString();
      const forensicVerdict = ` | [VERDICT AUTHORIZED BY: ${currentUser.name} | DATE: ${timestamp}] Resolution Protocol: [${protocol}]. Notes: ${notes}`;

      if (type === 'Behavioral') {
        const updatedObs: PerformanceObservation = { 
          ...raw, 
          status: 'Resolved', 
          note: raw.note + forensicVerdict 
        };
        onUpdateObservations(observations.map(o => o.id === updatedObs.id ? updatedObs : o));
      } else {
        const updatedLog: ToolUsageRecord = { 
          ...raw, 
          escalationStatus: 'Resolved', 
          isReturned: protocol === 'WAIVED' ? raw.isReturned : true,
          comment: (raw.comment || '') + forensicVerdict 
        };
        if (onUpdateUsageLogs) {
           onUpdateUsageLogs(toolLogs.map(l => l.id === updatedLog.id ? updatedLog : l));
        }
      }
    } finally {
      setSystemBusy(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 overflow-visible pb-20">
      {/* MODALS */}
      {showBulletinModal && <PostBulletinModal onSave={handlePostBulletin} onCancel={() => setShowBulletinModal(false)} currentUser={currentUser} />}
      {showDocModal && <UploadDocumentModal onSave={handleUploadDoc} onCancel={() => setShowDocModal(false)} masterEmployees={masterEmployees} />}
      {showLinkModal && <LinkResourceModal onSave={handleAddResource} onCancel={() => setShowLinkModal(false)} />}
      {viewingAttachment && <ArtifactViewerModal attachment={viewingAttachment} onClose={() => setViewingAttachment(null)} />}
      {selectedReviewCase && (
        <CaseReviewModal 
          caseData={selectedReviewCase} 
          onClose={() => setSelectedReviewCase(null)} 
          onResolve={handleCaseResolution} 
        />
      )}

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm print:hidden">
        <div className="flex items-center space-x-4">
           <div className="w-12 h-12 bg-[#0F1135] rounded-2xl flex items-center justify-center text-white shadow-lg ring-4 ring-indigo-50 shrink-0">
              <FileLock2 size={24} />
           </div>
           <div>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">HR HUB</h2>
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1.5">Governance Command Central</p>
           </div>
        </div>

        <div className="hidden lg:flex items-center space-x-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
           <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">
              {isHRAdmin ? 'ADMINISTRATOR SESSION ACTIVE' : `CUSTODIAN: ${currentUser.name}`}
           </span>
        </div>
      </div>

      <div className="flex justify-center w-full mt-2 print:hidden">
        <div className="flex flex-wrap justify-center items-center gap-2 bg-slate-50/80 backdrop-blur-md p-2 rounded-[2rem] border border-slate-200 shadow-sm transition-all max-w-full overflow-hidden">
          {[
            { id: 'bulletin', icon: <Megaphone size={14} />, label: 'Bulletin' },
            { id: 'archives', icon: <Briefcase size={14} />, label: 'Archives' },
            { id: 'engagement', icon: <Users size={14} />, label: 'Engagement' },
            ...(isHRAdmin ? [{ id: 'performance', icon: <ShieldAlert size={14} />, label: 'Cases' }] : []),
            { id: 'concerns', icon: <MessageSquare size={14} />, label: 'Support' },
            ...(isHRAdmin ? [{ id: 'report', icon: <FileBarChart size={14} />, label: 'Report' }] : [])
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id as any)} 
              className={`flex items-center space-x-2.5 px-6 py-3 rounded-[1.2rem] font-black uppercase text-[10px] tracking-widest transition-all cursor-pointer active:scale-95 whitespace-nowrap ${
                activeTab === tab.id 
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

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className={activeTab === 'report' || activeTab === 'engagement' ? 'xl:col-span-12' : 'xl:col-span-8 space-y-8'}>
          
          {activeTab === 'engagement' && (
            <EngagementHub 
              currentUser={currentUser} 
              inquiries={engagementInquiries}
              setInquiries={setEngagementInquiries}
              setSystemBusy={setSystemBusy}
            />
          )}

          {activeTab === 'bulletin' && (
            <BulletinTab 
              bulletins={activeBulletins}
              isHRAdmin={isHRAdmin}
              onShowPostModal={() => setShowBulletinModal(true)}
              onOpenAttachment={(att) => setViewingAttachment(att)}
            />
          )}

          {activeTab === 'archives' && (
            <HRArchivesTab 
              documents={activeDocuments}
              isHRAdmin={isHRAdmin}
              currentUser={currentUser}
              onShowUploadModal={() => setShowDocModal(true)}
              onOpenAttachment={(att) => setViewingAttachment(att)}
            />
          )}

          {activeTab === 'performance' && isHRAdmin && (
            <CasesTab cases={escalatedCases} onReview={setSelectedReviewCase} />
          )}

          {activeTab === 'concerns' && (
            <SupportTab 
              grievances={activeGrievances}
              currentUser={currentUser}
              onPostGrievance={handlePostGrievance}
              onResolveGrievance={handleResolveGrievance}
            />
          )}

          {activeTab === 'report' && isHRAdmin && (
            <HRReportTab 
              currentUser={currentUser}
              grievances={grievances}
              observations={observations}
              toolLogs={toolLogs}
              bulletins={bulletins}
              documents={documents}
            />
          )}
        </div>

        {/* SIDEBAR ASSETS */}
        {activeTab !== 'report' && activeTab !== 'engagement' && (
          <div className="xl:col-span-4 space-y-8">
             <Card title="" className="rounded-[2rem] border-slate-100 shadow-sm" headerAction={
                <div className="flex items-center justify-between w-full">
                   <div className="flex items-center space-x-2">
                      <Link size={14} className="text-indigo-600" />
                      <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Institutional Links</h4>
                   </div>
                   {isHRAdmin && (
                      <button onClick={() => setShowLinkModal(true)} className="p-1.5 bg-slate-50 text-indigo-600 rounded-lg border border-slate-100 hover:bg-indigo-50 transition-colors">
                         <Plus size={12}/>
                      </button>
                   )}
                </div>
             }>
                <div className="space-y-3 pt-4">
                   {resources.length === 0 ? (
                      <div className="py-8 text-center">
                         <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Baseline Portals Clear</p>
                      </div>
                   ) : resources.map(res => (
                      <a 
                        key={res.id} 
                        href={res.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all group shadow-sm"
                      >
                         <div className="flex items-center space-x-4">
                            <div className="p-2 bg-white rounded-xl text-slate-400 group-hover:text-indigo-600 transition-colors shadow-inner">
                               <Fingerprint size={16} />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-slate-700 uppercase tracking-tight leading-none">{res.title}</p>
                              <p className="text-[7.5px] font-black text-slate-400 uppercase mt-1 tracking-widest">{res.category}</p>
                            </div>
                         </div>
                         <ChevronRight size={14} className="text-slate-200 group-hover:text-indigo-400 transition-transform group-hover:translate-x-1" />
                      </a>
                   ))}
                </div>
             </Card>

             <div className="p-8 bg-slate-900 rounded-[2.5rem] text-center space-y-6 shadow-2xl relative overflow-hidden group">
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mx-auto border border-white/10 shadow-inner relative z-10">
                   <Lock size={24} className="text-indigo-500" />
                </div>
                <div className="space-y-2 relative z-10">
                  <p className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Institutional Secure</p>
                  <p className="text-[8.5px] font-medium text-slate-500 uppercase tracking-widest leading-relaxed">
                    Confidential Personnel Data protected by Institutional Governance Protocols. 
                  </p>
                </div>
                <div className="pt-4 relative z-10">
                   <span className="text-[7px] font-black text-indigo-400 uppercase tracking-widest border border-indigo-400/30 px-3 py-1 rounded-lg">ENCRYPTION: AES-256</span>
                </div>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default HRVaultPage;