// client/src/components/feed/CommentSection.jsx
import { useState, useRef }               from "react";
import { Link }                           from "react-router-dom";
import {
  Send, Trash2, Heart,
  CornerDownRight, MessageCircle,
}                                         from "lucide-react";
import { postApi }                        from "@/api/postApi";
import useAuth                            from "@/hooks/useAuth";
import Avatar                             from "@/components/common/Avatar";
import { timeAgo }                        from "@/utils/formatDate";
import cn                                 from "@/utils/cn";
import toast                              from "react-hot-toast";

// ─── Single comment ───────────────────────────────────────────────────────────
const Comment = ({
  comment,
  postId,
  postAuthorId,
  onDelete,
  onLike,
  onReply,
  isReply = false,
}) => {
  const { user } = useAuth();

  const isOwner     = comment.author?._id === user?._id;
  const isPostOwner = postAuthorId === user?._id;
  const isAdmin     = user?.role === "admin";
  const canDelete   = isOwner || isPostOwner || isAdmin;
  const isLiked     = comment.likes?.includes(user?._id);

  return (
    <div className={cn("flex gap-3 group", isReply && "pl-10")}>
      <Link to={`/profile/${comment.author?.username}`}>
        <Avatar
          src={comment.author?.profilePicture}
          name={comment.author?.username}
          size="sm"
        />
      </Link>

      <div className="flex-1 min-w-0">
        {/* Bubble */}
        <div className="bg-gray-50 rounded-2xl rounded-tl-none px-4 py-3">
          <div className="flex items-baseline gap-2 flex-wrap mb-1">
            <Link
              to={`/profile/${comment.author?.username}`}
              className="font-semibold text-sm text-gray-900 hover:underline"
            >
              {comment.author?.username}
            </Link>
            {comment.author?.isVerified && (
              <span className="text-indigo-500 text-xs">✓</span>
            )}
            <span className="text-xs text-gray-400">
              {timeAgo(comment.createdAt)}
            </span>
            {comment.isEdited && (
              <span className="text-xs text-gray-400">(edited)</span>
            )}
          </div>
          <p className="text-sm text-gray-700 leading-relaxed break-words">
            {comment.content}
          </p>
        </div>

        {/* Actions below bubble */}
        <div className="flex items-center gap-4 mt-1.5 ml-2">
          <button
            onClick={() => onLike(comment._id)}
            className={cn(
              "flex items-center gap-1 text-xs transition",
              isLiked ? "text-red-500" : "text-gray-400 hover:text-red-400"
            )}
          >
            <Heart className={cn("w-3.5 h-3.5", isLiked && "fill-current")} />
            {comment.likes?.length > 0 && comment.likes.length}
          </button>

          {!isReply && (
            <button
              onClick={() => onReply(comment._id, comment.author?.username)}
              className="flex items-center gap-1 text-xs text-gray-400
                         hover:text-indigo-500 transition"
            >
              <CornerDownRight className="w-3.5 h-3.5" />
              Reply
            </button>
          )}

          {canDelete && (
            <button
              onClick={() => onDelete(comment._id)}
              className="flex items-center gap-1 text-xs text-gray-300
                         hover:text-red-400 transition
                         opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main CommentSection ──────────────────────────────────────────────────────
const CommentSection = ({
  postId,
  comments = [],
  postAuthorId,
  onCommentAdded,
  onCommentDeleted,
}) => {
  const { user }                      = useAuth();
  const [content,     setContent]     = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [replyTo,     setReplyTo]     = useState(null); // { commentId, username }
  const [localLikes,  setLocalLikes]  = useState({});   // optimistic like state
  const inputRef                      = useRef(null);

  // ── Submit comment ──────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    setSubmitting(true);
    try {
      const payload = replyTo
        ? `@${replyTo.username} ${trimmed}`
        : trimmed;

      const { data } = await postApi.addComment(postId, { content: payload });
      onCommentAdded?.(data.data);
      setContent("");
      setReplyTo(null);
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete comment ──────────────────────────────────────────────────────────
  const handleDelete = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await postApi.deleteComment(postId, commentId);
      onCommentDeleted?.(commentId);
      toast.success("Comment deleted");
    } catch {
      toast.error("Failed to delete comment");
    }
  };

  // ── Like comment (optimistic) ────────────────────────────────────────────────
  const handleLike = async (commentId) => {
    const prev     = localLikes[commentId];
    const isLiked  = prev?.liked ?? false;
    const count    = prev?.count ?? comments.find((c) => c._id === commentId)?.likes?.length ?? 0;

    setLocalLikes((p) => ({
      ...p,
      [commentId]: { liked: !isLiked, count: isLiked ? count - 1 : count + 1 },
    }));

    try {
      await postApi.toggleCommentLike(postId, commentId);
    } catch {
      // Roll back
      setLocalLikes((p) => ({ ...p, [commentId]: { liked: isLiked, count } }));
    }
  };

  // ── Set reply target ─────────────────────────────────────────────────────────
  const handleReply = (commentId, username) => {
    setReplyTo({ commentId, username });
    setContent(`@${username} `);
    inputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyTo(null);
    setContent("");
    inputRef.current?.focus();
  };

  // ── Separate top-level comments and replies ──────────────────────────────────
  // Replies are comments that start with @username mentioning another commenter
  const topLevel = comments.filter(
    (c) => !c.content.startsWith("@") ||
           !comments.some((other) =>
             c.content.startsWith(`@${other.author?.username}`)
           )
  );

  const getReplies = (parentComment) =>
    comments.filter(
      (c) =>
        c._id !== parentComment._id &&
        c.content.startsWith(`@${parentComment.author?.username}`) === false &&
        comments.some((other) =>
          c.content.startsWith(`@${parentComment.author?.username}`)
        )
    );

  return (
    <div className="space-y-5">

      {/* Comment list */}
      {comments.length === 0 ? (
        <div className="text-center py-8">
          <MessageCircle className="w-10 h-10 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">
            No comments yet — be the first!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment._id}>
              <Comment
                comment={{
                  ...comment,
                  likes: localLikes[comment._id]
                    ? Array(localLikes[comment._id].count).fill(
                        localLikes[comment._id].liked ? user?._id : "x"
                      )
                    : comment.likes,
                }}
                postId={postId}
                postAuthorId={postAuthorId}
                onDelete={handleDelete}
                onLike={handleLike}
                onReply={handleReply}
              />
            </div>
          ))}
        </div>
      )}

      {/* Comment input */}
      <div className="border-t border-gray-100 pt-5">
        {/* Reply indicator */}
        {replyTo && (
          <div className="flex items-center justify-between mb-3
                          bg-indigo-50 rounded-xl px-4 py-2.5">
            <p className="text-xs text-indigo-700">
              Replying to{" "}
              <span className="font-semibold">@{replyTo.username}</span>
            </p>
            <button
              onClick={cancelReply}
              className="text-xs text-indigo-500 hover:text-indigo-700 transition"
            >
              Cancel
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-3 items-end">
          <Avatar
            src={user?.profilePicture}
            name={user?.username}
            size="sm"
            className="shrink-0 mb-0.5"
          />

          <div className="flex-1">
            <textarea
              id="comment-input"
              ref={inputRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                // Submit on Enter, new line on Shift+Enter
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Write a comment… (Enter to send)"
              rows={1}
              maxLength={500}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200
                         rounded-2xl text-sm outline-none resize-none
                         focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300
                         transition placeholder:text-gray-400 leading-relaxed"
              style={{ minHeight: "42px" }}
              onInput={(e) => {
                // Auto-expand textarea
                e.target.style.height = "auto";
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
            />
            {content.length > 400 && (
              <p className={cn(
                "text-xs mt-1 text-right",
                content.length >= 500 ? "text-red-500" : "text-gray-400"
              )}>
                {content.length}/500
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="w-9 h-9 bg-indigo-600 rounded-full flex items-center
                       justify-center hover:bg-indigo-700 transition
                       disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            aria-label="Send comment"
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-white
                               border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4 text-white" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};


export default CommentSection;