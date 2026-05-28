import cn from "@/utils/cn";

const Avatar = ({ src, name, size = "md", className }) => {
  const sizes = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-base",
    xl: "w-20 h-20 text-xl",
  };

  if (src) {
    return (
      <img src={src} alt={name ?? "avatar"}
           className={cn("rounded-full object-cover shrink-0", sizes[size], className)}
           style={{ border: "2px solid var(--p200)" }} />
    );
  }

  return (
    <div className={cn("rounded-full flex items-center justify-center font-bold shrink-0", sizes[size], className)}
         style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff", fontFamily: "Syne, sans-serif" }}>
      {name?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
};
export default Avatar;
