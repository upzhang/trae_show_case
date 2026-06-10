import type { FC } from "react";

interface LineChartSeries {
  name: string;
  data: number[];
  color: string;
  fillOpacity?: number;
}

interface LineChartProps {
  categories: string[];
  series: LineChartSeries[];
  width?: number;
  height?: number;
  showDots?: boolean;
  showArea?: boolean;
  className?: string;
}

export const LineChart: FC<LineChartProps> = ({
  categories,
  series,
  width = 600,
  height = 300,
  showDots = true,
  showArea = false,
  className = "",
}) => {
  const margin = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const allValues = series.flatMap((s) => s.data);
  const minValue = Math.min(...allValues, 0);
  const maxValue = Math.max(...allValues, 1);
  const range = maxValue - minValue || 1;
  const yTicks = 5;
  const yStep = Math.ceil(range / yTicks);

  const getX = (index: number) =>
    margin.left + (index / Math.max(categories.length - 1, 1)) * chartWidth;

  const getY = (value: number) =>
    margin.top + chartHeight - ((value - minValue) / range) * chartHeight;

  const buildPath = (data: number[]): string =>
    data
      .map((value, i) => {
        const x = getX(i);
        const y = getY(value);
        return `${i === 0 ? "M" : "L"}${x},${y}`;
      })
      .join(" ");

  return (
    <svg
      className={`line-chart ${className}`}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
    >
      {/* Y axis grid */}
      {Array.from({ length: yTicks + 1 }, (_, i) => {
        const value = minValue + i * yStep;
        const y = getY(value);
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
              {Math.round(value)}
            </text>
          </g>
        );
      })}

      {/* Lines */}
      {series.map((s) => {
        const pathD = buildPath(s.data);
        const areaD = showArea
          ? `${pathD} L${getX(s.data.length - 1)},${getY(minValue)} L${getX(0)},${getY(minValue)} Z`
          : undefined;

        return (
          <g key={s.name}>
            {areaD && (
              <path
                d={areaD}
                fill={s.color}
                opacity={s.fillOpacity ?? 0.1}
              />
            )}
            <path
              d={pathD}
              fill="none"
              stroke={s.color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {showDots &&
              s.data.map((value, i) => (
                <circle
                  key={`${s.name}-dot-${i}`}
                  cx={getX(i)}
                  cy={getY(value)}
                  r={3}
                  fill="#fff"
                  stroke={s.color}
                  strokeWidth={2}
                />
              ))}
          </g>
        );
      })}

      {/* X axis labels */}
      {categories.map((cat, i) => (
        <text
          key={`x-${i}`}
          x={getX(i)}
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
