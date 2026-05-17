// server/src/controllers/post.controller.js
import * as PostService          from "../services/post.service.js";
import { ApiResponse }           from "../utils/ApiResponse.js";
import { catchAsync }            from "../utils/catchAsync.js";
import { deleteFromCloudinary }  from "../config/cloudinary.js";

// ─── POST /api/v1/posts ───────────────────────────────────────────────────────
export const createPost = catchAsync(async (req, res) => {
  const { content, type, visibility, tags, clubId, opportunityMeta } = req.body;

  // Images come from upload middleware — already uploaded to Cloudinary
  const images = req.uploadedFiles ?? [];

  const post = await PostService.createPost({
    authorId: req.user._id,
    content,
    type,
    visibility,
    tags,
    clubId,
    opportunityMeta,
    images,
  });

  res.status(201).json(new ApiResponse(201, post, "Post created successfully"));
});

// ─── GET /api/v1/posts ────────────────────────────────────────────────────────
export const getFeed = catchAsync(async (req, res) => {
  const { cursor, limit, tags, type } = req.query;

  const result = await PostService.getFeed({
    cursor,
    limit:  limit ? parseInt(limit, 10) : 10,
    tags:   tags  ? tags.split(",")     : undefined,
    type,
  });

  res.status(200).json(new ApiResponse(200, result, "Feed fetched successfully"));
});

// ─── GET /api/v1/posts/trending ───────────────────────────────────────────────
export const getTrending = catchAsync(async (req, res) => {
  const { days } = req.query;
  const posts    = await PostService.getTrendingPosts(days ? parseInt(days, 10) : 7);

  res.status(200).json(new ApiResponse(200, posts, "Trending posts fetched"));
});

// ─── GET /api/v1/posts/search ─────────────────────────────────────────────────
export const searchPosts = catchAsync(async (req, res) => {
  const { q, limit, skip } = req.query;

  const posts = await PostService.searchPosts(q, {
    limit: limit ? parseInt(limit, 10) : 10,
    skip:  skip  ? parseInt(skip,  10) : 0,
  });

  res.status(200).json(new ApiResponse(200, posts, "Search results fetched"));
});

// ─── GET /api/v1/posts/:postId ────────────────────────────────────────────────
export const getPost = catchAsync(async (req, res) => {
  const post = await PostService.getPostById(req.params.postId);
  res.status(200).json(new ApiResponse(200, post, "Post fetched successfully"));
});

// ─── GET /api/v1/posts/user/:userId ──────────────────────────────────────────
export const getPostsByUser = catchAsync(async (req, res) => {
  const { cursor, limit } = req.query;

  const result = await PostService.getPostsByUser(req.params.userId, {
    cursor,
    limit: limit ? parseInt(limit, 10) : 10,
  });

  res.status(200).json(new ApiResponse(200, result, "User posts fetched"));
});

// ─── PATCH /api/v1/posts/:postId ──────────────────────────────────────────────
export const updatePost = catchAsync(async (req, res) => {
  const post = await PostService.updatePost(
    req.params.postId,
    req.user._id,
    req.body
  );

  res.status(200).json(new ApiResponse(200, post, "Post updated successfully"));
});

// ─── DELETE /api/v1/posts/:postId ─────────────────────────────────────────────
export const deletePost = catchAsync(async (req, res) => {
  await PostService.deletePost(
    req.params.postId,
    req.user._id,
    req.user.role
  );

  res.status(200).json(new ApiResponse(200, {}, "Post deleted successfully"));
});

// ─── POST /api/v1/posts/:postId/like ─────────────────────────────────────────
export const toggleLike = catchAsync(async (req, res) => {
  const result = await PostService.toggleLike(
    req.params.postId,
    req.user._id
  );

  res.status(200).json(new ApiResponse(200, result, `Post ${result.action}`));
});

// ─── POST /api/v1/posts/:postId/comments ─────────────────────────────────────
export const addComment = catchAsync(async (req, res) => {
  const comment = await PostService.addComment(
    req.params.postId,
    req.user._id,
    req.body.content
  );

  res.status(201).json(new ApiResponse(201, comment, "Comment added"));
});

// ─── DELETE /api/v1/posts/:postId/comments/:commentId ────────────────────────
export const deleteComment = catchAsync(async (req, res) => {
  const result = await PostService.deleteComment(
    req.params.postId,
    req.params.commentId,
    req.user._id,
    req.user.role
  );

  res.status(200).json(new ApiResponse(200, result, "Comment deleted"));
});

// ─── POST /api/v1/posts/:postId/comments/:commentId/like ─────────────────────
export const toggleCommentLike = catchAsync(async (req, res) => {
  const result = await PostService.toggleCommentLike(
    req.params.postId,
    req.params.commentId,
    req.user._id
  );

  res.status(200).json(new ApiResponse(200, result, `Comment ${result.action}`));
});

// ─── POST /api/v1/posts/:postId/bookmark ─────────────────────────────────────
export const toggleBookmark = catchAsync(async (req, res) => {
  const result = await PostService.toggleBookmark(
    req.params.postId,
    req.user._id
  );

  res.status(200).json(
    new ApiResponse(200, result, `Post ${result.action === "added" ? "bookmarked" : "unbookmarked"}`)
  );
});