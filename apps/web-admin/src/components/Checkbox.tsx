import type { FC, InputHTMLAttributes } from "react";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  helper?: string;
}

export const Checkbox: FC<CheckboxProps> = ({
  label,
  helper,
  className = "",
  id,
  ...props
}) => {
  const inputId = id || label.replace(/\s+/g, "-").toLowerCase();

  return (
    <div className={`form-checkbox ${className}`}>
      <input
        type="checkbox"
        id={inputId}
        className="form-checkbox-input"
        {...props}
      />
      <label htmlFor={inputId} className="form-checkbox-label">
        {label}
        {helper && <span className="form-checkbox-helper">{helper}</span>}
      </label>
    </div>
  );
};
