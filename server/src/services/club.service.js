// server/src/services/club.service.js
import Club                      from "../models/Club.model.js";
import User                      from "../models/User.model.js";
import { deleteFromCloudinary }  from "../config/cloudinary.js";
import { ApiError }              from "../utils/ApiError.js";
import { NOTIFICATION_TYPES }    from "../models/Notification.model.js";
import { getIO }                 from "../sockets/index.js";
import { pushNotification }      from "../sockets/handlers/notif.handler.js";

// ─── Create club ──────────────────────────────────────────────────────────────
export const createClub = async ({ createdBy, name, description, category, isPrivate, tags, logo, banner }) => {
  const existing = await Club.findOne({ name });
  if (existing) throw new ApiError(409, "A club with this name already exists");

  const club = await Club.create({
    name,
    description,
    category,
    isPrivate: isPrivate ?? false,
    tags:      tags      ?? [],
    logo:      logo      ?? { url: "", publicId: "" },
    banner:    banner    ?? { url: "", publicId: "" },
    createdBy,
    admin:     createdBy,
    // Creator is auto-added as co-admin member
    members: [{ user: createdBy, role: "co-admin", status: "active" }],
  });

  return club.populate("admin", "username profilePicture");
};

// ─── Discover clubs ───────────────────────────────────────────────────────────
export const discoverClubs = async ({ category, cursor, limit = 12 } = {}) => {
  const clubs = await Club.discover({ category, cursor, limit });

  const nextCursor = clubs.length === limit
    ? clubs[clubs.length - 1].createdAt.toISOString()
    : null;

  return { clubs, nextCursor, hasMore: !!nextCursor };
};

// ─── Get club by slug ─────────────────────────────────────────────────────────
export const getClubBySlug = async (slug) => {
  const club = await Club.findOne({ slug, isActive: true })
    .populate("admin",           "username profilePicture isVerified")
    .populate("members.user",    "username profilePicture isVerified")
    .populate("createdBy",       "username");

  if (!club) throw new ApiError(404, "Club not found");
  return club;
};

// ─── Update club ──────────────────────────────────────────────────────────────
export const updateClub = async (clubId, userId, updateData) => {
  const club = await Club.findById(clubId);
  if (!club) throw new ApiError(404, "Club not found");

  const status = club.getMemberStatus(userId);
  if (!["co-admin", "admin"].includes(status))
    throw new ApiError(403, "Only club admins can update club details");

  const allowedFields = [
    "description", "category", "isPrivate",
    "tags", "socialLinks",
  ];
  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) club[field] = updateData[field];
  });

  // Logo / banner updates handled separately via upload middleware
  if (updateData.logo)   club.logo   = updateData.logo;
  if (updateData.banner) club.banner = updateData.banner;

  await club.save();
  return club;
};

// ─── Join / request to join club ─────────────────────────────────────────────
export const joinClub = async (clubId, userId, message = "") => {
  const club = await Club.findById(clubId);
  if (!club)         throw new ApiError(404, "Club not found");
  if (!club.isActive) throw new ApiError(400, "This club is no longer active");

  const status = club.getMemberStatus(userId);
  if (status !== "not_member") throw new ApiError(409, "You are already a member of this club");

  // Check for existing pending request
  const hasPendingRequest = club.joinRequests.some(
    (r) => r.user.toString() === userId.toString() && r.status === "pending"
  );
  if (hasPendingRequest) throw new ApiError(409, "You already have a pending join request");

  const io = getIO();

  if (!club.isPrivate) {
    // Public club — join immediately
    await club.addMember(userId);
    await pushNotification(io, {
      recipient: club.admin,
      sender:    userId,
      type:      NOTIFICATION_TYPES.CLUB_JOIN_REQUEST,
      message:   `joined your club "${club.name}"`,
      refId:     club._id,
      refModel:  "Club",
    });
    return { status: "joined", message: `You have joined ${club.name}` };
  }

  // Private club — add join request
  club.joinRequests.push({ user: userId, message, status: "pending" });
  await club.save({ validateBeforeSave: false });

  // Notify club admin
  await pushNotification(io, {
    recipient: club.admin,
    sender:    userId,
    type:      NOTIFICATION_TYPES.CLUB_JOIN_REQUEST,
    message:   `requested to join "${club.name}"`,
    refId:     club._id,
    refModel:  "Club",
  });

  return { status: "pending", message: "Join request sent — waiting for admin approval" };
};

