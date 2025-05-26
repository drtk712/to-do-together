import { useState, useCallback, useEffect, useRef } from 'react';

// 消息类型枚举
export const NOTIFICATION_TYPES = {
  TODO: 'todo',
  FRIEND: 'friend', 
  SYSTEM: 'system',
  LOGIN: 'login',
  SUMMARY: 'summary'
};

// 消息优先级
export const NOTIFICATION_PRIORITY = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

/**
 * 消息通知管理Hook - 移动端优化版
 */
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const notificationQueue = useRef([]);

  // 模拟初始化一些测试数据
  useEffect(() => {
    const mockNotifications = [
      {
        id: '1',
        type: NOTIFICATION_TYPES.TODO,
        title: '待办事项提醒',
        message: '您有3个待办事项即将到期，请及时处理',
        timestamp: Date.now() - 3600000, // 1小时前
        isRead: false,
        priority: NOTIFICATION_PRIORITY.HIGH,
        icon: '📝',
        data: { todoCount: 3, dueDate: new Date(Date.now() + 86400000) }
      },
      {
        id: '2',
        type: NOTIFICATION_TYPES.FRIEND,
        title: '好友请求',
        message: '张三向您发送了好友请求，快来查看吧',
        timestamp: Date.now() - 7200000, // 2小时前
        isRead: false,
        priority: NOTIFICATION_PRIORITY.MEDIUM,
        icon: '👤',
        data: { friendId: 'user123', friendName: '张三', avatar: '/avatars/zhangsan.jpg' }
      },
      {
        id: '3',
        type: NOTIFICATION_TYPES.SYSTEM,
        title: '系统更新',
        message: '应用已更新至最新版本 v2.1.0，新增了多项功能',
        timestamp: Date.now() - 86400000, // 1天前
        isRead: true,
        priority: NOTIFICATION_PRIORITY.LOW,
        icon: '🔄',
        data: { version: 'v2.1.0', features: ['通知系统', '滑动操作', '性能优化'] }
      },
      {
        id: '4',
        type: NOTIFICATION_TYPES.LOGIN,
        title: '登录提醒',
        message: '检测到在新设备上的登录活动，如非本人操作请及时修改密码',
        timestamp: Date.now() - 172800000, // 2天前
        isRead: false,
        priority: NOTIFICATION_PRIORITY.HIGH,
        icon: '🔐',
        data: { 
          device: 'iPhone 15', 
          location: '北京市朝阳区', 
          ip: '192.168.1.100',
          timestamp: Date.now() - 172800000
        }
      },
      {
        id: '5',
        type: NOTIFICATION_TYPES.SUMMARY,
        title: '周总结',
        message: '本周您完成了12个待办事项，效率提升20%，表现优秀！',
        timestamp: Date.now() - 604800000, // 1周前
        isRead: true,
        priority: NOTIFICATION_PRIORITY.MEDIUM,
        icon: '📊',
        data: { 
          completedTodos: 12, 
          efficiency: 20, 
          weekRange: '2024-01-01 - 2024-01-07',
          achievements: ['高效完成', '按时提交', '质量优秀']
        }
      },
      {
        id: '6',
        type: NOTIFICATION_TYPES.TODO,
        title: '任务截止提醒',
        message: '项目报告将在今天下午5点截止，请尽快完成',
        timestamp: Date.now() - 1800000, // 30分钟前
        isRead: false,
        priority: NOTIFICATION_PRIORITY.HIGH,
        icon: '⏰',
        data: { 
          taskName: '项目报告', 
          deadline: new Date(Date.now() + 18000000), // 5小时后
          category: '工作'
        }
      }
    ];

    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.isRead).length);
  }, []);

  // 生成唯一ID
  const generateId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };

  // 添加新消息
  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: generateId(),
      timestamp: Date.now(),
      isRead: false,
      priority: NOTIFICATION_PRIORITY.MEDIUM,
      ...notification
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // 触发浏览器通知（如果用户已授权）
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(newNotification.title, {
        body: newNotification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: newNotification.id,
        requireInteraction: newNotification.priority === NOTIFICATION_PRIORITY.HIGH
      });
    }

    return newNotification.id;
  }, []);

  // 批量添加消息
  const addMultipleNotifications = useCallback((notifications) => {
    const newNotifications = notifications.map(notification => ({
      id: generateId(),
      timestamp: Date.now(),
      isRead: false,
      priority: NOTIFICATION_PRIORITY.MEDIUM,
      ...notification
    }));

    setNotifications(prev => [...newNotifications, ...prev]);
    setUnreadCount(prev => prev + newNotifications.length);

    return newNotifications.map(n => n.id);
  }, []);

  // 标记消息为已读
  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // 标记多个消息为已读
  const markMultipleAsRead = useCallback((notificationIds) => {
    setNotifications(prev => 
      prev.map(notification => 
        notificationIds.includes(notification.id)
          ? { ...notification, isRead: true }
          : notification
      )
    );
    
    const unreadIdsCount = notificationIds.filter(id => {
      const notification = notifications.find(n => n.id === id);
      return notification && !notification.isRead;
    }).length;
    
    setUnreadCount(prev => Math.max(0, prev - unreadIdsCount));
  }, [notifications]);

  // 标记所有消息为已读
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
    setUnreadCount(0);
  }, []);

  // 删除消息
  const deleteNotification = useCallback((notificationId) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.isRead) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    
    setNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    );
  }, [notifications]);

  // 批量删除消息
  const deleteMultipleNotifications = useCallback((notificationIds) => {
    const unreadCount = notificationIds.filter(id => {
      const notification = notifications.find(n => n.id === id);
      return notification && !notification.isRead;
    }).length;

    setNotifications(prev => 
      prev.filter(notification => !notificationIds.includes(notification.id))
    );
    setUnreadCount(prev => Math.max(0, prev - unreadCount));
  }, [notifications]);

  // 清空所有消息
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // 获取未读消息
  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(n => !n.isRead);
  }, [notifications]);

  // 获取按类型分组的消息
  const getNotificationsByType = useCallback((type) => {
    return notifications.filter(n => n.type === type);
  }, [notifications]);

  // 获取按优先级分组的消息
  const getNotificationsByPriority = useCallback((priority) => {
    return notifications.filter(n => n.priority === priority);
  }, [notifications]);

  // 获取最近的未读消息（用于气泡显示）
  const getRecentUnreadNotifications = useCallback((limit = 5) => {
    return notifications
      .filter(n => !n.isRead)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }, [notifications]);

  // 获取最近的消息（包括已读）
  const getRecentNotifications = useCallback((limit = 10) => {
    return notifications
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }, [notifications]);

  // 搜索消息
  const searchNotifications = useCallback((query) => {
    if (!query.trim()) return notifications;
    
    const lowercaseQuery = query.toLowerCase();
    return notifications.filter(notification => 
      notification.title.toLowerCase().includes(lowercaseQuery) ||
      notification.message.toLowerCase().includes(lowercaseQuery)
    );
  }, [notifications]);

  // 获取统计信息
  const getNotificationStats = useCallback(() => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.isRead).length;
    const byType = Object.values(NOTIFICATION_TYPES).reduce((acc, type) => {
      acc[type] = notifications.filter(n => n.type === type).length;
      return acc;
    }, {});
    const byPriority = Object.values(NOTIFICATION_PRIORITY).reduce((acc, priority) => {
      acc[priority] = notifications.filter(n => n.priority === priority).length;
      return acc;
    }, {});

    return {
      total,
      unread,
      read: total - unread,
      byType,
      byPriority
    };
  }, [notifications]);

  // 请求通知权限
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('此浏览器不支持桌面通知');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }, []);

  return {
    // 数据
    notifications,
    unreadCount,
    isLoading,

    // 基本操作
    addNotification,
    addMultipleNotifications,
    markAsRead,
    markMultipleAsRead,
    markAllAsRead,
    deleteNotification,
    deleteMultipleNotifications,
    clearAllNotifications,

    // 查询方法
    getUnreadNotifications,
    getNotificationsByType,
    getNotificationsByPriority,
    getRecentUnreadNotifications,
    getRecentNotifications,
    searchNotifications,

    // 统计和工具
    getNotificationStats,
    requestNotificationPermission
  };
}; 