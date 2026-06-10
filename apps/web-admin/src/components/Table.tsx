import type { FC, ReactNode } from "react";
import { EmptyState } from "./EmptyState";
import { Spinner } from "./Spinner";

export interface Column<T> {
  key: string;
  title: string;
  dataIndex?: keyof T | string;
  width?: string;
  align?: "left" | "center" | "right";
  render?: (record: T, index: number) => ReactNode;
  sortable?: boolean;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey?: keyof T | ((record: T) => string);
  loading?: boolean;
  emptyText?: string;
  onRowClick?: (record: T) => void;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (column: string) => void;
  className?: string;
}

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  rowKey = "id" as keyof T,
  loading = false,
  emptyText = "暂无数据",
  onRowClick,
  sortColumn,
  sortDirection,
  onSort,
  className = "",
}: TableProps<T>) {
  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === "function") {
      return rowKey(record);
    }
    const val = record[rowKey];
    return val !== undefined && val !== null ? String(val) : String(index);
  };

  const handleSort = (column: Column<T>) => {
    if (column.sortable && onSort) {
      onSort(column.key);
    }
  };

  if (loading) {
    return (
      <div className="table-loading">
        <Spinner size={32} />
        <span>加载中...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return <EmptyState title={emptyText} icon="info" />;
  }

  return (
    <div className={`table-wrapper ${className}`}>
      <table className="table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width, textAlign: col.align || "left" }}
                className={col.sortable ? "table-th-sortable" : ""}
                onClick={() => handleSort(col)}
              >
                <span className="table-th-content">
                  {col.title}
                  {col.sortable && sortColumn === col.key && (
                    <span className="table-sort-icon">
                      {sortDirection === "asc" ? "▲" : "▼"}
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((record, index) => (
            <tr
              key={getRowKey(record, index)}
              className={onRowClick ? "table-row-clickable" : ""}
              onClick={() => onRowClick?.(record)}
            >
              {columns.map((col) => {
                const value = col.dataIndex
                  ? (record as Record<string, unknown>)[col.dataIndex as string]
                  : undefined;
                return (
                  <td
                    key={col.key}
                    style={{ textAlign: col.align || "left" }}
                  >
                    {col.render
                      ? col.render(record, index)
                      : value !== undefined && value !== null
                        ? String(value)
                        : "-"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
