// client/src/components/feed/CommentSection.jsx
import { useState }       from "react";
import { useForm }        from "react-hook-form";
import { Send, Trash2 }   from "lucide-react";
import { postApi }        from "@/api/postApi";
import useAuth            from "@/hooks/useAuth";
import Avatar             from "@/components/common/Avatar";
import { timeAgo }        from "@/utils/formatDate";
import cn                 from "@/utils/cn";
import toast              from "react-hot-toast";

const CommentSection = ({ postId, comments = [], onCommentAdded, onCommentDeleted }) => {
  const { user }              = useAuth();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit,
          reset, formState: { errors } } = useForm();

  const onSubmit = async ({ content }) => {
    setLoading(true);
    try {
      const { data } = await postApi.addComment(postId, { content });
      onCommentAdded?.(data.data);
      reset();
      toast.success("Comment added");
    } catch {
      toast.error("Failed to add comment");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await postApi.deleteComment(postId, commentId);
      onCommentDeleted?.(commentId);
      toast.success("Comment deleted");
    } catch {
      toast.error("Failed to delete comment");
    }
  };

  return (
    <div className="space-y-4">
      {/* Comment list */}
      {comments.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">
          No comments yet — be the first!
        </p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => {
            const isOwner = comment.author?._id === user?._id ||
                            user?.role === "admin";
            return (
              <div key={comment._id}
                   className="flex gap-3 group">
                <Avatar
                  src={comment.author?.profilePicture}
                  name={comment.author?.username}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="bg-gray-50 rounded-2xl rounded-tl-none px-4 py-2.5">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-gray-900">
                        {comment.author?.username}
                      </span>
                      <span className="text-xs text-gray-400">
                        {timeAgo(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 break-words">
                      {comment.content}
                    </p>
                  </div>
                  {/* Delete — only shown on hover for owner */}
                  {isOwner && (
                    <button
                      onClick={() => handleDelete(comment._id)}
                      className="mt-1 ml-2 text-xs text-red-400 hover:text-red-600
                                 opacity-0 group-hover:opacity-100 transition
                                 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add comment form */}
      <form onSubmit={handleSubmit(onSubmit)}
            className="flex gap-3 items-end">
        <Avatar
          src={user?.profilePicture}
          name={user?.username}
          size="sm"
        />
        <div className="flex-1">
          <div className="flex gap-2">
            <input
              {...register("content", { required: true, maxLength: 500 })}
              placeholder="Write a comment..."
              className={cn(
                "flex-1 px-4 py-2 bg-gray-50 border rounded-full text-sm",
                "outline-none focus:ring-2 focus:ring-indigo-200",
                "focus:border-indigo-300 transition placeholder:text-gray-400",
                errors.content ? "border-red-300" : "border-gray-200"
              )}
            />
            <button
              type="submit"
              disabled={loading}
              className="p-2 bg-indigo-600 text-white rounded-full
                         hover:bg-indigo-700 transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          {errors.content && (
            <p className="text-red-500 text-xs mt-1 ml-2">
              Comment cannot be empty
            </p>
          )}
        </div>
      </form>
    </div>
  );
};
export default CommentSection;