import { useState, type FC } from "react";
import { Icon } from "./Icon";

interface DateRangePickerProps {
  value?: { start: string; end: string };
  onChange: (range: { start: string; end: string }) => void;
  className?: string;
}

const presets = [
  { label: "近 7 天", days: 7 },
  { label: "近 30 天", days: 30 },
  { label: "近 90 天", days: 90 },
  { label: "近 1 年", days: 365 },
];

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return formatDate(d);
}

export const DateRangePicker: FC<DateRangePickerProps> = ({
  value,
  onChange,
  className = "",
}) => {
  const today = formatDate(new Date());
  const [startDate, setStartDate] = useState(value?.start || daysAgo(30));
  const [endDate, setEndDate] = useState(value?.end || today);
  const [activePreset, setActivePreset] = useState<string>("");

  const handlePreset = (days: number, label: string) => {
    const end = today;
    const start = daysAgo(days);
    setStartDate(start);
    setEndDate(end);
    setActivePreset(label);
    onChange({ start, end });
  };

  const handleCustomChange = () => {
    setActivePreset("");
    onChange({ start: startDate, end: endDate });
  };

  return (
    <div className={`date-range-picker ${className}`}>
      <div className="date-range-presets">
        {presets.map((preset) => (
          <button
            key={preset.label}
            className={`date-range-preset ${activePreset === preset.label ? "date-range-preset-active" : ""}`}
            onClick={() => handlePreset(preset.days, preset.label)}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div className="date-range-inputs">
        <div className="date-range-field">
          <Icon name="calendar" size={16} className="date-range-icon" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setActivePreset("");
            }}
            max={endDate}
            className="date-range-input"
          />
        </div>
        <span className="date-range-separator">至</span>
        <div className="date-range-field">
          <Icon name="calendar" size={16} className="date-range-icon" />
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setActivePreset("");
            }}
            min={startDate}
            max={today}
            className="date-range-input"
          />
        </div>
        <button className="date-range-apply" onClick={handleCustomChange}>
          应用
        </button>
      </div>
    </div>
  );
};
