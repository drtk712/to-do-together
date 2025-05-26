/**
 * 缓存预加载策略
 * 智能预加载用户常用数据，提升应用响应速度
 */

import { cachedTodoService } from '../services/cachedTodoService';
import { cachedFriendService } from '../services/cachedFriendService';
import { CACHE_STRATEGIES, CACHE_TTL } from '../config/cacheConfig';
import { logError } from './errorHandler';

class CachePreloader {
  constructor() {
    this.preloadQueue = new Map();
    this.isPreloading = false;
    this.preloadHistory = new Map(); // 记录预加载历史
    this.userPatterns = new Map(); // 用户使用模式
  }

  /**
   * 用户登录后的预加载策略
   */
  async preloadUserData(userId) {
    if (!userId || this.isPreloading) return;

    this.isPreloading = true;
    const startTime = Date.now();

    try {
      console.log(`[CachePreloader] Starting preload for user: ${userId}`);

      // 并行预加载核心数据
      const preloadTasks = [
        this.preloadTodos(userId),
        this.preloadFriends(userId),
        this.preloadSharedTodos(userId)
      ];

      // 使用 Promise.allSettled 确保部分失败不影响其他预加载
      const results = await Promise.allSettled(preloadTasks);
      
      // 记录预加载结果
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      const duration = Date.now() - startTime;
      console.log(`[CachePreloader] Completed in ${duration}ms. Success: ${successful}, Failed: ${failed}`);

      // 记录预加载历史
      this.preloadHistory.set(userId, {
        timestamp: Date.now(),
        duration,
        successful,
        failed,
        tasks: preloadTasks.length
      });

      // 延迟预加载次要数据
      setTimeout(() => {
        this.preloadSecondaryData(userId);
      }, CACHE_STRATEGIES.PRELOAD_DELAY);

    } catch (error) {
      logError(error, { context: 'CachePreloader.preloadUserData', userId });
    } finally {
      this.isPreloading = false;
    }
  }

  /**
   * 预加载待办事项数据
   */
  async preloadTodos(userId) {
    try {
      // 预加载默认待办事项列表
      await cachedTodoService.getTodos(userId);
      
      // 预加载常用过滤条件的数据
      const commonFilters = [
        { status: 'pending' },
        { status: 'completed' },
        { priority: 'high' }
      ];

      const filterTasks = commonFilters.map(filter => 
        cachedTodoService.getTodos(userId, filter)
      );

      await Promise.allSettled(filterTasks);
      
      // 预加载统计数据
      await cachedTodoService.getTodoStats(userId);

      console.log(`[CachePreloader] Todos preloaded for user: ${userId}`);
    } catch (error) {
      logError(error, { context: 'CachePreloader.preloadTodos', userId });
    }
  }

