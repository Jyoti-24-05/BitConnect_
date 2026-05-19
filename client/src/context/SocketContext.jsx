// client/src/context/SocketContext.jsx
import {
  createContext, useEffect, useRef,
  useState, useCallback,
} from "react";
import { io }              from "socket.io-client";
import { SOCKET_EVENTS }   from "@/utils/constants";

export const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? "http://localhost:8000";

export const SocketProvider = ({ children, accessToken }) => {
  const socketRef    = useRef(null);
  const [connected,  setConnected]  = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useEffect(() => {
    // Only connect when we have a token
    if (!accessToken) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
      return;
    }

    const socket = io(SOCKET_URL, {
      auth:             { token: `Bearer ${accessToken}` },
      transports:       ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay:    1000,
    });

    socket.on("connect",    () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on(SOCKET_EVENTS.USER_ONLINE,  ({ userId }) => {
      setOnlineUsers((prev) => new Set(prev).add(userId));
    });
    socket.on(SOCKET_EVENTS.USER_OFFLINE, ({ userId }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken]);

  const joinEventRoom = useCallback((eventId) => {
    socketRef.current?.emit(SOCKET_EVENTS.JOIN_EVENT_ROOM, eventId);
  }, []);

  const leaveEventRoom = useCallback((eventId) => {
    socketRef.current?.emit(SOCKET_EVENTS.LEAVE_EVENT_ROOM, eventId);
  }, []);

  const value = {
    socket:      socketRef.current,
    connected,
    onlineUsers,
    joinEventRoom,
    leaveEventRoom,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};