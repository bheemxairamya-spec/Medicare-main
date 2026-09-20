import React from 'react';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

/**
 * Standardized Indian Mobile Phone Input (+91)
 * Features a static, non-interactive "+91" prefix tag on the left and a separate,
 * fully enabled <input type="tel"> for typing 10 numeric digits.
 */
export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  id,
  name,
  required = false,
  disabled = false,
  placeholder = '98765 43210',
  className = '',
  autoFocus = false,
}) => {
  // Extract up to 10 subscriber digits from any incoming format (e.g. "+91 98765 43210" or "9876543210")
  const getSubscriberDigits = (val: string): string => {
    if (!val) return '';
    // Strip leading +91 if present
    const withoutCountryCode = val.replace(/^\+?91\s*/, '');
    // Extract only digits up to 10
    const digitsOnly = withoutCountryCode.replace(/\D/g, '');
    return digitsOnly.slice(0, 10);
  };

  const subscriberDigits = getSubscriberDigits(value || '');

  // Format as "98765 43210" (5+5 grouping) for visual clarity
  const formatDisplay = (digits: string): string => {
    if (!digits) return '';
    if (digits.length > 5) {
      return `${digits.slice(0, 5)} ${digits.slice(5, 10)}`;
    }
    return digits;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only accept numeric characters, prevent leading zeros, and limit to exactly 10 digits
    let rawDigits = e.target.value.replace(/\D/g, '');
    if (rawDigits.startsWith('0')) {
      rawDigits = rawDigits.replace(/^0+/, '');
    }
    rawDigits = rawDigits.slice(0, 10);

    if (!rawDigits) {
      onChange('');
      return;
    }

    // Pass formatted "+91 XXXXX XXXXX" or "+91 XXXXX" to parent state
    const formattedWithPrefix =
      rawDigits.length > 5
        ? `+91 ${rawDigits.slice(0, 5)} ${rawDigits.slice(5)}`
        : `+91 ${rawDigits}`;

    onChange(formattedWithPrefix);
  };

  return (
    <div className={`relative flex items-stretch w-full ${className}`}>
      {/* Static, non-interactive +91 prefix label */}
      <span
        id={id ? `${id}-prefix-label` : undefined}
        aria-hidden="true"
        className="inline-flex items-center justify-center px-4 py-3 rounded-l-xl border border-r-0 border-[#E5EAF3] bg-[#EFF4FF] text-sm sm:text-base font-black text-[#0F1D3D] select-none pointer-events-none shrink-0 tracking-wide"
      >
        <span className="text-[#2563EB] mr-0.5">+</span>91
      </span>

      {/* Completely separate, fully enabled numeric telephone input */}
      <input
        id={id}
        name={name}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        maxLength={11} // 10 digits + 1 display space
        required={required}
        disabled={disabled}
        autoFocus={autoFocus}
        value={formatDisplay(subscriberDigits)}
        onChange={handleInputChange}
        placeholder={placeholder}
        aria-label="10-digit mobile number"
        className="w-full bg-[#F4F7FC] border border-[#E5EAF3] rounded-r-xl px-4 py-3 text-sm sm:text-base text-[#0F1D3D] font-bold tracking-wide placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] disabled:bg-gray-100 disabled:cursor-not-allowed transition"
      />
    </div>
  );
};
