// server/src/models/User.model.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const SALT_ROUNDS = 12;

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
      match: [/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // never returned in queries by default
    },
    role: {
      type: String,
      enum: ["student", "club", "admin"],
      default: "student",
    },
    profilePicture: {
      type: String,
      default: "",
    },
    profilePicturePublicId: {
      type: String, // Cloudinary public_id for deletion
      default: "",
    },
    bio: {
      type: String,
      default: "",
      maxlength: [200, "Bio cannot exceed 200 characters"],
      trim: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "non-binary", "prefer-not-to-say"],
    },
    // Store only ObjectId refs — never embed full docs
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    posts:      [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
    bookmarks:  [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],

    // --- BitConnect-specific fields ---
    college: {
      type: String,
      trim: true,
    },
    graduationYear: {
      type: Number,
      min: [2000, "Invalid graduation year"],
      max: [2035, "Invalid graduation year"],
    },
    skills: [{ type: String, trim: true }],
    socialLinks: {
      linkedin: { type: String, default: "" },
      github:   { type: String, default: "" },
      twitter:  { type: String, default: "" },
    },
    isVerified:   { type: Boolean, default: false },
    isActive:     { type: Boolean, default: true },
    refreshToken: { type: String, select: false }, // stored hashed
    passwordResetToken:   { type: String, select: false },
    passwordResetExpires: { type: Date,   select: false },
    lastSeen: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Compound text index for search across username + bio
userSchema.index({ username: "text", bio: "text" });
// Role-based filtering (admin dashboard, RBAC queries)
userSchema.index({ role: 1 });
// Social graph traversal
userSchema.index({ followers: 1 });
userSchema.index({ following: 1 });
// Leaderboard / discovery sorted by follower count
userSchema.index({ "followers.length": -1 });

// ─── Virtuals ────────────────────────────────────────────────────────────────
userSchema.virtual("followerCount").get(function () {
  return this.followers?.length ?? 0;
});
userSchema.virtual("followingCount").get(function () {
  return this.following?.length ?? 0;
});
userSchema.virtual("fullProfile").get(function () {
  return {
    id:             this._id,
    username:       this.username,
    email:          this.email,
    role:           this.role,
    profilePicture: this.profilePicture,
    bio:            this.bio,
    followerCount:  this.followerCount,
    followingCount: this.followingCount,
    isVerified:     this.isVerified,
    college:        this.college,
    skills:         this.skills,
    socialLinks:    this.socialLinks,
  };
});

// ─── Pre-save Hook — Hash password only when modified ────────────────────────
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
  next();
});

// ─── Instance Methods ────────────────────────────────────────────────────────

// Never compare plaintext passwords anywhere else in the codebase
userSchema.methods.isPasswordCorrect = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Short-lived access token — 15 min
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { _id: this._id, email: this.email, role: this.role, username: this.username },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY ?? "15m" }
  );
};

// Long-lived refresh token — 7 days, stored hashed in DB
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { _id: this._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY ?? "7d" }
  );
};

// Safe public projection — never expose password/tokens to client
userSchema.methods.toPublicProfile = function () {
  return {
    _id:            this._id,
    username:       this.username,
    profilePicture: this.profilePicture,
    bio:            this.bio,
    role:           this.role,
    followerCount:  this.followerCount,
    college:        this.college,
    skills:         this.skills,
    isVerified:     this.isVerified,
    socialLinks:    this.socialLinks,
    createdAt:      this.createdAt,
  };
};

// ─── Static Methods ───────────────────────────────────────────────────────────

// Used by auth service — explicitly re-selects hidden fields
userSchema.statics.findByEmailWithPassword = function (email) {
  return this.findOne({ email }).select("+password +refreshToken");
};

// Reusable search across username + bio (text index)
userSchema.statics.searchUsers = function (query, { limit = 10, skip = 0 } = {}) {
  return this.find(
    { $text: { $search: query }, isActive: true },
    { score: { $meta: "textScore" } }
  )
    .sort({ score: { $meta: "textScore" } })
    .select("username profilePicture bio role college isVerified")
    .skip(skip)
    .limit(limit)
    .lean(); // plain JS objects — faster for read-only results
};

// ─── Export ───────────────────────────────────────────────────────────────────
// Fix: was `module.export` (wrong) → should be `module.exports` in CJS
// Using ES module default export to match your `import mongoose from "mongoose"` syntax
const User = mongoose.model("User", userSchema);
export default User;