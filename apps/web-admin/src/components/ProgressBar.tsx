import type { FC } from "react";

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: "blue" | "green" | "orange" | "red";
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const colorClasses: Record<string, string> = {
  blue: "progress-blue",
  green: "progress-green",
  orange: "progress-orange",
  red: "progress-red",
};

const sizeClasses: Record<string, string> = {
  sm: "progress-sm",
  md: "progress-md",
  lg: "progress-lg",
};

export const ProgressBar: FC<ProgressBarProps> = ({
  value,
  max = 100,
  color = "blue",
  showLabel = false,
  size = "md",
  className = "",
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={`progress-bar ${sizeClasses[size]} ${className}`}>
      <div
        className={`progress-fill ${colorClasses[color]}`}
        style={{ width: `${percentage}%` }}
      />
      {showLabel && (
        <span className="progress-label">{Math.round(percentage)}%</span>
      )}
    </div>
  );
};
