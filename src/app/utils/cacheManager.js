/**
 * 智能缓存管理器
 * 支持TTL（生存时间）、LRU（最近最少使用）策略、依赖失效等功能
 */

import { getEffectiveCacheConfig, CACHE_MONITORING } from '../config/cacheConfig';

class CacheManager {
  constructor(options = {}) {
    const config = getEffectiveCacheConfig();
    
    this.maxSize = options.maxSize || config.MAX_SIZE;
    this.defaultTTL = options.defaultTTL || config.DEFAULT_TTL;
    this.cache = new Map();
    this.dependencies = new Map(); // 依赖关系映射
    this.accessOrder = []; // LRU访问顺序
    
    // 性能监控
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      cleanups: 0,
      startTime: Date.now()
    };
    
    // 配置选项
    this.config = config;
    this.enableMetrics = CACHE_MONITORING.COLLECT_METRICS;
    this.enableLogging = CACHE_MONITORING.LOG_CACHE_OPERATIONS;
  }

  /**
   * 生成缓存键
   */
  generateKey(prefix, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    return `${prefix}${sortedParams ? `::${sortedParams}` : ''}`;
  }

  /**
   * 设置缓存
   */
  set(key, value, options = {}) {
    const ttl = options.ttl || this.defaultTTL;
    const dependencies = options.dependencies || [];
    
    const cacheItem = {
      value,
      timestamp: Date.now(),
      ttl,
      dependencies,
      accessCount: 0
    };

    // 如果缓存已满，移除最少使用的项
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this._evictLRU();
    }

    this.cache.set(key, cacheItem);
    this._updateAccessOrder(key);

    // 建立依赖关系
    dependencies.forEach(dep => {
      if (!this.dependencies.has(dep)) {
        this.dependencies.set(dep, new Set());
      }
      this.dependencies.get(dep).add(key);
    });

    this._recordMetric('sets');
    this._log('debug', `Cache set for key: ${key}, TTL: ${ttl}ms, Dependencies: [${dependencies.join(', ')}]`);

    return value;
  }

  /**
   * 获取缓存
   */
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      this._recordMetric('misses');
      this._log('debug', `Cache miss for key: ${key}`);
      return null;
    }

    // 检查是否过期
    if (this._isExpired(item)) {
      this.delete(key);
      this._recordMetric('misses');
      this._log('debug', `Cache expired for key: ${key}`);
      return null;
    }

    // 更新访问信息
    item.accessCount++;
    this._updateAccessOrder(key);
    this._recordMetric('hits');
    this._log('debug', `Cache hit for key: ${key}`);

    return item.value;
  }

  /**
   * 删除缓存
   */
  delete(key) {
    const item = this.cache.get(key);
    if (item) {
      // 清理依赖关系
      item.dependencies.forEach(dep => {
        const dependents = this.dependencies.get(dep);
        if (dependents) {
          dependents.delete(key);
          if (dependents.size === 0) {
            this.dependencies.delete(dep);
          }
        }
      });

      this.cache.delete(key);
      this._removeFromAccessOrder(key);
    }
  }

  /**
   * 根据依赖失效缓存
   */
  invalidateByDependency(dependency) {
    const dependents = this.dependencies.get(dependency);
    if (dependents) {
      const keysToDelete = Array.from(dependents);
      keysToDelete.forEach(key => this.delete(key));
    }
  }

  /**
   * 根据前缀失效缓存
   */
  invalidateByPrefix(prefix) {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.startsWith(prefix)
    );
    keysToDelete.forEach(key => this.delete(key));
  }

  /**
   * 清理过期缓存
   */
  cleanup() {
    const now = Date.now();
    const keysToDelete = [];

    for (const [key, item] of this.cache.entries()) {
      if (this._isExpired(item)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.delete(key));
    return keysToDelete.length;
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    const now = Date.now();
    let expired = 0;
    let total = this.cache.size;

    for (const item of this.cache.values()) {
      if (this._isExpired(item)) {
        expired++;
      }
    }

    return {
      total,
      expired,
      valid: total - expired,
      dependencies: this.dependencies.size,
      maxSize: this.maxSize
    };
  }

  /**
   * 清空所有缓存
   */
  clear() {
    this.cache.clear();
    this.dependencies.clear();
    this.accessOrder = [];
  }

  /**
   * 检查缓存项是否过期
   */
  _isExpired(item) {
    return Date.now() - item.timestamp > item.ttl;
  }

  /**
   * 更新LRU访问顺序
   */
  _updateAccessOrder(key) {
    this._removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }

  /**
   * 从访问顺序中移除
   */
  _removeFromAccessOrder(key) {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * 移除最少使用的缓存项
   */
  _evictLRU() {
    if (this.accessOrder.length > 0) {
      const lruKey = this.accessOrder[0];
      this.delete(lruKey);
      this._recordMetric('evictions');
      this._log('info', `LRU evicted key: ${lruKey}`);
    }
  }

  /**
   * 记录性能指标
   */
  _recordMetric(type) {
    if (this.enableMetrics && this.metrics[type] !== undefined) {
      this.metrics[type]++;
    }
  }

  /**
   * 日志记录
   */
  _log(level, message) {
    if (this.enableLogging) {
      console[level](`[Cache] ${message}`);
    }
  }

  /**
   * 获取详细的性能指标
   */
  getPerformanceMetrics() {
    const runtime = Date.now() - this.metrics.startTime;
    const total = this.metrics.hits + this.metrics.misses;
    const hitRate = total > 0 ? this.metrics.hits / total : 0;
    const memoryUsage = this.cache.size / this.maxSize;

    return {
      ...this.metrics,
      runtime,
      hitRate,
      memoryUsage,
      averageAccessTime: runtime / Math.max(total, 1),
      cacheEfficiency: hitRate * (1 - memoryUsage) // 综合效率指标
    };
  }

  /**
   * 重置性能指标
   */
  resetMetrics() {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      cleanups: 0,
      startTime: Date.now()
    };
  }

  /**
   * 获取缓存健康状态
   */
  getHealthStatus() {
    const metrics = this.getPerformanceMetrics();
    const config = this.config;

    const status = {
      overall: 'healthy',
      issues: [],
      recommendations: []
    };

    // 检查命中率
    if (metrics.hitRate < config.HIT_RATE_CRITICAL_THRESHOLD) {
      status.overall = 'critical';
      status.issues.push(`命中率过低: ${(metrics.hitRate * 100).toFixed(1)}%`);
      status.recommendations.push('考虑增加缓存时间或优化缓存策略');
    } else if (metrics.hitRate < config.HIT_RATE_WARNING_THRESHOLD) {
      status.overall = 'warning';
      status.issues.push(`命中率偏低: ${(metrics.hitRate * 100).toFixed(1)}%`);
      status.recommendations.push('检查缓存失效策略是否过于激进');
    }

    // 检查内存使用
    if (metrics.memoryUsage > config.MEMORY_CRITICAL_THRESHOLD) {
      status.overall = 'critical';
      status.issues.push(`内存使用率过高: ${(metrics.memoryUsage * 100).toFixed(1)}%`);
      status.recommendations.push('考虑增加缓存大小或减少缓存时间');
    } else if (metrics.memoryUsage > config.MEMORY_WARNING_THRESHOLD) {
      if (status.overall !== 'critical') status.overall = 'warning';
      status.issues.push(`内存使用率偏高: ${(metrics.memoryUsage * 100).toFixed(1)}%`);
      status.recommendations.push('监控内存使用情况');
    }

    // 检查驱逐频率
    const evictionRate = metrics.evictions / Math.max(metrics.sets, 1);
    if (evictionRate > 0.1) { // 超过10%的设置操作导致驱逐
      if (status.overall !== 'critical') status.overall = 'warning';
      status.issues.push(`缓存驱逐频率过高: ${(evictionRate * 100).toFixed(1)}%`);
      status.recommendations.push('考虑增加缓存大小');
    }

    return status;
  }
}

