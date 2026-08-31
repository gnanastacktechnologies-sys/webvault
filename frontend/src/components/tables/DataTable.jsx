import React from 'react';
import { FaSort, FaSortUp, FaSortDown, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorState from '../common/ErrorState';
import EmptyState from '../common/EmptyState';

const DataTable = ({
  columns = [],
  data = [],
  isLoading = false,
  isError = false,
  error = null,
  sortField,
  sortOrder,
  onSort,
  pagination = null, // { page, pages, total, limit, onPageChange }
  emptyState = null, // Custom EmptyState configuration or element
  mobileRender = null, // Function: (row) => JSX (for card display on mobile)
}) => {
  const handleSort = (column) => {
    if (column.sortable && onSort) {
      const newOrder = sortField === column.key && sortOrder === 'asc' ? 'desc' : 'asc';
      onSort(column.key, newOrder);
    }
  };

  const renderSortIcon = (column) => {
    if (!column.sortable) return null;
    if (sortField !== column.key) return <FaSort className="ml-1 text-gray-400 text-xs" />;
    return sortOrder === 'asc' ? (
      <FaSortUp className="ml-1 text-primary text-xs" />
    ) : (
      <FaSortDown className="ml-1 text-primary text-xs" />
    );
  };

  // Error State
  if (isError) {
    return <ErrorState message={error?.message || 'Failed to load table data.'} />;
  }

  // Loading State (Initial)
  if (isLoading && data.length === 0) {
    return <LoadingSpinner message="Fetching records..." />;
  }

  // Empty State
  if (data.length === 0) {
    return emptyState || <EmptyState />;
  }

  return (
    <div className="w-full flex flex-col">
      {/* Table / Cards Container */}
      <div className="bg-card border border-border/50 rounded-xl shadow-sm overflow-hidden relative">
        {/* Loading Overlay for background updates */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <svg
              className="animate-spin h-8 w-8 text-primary"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )}

        {/* Mobile Viewports (Vertical Cards) */}
        {mobileRender && (
          <div className="block md:hidden p-4 space-y-4">
            {data.map((row, index) => (
              <div key={row._id || index} className="transition-all duration-200">
                {mobileRender(row)}
              </div>
            ))}
          </div>
        )}

        {/* Desktop Viewport (HTML Table) */}
        <div className={`overflow-x-auto ${mobileRender ? 'hidden md:block' : 'block'}`}>
          <table className="min-w-full divide-y divide-border/40">
            <thead className="bg-gray-50/75">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className={`
                      px-6 py-3 text-left text-xs font-semibold text-secondary-text uppercase tracking-wider
                      ${col.sortable ? 'cursor-pointer select-none hover:bg-gray-100 hover:text-heading transition-colors' : ''}
                      ${col.className || ''}
                    `}
                    onClick={() => handleSort(col)}
                  >
                    <div className="flex items-center">
                      {col.label}
                      {renderSortIcon(col)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-border/30">
              {data.map((row, rowIndex) => (
                <tr
                  key={row._id || rowIndex}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-6 py-4 whitespace-nowrap text-sm text-heading ${col.className || ''}`}
                    >
                      {col.render ? col.render(row, rowIndex) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
      {pagination && pagination.pages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-5 px-1">
          {/* Status Label */}
          <div className="text-xs text-secondary-text font-medium">
            Showing <span className="font-semibold text-heading">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
            <span className="font-semibold text-heading">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{' '}
            of <span className="font-semibold text-heading">{pagination.total}</span> entries
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1 || isLoading}
              className="flex items-center justify-center p-2 rounded-lg border border-border bg-white text-secondary-text hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <FaChevronLeft size={12} />
            </button>

            {/* Page numbers */}
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => {
              // Only display around current page for neat layout if there are many pages
              if (
                p === 1 ||
                p === pagination.pages ||
                (p >= pagination.page - 1 && p <= pagination.page + 1)
              ) {
                return (
                  <button
                    key={p}
                    onClick={() => pagination.onPageChange(p)}
                    disabled={isLoading}
                    className={`
                      min-w-[34px] h-[34px] flex items-center justify-center text-xs font-semibold rounded-lg border transition-all duration-200
                      ${
                        pagination.page === p
                          ? 'bg-primary text-white border-transparent shadow-sm'
                          : 'border-border bg-white text-secondary-text hover:bg-gray-50'
                      }
                    `}
                  >
                    {p}
                  </button>
                );
              }
              // Render ellipsis dots
              if (p === 2 && pagination.page > 3) {
                return (
                  <span key="ellipsis-start" className="px-2 text-secondary-text text-xs">
                    ...
                  </span>
                );
              }
              if (p === pagination.pages - 1 && pagination.page < pagination.pages - 2) {
                return (
                  <span key="ellipsis-end" className="px-2 text-secondary-text text-xs">
                    ...
                  </span>
                );
              }
              return null;
            })}

            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages || isLoading}
              className="flex items-center justify-center p-2 rounded-lg border border-border bg-white text-secondary-text hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <FaChevronRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
