// server/src/routes/user.routes.js
import { Router }        from "express";
import User              from "../models/User.model.js";
import Post              from "../models/Post.model.js";
import Message           from "../models/Message.model.js";
import Notification      from "../models/Notification.model.js";
import { authenticate }  from "../middleware/authenticate.js";
import { ApiResponse }   from "../utils/ApiResponse.js";
import { ApiError }      from "../utils/ApiError.js";
import { catchAsync }    from "../utils/catchAsync.js";
import { getIO }         from "../sockets/index.js";
import { NOTIFICATION_TYPES } from "../models/Notification.model.js";
import { pushNotification }   from "../sockets/handlers/notif.handler.js";

const router = Router();

// ── Public profile ────────────────────────────────────────────────────────────
router.get("/:username", catchAsync(async (req, res) => {
  const user = await User.findOne({
    username: req.params.username,
    isActive: true,
  }).select("-password -refreshToken -passwordResetToken -passwordResetExpires");

  if (!user) throw new ApiError(404, "User not found");
  res.status(200).json(new ApiResponse(200, user, "Profile fetched"));
}));

// ── Followers / Following lists ───────────────────────────────────────────────
router.get("/:userId/followers", authenticate, catchAsync(async (req, res) => {
  const user = await User.findById(req.params.userId)
    .populate("followers", "username profilePicture bio isVerified");
  if (!user) throw new ApiError(404, "User not found");
  res.status(200).json(new ApiResponse(200, user.followers, "Followers fetched"));
}));

router.get("/:userId/following", authenticate, catchAsync(async (req, res) => {
  const user = await User.findById(req.params.userId)
    .populate("following", "username profilePicture bio isVerified");
  if (!user) throw new ApiError(404, "User not found");
  res.status(200).json(new ApiResponse(200, user.following, "Following fetched"));
}));

// ── Follow request (send) ─────────────────────────────────────────────────────
// POST /api/v1/users/:userId/follow
// - If not following → adds a follow REQUEST (stored in target.followRequests)
// - If request already sent → cancels it
// - If already following → unfollows
router.post("/:userId/follow", authenticate, catchAsync(async (req, res) => {
  const target = await User.findById(req.params.userId);
  if (!target) throw new ApiError(404, "User not found");
  if (target._id.equals(req.user._id))
    throw new ApiError(400, "You cannot follow yourself");

  const me = await User.findById(req.user._id);
  const io = getIO();

  const alreadyFollowing   = me.following.map(String).includes(target._id.toString());
  const requestAlreadySent = (target.followRequests ?? []).map(String).includes(me._id.toString());

  if (alreadyFollowing) {
    // Unfollow
    me.following     = me.following.filter((id) => !id.equals(target._id));
    target.followers = target.followers.filter((id) => !id.equals(me._id));
    await Promise.all([
      me.save({ validateBeforeSave: false }),
      target.save({ validateBeforeSave: false }),
    ]);
    return res.status(200).json(new ApiResponse(200, { status: "unfollowed" }, "Unfollowed"));
  }

  if (requestAlreadySent) {
    // Cancel pending request
    target.followRequests = (target.followRequests ?? []).filter(
      (id) => !id.equals(me._id)
    );
    await target.save({ validateBeforeSave: false });
    return res.status(200).json(new ApiResponse(200, { status: "request_cancelled" }, "Follow request cancelled"));
  }

  // Send follow request
  if (!target.followRequests) target.followRequests = [];
  target.followRequests.push(me._id);
  await target.save({ validateBeforeSave: false });

  // Notify the target user in real-time
  await pushNotification(io, {
    recipient: target._id,
    sender:    me._id,
    type:      NOTIFICATION_TYPES.NEW_FOLLOWER,
    message:   `${me.username} sent you a follow request`,
    ref:       { refId: me._id, refModel: "User" },
  });

  res.status(200).json(new ApiResponse(200, { status: "request_sent" }, "Follow request sent"));
}));

