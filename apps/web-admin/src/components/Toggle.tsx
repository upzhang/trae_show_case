import type { FC } from "react";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export const Toggle: FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  size = "md",
  className = "",
}) => {
  return (
    <label className={`toggle ${disabled ? "toggle-disabled" : ""} toggle-${size} ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="toggle-input"
      />
      <span className="toggle-slider" />
      {label && <span className="toggle-label">{label}</span>}
    </label>
  );
};