// ─── Handle join request (approve / reject) ───────────────────────────────────
export const handleJoinRequest = async (clubId, requestUserId, adminId, action) => {
  const club = await Club.findById(clubId);
  if (!club) throw new ApiError(404, "Club not found");

  const adminStatus = club.getMemberStatus(adminId);
  if (!["co-admin", "admin"].includes(adminStatus))
    throw new ApiError(403, "Only club admins can manage join requests");

  const requestIdx = club.joinRequests.findIndex(
    (r) => r.user.toString() === requestUserId.toString() && r.status === "pending"
  );
  if (requestIdx === -1) throw new ApiError(404, "Join request not found");

  const io = getIO();

  if (action === "approve") {
    await club.addMember(requestUserId); // also removes the request
    await pushNotification(io, {
      recipient: requestUserId,
      sender:    adminId,
      type:      NOTIFICATION_TYPES.CLUB_REQUEST_APPROVED,
      message:   `Your request to join "${club.name}" was approved`,
      refId:     club._id,
      refModel:  "Club",
    });
    return { status: "approved" };
  }

  // Reject
  club.joinRequests[requestIdx].status = "rejected";
  await club.save({ validateBeforeSave: false });
  await pushNotification(io, {
    recipient: requestUserId,
    sender:    adminId,
    type:      NOTIFICATION_TYPES.CLUB_REQUEST_REJECTED,
    message:   `Your request to join "${club.name}" was declined`,
    refId:     club._id,
    refModel:  "Club",
  });

  return { status: "rejected" };
};

// ─── Leave club ───────────────────────────────────────────────────────────────
export const leaveClub = async (clubId, userId) => {
  const club = await Club.findById(clubId);
  if (!club) throw new ApiError(404, "Club not found");

  if (club.admin.toString() === userId.toString())
    throw new ApiError(400, "Club admin cannot leave — transfer admin role first");

  await club.updateMemberStatus(userId, "left");
  return { message: `You have left ${club.name}` };
};

// ─── Update member role ───────────────────────────────────────────────────────
export const updateMemberRole = async (clubId, targetUserId, adminId, role) => {
  const club = await Club.findById(clubId);
  if (!club) throw new ApiError(404, "Club not found");

  if (club.admin.toString() !== adminId.toString())
    throw new ApiError(403, "Only the club admin can change member roles");

  const member = club.members.find(
    (m) => m.user.toString() === targetUserId.toString() && m.status === "active"
  );
  if (!member) throw new ApiError(404, "Member not found");

  member.role = role;
  await club.save({ validateBeforeSave: false });

  const io = getIO();
  await pushNotification(io, {
    recipient: targetUserId,
    sender:    adminId,
    type:      NOTIFICATION_TYPES.CLUB_ROLE_UPDATED,
    message:   `Your role in "${club.name}" has been updated to ${role}`,
    refId:     club._id,
    refModel:  "Club",
  });

  return { message: `Member role updated to ${role}` };
};

// ─── Search clubs ─────────────────────────────────────────────────────────────
export const searchClubs = async (query, { limit = 10, skip = 0 } = {}) => {
  if (!query?.trim()) throw new ApiError(400, "Search query is required");

  return Club.find(
    { $text: { $search: query }, isActive: true },
    { score: { $meta: "textScore" } }
  )
    .sort({ score: { $meta: "textScore" } })
    .select("name slug logo category memberCount isVerified description")
    .skip(skip)
    .limit(limit)
    .lean();
};