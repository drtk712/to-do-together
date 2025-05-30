import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notificationService';
import { useAuth } from './useAuth';

/**
 * 自定义Hook - 管理未读通知数量
 * 统一处理未读数量的获取和状态管理
 */
export const useNotificationCount = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadUnreadCount = useCallback(async () => {
    if (!user?.$id) {
      setUnreadCount(0);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const count = await notificationService.getUnreadCount(user.$id);
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to load unread count:', err);
      setError(err.message || '获取未读数量失败');
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [user?.$id]);

  // 初始加载
  useEffect(() => {
    loadUnreadCount();
  }, [loadUnreadCount]);

  // 手动刷新函数
  const refresh = useCallback(() => {
    loadUnreadCount();
  }, [loadUnreadCount]);

  // 手动减少未读数量（用于已读操作后的即时更新）
  const decrementCount = useCallback((amount = 1) => {
    setUnreadCount(prevCount => Math.max(0, prevCount - amount));
  }, []);

  // 手动设置未读数量
  const setCount = useCallback((count) => {
    setUnreadCount(Math.max(0, count));
  }, []);

  return {
    unreadCount,
    loading,
    error,
    refresh,
    decrementCount,
    setCount
  };
}; 