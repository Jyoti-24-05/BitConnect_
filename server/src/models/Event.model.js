// server/src/models/Event.model.js
import mongoose from "mongoose";

// ─── Sub-schema: RSVP entry ───────────────────────────────────────────────────
const rsvpSchema = new mongoose.Schema(
  {
    user:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status:    { type: String, enum: ["going", "interested", "not_going"], default: "going" },
    rsvpedAt:  { type: Date, default: Date.now },
  },
  { _id: false } // no extra _id per RSVP entry — keeps documents lean
);

// ─── Main schema ──────────────────────────────────────────────────────────────
const eventSchema = new mongoose.Schema(
  {
    title: {
      type:      String,
      required:  [true, "Event title is required"],
      trim:      true,
      maxlength: [120, "Title cannot exceed 120 characters"],
    },
    description: {
      type:      String,
      required:  [true, "Description is required"],
      trim:      true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    banner: {
      url:      { type: String, default: "" },
      publicId: { type: String, default: "" }, // Cloudinary ID for cleanup
    },
    organizer: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
    },
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  "Club",
    },
    category: {
      type:    String,
      enum:    ["workshop", "seminar", "hackathon", "cultural", "sports", "networking", "other"],
      default: "other",
    },
    tags: [{ type: String, trim: true, maxlength: 30 }],

    // ─── Venue ──────────────────────────────────────────────────────────────
    venue: {
      name:    { type: String, trim: true },
      address: { type: String, trim: true },
      isOnline:   { type: Boolean, default: false },
      meetingLink: { type: String, default: "" }, // used when isOnline = true
    },

    // ─── Timing ─────────────────────────────────────────────────────────────
    startDate: { type: Date, required: [true, "Start date is required"] },
    endDate:   { type: Date, required: [true, "End date is required"] },

    // ─── Capacity & RSVP ────────────────────────────────────────────────────
    capacity:     { type: Number, default: null }, // null = unlimited
    rsvps:        [rsvpSchema],
    rsvpDeadline: { type: Date },

    // ─── Status ─────────────────────────────────────────────────────────────
    status: {
      type:    String,
      enum:    ["draft", "published", "cancelled", "completed"],
      default: "draft",
    },
    isFeatured:  { type: Boolean, default: false },
    isApproved:  { type: Boolean, default: false }, // admin approval gate

    // ─── Social ─────────────────────────────────────────────────────────────
    likes:    [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],

    // ─── Social media share tracking ─────────────────────────────────────────
    shareCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
eventSchema.index({ startDate: 1, status: 1 });            // upcoming events feed
eventSchema.index({ organizer: 1, createdAt: -1 });        // my events page
eventSchema.index({ club: 1, startDate: 1 });              // club event listings
eventSchema.index({ category: 1, startDate: 1 });          // category filter
eventSchema.index({ tags: 1 });                            // tag filter
eventSchema.index({ "rsvps.user": 1 });                   // "events I RSVPed to"
eventSchema.index({ isFeatured: 1, startDate: 1 });        // featured events banner
eventSchema.index({ title: "text", description: "text" }); // full-text search

// ─── Virtuals ─────────────────────────────────────────────────────────────────

eventSchema.virtual("rsvpCount").get(function () {
  return this.rsvps?.filter((r) => r.status === "going").length ?? 0;
});

eventSchema.virtual("likeCount").get(function () {
  return this.likes?.length ?? 0;
});

eventSchema.virtual("isSoldOut").get(function () {
  if (!this.capacity) return false; // unlimited
  return this.rsvpCount >= this.capacity;
});

eventSchema.virtual("spotsRemaining").get(function () {
  if (!this.capacity) return null;
  return Math.max(0, this.capacity - this.rsvpCount);
});

eventSchema.virtual("isUpcoming").get(function () {
  return this.startDate > new Date();
});

eventSchema.virtual("durationMinutes").get(function () {
  if (!this.startDate || !this.endDate) return null;
  return Math.round((this.endDate - this.startDate) / 60000);
});

// ─── Pre-save validation ──────────────────────────────────────────────────────

// AFTER
eventSchema.pre("save", async function () {
  if (this.startDate && this.endDate) {
    const start = new Date(this.startDate);
    const end   = new Date(this.endDate);
    if (end <= start)
      throw new Error("End date must be after start date");
  }
  if (this.rsvpDeadline && this.startDate) {
    const start    = new Date(this.startDate);
    const deadline = new Date(this.rsvpDeadline);
    if (deadline > start)
      throw new Error("RSVP deadline must be before event start");
  }
});

// ─── Static methods ───────────────────────────────────────────────────────────

// Upcoming published events — the main feed query
eventSchema.statics.getUpcoming = function ({ category, tags, limit = 10, cursor } = {}) {
  const filter = {
    status:    "published",
    isApproved: true,
    startDate: { $gt: cursor ?? new Date() },
    ...(category && { category }),
    ...(tags?.length && { tags: { $in: tags } }),
  };
  return this.find(filter)
    .sort({ startDate: 1 })
    .limit(limit)
    .populate("organizer", "username profilePicture role")
    .populate("club", "name logo")
    .lean();
};

// Events a specific user RSVPed to
eventSchema.statics.getRsvpedByUser = function (userId, status = "going") {
  return this.find({ "rsvps.user": userId, "rsvps.status": status })
    .sort({ startDate: 1 })
    .lean();
};

// ─── Instance methods ─────────────────────────────────────────────────────────

// Toggle RSVP atomically — avoids race condition with findById → save
eventSchema.methods.toggleRsvp = async function (userId, status = "going") {
  const existingIdx = this.rsvps.findIndex((r) => r.user.toString() === userId.toString());

  if (existingIdx !== -1) {
    // Already RSVPed — update status or remove if same
    if (this.rsvps[existingIdx].status === status) {
      this.rsvps.splice(existingIdx, 1); // toggle off
      return { action: "removed", rsvpCount: this.rsvpCount };
    }
    this.rsvps[existingIdx].status = status;
    await this.save();
    return { action: "updated", rsvpCount: this.rsvpCount };
  }

  // New RSVP — check capacity before adding
  if (this.isSoldOut && status === "going")
    throw new Error("Event is at capacity");

  this.rsvps.push({ user: userId, status });
  await this.save();
  return { action: "added", rsvpCount: this.rsvpCount };
};

// ─── Export ───────────────────────────────────────────────────────────────────
const Event = mongoose.model("Event", eventSchema);
export default Event;