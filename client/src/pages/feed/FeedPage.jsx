// client/src/pages/feed/FeedPage.jsx
import { useEffect, useCallback }   from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams }          from "react-router-dom";
import { setPosts, appendPosts }    from "@/store/slices/postSlice";
import { postApi }                  from "@/api/postApi";
import useInfiniteScroll            from "@/hooks/useInfiniteScroll";
import PostCard                     from "@/components/feed/PostCard";
import CreatePostBox                from "@/components/feed/CreatePostBox";
import PostSkeleton                 from "@/components/feed/PostSkeleton";
import { useState }                 from "react";

const FeedPage = () => {
  const dispatch              = useDispatch();
  const { feed, cursor,
          hasMore }           = useSelector((s) => s.posts);
  const [loading, setLoading] = useState(false);
  const [params]              = useSearchParams();
  const searchQuery           = params.get("q");

  const loadPosts = useCallback(async (cursorVal = null) => {
    if (loading) return;
    setLoading(true);
    try {
      const { data } = await postApi.getFeed({
        cursor: cursorVal,
        limit:  10,
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
    <div className="space-y-4">
      <CreatePostBox />

      {searchQuery && (
        <p className="text-sm text-gray-500">
          Results for <strong>"{searchQuery}"</strong>
        </p>
      )}

      {feed.map((post) => (
        <PostCard key={post._id} post={post} />
      ))}

      {loading && Array.from({ length: 3 }).map((_, i) => (
        <PostSkeleton key={i} />
      ))}

      {/* Invisible sentinel — triggers loadMore when visible */}
      <div ref={sentinelRef} className="h-4" />

      {!hasMore && !loading && (
        <p className="text-center text-sm text-gray-400 py-8">
          You're all caught up 🎉
        </p>
      )}
    </div>
  );
};
export default FeedPage;