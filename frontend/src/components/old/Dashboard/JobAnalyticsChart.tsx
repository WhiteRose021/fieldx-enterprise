import React from 'react';

interface JobAnalyticsChartProps {
  data: Record<string, { soil: number; construction: number; splicing: number; completed: number }>;
  selectedMonth: string;
}

const JobAnalyticsChart: React.FC<JobAnalyticsChartProps> = ({ data, selectedMonth }) => {
  const months = Object.keys(data);
  const completedData = months.map(month => data[month].completed);

  return (
    <div className="h-full w-full p-4">
      <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="xMidYMid meet">
        {/* Grid Lines */}
        {[0, 50, 100, 150, 200].map((y, i) => (
          <line key={i} x1="50" y1={y} x2="550" y2={y} stroke="#e2e8f0" strokeWidth="1" />
        ))}
        {/* Y-Axis Labels */}
        {[0, 25, 50, 75, 100].map((val, i) => (
          <text key={i} x="40" y={200 - i * 50} fill="#64748b" fontSize="10" textAnchor="end">
            {val}
          </text>
        ))}
        {/* X-Axis Labels */}
        {months.map((month, i) => (
          <text
            key={i}
            x={50 + (i * 500) / (months.length - 1)}
            y="220"
            fill={month === selectedMonth ? "#2563eb" : "#64748b"}
            fontSize="10"
            textAnchor="middle"
          >
            {month}
          </text>
        ))}
        {/* Index Line */}
        <polyline
          fill="none"
          stroke="#2563eb"
          strokeWidth="2"
          points={completedData.map((value, i) => {
            const x = 50 + (i * 500) / (months.length - 1);
            const y = 200 - (value / Math.max(...completedData)) * 180;
            return `${x},${y}`;
          }).join(' ')}
        />
        {/* Data Points */}
        {completedData.map((value, i) => {
          const x = 50 + (i * 500) / (months.length - 1);
          const y = 200 - (value / Math.max(...completedData)) * 180;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="4"
              fill={months[i] === selectedMonth ? "#2563eb" : "#93c5fd"}
              stroke="#fff"
              strokeWidth="1"
            />
          );
        })}
      </svg>
    </div>
  );
};

export default JobAnalyticsChart;