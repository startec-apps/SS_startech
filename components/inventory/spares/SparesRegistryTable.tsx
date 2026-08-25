import React from 'react';
import { Package, ArrowDownLeft, ArrowUpRight, Trash2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { SpareItem } from './types';
import { formatDisplayDate } from './utils';

interface SparesRegistryTableProps {
  isLoading?: boolean;
  filteredSpares: SpareItem[];
  paginatedSpares: SpareItem[];
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  itemsPerPage: number;
  setItemsPerPage: (val: number) => void;
  onReceiveItem: (item: SpareItem) => void;
  onIssueItem: (item: SpareItem) => void;
  onDeleteItem: (id: string) => void;
}

export const SparesRegistryTable: React.FC<SparesRegistryTableProps> = ({
  isLoading = false,
  filteredSpares,
  paginatedSpares,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  setItemsPerPage,
  onReceiveItem,
  onIssueItem,
  onDeleteItem
}) => {
  return (
    <div className="bg-white border border-slate-100 rounded-[2.2rem] p-4 shadow-xs">
      {isLoading ? (
        <div className="space-y-4 py-6">
          <div className="flex items-center justify-center space-x-2.5 text-indigo-600 bg-indigo-50/50 py-3.5 px-4 rounded-2xl border border-indigo-100/60">
            <Loader2 size={16} className="animate-spin text-indigo-600 shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-900">
              Loading spares inventory from Google Sheets...
            </span>
          </div>

          {/* Skeleton Rows */}
          <div className="space-y-2.5">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="animate-pulse flex items-center justify-between p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100">
                <div className="space-y-2 flex-1 max-w-sm">
                  <div className="h-3.5 bg-slate-200 rounded-md w-3/4"></div>
                  <div className="h-2 bg-slate-200 rounded-md w-1/3"></div>
                </div>
                <div className="h-5 bg-slate-200 rounded-lg w-24 hidden sm:block"></div>
                <div className="h-4 bg-slate-200 rounded-md w-20 hidden md:block"></div>
                <div className="h-7 bg-slate-200 rounded-xl w-32"></div>
              </div>
            ))}
          </div>
        </div>
      ) : filteredSpares.length === 0 ? (
        <div className="max-w-xs mx-auto text-center py-12 space-y-2">
          <Package className="mx-auto text-slate-200" size={32} />
          <h5 className="font-extrabold text-slate-500 uppercase text-[10px] tracking-widest">No spare parts found</h5>
          <p className="text-[8px] text-slate-400 leading-relaxed font-semibold">Try adjusting your search or click New Spare Part to add items.</p>
        </div>
      ) : (
        <>
          {/* Mobile Card Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-3">
            {paginatedSpares.map((item, idx) => {
              const isLow = item.currentStock > 0 && item.currentStock <= 3;
              const isOut = item.currentStock === 0;

              return (
                <div key={`${item.id || 'spare'}-${item.name || ''}-${idx}`} className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-slate-800 text-[11px] font-black leading-snug">{item.name}</h4>
                    </div>
                    {isOut ? (
                      <span className="px-2 py-0.5 text-[7.5px] rounded-lg bg-rose-50 border border-rose-100 text-rose-600 font-black shrink-0">
                        OUT OF STOCK
                      </span>
                    ) : isLow ? (
                      <span className="px-2 py-0.5 text-[7.5px] rounded-lg bg-amber-50 border border-amber-100 text-amber-700 font-black shrink-0">
                        {item.currentStock} LOW
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[7.5px] rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold shrink-0">
                        {item.currentStock} Units
                      </span>
                    )}
                  </div>

                  <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                    Received: {formatDisplayDate(item.receivedDate)}
                  </div>

                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200/60">
                    <button
                      onClick={() => onReceiveItem(item)}
                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[8px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ArrowDownLeft size={11} />
                      <span>+ Receive</span>
                    </button>

                    <button
                      onClick={() => onIssueItem(item)}
                      className="flex-1 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-[8px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ArrowUpRight size={11} />
                      <span>Issue</span>
                    </button>

                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Delete spare part"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100">
                  <th className="py-3 px-4 text-[8px] font-black uppercase tracking-widest text-slate-400">Spare Part Name</th>
                  <th className="py-3 px-4 text-[8px] font-black uppercase tracking-widest text-slate-400">Stock Level</th>
                  <th className="py-3 px-4 text-[8px] font-black uppercase tracking-widest text-slate-400">Date Received</th>
                  <th className="py-3 px-4 text-[8px] font-black uppercase tracking-widest text-slate-400 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-[10px] font-extrabold uppercase">
                {paginatedSpares.map((item, idx) => {
                  const isLow = item.currentStock > 0 && item.currentStock <= 3;
                  const isOut = item.currentStock === 0;

                  return (
                    <tr key={`${item.id || 'spare'}-${item.name || ''}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="text-slate-800 block text-[10px] font-black leading-tight">{item.name}</span>
                      </td>
                      <td className="py-3 px-4">
                        {isOut ? (
                          <span className="px-2 py-0.5 text-[8px] rounded-lg bg-rose-50 border border-rose-100 text-rose-600 font-black flex items-center gap-1 w-fit">
                            <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse"></span>
                            OUT OF STOCK
                          </span>
                        ) : isLow ? (
                          <span className="px-2 py-0.5 text-[8px] rounded-lg bg-amber-50 border border-amber-100 text-amber-700 font-black flex items-center gap-1 w-fit">
                            <span className="w-1 h-1 rounded-full bg-amber-500 animate-bounce"></span>
                            {item.currentStock} Units (LOW)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[8px] rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold">
                            {item.currentStock} Units Available
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-500">{formatDisplayDate(item.receivedDate)}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onReceiveItem(item)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[8px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                            title="Receive / Restock this spare part"
                          >
                            <ArrowDownLeft size={11} />
                            <span>+ Receive</span>
                          </button>
                          <button
                            onClick={() => onIssueItem(item)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-black text-white rounded-lg text-[8px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                            title="Issue stock for this spare part"
                          >
                            <ArrowUpRight size={11} />
                            <span>Issue</span>
                          </button>
                          <button
                            onClick={() => onDeleteItem(item.id)}
                            className="p-1 hover:text-rose-600 text-slate-400 transition-colors cursor-pointer ml-1"
                            title="Delete spare part"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredSpares.length > 0 && (() => {
            const totalRecords = filteredSpares.length;
            const startIndex = totalRecords === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
            const endIndex = Math.min(currentPage * itemsPerPage, totalRecords);
            const totalPages = Math.ceil(totalRecords / itemsPerPage) || 1;

            return (
              <div className="mt-4 bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px]">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-slate-600 font-bold">
                  <span>
                    Showing <strong className="text-slate-900 font-black">{startIndex}</strong> to <strong className="text-slate-900 font-black">{endIndex}</strong> of <strong className="text-slate-900 font-black">{totalRecords}</strong> records
                  </span>

                  <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-xl">
                    <span className="text-[8.5px] font-black uppercase text-slate-400">Rows:</span>
                    <select
                      value={itemsPerPage}
                      onChange={e => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="bg-transparent text-slate-800 font-black outline-none cursor-pointer text-[10px]"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-800 font-black flex items-center space-x-1 transition-all cursor-pointer active:scale-95"
                    title="Previous Page"
                  >
                    <ChevronLeft size={14} />
                    <span className="hidden sm:inline uppercase text-[9px] tracking-wider">Prev</span>
                  </button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                      .map((p, idx, arr) => {
                        const prevPage = arr[idx - 1];
                        const showEllipsis = prevPage && p - prevPage > 1;

                        return (
                          <React.Fragment key={p}>
                            {showEllipsis && <span className="px-1 text-slate-400 font-mono text-[9px]">...</span>}
                            <button
                              onClick={() => setCurrentPage(p)}
                              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl font-black text-[10px] transition-all cursor-pointer active:scale-95 flex items-center justify-center ${
                                currentPage === p
                                  ? 'bg-black text-white shadow-xs'
                                  : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {p}
                            </button>
                          </React.Fragment>
                        );
                      })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-800 font-black flex items-center space-x-1 transition-all cursor-pointer active:scale-95"
                    title="Next Page"
                  >
                    <span className="hidden sm:inline uppercase text-[9px] tracking-wider">Next</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
};
