// server/src/controllers/club.controller.js
import Club from "../models/Club.model.js";
import * as ClubService   from "../services/club.service.js";
import { ApiResponse }    from "../utils/ApiResponse.js";
import { catchAsync }     from "../utils/catchAsync.js";
import { ApiError } from "../utils/ApiError.js";

// ─── POST /api/v1/clubs ───────────────────────────────────────────────────────
export const createClub = catchAsync(async (req, res) => {
  const logo = req.uploadedFile ?? { url: "", publicId: "" };
  const { name, description, category, isPrivate, tags } = req.body;

  // Slug is generated inside the service — no slugify package needed
  const club = await ClubService.createClub({
    createdBy:   req.user._id,
    name,
    description,
    category,
    isPrivate,
    tags,
    logo,
  });

  res.status(201).json(new ApiResponse(201, club, "Club created successfully"));
});

// ─── GET /api/v1/clubs ────────────────────────────────────────────────────────
export const discoverClubs = catchAsync(async (req, res) => {
  const { category, cursor, limit } = req.query;

  const result = await ClubService.discoverClubs({
    category,
    cursor,
    limit: limit ? parseInt(limit, 10) : 12,
  });

  res.status(200).json(new ApiResponse(200, result, "Clubs fetched successfully"));
});

// ─── GET /api/v1/clubs/search ─────────────────────────────────────────────────
export const searchClubs = catchAsync(async (req, res) => {
  const { q, limit, skip } = req.query;

  const clubs = await ClubService.searchClubs(q, {
    limit: limit ? parseInt(limit, 10) : 10,
    skip:  skip  ? parseInt(skip,  10) : 0,
  });

  res.status(200).json(new ApiResponse(200, clubs, "Search results fetched"));
});

// ─── GET /api/v1/clubs/:slug ──────────────────────────────────────────────────
export const getClub = catchAsync(async (req, res) => {
  const club = await ClubService.getClubBySlug(req.params.slug);
  res.status(200).json(new ApiResponse(200, club, "Club fetched successfully"));
});

// ─── PATCH /api/v1/clubs/:clubId ──────────────────────────────────────────────
export const updateClub = catchAsync(async (req, res) => {
  // New logo or banner from upload middleware
  if (req.uploadedFile) req.body.logo = req.uploadedFile;

  const club = await ClubService.updateClub(
    req.params.clubId,
    req.user._id,
    req.body
  );

  res.status(200).json(new ApiResponse(200, club, "Club updated successfully"));
});

// ─── POST /api/v1/clubs/:clubId/join ─────────────────────────────────────────
export const joinClub = catchAsync(async (req, res) => {
  const { message } = req.body;

  const result = await ClubService.joinClub(
    req.params.clubId,
    req.user._id,
    message
  );

  res.status(200).json(new ApiResponse(200, result, result.message));
});


// ─── GET /api/v1/clubs/me — clubs the logged-in user has joined ───────────────
export const getMyClubs = catchAsync(async (req, res) => {
  const clubs = await Club.find({
    "members.user": req.user._id,
    "members.status": "active",
    isActive: true,
  })
    .populate("admin", "username profilePicture")
    .select("name slug logo banner category description memberCount isVerified isPrivate admin members stats")
    .lean();

  // Attach the user's role in each club
  const withRole = clubs.map((club) => {
    const myMember = club.members?.find(
      (m) => m.user?.toString() === req.user._id.toString()
    );
    return {
      ...club,
      memberCount: club.members?.filter(m => m.status === "active").length ?? 0,
      myRole: myMember?.role ?? "member",
    };
  });

  res.status(200).json(new ApiResponse(200, withRole, "My clubs fetched"));
});

// ─── POST /api/v1/clubs/:clubId/leave ────────────────────────────────────────
export const leaveClub = catchAsync(async (req, res) => {
  const result = await ClubService.leaveClub(
    req.params.clubId,
    req.user._id
  );

  res.status(200).json(new ApiResponse(200, result, result.message));
});

// ─── PATCH /api/v1/clubs/:clubId/requests/:userId ────────────────────────────
export const handleJoinRequest = catchAsync(async (req, res) => {
  const { action } = req.body; // "approve" | "reject"

  if (!["approve", "reject"].includes(action))
    throw new ApiError(400, "Action must be approve or reject");

  const result = await ClubService.handleJoinRequest(
    req.params.clubId,
    req.params.userId,
    req.user._id,
    action
  );

  res.status(200).json(
    new ApiResponse(200, result, `Join request ${result.status}`)
  );
});

// ─── PATCH /api/v1/clubs/:clubId/members/:userId/role ────────────────────────
export const updateMemberRole = catchAsync(async (req, res) => {
  const { role } = req.body;

  if (!["member", "moderator", "co-admin"].includes(role))
    throw new ApiError(400, "Role must be member, moderator, or co-admin");

  const result = await ClubService.updateMemberRole(
    req.params.clubId,
    req.params.userId,
    req.user._id,
    role
  );

  res.status(200).json(new ApiResponse(200, result, result.message));
});