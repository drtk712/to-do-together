import { useState, useCallback, useEffect } from 'react';
import { cachedFriendService } from '../services/cachedFriendService';
import { useAuth } from './useAuth';

/**
 * 管理好友数据操作的自定义Hook
 * 实现乐观更新机制和智能缓存，减少重复API调用
 */
export const useFriendOperations = () => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();

  // 获取好友列表 - 使用缓存服务
  const fetchFriends = useCallback(async () => {
    if (!user?.$id) {
      setFriends([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      const friendsData = await cachedFriendService.getFriendsWithDetails(user.$id);
      setFriends(friendsData);
    } catch (err) {
      setError(err.message || '获取好友列表失败');
      console.error('Fetch friends error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.$id]);

  // 删除好友 - 乐观更新 + 缓存失效
  const removeFriend = useCallback(async (friendshipId) => {
    if (!user?.$id) return false;
    
    // 保存原始状态，用于失败时回滚
    const originalFriends = friends;
    
    try {
      // 乐观更新：立即从本地状态中移除
      setFriends(prev => prev.filter(friend => friend.friendshipId !== friendshipId));
      setError("");
      
      // 执行删除操作（会自动失效相关缓存）
      await cachedFriendService.removeFriend(friendshipId, user.$id);
      
      return true;
    } catch (err) {
      // 如果失败，回滚到原始状态
      setFriends(originalFriends);
      setError(err.message || '删除好友失败');
      console.error('Remove friend error:', err);
      return false;
    }
  }, [user?.$id, friends]);

  // 发送好友请求 - 使用缓存服务
  const sendFriendRequest = useCallback(async (targetUserId, targetUser) => {
    if (!user?.$id) return false;
    
    try {
      setError("");
      // 使用缓存服务（会自动失效相关缓存）
      await cachedFriendService.sendFriendRequest(user.$id, targetUser);
      return true;
    } catch (err) {
      setError(err.message || '发送好友请求失败');
      console.error('Send friend request error:', err);
      return false;
    }
  }, [user?.$id]);

  // 接受好友请求 - 乐观更新 + 缓存失效
  const acceptFriendRequest = useCallback(async (requestId, requestUser) => {
    if (!user?.$id) return false;
    
    try {
      setError("");
      
      // 乐观更新：立即添加到好友列表
      const newFriend = {
        friendshipId: `temp_${Date.now()}`, // 临时ID
        user: requestUser,
        status: 'accepted',
        $createdAt: new Date().toISOString()
      };
      
      setFriends(prev => [newFriend, ...prev]);
      
      // 执行接受操作（会自动失效相关缓存）
      const result = await cachedFriendService.acceptFriendRequest(requestId, user.$id);
      
      // 更新为真实的friendshipId
      if (result && result.friendshipId) {
        setFriends(prev => 
          prev.map(friend => 
            friend.friendshipId === newFriend.friendshipId 
              ? { ...friend, friendshipId: result.friendshipId }
              : friend
          )
        );
      }
      
      return true;
    } catch (err) {
      // 如果失败，移除乐观添加的好友
      setFriends(prev => prev.filter(friend => friend.friendshipId !== `temp_${Date.now()}`));
      setError(err.message || '接受好友请求失败');
      console.error('Accept friend request error:', err);
      return false;
    }
  }, [user?.$id]);

  // 拒绝好友请求 - 使用缓存服务
  const rejectFriendRequest = useCallback(async (requestId) => {
    if (!user?.$id) return false;
    
    try {
      setError("");
      // 使用缓存服务（会自动失效相关缓存）
      await cachedFriendService.rejectFriendRequest(requestId, user.$id);
      return true;
    } catch (err) {
      setError(err.message || '拒绝好友请求失败');
      console.error('Reject friend request error:', err);
      return false;
    }
  }, [user?.$id]);

  // 搜索用户 - 使用缓存服务
  const searchUserByEmail = useCallback(async (email) => {
    if (!user?.$id || !email) return null;
    
    try {
      setError("");
      // 使用缓存服务
      return await cachedFriendService.searchUserByEmail(email, user.$id);
    } catch (err) {
      setError(err.message || '搜索用户失败');
      console.error('Search user by email error:', err);
      return null;
    }
  }, [user?.$id]);

  // 通过用户名搜索用户 - 使用缓存服务
  const searchUsersByName = useCallback(async (name) => {
    if (!user?.$id || !name) return [];
    
    try {
      setError("");
      // 使用缓存服务
      return await cachedFriendService.searchUsersByName(name, user.$id);
    } catch (err) {
      setError(err.message || '搜索用户失败');
      console.error('Search users by name error:', err);
      return [];
    }
  }, [user?.$id]);

  // 清除错误
  const clearError = useCallback(() => {
    setError("");
  }, []);

  // 刷新数据
  const refresh = useCallback(() => {
    return fetchFriends();
  }, [fetchFriends]);

  // 获取缓存统计信息
  const getCacheStats = useCallback(() => {
    return cachedFriendService.getCacheStats();
  }, []);

  // 清理缓存
  const cleanupCache = useCallback(() => {
    return cachedFriendService.cleanupCache();
  }, []);

  // 当用户登出时清除数据和缓存
  useEffect(() => {
    if (!user) {
      setFriends([]);
      setError("");
      setLoading(false);
      // 清理用户相关缓存
      if (user?.$id) {
        cachedFriendService.invalidateUserCache(user.$id);
      }
    }
  }, [user]);

  return {
    // 数据状态
    friends,
    loading,
    error,
    
    // 操作方法
    fetchFriends,
    removeFriend,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    searchUserByEmail,
    searchUsersByName,
    
    // 工具方法
    clearError,
    refresh,
    getCacheStats,
    cleanupCache,
  };
}; 