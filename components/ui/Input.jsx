import React from "react";
import { cn } from "@/lib/utils";

export function Input({
  label,
  error,
  helperText,
  id,
  className = "",
  type = "text",
  required = false,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
        >
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        required={required}
        className={cn(
          "w-full px-3.5 py-2.5 rounded-xl text-sm transition-all duration-150",
          "bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700/80",
          "text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500",
          "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500",
          "disabled:opacity-50 disabled:bg-zinc-100 dark:disabled:bg-zinc-800 disabled:cursor-not-allowed",
          error && "border-rose-500 focus:ring-rose-500 focus:border-rose-500",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
      {helperText && !error && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{helperText}</p>
      )}
    </div>
  );
}
