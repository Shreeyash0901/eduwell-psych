import { PrismaClient, NotificationType, NotificationPriority } from '../../generated/prisma/client';

export interface CreateNotificationParams {
  schoolId: number;
  userId: number;
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  message: string;
  entityType?: string;
  entityId?: number;
  dedupeKey?: string;
  expiresInDays?: number;
}

export class NotificationService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Creates a safe notification, ensuring no duplicate dedupeKeys for the same school.
   */
  async createNotification(params: CreateNotificationParams) {
    // If dedupeKey is provided, check if it already exists in the same school
    if (params.dedupeKey) {
      const existing = await this.prisma.notification.findUnique({
        where: {
          schoolId_dedupeKey: {
            schoolId: params.schoolId,
            dedupeKey: params.dedupeKey,
          },
        },
      });

      if (existing) {
        return existing; // Already notified, return existing or skip
      }
    }

    const expiresAt = params.expiresInDays
      ? new Date(Date.now() + params.expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    return this.prisma.notification.create({
      data: {
        schoolId: params.schoolId,
        userId: params.userId,
        type: params.type,
        priority: params.priority || NotificationPriority.NORMAL,
        title: params.title,
        message: params.message,
        entityType: params.entityType,
        entityId: params.entityId,
        dedupeKey: params.dedupeKey,
        expiresAt,
      },
    });
  }

  /**
   * Retrieves paginated notifications for a user in a specific school.
   */
  async getUserNotifications(schoolId: number, userId: number, unreadOnly: boolean = false, skip: number = 0, take: number = 20) {
    const where: any = { schoolId, userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const notifications = await this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });

    const totalCount = await this.prisma.notification.count({ where });
    const unreadCount = await this.prisma.notification.count({ where: { schoolId, userId, isRead: false } });

    return { notifications, totalCount, unreadCount };
  }

  /**
   * Retrieves just the unread count for a user.
   */
  async getUnreadCount(schoolId: number, userId: number) {
    return this.prisma.notification.count({
      where: { schoolId, userId, isRead: false },
    });
  }

  /**
   * Marks a specific notification as read.
   */
  async markAsRead(schoolId: number, userId: number, notificationId: number) {
    // Ensure the notification belongs to this user and school
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.schoolId !== schoolId || notification.userId !== userId) {
      return null;
    }

    if (notification.isRead) return notification;

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  /**
   * Marks all unread notifications as read for a user.
   */
  async markAllAsRead(schoolId: number, userId: number) {
    const result = await this.prisma.notification.updateMany({
      where: { schoolId, userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return result.count;
  }
}
