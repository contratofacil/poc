import * as React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[#1a202c]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            "w-full rounded-lg border px-3 py-2 text-sm",
            "bg-white text-[#1a202c] placeholder:text-[#718096]",
            "transition-colors duration-150",
            "focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] focus:border-transparent",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error
              ? "border-[#dc2626] focus:ring-[#dc2626]"
              : "border-[#e8e4dd] hover:border-[#c5bfb5]",
            className,
          ].join(" ")}
          {...props}
        />
        {error && <p className="text-xs text-[#dc2626]">{error}</p>}
        {hint && !error && <p className="text-xs text-[#718096]">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
