"use client";
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { notificationService, NOTIFICATION_TYPE, NOTIFICATION_STATUS } from '../services/notificationService';
import { friendService } from '../services/friendService';
import { userService } from '../services/userService';
import { handleApiError, logError } from '../utils/errorHandler';

const NotificationList = ({ 
  selectedType = 'all', 
  onNotificationUpdate,
  className = '' 
}) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingIds, setProcessingIds] = useState(new Set());

  // 加载通知列表
  const loadNotifications = useCallback(async () => {
    if (!user?.$id) return;

    try {
      setLoading(true);
      setError('');
      
      let notificationList;
      if (selectedType === 'all') {
        notificationList = await notificationService.getNotifications(user.$id);
      } else {
        notificationList = await notificationService.getNotificationsByType(user.$id, selectedType);
      }
      
      // 为每个通知获取发送者信息
      const enrichedNotifications = await Promise.all(
        notificationList.map(async (notification) => {
          let senderInfo = null;
          if (notification.fromUserId) {
            try {
              senderInfo = await userService.getUserById(notification.fromUserId);
            } catch (error) {
              console.warn('Failed to get sender info:', error);
            }
          }
          
          return {
            ...notification,
            senderInfo: senderInfo ? {
              name: senderInfo.name,
              email: senderInfo.email,
              avatar: senderInfo.avatar
            } : null
          };
        })
      );
      
      setNotifications(enrichedNotifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      setError(error.message || '加载通知失败');
    } finally {
      setLoading(false);
    }
  }, [user?.$id, selectedType]);

  // 初始加载
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // 格式化时间
  const formatTime = (timestamp) => {
    const now = Date.now();
    const notificationTime = new Date(timestamp).getTime();
    const diff = now - notificationTime;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
    return '1周前';
  };

  // 获取通知图标
  const getNotificationIcon = (type) => {
    const iconMap = {
      [NOTIFICATION_TYPE.FRIEND_REQUEST]: '👤',
      [NOTIFICATION_TYPE.FRIEND_ACCEPTED]: '✅',
      [NOTIFICATION_TYPE.FRIEND_REJECTED]: '❌',
      [NOTIFICATION_TYPE.TODO_SHARED]: '📋',
      [NOTIFICATION_TYPE.TODO_REMINDER]: '⏰',
      [NOTIFICATION_TYPE.SYSTEM]: '🔔'
    };
    return iconMap[type] || '📧';
  };

  // 标记为已读
  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId, user.$id);
      setNotifications(prev => 
        prev.map(n => 
          n.$id === notificationId 
            ? { ...n, status: NOTIFICATION_STATUS.READ }
            : n
        )
      );
      onNotificationUpdate?.();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  // 删除通知
  const deleteNotification = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId, user.$id);
      setNotifications(prev => prev.filter(n => n.$id !== notificationId));
      onNotificationUpdate?.();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  // 处理好友请求接受
  const handleAcceptFriendRequest = async (notification) => {
    const friendshipId = notification.data.friendshipId;
    if (!friendshipId) {
      console.error('Missing friendshipId in notification data');
      return;
    }

    try {
      setProcessingIds(prev => new Set(prev).add(notification.$id));
      
      await friendService.handleFriendRequestAccept(
        notification.$id,
        friendshipId,
        user.$id
      );
      
      // 更新通知状态
      setNotifications(prev => 
        prev.map(n => 
          n.$id === notification.$id 
            ? { ...n, status: NOTIFICATION_STATUS.READ }
            : n
        )
      );
      
      onNotificationUpdate?.();
    } catch (error) {
      console.error('Failed to accept friend request:', error);
      alert(error.message || '接受好友请求失败');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(notification.$id);
        return newSet;
      });
    }
  };

  // 处理好友请求拒绝
  const handleRejectFriendRequest = async (notification) => {
    const friendshipId = notification.data.friendshipId;
    if (!friendshipId) {
      console.error('Missing friendshipId in notification data');
      return;
    }

    try {
      setProcessingIds(prev => new Set(prev).add(notification.$id));
      
      await friendService.handleFriendRequestReject(
        notification.$id,
        friendshipId,
        user.$id
      );
      
      // 更新通知状态
      setNotifications(prev => 
        prev.map(n => 
          n.$id === notification.$id 
            ? { ...n, status: NOTIFICATION_STATUS.READ }
            : n
        )
      );
      
      onNotificationUpdate?.();
    } catch (error) {
      console.error('Failed to reject friend request:', error);
      alert(error.message || '拒绝好友请求失败');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(notification.$id);
        return newSet;
      });
    }
  };

  // 渲染操作按钮
  const renderActionButtons = (notification) => {
    const isProcessing = processingIds.has(notification.$id);
    
    if (notification.type === NOTIFICATION_TYPE.FRIEND_REQUEST && notification.status === NOTIFICATION_STATUS.UNREAD) {
      return (
        <div className="flex space-x-2 mt-3">
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              handleAcceptFriendRequest(notification);
            }}
            disabled={isProcessing}
            className="flex-1 px-3 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            {isProcessing ? '处理中...' : '接受'}
          </motion.button>
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              handleRejectFriendRequest(notification);
            }}
            disabled={isProcessing}
            className="flex-1 px-3 py-2 bg-gray-500 text-white text-sm font-medium rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            {isProcessing ? '处理中...' : '拒绝'}
          </motion.button>
        </div>
      );
    }
    
    return null;
  };

  // 处理通知点击
  const handleNotificationClick = async (notification) => {
    // 如果是未读状态，点击时标记为已读
    if (notification.status === NOTIFICATION_STATUS.UNREAD) {
      await markAsRead(notification.$id);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <div className="flex items-center space-x-2 text-gray-500">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full"
          />
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-red-500 mb-4">{error}</div>
        <motion.button
          onClick={loadNotifications}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          whileTap={{ scale: 0.95 }}
        >
          重试
        </motion.button>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-gray-500 mb-4">暂无通知</div>
        <motion.button
          onClick={loadNotifications}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          whileTap={{ scale: 0.95 }}
        >
          刷新
        </motion.button>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <AnimatePresence mode="popLayout">
        {notifications.map((notification, index) => (
          <motion.div
            key={notification.$id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100, scale: 0.8 }}
            transition={{ 
              duration: 0.3,
              delay: index * 0.05
            }}
            className={`bg-white rounded-xl shadow-sm border-l-4 overflow-hidden cursor-pointer ${
              notification.status === NOTIFICATION_STATUS.UNREAD 
                ? 'border-l-blue-500 ring-2 ring-blue-100' 
                : 'border-l-gray-300'
            }`}
            whileTap={{ scale: 0.98 }}
          >
            <div 
              className="p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors"
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start space-x-3">
                {/* 图标 */}
                <div className="flex-shrink-0 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200">
                  <span className="text-xl">{getNotificationIcon(notification.type)}</span>
                </div>
                
                {/* 内容 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className={`text-sm font-semibold ${
                      notification.status === NOTIFICATION_STATUS.READ ? 'text-gray-700' : 'text-gray-900'
                    } pr-2`}>
                      {notification.title}
                    </h3>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <span className="text-xs text-gray-500">
                        {formatTime(notification.$createdAt)}
                      </span>
                      {notification.status === NOTIFICATION_STATUS.UNREAD && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                  <p className={`text-sm ${
                    notification.status === NOTIFICATION_STATUS.READ ? 'text-gray-500' : 'text-gray-700'
                  } leading-relaxed mb-3`}>
                    {notification.message}
                  </p>
                  
                  {/* 发送者信息 */}
                  {notification.senderInfo && (
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-xs">
                          {notification.senderInfo.name?.charAt(0) || notification.senderInfo.email?.charAt(0) || '?'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        来自 {notification.senderInfo.name || notification.senderInfo.email}
                      </span>
                    </div>
                  )}
                  
                  {/* 操作按钮 */}
                  {renderActionButtons(notification)}
                  
                  {/* 删除按钮 */}
                  <div className="flex items-center justify-end mt-2">
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.$id);
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 active:text-red-600 transition-colors"
                      whileTap={{ scale: 0.9 }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationList; 