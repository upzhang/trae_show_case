import type { FC } from "react";
import { Icon, type IconName } from "./Icon";

type TrendDirection = "up" | "down" | "neutral";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: IconName;
  trend?: {
    value: string;
    direction: TrendDirection;
  };
  color?: "blue" | "green" | "orange" | "red" | "purple";
  subtitle?: string;
  className?: string;
}

const colorClasses: Record<string, string> = {
  blue: "stat-card-blue",
  green: "stat-card-green",
  orange: "stat-card-orange",
  red: "stat-card-red",
  purple: "stat-card-purple",
};

const trendIcons: Record<TrendDirection, IconName> = {
  up: "arrow-up",
  down: "arrow-down",
  neutral: "arrow-right",
};

const trendClasses: Record<TrendDirection, string> = {
  up: "trend-up",
  down: "trend-down",
  neutral: "trend-neutral",
};

export const StatCard: FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  color = "blue",
  subtitle,
  className = "",
}) => {
  return (
    <div className={`stat-card ${colorClasses[color]} ${className}`}>
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        {icon && <Icon name={icon} size={20} className="stat-card-icon" />}
      </div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-footer">
        {trend && (
          <span className={`stat-card-trend ${trendClasses[trend.direction]}`}>
            <Icon name={trendIcons[trend.direction]} size={14} />
            {trend.value}
          </span>
        )}
        {subtitle && <span className="stat-card-subtitle">{subtitle}</span>}
      </div>
    </div>
  );
};
