"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useNotifications, NOTIFICATION_TYPES } from '../hooks/useNotifications';

export default function NotificationsPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const scrollRef = useRef(null);
  const startY = useRef(0);
  const isPulling = useRef(false);
  
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getNotificationsByType,
    addNotification
  } = useNotifications();

  // 过滤器选项
  const filterOptions = [
    { key: 'all', label: '全部', icon: '📋' },
    { key: NOTIFICATION_TYPES.TODO, label: '待办', icon: '📝' },
    { key: NOTIFICATION_TYPES.FRIEND, label: '好友', icon: '👤' },
    { key: NOTIFICATION_TYPES.SYSTEM, label: '系统', icon: '🔄' },
    { key: NOTIFICATION_TYPES.LOGIN, label: '登录', icon: '🔐' },
    { key: NOTIFICATION_TYPES.SUMMARY, label: '总结', icon: '📊' }
  ];

  // 获取过滤后的通知
  const filteredNotifications = selectedType === 'all' 
    ? notifications 
    : getNotificationsByType(selectedType);

  // 模拟刷新数据
  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    // 触觉反馈
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 模拟添加新消息
    const mockMessages = [
      {
        type: NOTIFICATION_TYPES.TODO,
        title: '新的待办提醒',
        message: '您有新的待办事项需要处理',
        priority: 'medium',
        icon: '📝'
      },
      {
        type: NOTIFICATION_TYPES.SYSTEM,
        title: '系统消息',
        message: '数据已同步更新',
        priority: 'low',
        icon: '🔄'
      }
    ];
    
    // 随机添加一条消息
    const randomMessage = mockMessages[Math.floor(Math.random() * mockMessages.length)];
    addNotification(randomMessage);
    
    setIsRefreshing(false);
    setPullDistance(0);
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

  // 格式化时间
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
    
    return date.toLocaleDateString('zh-CN', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 获取优先级颜色
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-400 bg-red-50';
      case 'medium':
        return 'border-l-yellow-400 bg-yellow-50';
      case 'low':
        return 'border-l-green-400 bg-green-50';
      default:
        return 'border-l-gray-400 bg-gray-50';
    }
  };

  // 处理通知点击
  const handleNotificationClick = (notification) => {
    // 触觉反馈
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
    
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    // 根据通知类型导航
    switch (notification.type) {
      case NOTIFICATION_TYPES.TODO:
        router.push('/dashboard');
        break;
      case NOTIFICATION_TYPES.FRIEND:
        router.push('/dashboard?tab=friends');
        break;
      default:
        break;
    }
  };

  // 处理滑动删除
  const handleSwipeDelete = (notificationId, info) => {
    if (Math.abs(info.offset.x) > 100) {
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      deleteNotification(notificationId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-hidden">
      {/* 顶部导航栏 */}
      <nav className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <motion.button
                onClick={() => router.back()}
                className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
                whileTap={{ scale: 0.95 }}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </motion.button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">消息通知</h1>
                {unreadCount > 0 && (
                  <p className="text-xs text-gray-500">{unreadCount} 条未读</p>
                )}
              </div>
            </div>
            
            {/* 标记全部已读 */}
            {unreadCount > 0 && (
              <motion.button
                onClick={markAllAsRead}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 active:bg-blue-100 rounded-lg transition-colors touch-manipulation"
                whileTap={{ scale: 0.95 }}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                全部已读
              </motion.button>
            )}
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
        {filteredNotifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full text-center p-8"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center"
            >
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </motion.div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">暂无消息</h3>
            <p className="text-gray-500 mb-6">
              {selectedType === 'all' ? '您还没有收到任何消息' : '该类型暂无消息'}
            </p>
            <motion.button
              onClick={handleRefresh}
              className="px-6 py-3 bg-blue-600 text-white rounded-full font-medium shadow-md active:shadow-sm transition-all touch-manipulation"
              whileTap={{ scale: 0.95 }}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              检查新消息
            </motion.button>
          </motion.div>
        ) : (
          <div className="p-4 space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredNotifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100, scale: 0.8 }}
                  transition={{ 
                    duration: 0.3,
                    delay: index * 0.05
                  }}
                  drag="x"
                  dragConstraints={{ left: -200, right: 200 }}
                  dragElastic={0.2}
                  onDragEnd={(event, info) => handleSwipeDelete(notification.id, info)}
                  className={`bg-white rounded-xl shadow-sm border-l-4 overflow-hidden cursor-pointer ${getPriorityColor(notification.priority)} ${
                    !notification.isRead ? 'ring-2 ring-blue-100' : ''
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
                        <span className="text-xl">{notification.icon}</span>
                      </div>
                      
                      {/* 内容 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className={`text-sm font-semibold ${
                            notification.isRead ? 'text-gray-700' : 'text-gray-900'
                          } pr-2`}>
                            {notification.title}
                          </h3>
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            <span className="text-xs text-gray-500">
                              {formatTime(notification.timestamp)}
                            </span>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                        <p className={`text-sm ${
                          notification.isRead ? 'text-gray-500' : 'text-gray-700'
                        } leading-relaxed mb-3`}>
                          {notification.message}
                        </p>
                        
                        {/* 优先级和操作 */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {notification.priority === 'high' && (
                              <span className="inline-block px-2 py-1 text-xs font-medium text-red-600 bg-red-100 rounded-full">
                                🔥 重要
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="p-2 text-gray-400 hover:text-red-500 active:text-red-600 transition-colors touch-manipulation"
                              whileTap={{ scale: 0.9 }}
                              style={{ WebkitTapHighlightColor: 'transparent' }}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* 滑动提示 */}
                    <div className="mt-3 text-center">
                      <span className="text-xs text-gray-400">← 滑动删除</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
} 