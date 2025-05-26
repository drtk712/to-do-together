/**
 * 全局缓存配置
 * 统一管理所有缓存相关的配置和常量
 */

// 缓存键前缀
export const CACHE_KEYS = {
  // 待办事项相关
  TODOS: 'todos',
  TODO_STATS: 'todo_stats',
  SHARED_TODOS: 'shared_todos',
  TODO_SEARCH: 'todo_search',
  
  // 好友相关
  FRIENDS: 'friends',
  FRIEND_REQUESTS: 'friend_requests',
  SENT_REQUESTS: 'sent_requests',
  FRIEND_SEARCH: 'friend_search',
  
  // 用户相关
  USER_PROFILE: 'user_profile',
  USER_SEARCH: 'user_search',
  
  // 通知相关
  NOTIFICATIONS: 'notifications',
  NOTIFICATION_COUNT: 'notification_count'
};

// 缓存依赖关系
export const CACHE_DEPENDENCIES = {
  // 数据类型依赖
  TODO_DATA: 'todo_data',
  FRIEND_DATA: 'friend_data',
  USER_DATA: 'user_data',
  NOTIFICATION_DATA: 'notification_data',
  
  // 用户特定依赖
  USER_PREFIX: 'user_',
  TODO_PREFIX: 'todo_',
  FRIEND_PREFIX: 'friend_',
  
  // 操作类型依赖
  CREATE_TODO: 'create_todo',
  UPDATE_TODO: 'update_todo',
  DELETE_TODO: 'delete_todo',
  SHARE_TODO: 'share_todo',
  
  ADD_FRIEND: 'add_friend',
  REMOVE_FRIEND: 'remove_friend',
  ACCEPT_FRIEND: 'accept_friend',
  REJECT_FRIEND: 'reject_friend'
};

// TTL配置（毫秒）
export const CACHE_TTL = {
  // 短期缓存（1-2分钟）- 频繁变化的数据
  SHORT: 1 * 60 * 1000,
  TODOS: 2 * 60 * 1000,
  NOTIFICATIONS: 1 * 60 * 1000,
  
  // 中期缓存（3-5分钟）- 中等变化频率的数据
  MEDIUM: 3 * 60 * 1000,
  FRIENDS: 3 * 60 * 1000,
  SHARED_TODOS: 3 * 60 * 1000,
  
  // 长期缓存（5-10分钟）- 较少变化的数据
  LONG: 5 * 60 * 1000,
  USER_PROFILE: 10 * 60 * 1000,
  TODO_STATS: 5 * 60 * 1000,
  
  // 搜索缓存（较短）
  SEARCH: 30 * 1000, // 30秒
  
  // 计数缓存（中等）
  COUNT: 2 * 60 * 1000
};

// 缓存大小限制
export const CACHE_LIMITS = {
  // 全局缓存管理器配置
  MAX_SIZE: 200,
  DEFAULT_TTL: CACHE_TTL.MEDIUM,
  
  // 各模块缓存大小限制
  TODO_CACHE_SIZE: 50,
  FRIEND_CACHE_SIZE: 30,
  USER_CACHE_SIZE: 20,
  NOTIFICATION_CACHE_SIZE: 20,
  SEARCH_CACHE_SIZE: 30
};

// 缓存策略配置
export const CACHE_STRATEGIES = {
  // LRU策略配置
  LRU_ENABLED: true,
  
  // 自动清理配置
  AUTO_CLEANUP_INTERVAL: 60 * 1000, // 1分钟
  CLEANUP_THRESHOLD: 0.8, // 当缓存使用率超过80%时触发清理
  
  // 预加载配置
  PRELOAD_ENABLED: true,
  PRELOAD_DELAY: 100, // 预加载延迟（毫秒）
  
  // 乐观更新配置
  OPTIMISTIC_UPDATE_ENABLED: true,
  ROLLBACK_ON_ERROR: true,
  
  // 批量操作配置
  BATCH_SIZE: 10,
  BATCH_DELAY: 50 // 批量操作延迟（毫秒）
};

// 缓存性能监控配置
export const CACHE_MONITORING = {
  // 性能指标收集
  COLLECT_METRICS: true,
  METRICS_INTERVAL: 30 * 1000, // 30秒
  
  // 命中率阈值
  HIT_RATE_WARNING_THRESHOLD: 0.7, // 命中率低于70%时警告
  HIT_RATE_CRITICAL_THRESHOLD: 0.5, // 命中率低于50%时严重警告
  
  // 内存使用阈值
  MEMORY_WARNING_THRESHOLD: 0.8, // 内存使用率超过80%时警告
  MEMORY_CRITICAL_THRESHOLD: 0.9, // 内存使用率超过90%时严重警告
  
  // 日志配置
  LOG_CACHE_OPERATIONS: process.env.NODE_ENV === 'development',
  LOG_PERFORMANCE_METRICS: process.env.NODE_ENV === 'development'
};

