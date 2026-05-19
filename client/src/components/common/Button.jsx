// client/src/components/common/Button.jsx
import cn from "@/utils/cn";

const variants = {
  primary:   "bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300",
  secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50",
  danger:    "bg-red-500 text-white hover:bg-red-600 disabled:opacity-50",
  ghost:     "text-gray-600 hover:bg-gray-100 disabled:opacity-50",
  outline:   "border border-indigo-600 text-indigo-600 hover:bg-indigo-50 disabled:opacity-50",
};

const sizes = {
  xs: "px-2.5 py-1 text-xs rounded-lg",
  sm: "px-3.5 py-1.5 text-sm rounded-xl",
  md: "px-5 py-2.5 text-sm rounded-xl",
  lg: "px-6 py-3 text-base rounded-xl",
};

const Button = ({
  children,
  variant  = "primary",
  size     = "md",
  loading  = false,
  disabled = false,
  className,
  ...props
}) => (
  <button
    disabled={disabled || loading}
    className={cn(
      "font-medium transition inline-flex items-center justify-center gap-2",
      "disabled:cursor-not-allowed",
      variants[variant],
      sizes[size],
      className
    )}
    {...props}
  >
    {loading && (
      <span className="w-4 h-4 border-2 border-current border-t-transparent
                       rounded-full animate-spin" />
    )}
    {children}
  </button>
);
export default Button;