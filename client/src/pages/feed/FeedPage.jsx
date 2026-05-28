// client/src/pages/feed/FeedPage.jsx
import { useEffect, useCallback, useState } from "react";
import { useDispatch, useSelector }         from "react-redux";
import { useSearchParams, Link }            from "react-router-dom";
import { setPosts, appendPosts }            from "@/store/slices/postSlice";
import { postApi }                          from "@/api/postApi";
import useInfiniteScroll                    from "@/hooks/useInfiniteScroll";
import useAuth                              from "@/hooks/useAuth";
import PostCard                             from "@/components/feed/PostCard";
import CreatePostBox                        from "@/components/feed/CreatePostBox";
import PostSkeleton                         from "@/components/feed/PostSkeleton";
import { MessageSquare, Search, Edit3, UserPlus, Check, X, Sparkles } from "lucide-react";

// Mock messages data (UI only — logic unchanged)
const MOCK_MESSAGES = [
  { id: 1, name: "Ramesh", preview: "Hi cutie 👋", time: "2m", avatar: null, unread: true },
  { id: 2, name: "Ben",    preview: "It's Hero time!", time: "15m", avatar: null, unread: false },
  { id: 3, name: "Show yamato", preview: "fire up!! 🔥", time: "1h", avatar: null, unread: false },
];

const MOCK_REQUESTS = [
  { id: 1, name: "Sakshi Shyama", mutual: 12, avatar: null },
];

// Stories/clubs strip (UI only)
const STORY_COLORS = [
  "linear-gradient(135deg,#7c3aed,#a855f7)",
  "linear-gradient(135deg,#3b82f6,#06b6d4)",
  "linear-gradient(135deg,#10b981,#34d399)",
  "linear-gradient(135deg,#f59e0b,#f97316)",
];

const MessagesPanel = () => {
  const [tab, setTab] = useState("primary");

  return (
    <aside className="hidden xl:block w-72 shrink-0">
      <div className="sticky top-20 card rounded-2xl overflow-hidden" style={{ background: "var(--card)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5"
             style={{ borderBottom: "1px solid var(--border)" }}>
          <h3 className="font-bold text-sm" style={{ fontFamily: "Syne, sans-serif", color: "var(--tx-h)" }}>
            Messages
          </h3>
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
            <input placeholder="Search messages"
                   className="input-base w-full pl-9 pr-3 py-2 text-xs"
                   style={{ borderRadius: "99px", background: "var(--surface2)" }} />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-3 pt-2 gap-1" style={{ borderBottom: "1px solid var(--border)" }}>
          {[
            { key: "primary", label: "Primary" },
            { key: "general", label: "General" },
            { key: "requests", label: "Request(7)" },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
                    className="px-3 py-2 text-xs font-semibold transition-all relative"
                    style={{
                      color: tab === key ? "var(--p500)" : "var(--tx-muted)",
                      background: "transparent",
                      border: "none",
                    }}>
              {label}
              {tab === key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                      style={{ background: "var(--p500)" }} />
              )}
            </button>
          ))}
        </div>

        {/* Message list */}
        <div className="py-1">
          {MOCK_MESSAGES.map((msg) => (
            <button key={msg.id}
                    className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-left"
                    onMouseEnter={e => e.currentTarget.style.background = "var(--p50)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                     style={{ background: STORY_COLORS[msg.id % STORY_COLORS.length] }}>
                  {msg.name[0]}
                </div>
                {msg.unread && <span className="online-dot" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold truncate"
                        style={{ color: "var(--tx-h)", fontFamily: "Syne, sans-serif" }}>
                    {msg.name}
                  </span>
                  <span className="text-[10px] shrink-0" style={{ color: "var(--tx-muted)" }}>{msg.time}</span>
                </div>
                <p className="text-[11px] truncate mt-0.5" style={{ color: "var(--tx-muted)" }}>{msg.preview}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Requests */}
        <div style={{ borderTop: "1px solid var(--border)" }}>
          <p className="px-4 pt-3 pb-1.5 text-xs font-semibold uppercase tracking-wide"
             style={{ color: "var(--tx-muted)" }}>
            Requests
          </p>
          {MOCK_REQUESTS.map((req) => (
            <div key={req.id} className="px-4 py-3">
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                     style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
                  {req.name[0]}
                </div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: "var(--tx-h)", fontFamily: "Syne, sans-serif" }}>{req.name}</p>
                  <p className="text-[10px]" style={{ color: "var(--tx-muted)" }}>{req.mutual} mutual friends</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="btn-primary flex-1 py-1.5 text-xs">Accept</button>
                <button className="btn-ghost flex-1 py-1.5 text-xs">Deny</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

const FeedPage = () => {
  const dispatch              = useDispatch();
  const { feed, cursor, hasMore } = useSelector((s) => s.posts);
  const { user }              = useAuth();
  const [loading, setLoading] = useState(false);
  const [params]              = useSearchParams();
  const searchQuery           = params.get("q");

  const loadPosts = useCallback(async (cursorVal = null) => {
    if (loading) return;
    setLoading(true);
    try {
      const { data } = await postApi.getFeed({
        cursor: cursorVal,
        limit: 10,
        ...(searchQuery && { q: searchQuery }),
      });
      if (cursorVal) dispatch(appendPosts(data.data));
      else           dispatch(setPosts(data.data));
    } finally {
      setLoading(false);
    }
  }, [dispatch, searchQuery]);

  useEffect(() => { loadPosts(null); }, [searchQuery]);

  const loadMore    = useCallback(() => { if (cursor) loadPosts(cursor); }, [cursor]);
  const sentinelRef = useInfiniteScroll(loadMore, hasMore, loading);

  return (
    <div className="flex gap-5">
      {/* Main feed */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Clubs/Stories strip */}
        <div className="card rounded-2xl p-4 fade-in-up" style={{ background: "var(--card)" }}>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {["NAPS", "PS Club", "E-Cell", "IEEE"].map((club, i) => (
              <Link key={club} to="/clubs"
                    className="flex flex-col items-center gap-2 shrink-0 group">
                <div className="story-ring">
                  <div className="story-ring-inner">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xs font-bold"
                         style={{ background: STORY_COLORS[i % STORY_COLORS.length] }}>
                      {club[0]}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-center"
                      style={{ color: "var(--tx-muted)", maxWidth: 52, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {club}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <CreatePostBox />

        {searchQuery && (
          <p className="text-sm" style={{ color: "var(--tx-muted)" }}>
            Results for <strong style={{ color: "var(--tx-h)" }}>"{searchQuery}"</strong>
          </p>
        )}

        <div className="space-y-4 stagger">
          {feed.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>

        {loading && Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={i} />)}

        <div ref={sentinelRef} className="h-4" />

        {!hasMore && !loading && (
          <p className="text-center text-sm py-8 flex items-center justify-center gap-2"
             style={{ color: "var(--tx-light)" }}>
            <Sparkles className="w-4 h-4" />
            You're all caught up on BitConnect!
          </p>
        )}
      </div>

      {/* Right panel — Messages */}
      <MessagesPanel />
    </div>
  );
};
export default FeedPage;
