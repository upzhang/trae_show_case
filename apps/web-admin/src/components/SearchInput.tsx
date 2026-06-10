import { useState, useEffect, type FC, type ChangeEvent } from "react";
import { Icon } from "./Icon";

interface SearchInputProps {
  value?: string;
  placeholder?: string;
  onChange: (value: string) => void;
  debounceMs?: number;
  className?: string;
}

export const SearchInput: FC<SearchInputProps> = ({
  value: externalValue,
  placeholder = "搜索...",
  onChange,
  debounceMs = 300,
  className = "",
}) => {
  const [internalValue, setInternalValue] = useState(externalValue ?? "");

  useEffect(() => {
    if (externalValue !== undefined && externalValue !== internalValue) {
      setInternalValue(externalValue);
    }
  }, [externalValue]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (internalValue !== externalValue) {
        onChange(internalValue);
      }
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [internalValue, debounceMs]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInternalValue(e.target.value);
  };

  const handleClear = () => {
    setInternalValue("");
    onChange("");
  };

  return (
    <div className={`search-input ${className}`}>
      <Icon name="search" size={16} className="search-input-icon" />
      <input
        type="text"
        value={internalValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="search-input-field"
      />
      {internalValue && (
        <button className="search-input-clear" onClick={handleClear} aria-label="清除">
          <Icon name="x" size={14} />
        </button>
      )}
    </div>
  );
};
