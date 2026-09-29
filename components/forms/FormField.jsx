import React from "react";
import { cn } from "@/lib/utils";

export function FormField({
  label,
  children,
  error,
  helperText,
  required = false,
  className = "",
}) {
  return (
    <div className={cn("space-y-1.5 w-full", className)}>
      {label && (
        <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-rose-500">{error}</p>}
      {helperText && !error && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{helperText}</p>
      )}
    </div>
  );
}

export function Select({
  label,
  options = [],
  value,
  onChange,
  className = "",
  error,
  required = false,
  ...props
}) {
  return (
    <FormField label={label} error={error} required={required}>
      <select
        value={value}
        onChange={onChange}
        className={cn(
          "w-full px-3.5 py-2.5 rounded-xl text-sm transition-all duration-150",
          "bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700/80",
          "text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500",
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}
