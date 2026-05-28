// client/src/components/common/Button.jsx
import cn from "@/utils/cn";

const variants = {
  primary:   { style: { background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff", border: "none", boxShadow: "0 4px 14px rgba(124,58,237,0.3)" }, hover: "" },
  secondary: { cls: "bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50" },
  danger:    { cls: "bg-red-500 text-white hover:bg-red-600 disabled:opacity-50" },
  ghost:     { cls: "hover:bg-gray-100 disabled:opacity-50", style: { color: "var(--tx)" } },
  outline:   { cls: "border disabled:opacity-50", style: { borderColor: "var(--p300)", color: "var(--p500)", background: "transparent" } },
};

const sizes = {
  xs: { cls: "px-2.5 py-1 text-xs", style: { borderRadius: "8px" } },
  sm: { cls: "px-3.5 py-1.5 text-sm", style: { borderRadius: "12px" } },
  md: { cls: "px-5 py-2.5 text-sm", style: { borderRadius: "14px" } },
  lg: { cls: "px-6 py-3 text-base", style: { borderRadius: "14px" } },
};

const Button = ({ children, variant = "primary", size = "md", loading = false, disabled = false, className, style: propStyle, ...props }) => {
  const v = variants[variant] ?? variants.primary;
  const s = sizes[size] ?? sizes.md;
  return (
    <button disabled={disabled || loading}
            className={cn("font-semibold transition inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60", v.cls, s.cls, className)}
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", ...v.style, ...s.style, ...propStyle }}
            {...props}>
      {loading && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  );
};
export default Button;
