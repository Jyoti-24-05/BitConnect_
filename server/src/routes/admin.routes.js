// server/src/routes/admin.routes.js
import { Router }        from "express";
import User              from "../models/User.model.js";
import Post              from "../models/Post.model.js";
import Event             from "../models/Event.model.js";
import Club              from "../models/Club.model.js";
import Notification      from "../models/Notification.model.js";
import { authenticate,
         authorize }     from "../middleware/authenticate.js";
import { ApiResponse }   from "../utils/ApiResponse.js";
import { ApiError }      from "../utils/ApiError.js";
import { catchAsync }    from "../utils/catchAsync.js";

const router  = Router();
const isAdmin = [authenticate, authorize("admin")];

// ── GET /api/v1/admin/stats ───────────────────────────────────────────────────
router.get("/stats", ...isAdmin, catchAsync(async (req, res) => {
  const { range = "30" } = req.query;
  const since = new Date(Date.now() - parseInt(range, 10) * 24 * 60 * 60 * 1000);

  const [
    totalUsers, newUsers,
    totalPosts, newPosts,
    totalEvents, activeEvents,
    totalClubs,
    roleBreakdown,
    topClubs,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: since } }),
    Post.countDocuments({ isDeleted: { $ne: true } }),
    Post.countDocuments({ createdAt: { $gte: since }, isDeleted: { $ne: true } }),
    Event.countDocuments(),
    Event.countDocuments({ status: "published", startDate: { $gte: new Date() } }),
    Club.countDocuments({ isActive: true }),
    User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]),
    Club.find({ isActive: true })
      .sort({ memberCount: -1 })
      .limit(5)
      .select("name slug memberCount stats isVerified")
      .lean(),
  ]);

  // Posts per day for last N days (activity chart data)
  const postsPerDay = await Post.aggregate([
    { $match: { createdAt: { $gte: since }, isDeleted: { $ne: true } } },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.status(200).json(new ApiResponse(200, {
    users:  { total: totalUsers, new: newUsers },
    posts:  { total: totalPosts, new: newPosts },
    events: { total: totalEvents, active: activeEvents },
    clubs:  { total: totalClubs },
    roleBreakdown,
    topClubs,
    postsPerDay,
  }, "Stats fetched"));
}));

// ── GET /api/v1/admin/users ───────────────────────────────────────────────────
router.get("/users", ...isAdmin, catchAsync(async (req, res) => {
  const { page = 1, limit = 20, role, search, sort = "newest" } = req.query;
  const skip   = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const filter = {};
  if (role)   filter.role = role;
  if (search) filter.$or  = [
    { username: { $regex: search, $options: "i" } },
    { email:    { $regex: search, $options: "i" } },
  ];

  const sortMap = {
    newest:    { createdAt: -1 },
    oldest:    { createdAt:  1 },
    username:  { username:   1 },
  };

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort(sortMap[sort] ?? sortMap.newest)
      .skip(skip)
      .limit(parseInt(limit, 10))
      .select("username email role profilePicture isActive isVerified createdAt lastSeen")
      .lean(),
    User.countDocuments(filter),
  ]);

  res.status(200).json(new ApiResponse(200, {
    users,
    pagination: {
      total,
      page:       parseInt(page, 10),
      limit:      parseInt(limit, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)),
    },
  }, "Users fetched"));
}));

// ── PATCH /api/v1/admin/users/:userId ─────────────────────────────────────────
router.patch("/users/:userId", ...isAdmin, catchAsync(async (req, res) => {
  const { isActive, isVerified, role } = req.body;
  const allowedUpdates = {};

  if (isActive   !== undefined) allowedUpdates.isActive   = isActive;
  if (isVerified !== undefined) allowedUpdates.isVerified = isVerified;
  if (role       !== undefined) {
    if (!["student","club","admin"].includes(role))
      throw new ApiError(400, "Invalid role");
    allowedUpdates.role = role;
  }

  const user = await User.findByIdAndUpdate(
    req.params.userId,
    allowedUpdates,
    { new: true }
  ).select("username email role isActive isVerified");

  if (!user) throw new ApiError(404, "User not found");
  res.status(200).json(new ApiResponse(200, user, "User updated"));
}));

// ── DELETE /api/v1/admin/users/:userId ────────────────────────────────────────
router.delete("/users/:userId", ...isAdmin, catchAsync(async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) throw new ApiError(404, "User not found");

  // Soft delete — mark inactive, don't remove data
  user.isActive  = false;
  user.email     = `deleted_${Date.now()}_${user.email}`;
  await user.save({ validateBeforeSave: false });

  res.status(200).json(new ApiResponse(200, {}, "User deactivated"));
}));

// ── GET /api/v1/admin/events (pending approval) ────────────────────────────────
router.get("/events", ...isAdmin, catchAsync(async (req, res) => {
  const { approved } = req.query;
  const filter = approved === "false"
    ? { isApproved: false, status: "published" }
    : {};

  const events = await Event.find(filter)
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("organizer", "username profilePicture")
    .populate("club",      "name")
    .lean();

  res.status(200).json(new ApiResponse(200, events, "Events fetched"));
}));

// ── PATCH /api/v1/admin/events/:eventId/approve ────────────────────────────────
router.patch("/events/:eventId/approve", ...isAdmin, catchAsync(async (req, res) => {
  const { approve } = req.body;
  const event = await Event.findByIdAndUpdate(
    req.params.eventId,
    { isApproved: !!approve },
    { new: true }
  );
  if (!event) throw new ApiError(404, "Event not found");
  res.status(200).json(new ApiResponse(200, event, `Event ${approve ? "approved" : "rejected"}`));
}));

// ── GET /api/v1/admin/posts (reported / flagged) ───────────────────────────────
router.get("/posts", ...isAdmin, catchAsync(async (req, res) => {
  const posts = await Post.find({ isApproved: false, isDeleted: { $ne: true } })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("author", "username profilePicture")
    .lean();

  res.status(200).json(new ApiResponse(200, posts, "Posts fetched"));
}));

// ── DELETE /api/v1/admin/posts/:postId ────────────────────────────────────────
router.delete("/posts/:postId", ...isAdmin, catchAsync(async (req, res) => {
  const post = await Post.findById(req.params.postId);
  if (!post) throw new ApiError(404, "Post not found");
  await post.softDelete();
  res.status(200).json(new ApiResponse(200, {}, "Post removed"));
}));

// ── PATCH /api/v1/admin/clubs/:clubId/verify ──────────────────────────────────
router.patch("/clubs/:clubId/verify", ...isAdmin, catchAsync(async (req, res) => {
  const club = await Club.findByIdAndUpdate(
    req.params.clubId,
    { isVerified: true },
    { new: true }
  );
  if (!club) throw new ApiError(404, "Club not found");
  res.status(200).json(new ApiResponse(200, club, "Club verified"));
}));

export default router;