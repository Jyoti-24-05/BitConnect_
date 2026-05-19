// client/src/components/notifications/NotifDropdown.jsx
import { useEffect }              from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link }                   from "react-router-dom";
import { Bell, Check, Trash2 }    from "lucide-react";
import {
  setNotifications,
  markRead,
  markAllRead,
  removeNotif,
}                                 from "@/store/slices/notifSlice";
import { notifApi }               from "@/api/notifApi";
import { timeAgo }                from "@/utils/formatDate";
import Spinner                    from "@/components/common/Spinner";
import cn                         from "@/utils/cn";
import toast                      from "react-hot-toast";
import { useState }               from "react";

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
      } finally {
        setLoading(false);
      }
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
    toast.success("All marked as read");
  };

  const handleDelete = async (e, notifId) => {
    e.stopPropagation();
    dispatch(removeNotif(notifId));
    await notifApi.deleteNotif(notifId).catch(() => {});
  };

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

  return (
    <div className="absolute right-0 top-12 z-50 w-80 bg-white rounded-2xl
                    shadow-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3
                      border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-indigo-500" />
          <h3 className="font-semibold text-sm text-gray-900">
            Notifications
          </h3>
          {unreadCount > 0 && (
            <span className="bg-indigo-600 text-white text-xs
                             font-bold px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            className="text-xs text-indigo-600 hover:underline
                       flex items-center gap-1"
          >
            <Check className="w-3 h-3" /> Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Spinner size="md" />
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-10">
            <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No notifications yet</p>
          </div>
        ) : (
          list.map((notif) => (
            <div
              key={notif._id}
              onClick={() => !notif.isRead && handleMarkRead(notif._id)}
              className={cn(
                "flex items-start gap-3 px-4 py-3 cursor-pointer group",
                "hover:bg-gray-50 transition",
                !notif.isRead && "bg-indigo-50/50"
              )}
            >
              {/* Icon */}
              <span className="text-lg shrink-0 mt-0.5">
                {NOTIF_ICONS[notif.type] ?? NOTIF_ICONS.default}
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {notif.sender && (
                  <span className="font-semibold text-xs text-gray-900">
                    {notif.sender.username}{" "}
                  </span>
                )}
                <span className="text-xs text-gray-600">{notif.message}</span>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {timeAgo(notif.createdAt)}
                </p>
              </div>

              {/* Unread dot + delete */}
              <div className="flex flex-col items-center gap-2 shrink-0">
                {!notif.isRead && (
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                )}
                <button
                  onClick={(e) => handleDelete(e, notif._id)}
                  className="opacity-0 group-hover:opacity-100 transition
                             text-gray-300 hover:text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {list.length > 0 && (
        <div className="border-t border-gray-100 px-4 py-2.5 text-center">
          <button
            onClick={onClose}
            className="text-xs text-indigo-600 hover:underline"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};
export default NotifDropdown;