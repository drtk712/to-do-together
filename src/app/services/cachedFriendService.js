import { friendService } from './friendService';
import { globalCache, CACHE_KEYS, CACHE_DEPENDENCIES } from '../utils/cacheManager';
import { logError } from '../utils/errorHandler';

/**
 * 带缓存功能的好友服务
 * 包装原有的friendService，添加智能缓存机制
 */
export const cachedFriendService = {
  /**
   * 获取好友列表（带缓存）
   */
  async getFriendsWithDetails(userId) {
    if (!userId) {
      throw new Error('用户ID是必需的');
    }

    const cacheKey = globalCache.generateKey(CACHE_KEYS.FRIENDS, { userId });
    
    try {
      // 尝试从缓存获取
      const cached = globalCache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // 从服务获取数据
      const friends = await friendService.getFriendsWithDetails(userId);
      
      // 缓存结果
      globalCache.set(cacheKey, friends, {
        ttl: 3 * 60 * 1000, // 3分钟TTL
        dependencies: [CACHE_DEPENDENCIES.FRIENDSHIP_DATA, `user_${userId}`]
      });

      return friends;
    } catch (error) {
      logError(error, { context: 'cachedFriendService.getFriendsWithDetails', userId });
      throw error;
    }
  },

  /**
   * 获取待处理的好友请求（带缓存）
   */
  async getPendingRequestsWithDetails(userId) {
    if (!userId) {
      throw new Error('用户ID是必需的');
    }

    const cacheKey = globalCache.generateKey(CACHE_KEYS.FRIEND_REQUESTS, { 
      userId, 
      type: 'pending' 
    });
    
    try {
      const cached = globalCache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      const requests = await friendService.getPendingRequestsWithDetails(userId);
      
      globalCache.set(cacheKey, requests, {
        ttl: 2 * 60 * 1000, // 2分钟TTL（请求变化较频繁）
        dependencies: [CACHE_DEPENDENCIES.FRIENDSHIP_DATA, `user_${userId}`]
      });

      return requests;
    } catch (error) {
      logError(error, { context: 'cachedFriendService.getPendingRequestsWithDetails', userId });
      throw error;
    }
  },

  /**
   * 获取发送的好友请求（带缓存）
   */
  async getSentRequestsWithDetails(userId) {
    if (!userId) {
      throw new Error('用户ID是必需的');
    }

    const cacheKey = globalCache.generateKey(CACHE_KEYS.FRIEND_REQUESTS, { 
      userId, 
      type: 'sent' 
    });
    
    try {
      const cached = globalCache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      const requests = await friendService.getSentRequestsWithDetails(userId);
      
      globalCache.set(cacheKey, requests, {
        ttl: 2 * 60 * 1000,
        dependencies: [CACHE_DEPENDENCIES.FRIENDSHIP_DATA, `user_${userId}`]
      });

      return requests;
    } catch (error) {
      logError(error, { context: 'cachedFriendService.getSentRequestsWithDetails', userId });
      throw error;
    }
  },

  /**
   * 搜索用户（带缓存）
   */
  async searchUserByEmail(email, currentUserId) {
    if (!email || !currentUserId) {
      throw new Error('邮箱和当前用户ID都是必需的');
    }

    const cacheKey = globalCache.generateKey(CACHE_KEYS.USER, { 
      email: email.toLowerCase(), 
      currentUserId 
    });
    
    try {
      const cached = globalCache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      const result = await friendService.searchUserByEmail(email, currentUserId);
      
      // 缓存搜索结果
      globalCache.set(cacheKey, result, {
        ttl: 10 * 60 * 1000, // 10分钟TTL（用户信息相对稳定）
        dependencies: [CACHE_DEPENDENCIES.USER_DATA, CACHE_DEPENDENCIES.FRIENDSHIP_DATA]
      });

      return result;
    } catch (error) {
      logError(error, { context: 'cachedFriendService.searchUserByEmail', email, currentUserId });
      throw error;
    }
  },

  /**
   * 通过用户名搜索用户（带缓存）
   */
  async searchUsersByName(name, currentUserId) {
    if (!name || !currentUserId) {
      throw new Error('用户名和当前用户ID都是必需的');
    }

    const cacheKey = globalCache.generateKey(CACHE_KEYS.USER, { 
      name: name.toLowerCase(), 
      currentUserId 
    });
    
    try {
      const cached = globalCache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      const results = await friendService.searchUsersByName(name, currentUserId);
      
      globalCache.set(cacheKey, results, {
        ttl: 10 * 60 * 1000,
        dependencies: [CACHE_DEPENDENCIES.USER_DATA, CACHE_DEPENDENCIES.FRIENDSHIP_DATA]
      });

      return results;
    } catch (error) {
      logError(error, { context: 'cachedFriendService.searchUsersByName', name, currentUserId });
      throw error;
    }
  },

  /**
   * 发送好友请求（会失效相关缓存）
   */
  async sendFriendRequest(currentUserId, targetUser) {
    try {
      const result = await friendService.sendFriendRequest(currentUserId, targetUser);
      
      // 失效相关缓存
      this.invalidateFriendshipCache(currentUserId, targetUser.userId);
      
      return result;
    } catch (error) {
      logError(error, { context: 'cachedFriendService.sendFriendRequest', currentUserId, targetUser });
      throw error;
    }
  },

  /**
   * 接受好友请求（会失效相关缓存）
   */
  async acceptFriendRequest(requestId, userId) {
    try {
      const result = await friendService.acceptFriendRequest(requestId, userId);
      
      // 失效相关缓存
      globalCache.invalidateByDependency(CACHE_DEPENDENCIES.FRIENDSHIP_DATA);
      globalCache.invalidateByDependency(`user_${userId}`);
      
      return result;
    } catch (error) {
      logError(error, { context: 'cachedFriendService.acceptFriendRequest', requestId, userId });
      throw error;
    }
  },

  /**
   * 拒绝好友请求（会失效相关缓存）
   */
  async rejectFriendRequest(requestId, userId) {
    try {
      const result = await friendService.rejectFriendRequest(requestId, userId);
      
      // 失效相关缓存
      globalCache.invalidateByDependency(CACHE_DEPENDENCIES.FRIENDSHIP_DATA);
      globalCache.invalidateByDependency(`user_${userId}`);
      
      return result;
    } catch (error) {
      logError(error, { context: 'cachedFriendService.rejectFriendRequest', requestId, userId });
      throw error;
    }
  },

  /**
   * 删除好友（会失效相关缓存）
   */
  async removeFriend(friendshipId, userId) {
    try {
      const result = await friendService.removeFriend(friendshipId, userId);
      
      // 失效相关缓存
      globalCache.invalidateByDependency(CACHE_DEPENDENCIES.FRIENDSHIP_DATA);
      globalCache.invalidateByDependency(`user_${userId}`);
      
      return result;
    } catch (error) {
      logError(error, { context: 'cachedFriendService.removeFriend', friendshipId, userId });
      throw error;
    }
  },

  /**
   * 取消好友请求（会失效相关缓存）
   */
  async cancelFriendRequest(requestId, userId) {
    try {
      const result = await friendService.cancelFriendRequest(requestId, userId);
      
      // 失效相关缓存
      this.invalidateFriendshipCache(userId);
      
      return result;
    } catch (error) {
      logError(error, { context: 'cachedFriendService.cancelFriendRequest', requestId, userId });
      throw error;
    }
  },

  /**
   * 检查是否是好友（带缓存）
   */
  async areFriends(userId1, userId2) {
    const cacheKey = globalCache.generateKey('friendship_status', { 
      user1: Math.min(userId1, userId2), 
      user2: Math.max(userId1, userId2) 
    });
    
    try {
      const cached = globalCache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      const result = await friendService.areFriends(userId1, userId2);
      
      globalCache.set(cacheKey, result, {
        ttl: 5 * 60 * 1000,
        dependencies: [CACHE_DEPENDENCIES.FRIENDSHIP_DATA]
      });

      return result;
    } catch (error) {
      logError(error, { context: 'cachedFriendService.areFriends', userId1, userId2 });
      return false;
    }
  },

  /**
   * 获取好友关系状态（带缓存）
   */
  async getFriendshipStatus(userId1, userId2) {
    const cacheKey = globalCache.generateKey('friendship_status_detail', { 
      user1: Math.min(userId1, userId2), 
      user2: Math.max(userId1, userId2) 
    });
    
    try {
      const cached = globalCache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      const result = await friendService.getFriendshipStatus(userId1, userId2);
      
      globalCache.set(cacheKey, result, {
        ttl: 5 * 60 * 1000,
        dependencies: [CACHE_DEPENDENCIES.FRIENDSHIP_DATA]
      });

      return result;
    } catch (error) {
      logError(error, { context: 'cachedFriendService.getFriendshipStatus', userId1, userId2 });
      return null;
    }
  },

  /**
   * 失效好友关系相关缓存
   */
  invalidateFriendshipCache(userId1, userId2 = null) {
    // 失效用户相关的所有缓存
    globalCache.invalidateByDependency(`user_${userId1}`);
    
    if (userId2) {
      globalCache.invalidateByDependency(`user_${userId2}`);
    }
    
    // 失效好友关系数据
    globalCache.invalidateByDependency(CACHE_DEPENDENCIES.FRIENDSHIP_DATA);
  },

  /**
   * 失效用户相关的所有缓存
   */
  invalidateUserCache(userId) {
    globalCache.invalidateByDependency(`user_${userId}`);
    globalCache.invalidateByDependency(CACHE_DEPENDENCIES.USER_DATA);
  },

  /**
   * 获取缓存统计信息
   */
  getCacheStats() {
    return globalCache.getStats();
  },

  /**
   * 清理过期缓存
   */
  cleanupCache() {
    return globalCache.cleanup();
  }
}; 