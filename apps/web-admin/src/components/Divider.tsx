import type { FC } from "react";

interface DividerProps {
  orientation?: "horizontal" | "vertical";
  label?: string;
  className?: string;
}

export const Divider: FC<DividerProps> = ({
  orientation = "horizontal",
  label,
  className = "",
}) => {
  if (label) {
    return (
      <div className={`divider divider-with-label ${className}`}>
        <span className="divider-line" />
        <span className="divider-label">{label}</span>
        <span className="divider-line" />
      </div>
    );
  }

  return (
    <hr className={`divider divider-${orientation} ${className}`} />
  );
};
