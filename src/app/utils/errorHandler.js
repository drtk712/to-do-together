/**
 * 统一错误处理工具
 * 提供一致的错误处理和用户友好的错误信息
 */

// 错误类型定义
export const ERROR_TYPES = {
  NETWORK: 'NETWORK_ERROR',
  AUTH: 'AUTH_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  PERMISSION: 'PERMISSION_ERROR',
  SERVER: 'SERVER_ERROR',
  CACHE: 'CACHE_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR',
};

// 错误状态码映射
const ERROR_STATUS_MAP = {
  400: { type: ERROR_TYPES.VALIDATION, message: '请求参数错误' },
  401: { type: ERROR_TYPES.AUTH, message: '认证失败，请重新登录' },
  403: { type: ERROR_TYPES.PERMISSION, message: '权限不足，无法执行此操作' },
  404: { type: ERROR_TYPES.NOT_FOUND, message: '请求的资源不存在' },
  408: { type: ERROR_TYPES.NETWORK, message: '请求超时，请检查网络连接' },
  429: { type: ERROR_TYPES.NETWORK, message: '请求过于频繁，请稍后重试' },
  500: { type: ERROR_TYPES.SERVER, message: '服务器内部错误，请稍后重试' },
  502: { type: ERROR_TYPES.SERVER, message: '服务器网关错误，请稍后重试' },
  503: { type: ERROR_TYPES.SERVER, message: '服务暂时不可用，请稍后重试' },
  504: { type: ERROR_TYPES.SERVER, message: '服务器响应超时，请稍后重试' },
};

// Appwrite 错误码映射
const APPWRITE_ERROR_MAP = {
  'user_not_found': '用户不存在',
  'user_email_already_exists': '邮箱已被注册',
  'user_password_mismatch': '密码错误',
  'user_session_not_found': '会话已过期，请重新登录',
  'document_not_found': '文档不存在',
  'collection_not_found': '集合不存在',
  'database_not_found': '数据库不存在',
  'project_not_found': '项目不存在',
  'general_rate_limit_exceeded': '请求过于频繁，请稍后重试',
};

/**
 * 创建标准化错误对象
 */
export class AppError extends Error {
  constructor(message, type = ERROR_TYPES.UNKNOWN, statusCode = null, originalError = null) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.statusCode = statusCode;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
    
    // 保持堆栈跟踪
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
  
  // 判断是否为网络错误
  isNetworkError() {
    return this.type === ERROR_TYPES.NETWORK;
  }
  
  // 判断是否为认证错误
  isAuthError() {
    return this.type === ERROR_TYPES.AUTH;
  }
  
  // 判断是否可重试
  isRetryable() {
    return [ERROR_TYPES.NETWORK, ERROR_TYPES.SERVER].includes(this.type);
  }
  
  // 获取用户友好的错误信息
  getUserMessage() {
    return this.message;
  }
  
  // 转换为JSON格式（用于日志记录）
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

/**
 * 处理API错误
 */
export const handleApiError = (error) => {
  // 只在开发环境输出详细错误信息
  if (process.env.NODE_ENV === 'development') {
    console.error('API Error:', error);
  }
  
  // 如果已经是 AppError，直接返回
  if (error instanceof AppError) {
    return error;
  }
  
  // 处理网络错误
  if (!navigator.onLine) {
    return new AppError(
      '网络连接已断开，请检查网络设置',
      ERROR_TYPES.NETWORK,
      null,
      error
    );
  }
  
  // 处理 Appwrite 错误
  if (error.type && APPWRITE_ERROR_MAP[error.type]) {
    const userMessage = APPWRITE_ERROR_MAP[error.type];
    const errorType = error.type.includes('session') ? ERROR_TYPES.AUTH : ERROR_TYPES.VALIDATION;
    return new AppError(userMessage, errorType, error.code, error);
  }
  
  // 处理 HTTP 状态码错误
  if (error.status || error.statusCode) {
    const statusCode = error.status || error.statusCode;
    const errorInfo = ERROR_STATUS_MAP[statusCode];
    
    if (errorInfo) {
      return new AppError(
        errorInfo.message,
        errorInfo.type,
        statusCode,
        error
      );
    }
  }
  
  // 处理常见错误类型
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return new AppError(
      '网络请求失败，请检查网络连接',
      ERROR_TYPES.NETWORK,
      null,
      error
    );
  }
  
  if (error.name === 'SyntaxError') {
    return new AppError(
      '数据格式错误，请联系技术支持',
      ERROR_TYPES.SERVER,
      null,
      error
    );
  }
  
  // 默认错误处理
  return new AppError(
    error.message || '操作失败，请稍后重试',
    ERROR_TYPES.UNKNOWN,
    null,
    error
  );
};

/**
 * 处理缓存错误
 */
export const handleCacheError = (error, operation = 'cache operation') => {
  // 只在开发环境输出警告信息
  if (process.env.NODE_ENV === 'development') {
    console.warn(`Cache error during ${operation}:`, error);
  }
  return new AppError(
    `缓存操作失败: ${operation}`,
    ERROR_TYPES.CACHE,
    null,
    error
  );
};

/**
 * 安全的 localStorage 操作
 */
export const safeLocalStorage = {
  getItem: (key) => {
    try {
      if (typeof window === 'undefined') return null;
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('localStorage getItem error:', error);
      return null;
    }
  },
  
  setItem: (key, value) => {
    try {
      if (typeof window === 'undefined') return false;
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn('localStorage setItem error:', error);
      return false;
    }
  },
  
  removeItem: (key) => {
    try {
      if (typeof window === 'undefined') return false;
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('localStorage removeItem error:', error);
      return false;
    }
  },
  
  clear: () => {
    try {
      if (typeof window === 'undefined') return false;
      localStorage.clear();
      return true;
    } catch (error) {
      console.warn('localStorage clear error:', error);
      return false;
    }
  },
};

/**
 * 重试机制
 */
export const withRetry = async (fn, options = {}) => {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 5000,
    backoffMultiplier = 2,
    shouldRetry = (error) => error.isRetryable && error.isRetryable(),
  } = options;
  
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = handleApiError(error);
      
      // 如果是最后一次尝试或不应该重试，抛出错误
      if (attempt === maxAttempts || !shouldRetry(lastError)) {
        throw lastError;
      }
      
      // 计算延迟时间（指数退避）
      const delay = Math.min(
        baseDelay * Math.pow(backoffMultiplier, attempt - 1),
        maxDelay
      );
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`重试第 ${attempt} 次，${delay}ms 后重试...`);
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

/**
 * 错误日志记录
 */
export const logError = (error, context = {}) => {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    error: error instanceof AppError ? error.toJSON() : {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    context,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
    url: typeof window !== 'undefined' ? window.location.href : null,
  };
  
  // 在开发环境打印详细错误信息
  if (process.env.NODE_ENV === 'development') {
    console.group('🚨 Error Log');
    console.error('Error:', error);
    console.log('Context:', context);
    console.log('Full Error Info:', errorInfo);
    console.groupEnd();
  }
  
  // 在生产环境可以发送到错误监控服务
  if (process.env.NODE_ENV === 'production') {
    // 这里可以集成错误监控服务，如 Sentry, LogRocket 等
    // sendToErrorMonitoring(errorInfo);
  }
  
  return errorInfo;
}; 