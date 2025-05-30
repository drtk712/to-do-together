import { userService } from '../services/userService';
import { 
  getNotificationIcon, 
  getNotificationColors, 
  getNotificationRoute,
  getNotificationPriority 
} from '../constants/notificationConstants';
import { formatRelativeTime } from './timeFormatter';

/**
 * 通知系统辅助工具函数
 * 提供通用的通知处理逻辑
 */

/**
 * 批量为通知添加用户信息
 * 解决N+1查询问题，提升性能
 * @param {Array} notifications - 通知列表
 * @param {Object} userService - 用户服务实例
 * @returns {Promise<Array>} 包含用户信息的通知列表
 */
export const enrichNotificationsWithUserInfo = async (notifications, userServiceInstance = userService) => {
  if (!notifications || notifications.length === 0) {
    return [];
  }

  try {
    // 收集所有唯一的用户ID
    const uniqueUserIds = [...new Set(
      notifications
        .map(n => n.fromUserId)
        .filter(Boolean)
    )];

    if (uniqueUserIds.length === 0) {
      return notifications.map(n => ({ ...n, senderInfo: null }));
    }

    // 批量获取用户信息
    let userMap = {};
    
    // 如果userService有批量获取方法，使用批量获取
    if (userServiceInstance.getUsersByIds) {
      const users = await userServiceInstance.getUsersByIds(uniqueUserIds);
      userMap = users.reduce((map, user) => {
        map[user.userId] = {
          name: user.name,
          email: user.email,
          avatar: user.avatar
        };
        return map;
      }, {});
    } else {
      // 否则并发获取用户信息
      const userPromises = uniqueUserIds.map(async (userId) => {
        try {
          const user = await userServiceInstance.getUserById(userId);
          return { userId, user };
        } catch (error) {
          console.warn(`Failed to get user info for ${userId}:`, error);
          return { userId, user: null };
        }
      });

      const userResults = await Promise.allSettled(userPromises);
      
      userResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value.user) {
          const { userId, user } = result.value;
          userMap[userId] = {
            name: user.name,
            email: user.email,
            avatar: user.avatar
          };
        }
      });
    }

    // 为通知添加用户信息
    return notifications.map(notification => ({
      ...notification,
      senderInfo: userMap[notification.fromUserId] || null
    }));

  } catch (error) {
    console.error('Failed to enrich notifications with user info:', error);
    // 返回原始通知列表，不中断流程
    return notifications.map(n => ({ ...n, senderInfo: null }));
  }
};

/**
 * 对通知进行排序
 * @param {Array} notifications - 通知列表
 * @param {string} sortBy - 排序方式 ('time' | 'priority' | 'type')
 * @param {string} order - 排序顺序 ('asc' | 'desc')
 * @returns {Array} 排序后的通知列表
 */
export const sortNotifications = (notifications, sortBy = 'time', order = 'desc') => {
  if (!notifications || notifications.length === 0) {
    return [];
  }

  const sortedNotifications = [...notifications];

  sortedNotifications.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'time':
        const timeA = new Date(a.$createdAt).getTime();
        const timeB = new Date(b.$createdAt).getTime();
        comparison = timeA - timeB;
        break;

      case 'priority':
        const priorityA = getNotificationPriority(a.type);
        const priorityB = getNotificationPriority(b.type);
        comparison = priorityA - priorityB;
        break;

      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;

      default:
        comparison = 0;
    }

    return order === 'asc' ? comparison : -comparison;
  });

  return sortedNotifications;
};

/**
 * 过滤通知
 * @param {Array} notifications - 通知列表
 * @param {Object} filters - 过滤条件
 * @returns {Array} 过滤后的通知列表
 */
export const filterNotifications = (notifications, filters = {}) => {
  if (!notifications || notifications.length === 0) {
    return [];
  }

  let filtered = [...notifications];

  // 按类型过滤
  if (filters.type && filters.type !== 'all') {
    filtered = filtered.filter(n => n.type === filters.type);
  }

  // 按状态过滤
  if (filters.status) {
    filtered = filtered.filter(n => n.status === filters.status);
  }

  // 按时间范围过滤
  if (filters.dateFrom) {
    const fromDate = new Date(filters.dateFrom);
    filtered = filtered.filter(n => new Date(n.$createdAt) >= fromDate);
  }

  if (filters.dateTo) {
    const toDate = new Date(filters.dateTo);
    filtered = filtered.filter(n => new Date(n.$createdAt) <= toDate);
  }

  // 按发送者过滤
  if (filters.fromUserId) {
    filtered = filtered.filter(n => n.fromUserId === filters.fromUserId);
  }

  // 按关键词搜索
  if (filters.keyword) {
    const keyword = filters.keyword.toLowerCase();
    filtered = filtered.filter(n => 
      n.title.toLowerCase().includes(keyword) ||
      n.message.toLowerCase().includes(keyword) ||
      (n.senderInfo?.name || '').toLowerCase().includes(keyword)
    );
  }

  return filtered;
};