  /**
   * 预加载好友数据
   */
  async preloadFriends(userId) {
    try {
      // 预加载好友列表
      await cachedFriendService.getFriends(userId);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[CachePreloader] Friends preloaded for user: ${userId}`);
      }
    } catch (error) {
      logError(error, { context: 'CachePreloader.preloadFriends', userId });
    }
  }

  /**
   * 预加载共享待办事项
   */
  async preloadSharedTodos(userId) {
    try {
      await cachedTodoService.getSharedTodos(userId);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[CachePreloader] Shared todos preloaded for user: ${userId}`);
      }
    } catch (error) {
      logError(error, { context: 'CachePreloader.preloadSharedTodos', userId });
    }
  }

  /**
   * 预加载次要数据
   */
  async preloadSecondaryData(userId) {
    try {
      // 根据用户使用模式预加载
      const patterns = this.userPatterns.get(userId);
      
      if (patterns?.frequentSearches) {
        // 预加载常用搜索结果
        for (const query of patterns.frequentSearches.slice(0, 3)) {
          await cachedTodoService.searchTodos(userId, query);
        }
      }

      console.log(`[CachePreloader] Secondary data preloaded for user: ${userId}`);
    } catch (error) {
      logError(error, { context: 'CachePreloader.preloadSecondaryData', userId });
    }
  }

  /**
   * 智能预加载 - 基于用户行为模式
   */
  async smartPreload(userId, action, context = {}) {
    if (!CACHE_STRATEGIES.PRELOAD_ENABLED) return;

    try {
      switch (action) {
        case 'view_todos':
          // 用户查看待办事项时，预加载相关数据
          await this.preloadRelatedTodos(userId, context);
          break;
          
        case 'view_friends':
          // 用户查看好友时，预加载好友的共享内容
          await this.preloadFriendContent(userId, context);
          break;
          
        case 'search':
          // 用户搜索时，记录搜索模式
          this.recordSearchPattern(userId, context.query);
          break;
          
        case 'create_todo':
          // 创建待办事项后，预加载更新的列表
          setTimeout(() => {
            cachedTodoService.getTodos(userId);
          }, 100);
          break;
      }
    } catch (error) {
      logError(error, { context: 'CachePreloader.smartPreload', userId, action });
    }
  }

  /**
   * 预加载相关待办事项
   */
  async preloadRelatedTodos(userId, context) {
    try {
      const { currentFilter } = context;
      
      // 预加载其他常用过滤条件
      const relatedFilters = [
        { status: 'pending' },
        { status: 'completed' },
        { priority: 'high' }
      ].filter(filter => 
        JSON.stringify(filter) !== JSON.stringify(currentFilter)
      );

      const tasks = relatedFilters.map(filter => 
        cachedTodoService.getTodos(userId, filter)
      );

      await Promise.allSettled(tasks);
    } catch (error) {
      logError(error, { context: 'CachePreloader.preloadRelatedTodos', userId });
    }
  }

  /**
   * 预加载好友相关内容
   */
  async preloadFriendContent(userId, context) {
    try {
      // 预加载共享的待办事项
      await cachedTodoService.getSharedTodos(userId);
    } catch (error) {
      logError(error, { context: 'CachePreloader.preloadFriendContent', userId });
    }
  }

  /**
   * 记录搜索模式
   */
  recordSearchPattern(userId, query) {
    if (!query || query.length < 2) return;

    const patterns = this.userPatterns.get(userId) || {
      frequentSearches: [],
      searchCount: new Map()
    };

    // 更新搜索计数
    const currentCount = patterns.searchCount.get(query) || 0;
    patterns.searchCount.set(query, currentCount + 1);

    // 更新频繁搜索列表
    const sortedSearches = Array.from(patterns.searchCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([query]) => query);

    patterns.frequentSearches = sortedSearches;
    this.userPatterns.set(userId, patterns);
  }

  /**
   * 预热缓存 - 应用启动时调用
   */
  async warmupCache() {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('[CachePreloader] Starting cache warmup...');
      }
      
      // 这里可以预加载一些全局数据
      // 例如：应用配置、公共数据等
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[CachePreloader] Cache warmup completed');
      }
    } catch (error) {
      logError(error, { context: 'CachePreloader.warmupCache' });
    }
  }

  /**
   * 获取预加载统计
   */
  getPreloadStats() {
    const stats = {
      totalUsers: this.preloadHistory.size,
      averageDuration: 0,
      successRate: 0,
      patterns: this.userPatterns.size
    };

    if (this.preloadHistory.size > 0) {
      const histories = Array.from(this.preloadHistory.values());
      
      stats.averageDuration = histories.reduce((sum, h) => sum + h.duration, 0) / histories.length;
      
      const totalTasks = histories.reduce((sum, h) => sum + h.tasks, 0);
      const totalSuccessful = histories.reduce((sum, h) => sum + h.successful, 0);
      stats.successRate = totalTasks > 0 ? totalSuccessful / totalTasks : 0;
    }

    return stats;
  }

  /**
   * 清理预加载历史
   */
  cleanup() {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    
    for (const [userId, history] of this.preloadHistory.entries()) {
      if (history.timestamp < oneHourAgo) {
        this.preloadHistory.delete(userId);
      }
    }

    // 清理用户模式数据（保留最近活跃的用户）
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    for (const [userId, patterns] of this.userPatterns.entries()) {
      if (!this.preloadHistory.has(userId)) {
        // 如果用户最近没有预加载记录，清理其模式数据
        this.userPatterns.delete(userId);
      }
    }
  }
}

// 创建全局预加载器实例
export const cachePreloader = new CachePreloader();

// 自动清理定时器
setInterval(() => {
  cachePreloader.cleanup();
}, 60 * 60 * 1000); // 每小时清理一次

export default CachePreloader; 