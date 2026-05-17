// server/src/routes/notification.routes.js
import { Router }       from "express";
import * as NotifCtrl   from "../controllers/notification.controller.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();

// ─── All notification routes require auth ─────────────────────────────────────
router.use(authenticate);

router.get(  "/",                      NotifCtrl.getNotifications);
router.get(  "/unread-count",          NotifCtrl.getUnreadCount);
router.patch("/read-all",              NotifCtrl.markAllAsRead);
router.patch("/:notifId/read",         NotifCtrl.markAsRead);
router.delete("/:notifId",             NotifCtrl.deleteNotification);

export default router;