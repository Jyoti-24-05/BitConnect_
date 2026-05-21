// client/src/pages/feed/PostDetailPage.jsx
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link }     from "react-router-dom";
import { useDispatch, useSelector }         from "react-redux";
import {
  Heart, MessageCircle, Bookmark,
  Share2, ArrowLeft, MoreHorizontal,
  Trash2, Flag,
}                                           from "lucide-react";
import { postApi }                          from "@/api/postApi";
import { toggleLike, removePost }           from "@/store/slices/postSlice";
import useAuth                              from "@/hooks/useAuth";
import Avatar                              from "@/components/common/Avatar";
import { PageSpinner }                     from "@/components/common/Spinner";
import EmptyState                          from "@/components/common/EmptyState";
import CommentSection                      from "@/components/feed/CommentSection";
import { timeAgo, formatDateTime }         from "@/utils/formatDate";
import cn                                  from "@/utils/cn";
import toast                               from "react-hot-toast";

// ─── Post type badge colors ───────────────────────────────────────────────────
const TYPE_STYLES = {
  announcement: "bg-blue-50   text-blue-700",
  achievement:  "bg-green-50  text-green-700",
  opportunity:  "bg-amber-50  text-amber-700",
  poll:         "bg-purple-50 text-purple-700",
  general:      null,
};

