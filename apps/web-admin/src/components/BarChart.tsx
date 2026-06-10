import type { FC } from "react";

interface BarChartSeries {
  name: string;
  data: number[];
  color: string;
}

interface BarChartProps {
  categories: string[];
  series: BarChartSeries[];
  width?: number;
  height?: number;
  showValues?: boolean;
  className?: string;
}

export const BarChart: FC<BarChartProps> = ({
  categories,
  series,
  width = 600,
  height = 300,
  showValues = false,
  className = "",
}) => {
  const margin = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const allValues = series.flatMap((s) => s.data);
  const maxValue = Math.max(...allValues, 1);
  const yTicks = 5;
  const yStep = Math.ceil(maxValue / yTicks);

  const groupWidth = chartWidth / categories.length;
  const barWidth = (groupWidth * 0.7) / series.length;
  const barGap = groupWidth * 0.15;

  return (
    <svg
      className={`bar-chart ${className}`}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
    >
      {/* Y axis grid lines and labels */}
      {Array.from({ length: yTicks + 1 }, (_, i) => {
        const value = i * yStep;
        const y = margin.top + chartHeight - (value / maxValue) * chartHeight;
        return (
          <g key={`y-${i}`}>
            <line
              x1={margin.left}
              y1={y}
              x2={width - margin.right}
              y2={y}
              stroke="#e5e7eb"
              strokeDasharray="4 4"
            />
            <text
              x={margin.left - 8}
              y={y + 4}
              textAnchor="end"
              fontSize={11}
              fill="#6b7280"
            >
              {value}
            </text>
          </g>
        );
      })}

      {/* Bars */}
      {series.map((s, seriesIndex) =>
        s.data.map((value, catIndex) => {
          const barHeight = (value / maxValue) * chartHeight;
          const x = margin.left + catIndex * groupWidth + barGap + seriesIndex * barWidth;
          const y = margin.top + chartHeight - barHeight;

          return (
            <g key={`${s.name}-${catIndex}`}>
              <rect
                x={x}
                y={y}
                width={barWidth - 2}
                height={barHeight}
                fill={s.color}
                rx={2}
              />
              {showValues && (
                <text
                  x={x + (barWidth - 2) / 2}
                  y={y - 4}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#374151"
                >
                  {value}
                </text>
              )}
            </g>
          );
        })
      )}

      {/* X axis labels */}
      {categories.map((cat, i) => (
        <text
          key={`x-${i}`}
          x={margin.left + i * groupWidth + groupWidth / 2}
          y={height - 8}
          textAnchor="middle"
          fontSize={11}
          fill="#6b7280"
        >
          {cat.length > 8 ? cat.slice(0, 8) + "..." : cat}
        </text>
      ))}
    </svg>
  );
};
