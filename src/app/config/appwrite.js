/**
 * Appwrite 客户端配置
 * 专为 Next.js 客户端环境设计
 */

// 直接从环境变量读取配置
export const APPWRITE_CONFIG = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '',
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '',
  collections: {
    todos: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_COLLECTION_TODOS_ID || '',
    users: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_COLLECTION_USERS_ID || '',
    friendships: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_COLLECTION_FRIENDSHIPS_ID || '',
    notifications: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_COLLECTION_NOTIFICATIONS_ID || '',
  },
  storageId: process.env.NEXT_PUBLIC_APPWRITE_STORAGE_ID || '',
};

// 应用配置
export const APP_CONFIG = {
  cache: {
    todoExpiry: 5 * 60 * 1000, // 5分钟
    maxCacheSize: 1000,
    batchSize: 50,
  },
  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedImageTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  },
  performance: {
    debounceDelay: 300,
    throttleDelay: 100,
    longPressDelay: 1000,
    swipeThreshold: 60,
    maxSwipeDistance: 120,
  },
  retry: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 5000,
  },
};

// 简单的配置检查
export const isConfigured = () => {
  return !!(APPWRITE_CONFIG.endpoint && 
           APPWRITE_CONFIG.projectId && 
           APPWRITE_CONFIG.databaseId);
};

// 开发环境配置检查（仅在客户端）
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    console.group('🔧 Appwrite 配置状态');
    console.log('配置完整:', isConfigured() ? '✅ 是' : '❌ 否');
    console.log('端点:', APPWRITE_CONFIG.endpoint);
    console.log('项目ID:', APPWRITE_CONFIG.projectId || '❌ 未设置');
    console.log('数据库ID:', APPWRITE_CONFIG.databaseId || '❌ 未设置');
    
    if (!isConfigured()) {
      console.warn('⚠️ 配置不完整，请检查 .env.local 文件');
      console.log('需要的环境变量:');
      console.log('- NEXT_PUBLIC_APPWRITE_ENDPOINT');
      console.log('- NEXT_PUBLIC_APPWRITE_PROJECT_ID');
      console.log('- NEXT_PUBLIC_APPWRITE_DATABASE_ID');
      console.log('- NEXT_PUBLIC_APPWRITE_DATABASE_COLLECTION_*_ID');
    }
    console.groupEnd();
  }, 100);
} 