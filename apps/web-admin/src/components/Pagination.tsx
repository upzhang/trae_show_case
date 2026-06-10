import type { FC } from "react";
import { Icon } from "./Icon";

interface PaginationProps {
  current: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  showTotal?: boolean;
  showSizeChanger?: boolean;
  className?: string;
}

export const Pagination: FC<PaginationProps> = ({
  current,
  total,
  pageSize,
  onChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  showTotal = true,
  showSizeChanger = true,
  className = "",
}) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const getPageNumbers = (): (number | "...")[] => {
    const pages: (number | "...")[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push("...");

      const start = Math.max(2, current - 1);
      const end = Math.min(totalPages - 1, current + 1);

      for (let i = start; i <= end; i++) pages.push(i);

      if (current < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className={`pagination ${className}`}>
      {showTotal && (
        <span className="pagination-total">共 {total} 条</span>
      )}

      {showSizeChanger && onPageSizeChange && (
        <select
          className="pagination-size"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size} 条/页
            </option>
          ))}
        </select>
      )}

      <div className="pagination-controls">
        <button
          className="pagination-btn"
          disabled={current <= 1}
          onClick={() => onChange(current - 1)}
        >
          <span className="pagination-arrow pagination-arrow-left"><Icon name="chevron-down" size={14} /></span>
        </button>

        {pages.map((page, index) =>
          page === "..." ? (
            <span key={`ellipsis-${index}`} className="pagination-ellipsis">
              ...
            </span>
          ) : (
            <button
              key={page}
              className={`pagination-btn ${page === current ? "pagination-active" : ""}`}
              onClick={() => onChange(page)}
            >
              {page}
            </button>
          )
        )}

        <button
          className="pagination-btn"
          disabled={current >= totalPages}
          onClick={() => onChange(current + 1)}
        >
          <span className="pagination-arrow pagination-arrow-right"><Icon name="chevron-down" size={14} /></span>
        </button>
      </div>
    </div>
  );
};
