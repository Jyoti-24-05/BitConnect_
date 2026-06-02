// client/src/components/messages/MessagesPanel.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { Edit3, Search, Send, ArrowLeft, Check, X, UserPlus } from "lucide-react";
import { userApi } from "@/api/userApi";
import useAuth from "@/hooks/useAuth";
import useSocket from "@/hooks/useSocket";
import { SOCKET_EVENTS } from "@/utils/constants";
import { timeAgo } from "@/utils/formatDate";
import toast from "react-hot-toast";

const Avatar = ({ user, size = "sm" }) => {
  const s = size === "sm" ? "w-9 h-9 text-sm" : "w-10 h-10 text-base";
  if (user?.profilePicture) {
    return <img src={user.profilePicture} alt={user.username} className={`${s} rounded-full object-cover shrink-0`} />;
  }
  const colors = [
    "linear-gradient(135deg,#7c3aed,#a855f7)",
    "linear-gradient(135deg,#3b82f6,#06b6d4)",
    "linear-gradient(135deg,#10b981,#34d399)",
    "linear-gradient(135deg,#f59e0b,#f97316)",
  ];
  const color = colors[(user?.username?.charCodeAt(0) ?? 0) % colors.length];
  return (
    <div className={`${s} rounded-full flex items-center justify-center text-white font-bold shrink-0`}
         style={{ background: color }}>
      {(user?.username?.[0] ?? "?").toUpperCase()}
    </div>
  );
};

