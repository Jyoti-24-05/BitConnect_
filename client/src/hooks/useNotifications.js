// client/src/hooks/useNotifications.js
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { prependNotif } from "@/store/slices/notifSlice";
import { SOCKET_EVENTS } from "@/utils/constants";
import useSocket from "./useSocket";
import toast from "react-hot-toast";

// Drop this hook in your root layout — it listens for real-time notifications
const useNotifications = () => {
  const { socket } = useSocket();
  const dispatch   = useDispatch();

  useEffect(() => {
    if (!socket) return;

    const handler = (notif) => {
      dispatch(prependNotif(notif));
      toast(notif.message, { icon: "🔔", duration: 4000 });
    };

    socket.on(SOCKET_EVENTS.NEW_NOTIFICATION, handler);
    return () => socket.off(SOCKET_EVENTS.NEW_NOTIFICATION, handler);
  }, [socket, dispatch]);
};
export default useNotifications;