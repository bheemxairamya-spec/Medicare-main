import React from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  sublabel?: string;
  id?: string;
  tooltip?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  label,
  sublabel,
  id,
  tooltip,
}) => {
  return (
    <div
      id={id}
      title={tooltip}
      className={`flex items-center justify-between gap-3 ${
        disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
      }`}
      onClick={() => {
        if (!disabled) onChange(!checked);
      }}
    >
      {(label || sublabel) && (
        <div className="flex flex-col">
          {label && <span className="text-sm font-medium text-[#0F1D3D]">{label}</span>}
          {sublabel && <span className="text-xs text-gray-500">{sublabel}</span>}
        </div>
      )}

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 ${
          checked ? 'bg-[#2563EB]' : 'bg-gray-200'
        } ${disabled ? 'cursor-not-allowed' : ''}`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};
