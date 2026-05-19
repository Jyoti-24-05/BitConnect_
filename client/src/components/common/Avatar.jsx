// client/src/components/common/Avatar.jsx
import cn from "@/utils/cn";

const Avatar = ({ src, name, size = "md", className }) => {
  const sizes = {
    xs:  "w-6 h-6 text-[10px]",
    sm:  "w-8 h-8 text-xs",
    md:  "w-10 h-10 text-sm",
    lg:  "w-14 h-14 text-base",
    xl:  "w-20 h-20 text-xl",
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name ?? "avatar"}
        className={cn(
          "rounded-full object-cover shrink-0",
          sizes[size],
          className
        )}
      />
    );
  }

  return (
    <div className={cn(
      "rounded-full bg-indigo-100 flex items-center justify-center",
      "text-indigo-600 font-semibold shrink-0",
      sizes[size],
      className
    )}>
      {name?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
};
export default Avatar;