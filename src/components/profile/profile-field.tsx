'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ProfileFieldProps {
  id?: string;
  name?: string;
  label: string;
  value?: string | number | null;
  defaultValue?: string | number;
  type?: string;
  placeholder?: string;
  readOnly?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  description?: string;
  step?: string;
  min?: string | number;
  max?: string | number;
  children?: React.ReactNode;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ProfileField({
  id,
  name,
  label,
  value,
  defaultValue,
  type = 'text',
  placeholder,
  readOnly = false,
  disabled = false,
  required = false,
  className,
  description,
  step,
  min,
  max,
  children,
  onChange,
}: ProfileFieldProps) {
  const isInactive = readOnly || disabled;

  return (
    <div className="space-y-1.5 w-full">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-[#9AA1AA] select-none"
      >
        {label}
      </label>

      {children ? (
        children
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          value={value !== undefined ? (value ?? '') : undefined}
          defaultValue={defaultValue}
          placeholder={placeholder}
          readOnly={readOnly}
          disabled={isInactive}
          required={required}
          step={step}
          min={min}
          max={max}
          onChange={onChange}
          className={cn(
            'flex h-10 w-full rounded-md border border-[#222222] bg-[#0A0A0A] px-3 py-2 text-sm text-[#EDEDED] transition-colors',
            'focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]',
            'placeholder:text-[#9AA1AA]/40',
            isInactive &&
              'opacity-80 text-[#9AA1AA] cursor-not-allowed select-all focus:border-[#222222] focus:ring-0',
            className
          )}
        />
      )}

      {description && (
        <p className="text-sm text-[#9AA1AA] leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}

export function ProfileSectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-1 pt-2">
      <h2 className="text-base font-bold uppercase tracking-wider text-[#EDEDED]">
        {title}
      </h2>
      {description && (
        <p className="text-sm text-[#9AA1AA] leading-relaxed">
          {description}
        </p>
      )}
      <div className="border-b border-[#222222] pt-1.5" />
    </div>
  );
}
