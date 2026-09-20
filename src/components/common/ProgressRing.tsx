import React from 'react';

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  sublabel?: string;
  id?: string;
  showPercentage?: boolean;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  percentage,
  size = 110,
  strokeWidth = 9,
  color = '#2563EB',
  trackColor = '#E5EAF3',
  label,
  sublabel,
  id,
  showPercentage = true,
}) => {
  const clamped = Math.min(100, Math.max(0, percentage));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <div id={id} className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
        {showPercentage && (
          <span className="text-xl font-bold text-[#0F1D3D] leading-none">
            {Math.round(clamped)}%
          </span>
        )}
        {label && (
          <span className="text-xs font-semibold text-[#0F1D3D] mt-0.5 max-w-[80px] truncate">
            {label}
          </span>
        )}
        {sublabel && (
          <span className="text-[10px] text-[#4B5563] uppercase tracking-wider font-medium">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
};
