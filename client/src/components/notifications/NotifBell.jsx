// client/src/components/notifications/NotifBell.jsx
import { useState, useRef, useEffect } from "react";
import { Bell }                         from "lucide-react";
import { useSelector }                  from "react-redux";
import NotifDropdown                    from "./NotifDropdown";

const NotifBell = () => {
  const [open, setOpen]   = useState(false);
  const unreadCount       = useSelector((s) => s.notifs.unreadCount);
  const ref               = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="relative p-2 hover:bg-gray-100 rounded-full transition"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px]
                           bg-red-500 text-white text-[10px] font-bold
                           rounded-full flex items-center justify-center px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && <NotifDropdown onClose={() => setOpen(false)} />}
    </div>
  );
};
export default NotifBell;