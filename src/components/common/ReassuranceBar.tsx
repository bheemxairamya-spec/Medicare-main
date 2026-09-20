import React from 'react';
import { Lock, ShieldCheck, Sparkles } from 'lucide-react';

interface ReassuranceBarProps {
  text?: string;
  id?: string;
  className?: string;
}

export const ReassuranceBar: React.FC<ReassuranceBarProps> = ({
  text = 'Your health information and biometric sensor telemetry are encrypted under strict HIPAA-compliant 256-bit protocols. Only verified medical personnel and emergency dispatch have authorized visibility.',
  id,
  className = '',
}) => {
  return (
    <div
      id={id}
      className={`mt-8 py-3 px-4 bg-white/90 rounded-xl border border-[#E5EAF3] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#4B5563] backdrop-blur-xs ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-lg bg-[#EFF4FF] text-[#2563EB] flex items-center justify-center shrink-0">
          <Lock className="w-3.5 h-3.5" />
        </div>
        <p className="font-medium">{text}</p>
      </div>

      <div className="flex items-center gap-3 shrink-0 text-[11px] font-semibold text-gray-500">
        <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          <ShieldCheck className="w-3 h-3" /> ISO-27001
        </span>
        <span className="flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
          <Sparkles className="w-3 h-3" /> Hardware Encrypted
        </span>
      </div>
    </div>
  );
};
