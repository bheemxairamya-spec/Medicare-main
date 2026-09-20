import React, { useState } from 'react';
import { Clock, Check } from 'lucide-react';

interface CustomTimePickerProps {
  value: string; // e.g. "08:00 AM" or "14:30"
  onChange: (formatted12h: string) => void;
  id?: string;
  name?: string;
  className?: string;
  showQuickPresets?: boolean;
  disabled?: boolean;
}

/**
 * Converts 12-hour or 24-hour time string into standard 24-hour "HH:mm" for <input type="time">
 */
export const to24Hour = (timeStr: string): string => {
  if (!timeStr) return '08:00';
  const clean = timeStr.trim();
  const match12 = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = match12[2];
    const modifier = match12[3]?.toUpperCase();
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }
  const match24 = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    return `${match24[1].padStart(2, '0')}:${match24[2]}`;
  }
  return '08:00';
};

/**
 * Converts 24-hour "HH:mm" to formatted 12-hour "hh:mm AM/PM"
 */
export const to12Hour = (time24: string): string => {
  if (!time24) return '08:00 AM';
  const [hStr, mStr] = time24.split(':');
  let hours = parseInt(hStr, 10);
  const minutes = mStr ? mStr.slice(0, 2).padStart(2, '0') : '00';
  if (isNaN(hours)) return '08:00 AM';
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // '0' becomes '12'
  return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
};

export const QUICK_TIME_PRESETS = [
  { label: 'Morning / Breakfast', time: '08:00 AM', time24: '08:00' },
  { label: 'Noon / Lunch', time: '12:30 PM', time24: '12:30' },
  { label: 'Evening / Dinner', time: '07:30 PM', time24: '19:30' },
  { label: 'Night / Bedtime', time: '10:00 PM', time24: '22:00' },
];

export const CustomTimePicker: React.FC<CustomTimePickerProps> = ({
  value,
  onChange,
  id,
  name,
  className = '',
  showQuickPresets = false,
  disabled = false,
}) => {
  const value24 = to24Hour(value);
  const display12 = to12Hour(value24);

  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    if (!rawVal) return;
    const formatted = to12Hour(rawVal);
    onChange(formatted);
  };

  const handleSelectPreset = (presetTime: string) => {
    onChange(presetTime);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Time input control with formatted display */}
      <div className="relative flex items-center">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2563EB] pointer-events-none">
          <Clock className="w-4.5 h-4.5" />
        </div>

        <input
          id={id}
          name={name}
          type="time"
          disabled={disabled}
          value={value24}
          onChange={handleNativeChange}
          className="w-full bg-white border border-[#E5EAF3] text-sm sm:text-base font-bold text-[#0F1D3D] rounded-xl pl-10 pr-28 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] disabled:bg-gray-100 disabled:cursor-not-allowed transition"
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#EFF4FF] border border-blue-200 text-[#2563EB] font-bold text-xs sm:text-sm tracking-wide">
            {display12}
          </span>
        </div>
      </div>

      {/* Optional Quick-Select Preset Chips */}
      {showQuickPresets && (
        <div className="flex flex-wrap gap-2 pt-1">
          {QUICK_TIME_PRESETS.map((preset) => {
            const isSelected = display12 === preset.time;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleSelectPreset(preset.time)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#2563EB] text-white border-[#2563EB] font-bold shadow-2xs'
                    : 'bg-white text-gray-700 border-[#E5EAF3] hover:bg-gray-50'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                <span>{preset.label}</span>
                <span className={`opacity-90 font-mono text-xs ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                  ({preset.time})
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