// 缓存失效策略
export const CACHE_INVALIDATION = {
  // 级联失效配置
  CASCADE_INVALIDATION: true,
  
  // 智能失效配置
  SMART_INVALIDATION: true,
  
  // 失效延迟（避免频繁失效）
  INVALIDATION_DEBOUNCE: 100, // 100毫秒
  
  // 批量失效配置
  BATCH_INVALIDATION: true,
  BATCH_INVALIDATION_DELAY: 50 // 50毫秒
};

// 开发环境特殊配置
export const DEV_CONFIG = {
  // 开发环境下的缓存配置
  ENABLE_CACHE_DEBUG: process.env.NODE_ENV === 'development',
  CACHE_DEBUG_LEVEL: 'info', // 'debug', 'info', 'warn', 'error'
  
  // 开发环境下的TTL（更短，便于测试）
  DEV_TTL_MULTIPLIER: process.env.NODE_ENV === 'development' ? 0.5 : 1,
  
  // 开发环境下的缓存大小（更小，便于测试）
  DEV_SIZE_MULTIPLIER: process.env.NODE_ENV === 'development' ? 0.5 : 1
};

// 导出应用于开发环境的配置
export const getEffectiveCacheConfig = () => {
  const isDev = process.env.NODE_ENV === 'development';
  
  return {
    ...CACHE_LIMITS,
    ...CACHE_STRATEGIES,
    ...CACHE_MONITORING,
    ...CACHE_INVALIDATION,
    
    // 应用开发环境调整
    MAX_SIZE: Math.floor(CACHE_LIMITS.MAX_SIZE * (isDev ? DEV_CONFIG.DEV_SIZE_MULTIPLIER : 1)),
    DEFAULT_TTL: Math.floor(CACHE_LIMITS.DEFAULT_TTL * (isDev ? DEV_CONFIG.DEV_TTL_MULTIPLIER : 1)),
    
    // TTL配置应用开发环境调整
    TTL: Object.fromEntries(
      Object.entries(CACHE_TTL).map(([key, value]) => [
        key,
        Math.floor(value * (isDev ? DEV_CONFIG.DEV_TTL_MULTIPLIER : 1))
      ])
    )
  };
};

// 缓存键生成辅助函数
export const generateCacheKey = (prefix, params = {}) => {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|');
  return `${prefix}${sortedParams ? `::${sortedParams}` : ''}`;
};

// 依赖关系生成辅助函数
export const generateDependencies = (baseType, userId, entityId = null) => {
  const deps = [baseType];
  
  if (userId) {
    deps.push(`${CACHE_DEPENDENCIES.USER_PREFIX}${userId}`);
  }
  
  if (entityId) {
    deps.push(`${baseType}_${entityId}`);
  }
  
  return deps;
};

/**
 * 缓存策略配置
 * 定义不同数据类型的缓存时间和策略
 */

export const CACHE_STRATEGIES_OLD = {
  // 用户数据缓存策略
  USER: {
    // 用户基本信息 - 相对稳定，缓存时间较长
    PROFILE: {
      ttl: 15 * 60 * 1000, // 15分钟
      description: '用户基本信息'
    },
    // 用户搜索结果 - 包含好友关系状态，需要定期更新
    SEARCH: {
      ttl: 10 * 60 * 1000, // 10分钟
      description: '用户搜索结果'
    }
  },

  // 好友数据缓存策略
  FRIENDS: {
    // 好友列表 - 变化不频繁，但需要及时更新
    LIST: {
      ttl: 3 * 60 * 1000, // 3分钟
      description: '好友列表'
    },
    // 好友请求 - 变化较频繁，缓存时间较短
    REQUESTS: {
      ttl: 2 * 60 * 1000, // 2分钟
      description: '好友请求'
    },
    // 好友关系状态 - 用于快速检查，缓存时间中等
    STATUS: {
      ttl: 5 * 60 * 1000, // 5分钟
      description: '好友关系状态'
    }
  },

  // 待办事项数据缓存策略
  TODOS: {
    // 待办事项列表 - 变化频繁，缓存时间较短
    LIST: {
      ttl: 2 * 60 * 1000, // 2分钟
      description: '待办事项列表'
    },
    // 共享待办事项 - 变化相对较少
    SHARED: {
      ttl: 3 * 60 * 1000, // 3分钟
      description: '共享待办事项'
    },
    // 单个待办事项详情 - 缓存时间较长
    DETAIL: {
      ttl: 5 * 60 * 1000, // 5分钟
      description: '待办事项详情'
    },
    // 统计信息 - 需要实时性，缓存时间很短
    STATS: {
      ttl: 1 * 60 * 1000, // 1分钟
      description: '统计信息'
    },
    // 搜索结果 - 缓存时间中等
    SEARCH: {
      ttl: 3 * 60 * 1000, // 3分钟
      description: '搜索结果'
    }
  },

  // 通知数据缓存策略
  NOTIFICATIONS: {
    // 通知列表 - 需要及时更新
    LIST: {
      ttl: 1 * 60 * 1000, // 1分钟
      description: '通知列表'
    },
    // 未读通知数量 - 需要实时性
    UNREAD_COUNT: {
      ttl: 30 * 1000, // 30秒
      description: '未读通知数量'
    }
  }
};

