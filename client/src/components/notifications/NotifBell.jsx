// client/src/components/notifications/NotifBell.jsx
import { useState, useRef, useEffect } from "react";
import { Bell }                         from "lucide-react";
import { useSelector }                  from "react-redux";
import NotifDropdown                    from "./NotifDropdown";

const NotifBell = () => {
  const [open, setOpen]   = useState(false);
  const unreadCount       = useSelector((s) => s.notifs.unreadCount);
  const ref               = useRef(null);

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
        className="relative p-2 rounded-xl transition-all"
        style={{ color: "var(--tx-muted)" }}
        onMouseEnter={e => e.currentTarget.style.background = "var(--p50)"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        aria-label="Notifications">
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px]
                           text-white text-[10px] font-bold
                           rounded-full flex items-center justify-center px-1"
                style={{ background: "var(--danger)", fontFamily: "Syne, sans-serif" }}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
      {open && <NotifDropdown onClose={() => setOpen(false)} />}
    </div>
  );
};
export default NotifBell;
