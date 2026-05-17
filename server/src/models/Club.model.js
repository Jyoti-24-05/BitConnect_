// server/src/models/Club.model.js
import mongoose from "mongoose";

// ─── Sub-schema: membership entry ─────────────────────────────────────────────
const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: {
      type:    String,
      enum:    ["member", "moderator", "co-admin"],
      default: "member",
    },
    joinedAt: { type: Date, default: Date.now },
    status: {
      type:    String,
      enum:    ["active", "banned", "left"],
      default: "active",
    },
  },
  { _id: false }
);

// ─── Sub-schema: join request ─────────────────────────────────────────────────
const joinRequestSchema = new mongoose.Schema(
  {
    user:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message:   { type: String, trim: true, maxlength: 300 },
    status:    { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// ─── Main schema ──────────────────────────────────────────────────────────────
const clubSchema = new mongoose.Schema(
  {
    name: {
      type:      String,
      required:  [true, "Club name is required"],
      unique:    true,
      trim:      true,
      maxlength: [80, "Club name cannot exceed 80 characters"],
    },
    slug: {
      // URL-friendly identifier — e.g. "coding-club-bit"
      type:   String,
      unique: true,
      lowercase: true,
      trim:   true,
    },
    description: {
      type:      String,
      required:  [true, "Club description is required"],
      trim:      true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    category: {
      type:    String,
      enum:    ["technical", "cultural", "sports", "academic", "social", "other"],
      required: true,
    },
    logo: {
      url:      { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    banner: {
      url:      { type: String, default: "" },
      publicId: { type: String, default: "" },
    },

    // ─── Ownership ──────────────────────────────────────────────────────────
    createdBy: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
    },
    admin: {
      // Single admin (club president)
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
    },
    members:      [memberSchema],
    joinRequests: [joinRequestSchema],

    // ─── Settings ───────────────────────────────────────────────────────────
    isPrivate: {
      // true = join requests need approval
      type:    Boolean,
      default: false,
    },
    isVerified: { type: Boolean, default: false }, // verified by platform admin
    isActive:   { type: Boolean, default: true  },

    // ─── Social links ────────────────────────────────────────────────────────
    socialLinks: {
      instagram: { type: String, default: "" },
      linkedin:  { type: String, default: "" },
      website:   { type: String, default: "" },
    },

    tags: [{ type: String, trim: true, lowercase: true }],

    // ─── Stats (denormalised for fast reads on club cards) ───────────────────
    stats: {
      totalEvents: { type: Number, default: 0 },
      totalPosts:  { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
clubSchema.index({ slug: 1 });
clubSchema.index({ category: 1, isActive: 1 });
clubSchema.index({ "members.user": 1 });                    // "clubs I'm in"
clubSchema.index({ isVerified: 1, category: 1 });           // discover page
clubSchema.index({ name: "text", description: "text" });    // search

// ─── Virtuals ─────────────────────────────────────────────────────────────────
clubSchema.virtual("memberCount").get(function () {
  return this.members?.filter((m) => m.status === "active").length ?? 0;
});
clubSchema.virtual("pendingRequestCount").get(function () {
  return this.joinRequests?.filter((r) => r.status === "pending").length ?? 0;
});

// ─── Pre-save — auto-generate slug from name ──────────────────────────────────
clubSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")   // remove special chars
      .replace(/\s+/g, "-")            // spaces to hyphens
      .replace(/-+/g, "-");            // collapse multiple hyphens
  }
  next();
});

// ─── Static methods ───────────────────────────────────────────────────────────

// Discover clubs — filterable by category
clubSchema.statics.discover = function ({ category, limit = 12, cursor } = {}) {
  const filter = {
    isActive: true,
    ...(category && { category }),
    ...(cursor && { createdAt: { $lt: new Date(cursor) } }),
  };
  return this.find(filter)
    .sort({ isVerified: -1, createdAt: -1 })
    .limit(limit)
    .select("name slug logo category memberCount isVerified description tags")
    .lean();
};

// ─── Instance methods ─────────────────────────────────────────────────────────

// Check membership status for a user
clubSchema.methods.getMemberStatus = function (userId) {
  const member = this.members.find(
    (m) => m.user.toString() === userId.toString()
  );
  if (!member)              return "not_member";
  if (member.status === "banned") return "banned";
  return member.role; // "member" | "moderator" | "co-admin"
};

// Add member after approval
clubSchema.methods.addMember = async function (userId, role = "member") {
  const alreadyMember = this.members.some(
    (m) => m.user.toString() === userId.toString()
  );
  if (alreadyMember) throw new Error("User is already a member");

  this.members.push({ user: userId, role });

  // Clear any pending join request
  this.joinRequests = this.joinRequests.filter(
    (r) => r.user.toString() !== userId.toString()
  );
  await this.save({ validateBeforeSave: false });
};

// Remove/ban a member
clubSchema.methods.updateMemberStatus = async function (userId, status) {
  const member = this.members.find(
    (m) => m.user.toString() === userId.toString()
  );
  if (!member) throw new Error("User is not a member");
  member.status = status;
  await this.save({ validateBeforeSave: false });
};

// ─── Export ───────────────────────────────────────────────────────────────────
const Club = mongoose.model("Club", clubSchema);
export default Club;