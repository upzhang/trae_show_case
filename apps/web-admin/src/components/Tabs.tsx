import { useState, type FC, type ReactNode } from "react";

interface TabItem {
  key: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
  badge?: string | number;
}

interface TabsProps {
  items: TabItem[];
  defaultActiveKey?: string;
  activeKey?: string;
  onChange?: (key: string) => void;
  className?: string;
}

export const Tabs: FC<TabsProps> = ({
  items,
  defaultActiveKey,
  activeKey: controlledKey,
  onChange,
  className = "",
}) => {
  const [internalKey, setInternalKey] = useState(
    defaultActiveKey || items[0]?.key || ""
  );
  const activeKey = controlledKey ?? internalKey;

  const handleChange = (key: string) => {
    if (controlledKey === undefined) {
      setInternalKey(key);
    }
    onChange?.(key);
  };

  const activeItem = items.find((item) => item.key === activeKey);

  return (
    <div className={`tabs ${className}`}>
      <div className="tabs-header">
        {items.map((item) => (
          <button
            key={item.key}
            className={`tabs-tab ${item.key === activeKey ? "tabs-tab-active" : ""} ${item.disabled ? "tabs-tab-disabled" : ""}`}
            onClick={() => !item.disabled && handleChange(item.key)}
            disabled={item.disabled}
          >
            {item.label}
            {item.badge !== undefined && (
              <span className="tabs-badge">{item.badge}</span>
            )}
          </button>
        ))}
      </div>
      <div className="tabs-content">
        {activeItem?.content}
      </div>
    </div>
  );
};