// ── Accept / Reject follow request ───────────────────────────────────────────
// POST /api/v1/users/follow-requests/:requesterId/accept
router.post("/follow-requests/:requesterId/accept", authenticate, catchAsync(async (req, res) => {
  const me       = await User.findById(req.user._id);
  const requester = await User.findById(req.params.requesterId);
  if (!requester) throw new ApiError(404, "User not found");

  const hasPendingRequest = (me.followRequests ?? []).map(String).includes(requester._id.toString());
  if (!hasPendingRequest) throw new ApiError(400, "No pending follow request from this user");

  // Remove from requests, add to followers/following
  me.followRequests = (me.followRequests ?? []).filter((id) => !id.equals(requester._id));
  me.followers.push(requester._id);
  requester.following.push(me._id);

  await Promise.all([
    me.save({ validateBeforeSave: false }),
    requester.save({ validateBeforeSave: false }),
  ]);

  // Notify requester that their request was accepted
  const io = getIO();
  await pushNotification(io, {
    recipient: requester._id,
    sender:    me._id,
    type:      NOTIFICATION_TYPES.FOLLOW_ACCEPTED,
    message:   `${me.username} accepted your follow request`,
    ref:       { refId: me._id, refModel: "User" },
  });

  res.status(200).json(new ApiResponse(200, {}, "Follow request accepted"));
}));

// POST /api/v1/users/follow-requests/:requesterId/reject
router.post("/follow-requests/:requesterId/reject", authenticate, catchAsync(async (req, res) => {
  const me = await User.findById(req.user._id);

  me.followRequests = (me.followRequests ?? []).filter(
    (id) => !id.equals(req.params.requesterId)
  );
  await me.save({ validateBeforeSave: false });

  res.status(200).json(new ApiResponse(200, {}, "Follow request rejected"));
}));

// GET /api/v1/users/me/follow-requests  — get my pending incoming requests
router.get("/me/follow-requests", authenticate, catchAsync(async (req, res) => {
  const me = await User.findById(req.user._id)
    .populate("followRequests", "username profilePicture bio isVerified");
  res.status(200).json(new ApiResponse(200, me.followRequests ?? [], "Follow requests fetched"));
}));

// ── Bookmarks ─────────────────────────────────────────────────────────────────
router.get("/me/bookmarks", authenticate, catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate({
      path:     "bookmarks",
      populate: { path: "author", select: "username profilePicture isVerified" },
    });
  res.status(200).json(new ApiResponse(200, user.bookmarks ?? [], "Bookmarks fetched"));
}));

// ── Messages — only between mutual followers ──────────────────────────────────

// GET /api/v1/users/me/conversations — list all conversations with latest message
router.get("/me/conversations", authenticate, catchAsync(async (req, res) => {
  const myId = req.user._id.toString();

  // Get all messages where I'm sender or recipient, pick latest per conversation
  const conversations = await Message.aggregate([
    { $match: { $or: [{ sender: req.user._id }, { recipient: req.user._id }] } },
    { $sort: { createdAt: -1 } },
    { $group: {
        _id:        "$conversation",
        lastMsg:    { $first: "$$ROOT" },
        unread:     { $sum: { $cond: [{ $and: [{ $eq: ["$recipient", req.user._id] }, { $eq: ["$isRead", false] }] }, 1, 0] } },
    }},
    { $sort: { "lastMsg.createdAt": -1 } },
    { $limit: 30 },
  ]);

  // Populate the other user's info
  const populated = await Promise.all(
    conversations.map(async (c) => {
      const otherId = c.lastMsg.sender.toString() === myId
        ? c.lastMsg.recipient
        : c.lastMsg.sender;
      const other = await User.findById(otherId)
        .select("username profilePicture isVerified").lean();
      return { ...c, other };
    })
  );

  res.status(200).json(new ApiResponse(200, populated, "Conversations fetched"));
}));

// GET /api/v1/users/messages/:userId — get chat history with a specific user
router.get("/messages/:userId", authenticate, catchAsync(async (req, res) => {
  const me     = req.user;
  const other  = await User.findById(req.params.userId);
  if (!other) throw new ApiError(404, "User not found");

  // Enforce mutual follow — must follow each other
  const iFollow      = me.following?.map(String).includes(other._id.toString());
  const theyFollowMe = other.following?.map(String).includes(me._id.toString());
  if (!iFollow || !theyFollowMe)
    throw new ApiError(403, "You can only message mutual followers");

  const convoId = Message.conversationId(me._id, other._id);
  const { cursor, limit = 30 } = req.query;

  const filter = {
    conversation: convoId,
    ...(cursor && { createdAt: { $lt: new Date(cursor) } }),
  };

  const messages = await Message.find(filter)
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .lean();

  // Mark incoming messages as read
  await Message.updateMany(
    { conversation: convoId, recipient: me._id, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );

  res.status(200).json(new ApiResponse(200, {
    messages: messages.reverse(),
    other:    { _id: other._id, username: other.username, profilePicture: other.profilePicture },
  }, "Messages fetched"));
}));

export default router;