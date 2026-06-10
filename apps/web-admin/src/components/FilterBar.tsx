import type { FC, ReactNode } from "react";
import { Button } from "./Button";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterBarProps {
  filters: {
    key: string;
    label: string;
    options: FilterOption[];
    value: string;
    onChange: (value: string) => void;
  }[];
  onReset?: () => void;
  className?: string;
  children?: ReactNode;
}

export const FilterBar: FC<FilterBarProps> = ({
  filters,
  onReset,
  className = "",
  children,
}) => {
  const hasActiveFilters = filters.some((f) => f.value !== "");

  return (
    <div className={`filter-bar ${className}`}>
      <div className="filter-bar-controls">
        {filters.map((filter) => (
          <select
            key={filter.key}
            className="filter-select"
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
          >
            <option value="">{filter.label}</option>
            {filter.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ))}
        {hasActiveFilters && onReset && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            重置筛选
          </Button>
        )}
      </div>
      {children && <div className="filter-bar-extra">{children}</div>}
    </div>
  );
};
