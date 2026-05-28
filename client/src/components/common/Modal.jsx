// client/src/components/common/Modal.jsx
import { useEffect } from "react";
import { X }         from "lucide-react";
import cn            from "@/utils/cn";

const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    if (isOpen) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg", xl: "max-w-2xl" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cn("relative w-full rounded-2xl shadow-2xl z-10 max-h-[90vh] overflow-y-auto scale-in", sizes[size])}
           style={{ background: "var(--card)", border: "1.5px solid var(--border)" }}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4"
               style={{ borderBottom: "1px solid var(--border)", background: "linear-gradient(135deg, var(--p50), var(--p100))" }}>
            <h2 className="font-bold text-sm" style={{ fontFamily: "Syne, sans-serif", color: "var(--tx-h)" }}>{title}</h2>
            <button onClick={onClose}
                    className="p-1.5 rounded-lg transition"
                    style={{ color: "var(--tx-muted)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--p100)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
};
export default Modal;