/**
 * 分组通知
 * @param {Array} notifications - 通知列表
 * @param {string} groupBy - 分组方式 ('type' | 'date' | 'sender')
 * @returns {Object} 分组后的通知对象
 */
export const groupNotifications = (notifications, groupBy = 'type') => {
  if (!notifications || notifications.length === 0) {
    return {};
  }

  const groups = {};

  notifications.forEach(notification => {
    let groupKey;

    switch (groupBy) {
      case 'type':
        groupKey = notification.type;
        break;

      case 'date':
        const date = new Date(notification.$createdAt);
        groupKey = date.toDateString();
        break;

      case 'sender':
        groupKey = notification.senderInfo?.name || '系统通知';
        break;

      default:
        groupKey = 'default';
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }

    groups[groupKey].push(notification);
  });

  return groups;
};

/**
 * 计算通知统计信息
 * @param {Array} notifications - 通知列表
 * @returns {Object} 统计信息对象
 */
export const calculateNotificationStats = (notifications) => {
  if (!notifications || notifications.length === 0) {
    return {
      total: 0,
      unread: 0,
      byType: {},
      byStatus: {},
      recentCount: 0
    };
  }

  const stats = {
    total: notifications.length,
    unread: 0,
    byType: {},
    byStatus: {},
    recentCount: 0
  };

  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  notifications.forEach(notification => {
    // 统计未读数量
    if (notification.status === 'unread') {
      stats.unread++;
    }

    // 按类型统计
    stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;

    // 按状态统计
    stats.byStatus[notification.status] = (stats.byStatus[notification.status] || 0) + 1;

    // 统计最近24小时的通知
    const notificationTime = new Date(notification.$createdAt).getTime();
    if (now - notificationTime <= oneDay) {
      stats.recentCount++;
    }
  });

  return stats;
};

/**
 * 格式化通知显示数据
 * @param {Object} notification - 通知对象
 * @returns {Object} 格式化后的显示数据
 */
export const formatNotificationForDisplay = (notification) => {
  if (!notification) {
    return null;
  }

  return {
    ...notification,
    icon: getNotificationIcon(notification.type),
    colors: getNotificationColors(notification.type),
    route: getNotificationRoute(notification.type, notification.data),
    displayTime: formatRelativeTime(notification.$createdAt),
    isUnread: notification.status === 'unread',
    senderName: notification.senderInfo?.name || '系统',
    hasAvatar: !!notification.senderInfo?.avatar
  };
};

/**
 * 验证通知数据完整性
 * @param {Object} notification - 通知对象
 * @returns {boolean} 是否有效
 */
export const validateNotification = (notification) => {
  if (!notification || typeof notification !== 'object') {
    return false;
  }

  // 必需字段检查
  const requiredFields = ['$id', 'toUserId', 'type', 'title', 'message', 'status', '$createdAt'];
  
  return requiredFields.every(field => 
    notification.hasOwnProperty(field) && 
    notification[field] !== null && 
    notification[field] !== undefined
  );
};

/**
 * 批量处理通知操作
 * @param {Array} notificationIds - 通知ID列表
 * @param {string} action - 操作类型 ('markAsRead' | 'delete' | 'archive')
 * @param {Object} notificationService - 通知服务实例
 * @param {string} userId - 用户ID
 * @returns {Promise<Array>} 操作结果列表
 */
export const batchProcessNotifications = async (notificationIds, action, notificationService, userId) => {
  if (!notificationIds || notificationIds.length === 0) {
    return [];
  }

  const results = [];

  // 并发处理，但限制并发数量避免过载
  const batchSize = 5;
  for (let i = 0; i < notificationIds.length; i += batchSize) {
    const batch = notificationIds.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (notificationId) => {
      try {
        let result;
        switch (action) {
          case 'markAsRead':
            result = await notificationService.markAsRead(notificationId, userId);
            break;
          case 'delete':
            result = await notificationService.deleteNotification(notificationId, userId);
            break;
          default:
            throw new Error(`Unsupported action: ${action}`);
        }
        return { notificationId, success: true, result };
      } catch (error) {
        console.error(`Failed to ${action} notification ${notificationId}:`, error);
        return { notificationId, success: false, error: error.message };
      }
    });

    const batchResults = await Promise.allSettled(batchPromises);
    results.push(...batchResults.map(r => r.status === 'fulfilled' ? r.value : r.reason));
  }

  return results;
}; 