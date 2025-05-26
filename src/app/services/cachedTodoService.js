import { todoService } from './todoService';
import { globalCache } from '../utils/cacheManager';
import { CACHE_KEYS, CACHE_DEPENDENCIES, CACHE_TTL, generateCacheKey, generateDependencies } from '../config/cacheConfig';
import { logError } from '../utils/errorHandler';

/**
 * 带缓存功能的待办事项服务
 * 包装原有的todoService，添加智能缓存机制
 */
export const cachedTodoService = {
  /**
   * 获取待办事项列表（带缓存）
   */
  async getTodos(userId, filters = {}) {
    if (!userId) {
      throw new Error('用户ID是必需的');
    }

    const cacheKey = generateCacheKey(CACHE_KEYS.TODOS, { 
      userId, 
      ...filters 
    });
    
    try {
      // 尝试从缓存获取
      const cached = globalCache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // 从服务获取数据
      const todos = await todoService.getTodos(userId, filters);
      
      // 缓存结果
      globalCache.set(cacheKey, todos, {
        ttl: CACHE_TTL.TODOS,
        dependencies: generateDependencies(CACHE_DEPENDENCIES.TODO_DATA, userId)
      });

      return todos;
    } catch (error) {
      logError(error, { context: 'cachedTodoService.getTodos', userId, filters });
      throw error;
    }
  },

  /**
   * 获取共享的待办事项（带缓存）
   */
  async getSharedTodos(userId, filters = {}) {
    if (!userId) {
      throw new Error('用户ID是必需的');
    }

    const cacheKey = globalCache.generateKey(CACHE_KEYS.TODOS, { 
      userId, 
      type: 'shared',
      ...filters 
    });
    
    try {
      const cached = globalCache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      const todos = await todoService.getSharedTodos(userId, filters);
      
      globalCache.set(cacheKey, todos, {
        ttl: 3 * 60 * 1000, // 3分钟TTL（共享待办事项变化相对较少）
        dependencies: [CACHE_DEPENDENCIES.TODO_DATA, `user_${userId}`]
      });

      return todos;
    } catch (error) {
      logError(error, { context: 'cachedTodoService.getSharedTodos', userId, filters });
      throw error;
    }
  },

  /**
   * 根据ID获取待办事项（带缓存）
   */
  async getTodoById(todoId, userId) {
    if (!todoId || !userId) {
      throw new Error('待办事项ID和用户ID都是必需的');
    }

    const cacheKey = globalCache.generateKey(CACHE_KEYS.TODOS, { 
      todoId, 
      userId 
    });
    
    try {
      const cached = globalCache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      const todo = await todoService.getTodoById(todoId, userId);
      
      if (todo) {
        globalCache.set(cacheKey, todo, {
          ttl: 5 * 60 * 1000, // 5分钟TTL
          dependencies: [CACHE_DEPENDENCIES.TODO_DATA, `user_${userId}`, `todo_${todoId}`]
        });
      }

      return todo;
    } catch (error) {
      logError(error, { context: 'cachedTodoService.getTodoById', todoId, userId });
      throw error;
    }
  },

  /**
   * 创建待办事项（会失效相关缓存）
   */
  async createTodo(todoData) {
    try {
      const result = await todoService.createTodo(todoData);
      
      // 失效相关缓存
      this.invalidateTodoCache(todoData.userId);
      
      return result;
    } catch (error) {
      logError(error, { context: 'cachedTodoService.createTodo', todoData });
      throw error;
    }
  },

  /**
   * 更新待办事项（会失效相关缓存）
   */
  async updateTodo(todoId, updates, userId) {
    try {
      const result = await todoService.updateTodo(todoId, updates, userId);
      
      // 失效相关缓存
      this.invalidateTodoCache(userId, todoId);
      
      return result;
    } catch (error) {
      logError(error, { context: 'cachedTodoService.updateTodo', todoId, updates, userId });
      throw error;
    }
  },

  /**
   * 删除待办事项（会失效相关缓存）
   */
  async deleteTodo(todoId, userId) {
    try {
      const result = await todoService.deleteTodo(todoId, userId);
      
      // 失效相关缓存
      this.invalidateTodoCache(userId, todoId);
      
      return result;
    } catch (error) {
      logError(error, { context: 'cachedTodoService.deleteTodo', todoId, userId });
      throw error;
    }
  },

  /**
   * 切换待办事项完成状态（会失效相关缓存）
   */
  async toggleTodoComplete(todoId, userId) {
    try {
      // 直接调用 todoService 的 toggleTodoComplete 方法
      // 该方法已经修复，会自动获取当前状态并切换
      const result = await todoService.toggleTodoComplete(todoId, userId);
      
      // 失效相关缓存
      this.invalidateTodoCache(userId, todoId);
      
      return result;
    } catch (error) {
      logError(error, { context: 'cachedTodoService.toggleTodoComplete', todoId, userId });
      throw error;
    }
  },

  /**
   * 分享待办事项（会失效相关缓存）
   */
  async shareTodo(todoId, friendIds, userId) {
    try {
      const result = await todoService.shareTodo(todoId, friendIds, userId);
      
      // 失效相关缓存
      this.invalidateTodoCache(userId, todoId);
      
      // 失效被分享用户的缓存
      friendIds.forEach(friendId => {
        this.invalidateTodoCache(friendId);
      });
      
      return result;
    } catch (error) {
      logError(error, { context: 'cachedTodoService.shareTodo', todoId, friendIds, userId });
      throw error;
    }
  },

  /**
   * 取消分享待办事项（会失效相关缓存）
   */
  async unshareTodo(todoId, friendIds, userId) {
    try {
      const result = await todoService.unshareTodo(todoId, friendIds, userId);
      
      // 失效相关缓存
      this.invalidateTodoCache(userId, todoId);
      
      // 失效被取消分享用户的缓存
      friendIds.forEach(friendId => {
        this.invalidateTodoCache(friendId);
      });
      
      return result;
    } catch (error) {
      logError(error, { context: 'cachedTodoService.unshareTodo', todoId, friendIds, userId });
      throw error;
    }
  },

  /**
   * 获取待办事项统计信息（带缓存）
   */
  async getTodoStats(userId) {
    if (!userId) {
      throw new Error('用户ID是必需的');
    }

    const cacheKey = globalCache.generateKey('todo_stats', { userId });
    
    try {
      const cached = globalCache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      const stats = await todoService.getTodoStats(userId);
      
      globalCache.set(cacheKey, stats, {
        ttl: 1 * 60 * 1000, // 1分钟TTL（统计信息需要较新）
        dependencies: [CACHE_DEPENDENCIES.TODO_DATA, `user_${userId}`]
      });

      return stats;
    } catch (error) {
      logError(error, { context: 'cachedTodoService.getTodoStats', userId });
      throw error;
    }
  },

  /**
   * 搜索待办事项（带缓存）
   */
  async searchTodos(userId, query, filters = {}) {
    if (!userId || !query) {
      throw new Error('用户ID和搜索查询都是必需的');
    }

    const cacheKey = globalCache.generateKey('todo_search', { 
      userId, 
      query: query.toLowerCase(),
      ...filters 
    });
    
    try {
      const cached = globalCache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      const results = await todoService.searchTodos(userId, query, filters);
      
      globalCache.set(cacheKey, results, {
        ttl: 3 * 60 * 1000, // 3分钟TTL
        dependencies: [CACHE_DEPENDENCIES.TODO_DATA, `user_${userId}`]
      });

      return results;
    } catch (error) {
      logError(error, { context: 'cachedTodoService.searchTodos', userId, query, filters });
      throw error;
    }
  },

  /**
   * 失效待办事项相关缓存
   */
  invalidateTodoCache(userId, todoId = null) {
    // 失效用户相关的所有缓存
    globalCache.invalidateByDependency(`user_${userId}`);
    
    if (todoId) {
      globalCache.invalidateByDependency(`todo_${todoId}`);
    }
    
    // 失效待办事项数据
    globalCache.invalidateByDependency(CACHE_DEPENDENCIES.TODO_DATA);
  },

  /**
   * 批量失效多个用户的缓存
   */
  invalidateMultipleUserCaches(userIds) {
    userIds.forEach(userId => {
      this.invalidateTodoCache(userId);
    });
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