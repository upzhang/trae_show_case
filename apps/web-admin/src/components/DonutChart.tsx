import type { FC } from "react";

interface DonutChartSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutChartSegment[];
  size?: number;
  thickness?: number;
  showCenterLabel?: boolean;
  centerLabel?: string;
  className?: string;
}

export const DonutChart: FC<DonutChartProps> = ({
  segments,
  size = 200,
  thickness = 40,
  showCenterLabel = true,
  centerLabel,
  className = "",
}) => {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) return null;

  const radius = size / 2;
  const innerRadius = radius - thickness;
  const center = size / 2;

  let cumulativeAngle = -90;

  const getArcPath = (
    startAngle: number,
    endAngle: number
  ): string => {
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);
    const x3 = center + innerRadius * Math.cos(endRad);
    const y3 = center + innerRadius * Math.sin(endRad);
    const x4 = center + innerRadius * Math.cos(startRad);
    const y4 = center + innerRadius * Math.sin(startRad);

    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return `M${x1},${y1} A${radius},${radius} 0 ${largeArc} 1 ${x2},${y2} L${x3},${y3} A${innerRadius},${innerRadius} 0 ${largeArc} 0 ${x4},${y4} Z`;
  };

  return (
    <svg
      className={`donut-chart ${className}`}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
    >
      {segments.map((segment) => {
        const angle = (segment.value / total) * 360;
        const startAngle = cumulativeAngle;
        const endAngle = cumulativeAngle + angle;
        cumulativeAngle = endAngle;

        const midAngle = (startAngle + endAngle) / 2;
        const midRad = (midAngle * Math.PI) / 180;
        const labelRadius = radius - thickness / 2;
        const labelX = center + labelRadius * Math.cos(midRad);
        const labelY = center + labelRadius * Math.sin(midRad);

        return (
          <g key={segment.label}>
            <path
              d={getArcPath(startAngle, endAngle)}
              fill={segment.color}
              stroke="#fff"
              strokeWidth={1}
            />
            {segment.value / total > 0.05 && (
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={11}
                fill="#fff"
                fontWeight={600}
              >
                {Math.round((segment.value / total) * 100)}%
              </text>
            )}
          </g>
        );
      })}
      {showCenterLabel && (
        <text
          x={center}
          y={center - 6}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={22}
          fontWeight={700}
          fill="#1f2937"
        >
          {total}
        </text>
      )}
      {showCenterLabel && centerLabel && (
        <text
          x={center}
          y={center + 14}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={12}
          fill="#6b7280"
        >
          {centerLabel}
        </text>
      )}
    </svg>
  );
};
