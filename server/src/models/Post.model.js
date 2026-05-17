// server/src/models/Post.model.js
import mongoose from "mongoose";

// ─── Sub-schema: Comment ──────────────────────────────────────────────────────
// Embedded for performance — no separate collection for simple comments
const commentSchema = new mongoose.Schema(
  {
    author:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: {
      type:      String,
      required:  [true, "Comment cannot be empty"],
      trim:      true,
      maxlength: [500, "Comment cannot exceed 500 characters"],
    },
    likes:   [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isEdited: { type: Boolean, default: false },
  },
  { timestamps: true }
);

commentSchema.virtual("likeCount").get(function () {
  return this.likes?.length ?? 0;
});

// ─── Main schema ──────────────────────────────────────────────────────────────
const postSchema = new mongoose.Schema(
  {
    author: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
    },
    club: {
      // Optional — if posted by/for a club
      type: mongoose.Schema.Types.ObjectId,
      ref:  "Club",
    },
    content: {
      type:      String,
      required:  [true, "Post content is required"],
      trim:      true,
      maxlength: [3000, "Post cannot exceed 3000 characters"],
    },
    // Rich media attachments
    images: [
      {
        url:      { type: String, required: true },
        publicId: { type: String, required: true }, // Cloudinary ID for deletion
      },
    ],
    // Post type — drives UI rendering
    type: {
      type:    String,
      enum:    ["general", "announcement", "achievement", "opportunity", "poll"],
      default: "general",
    },
    tags: [
      {
        type:      String,
        trim:      true,
        maxlength: 30,
        lowercase: true,
      },
    ],
    // Engagement
    likes:    [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [commentSchema], // embedded — fast reads, no join needed
    shares:   [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // Visibility
    visibility: {
      type:    String,
      enum:    ["public", "club_only", "connections_only"],
      default: "public",
    },
    isPinned:   { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: true }, // false = pending admin review

    // For "opportunity" type posts
    opportunityMeta: {
      company:   { type: String, trim: true },
      role:      { type: String, trim: true },
      applyLink: { type: String, trim: true },
      deadline:  { type: Date },
    },

    // Soft delete — never hard delete user content
    isDeleted:  { type: Boolean, default: false, select: false },
    deletedAt:  { type: Date,    select: false },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
postSchema.index({ author: 1, createdAt: -1 });          // profile feed
postSchema.index({ club: 1, createdAt: -1 });             // club feed
postSchema.index({ tags: 1, createdAt: -1 });             // tag filtering
postSchema.index({ type: 1, createdAt: -1 });             // filter by post type
postSchema.index({ isDeleted: 1, createdAt: -1 });        // global feed excludes deleted
postSchema.index({ isPinned: -1, createdAt: -1 });        // pinned posts float to top
postSchema.index({ content: "text", tags: "text" });      // full-text search

// ─── Virtuals ─────────────────────────────────────────────────────────────────
postSchema.virtual("likeCount").get(function () {
  return this.likes?.length ?? 0;
});
postSchema.virtual("commentCount").get(function () {
  return this.comments?.length ?? 0;
});
postSchema.virtual("shareCount").get(function () {
  return this.shares?.length ?? 0;
});
postSchema.virtual("isLikedBy").get(function () {
  // Usage: post.isLikedBy(userId) — set via query projection
  return (userId) => this.likes?.some((id) => id.toString() === userId.toString());
});

// ─── Pre-save hooks ───────────────────────────────────────────────────────────
postSchema.pre("save", function (next) {
  // Enforce max 4 images per post
  if (this.images?.length > 4)
    return next(new Error("Maximum 4 images allowed per post"));
  // Enforce max 5 tags
  if (this.tags?.length > 5)
    return next(new Error("Maximum 5 tags allowed per post"));
  next();
});

// ─── Pre-query hook — always exclude soft-deleted posts ──────────────────────
postSchema.pre(/^find/, function (next) {
  // Only apply if caller hasn't explicitly asked for deleted posts
  if (!this.getQuery().isDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

// ─── Static methods ───────────────────────────────────────────────────────────

// Main community feed — cursor-based pagination (scales, unlike skip/limit)
postSchema.statics.getFeed = function ({ cursor, limit = 10, tags, type } = {}) {
  const filter = {
    visibility: "public",
    isApproved: true,
    ...(cursor && { createdAt: { $lt: new Date(cursor) } }),
    ...(tags?.length && { tags: { $in: tags } }),
    ...(type && { type }),
  };
  return this.find(filter)
    .sort({ isPinned: -1, createdAt: -1 })
    .limit(limit)
    .populate("author", "username profilePicture role isVerified")
    .populate("club",   "name logo")
    .lean();
};

// Aggregation — top posts by engagement score (likes + comments*2)
postSchema.statics.getTrending = function (days = 7) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return this.aggregate([
    { $match: { createdAt: { $gte: since }, isDeleted: false, isApproved: true } },
    {
      $addFields: {
        engagementScore: {
          $add: [
            { $size: "$likes" },
            { $multiply: [{ $size: "$comments" }, 2] },
            { $size: "$shares" },
          ],
        },
      },
    },
    { $sort: { engagementScore: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from:         "users",
        localField:   "author",
        foreignField: "_id",
        as:           "author",
        pipeline:     [{ $project: { username: 1, profilePicture: 1, isVerified: 1 } }],
      },
    },
    { $unwind: "$author" },
  ]);
};

// ─── Instance methods ─────────────────────────────────────────────────────────

// Toggle like atomically
postSchema.methods.toggleLike = function (userId) {
  const idx = this.likes.findIndex((id) => id.toString() === userId.toString());
  if (idx !== -1) {
    this.likes.splice(idx, 1);
    return { action: "unliked", likeCount: this.likeCount };
  }
  this.likes.push(userId);
  return { action: "liked", likeCount: this.likeCount };
};

// Soft delete — preserves data for moderation/audit
postSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  await this.save({ validateBeforeSave: false });
};

// ─── Export ───────────────────────────────────────────────────────────────────
const Post = mongoose.model("Post", postSchema);
export default Post;