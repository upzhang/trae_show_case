import type { FC, InputHTMLAttributes } from "react";

interface RadioOption {
  value: string;
  label: string;
  helper?: string;
}

interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  direction?: "horizontal" | "vertical";
  className?: string;
}

export const RadioGroup: FC<RadioGroupProps> = ({
  name,
  options,
  value,
  onChange,
  label,
  direction = "vertical",
  className = "",
}) => {
  return (
    <fieldset className={`form-radio-group ${className}`}>
      {label && <legend className="form-label">{label}</legend>}
      <div className={`form-radio-options form-radio-${direction}`}>
        {options.map((opt) => (
          <label key={opt.value} className="form-radio">
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="form-radio-input"
            />
            <span className="form-radio-label">{opt.label}</span>
            {opt.helper && (
              <span className="form-radio-helper">{opt.helper}</span>
            )}
          </label>
        ))}
      </div>
    </fieldset>
  );
};
