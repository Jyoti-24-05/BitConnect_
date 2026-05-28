// client/src/components/feed/PostCard.jsx
import { useState }             from "react";
import { Link }                 from "react-router-dom";
import { Heart, MessageCircle, Bookmark, Send, MoreHorizontal } from "lucide-react";
import { useDispatch }          from "react-redux";
import { toggleLike }           from "@/store/slices/postSlice";
import { postApi }              from "@/api/postApi";
import useAuth                  from "@/hooks/useAuth";
import { timeAgo }              from "@/utils/formatDate";
import cn                       from "@/utils/cn";
import toast                    from "react-hot-toast";

const TYPE_BADGE = {
  announcement: { cls: "badge-blue",  label: "📢 Announcement" },
  achievement:  { cls: "badge-green", label: "🏆 Achievement"  },
  opportunity:  { cls: "badge-amber", label: "💡 Opportunity"  },
};

const PostCard = ({ post }) => {
  const dispatch              = useDispatch();
  const { user }              = useAuth();
  const [bookmarked, setBookmarked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const isLiked = post.likes?.includes(user?._id);

  const handleLike = async () => {
    if (likeLoading) return;
    dispatch(toggleLike({ postId: post._id, userId: user._id }));
    setLikeLoading(true);
    try {
      await postApi.toggleLike(post._id);
    } catch {
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
      toast.success(bookmarked ? "Removed from bookmarks" : "Bookmarked!");
    } catch {
      toast.error("Failed to bookmark");
    }
  };

  const badge = TYPE_BADGE[post.type];

  return (
    <article className="card card-lift rounded-2xl p-5 fade-in-up"
             style={{ background: "var(--card)" }}>

      {/* Author row */}
      <div className="flex items-start justify-between mb-4">
        <Link to={`/profile/${post.author?.username}`} className="flex items-center gap-3">
          {post.author?.profilePicture ? (
            <div className="story-ring">
              <div className="story-ring-inner">
                <img src={post.author.profilePicture} alt={post.author.username}
                     className="w-10 h-10 rounded-full object-cover block" />
              </div>
            </div>
          ) : (
            <div className="story-ring">
              <div className="story-ring-inner">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                     style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", fontFamily: "Syne, sans-serif" }}>
                  {post.author?.username?.[0]?.toUpperCase()}
                </div>
              </div>
            </div>
          )}
          <div>
            <p className="font-semibold text-sm flex items-center gap-1.5"
               style={{ color: "var(--tx-h)", fontFamily: "Syne, sans-serif" }}>
              {post.author?.username}
              {post.author?.isVerified && (
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-[9px]"
                      style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>✓</span>
              )}
            </p>
            <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: "var(--tx-muted)" }}>
              {timeAgo(post.createdAt)}
              {post.club && (
                <> · <Link to={`/clubs/${post.club.slug}`}
                           className="hover:underline font-medium" style={{ color: "var(--p500)" }}>
                  {post.club.name}
                </Link></>
              )}
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {badge && (
            <span className={`badge ${badge.cls}`}>{badge.label}</span>
          )}
          <button className="p-1.5 rounded-xl transition"
                  style={{ color: "var(--tx-muted)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--p50)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <Link to={`/posts/${post._id}`}>
        <p className="text-sm leading-relaxed mb-3 line-clamp-4"
           style={{ color: "var(--tx)" }}>
          {post.content}
        </p>
      </Link>

      {/* Images */}
      {post.images?.length > 0 && (
        <div className={cn("grid gap-2 mb-4 overflow-hidden",
          post.images.length === 1 ? "grid-cols-1" : "grid-cols-2")}
             style={{ borderRadius: "var(--r)" }}>
          {post.images.slice(0, 4).map((img, i) => (
            <img key={i} src={img.url} alt=""
                 className="w-full h-52 object-cover transition hover:scale-[1.01]"
                 style={{ borderRadius: post.images.length === 1 ? "var(--r)" : i === 0 ? "var(--r) 0 0 var(--r)" : "0 var(--r) var(--r) 0" }} />
          ))}
        </div>
      )}

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {post.tags.map((tag) => (
            <span key={tag} className="tag-chip cursor-pointer">#{tag}</span>
          ))}
        </div>
      )}

      {/* Apply link */}
      {post.type === "opportunity" && post.opportunityMeta?.applyLink && (
        <a href={post.opportunityMeta.applyLink} target="_blank" rel="noopener noreferrer"
           className="btn-primary inline-flex items-center gap-1.5 text-xs px-4 py-2 mb-3">
          Apply now →
        </a>
      )}

      {/* Action bar */}
      <div className="flex items-center gap-1 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
        <button onClick={handleLike}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all"
                style={{ color: isLiked ? "var(--danger)" : "var(--tx-muted)" }}
                onMouseEnter={e => e.currentTarget.style.background = isLiked ? "#fef2f2" : "var(--p50)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          <Heart className={cn("w-4 h-4 transition-transform", isLiked && "fill-current scale-110")} />
          <span className="font-medium text-xs">{post.likes?.length ?? 0}</span>
        </button>

        <Link to={`/posts/${post._id}`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all"
              style={{ color: "var(--tx-muted)" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--p50)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          <MessageCircle className="w-4 h-4" />
          <span className="font-medium text-xs">{post.commentCount ?? 0}</span>
        </Link>

        <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all"
                style={{ color: "var(--tx-muted)" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--p50)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          <Send className="w-4 h-4" />
        </button>

        <button onClick={handleBookmark}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all ml-auto"
                style={{ color: bookmarked ? "var(--p500)" : "var(--tx-muted)" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--p50)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          <Bookmark className={cn("w-4 h-4", bookmarked && "fill-current")} />
        </button>
      </div>
    </article>
  );
};
export default PostCard;
