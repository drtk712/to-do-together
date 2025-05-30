import { databases, ID, Query } from "../appwrite";
import { APPWRITE_CONFIG } from "../config/appwrite.js";
import { handleApiError, logError, withRetry } from "../utils/errorHandler";

const COLLECTION_ID = APPWRITE_CONFIG.collections.notifications;

// 通知类型
export const NOTIFICATION_TYPE = {
  FRIEND_REQUEST: 'friend_request',     // 好友请求
  FRIEND_ACCEPTED: 'friend_accepted',   // 好友请求被接受
  FRIEND_REJECTED: 'friend_rejected',   // 好友请求被拒绝
  TODO_SHARED: 'todo_shared',           // 待办事项被分享
  TODO_REMINDER: 'todo_reminder',       // 待办事项提醒
  SYSTEM: 'system'                      // 系统通知
};

// 通知状态
export const NOTIFICATION_STATUS = {
  UNREAD: 'unread',     // 未读
  READ: 'read',         // 已读
  ARCHIVED: 'archived'  // 已归档
};

/**
 * 通知服务 - 管理各种通知消息
 */
export const notificationService = {
  /**
   * 创建通知
   */
  async createNotification({
    toUserId,
    fromUserId = null,
    type,
    title,
    message,
    data = {},
    actionUrl = null
  }) {
    try {
      if (!toUserId || !type || !title || !message) {
        throw new Error('接收者ID、类型、标题和消息都是必需的');
      }

      const notificationDoc = {
        toUserId,
        fromUserId,
        type,
        title,
        message,
        data: JSON.stringify(data),
        actionUrl,
        status: NOTIFICATION_STATUS.UNREAD,
        $createdAt: new Date().toISOString(),
        $updatedAt: new Date().toISOString(),
      };

      const result = await withRetry(async () => {
        return await databases.createDocument(
          APPWRITE_CONFIG.databaseId,
          COLLECTION_ID,
          ID.unique(),
          notificationDoc
        );
      });

      return result;
    } catch (error) {
      logError(error, { context: 'notificationService.createNotification', toUserId, type });
      throw handleApiError(error, '创建通知失败');
    }
  },

  /**
   * 创建好友请求通知
   */
  async createFriendRequestNotification(fromUserId, toUserId, fromUserName, friendshipId) {
    try {
      return await this.createNotification({
        toUserId,
        fromUserId,
        type: NOTIFICATION_TYPE.FRIEND_REQUEST,
        title: '新的好友请求',
        message: `${fromUserName} 想要添加您为好友`,
        data: {
          fromUserId,
          fromUserName,
          friendshipId
        },
        actionUrl: '/dashboard/friends'
      });
    } catch (error) {
      logError(error, { context: 'notificationService.createFriendRequestNotification', fromUserId, toUserId });
      throw handleApiError(error, '创建好友请求通知失败');
    }
  },

  /**
   * 创建好友请求被接受通知
   */
  async createFriendAcceptedNotification(fromUserId, toUserId, fromUserName) {
    try {
      return await this.createNotification({
        toUserId,
        fromUserId,
        type: NOTIFICATION_TYPE.FRIEND_ACCEPTED,
        title: '好友请求已接受',
        message: `${fromUserName} 接受了您的好友请求`,
        data: {
          fromUserId,
          fromUserName
        },
        actionUrl: '/dashboard/friends'
      });
    } catch (error) {
      logError(error, { context: 'notificationService.createFriendAcceptedNotification', fromUserId, toUserId });
      throw handleApiError(error, '创建好友接受通知失败');
    }
  },

  /**
   * 创建待办分享通知
   */
  async createTodoSharedNotification(fromUserId, toUserId, fromUserName, todoTitle, todoId) {
    try {
      return await this.createNotification({
        toUserId,
        fromUserId,
        type: NOTIFICATION_TYPE.TODO_SHARED,
        title: '收到分享的待办',
        message: `${fromUserName} 分享了待办"${todoTitle}"给您`,
        data: {
          fromUserId,
          fromUserName,
          todoId,
          todoTitle
        },
        actionUrl: '/dashboard'
      });
    } catch (error) {
      logError(error, { context: 'notificationService.createTodoSharedNotification', fromUserId, toUserId, todoId });
      throw handleApiError(error, '创建待办分享通知失败');
    }
  },

  /**
   * 获取通知列表
   */
  async getNotifications(userId, status = null, limit = 50) {
    try {
      if (!userId) {
        throw new Error('用户ID是必需的');
      }

      const queries = [
        Query.equal('toUserId', userId),
        Query.orderDesc('$createdAt'),
        Query.limit(limit),
        Query.select([
          "$id",
          "toUserId",
          "fromUserId",
          "type",
          "title", 
          "message",
          "data",
          "status",
          "actionUrl",
          "$createdAt",
          "$updatedAt"
        ])
      ];

      if (status) {
        queries.push(Query.equal('status', status));
      }

      const result = await withRetry(async () => {
        return await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          COLLECTION_ID,
          queries
        );
      });

      // 解析data字段
      const notifications = result.documents.map(notification => ({
        ...notification,
        data: notification.data ? JSON.parse(notification.data) : {}
      }));

      return notifications;
    } catch (error) {
      logError(error, { context: 'notificationService.getNotifications', userId, status });
      throw handleApiError(error, '获取通知列表失败');
    }
  },

  /**
   * 获取未读通知数量
   */
  async getUnreadCount(userId) {
    try {
      if (!userId) {
        throw new Error('用户ID是必需的');
      }

      const result = await withRetry(async () => {
        return await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          COLLECTION_ID,
          [
            Query.equal('toUserId', userId),
            Query.equal('status', NOTIFICATION_STATUS.UNREAD),
            Query.limit(1000), // 获取所有未读通知来计数
            Query.select([
              "$id"
            ])
          ]
        );
      });

      return result.total || result.documents.length;
    } catch (error) {
      logError(error, { context: 'notificationService.getUnreadCount', userId });
      throw handleApiError(error, '获取未读通知数量失败');
    }
  },

  /**
   * 标记通知为已读
   */
  async markAsRead(notificationId, userId) {
    try {
      if (!notificationId || !userId) {
        throw new Error('通知ID和用户ID都是必需的');
      }

      // 先验证通知是否属于该用户
      const notification = await this.getNotificationForValidation(notificationId);
      if (!notification || notification.toUserId !== userId) {
        throw new Error('通知不存在或无权访问');
      }

      // 获取完整通知信息
      const fullNotification = await this.getNotificationById(notificationId);
      
      const result = await withRetry(async () => {
        return await databases.updateDocument(
          APPWRITE_CONFIG.databaseId,
          COLLECTION_ID,
          notificationId,
          {
            status: NOTIFICATION_STATUS.READ,
            $updatedAt: new Date().toISOString(),
          }
        );
      });

      // 如果是待办分享通知，当已读时更新shared_todos状态为pending
      if (fullNotification && fullNotification.type === NOTIFICATION_TYPE.TODO_SHARED) {
        try {
          const { sharedTodoService } = await import('./sharedTodoService.js');
          const todoId = fullNotification.data.todoId;
          
          if (todoId) {
            // 查找对应的shared_todos记录
            const shareRecords = await sharedTodoService.getSharedTodosForUser(userId, {
              // 这里可以添加更多过滤条件来精确匹配
            });
            
            const targetShare = shareRecords.documents.find(share => 
              share.todoId === todoId && 
              share.fromUserId === fullNotification.fromUserId
            );
            
            if (targetShare && targetShare.status === 'unread') {
              await sharedTodoService.updateShareStatus(targetShare.$id, 'pending', userId);
            }
          }
        } catch (shareError) {
          // 记录错误但不影响主流程
          logError(shareError, { 
            context: 'notificationService.markAsRead.updateShareStatus', 
            notificationId, 
            userId 
          });
        }
      }

      return result;
    } catch (error) {
      logError(error, { context: 'notificationService.markAsRead', notificationId, userId });
      throw handleApiError(error, '标记通知为已读失败');
    }
  },

  /**
   * 批量标记通知为已读
   */
  async markMultipleAsRead(notificationIds, userId) {
    try {
      if (!notificationIds || notificationIds.length === 0 || !userId) {
        throw new Error('通知ID列表和用户ID都是必需的');
      }

      const results = [];
      for (const notificationId of notificationIds) {
        try {
          const result = await this.markAsRead(notificationId, userId);
          results.push(result);
        } catch (error) {
          logError(error, { context: 'notificationService.markMultipleAsRead.single', notificationId });
          // 继续处理其他通知，不中断整个过程
        }
      }

      return results;
    } catch (error) {
      logError(error, { context: 'notificationService.markMultipleAsRead', notificationIds, userId });
      throw handleApiError(error, '批量标记通知为已读失败');
    }
  },

  /**
   * 标记所有通知为已读
   */
  async markAllAsRead(userId) {
    try {
      if (!userId) {
        throw new Error('用户ID是必需的');
      }

      // 获取所有未读通知
      const unreadNotifications = await this.getNotifications(userId, NOTIFICATION_STATUS.UNREAD, 1000);
      
      if (unreadNotifications.length === 0) {
        return [];
      }

      const notificationIds = unreadNotifications.map(n => n.$id);
      return await this.markMultipleAsRead(notificationIds, userId);
    } catch (error) {
      logError(error, { context: 'notificationService.markAllAsRead', userId });
      throw handleApiError(error, '标记所有通知为已读失败');
    }
  },

  /**
   * 删除通知
   */
  async deleteNotification(notificationId, userId) {
    try {
      if (!notificationId || !userId) {
        throw new Error('通知ID和用户ID都是必需的');
      }

      // 先验证通知是否属于该用户
      const notification = await this.getNotificationForValidation(notificationId);
      if (!notification || notification.toUserId !== userId) {
        throw new Error('通知不存在或无权访问');
      }

      await withRetry(async () => {
        return await databases.deleteDocument(
          APPWRITE_CONFIG.databaseId,
          COLLECTION_ID,
          notificationId
        );
      });

      return true;
    } catch (error) {
      logError(error, { context: 'notificationService.deleteNotification', notificationId, userId });
      throw handleApiError(error, '删除通知失败');
    }
  },

  /**
   * 根据ID获取通知详情
   */
  async getNotificationById(notificationId) {
    try {
      if (!notificationId) {
        throw new Error('通知ID是必需的');
      }

      const result = await withRetry(async () => {
        return await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          COLLECTION_ID,
          [
            Query.equal('$id', notificationId),
            Query.limit(1),
            Query.select([
              "$id",
              "toUserId",
              "fromUserId",
              "type",
              "title", 
              "message",
              "data",
              "status",
              "actionUrl",
              "$createdAt",
              "$updatedAt"
            ])
          ]
        );
      });

      if (result.documents.length === 0) {
        return null;
      }

      const notification = result.documents[0];
      
      // 解析data字段
      return {
        ...notification,
        data: notification.data ? JSON.parse(notification.data) : {}
      };
    } catch (error) {
      logError(error, { context: 'notificationService.getNotificationById', notificationId });
      throw handleApiError(error, '获取通知详情失败');
    }
  },

  /**
   * 根据ID获取通知（仅用于验证，只查询必要字段）
   */
  async getNotificationForValidation(notificationId) {
    try {
      if (!notificationId) {
        throw new Error('通知ID是必需的');
      }

      const result = await withRetry(async () => {
        return await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          COLLECTION_ID,
          [
            Query.equal('$id', notificationId),
            Query.limit(1),
            Query.select([
              "$id",
              "toUserId"
            ])
          ]
        );
      });

      return result.documents.length > 0 ? result.documents[0] : null;
    } catch (error) {
      logError(error, { context: 'notificationService.getNotificationForValidation', notificationId });
      throw handleApiError(error, '获取通知验证信息失败');
    }
  },

  /**
   * 清理旧通知
   */
  async cleanupOldNotifications(userId, daysOld = 30) {
    try {
      if (!userId) {
        throw new Error('用户ID是必需的');
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await withRetry(async () => {
        return await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          COLLECTION_ID,
          [
            Query.equal('toUserId', userId),
            Query.lessThan('$createdAt', cutoffDate.toISOString()),
            Query.limit(100),
            Query.select([
              "$id"
            ])
          ]
        );
      });

      // 删除找到的旧通知
      const deletePromises = result.documents.map(notification =>
        this.deleteNotification(notification.$id, userId)
      );

      await Promise.allSettled(deletePromises);

      return result.documents.length;
    } catch (error) {
      logError(error, { context: 'notificationService.cleanupOldNotifications', userId, daysOld });
      throw handleApiError(error, '清理旧通知失败');
    }
  },

  /**
   * 根据类型获取通知
   */
  async getNotificationsByType(userId, type, limit = 20) {
    try {
      if (!userId || !type) {
        throw new Error('用户ID和通知类型都是必需的');
      }

      const result = await withRetry(async () => {
        return await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          COLLECTION_ID,
          [
            Query.equal('toUserId', userId),
            Query.equal('type', type),
            Query.orderDesc('$createdAt'),
            Query.limit(limit),
            Query.select([
              "$id",
              "toUserId",
              "fromUserId",
              "type",
              "title", 
              "message",
              "data",
              "status",
              "actionUrl",
              "$createdAt",
              "$updatedAt"
            ])
          ]
        );
      });

      // 解析data字段
      const notifications = result.documents.map(notification => ({
        ...notification,
        data: notification.data ? JSON.parse(notification.data) : {}
      }));

      return notifications;
    } catch (error) {
      logError(error, { context: 'notificationService.getNotificationsByType', userId, type });
      throw handleApiError(error, '根据类型获取通知失败');
    }
  }
}; 