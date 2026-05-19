// client/src/components/common/EmptyState.jsx
import cn from "@/utils/cn";

const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className,
}) => (
  <div className={cn(
    "flex flex-col items-center justify-center text-center py-16 px-4",
    className
  )}>
    {Icon && (
      <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center
                      justify-center mb-4">
        <Icon className="w-8 h-8 text-indigo-400" />
      </div>
    )}
    <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
    {description && (
      <p className="text-sm text-gray-500 max-w-xs mb-5">{description}</p>
    )}
    {action}
  </div>
);
export default EmptyState;