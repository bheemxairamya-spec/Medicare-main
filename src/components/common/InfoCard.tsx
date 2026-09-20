import React from 'react';

interface InfoCardProps {
  title?: string;
  subtitle?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  id?: string;
  highlight?: boolean;
}

export const InfoCard: React.FC<InfoCardProps> = ({
  title,
  subtitle,
  badge,
  action,
  icon,
  children,
  className = '',
  id,
  highlight = false,
}) => {
  return (
    <div
      id={id}
      className={`bg-white rounded-2xl border ${
        highlight ? 'border-[#2563EB]/40 ring-1 ring-[#2563EB]/20 shadow-md' : 'border-[#E5EAF3] shadow-xs'
      } p-5 ${className}`}
    >
      {(title || badge || action || icon) && (
        <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            {icon && (
              <div className="w-9 h-9 rounded-xl bg-[#EFF4FF] text-[#2563EB] flex items-center justify-center shrink-0">
                {icon}
              </div>
            )}
            <div>
              {title && <h3 className="text-base font-bold text-[#0F1D3D] leading-tight">{title}</h3>}
              {subtitle && <p className="text-xs text-[#4B5563]">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {badge}
            {action}
          </div>
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};
