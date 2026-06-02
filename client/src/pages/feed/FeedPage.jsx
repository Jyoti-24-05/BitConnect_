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
import { Sparkles } from "lucide-react";
import MessagesPanel from "@/components/messages/MessagesPanel";

const STORY_COLORS = [
  "linear-gradient(135deg,#7c3aed,#a855f7)",
  "linear-gradient(135deg,#3b82f6,#06b6d4)",
  "linear-gradient(135deg,#10b981,#34d399)",
  "linear-gradient(135deg,#f59e0b,#f97316)",
];



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