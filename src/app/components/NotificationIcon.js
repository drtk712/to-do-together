import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { useNotificationCount } from '../hooks/useNotificationCount';
import NotificationBubble from './NotificationBubble';
import { notificationService, NOTIFICATION_STATUS } from '../services/notificationService';

/**
 * 消息通知图标组件
 * 提供通知数量显示和气泡框交互功能
 */
const NotificationIcon = () => {
  const [showBubble, setShowBubble] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const router = useRouter();
  const { user } = useAuth();
  const { unreadCount, loading, refresh, decrementCount } = useNotificationCount();

  // 加载最近的未读通知
  const loadRecentNotifications = useCallback(async () => {
    if (!user?.$id) {
      setRecentNotifications([]);
      return;
    }
    
    try {
      const notifications = await notificationService.getNotifications(
        user.$id, 
        NOTIFICATION_STATUS.UNREAD, 
        5
      );
      setRecentNotifications(notifications);
    } catch (error) {
      console.error('Failed to load recent notifications:', error);
      setRecentNotifications([]);
    }
  }, [user?.$id]);

  // 初始加载
  useEffect(() => {
    loadRecentNotifications();
  }, [loadRecentNotifications]);

  // 处理通知图标点击
  const handleIconClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (unreadCount > 0) {
      setShowBubble(prev => !prev);
      if (!showBubble) {
        loadRecentNotifications();
      }
    } else {
      router.push('/notifications');
    }
  }, [unreadCount, showBubble, router, loadRecentNotifications]);

  // 关闭气泡
  const handleCloseBubble = useCallback(() => {
    setShowBubble(false);
  }, []);

  // 标记为已读
  const handleMarkAsRead = useCallback(async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId, user.$id);
      
      // 更新本地状态
      setRecentNotifications(prev => 
        prev.filter(n => n.$id !== notificationId)
      );
      
      // 减少未读数量
      decrementCount(1);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }, [user?.$id, decrementCount]);

  // 查看所有通知
  const handleViewAll = useCallback(() => {
    setShowBubble(false);
    router.push('/notifications');
  }, [router]);

  // 键盘事件处理
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleIconClick(e);
    } else if (e.key === 'Escape' && showBubble) {
      handleCloseBubble();
    }
  }, [handleIconClick, showBubble, handleCloseBubble]);

  return (
    <>
      <div className="relative">
        <motion.button
          onClick={handleIconClick}
          onKeyDown={handleKeyDown}
          className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors duration-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label={`消息通知${unreadCount > 0 ? `，${unreadCount}条未读` : ''}`}
          role="button"
          tabIndex={0}
        >
          {/* 通知图标 */}
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-5 5V12a3 3 0 00-6 0v5l-5 5h5m0 0v1a3 3 0 006 0v-1m-6 0h6"
            />
          </svg>

          {/* 未读数量徽章 */}
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 500, 
                  damping: 30 
                }}
                className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full shadow-lg"
                aria-hidden="true"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>

          {/* 加载指示器 */}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute -top-1 -right-1 w-3 h-3"
            >
              <div className="w-full h-full border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin"></div>
            </motion.div>
          )}
        </motion.button>
      </div>

      {/* 通知气泡 */}
      <NotificationBubble
        isVisible={showBubble}
        notifications={recentNotifications}
        onClose={handleCloseBubble}
        onMarkAsRead={handleMarkAsRead}
        onViewAll={handleViewAll}
      />
    </>
  );
};

export default NotificationIcon; 