const PostDetailPage = () => {
  const { postId }            = useParams();
  const navigate              = useNavigate();
  const dispatch              = useDispatch();
  const { user }              = useAuth();

  const [post,        setPost]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [notFound,    setNotFound]    = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [bookmarked,  setBookmarked]  = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);

  // ── Fetch post ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      try {
        const { data } = await postApi.getPost(postId);
        setPost(data.data);
      } catch (err) {
        if (err.response?.status === 404) setNotFound(true);
        else toast.error("Failed to load post");
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [postId]);

  // ── Like ────────────────────────────────────────────────────────────────────
  const handleLike = useCallback(async () => {
    if (!post || likeLoading) return;
    const wasLiked = post.likes?.includes(user?._id);

    // Optimistic update
    setPost((prev) => ({
      ...prev,
      likes: wasLiked
        ? prev.likes.filter((id) => id !== user._id)
        : [...(prev.likes ?? []), user._id],
    }));
    dispatch(toggleLike({ postId: post._id, userId: user._id }));

    setLikeLoading(true);
    try {
      await postApi.toggleLike(postId);
    } catch {
      // Roll back
      setPost((prev) => ({
        ...prev,
        likes: wasLiked
          ? [...(prev.likes ?? []), user._id]
          : prev.likes.filter((id) => id !== user._id),
      }));
      toast.error("Failed to update like");
    } finally {
      setLikeLoading(false);
    }
  }, [post, likeLoading, user, postId, dispatch]);

  // ── Bookmark ────────────────────────────────────────────────────────────────
  const handleBookmark = async () => {
    try {
      await postApi.toggleBookmark(postId);
      setBookmarked((p) => !p);
      toast.success(bookmarked ? "Removed from bookmarks" : "Saved to bookmarks");
    } catch {
      toast.error("Failed to update bookmark");
    }
  };

  // ── Share ───────────────────────────────────────────────────────────────────
  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: "BitConnect Post", url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard!");
      }
    } catch {
      toast.error("Could not share post");
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    try {
      await postApi.deletePost(postId);
      dispatch(removePost(postId));
      toast.success("Post deleted");
      navigate("/feed", { replace: true });
    } catch {
      toast.error("Failed to delete post");
    }
  };

  // ── Comment callbacks ───────────────────────────────────────────────────────
  const handleCommentAdded = useCallback((newComment) => {
    setPost((prev) => ({
      ...prev,
      comments: [...(prev.comments ?? []), newComment],
    }));
  }, []);

  const handleCommentDeleted = useCallback((commentId) => {
    setPost((prev) => ({
      ...prev,
      comments: prev.comments.filter((c) => c._id !== commentId),
    }));
  }, []);

  // ── Guards ──────────────────────────────────────────────────────────────────
  if (loading) return <PageSpinner />;

  if (notFound) {
    return (
      <EmptyState
        title="Post not found"
        description="This post may have been deleted or is no longer available."
        action={
          <button
            onClick={() => navigate("/feed")}
            className="px-5 py-2 bg-indigo-600 text-white rounded-xl
                       text-sm font-medium hover:bg-indigo-700 transition"
          >
            Back to feed
          </button>
        }
      />
    );
  }

  if (!post) return null;

  const isLiked   = post.likes?.includes(user?._id);
  const isOwner   = post.author?._id === user?._id;
  const isAdmin   = user?.role === "admin";
  const typeStyle = TYPE_STYLES[post.type];

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500
                   hover:text-indigo-600 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* ── Main post card ── */}
      <article className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

        {/* Author row */}
        <div className="flex items-start justify-between mb-5">
          <Link
            to={`/profile/${post.author?.username}`}
            className="flex items-center gap-3"
          >
            <Avatar
              src={post.author?.profilePicture}
              name={post.author?.username}
              size="md"
            />
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
                  <>
                    {" · "}
                    <Link
                      to={`/clubs/${post.club.slug}`}
                      className="text-indigo-500 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {post.club.name}
                    </Link>
                  </>
                )}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {typeStyle && (
              <span className={cn(
                "text-xs font-medium px-2.5 py-1 rounded-full capitalize",
                typeStyle
              )}>
                {post.type}
              </span>
            )}

            {/* Three-dot menu */}
            {(isOwner || isAdmin) && (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((p) => !p)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                >
                  <MoreHorizontal className="w-4 h-4 text-gray-500" />
                </button>
                {menuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-8 z-20 w-44 bg-white
                                    rounded-xl shadow-lg border border-gray-100
                                    overflow-hidden">
                      {isOwner && (
                        <Link
                          to={`/posts/${postId}/edit`}
                          className="flex items-center gap-2 px-4 py-2.5
                                     text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Edit post
                        </Link>
                      )}
                      <button
                        onClick={handleDelete}
                        className="w-full flex items-center gap-2 px-4 py-2.5
                                   text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete post
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <p className="text-gray-800 text-[15px] leading-relaxed mb-5 whitespace-pre-wrap">
          {post.content}
        </p>

        {/* Images */}
        {post.images?.length > 0 && (
          <div className={cn(
            "grid gap-2 mb-5 rounded-xl overflow-hidden",
            post.images.length === 1 && "grid-cols-1",
            post.images.length === 2 && "grid-cols-2",
            post.images.length >= 3 && "grid-cols-2"
          )}>
            {post.images.map((img, i) => (
              <img
                key={i}
                src={img.url}
                alt=""
                className={cn(
                  "w-full object-cover",
                  post.images.length === 1 ? "max-h-96" : "h-52",
                  post.images.length === 3 && i === 0 && "col-span-2"
                )}
              />
            ))}
          </div>
        )}

        {/* Opportunity meta card */}
        {post.type === "opportunity" && post.opportunityMeta && (
          <div className="bg-amber-50 rounded-xl p-4 mb-5 border border-amber-100">
            <div className="flex items-start justify-between">
              <div>
                {post.opportunityMeta.company && (
                  <p className="font-semibold text-amber-900 text-sm">
                    {post.opportunityMeta.company}
                  </p>
                )}
                {post.opportunityMeta.role && (
                  <p className="text-amber-700 text-sm mt-0.5">
                    {post.opportunityMeta.role}
                  </p>
                )}
                {post.opportunityMeta.deadline && (
                  <p className="text-amber-600 text-xs mt-1">
                    Deadline: {formatDateTime(post.opportunityMeta.deadline)}
                  </p>
                )}
              </div>
              {post.opportunityMeta.applyLink && (
                <a
                  href={post.opportunityMeta.applyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-amber-600 text-white text-xs
                             font-medium rounded-lg hover:bg-amber-700 transition
                             shrink-0 ml-4"
                >
                  Apply now →
                </a>
              )}
            </div>
          </div>
        )}

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs text-indigo-600 bg-indigo-50
                           px-2.5 py-1 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Engagement counts */}
        <div className="flex items-center gap-4 text-xs text-gray-400
                        mb-4 pb-4 border-b border-gray-100">
          <span>{post.likes?.length ?? 0} likes</span>
          <span>{post.comments?.length ?? 0} comments</span>
          <span>{post.shareCount ?? 0} shares</span>
          <span className="ml-auto">{formatDateTime(post.createdAt)}</span>
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleLike}
            disabled={likeLoading}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm",
              "font-medium transition flex-1 justify-center",
              isLiked
                ? "text-red-500 bg-red-50 hover:bg-red-100"
                : "text-gray-500 hover:bg-gray-100"
            )}
          >
            <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
            {isLiked ? "Liked" : "Like"}
          </button>

          <button
            onClick={() => document.getElementById("comment-input")?.focus()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm
                       font-medium text-gray-500 hover:bg-gray-100 transition
                       flex-1 justify-center"
          >
            <MessageCircle className="w-4 h-4" />
            Comment
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm
                       font-medium text-gray-500 hover:bg-gray-100 transition
                       flex-1 justify-center"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>

          <button
            onClick={handleBookmark}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm",
              "font-medium transition",
              bookmarked
                ? "text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                : "text-gray-500 hover:bg-gray-100"
            )}
          >
            <Bookmark className={cn("w-4 h-4", bookmarked && "fill-current")} />
          </button>
        </div>
      </article>

      {/* ── Comments card ── */}
      <div className="bg-white rounded-2xl border border-gray-100
                      shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-5">
          {post.comments?.length ?? 0} comments
        </h2>
        <CommentSection
          postId={postId}
          comments={post.comments ?? []}
          postAuthorId={post.author?._id}
          onCommentAdded={handleCommentAdded}
          onCommentDeleted={handleCommentDeleted}
        />
      </div>

    </div>
  );
};

export default PostDetailPage;