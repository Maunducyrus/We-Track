import { PrismaClient, AlertPriority } from '@prisma/client';
import { Server } from 'socket.io';

const prisma = new PrismaClient();

export interface NotificationData {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  priority: AlertPriority;
  itemId?: string;
  itemType?: string;
  data?: any;
}

class NotificationService {
  private io: Server | null = null;

  setSocketIO(io: Server) {
    this.io = io;
  }

  async createNotification(notificationData: NotificationData) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: notificationData.userId,
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type,
          priority: notificationData.priority,
          itemId: notificationData.itemId,
          itemType: notificationData.itemType,
          data: notificationData.data
        }
      });

      // Send real-time notification via WebSocket
      if (this.io) {
        this.io.to(`user_${notificationData.userId}`).emit('notification', {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          priority: notification.priority,
          createdAt: notification.createdAt
        });
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async getUserNotifications(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.notification.count({ where: { userId } })
    ]);

    return {
      notifications,
      total,
      page,
      limit,
      hasNext: skip + notifications.length < total,
      hasPrev: page > 1
    };
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId }
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });
  }

  async markAllAsRead(userId: string) {
    return await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });
  }

  async getUnreadCount(userId: string) {
    return await prisma.notification.count({
      where: { userId, isRead: false }
    });
  }

  // Notification templates for different events
  async notifyItemFound(userId: string, itemType: string, itemId: string, itemName: string, location?: string) {
    await this.createNotification({
      userId,
      title: `${itemType} Found!`,
      message: `Your ${itemType.toLowerCase()} "${itemName}" has been found${location ? ` at ${location}` : ''}.`,
      type: 'success',
      priority: 'HIGH',
      itemId,
      itemType
    });
  }

  async notifyItemMoved(userId: string, itemType: string, itemId: string, itemName: string, newLocation: string) {
    await this.createNotification({
      userId,
      title: `${itemType} Location Update`,
      message: `Your ${itemType.toLowerCase()} "${itemName}" has been detected at ${newLocation}.`,
      type: 'info',
      priority: 'MEDIUM',
      itemId,
      itemType
    });
  }

  async notifyItemReturned(userId: string, itemType: string, itemId: string, itemName: string) {
    await this.createNotification({
      userId,
      title: `${itemType} Returned`,
      message: `Your ${itemType.toLowerCase()} "${itemName}" has been marked as returned. Thank you for using SecureTrack Kenya!`,
      type: 'success',
      priority: 'HIGH',
      itemId,
      itemType
    });
  }

  async notifyEmergencyAlert(userId: string, alertType: string, location: string) {
    await this.createNotification({
      userId,
      title: 'Emergency Alert',
      message: `${alertType} emergency reported at ${location}. Emergency services have been notified.`,
      type: 'error',
      priority: 'CRITICAL'
    });
  }

  async notifySecurityOfficers(alertType: string, location: string, description: string) {
    // Get all police and admin users
    const officers = await prisma.user.findMany({
      where: {
        role: { in: ['POLICE', 'ADMIN'] },
        isActive: true
      },
      select: { id: true }
    });

    // Send notification to all officers
    const notifications = officers.map(officer => 
      this.createNotification({
        userId: officer.id,
        title: `Security Alert: ${alertType}`,
        message: `${alertType} reported at ${location}. ${description}`,
        type: 'error',
        priority: 'CRITICAL'
      })
    );

    await Promise.all(notifications);

    // Broadcast to all connected officers via WebSocket
    if (this.io) {
      this.io.to('security_officers').emit('emergency_alert', {
        type: alertType,
        location,
        description,
        timestamp: new Date()
      });
    }
  }

  async notifyMobileTrackingResult(officerId: string, mobileNumber: string, success: boolean, location?: string) {
    await this.createNotification({
      userId: officerId,
      title: 'Mobile Tracking Result',
      message: success 
        ? `Mobile number ${mobileNumber} successfully tracked${location ? ` to ${location}` : ''}.`
        : `Failed to track mobile number ${mobileNumber}.`,
      type: success ? 'success' : 'error',
      priority: 'HIGH'
    });
  }

  async notifySystemMaintenance(message: string) {
    // Get all active users
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true }
    });

    // Send notification to all users
    const notifications = users.map(user => 
      this.createNotification({
        userId: user.id,
        title: 'System Maintenance',
        message,
        type: 'warning',
        priority: 'MEDIUM'
      })
    );

    await Promise.all(notifications);
  }

  async cleanupOldNotifications(daysOld: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        isRead: true
      }
    });

    console.log(`Cleaned up ${result.count} old notifications`);
    return result.count;
  }
}

export const notificationService = new NotificationService();