// client/src/components/common/Modal.jsx
import { useEffect }  from "react";
import { X }          from "lucide-react";
import cn             from "@/utils/cn";

const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    if (isOpen) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div className={cn(
        "relative w-full bg-white rounded-2xl shadow-xl z-10",
        "max-h-[90vh] overflow-y-auto",
        sizes[size]
      )}>
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4
                          border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        )}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
};
export default Modal;