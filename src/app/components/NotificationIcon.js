import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import NotificationBubble from './NotificationBubble';
import { useNotifications } from '../hooks/useNotifications';

/**
 * 消息通知图标组件
 * 提供通知数量显示和气泡框交互功能
 */
const NotificationIcon = () => {
  const [showBubble, setShowBubble] = useState(false);
  const router = useRouter();
  
  const {
    unreadCount,
    markAsRead,
    getRecentUnreadNotifications
  } = useNotifications();

  // 获取最近的未读消息
  const recentUnreadNotifications = getRecentUnreadNotifications(5);

  // 处理图标点击 - 使用 useCallback 优化性能
  const handleIconClick = useCallback(() => {
    console.log('Icon clicked, current showBubble:', showBubble);
    setShowBubble(prev => !prev);
  }, [showBubble]);

  // 关闭气泡 - 使用 useCallback 优化性能
  const handleCloseBubble = useCallback(() => {
    console.log('Closing bubble');
    setShowBubble(false);
  }, []);

  // 查看所有消息 - 使用 useCallback 优化性能
  const handleViewAll = useCallback(() => {
    router.push('/notifications');
  }, [router]);

  return (
    <div className="relative">
      {/* 通知图标 */}
      <motion.button
        onClick={handleIconClick}
        className="relative p-3 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{ 
          minWidth: '48px', 
          minHeight: '48px',
          WebkitTapHighlightColor: 'transparent'
        }}
        aria-label={`消息通知${unreadCount > 0 ? `, ${unreadCount}条未读` : ''}`}
      >
        {/* 图标背景圆形 */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-50 to-purple-50"
          initial={{ scale: 0 }}
          animate={{ scale: showBubble ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        />
        
        {/* 通知铃铛图标 */}
        <motion.svg 
          className="relative w-6 h-6 text-gray-600" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          animate={{ 
            rotate: showBubble ? [0, -10, 10, -5, 0] : 0,
            scale: unreadCount > 0 ? [1, 1.1, 1] : 1
          }}
          transition={{ 
            rotate: { duration: 0.5 },
            scale: { 
              duration: 0.3, 
              repeat: unreadCount > 0 ? Infinity : 0, 
              repeatDelay: 3 
            }
          }}
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 17h5l-5 5V12H9l5-5v10z" 
          />
        </motion.svg>
        
        {/* 红点提示 */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              key={unreadCount}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1,
                y: [0, -2, 0],
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                scale: { type: "spring", stiffness: 500, damping: 25 },
                y: { duration: 0.6, repeat: Infinity, repeatDelay: 2 }
              }}
              className="absolute -top-1 -right-1 min-w-[20px] h-[20px] bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg ring-2 ring-white"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 脉冲动画环 */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: [0.8, 1.5, 0.8], 
                opacity: [0.3, 0, 0.3] 
              }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute -top-1 -right-1 w-[20px] h-[20px] bg-red-400 rounded-full"
            />
          )}
        </AnimatePresence>
      </motion.button>

      {/* 通知气泡 */}
      {console.log('NotificationIcon showBubble state:', showBubble)}
      <AnimatePresence mode="wait">
        {showBubble && (
          <NotificationBubble
            key="notification-bubble"
            isVisible={showBubble}
            notifications={recentUnreadNotifications}
            onClose={handleCloseBubble}
            onMarkAsRead={markAsRead}
            onViewAll={handleViewAll}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationIcon; 