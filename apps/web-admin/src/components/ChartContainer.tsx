import type { FC, ReactNode } from "react";

interface ChartContainerProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  legend?: { label: string; color: string }[];
  height?: number;
  className?: string;
}

export const ChartContainer: FC<ChartContainerProps> = ({
  title,
  subtitle,
  children,
  legend,
  height = 300,
  className = "",
}) => {
  return (
    <div className={`chart-container ${className}`}>
      {(title || subtitle) && (
        <div className="chart-header">
          {title && <h4 className="chart-title">{title}</h4>}
          {subtitle && <p className="chart-subtitle">{subtitle}</p>}
        </div>
      )}
      <div className="chart-body" style={{ height }}>
        {children}
      </div>
      {legend && legend.length > 0 && (
        <div className="chart-legend">
          {legend.map((item) => (
            <span key={item.label} className="chart-legend-item">
              <span
                className="chart-legend-dot"
                style={{ backgroundColor: item.color }}
              />
              {item.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