/**
 * 缓存失效策略
 * 定义什么操作会导致哪些缓存失效
 */
export const CACHE_INVALIDATION_RULES = {
  // 用户操作导致的缓存失效
  USER_ACTIONS: {
    // 更新用户信息
    UPDATE_PROFILE: ['user_data'],
    // 用户登出
    LOGOUT: ['user_data', 'friendship_data', 'todo_data']
  },

  // 好友操作导致的缓存失效
  FRIEND_ACTIONS: {
    // 发送好友请求
    SEND_REQUEST: ['friendship_data', 'user_search'],
    // 接受好友请求
    ACCEPT_REQUEST: ['friendship_data'],
    // 拒绝好友请求
    REJECT_REQUEST: ['friendship_data'],
    // 删除好友
    REMOVE_FRIEND: ['friendship_data'],
    // 屏蔽用户
    BLOCK_USER: ['friendship_data']
  },

  // 待办事项操作导致的缓存失效
  TODO_ACTIONS: {
    // 创建待办事项
    CREATE: ['todo_data'],
    // 更新待办事项
    UPDATE: ['todo_data'],
    // 删除待办事项
    DELETE: ['todo_data'],
    // 切换完成状态
    TOGGLE_COMPLETE: ['todo_data'],
    // 分享待办事项
    SHARE: ['todo_data'],
    // 取消分享
    UNSHARE: ['todo_data']
  }
};

/**
 * 缓存预热策略
 * 定义应用启动时需要预加载的数据
 */
export const CACHE_PRELOAD_STRATEGIES = {
  // 用户登录后预加载
  ON_LOGIN: [
    'friends_list',
    'pending_requests',
    'todo_stats'
  ],
  
  // 进入特定页面时预加载
  ON_PAGE_ENTER: {
    FRIENDS_PAGE: [
      'friends_list',
      'pending_requests',
      'sent_requests'
    ],
    TODOS_PAGE: [
      'todos_list',
      'shared_todos',
      'todo_stats'
    ]
  }
};

/**
 * 缓存性能配置
 */
export const CACHE_PERFORMANCE_CONFIG = {
  // 最大缓存条目数
  MAX_CACHE_SIZE: 200,
  
  // 自动清理间隔（毫秒）
  CLEANUP_INTERVAL: 60 * 1000, // 1分钟
  
  // 批量操作阈值
  BATCH_THRESHOLD: 10,
  
  // 缓存命中率警告阈值
  HIT_RATE_WARNING_THRESHOLD: 70, // 70%以下发出警告
  
  // 内存使用警告阈值（KB）
  MEMORY_WARNING_THRESHOLD: 1024 // 1MB
};

/**
 * 开发环境缓存配置
 */
export const DEV_CACHE_CONFIG = {
  // 是否启用缓存监控
  ENABLE_MONITOR: true,
  
  // 是否在控制台输出缓存操作日志
  ENABLE_LOGGING: true,
  
  // 是否启用缓存性能分析
  ENABLE_PERFORMANCE_ANALYSIS: true,
  
  // 监控更新间隔（毫秒）
  MONITOR_UPDATE_INTERVAL: 2000 // 2秒
};

/**
 * 生产环境缓存配置
 */
export const PROD_CACHE_CONFIG = {
  // 是否启用缓存监控
  ENABLE_MONITOR: false,
  
  // 是否在控制台输出缓存操作日志
  ENABLE_LOGGING: false,
  
  // 是否启用缓存性能分析
  ENABLE_PERFORMANCE_ANALYSIS: false,
  
  // 更激进的清理策略
  CLEANUP_INTERVAL: 30 * 1000 // 30秒
};

/**
 * 获取当前环境的缓存配置
 */
export function getCurrentCacheConfig() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  return isDevelopment ? DEV_CACHE_CONFIG : PROD_CACHE_CONFIG;
}

/**
 * 根据数据类型获取缓存策略
 */
export function getCacheStrategy(category, type) {
  return CACHE_STRATEGIES_OLD[category]?.[type] || {
    ttl: 5 * 60 * 1000, // 默认5分钟
    description: '默认缓存策略'
  };
}

/**
 * 获取缓存失效规则
 */
export function getInvalidationRule(action) {
  // 遍历所有规则类别
  for (const category of Object.values(CACHE_INVALIDATION_RULES)) {
    if (category[action]) {
      return category[action];
    }
  }
  return [];
} 