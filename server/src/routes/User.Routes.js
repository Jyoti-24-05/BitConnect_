// server/src/routes/user.routes.js  ← create this new file
import { Router }        from "express";
import User              from "../models/User.model.js";
import Post              from "../models/Post.model.js";
import { authenticate }  from "../middleware/authenticate.js";
import { ApiResponse }   from "../utils/ApiResponse.js";
import { ApiError }      from "../utils/ApiError.js";
import { catchAsync }    from "../utils/catchAsync.js";

const router = Router();

// GET /api/v1/users/:username — public profile
router.get("/:username", catchAsync(async (req, res) => {
  const user = await User.findOne({
    username: req.params.username,
    isActive: true,
  }).select("-password -refreshToken -passwordResetToken -passwordResetExpires");

  if (!user) throw new ApiError(404, "User not found");
  res.status(200).json(new ApiResponse(200, user, "Profile fetched"));
}));

// GET /api/v1/users/:userId/followers
router.get("/:userId/followers", authenticate, catchAsync(async (req, res) => {
  const user = await User.findById(req.params.userId)
    .populate("followers", "username profilePicture bio isVerified");
  if (!user) throw new ApiError(404, "User not found");
  res.status(200).json(new ApiResponse(200, user.followers, "Followers fetched"));
}));

// GET /api/v1/users/:userId/following
router.get("/:userId/following", authenticate, catchAsync(async (req, res) => {
  const user = await User.findById(req.params.userId)
    .populate("following", "username profilePicture bio isVerified");
  if (!user) throw new ApiError(404, "User not found");
  res.status(200).json(new ApiResponse(200, user.following, "Following fetched"));
}));

// POST /api/v1/users/:userId/follow — toggle follow
router.post("/:userId/follow", authenticate, catchAsync(async (req, res) => {
  const target = await User.findById(req.params.userId);
  if (!target) throw new ApiError(404, "User not found");
  if (target._id.toString() === req.user._id.toString())
    throw new ApiError(400, "You cannot follow yourself");

  const me         = await User.findById(req.user._id);
  const isFollowing = me.following.includes(target._id);

  if (isFollowing) {
    me.following    = me.following.filter((id) => !id.equals(target._id));
    target.followers = target.followers.filter((id) => !id.equals(me._id));
  } else {
    me.following.push(target._id);
    target.followers.push(me._id);
  }

  await Promise.all([
    me.save({ validateBeforeSave: false }),
    target.save({ validateBeforeSave: false }),
  ]);

  res.status(200).json(
    new ApiResponse(200, { isFollowing: !isFollowing }, isFollowing ? "Unfollowed" : "Followed")
  );
}));

// GET /api/v1/users/me/bookmarks
router.get("/me/bookmarks", authenticate, catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate({
      path:     "bookmarks",
      populate: { path: "author", select: "username profilePicture isVerified" },
    });
  res.status(200).json(new ApiResponse(200, user.bookmarks ?? [], "Bookmarks fetched"));
}));

export default router;