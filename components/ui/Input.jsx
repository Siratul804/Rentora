import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

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
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  const inputType = type === "password" && showPassword ? "text" : type;

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
      <div className="relative">
        <input
          id={inputId}
          type={inputType}
          required={required}
          className={cn(
            "w-full px-3.5 py-2.5 rounded-xl text-sm transition-all duration-150",
            "bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700/80",
            "text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500",
            "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500",
            "disabled:opacity-50 disabled:bg-zinc-100 dark:disabled:bg-zinc-800 disabled:cursor-not-allowed",
            error && "border-rose-500 focus:ring-rose-500 focus:border-rose-500",
            type === "password" && "pr-12",
            className
          )}
          {...props}
        />
        {type === "password" && (
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((visible) => !visible)}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
      {helperText && !error && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{helperText}</p>
      )}
    </div>
  );
}
