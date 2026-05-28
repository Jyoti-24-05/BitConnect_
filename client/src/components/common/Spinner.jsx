// client/src/components/common/Spinner.jsx
import cn from "@/utils/cn";

const sizes = {
  sm: "w-4 h-4 border-2",
  md: "w-8 h-8 border-2",
  lg: "w-12 h-12 border-[3px]",
};

const Spinner = ({ size = "md", className }) => (
  <div className={cn(
    "rounded-full animate-spin",
    sizes[size],
    className
  )}
  style={{ borderColor: "var(--p200)", borderTopColor: "var(--p500)" }} />
);

export const PageSpinner = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <Spinner size="lg" />
      <p className="text-sm font-medium" style={{ color: "var(--tx-muted)" }}>Loading...</p>
    </div>
  </div>
);

export default Spinner;
