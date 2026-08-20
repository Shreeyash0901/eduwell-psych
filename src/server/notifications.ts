import { Router, Request, Response } from "express";
import { prisma } from "../lib/db";
import { requireAuth } from "./middleware/auth";
import { requireTenant } from "./middleware/tenant";
import { NotificationService } from "./services/notificationService";

export const notificationsRouter = Router();
const notificationService = new NotificationService(prisma as any);

// Apply auth middleware to all routes
notificationsRouter.use(requireAuth);
notificationsRouter.use(requireTenant);

/**
 * GET /api/notifications
 * Retrieves paginated notifications for the authenticated user in their school.
 * Query params: unreadOnly (boolean), skip (number), take (number)
 */
notificationsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const unreadOnly = req.query.unreadOnly === "true";
    const skip = parseInt(req.query.skip as string) || 0;
    const take = parseInt(req.query.take as string) || 20;

    const data = await notificationService.getUserNotifications(
      user.schoolId,
      user.id,
      unreadOnly,
      skip,
      take
    );

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/**
 * GET /api/notifications/unread-count
 * Retrieves the count of unread notifications.
 */
notificationsRouter.get("/unread-count", async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const count = await notificationService.getUnreadCount(user.schoolId, user.id);
    res.status(200).json({ success: true, count });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Marks a specific notification as read.
 */
notificationsRouter.patch("/:id/read", async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const notificationId = parseInt(req.params.id);

    if (isNaN(notificationId)) {
      return res.status(400).json({ success: false, error: "Invalid notification ID" });
    }

    const notification = await notificationService.markAsRead(user.schoolId, user.id, notificationId);

    if (!notification) {
      return res.status(404).json({ success: false, error: "Notification not found" });
    }

    res.status(200).json({ success: true, notification });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/**
 * PATCH /api/notifications/read-all
 * Marks all unread notifications as read.
 */
notificationsRouter.patch("/read-all", async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const count = await notificationService.markAllAsRead(user.schoolId, user.id);
    res.status(200).json({ success: true, count });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});
