import type { FC, ReactNode } from "react";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "default";
type BadgeSize = "sm" | "md";

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: "badge-success",
  warning: "badge-warning",
  danger: "badge-danger",
  info: "badge-info",
  default: "badge-default",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "badge-sm",
  md: "badge-md",
};

export const Badge: FC<BadgeProps> = ({
  variant = "default",
  size = "md",
  children,
  className = "",
}) => {
  return (
    <span className={`badge ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      {children}
    </span>
  );
};
