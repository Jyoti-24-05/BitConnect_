// server/src/routes/post.routes.js --
import { Router }             from "express";
import * as PostCtrl          from "../controllers/post.controller.js";
import { authenticate,
         authorize }          from "../middleware/authenticate.js";
import validate               from "../middleware/validate.js";
import { postImageUpload,
         handlePostImagesUpload,
         handleMulterError }  from "../middleware/upload.js";
import {
  createPostSchema,
  updatePostSchema,
  createCommentSchema,
  getPostsQuerySchema,
}                             from "../validators/post.validator.js";

const router = Router();

router.use(authenticate);

// ── Specific routes FIRST — before /:postId ───────────────────────────────────
router.get("/",                 validate(getPostsQuerySchema, "query"), PostCtrl.getFeed);
router.get("/trending",         PostCtrl.getTrending);
router.get("/search",           PostCtrl.searchPosts);
router.get("/user/:userId",     PostCtrl.getPostsByUser);   // ← BEFORE /:postId

// ── Post CRUD ─────────────────────────────────────────────────────────────────
router.post(
  "/",
  (req, res, next) => postImageUpload.array("images", 4)(req, res, next),
  handleMulterError,
  handlePostImagesUpload,
  validate(createPostSchema),
  PostCtrl.createPost
);

router.get("/:postId",           PostCtrl.getPost);          // ← AFTER /user/:userId
router.patch("/:postId",         validate(updatePostSchema), PostCtrl.updatePost);
router.delete("/:postId",        PostCtrl.deletePost);

// ── Engagement ────────────────────────────────────────────────────────────────
router.post("/:postId/like",     PostCtrl.toggleLike);
router.post("/:postId/bookmark", PostCtrl.toggleBookmark);

// ── Comments ──────────────────────────────────────────────────────────────────
router.post("/:postId/comments",
  validate(createCommentSchema), PostCtrl.addComment);
router.delete("/:postId/comments/:commentId",
  PostCtrl.deleteComment);
router.post("/:postId/comments/:commentId/like",
  PostCtrl.toggleCommentLike);

export default router;