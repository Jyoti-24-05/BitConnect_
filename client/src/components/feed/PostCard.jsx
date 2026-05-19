// client/src/components/feed/PostCard.jsx
import { useState }             from "react";
import { Link }                 from "react-router-dom";
import { Heart, MessageCircle,
         Bookmark, Share2,
         MoreHorizontal }       from "lucide-react";
import { useDispatch }          from "react-redux";
import { toggleLike }           from "@/store/slices/postSlice";
import { postApi }              from "@/api/postApi";
import useAuth                  from "@/hooks/useAuth";
import { timeAgo }              from "@/utils/formatDate";
import cn                       from "@/utils/cn";
import toast                    from "react-hot-toast";

const PostCard = ({ post }) => {
  const dispatch              = useDispatch();
  const { user }              = useAuth();
  const [bookmarked,
         setBookmarked]       = useState(false);
  const [likeLoading,
         setLikeLoading]      = useState(false);

  const isLiked = post.likes?.includes(user?._id);

  const handleLike = async () => {
    if (likeLoading) return;
    // Optimistic update
    dispatch(toggleLike({ postId: post._id, userId: user._id }));
    setLikeLoading(true);
    try {
      await postApi.toggleLike(post._id);
    } catch {
      // Roll back on failure
      dispatch(toggleLike({ postId: post._id, userId: user._id }));
      toast.error("Failed to like post");
    } finally {
      setLikeLoading(false);
    }
  };

  const handleBookmark = async () => {
    try {
      await postApi.toggleBookmark(post._id);
      setBookmarked((p) => !p);
      toast.success(bookmarked ? "Removed from bookmarks" : "Bookmarked");
    } catch {
      toast.error("Failed to bookmark");
    }
  };

  return (
    <article className="bg-white rounded-2xl border border-gray-100
                        shadow-sm hover:shadow-md transition p-5">
      {/* Author row */}
      <div className="flex items-start justify-between mb-3">
        <Link to={`/profile/${post.author?.username}`}
              className="flex items-center gap-3">
          {post.author?.profilePicture ? (
            <img src={post.author.profilePicture}
                 alt={post.author.username}
                 className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-indigo-100
                            flex items-center justify-center
                            text-indigo-600 font-semibold">
              {post.author?.username?.[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-semibold text-sm text-gray-900">
              {post.author?.username}
              {post.author?.isVerified && (
                <span className="ml-1 text-indigo-500 text-xs">✓</span>
              )}
            </p>
            <p className="text-xs text-gray-400">
              {timeAgo(post.createdAt)}
              {post.club && (
                <> · <Link to={`/clubs/${post.club.slug}`}
                           className="text-indigo-500 hover:underline">
                  {post.club.name}
                </Link></>
              )}
            </p>
          </div>
        </Link>

        {/* Post type badge */}
        {post.type !== "general" && (
          <span className={cn(
            "text-xs font-medium px-2.5 py-1 rounded-full capitalize",
            post.type === "announcement" && "bg-blue-50 text-blue-600",
            post.type === "achievement"  && "bg-green-50 text-green-600",
            post.type === "opportunity"  && "bg-amber-50 text-amber-600",
          )}>
            {post.type}
          </span>
        )}
      </div>

      {/* Content */}
      <Link to={`/posts/${post._id}`}>
        <p className="text-gray-800 text-sm leading-relaxed mb-3 line-clamp-4">
          {post.content}
        </p>
      </Link>

      {/* Images */}
      {post.images?.length > 0 && (
        <div className={cn(
          "grid gap-2 mb-3 rounded-xl overflow-hidden",
          post.images.length === 1 ? "grid-cols-1" : "grid-cols-2"
        )}>
          {post.images.slice(0, 4).map((img, i) => (
            <img key={i} src={img.url} alt=""
                 className="w-full h-48 object-cover" />
          ))}
        </div>
      )}

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {post.tags.map((tag) => (
            <span key={tag}
                  className="text-xs text-indigo-600 bg-indigo-50
                             px-2 py-0.5 rounded-full">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Opportunity meta */}
      {post.type === "opportunity" && post.opportunityMeta?.applyLink && (
        <a href={post.opportunityMeta.applyLink}
           target="_blank" rel="noopener noreferrer"
           className="inline-flex items-center gap-1.5 text-xs font-medium
                      text-white bg-indigo-600 hover:bg-indigo-700 transition
                      px-3 py-1.5 rounded-lg mb-3">
          Apply now →
        </a>
      )}

      {/* Action bar */}
      <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
        <button onClick={handleLike}
                className={cn(
                  "flex items-center gap-1.5 text-sm transition",
                  isLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"
                )}>
          <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
          {post.likes?.length ?? 0}
        </button>

        <Link to={`/posts/${post._id}`}
              className="flex items-center gap-1.5 text-sm
                         text-gray-500 hover:text-indigo-500 transition">
          <MessageCircle className="w-4 h-4" />
          {post.commentCount ?? 0}
        </Link>

        <button onClick={handleBookmark}
                className={cn(
                  "flex items-center gap-1.5 text-sm transition ml-auto",
                  bookmarked ? "text-indigo-500" : "text-gray-500 hover:text-indigo-500"
                )}>
          <Bookmark className={cn("w-4 h-4", bookmarked && "fill-current")} />
        </button>
      </div>
    </article>
  );
};
export default PostCard;