const FollowRequestsTab = () => {
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    userApi.getFollowRequests()
      .then(({ data }) => setRequests(data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const accept = async (requesterId) => {
    try {
      await userApi.acceptFollowRequest(requesterId);
      setRequests((prev) => prev.filter((r) => r._id !== requesterId));
      toast.success("Follow request accepted");
    } catch {
      toast.error("Failed to accept");
    }
  };

  const reject = async (requesterId) => {
    try {
      await userApi.rejectFollowRequest(requesterId);
      setRequests((prev) => prev.filter((r) => r._id !== requesterId));
    } catch {
      toast.error("Failed to reject");
    }
  };

  if (loading) return <p className="text-center py-6 text-xs" style={{ color: "var(--tx-muted)" }}>Loading...</p>;
  if (!requests.length) return (
    <div className="text-center py-8">
      <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-30" style={{ color: "var(--tx-muted)" }} />
      <p className="text-xs" style={{ color: "var(--tx-muted)" }}>No pending requests</p>
    </div>
  );

  return (
    <div className="py-1">
      {requests.map((req) => (
        <div key={req._id} className="px-4 py-3">
          <div className="flex items-center gap-2.5 mb-2.5">
            <Avatar user={req} />
            <div>
              <p className="text-xs font-semibold" style={{ color: "var(--tx-h)", fontFamily: "Syne, sans-serif" }}>
                {req.username}
              </p>
              {req.bio && <p className="text-[10px] truncate max-w-[140px]" style={{ color: "var(--tx-muted)" }}>{req.bio}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => accept(req._id)}
                    className="btn-primary flex-1 py-1.5 text-xs flex items-center justify-center gap-1">
              <Check className="w-3 h-3" /> Accept
            </button>
            <button onClick={() => reject(req._id)}
                    className="btn-ghost flex-1 py-1.5 text-xs flex items-center justify-center gap-1">
              <X className="w-3 h-3" /> Deny
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

const ChatWindow = ({ other, onBack }) => {
  const { user: me }     = useAuth();
  const { socket }       = useSocket();
  const [messages, setMessages] = useState([]);
  const [text, setText]         = useState("");
  const [loading, setLoading]   = useState(true);
  const [canMessage, setCanMessage] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    userApi.getMessages(other._id)
      .then(({ data }) => {
        setMessages(data.data.messages ?? []);
        setCanMessage(true);
      })
      .catch((err) => {
        if (err.response?.status === 403) setCanMessage(false);
        else toast.error("Could not load messages");
      })
      .finally(() => setLoading(false));
  }, [other._id]);

  useEffect(() => {
    if (!socket) return;
    const handler = (msg) => {
      const ids = [me._id, other._id].map(String).sort();
      const myConvoId = ids.join("_");
      if (msg.conversation === myConvoId) {
        setMessages((prev) => prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]);
      }
    };
    socket.on(SOCKET_EVENTS.MESSAGE_RECEIVE, handler);
    return () => socket.off(SOCKET_EVENTS.MESSAGE_RECEIVE, handler);
  }, [socket, me._id, other._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!text.trim() || !socket) return;
    socket.emit(SOCKET_EVENTS.MESSAGE_SEND, { recipientId: other._id, text: text.trim() });
    setText("");
  };

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!canMessage) return (
    <div className="flex flex-col h-40">
      <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: "1px solid var(--border)" }}>
        <button onClick={onBack} className="p-1 rounded-lg" style={{ color: "var(--tx-muted)" }}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <Avatar user={other} />
        <span className="text-xs font-semibold" style={{ color: "var(--tx-h)", fontFamily: "Syne, sans-serif" }}>{other.username}</span>
      </div>
      <p className="text-center text-xs px-4 py-8" style={{ color: "var(--tx-muted)" }}>
        You can only message mutual followers.
      </p>
    </div>
  );

  return (
    <div className="flex flex-col" style={{ height: 380 }}>
      <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: "1px solid var(--border)" }}>
        <button onClick={onBack} className="p-1 rounded-lg transition"
                style={{ color: "var(--tx-muted)" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--p50)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <Avatar user={other} />
        <span className="text-xs font-semibold" style={{ color: "var(--tx-h)", fontFamily: "Syne, sans-serif" }}>{other.username}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {messages.length === 0 && (
          <p className="text-center text-xs py-6" style={{ color: "var(--tx-muted)" }}>Say hello 👋</p>
        )}
        {messages.map((msg) => {
          const isMine = String(msg.sender?._id ?? msg.sender) === String(me._id);
          return (
            <div key={msg._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[75%] px-3 py-1.5 rounded-2xl text-xs"
                   style={{
                     background: isMine ? "var(--p500)" : "var(--surface2)",
                     color: isMine ? "#fff" : "var(--tx-h)",
                     borderBottomRightRadius: isMine ? 4 : 16,
                     borderBottomLeftRadius: !isMine ? 4 : 16,
                   }}>
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="px-3 py-2" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex gap-2 items-center">
          <input value={text}
                 onChange={(e) => setText(e.target.value)}
                 onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                 placeholder="Message..."
                 className="input-base flex-1 px-3 py-1.5 text-xs"
                 style={{ borderRadius: 99 }} />
          <button onClick={send} disabled={!text.trim()}
                  className="p-1.5 rounded-full transition"
                  style={{
                    background: text.trim() ? "var(--p500)" : "var(--surface2)",
                    color: text.trim() ? "#fff" : "var(--tx-muted)"
                  }}>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

const MessagesPanel = () => {
  const { socket }       = useSocket();
  const [tab, setTab]    = useState("primary");
  const [search, setSearch]   = useState("");
  const [convos, setConvos]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [openChat, setOpenChat] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);

  const loadConvos = useCallback(() => {
    userApi.getConversations()
      .then(({ data }) => setConvos(data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadConvos(); }, [loadConvos]);

  useEffect(() => {
    userApi.getFollowRequests()
      .then(({ data }) => setPendingCount((data.data ?? []).length))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handler = (msg) => {
      setConvos((prev) => {
        const existing = prev.find((c) => c._id === msg.conversation);
        if (existing) {
          return [
            { ...existing, lastMsg: msg, unread: (existing.unread ?? 0) + 1 },
            ...prev.filter((c) => c._id !== msg.conversation),
          ];
        }
        loadConvos();
        return prev;
      });
    };
    socket.on(SOCKET_EVENTS.MESSAGE_RECEIVE, handler);
    return () => socket.off(SOCKET_EVENTS.MESSAGE_RECEIVE, handler);
  }, [socket, loadConvos]);

  const filtered = convos.filter((c) =>
    c.other?.username?.toLowerCase().includes(search.toLowerCase())
  );

  const TABS = [
    { key: "primary",  label: "Messages" },
    { key: "requests", label: `Requests${pendingCount ? ` (${pendingCount})` : ""}` },
  ];

  return (
    <aside className="hidden xl:block w-72 shrink-0">
      <div className="sticky top-20 card rounded-2xl overflow-hidden" style={{ background: "var(--card)" }}>
        {openChat ? (
          <ChatWindow other={openChat} onBack={() => { setOpenChat(null); loadConvos(); }} />
        ) : (
          <>
            <div className="flex items-center justify-between px-4 py-3.5"
                 style={{ borderBottom: "1px solid var(--border)" }}>
              <h3 className="font-bold text-sm" style={{ fontFamily: "Syne, sans-serif", color: "var(--tx-h)" }}>Messages</h3>
              <button className="p-1.5 rounded-lg transition" style={{ color: "var(--tx-muted)" }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--p50)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <Edit3 className="w-4 h-4" />
              </button>
            </div>

            <div className="px-3 py-2.5" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "var(--tx-muted)" }} />
                <input placeholder="Search messages"
                       value={search}
                       onChange={(e) => setSearch(e.target.value)}
                       className="input-base w-full pl-9 pr-3 py-2 text-xs"
                       style={{ borderRadius: 99, background: "var(--surface2)" }} />
              </div>
            </div>

            <div className="flex px-3 pt-2 gap-1" style={{ borderBottom: "1px solid var(--border)" }}>
              {TABS.map(({ key, label }) => (
                <button key={key} onClick={() => setTab(key)}
                        className="px-3 py-2 text-xs font-semibold transition-all relative"
                        style={{ color: tab === key ? "var(--p500)" : "var(--tx-muted)", background: "transparent", border: "none" }}>
                  {label}
                  {tab === key && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: "var(--p500)" }} />}
                </button>
              ))}
            </div>

            {tab === "requests" ? (
              <FollowRequestsTab />
            ) : loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 px-4">
                <p className="text-xs leading-relaxed" style={{ color: "var(--tx-muted)" }}>
                  {search ? "No conversations found" : "No messages yet. Follow someone and message them!"}
                </p>
              </div>
            ) : (
              <div className="py-1">
                {filtered.map((c) => (
                  <button key={c._id} onClick={() => setOpenChat(c.other)}
                          className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-left"
                          onMouseEnter={e => e.currentTarget.style.background = "var(--p50)"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div className="relative shrink-0">
                      <Avatar user={c.other} />
                      {c.unread > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                              style={{ background: "var(--p500)" }}>
                          {c.unread > 9 ? "9+" : c.unread}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold truncate"
                              style={{ color: "var(--tx-h)", fontFamily: "Syne, sans-serif" }}>
                          {c.other?.username}
                        </span>
                        <span className="text-[10px] shrink-0" style={{ color: "var(--tx-muted)" }}>
                          {c.lastMsg?.createdAt ? timeAgo(c.lastMsg.createdAt) : ""}
                        </span>
                      </div>
                      <p className="text-[11px] truncate mt-0.5"
                         style={{ color: c.unread > 0 ? "var(--tx-h)" : "var(--tx-muted)", fontWeight: c.unread > 0 ? 600 : 400 }}>
                        {c.lastMsg?.text ?? "Start a conversation"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
};

export default MessagesPanel;