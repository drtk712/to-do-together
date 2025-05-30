import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { NOTIFICATION_TYPE } from '../services/notificationService';

/**
 * 消息通知气泡组件
 * 使用 React Portal 渲染到 document.body，避免事件冒泡
 */
const NotificationBubble = ({ 
  isVisible, 
  notifications = [], 
  onClose, 
  onMarkAsRead, 
  onViewAll 
}) => {
  const router = useRouter();

  // 阻止页面滚动和事件穿透
  useEffect(() => {
    if (!isVisible) return;

    // 保存原始样式
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalWidth = document.body.style.width;
    const originalHeight = document.body.style.height;

    // 设置阻止滚动的样式
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';

    // 阻止触摸事件穿透
    const preventTouch = (e) => e.preventDefault();
    document.addEventListener('touchmove', preventTouch, { passive: false });

    // 清理函数
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = originalWidth;
      document.body.style.height = originalHeight;
      document.removeEventListener('touchmove', preventTouch);
    };
  }, [isVisible]);

  // 格式化时间 - 使用 useCallback 优化性能
  const formatTime = useCallback((timestamp) => {
    const now = Date.now();
    const notificationTime = new Date(timestamp).getTime();
    const diff = now - notificationTime;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
    return '1周前';
  }, []);

  // 获取通知类型颜色 - 使用 useCallback 优化性能
  const getTypeColor = useCallback((type) => {
    const colorMap = {
      [NOTIFICATION_TYPE.FRIEND_REQUEST]: 'border-l-blue-400 bg-blue-50',
      [NOTIFICATION_TYPE.FRIEND_ACCEPTED]: 'border-l-green-400 bg-green-50',
      [NOTIFICATION_TYPE.FRIEND_REJECTED]: 'border-l-red-400 bg-red-50',
      [NOTIFICATION_TYPE.TODO_SHARED]: 'border-l-purple-400 bg-purple-50',
      [NOTIFICATION_TYPE.TODO_REMINDER]: 'border-l-yellow-400 bg-yellow-50',
      [NOTIFICATION_TYPE.SYSTEM]: 'border-l-gray-400 bg-gray-50'
    };
    return colorMap[type] || 'border-l-gray-400 bg-gray-50';
  }, []);

  // 获取通知图标
  const getNotificationIcon = useCallback((type) => {
    const iconMap = {
      [NOTIFICATION_TYPE.FRIEND_REQUEST]: '👤',
      [NOTIFICATION_TYPE.FRIEND_ACCEPTED]: '✅',
      [NOTIFICATION_TYPE.FRIEND_REJECTED]: '❌',
      [NOTIFICATION_TYPE.TODO_SHARED]: '📋',
      [NOTIFICATION_TYPE.TODO_REMINDER]: '⏰',
      [NOTIFICATION_TYPE.SYSTEM]: '🔔'
    };
    return iconMap[type] || '📧';
  }, []);

  // 处理通知点击 - 使用 useCallback 优化性能
  const handleNotificationClick = useCallback((notification) => {
    console.log('Notification clicked:', notification.title);
    
    // 标记为已读并关闭气泡
    onMarkAsRead?.(notification.$id);
    onClose?.();
    
    // 根据通知类型导航到相应页面
    const routeMap = {
      [NOTIFICATION_TYPE.TODO_SHARED]: '/dashboard',
      [NOTIFICATION_TYPE.FRIEND_REQUEST]: '/dashboard?tab=friends',
      [NOTIFICATION_TYPE.FRIEND_ACCEPTED]: '/dashboard?tab=friends',
      [NOTIFICATION_TYPE.FRIEND_REJECTED]: '/dashboard?tab=friends',
      [NOTIFICATION_TYPE.TODO_REMINDER]: '/dashboard',
      [NOTIFICATION_TYPE.SYSTEM]: '/notifications'
    };
    
    const route = routeMap[notification.type] || '/notifications';
    router.push(route);
  }, [onMarkAsRead, onClose, router]);

  // 处理背景点击
  const handleBackdropClick = useCallback((e) => {
    console.log('Backdrop clicked');
    e.preventDefault();
    e.stopPropagation();
    onClose?.();
  }, [onClose]);

  // 处理气泡内容点击
  const handleBubbleClick = useCallback((e) => {
    console.log('Bubble content clicked');
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // 处理关闭按钮点击
  const handleCloseClick = useCallback((e) => {
    console.log('Close button clicked');
    e.preventDefault();
    e.stopPropagation();
    onClose?.();
  }, [onClose]);

  // 处理查看全部按钮点击
  const handleViewAllClick = useCallback((e) => {
    console.log('View all button clicked');
    e.preventDefault();
    e.stopPropagation();
    onViewAll?.();
    onClose?.();
  }, [onViewAll, onClose]);

  // 注意：现在条件渲染由父组件的 AnimatePresence 处理

  // 气泡内容
  const bubbleContent = (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ 
        duration: 0.5,
        ease: "easeInOut"
      }}
      onAnimationStart={() => console.log('Container animation started')}
      onAnimationComplete={() => console.log('Container animation completed')}
      className="fixed inset-0 z-[9999]"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999
      }}
    >
      {/* 背景遮罩 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          duration: 0.5,
          ease: "easeInOut"
        }}
        className="absolute inset-0 bg-black/30 backdrop-blur-sm cursor-pointer"
        onClick={handleBackdropClick}
      />
      
      {/* 气泡内容 */}
      <motion.div
        initial={{ 
          opacity: 0, 
          scale: 0.8, 
          y: -50
        }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          y: 0
        }}
        exit={{ 
          opacity: 0, 
          scale: 0.7, 
          y: -60
        }}
        transition={{
          duration: 0.5,
          ease: "easeInOut"
        }}
        onAnimationStart={() => console.log('Bubble animation started')}
        onAnimationComplete={() => console.log('Bubble animation completed')}
        className="absolute top-16 left-4 right-4 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[80vh]"
        style={{ 
          maxWidth: '400px', 
          margin: '0 auto',
          zIndex: 2
        }}
        onClick={handleBubbleClick}
      >
        {/* 气泡头部 */}
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5V12H9l5-5v10z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">消息通知</h3>
                {notifications.length > 0 && (
                  <p className="text-xs text-gray-500">{notifications.length} 条未读消息</p>
                )}
              </div>
            </div>
            <button
              onClick={handleCloseClick}
              className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
              aria-label="关闭通知"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(80vh - 140px)' }}>
          {notifications.length === 0 ? (
            // 空状态
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">暂无未读消息</h4>
              <p className="text-sm text-gray-500">您的消息会在这里显示</p>
            </div>
          ) : (
            // 消息列表
            <div className="space-y-1 p-2">
              {notifications.map((notification, index) => (
                <div
                  key={notification.$id}
                  className={`border-l-4 ${getTypeColor(notification.type)} rounded-lg overflow-hidden`}
                >
                  <div
                    className="p-4 hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleNotificationClick(notification);
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      {/* 通知图标 */}
                      <div className="flex-shrink-0 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200">
                        <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                      </div>
                      
                      {/* 通知内容 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="text-sm font-semibold text-gray-900 truncate pr-2">
                            {notification.title}
                          </h4>
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {formatTime(notification.$createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 气泡底部 */}
        {notifications.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
            <button
              onClick={handleViewAllClick}
              className="w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 rounded-lg transition-colors"
            >
              查看全部消息
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );

  // 条件渲染
  if (!isVisible) return null;

  // 使用 Portal 渲染到 body
  return createPortal(bubbleContent, document.body);
};

export default NotificationBubble;
