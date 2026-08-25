import React from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { SpareReceiptRecord } from './types';
import { formatDisplayDate } from './utils';

interface SpareReceiptLogsTableProps {
  isLoading?: boolean;
  receipts: SpareReceiptRecord[];
  paginatedReceipts: SpareReceiptRecord[];
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  itemsPerPage: number;
  setItemsPerPage: (val: number) => void;
}

export const SpareReceiptLogsTable: React.FC<SpareReceiptLogsTableProps> = ({
  isLoading = false,
  receipts,
  paginatedReceipts,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  setItemsPerPage
}) => {
  return (
    <div className="bg-white border border-slate-100 rounded-[2.2rem] p-4 shadow-xs">
      {isLoading ? (
        <div className="space-y-4 py-6">
          <div className="flex items-center justify-center space-x-2.5 text-indigo-600 bg-indigo-50/50 py-3.5 px-4 rounded-2xl border border-indigo-100/60">
            <Loader2 size={16} className="animate-spin text-indigo-600 shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-900">
              Retrieving stock receipt logs from Google Sheets...
            </span>
          </div>

          {/* Skeleton Rows */}
          <div className="space-y-2.5">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="animate-pulse flex items-center justify-between p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100">
                <div className="space-y-2 flex-1 max-w-sm">
                  <div className="h-3.5 bg-slate-200 rounded-md w-3/4"></div>
                  <div className="h-2 bg-slate-200 rounded-md w-1/4"></div>
                </div>
                <div className="h-4 bg-slate-200 rounded-md w-24 hidden sm:block"></div>
                <div className="h-5 bg-slate-200 rounded-lg w-20"></div>
                <div className="h-4 bg-slate-200 rounded-md w-28 hidden md:block"></div>
              </div>
            ))}
          </div>
        </div>
      ) : receipts.length === 0 ? (
        <div className="max-w-xs mx-auto text-center py-12 space-y-2">
          <Calendar className="mx-auto text-slate-200" size={32} />
          <h5 className="font-extrabold text-slate-500 uppercase text-[10px] tracking-widest">No stock receipts recorded</h5>
          <p className="text-[8px] text-slate-400 leading-relaxed">Recorded deliveries of spare parts will appear here.</p>
        </div>
      ) : (
        <>
          {/* Mobile Card List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-3">
            {paginatedReceipts.map((log, idx) => (
              <div key={`${log.id || 'rcv'}-${idx}`} className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-slate-800 text-[10.5px] font-black leading-tight">{log.spareName}</h4>
                  <span className="px-2 py-0.5 text-[8.5px] rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 font-black shrink-0">
                    +{log.quantity} Units
                  </span>
                </div>
                <div className="text-[8px] font-bold text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200/50">
                  <span>{formatDisplayDate(log.date)}</span>
                  <span>By: {log.receivedBy}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100">
                  <th className="py-3 px-4 text-[8px] font-black uppercase tracking-widest text-slate-400">Spare Part Name</th>
                  <th className="py-3 px-4 text-[8px] font-black uppercase tracking-widest text-slate-400">Date Received</th>
                  <th className="py-3 px-4 text-[8px] font-black uppercase tracking-widest text-slate-400">Quantity Received</th>
                  <th className="py-3 px-4 text-[8px] font-black uppercase tracking-widest text-slate-400">Received By</th>
                  <th className="py-3 px-4 text-[8px] font-black uppercase tracking-widest text-slate-400">Supplier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-[10px] font-extrabold uppercase">
                {paginatedReceipts.map((log, idx) => (
                  <tr key={`${log.id || 'rcv'}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 text-slate-800 leading-tight block truncate max-w-xs">{log.spareName}</td>
                    <td className="py-3 px-4 font-black flex items-center space-x-1.5 text-slate-700">
                      <Clock size={11} className="text-slate-400" />
                      <span>{formatDisplayDate(log.date)}</span>
                    </td>
                    <td className="py-3 px-4 font-black">
                      <span className="px-2 py-0.5 text-[8.5px] rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700">
                        +{log.quantity} Units
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-500">{log.receivedBy}</td>
                    <td className="py-3 px-4 font-medium text-slate-400">{log.supplier || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {receipts.length > 0 && (() => {
            const totalRecords = receipts.length;
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
