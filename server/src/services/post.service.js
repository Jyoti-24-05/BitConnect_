// server/src/services/post.service.js
import Post                                        from "../models/Post.model.js";
import User                                        from "../models/User.model.js";
import Club                                        from "../models/Club.model.js";
import Notification                                from "../models/Notification.model.js";
import { deleteFromCloudinary }                    from "../config/cloudinary.js";
import { ApiError }                                from "../utils/ApiError.js";
import { NOTIFICATION_TYPES }                      from "../models/Notification.model.js";
import { getIO }                                   from "../sockets/index.js";
import { pushNotification }                        from "../sockets/handlers/notif.handler.js";

// ─── Create post ──────────────────────────────────────────────────────────────
export const createPost = async ({ authorId, content, type, visibility, tags, clubId, opportunityMeta, images = [] }) => {
  // If posting to a club — verify membership/role
  if (clubId) {
    const club = await Club.findById(clubId);
    if (!club) throw new ApiError(404, "Club not found");

    const status = club.getMemberStatus(authorId);
    const canPost = ["co-admin", "moderator", "admin"].includes(status);
    if (!canPost) throw new ApiError(403, "Only club admins and moderators can post on behalf of a club");
  }

  const post = await Post.create({
    author:          authorId,
    content,
    type:            type     ?? "general",
    visibility:      visibility ?? "public",
    tags:            tags     ?? [],
    club:            clubId   ?? null,
    opportunityMeta: opportunityMeta ?? {},
    images,
  });

  // Add post reference to user's posts array
  await User.findByIdAndUpdate(authorId, { $push: { posts: post._id } });

  // Update club stats if club post
  if (clubId) {
    await Club.findByIdAndUpdate(clubId, { $inc: { "stats.totalPosts": 1 } });
  }

  // Populate and return
  return post.populate([
    { path: "author", select: "username profilePicture role isVerified" },
    { path: "club",   select: "name logo slug" },
  ]);
};

// ─── Get feed (cursor-based pagination) ──────────────────────────────────────
export const getFeed = async ({ cursor, limit, tags, type }) => {
  const posts = await Post.getFeed({ cursor, limit, tags, type });

  // Next cursor = createdAt of the last post
  const nextCursor = posts.length === limit
    ? posts[posts.length - 1].createdAt.toISOString()
    : null;

  return { posts, nextCursor, hasMore: !!nextCursor };
};

// ─── Get single post ──────────────────────────────────────────────────────────
export const getPostById = async (postId) => {
  const post = await Post.findById(postId)
    .populate("author",           "username profilePicture role isVerified college")
    .populate("club",             "name logo slug")
    .populate("comments.author",  "username profilePicture isVerified");

  if (!post) throw new ApiError(404, "Post not found");
  return post;
};

// ─── Get posts by user ────────────────────────────────────────────────────────
export const getPostsByUser = async (userId, { cursor, limit = 10 } = {}) => {
  const filter = {
    author: userId,
    ...(cursor && { createdAt: { $lt: new Date(cursor) } }),
  };

  const posts = await Post.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("author", "username profilePicture isVerified")
    .lean();

  const nextCursor = posts.length === limit
    ? posts[posts.length - 1].createdAt.toISOString()
    : null;

  return { posts, nextCursor, hasMore: !!nextCursor };
};

// ─── Update post ──────────────────────────────────────────────────────────────
export const updatePost = async (postId, userId, updateData) => {
  const post = await Post.findById(postId);
  if (!post) throw new ApiError(404, "Post not found");

  // Only author can update
  if (post.author.toString() !== userId.toString())
    throw new ApiError(403, "You can only edit your own posts");

  const allowedFields = ["content", "visibility", "tags", "isPinned", "opportunityMeta"];
  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) post[field] = updateData[field];
  });

  await post.save();

  return post.populate("author", "username profilePicture isVerified");
};

// ─── Delete post ──────────────────────────────────────────────────────────────
export const deletePost = async (postId, userId, userRole) => {
  const post = await Post.findById(postId);
  if (!post) throw new ApiError(404, "Post not found");

  const isAuthor = post.author.toString() === userId.toString();
  const isAdmin  = userRole === "admin";

  if (!isAuthor && !isAdmin)
    throw new ApiError(403, "You don't have permission to delete this post");

  // Delete Cloudinary images before soft-deleting
  if (post.images?.length) {
    await Promise.allSettled(
      post.images.map((img) => deleteFromCloudinary(img.publicId))
    );
  }

  await post.softDelete();

  // Remove from user's posts array
  await User.findByIdAndUpdate(post.author, { $pull: { posts: postId } });
};

