import type { FC, ReactNode } from "react";

interface FormFieldProps {
  label?: string;
  helper?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export const FormField: FC<FormFieldProps> = ({
  label,
  helper,
  error,
  required = false,
  children,
  className = "",
}) => {
  return (
    <div className={`form-field ${error ? "form-field-error" : ""} ${className}`}>
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="form-required">*</span>}
        </label>
      )}
      {children}
      {helper && !error && <span className="form-helper">{helper}</span>}
      {error && <span className="form-error">{error}</span>}
    </div>
  );
};
