// 缓存系统集成测试
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { CacheManager } from '../../src/app/utils/cacheManager';
import { CachedTodoService } from '../../src/app/services/cachedTodoService';
import { CachedFriendService } from '../../src/app/services/cachedFriendService';

describe('缓存系统集成测试', () => {
  let cacheManager;
  let cachedTodoService;
  let cachedFriendService;

  beforeEach(() => {
    cacheManager = new CacheManager({
      maxSize: 100,
      defaultTTL: 60000, // 1分钟
      cleanupInterval: 10000 // 10秒
    });

    cachedTodoService = new CachedTodoService(cacheManager);
    cachedFriendService = new CachedFriendService(cacheManager);
  });

  afterEach(() => {
    cacheManager.clear();
  });

  describe('缓存管理器基础功能', () => {
    it('应该正确设置和获取缓存', () => {
      const key = 'test-key';
      const value = { data: 'test-data' };

      cacheManager.set(key, value);
      const retrieved = cacheManager.get(key);

      expect(retrieved).toEqual(value);
    });

    it('应该正确处理TTL过期', async () => {
      const key = 'expire-test';
      const value = { data: 'expire-data' };

      cacheManager.set(key, value, 100); // 100ms TTL

      // 立即获取应该成功
      expect(cacheManager.get(key)).toEqual(value);

      // 等待过期
      await new Promise(resolve => setTimeout(resolve, 150));

      // 过期后应该返回null
      expect(cacheManager.get(key)).toBeNull();
    });

    it('应该正确执行LRU淘汰策略', () => {
      // 设置小的缓存大小
      const smallCache = new CacheManager({ maxSize: 3 });

      // 添加3个项目
      smallCache.set('key1', 'value1');
      smallCache.set('key2', 'value2');
      smallCache.set('key3', 'value3');

      // 访问key1使其成为最近使用
      smallCache.get('key1');

      // 添加第4个项目，应该淘汰key2
      smallCache.set('key4', 'value4');

      expect(smallCache.get('key1')).toBe('value1'); // 最近使用，保留
      expect(smallCache.get('key2')).toBeNull(); // 最少使用，被淘汰
      expect(smallCache.get('key3')).toBe('value3'); // 保留
      expect(smallCache.get('key4')).toBe('value4'); // 新添加，保留
    });
  });

  describe('缓存服务集成', () => {
    it('应该正确缓存待办事项数据', async () => {
      const userId = 'user-123';
      const mockTodos = [
        { $id: '1', title: 'Test Todo 1', userId },
        { $id: '2', title: 'Test Todo 2', userId }
      ];

      // Mock基础服务
      const mockBaseService = {
        getTodos: jest.fn().mockResolvedValue(mockTodos)
      };

      cachedTodoService.baseService = mockBaseService;

      // 第一次调用应该从API获取
      const result1 = await cachedTodoService.getTodos(userId);
      expect(result1).toEqual(mockTodos);
      expect(mockBaseService.getTodos).toHaveBeenCalledTimes(1);

      // 第二次调用应该从缓存获取
      const result2 = await cachedTodoService.getTodos(userId);
      expect(result2).toEqual(mockTodos);
      expect(mockBaseService.getTodos).toHaveBeenCalledTimes(1); // 没有增加
    });

    it('应该正确处理缓存失效', async () => {
      const userId = 'user-123';
      const todoData = { title: 'New Todo', userId };

      // Mock基础服务
      const mockBaseService = {
        getTodos: jest.fn().mockResolvedValue([]),
        createTodo: jest.fn().mockResolvedValue({ $id: 'new-id', ...todoData })
      };

      cachedTodoService.baseService = mockBaseService;

      // 先获取数据建立缓存
      await cachedTodoService.getTodos(userId);

      // 创建新待办事项应该失效缓存
      await cachedTodoService.createTodo(todoData);

      // 再次获取应该重新调用API
      await cachedTodoService.getTodos(userId);

      expect(mockBaseService.getTodos).toHaveBeenCalledTimes(2);
    });
  });

  describe('缓存性能监控', () => {
    it('应该正确统计缓存命中率', () => {
      const key = 'perf-test';
      const value = 'perf-value';

      // 设置缓存
      cacheManager.set(key, value);

      // 多次获取
      cacheManager.get(key); // 命中
      cacheManager.get(key); // 命中
      cacheManager.get('non-existent'); // 未命中

      const stats = cacheManager.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.getHitRate()).toBeCloseTo(66.67, 1);
    });

    it('应该正确监控内存使用', () => {
      cacheManager.set('key1', 'value1');
      cacheManager.set('key2', 'value2');

      const stats = cacheManager.getStats();
      const memoryUsage = stats.getMemoryUsage();

      expect(memoryUsage.cacheSize).toBe(2);
      expect(memoryUsage.maxSize).toBe(100);
      expect(memoryUsage.utilizationRate).toBe(2);
    });
  });
});

// 测试工具函数
export const createMockCacheManager = (options = {}) => {
  return new CacheManager({
    maxSize: 10,
    defaultTTL: 60000,
    cleanupInterval: 10000,
    ...options
  });
};

export const waitForCacheExpiry = (ms = 100) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}; 