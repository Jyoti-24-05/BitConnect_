// client/src/pages/messages/MessagesPage.jsx
import { useState, useRef, useEffect } from "react";
import { useParams, Link }             from "react-router-dom";
import { Search, Edit3, Send, ArrowLeft, MessageSquare } from "lucide-react";
import useAuth from "@/hooks/useAuth";

const COLORS = [
  "linear-gradient(135deg,#7c3aed,#a855f7)",
  "linear-gradient(135deg,#3b82f6,#06b6d4)",
  "linear-gradient(135deg,#10b981,#34d399)",
  "linear-gradient(135deg,#f59e0b,#f97316)",
  "linear-gradient(135deg,#ec4899,#f43f5e)",
];

const avatarColor = (name = "") =>
  COLORS[name.charCodeAt(0) % COLORS.length];

const CHAT_KEY = (a, b) =>
  `bitconnect_dm_${[a, b].sort().join("_")}`;

const loadChat = (key) => {
  try { return JSON.parse(localStorage.getItem(key) ?? "[]"); }
  catch { return []; }
};

const saveChat = (key, msgs) =>
  localStorage.setItem(key, JSON.stringify(msgs.slice(-300)));

// ── Conversation list (left panel) ───────────────────────────────────────────
const ConvList = ({ user, activeId }) => {
  const [search, setSearch] = useState("");

  // Build list from localStorage keys
  const convs = Object.keys(localStorage)
    .filter(k => k.startsWith(`bitconnect_dm_${user._id}`))
    .map(k => {
      const otherId = k.replace(`bitconnect_dm_${user._id}_`, "");
      const msgs    = loadChat(k);
      const last    = msgs[msgs.length - 1];
      return { id: otherId, last, key: k };
    })
    .filter(c => c.last)
    .sort((a, b) => new Date(b.last.time) - new Date(a.last.time));

  return (
    <div className="flex flex-col h-full"
         style={{ borderRight: "1.5px solid var(--border)" }}>
      {/* Header */}
      <div className="px-4 py-4 flex items-center justify-between"
           style={{ borderBottom: "1px solid var(--border)" }}>
        <h2 className="font-bold" style={{ fontFamily: "Syne, sans-serif", color: "var(--tx-h)" }}>
          Messages
        </h2>
        <button className="p-1.5 rounded-lg transition"
                style={{ color: "var(--tx-muted)" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--p50)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          <Edit3 className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2.5" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                  style={{ color: "var(--tx-muted)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
                 placeholder="Search conversations"
                 className="input-base w-full pl-8 pr-3 py-2 text-xs"
                 style={{ borderRadius: "99px", background: "var(--surface2)" }} />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {convs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 py-12">
            <MessageSquare className="w-8 h-8" style={{ color: "var(--border)" }} />
            <p className="text-xs" style={{ color: "var(--tx-muted)" }}>No conversations yet</p>
            <p className="text-xs text-center px-4" style={{ color: "var(--tx-light)" }}>
              Visit someone's profile and click Message to start a chat
            </p>
          </div>
        ) : (
          convs.map(conv => (
            <Link key={conv.id} to={`/messages/${conv.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors"
                  style={{
                    background: activeId === conv.id ? "var(--p50)" : "transparent",
                    textDecoration: "none",
                    borderLeft: activeId === conv.id ? "3px solid var(--p500)" : "3px solid transparent",
                  }}
                  onMouseEnter={e => { if (activeId !== conv.id) e.currentTarget.style.background = "var(--surface2)"; }}
                  onMouseLeave={e => { if (activeId !== conv.id) e.currentTarget.style.background = "transparent"; }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white text-sm font-bold"
                   style={{ background: avatarColor(conv.last?.username ?? "") }}>
                {(conv.last?.username ?? "?")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate"
                   style={{ color: "var(--tx-h)", fontFamily: "Syne, sans-serif" }}>
                  {conv.last?.toUsername ?? conv.id}
                </p>
                <p className="text-[11px] truncate" style={{ color: "var(--tx-muted)" }}>
                  {conv.last?.userId === user._id ? "You: " : ""}{conv.last?.text}
                </p>
              </div>
              <span className="text-[10px] shrink-0" style={{ color: "var(--tx-light)" }}>
                {new Date(conv.last?.time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

// ── Chat window (right panel) ─────────────────────────────────────────────────
const ChatWindow = ({ user, recipientId }) => {
  const chatKey               = CHAT_KEY(user._id, recipientId);
  const [msgs, setMsgs]       = useState(() => loadChat(chatKey));
  const [text, setText]       = useState("");
  const bottomRef             = useRef(null);

  useEffect(() => {
    setMsgs(loadChat(chatKey));
  }, [chatKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const msg = {
      id:         Date.now(),
      userId:     user._id,
      username:   user.username,
      toUsername: recipientId,
      text:       trimmed,
      time:       new Date().toISOString(),
    };
    const next = [...msgs, msg];
    setMsgs(next);
    saveChat(chatKey, next);
    setText("");
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  if (!recipientId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3"
           style={{ color: "var(--tx-muted)" }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
             style={{ background: "var(--p50)" }}>
          <MessageSquare className="w-8 h-8" style={{ color: "var(--p300)" }} />
        </div>
        <p className="font-semibold text-sm" style={{ fontFamily: "Syne, sans-serif", color: "var(--tx-h)" }}>
          Your messages
        </p>
        <p className="text-xs text-center max-w-xs" style={{ color: "var(--tx-muted)" }}>
          Select a conversation or visit a profile to start messaging
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col" style={{ minHeight: 0 }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5"
           style={{ borderBottom: "1.5px solid var(--border)" }}>
        <Link to="/messages" className="lg:hidden p-1.5 rounded-lg transition"
              style={{ color: "var(--tx-muted)" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--p50)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <Link to={`/profile/${recipientId}`} className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
               style={{ background: avatarColor(recipientId) }}>
            {recipientId[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-bold group-hover:underline"
               style={{ color: "var(--tx-h)", fontFamily: "Syne, sans-serif" }}>
              {recipientId}
            </p>
            <p className="text-[10px]" style={{ color: "var(--success)" }}>● Active now</p>
          </div>
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {msgs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2 opacity-60">
            <MessageSquare className="w-8 h-8" style={{ color: "var(--border)" }} />
            <p className="text-sm" style={{ color: "var(--tx-muted)" }}>
              No messages yet — say hello! 👋
            </p>
          </div>
        )}
        {msgs.map(msg => {
          const isMe = msg.userId === user._id;
          return (
            <div key={msg.id} className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mb-0.5"
                   style={{ background: avatarColor(msg.username ?? "") }}>
                {(msg.username ?? "?")[0].toUpperCase()}
              </div>
              <div className={`flex flex-col gap-0.5 max-w-[70%] ${isMe ? "items-end" : "items-start"}`}>
                {!isMe && (
                  <span className="text-[10px] font-semibold ml-1" style={{ color: "var(--p500)" }}>
                    {msg.username}
                  </span>
                )}
                <div className="px-3.5 py-2 text-sm leading-relaxed break-words"
                     style={{
                       borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                       background:   isMe ? "linear-gradient(135deg,#7c3aed,#a855f7)" : "var(--surface2)",
                       color:        isMe ? "#fff" : "var(--tx)",
                       border:       isMe ? "none" : "1px solid var(--border)",
                     }}>
                  {msg.text}
                </div>
                <span className="text-[10px] mx-1" style={{ color: "var(--tx-light)" }}>
                  {new Date(msg.time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 flex items-end gap-2"
           style={{ borderTop: "1.5px solid var(--border)" }}>
        <textarea value={text} onChange={e => setText(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder={`Message ${recipientId}...`}
                  rows={1}
                  className="flex-1 input-base px-4 py-2.5 text-sm resize-none"
                  style={{ borderRadius: "var(--r-lg)", maxHeight: 100 }}
                  onInput={e => {
                    e.target.style.height = "auto";
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
                  }} />
        <button onClick={send} disabled={!text.trim()}
                className="btn-primary p-2.5 shrink-0"
                style={{ borderRadius: "var(--r)", opacity: text.trim() ? 1 : 0.5 }}>
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────
const MessagesPage = () => {
  const { user }      = useAuth();
  const { userId }    = useParams();   // /messages/:userId (optional)

  if (!user) return null;

  return (
    <div className="card rounded-2xl overflow-hidden flex"
         style={{ background: "var(--card)", height: "calc(100vh - 120px)", minHeight: 500 }}>
      {/* Left — conversation list */}
      <div className="w-72 shrink-0 hidden sm:block">
        <ConvList user={user} activeId={userId} />
      </div>

      {/* Right — chat window */}
      <ChatWindow user={user} recipientId={userId} />
    </div>
  );
};

export default MessagesPage;
