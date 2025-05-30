"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import NotificationList from '../components/NotificationList';
import { notificationService, NOTIFICATION_TYPE } from '../services/notificationService';

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedType, setSelectedType] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const scrollRef = useRef(null);
  const startY = useRef(0);
  const isPulling = useRef(false);
  
  // 过滤器选项 - 使用真实的通知类型
  const filterOptions = [
    { key: 'all', label: '全部', icon: '📋' },
    { key: NOTIFICATION_TYPE.TODO_SHARED, label: '分享待办', icon: '📝' },
    { key: NOTIFICATION_TYPE.FRIEND_REQUEST, label: '好友请求', icon: '👤' },
    { key: NOTIFICATION_TYPE.FRIEND_ACCEPTED, label: '好友接受', icon: '✅' },
    { key: NOTIFICATION_TYPE.SYSTEM, label: '系统通知', icon: '🔔' },
    { key: NOTIFICATION_TYPE.TODO_REMINDER, label: '提醒', icon: '⏰' }
  ];

  // 加载未读数量
  const loadUnreadCount = useCallback(async () => {
    if (!user?.$id) return;
    
    try {
      const count = await notificationService.getUnreadCount(user.$id);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  }, [user?.$id]);

  // 初始加载
  useEffect(() => {
    loadUnreadCount();
  }, [loadUnreadCount]);

  // 处理通知更新
  const handleNotificationUpdate = () => {
    loadUnreadCount();
  };

  // 处理刷新
  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    // 触觉反馈
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    // 刷新未读数量
    await loadUnreadCount();
    
    // 延迟一下让用户看到刷新动画
    setTimeout(() => {
      setIsRefreshing(false);
      setPullDistance(0);
    }, 1500);
  };

  // 标记所有为已读
  const markAllAsRead = async () => {
    if (!user?.$id) return;
    
    try {
      await notificationService.markAllAsRead(user.$id);
      setUnreadCount(0);
      
      // 触觉反馈
      if (navigator.vibrate) {
        navigator.vibrate([30, 50, 30]);
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // 处理触摸开始
  const handleTouchStart = (e) => {
    if (scrollRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  };

  // 处理触摸移动
  const handleTouchMove = (e) => {
    if (!isPulling.current || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const diffY = currentY - startY.current;

    if (diffY > 0 && scrollRef.current?.scrollTop === 0) {
      e.preventDefault();
      const distance = Math.min(diffY * 0.5, 100);
      setPullDistance(distance);
    }
  };

  // 处理触摸结束
  const handleTouchEnd = () => {
    if (!isPulling.current) return;

    if (pullDistance > 60) {
      handleRefresh();
    } else {
      setPullDistance(0);
    }
    
    isPulling.current = false;
  };

  // 添加触摸事件监听
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, isRefreshing]);

  // 如果用户未登录，显示登录提示
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center"
          >
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-6H8V9h7v8z" />
            </svg>
          </motion.div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">请先登录</h2>
          <p className="text-gray-600 mb-6">登录后查看您的通知消息</p>
          <motion.button
            onClick={() => router.push('/auth')}
            className="px-6 py-3 bg-blue-600 text-white rounded-full font-medium shadow-md hover:bg-blue-700 transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            去登录
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-hidden">
      {/* 顶部导航栏 */}
      <nav className="bg-white shadow-sm sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <motion.button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors touch-manipulation"
              whileTap={{ scale: 0.95 }}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </motion.button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">通知</h1>
              {unreadCount > 0 && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-gray-500"
                >
                  {unreadCount} 条未读
                </motion.p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={markAllAsRead}
                className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors touch-manipulation"
                whileTap={{ scale: 0.95 }}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                全部已读
              </motion.button>
            )}
            <motion.button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 touch-manipulation"
              whileTap={{ scale: 0.95 }}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <motion.svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                animate={isRefreshing ? { rotate: 360 } : {}}
                transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </motion.svg>
            </motion.button>
          </div>
        </div>
      </nav>

      {/* 下拉刷新指示器 */}
      <motion.div
        className="relative bg-white border-b border-gray-200 overflow-hidden"
        style={{ height: pullDistance }}
        animate={{ height: isRefreshing ? 60 : pullDistance }}
      >
        <div className="flex items-center justify-center h-full">
          {isRefreshing ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center space-x-2 text-blue-600"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"
              />
              <span className="text-sm font-medium">正在刷新...</span>
            </motion.div>
          ) : pullDistance > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center space-x-2 text-gray-600"
            >
              <motion.svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                animate={{ rotate: pullDistance > 60 ? 180 : 0 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7-7m0 0l-7 7m7-7v18" />
              </motion.svg>
              <span className="text-sm font-medium">
                {pullDistance > 60 ? '松开刷新' : '下拉刷新'}
              </span>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* 过滤器 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-16 z-30">
        <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
          {filterOptions.map((option) => (
            <motion.button
              key={option.key}
              onClick={() => setSelectedType(option.key)}
              className={`flex-shrink-0 flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors touch-manipulation ${
                selectedType === option.key
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
              }`}
              whileTap={{ scale: 0.95 }}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <span>{option.icon}</span>
              <span>{option.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* 通知列表 */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        style={{ height: 'calc(100vh - 140px)' }}
      >
        <div className="p-4">
          <NotificationList
            selectedType={selectedType}
            onNotificationUpdate={handleNotificationUpdate}
            className="max-w-none"
          />
        </div>
      </div>
    </div>
  );
} 