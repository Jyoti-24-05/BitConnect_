// client/src/components/notifications/NotifDropdown.jsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link }                   from "react-router-dom";
import { Bell, Check, Trash2 }    from "lucide-react";
import { setNotifications, markRead, markAllRead, removeNotif } from "@/store/slices/notifSlice";
import { notifApi }               from "@/api/notifApi";
import { timeAgo }                from "@/utils/formatDate";
import Spinner                    from "@/components/common/Spinner";
import cn                         from "@/utils/cn";
import toast                      from "react-hot-toast";

const NOTIF_ICONS = {
  post_liked:            "❤️",
  post_commented:        "💬",
  post_shared:           "🔁",
  new_follower:          "👤",
  event_created:         "📅",
  event_reminder:        "⏰",
  event_cancelled:       "❌",
  rsvp_confirmed:        "🎟️",
  club_join_request:     "🔔",
  club_request_approved: "✅",
  club_request_rejected: "❌",
  welcome:               "🎉",
  default:               "🔔",
};

const NotifDropdown = ({ onClose }) => {
  const dispatch              = useDispatch();
  const { list, unreadCount } = useSelector((s) => s.notifs);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await notifApi.getNotifications({ limit: 20 });
        dispatch(setNotifications(data.data));
      } finally { setLoading(false); }
    };
    load();
  }, [dispatch]);

  const handleMarkRead = async (notifId) => {
    dispatch(markRead(notifId));
    await notifApi.markAsRead(notifId).catch(() => {});
  };

  const handleMarkAll = async () => {
    dispatch(markAllRead());
    await notifApi.markAllAsRead().catch(() => {});
    toast.success("All read ✓");
  };

  const handleDelete = async (e, notifId) => {
    e.stopPropagation();
    dispatch(removeNotif(notifId));
    await notifApi.deleteNotif(notifId).catch(() => {});
  };

  return (
    <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl overflow-hidden shadow-2xl scale-in"
         style={{ background: "var(--card)", border: "1.5px solid var(--border)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5"
           style={{ background: "linear-gradient(135deg, var(--p50), var(--p100))", borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4" style={{ color: "var(--p500)" }} />
          <h3 className="font-bold text-sm" style={{ fontFamily: "Syne, sans-serif", color: "var(--tx-h)" }}>
            Notifications
          </h3>
          {unreadCount > 0 && (
            <span className="text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: "var(--danger)", fontFamily: "Syne, sans-serif" }}>
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAll}
                  className="text-xs font-semibold flex items-center gap-1 hover:underline"
                  style={{ color: "var(--p500)" }}>
            <Check className="w-3 h-3" /> Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Spinner size="md" />
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-10">
            <Bell className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--border)" }} />
            <p className="text-sm" style={{ color: "var(--tx-muted)" }}>No notifications yet</p>
          </div>
        ) : (
          list.map((notif) => (
            <div key={notif._id}
                 onClick={() => !notif.isRead && handleMarkRead(notif._id)}
                 className="flex items-start gap-3 px-4 py-3 cursor-pointer group transition-colors"
                 style={{
                   background: !notif.isRead ? "var(--p50)" : "transparent",
                   borderBottom: "1px solid var(--border)",
                 }}
                 onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"}
                 onMouseLeave={e => e.currentTarget.style.background = !notif.isRead ? "var(--p50)" : "transparent"}>
              <span className="text-lg shrink-0 mt-0.5">
                {NOTIF_ICONS[notif.type] ?? NOTIF_ICONS.default}
              </span>
              <div className="flex-1 min-w-0">
                {notif.sender && (
                  <span className="font-semibold text-xs" style={{ color: "var(--tx-h)", fontFamily: "Syne, sans-serif" }}>
                    {notif.sender.username}{" "}
                  </span>
                )}
                <span className="text-xs" style={{ color: "var(--tx)" }}>{notif.message}</span>
                <p className="text-[10px] mt-0.5" style={{ color: "var(--tx-muted)" }}>
                  {timeAgo(notif.createdAt)}
                </p>
              </div>
              <div className="flex flex-col items-center gap-2 shrink-0">
                {!notif.isRead && (
                  <span className="w-2 h-2 rounded-full" style={{ background: "var(--p500)" }} />
                )}
                <button onClick={(e) => handleDelete(e, notif._id)}
                        className="opacity-0 group-hover:opacity-100 transition"
                        style={{ color: "var(--tx-light)" }}
                        onMouseEnter={e => e.currentTarget.style.color = "var(--danger)"}
                        onMouseLeave={e => e.currentTarget.style.color = "var(--tx-light)"}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {list.length > 0 && (
        <div className="px-4 py-2.5 text-center" style={{ borderTop: "1px solid var(--border)" }}>
          <button onClick={onClose} className="text-xs font-semibold hover:underline"
                  style={{ color: "var(--p500)" }}>
            Close
          </button>
        </div>
      )}
    </div>
  );
};
export default NotifDropdown;
