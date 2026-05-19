// client/src/components/common/Spinner.jsx
import cn from "@/utils/cn";

const sizes = {
  sm: "w-4 h-4 border-2",
  md: "w-8 h-8 border-2",
  lg: "w-12 h-12 border-[3px]",
};

const Spinner = ({ size = "md", className }) => (
  <div className={cn(
    "rounded-full border-indigo-600 border-t-transparent animate-spin",
    sizes[size],
    className
  )} />
);

// Full-page centered spinner
export const PageSpinner = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <Spinner size="lg" />
  </div>
);

export default Spinner;