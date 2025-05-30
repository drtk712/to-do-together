import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { useTodoOperations } from './useTodoOperations';
import { useFriendOperations } from './useFriendOperations';

/**
 * 统一数据管理Hook
 * 协调TodosPage中的数据获取，避免重复API调用
 */
export const useDataManager = () => {
  const { user } = useAuth();
  const { fetchSharedTodos } = useTodoOperations();
  const { friends, fetchFriends } = useFriendOperations();

  // 数据状态
  const [sharedTodos, setSharedTodos] = useState([]);
  const [processedSharedTodos, setProcessedSharedTodos] = useState([]);
  const [loading, setLoading] = useState({
    shared: false,
    friends: false
  });
  const [error, setError] = useState('');
  const [lastFetchTime, setLastFetchTime] = useState({
    shared: 0,
    friends: 0
  });

  // 缓存控制
  const cacheTimeRef = useRef({
    shared: 5 * 60 * 1000, // 5分钟
    friends: 10 * 60 * 1000 // 10分钟
  });

  // 请求控制
  const abortControllersRef = useRef({
    shared: null,
    friends: null
  });

  // 检查缓存是否有效
  const isCacheValid = useCallback((type) => {
    const now = Date.now();
    return now - lastFetchTime[type] < cacheTimeRef.current[type];
  }, [lastFetchTime]);

  // 获取好友数据（带缓存）
  const fetchFriendsData = useCallback(async (forceRefresh = false) => {
    if (!user?.$id) return Array.isArray(friends) ? friends : [];

    // 检查缓存
    if (!forceRefresh && Array.isArray(friends) && friends.length > 0 && isCacheValid('friends')) {
      return friends;
    }

    // 取消之前的请求
    if (abortControllersRef.current.friends) {
      abortControllersRef.current.friends.abort();
    }

    abortControllersRef.current.friends = new AbortController();

    try {
      setLoading(prev => ({ ...prev, friends: true }));
      setError('');

      const friendsData = await fetchFriends();
      const validFriendsData = Array.isArray(friendsData) ? friendsData : [];
      
      setLastFetchTime(prev => ({ ...prev, friends: Date.now() }));
      return validFriendsData;
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Fetch friends error:', err);
        setError(err.message || '获取好友列表失败');
      }
      return Array.isArray(friends) ? friends : []; // 返回缓存的数据或空数组
    } finally {
      setLoading(prev => ({ ...prev, friends: false }));
    }
  }, [user?.$id, friends, fetchFriends, isCacheValid]);

  // 获取分享待办数据（带缓存）
  const fetchSharedTodosData = useCallback(async (forceRefresh = false) => {
    if (!user?.$id) {
      setSharedTodos([]);
      setProcessedSharedTodos([]);
      return [];
    }

    // 检查缓存
    if (!forceRefresh && Array.isArray(sharedTodos) && sharedTodos.length > 0 && isCacheValid('shared')) {
      return sharedTodos;
    }

    // 取消之前的请求
    if (abortControllersRef.current.shared) {
      abortControllersRef.current.shared.abort();
    }

    abortControllersRef.current.shared = new AbortController();

    try {
      setLoading(prev => ({ ...prev, shared: true }));
      setError('');

      const sharedData = await fetchSharedTodos();
      const validSharedData = Array.isArray(sharedData) ? sharedData : [];
      
      setSharedTodos(validSharedData);
      setLastFetchTime(prev => ({ ...prev, shared: Date.now() }));
      return validSharedData;
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Fetch shared todos error:', err);
        setError(err.message || '获取分享待办失败');
      }
      return Array.isArray(sharedTodos) ? sharedTodos : []; // 返回缓存的数据或空数组
    } finally {
      setLoading(prev => ({ ...prev, shared: false }));
    }
  }, [user?.$id, sharedTodos, fetchSharedTodos, isCacheValid]);

  // 处理分享待办数据，添加好友信息
  const processSharedTodos = useCallback(async (sharedData = null, friendsData = null) => {
    const currentSharedTodos = sharedData || sharedTodos;
    const currentFriends = friendsData || friends;

    if (currentSharedTodos.length === 0) {
      setProcessedSharedTodos([]);
      return [];
    }

    // 确保有好友数据，并且始终是数组
    let activeFriends = Array.isArray(currentFriends) ? currentFriends : [];
    if (activeFriends.length === 0) {
      try {
        const fetchedFriends = await fetchFriendsData();
        activeFriends = Array.isArray(fetchedFriends) ? fetchedFriends : [];
      } catch (error) {
        console.error('Failed to fetch friends data:', error);
        activeFriends = [];
      }
    }

    const processed = currentSharedTodos.map(todo => {
      const fromUserId = todo.shareInfo?.fromUserId;
      const isMyShare = fromUserId === user?.$id;
      const friend = activeFriends.find(f => f?.user?.userId === fromUserId);
      
      return {
        ...todo,
        friendName: isMyShare ? "我分享的" : (friend?.user?.name || "未知用户"),
        friendAvatar: isMyShare ? user?.avatar : (friend?.user?.avatar || null),
        shareStatus: todo.shareInfo?.shareStatus || 'unread',
        shareId: todo.shareInfo?.shareId,
        sharedAt: todo.shareInfo?.sharedAt,
        isMyShare
      };
    });

    setProcessedSharedTodos(processed);
    return processed;
  }, [sharedTodos, friends, user, fetchFriendsData]);

  // 统一的数据刷新方法
  const refreshData = useCallback(async (options = {}) => {
    const { forceRefresh = false, includeShared = true, includeFriends = true } = options;

    try {
      const promises = [];

      // 并行获取数据
      if (includeFriends) {
        promises.push(fetchFriendsData(forceRefresh));
      } else {
        promises.push(Promise.resolve(Array.isArray(friends) ? friends : []));
      }

      if (includeShared) {
        promises.push(fetchSharedTodosData(forceRefresh));
      } else {
        promises.push(Promise.resolve(Array.isArray(sharedTodos) ? sharedTodos : []));
      }

      const [friendsData, sharedData] = await Promise.all(promises);

      // 确保数据是数组
      const validFriendsData = Array.isArray(friendsData) ? friendsData : [];
      const validSharedData = Array.isArray(sharedData) ? sharedData : [];

      // 处理数据
      let processedData = [];
      if (includeShared && validSharedData.length > 0) {
        processedData = await processSharedTodos(validSharedData, validFriendsData);
      }

      return {
        friends: validFriendsData,
        sharedTodos: validSharedData,
        processedSharedTodos: processedData
      };
    } catch (err) {
      console.error('Refresh data error:', err);
      setError(err.message || '刷新数据失败');
      throw err;
    }
  }, [fetchFriendsData, fetchSharedTodosData, processSharedTodos, friends, sharedTodos]);

  // 初始化数据
  useEffect(() => {
    if (user?.$id) {
      refreshData({ forceRefresh: true });
    }
  }, [user?.$id]);

  // 处理现有数据
  useEffect(() => {
    if (sharedTodos.length > 0 || friends.length > 0) {
      processSharedTodos();
    }
  }, [sharedTodos, friends, processSharedTodos]);

  // 页面可见性变化时的智能刷新
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user?.$id) {
        // 只在缓存过期时刷新
        const shouldRefreshShared = !isCacheValid('shared');
        const shouldRefreshFriends = !isCacheValid('friends');
        
        if (shouldRefreshShared || shouldRefreshFriends) {
          refreshData({
            includeShared: shouldRefreshShared,
            includeFriends: shouldRefreshFriends
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user?.$id, refreshData, isCacheValid]);

  // 清理资源
  useEffect(() => {
    return () => {
      Object.values(abortControllersRef.current).forEach(controller => {
        if (controller) controller.abort();
      });
    };
  }, []);

  // 清除错误
  const clearError = useCallback(() => {
    setError('');
  }, []);

  // 获取缓存状态
  const getCacheStatus = useCallback(() => {
    const now = Date.now();
    return {
      shared: {
        valid: isCacheValid('shared'),
        age: now - lastFetchTime.shared,
        maxAge: cacheTimeRef.current.shared
      },
      friends: {
        valid: isCacheValid('friends'),
        age: now - lastFetchTime.friends,
        maxAge: cacheTimeRef.current.friends
      }
    };
  }, [isCacheValid, lastFetchTime]);

  return {
    // 数据状态
    sharedTodos,
    processedSharedTodos,
    friends,
    loading,
    error,
    
    // 操作方法
    refreshData,
    fetchFriendsData,
    fetchSharedTodosData,
    processSharedTodos,
    clearError,
    
    // 工具方法
    getCacheStatus,
    isCacheValid
  };
}; 