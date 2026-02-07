'use client';

import Link from 'next/link';
import { ExternalLink, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';
import { useState } from 'react';

export default function DataTable({
  columns = [],
  data = [],
  rowKey = 'id',
  getDetailsLink,
  currentPage,
  totalPages,
  itemsPerPage = 20,
  onPageChange
}) {

  const currentData = data;
  const startIndex = (currentPage - 1) * itemsPerPage;

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 10;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 6) {
        for (let i = 1; i <= 8; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 5) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 7; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;

  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  return (
    <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* ---------- TABLE HEAD ---------- */}
          <thead>
            <tr className="bg-blue-50 border-b border-blue-100">
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-700 uppercase tracking-wide">
                S.No.
              </th>

              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-5 py-3 text-left text-[11px] font-semibold text-gray-700 uppercase tracking-wide"
                >
                  {col.label}
                </th>
              ))}

              <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-700 uppercase tracking-wide">
                Action
              </th>
            </tr>
          </thead>

          {/* ---------- TABLE BODY ---------- */}
          <tbody className="divide-y divide-gray-100">
            {currentData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 2}
                  className="px-5 py-10 text-center text-sm text-gray-500"
                >
                  No records found
                </td>
              </tr>
            ) : (
              currentData.map((row, index) => (
                <tr
                  key={row[rowKey]}
                  className="hover:bg-blue-50/40 transition-colors"
                >
                  {/* S.NO */}
                  <td className="px-5 py-3 text-[12px] font-medium text-gray-900">
                    {startIndex + index + 1}
                  </td>

                  {/* DYNAMIC COLUMNS */}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-5 py-3 text-[12px] text-gray-700"
                    >
                      {col.render
                        ? col.render(row[col.key], row)
                        : row[col.key] && row[col.key].toString().trim() !== ''
                          ? row[col.key]
                          : '—'
                      }
                    </td>
                  ))}

                  {/* ACTION COLUMN */}
                  <td className="px-5 py-3">
                    <Link href={getDetailsLink(row)}>
                      <button className="
                        inline-flex items-center gap-2
                        px-4 py-2
                        bg-blue-800 hover:bg-blue-700
                        text-white text-[12px] font-semibold
                        rounded-lg
                        transition-all
                        shadow-sm hover:shadow-md
                        hover:scale-[1.05]
                        cursor-pointer
                      ">
                        Details
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 px-4 py-4 border-t border-gray-200 bg-gray-50/50">
          {/* First Page Button */}
          <button
            onClick={() => goToPage(1)}
            disabled={currentPage === 1}
            className={`p-2 rounded-lg transition-all ${currentPage === 1
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:bg-gray-200'
              }`}
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* Previous Page Button */}
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className={`p-2 rounded-lg transition-all ${currentPage === 1
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:bg-gray-200'
              }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page Numbers */}
          {getPageNumbers().map((page, index) => (
            page === '...' ? (
              <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-400 text-sm">
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`min-w-9 h-9 px-3 rounded-lg text-[11px] font-medium transition-all ${currentPage === page
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {page}
              </button>
            )
          ))}

          {/* Next Page Button */}
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`p-2 rounded-lg transition-all ${currentPage === totalPages
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:bg-gray-200'
              }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Last Page Button */}
          <button
            onClick={() => goToPage(totalPages)}
            disabled={currentPage === totalPages}
            className={`py-2 rounded-lg transition-all ${currentPage === totalPages
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:bg-gray-200'
              }`}
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