// ─── Toggle like ──────────────────────────────────────────────────────────────
export const toggleLike = async (postId, userId) => {
  const post = await Post.findById(postId);
  if (!post) throw new ApiError(404, "Post not found");

  const { action, likeCount } = post.toggleLike(userId);
  await post.save();

  // Send notification to post author (not if they liked their own post)
  if (action === "liked" && post.author.toString() !== userId.toString()) {
    const io = getIO();
    await pushNotification(io, {
      recipient: post.author,
      sender:    userId,
      type:      NOTIFICATION_TYPES.POST_LIKED,
      message:   "liked your post",
      refId:     post._id,
      refModel:  "Post",
    });
  }

  return { action, likeCount };
};

// ─── Add comment ──────────────────────────────────────────────────────────────
export const addComment = async (postId, userId, content) => {
  const post = await Post.findById(postId);
  if (!post) throw new ApiError(404, "Post not found");

  post.comments.push({ author: userId, content });
  await post.save();

  // Get the newly added comment (last in array)
  const comment = post.comments[post.comments.length - 1];

  // Notify post author
  if (post.author.toString() !== userId.toString()) {
    const io = getIO();
    await pushNotification(io, {
      recipient: post.author,
      sender:    userId,
      type:      NOTIFICATION_TYPES.POST_COMMENTED,
      message:   "commented on your post",
      refId:     post._id,
      refModel:  "Post",
    });
  }

  // Populate comment author before returning
  await post.populate("comments.author", "username profilePicture isVerified");
  return post.comments.id(comment._id);
};

// ─── Delete comment ───────────────────────────────────────────────────────────
export const deleteComment = async (postId, commentId, userId, userRole) => {
  const post = await Post.findById(postId);
  if (!post) throw new ApiError(404, "Post not found");

  const comment = post.comments.id(commentId);
  if (!comment) throw new ApiError(404, "Comment not found");

  const isCommentAuthor = comment.author.toString() === userId.toString();
  const isPostAuthor    = post.author.toString()    === userId.toString();
  const isAdmin         = userRole === "admin";

  if (!isCommentAuthor && !isPostAuthor && !isAdmin)
    throw new ApiError(403, "You don't have permission to delete this comment");

  comment.deleteOne();
  await post.save();

  return { message: "Comment deleted", commentCount: post.commentCount };
};

// ─── Toggle comment like ──────────────────────────────────────────────────────
export const toggleCommentLike = async (postId, commentId, userId) => {
  const post = await Post.findById(postId);
  if (!post) throw new ApiError(404, "Post not found");

  const comment = post.comments.id(commentId);
  if (!comment) throw new ApiError(404, "Comment not found");

  const idx = comment.likes.findIndex((id) => id.toString() === userId.toString());
  let action;

  if (idx !== -1) {
    comment.likes.splice(idx, 1);
    action = "unliked";
  } else {
    comment.likes.push(userId);
    action = "liked";
  }

  await post.save();
  return { action, likeCount: comment.likes.length };
};

// ─── Bookmark post ────────────────────────────────────────────────────────────
export const toggleBookmark = async (postId, userId) => {
  const post = await Post.findById(postId);
  if (!post) throw new ApiError(404, "Post not found");

  const user = await User.findById(userId);
  const idx  = user.bookmarks.findIndex((id) => id.toString() === postId.toString());

  let action;
  if (idx !== -1) {
    user.bookmarks.splice(idx, 1);
    action = "removed";
  } else {
    user.bookmarks.push(postId);
    action = "added";
  }

  await user.save({ validateBeforeSave: false });
  return { action, bookmarkCount: user.bookmarks.length };
};

// ─── Search posts ─────────────────────────────────────────────────────────────
export const searchPosts = async (query, { limit = 10, skip = 0 } = {}) => {
  if (!query?.trim()) throw new ApiError(400, "Search query is required");

  return Post.find(
    { $text: { $search: query }, isApproved: true },
    { score: { $meta: "textScore" } }
  )
    .sort({ score: { $meta: "textScore" } })
    .skip(skip)
    .limit(limit)
    .populate("author", "username profilePicture isVerified")
    .lean();
};

// ─── Get trending posts ───────────────────────────────────────────────────────
export const getTrendingPosts = async (days = 7) => {
  return Post.getTrending(days);
};