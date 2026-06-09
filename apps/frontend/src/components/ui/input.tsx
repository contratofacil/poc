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
            "bg-white text-[#1a202c] placeholder:text-[#5e6b7e]",
            "transition-colors duration-150",
            "focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] focus:border-transparent",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error
              ? "border-[#b91c1c] focus:ring-[#b91c1c]"
              : "border-[#92897a] hover:border-[#5e6b7e]",
            className,
          ].join(" ")}
          {...props}
        />
        {error && <p className="text-xs text-[#b91c1c]">{error}</p>}
        {hint && !error && <p className="text-xs text-[#5e6b7e]">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
