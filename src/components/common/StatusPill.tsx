import React from 'react';

export type PillVariant =
  | 'pass'
  | 'review'
  | 'fail'
  | 'verified'
  | 'pending'
  | 'critical'
  | 'urgent'
  | 'standard'
  | 'info'
  | 'neutral';

interface StatusPillProps {
  variant: PillVariant;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  className?: string;
  id?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  variant,
  label,
  size = 'md',
  dot = true,
  className = '',
  id,
}) => {
  const styles: Record<PillVariant, { bg: string; text: string; border: string; dotBg: string; defaultLabel: string }> = {
    pass: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dotBg: 'bg-emerald-500',
      defaultLabel: 'Pass / Eligible',
    },
    review: {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      dotBg: 'bg-amber-500',
      defaultLabel: 'Needs Review',
    },
    fail: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      dotBg: 'bg-red-500',
      defaultLabel: 'Critical / Ineligible',
    },
    verified: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      dotBg: 'bg-blue-600',
      defaultLabel: 'Verified Donor',
    },
    pending: {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-300',
      dotBg: 'bg-slate-400',
      defaultLabel: 'Pending Verification',
    },
    critical: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-300',
      dotBg: 'bg-red-600 animate-pulse',
      defaultLabel: 'Immediate Emergency',
    },
    urgent: {
      bg: 'bg-amber-100',
      text: 'text-amber-900',
      border: 'border-amber-300',
      dotBg: 'bg-amber-600',
      defaultLabel: 'Urgent Priority',
    },
    standard: {
      bg: 'bg-blue-50',
      text: 'text-blue-800',
      border: 'border-blue-200',
      dotBg: 'bg-blue-500',
      defaultLabel: 'Standard Request',
    },
    info: {
      bg: 'bg-[#EFF4FF]',
      text: 'text-[#2563EB]',
      border: 'border-blue-100',
      dotBg: 'bg-[#2563EB]',
      defaultLabel: 'Info',
    },
    neutral: {
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      border: 'border-gray-200',
      dotBg: 'bg-gray-400',
      defaultLabel: 'Active',
    },
  };

  const current = styles[variant] || styles.neutral;
  const displayText = label || current.defaultLabel;

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 font-bold',
    md: 'text-xs px-2.5 py-0.5 font-semibold',
    lg: 'text-sm px-3 py-1 font-bold',
  }[size];

  return (
    <span
      id={id}
      className={`inline-flex items-center gap-1.5 rounded-full border whitespace-nowrap transition-colors ${current.bg} ${current.text} ${current.border} ${sizeClasses} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${current.dotBg} shrink-0`} />}
      <span>{displayText}</span>
    </span>
  );
};
