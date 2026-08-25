import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { 
  fetchSparesFromGoogleSheets, 
  syncSpareToGoogleSheets, 
  syncSpareReceiptToGoogleSheets, 
  syncSpareIssueToGoogleSheets, 
  deleteSpareFromGoogleSheets,
  fetchTechnicianTasksFromGoogleSheets,
  syncTechnicianTaskToGoogleSheets
} from '../../services/googleSheets';

import { SpareItem, SpareReceiptRecord, SpareIssueRecord, SparesTabProps } from './spares/types';
import { SparesHeader } from './spares/SparesHeader';
import { SparesRegistryTable } from './spares/SparesRegistryTable';
import { SpareReceiptLogsTable } from './spares/SpareReceiptLogsTable';
import { SpareIssueLogsTable } from './spares/SpareIssueLogsTable';
import { ReceiveSpareModal } from './spares/ReceiveSpareModal';
import { IssueSpareModal } from './spares/IssueSpareModal';

export const SparesTab: React.FC<SparesTabProps> = ({
  masterEmployees = [],
  currentUser,
}) => {
  // --- Local Database State & Persistence ---
  const [spares, setSpares] = useState<SpareItem[]>([]);
  const [receipts, setReceipts] = useState<SpareReceiptRecord[]>([]);
  const [issues, setIssues] = useState<SpareIssueRecord[]>([]);
  const [dailyTasks, setDailyTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sub-tabs in Spares view
  const [subTab, setSubTab] = useState<'registry' | 'receiptLogs' | 'issueLogs'>('registry');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter] = useState('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState('ALL');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [subTab, searchQuery, categoryFilter, stockStatusFilter]);

  // Modals / Forms Toggle State
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Form Fields - Receipt Modal
  const [recId, setRecId] = useState('');
  const [recName, setRecName] = useState('');
  const [recDate, setRecDate] = useState(new Date().toISOString().split('T')[0]);
  const [recLocation] = useState('Shelf A1');
  const [recQty, setRecQty] = useState<number>(10);
  const [recUnitCost] = useState<number>(25.00);
  const [recNotes, setRecNotes] = useState('');

  const generateNextSpareId = useCallback(() => {
    const allIds = new Set<string>();
    spares.forEach(s => s?.id && allIds.add(s.id.toUpperCase()));
    receipts.forEach(r => r?.spareId && allIds.add(r.spareId.toUpperCase()));

    let maxNum = 1000;
    allIds.forEach(id => {
      const matches = id.match(/\d+/g);
      if (matches) {
        matches.forEach(mStr => {
          const num = parseInt(mStr, 10);
          if (!isNaN(num) && num > maxNum && num < 999999) {
            maxNum = num;
          }
        });
      }
    });

    let nextCandidate = maxNum + 1;
    while (allIds.has(`SPR-${nextCandidate}`)) {
      nextCandidate++;
    }
    return `SPR-${nextCandidate}`;
  }, [spares, receipts]);

  // Form Fields - Issue Modal
  const [issueSpareId, setIssueSpareId] = useState('');
  const [selectedWorkOrder, setSelectedWorkOrder] = useState('');
  const [issueToId, setIssueToId] = useState('');
  const [issueQty, setIssueQty] = useState<number>(1);
  const [issuePurpose, setIssuePurpose] = useState('');

  // Helper to reconcile spare items with Received History and Issue History from Google Sheets
  // Ensures that registered spares in Spares_Registry are unified with their receipt logs and issue logs,
  // preventing phantom duplicate spares and computing the exact current stock accurately.
  const reconcileSparesFromHistory = useCallback((
    rawSpares: SpareItem[],
    fReceipts: SpareReceiptRecord[],
    fIssues: SpareIssueRecord[]
  ): SpareItem[] => {
    // 1. Filter and clean raw registered spares
    const validRawSpares = (rawSpares || []).filter(s => {
      if (!s || !s.id) return false;
      const idStr = String(s.id).trim().toUpperCase();
      const nameStr = String(s.name || '').trim().toUpperCase();
      if (idStr.startsWith('RCV-') || idStr.startsWith('REC-') || idStr.startsWith('ISS-') || idStr === 'RCV-1786461519464') return false;
      if (nameStr.startsWith('RCV-') || nameStr.startsWith('REC-') || nameStr.startsWith('ISS-')) return false;
      return true;
    });

    // 2. Filter receipts and issues
    const validReceipts = (fReceipts || []).filter(r => {
      if (!r) return false;
      const nameStr = String(r.spareName || '').trim().toUpperCase();
      return nameStr !== '' && !nameStr.startsWith('RCV-') && !nameStr.startsWith('REC-');
    });

    const validIssues = (fIssues || []).filter(i => {
      if (!i) return false;
      const nameStr = String(i.spareName || '').trim().toUpperCase();
      return nameStr !== '' && !nameStr.startsWith('ISS-');
    });

    const getNorm = (val?: string) => (val || '').trim().toLowerCase();

    // Matching helper to connect logs with registered spares
    const isLogMatchingSpare = (
      spare: { id: string; name: string; partNumber?: string; description?: string },
      log: { spareId?: string; partNumber?: string; spareName?: string; description?: string },
      isSingleSpareMode: boolean
    ) => {
      const sId = getNorm(spare.id);
      const sPartNo = getNorm(spare.partNumber);
      const sName = getNorm(spare.name);
      const sDesc = getNorm(spare.description);

      const lSpareId = getNorm(log.spareId);
      const lPartNo = getNorm(log.partNumber);
      const lSpareName = getNorm(log.spareName);
      const lDesc = getNorm(log.description);

      // Direct ID match
      if (lSpareId && (lSpareId === sId || lSpareId === sPartNo)) return true;
      if (sId && (sId === lPartNo || sId === lSpareName)) return true;

      // Part number match
      if (lPartNo && (lPartNo === sPartNo || lPartNo === sId)) return true;

      // Name / Description match
      if (lSpareName && (lSpareName === sName || lSpareName === sDesc)) return true;
      if (lDesc && (lDesc === sName || lDesc === sDesc)) return true;

      // Single spare database mode: When the user only has 1 spare in their Spares_Registry sheet,
      // all receipts and issues in the sheets belong to this single master spare part.
      if (isSingleSpareMode) return true;

      return false;
    };

    const isSingleSpare = validRawSpares.length === 1;
    const result: SpareItem[] = [];

    // Process all registered spares from Spares_Registry sheet
    validRawSpares.forEach(rawSpare => {
      const matchingReceipts = validReceipts.filter(r => isLogMatchingSpare(rawSpare, r, isSingleSpare));
      const matchingIssues = validIssues.filter(i => isLogMatchingSpare(rawSpare, i, isSingleSpare));

      const totalReceivedFromReceipts = matchingReceipts.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);
      const totalIssued = matchingIssues.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);

      const totalReceived = matchingReceipts.length > 0
        ? totalReceivedFromReceipts
        : (Number(rawSpare.initialStock) || Number(rawSpare.currentStock) || 0);

      const currentStock = Math.max(0, totalReceived - totalIssued);

      // Pick best descriptive name (if registry has generic ID like SPR-1001, use the descriptive receipt name)
      let bestName = (rawSpare.name || '').trim();
      const descriptiveReceipt = matchingReceipts.find(r => r.spareName && !r.spareName.startsWith('SPR-') && !r.spareName.startsWith('RCV-'));
      if ((!bestName || bestName.startsWith('SPR-') || bestName.toLowerCase() === 'spare part') && descriptiveReceipt) {
        bestName = descriptiveReceipt.spareName.trim();
      }

      // Pick latest date
      let latestDate = rawSpare.receivedDate || new Date().toISOString().split('T')[0];
      if (matchingReceipts.length > 0) {
        const dates = matchingReceipts.map(r => r.date).filter(Boolean).sort();
        if (dates.length > 0) latestDate = dates[dates.length - 1];
      }

      result.push({
        ...rawSpare,
        id: (rawSpare.id || '').toUpperCase().trim(),
        name: bestName || rawSpare.id,
        description: rawSpare.description || bestName || rawSpare.id,
        initialStock: totalReceived,
        currentStock: currentStock,
        receivedDate: latestDate
      });
    });

    // Fallback ONLY when Spares_Registry is completely empty but receipts exist
    if (validRawSpares.length === 0 && validReceipts.length > 0) {
      const groupedByNorm = new Map<string, SpareReceiptRecord[]>();
      validReceipts.forEach(r => {
        const key = getNorm(r.spareName) || getNorm(r.spareId) || 'general';
        if (!groupedByNorm.has(key)) groupedByNorm.set(key, []);
        groupedByNorm.get(key)!.push(r);
      });

      let nextNum = 1001;
      groupedByNorm.forEach((recGroup, normKey) => {
        const firstRec = recGroup[0];
        const keyId = (firstRec.spareId && !firstRec.spareId.startsWith('RCV-')) ? firstRec.spareId : `SPR-${nextNum++}`;
        const totalRec = recGroup.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);
        const matchingIssues = validIssues.filter(i => getNorm(i.spareName) === normKey || getNorm(i.spareId) === getNorm(keyId));
        const totalIss = matchingIssues.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);

        const dates = recGroup.map(r => r.date).filter(Boolean).sort();
        const latestDate = dates.length > 0 ? dates[dates.length - 1] : new Date().toISOString().split('T')[0];

        result.push({
          id: keyId,
          name: firstRec.spareName || 'Spare Part',
          category: 'General',
          location: 'Main Workshop',
          receivedDate: latestDate,
          initialStock: totalRec,
          currentStock: Math.max(0, totalRec - totalIss),
          unitCost: firstRec.unitCost || 0,
          receivedBy: firstRec.receivedBy || 'Admin'
        });
      });
    }

    return result;
  }, []);

  // Load spares data & daily tasks directly from Google Sheets or local cache
  const loadSparesData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Proactively clean up lingering 'RCV-1786461519464' entry if stored
      deleteSpareFromGoogleSheets('RCV-1786461519464').catch(() => {});

      const { spares: fSpares, receipts: fReceipts, issues: fIssues } = await fetchSparesFromGoogleSheets();
      const reconciled = reconcileSparesFromHistory(fSpares || [], fReceipts || [], fIssues || []);
      setSpares(reconciled);
      setReceipts(fReceipts || []);
      setIssues(fIssues || []);

      // Auto-synchronize the updated quantity to Spares_Registry sheet if it had an older or un-updated quantity
      reconciled.forEach(reconciledSpare => {
        const rawMatch = (fSpares || []).find(s => s.id === reconciledSpare.id || s.name?.toLowerCase() === reconciledSpare.name?.toLowerCase());
        if (!rawMatch || rawMatch.currentStock !== reconciledSpare.currentStock || rawMatch.name !== reconciledSpare.name) {
          syncSpareToGoogleSheets(reconciledSpare).catch(() => {});
        }
      });
    } catch {
      const loadedSpares = localStorage.getItem('workshop_spares');
      const loadedReceipts = localStorage.getItem('workshop_spares_receipts');
      const loadedIssues = localStorage.getItem('workshop_spares_issues');
      const parsedSpares = loadedSpares ? JSON.parse(loadedSpares) : [];
      const parsedReceipts = loadedReceipts ? JSON.parse(loadedReceipts) : [];
      const parsedIssues = loadedIssues ? JSON.parse(loadedIssues) : [];
      const reconciled = reconcileSparesFromHistory(parsedSpares, parsedReceipts, parsedIssues);
      setSpares(reconciled);
      setReceipts(parsedReceipts);
      setIssues(parsedIssues);
    } finally {
      setIsLoading(false);
    }

    try {
      const tasks = await fetchTechnicianTasksFromGoogleSheets();
      setDailyTasks(tasks || []);
    } catch {
      try {
        const raw = localStorage.getItem('workshop_technician_tasks');
        setDailyTasks(raw ? JSON.parse(raw) : []);
      } catch {}
    }
  }, [reconcileSparesFromHistory]);

  useEffect(() => {
    loadSparesData();
  }, [loadSparesData]);

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // --- Handlers ---
  const handleAddNewSpare = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = recName.trim();
    if (!cleanName) {
      alert('Please fill out the spare part name.');
      return;
    }

    const cleanId = recId.trim().toUpperCase();

    // Check if a spare part with this name (case-insensitive) OR ID already exists
    const existingByName = spares.find(s => (s.name || '').trim().toLowerCase() === cleanName.toLowerCase());
    const existingById = cleanId ? spares.find(s => s.id.toUpperCase() === cleanId) : undefined;
    const existing = existingByName || existingById;

    const finalId = existing ? existing.id : (cleanId || generateNextSpareId()).toUpperCase();

    let updatedSpares = [...spares];
    const timestampStr = recDate || new Date().toISOString().split('T')[0];
    let targetSpare: SpareItem;

    if (existing) {
      targetSpare = {
        ...existing,
        initialStock: (existing.initialStock || 0) + recQty,
        currentStock: (existing.currentStock || 0) + recQty,
        receivedDate: timestampStr,
        notes: recNotes ? `${existing.notes || ''} | [Update]: ${recNotes}` : existing.notes
      };
      updatedSpares = spares.map(s => s.id === existing.id ? targetSpare : s);
      triggerToast(`Received ${recQty}x units for ${existing.name}. Stock updated.`);
    } else {
      targetSpare = {
        id: finalId,
        name: cleanName,
        category: 'General',
        location: recLocation.trim(),
        receivedDate: timestampStr,
        initialStock: recQty,
        currentStock: recQty,
        unitCost: recUnitCost,
        receivedBy: currentUser.name,
        notes: recNotes.trim()
      };
      updatedSpares.unshift(targetSpare);
      triggerToast(`Successfully enrolled new Spare item: ${recName}`);
    }

    const newReceipt: SpareReceiptRecord = {
      id: `RCV-${Date.now()}`,
      spareId: finalId,
      spareName: recName.trim() || (existing ? existing.name : ''),
      quantity: recQty,
      date: timestampStr,
      receivedBy: currentUser.name,
      supplier: 'Direct Stores Entry'
    };

    const nextReceipts = [newReceipt, ...receipts];
    const reconciledSpares = reconcileSparesFromHistory(updatedSpares, nextReceipts, issues);
    setSpares(reconciledSpares);
    setReceipts(nextReceipts);

    localStorage.setItem('workshop_spares', JSON.stringify(reconciledSpares));
    localStorage.setItem('workshop_spares_receipts', JSON.stringify(nextReceipts));

    syncSpareToGoogleSheets(targetSpare).catch(() => {});
    syncSpareReceiptToGoogleSheets(newReceipt).catch(() => {});

    setRecId('');
    setRecName('');
    setRecNotes('');
    setRecDate(new Date().toISOString().split('T')[0]);
    setIsReceiptModalOpen(false);
  };

  const handleIssueSpare = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueSpareId) {
      alert('Please choose a spare item to issue.');
      return;
    }
    if (!issueToId) {
      alert('Please select an authorized recipient.');
      return;
    }
    if (issueQty <= 0) {
      alert('Please issue 1 or more units.');
      return;
    }

    const spareToUpdate = spares.find(s => s.id === issueSpareId);
    if (!spareToUpdate) {
      alert('Selected spare part could not be found.');
      return;
    }

    if (spareToUpdate.currentStock < issueQty) {
      alert(`Insufficient stock. Only ${spareToUpdate.currentStock} units exist, but you requested to issue ${issueQty}.`);
      return;
    }

    const updatedSpare: SpareItem = {
      ...spareToUpdate,
      currentStock: spareToUpdate.currentStock - issueQty
    };
    const updatedSpares = spares.map(s => s.id === issueSpareId ? updatedSpare : s);

    const staffMember = masterEmployees.find(e => e.id === issueToId);
    const recipientName = staffMember ? staffMember.name : issueToId;

    const linkedTask = dailyTasks.find(t => (t.jobCardNumber && t.jobCardNumber === selectedWorkOrder) || (t.id && t.id === selectedWorkOrder));
    
    let purposeText = '';
    if (linkedTask) {
      purposeText = `Work Order #${linkedTask.jobCardNumber}${linkedTask.equipmentRef ? ' (' + linkedTask.equipmentRef + ')' : ''}`;
      if (issuePurpose.trim()) {
        purposeText += `: ${issuePurpose.trim()}`;
      }
    } else {
      purposeText = issuePurpose.trim() || 'General Issue';
    }

    const newIssue: SpareIssueRecord = {
      id: `ISS-${Date.now()}`,
      spareId: issueSpareId,
      spareName: spareToUpdate.name,
      issuedToId: issueToId,
      issuedToName: recipientName,
      quantity: issueQty,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      issuedBy: currentUser.name,
      purpose: purposeText,
      workOrderNumber: linkedTask ? linkedTask.jobCardNumber : (selectedWorkOrder || undefined),
      comments: issuePurpose.trim() || undefined
    };

    const nextIssues = [newIssue, ...issues];
    const reconciledSpares = reconcileSparesFromHistory(updatedSpares, receipts, nextIssues);
    setSpares(reconciledSpares);
    setIssues(nextIssues);

    localStorage.setItem('workshop_spares', JSON.stringify(reconciledSpares));
    localStorage.setItem('workshop_spares_issues', JSON.stringify(nextIssues));

    syncSpareToGoogleSheets(updatedSpare).catch(() => {});
    syncSpareIssueToGoogleSheets(newIssue).catch(() => {});

    if (linkedTask) {
      const issueNote = `${issueQty}x ${spareToUpdate.name}${issuePurpose.trim() ? ' (' + issuePurpose.trim() + ')' : ''}`;
      const existingUsed = linkedTask.sparesUsed || '';
      const newSparesUsed = existingUsed ? `${existingUsed}, ${issueNote}` : issueNote;
      
      const updatedTask = {
        ...linkedTask,
        sparesUsed: newSparesUsed,
        issuedItemId: issueSpareId,
        issuedQty: (linkedTask.issuedQty || 0) + issueQty
      };

      syncTechnicianTaskToGoogleSheets(updatedTask).catch(() => {});
      setDailyTasks(prev => prev.map(t => (t.id === linkedTask.id || t.jobCardNumber === linkedTask.jobCardNumber) ? updatedTask : t));
    }

    triggerToast(`Issued ${issueQty}x ${spareToUpdate.name} to ${recipientName}`);
    
    setIssueSpareId('');
    setSelectedWorkOrder('');
    setIssueQty(1);
    setIssuePurpose('');
    setIsIssueModalOpen(false);
  };

  const deleteSpareItem = (id: string) => {
    if (window.confirm('Are you sure you want to delete this spare category from the register?')) {
      const nextSpares = spares.filter(s => s.id !== id);
      setSpares(nextSpares);
      localStorage.setItem('workshop_spares', JSON.stringify(nextSpares));
      deleteSpareFromGoogleSheets(id).catch(() => {});
      triggerToast('Spare SKU Deleted Successfully');
    }
  };

  // --- Computeds ---
  const stats = useMemo(() => {
    const totalUnique = spares.length;
    const totalQty = spares.reduce((acc, s) => acc + s.currentStock, 0);
    const lowStock = spares.filter(s => s.currentStock > 0 && s.currentStock <= 3).length;
    const outOfStock = spares.filter(s => s.currentStock === 0).length;
    const totalIssued = issues.reduce((acc, i) => acc + i.quantity, 0);

    return {
      totalUnique,
      totalQty,
      lowStock,
      outOfStock,
      totalIssued
    };
  }, [spares, issues]);

  const filteredSpares = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return spares.filter(item => {
      const matchesSearch = (item.name || '').toLowerCase().includes(q) || 
                            (item.id || '').toLowerCase().includes(q);
      
      let matchesStatus = true;
      if (stockStatusFilter === 'LOW') {
        matchesStatus = item.currentStock > 0 && item.currentStock <= 3;
      } else if (stockStatusFilter === 'OUT') {
        matchesStatus = item.currentStock === 0;
      } else if (stockStatusFilter === 'INSTOCK') {
        matchesStatus = item.currentStock > 3;
      }

      return matchesSearch && matchesStatus;
    });
  }, [spares, searchQuery, stockStatusFilter]);

  // Paginated arrays
  const paginatedSpares = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSpares.slice(start, start + itemsPerPage);
  }, [filteredSpares, currentPage, itemsPerPage]);

  const paginatedReceipts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return receipts.slice(start, start + itemsPerPage);
  }, [receipts, currentPage, itemsPerPage]);

  const paginatedIssues = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return issues.slice(start, start + itemsPerPage);
  }, [issues, currentPage, itemsPerPage]);

  return (
    <div className="space-y-4 animate-in fade-in duration-500 max-w-full">
      {/* Toast Feedback */}
      {successToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[500] animate-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 border border-slate-850">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span className="text-[9.5px] font-black uppercase tracking-wider">{successToast}</span>
          </div>
        </div>
      )}

      {/* Header & Sub-tab navigation */}
      <SparesHeader
        isLoading={isLoading}
        onRefresh={loadSparesData}
        stats={stats}
        subTab={subTab}
        setSubTab={setSubTab}
        receiptsCount={receipts.length}
        issuesCount={issues.length}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        stockStatusFilter={stockStatusFilter}
        setStockStatusFilter={setStockStatusFilter}
        onOpenReceiptModal={() => {
          setRecId(generateNextSpareId());
          setRecName('');
          setRecQty(1);
          setIsReceiptModalOpen(true);
        }}
        onOpenIssueModal={() => {
          if (spares.filter(s => s.currentStock > 0).length === 0) {
            alert('There are no spare parts currently available in stock to issue.');
            return;
          }
          setIssueQty(1);
          setIsIssueModalOpen(true);
        }}
        availableSparesCount={spares.filter(s => s.currentStock > 0).length}
      />

      {/* Sub-tab Views */}
      {subTab === 'registry' && (
        <SparesRegistryTable
          isLoading={isLoading}
          filteredSpares={filteredSpares}
          paginatedSpares={paginatedSpares}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
          onReceiveItem={(item) => {
            setRecId(item.id);
            setRecName(item.name);
            setRecQty(1);
            setIsReceiptModalOpen(true);
          }}
          onIssueItem={(item) => {
            if (item.currentStock <= 0) {
              alert('This item is currently out of stock.');
              return;
            }
            setIssueSpareId(item.id);
            setIssueQty(1);
            setIsIssueModalOpen(true);
          }}
          onDeleteItem={deleteSpareItem}
        />
      )}

      {subTab === 'receiptLogs' && (
        <SpareReceiptLogsTable
          isLoading={isLoading}
          receipts={receipts}
          paginatedReceipts={paginatedReceipts}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
        />
      )}

      {subTab === 'issueLogs' && (
        <SpareIssueLogsTable
          isLoading={isLoading}
          issues={issues}
          paginatedIssues={paginatedIssues}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
        />
      )}

      {/* Modal: Receive Stock */}
      <ReceiveSpareModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        onSubmit={handleAddNewSpare}
        recId={recId}
        setRecId={setRecId}
        recName={recName}
        setRecName={setRecName}
        recDate={recDate}
        setRecDate={setRecDate}
        recQty={recQty}
        setRecQty={setRecQty}
        recNotes={recNotes}
        setRecNotes={setRecNotes}
        currentUser={currentUser}
        spares={spares}
        generateNextSpareId={generateNextSpareId}
      />

      {/* Modal: Issue Spare */}
      <IssueSpareModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        onSubmit={handleIssueSpare}
        issueSpareId={issueSpareId}
        setIssueSpareId={setIssueSpareId}
        selectedWorkOrder={selectedWorkOrder}
        setSelectedWorkOrder={setSelectedWorkOrder}
        issueToId={issueToId}
        setIssueToId={setIssueToId}
        issueQty={issueQty}
        setIssueQty={setIssueQty}
        issuePurpose={issuePurpose}
        setIssuePurpose={setIssuePurpose}
        currentUser={currentUser}
        masterEmployees={masterEmployees}
        spares={spares}
        dailyTasks={dailyTasks}
      />
    </div>
  );
};

export default SparesTab;
