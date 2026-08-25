import React from 'react';
import { 
  Package, 
  ShoppingBag, 
  AlertCircle, 
  ArrowUpRight, 
  PlusCircle, 
  MinusCircle, 
  Search,
  RotateCw,
  Loader2
} from 'lucide-react';

interface SparesHeaderProps {
  isLoading?: boolean;
  onRefresh?: () => void;
  stats: {
    totalUnique: number;
    totalQty: number;
    lowStock: number;
    outOfStock: number;
    totalIssued: number;
  };
  subTab: 'registry' | 'receiptLogs' | 'issueLogs';
  setSubTab: (tab: 'registry' | 'receiptLogs' | 'issueLogs') => void;
  receiptsCount: number;
  issuesCount: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  stockStatusFilter: string;
  setStockStatusFilter: (status: string) => void;
  onOpenReceiptModal: () => void;
  onOpenIssueModal: () => void;
  availableSparesCount: number;
}

export const SparesHeader: React.FC<SparesHeaderProps> = ({
  isLoading = false,
  onRefresh,
  stats,
  subTab,
  setSubTab,
  receiptsCount,
  issuesCount,
  searchQuery,
  setSearchQuery,
  stockStatusFilter,
  setStockStatusFilter,
  onOpenReceiptModal,
  onOpenIssueModal,
  availableSparesCount
}) => {
  return (
    <div className="space-y-4">
      {/* Spares Summary Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-100 p-4 rounded-[1.6rem] shadow-xs flex items-center space-x-3">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <Package size={16} />
          </div>
          <div>
            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Total Spare Types</p>
            <h4 className="text-base font-black text-slate-800 leading-none">
              {isLoading ? <span className="inline-block w-8 h-4 bg-slate-100 rounded animate-pulse" /> : stats.totalUnique}
            </h4>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-4 rounded-[1.6rem] shadow-xs flex items-center space-x-3">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <ShoppingBag size={16} />
          </div>
          <div>
            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Quantity in Stock</p>
            <h4 className="text-base font-black text-slate-800 leading-none">
              {isLoading ? (
                <span className="inline-block w-12 h-4 bg-slate-100 rounded animate-pulse" />
              ) : (
                <>
                  {stats.totalQty} <span className="text-[10px] text-slate-400 font-bold">Units</span>
                </>
              )}
            </h4>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-4 rounded-[1.6rem] shadow-xs flex items-center space-x-3">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <AlertCircle size={16} />
          </div>
          <div>
            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Low Stock Alert</p>
            <h4 className="text-base font-black text-slate-800 leading-none">
              {isLoading ? (
                <span className="inline-block w-10 h-4 bg-slate-100 rounded animate-pulse" />
              ) : (
                <>
                  {stats.lowStock} <span className="text-[9px] text-amber-600 uppercase font-bold">low</span>
                  {stats.outOfStock > 0 && <span className="text-[9px] text-rose-500 font-extrabold ml-1"> / {stats.outOfStock} out</span>}
                </>
              )}
            </h4>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-4 rounded-[1.6rem] shadow-xs flex items-center space-x-3">
          <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
            <ArrowUpRight size={16} />
          </div>
          <div>
            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Total Issued</p>
            <h4 className="text-base font-black text-slate-800 leading-none">
              {isLoading ? (
                <span className="inline-block w-12 h-4 bg-slate-100 rounded animate-pulse" />
              ) : (
                <>
                  {stats.totalIssued} <span className="text-[10px] text-slate-400 font-bold">Issued</span>
                </>
              )}
            </h4>
          </div>
        </div>
      </div>

      {/* Main Action Bar + Navigation */}
      <div className="bg-white p-4 border border-slate-100 rounded-[2rem] shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl w-full lg:w-auto self-start overflow-x-auto">
            <button
              onClick={() => setSubTab('registry')}
              className={`flex-1 lg:flex-none text-[8.5px] font-black uppercase tracking-wider px-3.5 py-2 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                subTab === 'registry' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Spare Parts Inventory
            </button>
            <button
              onClick={() => setSubTab('receiptLogs')}
              className={`flex-1 lg:flex-none text-[8.5px] font-black uppercase tracking-wider px-3.5 py-2 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                subTab === 'receiptLogs' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Receive History ({isLoading ? '...' : receiptsCount})
            </button>
            <button
              onClick={() => setSubTab('issueLogs')}
              className={`flex-1 lg:flex-none text-[8.5px] font-black uppercase tracking-wider px-3.5 py-2 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                subTab === 'issueLogs' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Issue History ({isLoading ? '...' : issuesCount})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-xs disabled:opacity-50"
                title="Refresh and sync from Google Sheets"
              >
                <RotateCw size={13} className={isLoading ? 'animate-spin text-indigo-600' : ''} />
              </button>
            )}

            {subTab === 'registry' && (
              <button
                onClick={onOpenReceiptModal}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-black uppercase tracking-wider text-[8.5px] transition-all flex items-center justify-center space-x-1.5 flex-1 sm:flex-initial cursor-pointer shadow-sm hover:shadow-md active:scale-95"
                title="Add a new spare part definition"
              >
                <PlusCircle size={14} />
                <span>New Spare Part</span>
              </button>
            )}

            {subTab === 'receiptLogs' && (
              <button
                onClick={onOpenReceiptModal}
                className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl font-black uppercase tracking-wider text-[8.5px] transition-all flex items-center justify-center space-x-1.5 flex-1 sm:flex-initial cursor-pointer shadow-xs hover:shadow-md active:scale-95"
                title="Record received inward stock"
              >
                <PlusCircle size={14} />
                <span>Receive Stock</span>
              </button>
            )}

            {subTab === 'issueLogs' && (
              <button
                onClick={() => {
                  if (availableSparesCount === 0) {
                    alert('There are no spare parts currently available in stock to issue.');
                    return;
                  }
                  onOpenIssueModal();
                }}
                className="bg-slate-900 hover:bg-black text-white px-4 py-2.5 rounded-xl font-black uppercase tracking-wider text-[8.5px] transition-all flex items-center justify-center space-x-1.5 flex-1 sm:flex-initial cursor-pointer shadow-xs hover:shadow-md active:scale-95"
                title="Issue outward stock to personnel"
              >
                <MinusCircle size={14} className="text-rose-400" />
                <span>Issue Spare</span>
              </button>
            )}
          </div>
        </div>

        {subTab === 'registry' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-50">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600" size={13} />
              <input 
                type="text" 
                placeholder="Search by spare part name..."
                className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-9 pr-3 py-2 text-[9px] font-black uppercase tracking-widest text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl">
              <AlertCircle size={12} className="text-slate-400" />
              <select 
                value={stockStatusFilter}
                onChange={e => setStockStatusFilter(e.target.value)}
                className="bg-transparent text-[9px] font-black uppercase text-slate-600 outline-none cursor-pointer w-full"
              >
                <option value="ALL">All Stock Levels</option>
                <option value="INSTOCK">In Stock (&gt;3)</option>
                <option value="LOW">Low Stock (1-3)</option>
                <option value="OUT">Out of Stock (0)</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

