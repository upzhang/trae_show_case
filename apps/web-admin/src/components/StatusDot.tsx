import type { FC } from "react";

type StatusDotColor = "green" | "yellow" | "red" | "gray" | "blue";

interface StatusDotProps {
  color?: StatusDotColor;
  pulse?: boolean;
  size?: number;
  className?: string;
}

const colorMap: Record<StatusDotColor, string> = {
  green: "#16a34a",
  yellow: "#ca8a04",
  red: "#dc2626",
  gray: "#9ca3af",
  blue: "#2563eb",
};

export const StatusDot: FC<StatusDotProps> = ({
  color = "gray",
  pulse = false,
  size = 8,
  className = "",
}) => {
  return (
    <span
      className={`status-dot ${pulse ? "status-dot-pulse" : ""} ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: colorMap[color],
      }}
    />
  );
};
