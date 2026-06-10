import type { FC, InputHTMLAttributes } from "react";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  helper?: string;
  error?: string;
  size?: "sm" | "md" | "lg";
}

export const Input: FC<InputProps> = ({
  label,
  helper,
  error,
  size = "md",
  className = "",
  id,
  ...props
}) => {
  const inputId = id || (label ? label.replace(/\s+/g, "-").toLowerCase() : undefined);

  return (
    <div className={`form-field ${error ? "form-field-error" : ""} ${className}`}>
      {label && (
        <label className="form-label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`form-input form-input-${size}`}
        {...props}
      />
      {helper && !error && <span className="form-helper">{helper}</span>}
      {error && <span className="form-error">{error}</span>}
    </div>
  );
};
