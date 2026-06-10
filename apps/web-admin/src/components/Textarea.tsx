import type { FC, TextareaHTMLAttributes } from "react";

interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> {
  label?: string;
  helper?: string;
  error?: string;
  size?: "sm" | "md" | "lg";
}

export const Textarea: FC<TextareaProps> = ({
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
      <textarea
        id={inputId}
        className={`form-input form-textarea form-input-${size}`}
        rows={4}
        {...props}
      />
      {helper && !error && <span className="form-helper">{helper}</span>}
      {error && <span className="form-error">{error}</span>}
    </div>
  );
};
