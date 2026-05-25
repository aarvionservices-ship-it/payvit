import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPage: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export default function Pagination({ currentPage, totalPage, onPageChange, isLoading }: PaginationProps) {
  if (totalPage <= 1) return null;

  const pages = [];
  const maxVisiblePages = 5;

  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPage, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 mt-8 overflow-x-auto pb-4 max-w-full">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || isLoading}
        className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed group active:scale-90"
      >
        <ChevronLeft className="size-4 sm:size-5 group-hover:-translate-x-0.5 transition-transform" />
      </button>

      <div className="flex items-center gap-1">
        {startPage > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="size-8 sm:size-10 rounded-lg sm:rounded-xl text-xs sm:text-sm font-black transition-all hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
            >
              1
            </button>
            {startPage > 2 && <MoreHorizontal className="size-4 text-slate-300 mx-1" />}
          </>
        )}

        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            disabled={isLoading}
            className={`size-8 sm:size-10 rounded-lg sm:rounded-xl text-xs sm:text-sm font-black transition-all active:scale-90 ${
              currentPage === page
                ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {page}
          </button>
        ))}

        {endPage < totalPage && (
          <>
            {endPage < totalPage - 1 && <MoreHorizontal className="size-4 text-slate-300 mx-1" />}
            <button
              onClick={() => onPageChange(totalPage)}
              className="size-8 sm:size-10 rounded-lg sm:rounded-xl text-xs sm:text-sm font-black transition-all hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
            >
              {totalPage}
            </button>
          </>
        )}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPage || isLoading}
        className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed group active:scale-90"
      >
        <ChevronRight className="size-4 sm:size-5 group-hover:translate-x-0.5 transition-transform" />
      </button>
    </div>
  );
}

