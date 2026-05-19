// client/src/components/common/Input.jsx
import cn from "@/utils/cn";
import { forwardRef } from "react";

const Input = forwardRef(({
  label,
  error,
  hint,
  className,
  wrapperClassName,
  ...props
}, ref) => (
  <div className={cn("space-y-1", wrapperClassName)}>
    {label && (
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
    )}
    <input
      ref={ref}
      className={cn(
        "w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition",
        "placeholder:text-gray-400",
        error
          ? "border-red-300 focus:ring-2 focus:ring-red-200"
          : "border-gray-200 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300",
        className
      )}
      {...props}
    />
    {error && <p className="text-red-500 text-xs">{error}</p>}
    {hint && !error && <p className="text-gray-400 text-xs">{hint}</p>}
  </div>
));
Input.displayName = "Input";
export default Input;