// 创建全局缓存实例
export const globalCache = new CacheManager({
  maxSize: 200,
  defaultTTL: 5 * 60 * 1000 // 5分钟
});

// 缓存键前缀常量
export const CACHE_KEYS = {
  USER: 'user',
  FRIENDS: 'friends',
  FRIEND_REQUESTS: 'friend_requests',
  TODOS: 'todos',
  NOTIFICATIONS: 'notifications'
};

// 缓存依赖常量
export const CACHE_DEPENDENCIES = {
  USER_DATA: 'user_data',
  FRIENDSHIP_DATA: 'friendship_data',
  TODO_DATA: 'todo_data'
};

/**
 * 缓存装饰器工厂
 */
export function withCache(cacheKey, options = {}) {
  return function(target, propertyName, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args) {
      const key = typeof cacheKey === 'function' 
        ? cacheKey(...args) 
        : globalCache.generateKey(cacheKey, { args: JSON.stringify(args) });

      // 尝试从缓存获取
      const cached = globalCache.get(key);
      if (cached !== null) {
        return cached;
      }

      // 执行原方法
      const result = await originalMethod.apply(this, args);

      // 缓存结果
      if (result !== null && result !== undefined) {
        globalCache.set(key, result, options);
      }

      return result;
    };

    return descriptor;
  };
}

/**
 * 自动清理过期缓存
 */
let cleanupInterval;

export function startCacheCleanup(intervalMs = 60000) { // 默认1分钟清理一次
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }

  cleanupInterval = setInterval(() => {
    const cleaned = globalCache.cleanup();
    if (cleaned > 0) {
      console.log(`[Cache] Cleaned ${cleaned} expired items`);
    }
  }, intervalMs);
}

export function stopCacheCleanup() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

// 在浏览器环境中自动启动清理
if (typeof window !== 'undefined') {
  startCacheCleanup();
}

export default CacheManager; 