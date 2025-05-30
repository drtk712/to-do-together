import { NOTIFICATION_TYPE } from '../services/notificationService';

/**
 * 通知系统常量
 * 统一管理通知类型的显示样式和行为
 */

// 通知类型图标映射
export const NOTIFICATION_ICONS = {
  [NOTIFICATION_TYPE.FRIEND_REQUEST]: '👤',
  [NOTIFICATION_TYPE.FRIEND_ACCEPTED]: '✅',
  [NOTIFICATION_TYPE.FRIEND_REJECTED]: '❌', 
  [NOTIFICATION_TYPE.TODO_SHARED]: '📋',
  [NOTIFICATION_TYPE.TODO_REMINDER]: '⏰',
  [NOTIFICATION_TYPE.SYSTEM]: '🔔'
};

// 通知类型颜色样式映射
export const NOTIFICATION_COLORS = {
  [NOTIFICATION_TYPE.FRIEND_REQUEST]: {
    border: 'border-l-blue-400',
    bg: 'bg-blue-50',
    bgDark: 'dark:bg-blue-900/20',
    text: 'text-blue-600',
    textDark: 'dark:text-blue-400',
    iconBg: 'bg-blue-100',
    iconBgDark: 'dark:bg-blue-900'
  },
  [NOTIFICATION_TYPE.FRIEND_ACCEPTED]: {
    border: 'border-l-green-400',
    bg: 'bg-green-50',
    bgDark: 'dark:bg-green-900/20',
    text: 'text-green-600',
    textDark: 'dark:text-green-400',
    iconBg: 'bg-green-100',
    iconBgDark: 'dark:bg-green-900'
  },
  [NOTIFICATION_TYPE.FRIEND_REJECTED]: {
    border: 'border-l-red-400',
    bg: 'bg-red-50',
    bgDark: 'dark:bg-red-900/20',
    text: 'text-red-600',
    textDark: 'dark:text-red-400',
    iconBg: 'bg-red-100',
    iconBgDark: 'dark:bg-red-900'
  },
  [NOTIFICATION_TYPE.TODO_SHARED]: {
    border: 'border-l-purple-400',
    bg: 'bg-purple-50',
    bgDark: 'dark:bg-purple-900/20',
    text: 'text-purple-600',
    textDark: 'dark:text-purple-400',
    iconBg: 'bg-purple-100',
    iconBgDark: 'dark:bg-purple-900'
  },
  [NOTIFICATION_TYPE.TODO_REMINDER]: {
    border: 'border-l-yellow-400',
    bg: 'bg-yellow-50',
    bgDark: 'dark:bg-yellow-900/20',
    text: 'text-yellow-600',
    textDark: 'dark:text-yellow-400',
    iconBg: 'bg-yellow-100',
    iconBgDark: 'dark:bg-yellow-900'
  },
  [NOTIFICATION_TYPE.SYSTEM]: {
    border: 'border-l-gray-400',
    bg: 'bg-gray-50',
    bgDark: 'dark:bg-gray-800',
    text: 'text-gray-600',
    textDark: 'dark:text-gray-400',
    iconBg: 'bg-gray-100',
    iconBgDark: 'dark:bg-gray-700'
  }
};

// 通知类型路由映射
export const NOTIFICATION_ROUTES = {
  [NOTIFICATION_TYPE.TODO_SHARED]: '/dashboard',
  [NOTIFICATION_TYPE.FRIEND_REQUEST]: '/dashboard?tab=friends',
  [NOTIFICATION_TYPE.FRIEND_ACCEPTED]: '/dashboard?tab=friends',
  [NOTIFICATION_TYPE.FRIEND_REJECTED]: '/dashboard?tab=friends',
  [NOTIFICATION_TYPE.TODO_REMINDER]: '/dashboard',
  [NOTIFICATION_TYPE.SYSTEM]: '/notifications'
};

// 通知类型标题映射
export const NOTIFICATION_TYPE_LABELS = {
  [NOTIFICATION_TYPE.FRIEND_REQUEST]: '好友请求',
  [NOTIFICATION_TYPE.FRIEND_ACCEPTED]: '好友接受',
  [NOTIFICATION_TYPE.FRIEND_REJECTED]: '好友拒绝',
  [NOTIFICATION_TYPE.TODO_SHARED]: '待办分享',
  [NOTIFICATION_TYPE.TODO_REMINDER]: '待办提醒',
  [NOTIFICATION_TYPE.SYSTEM]: '系统通知'
};

// 通知优先级映射（用于排序）
export const NOTIFICATION_PRIORITY = {
  [NOTIFICATION_TYPE.FRIEND_REQUEST]: 3,
  [NOTIFICATION_TYPE.TODO_SHARED]: 2,
  [NOTIFICATION_TYPE.FRIEND_ACCEPTED]: 1,
  [NOTIFICATION_TYPE.TODO_REMINDER]: 1,
  [NOTIFICATION_TYPE.FRIEND_REJECTED]: 0,
  [NOTIFICATION_TYPE.SYSTEM]: 0
};

// 通知配置
export const NOTIFICATION_CONFIG = {
  // 列表显示限制
  DEFAULT_LIMIT: 50,
  BUBBLE_LIMIT: 5,
  
  // 自动清理配置
  AUTO_CLEANUP_DAYS: 30,
  
  // 轮询间隔（毫秒）
  POLL_INTERVAL: 30000,
  
  // 动画时长
  ANIMATION_DURATION: 300,
  
  // 气泡显示时长
  BUBBLE_DISPLAY_DURATION: 5000
};

/**
 * 获取通知图标
 * @param {string} type - 通知类型
 * @returns {string} 对应的图标
 */
export const getNotificationIcon = (type) => {
  return NOTIFICATION_ICONS[type] || NOTIFICATION_ICONS[NOTIFICATION_TYPE.SYSTEM];
};

/**
 * 获取通知颜色样式
 * @param {string} type - 通知类型
 * @returns {Object} 颜色样式对象
 */
export const getNotificationColors = (type) => {
  return NOTIFICATION_COLORS[type] || NOTIFICATION_COLORS[NOTIFICATION_TYPE.SYSTEM];
};

/**
 * 获取通知路由
 * @param {string} type - 通知类型
 * @param {Object} data - 通知数据（可能包含额外路由参数）
 * @returns {string} 对应的路由路径
 */
export const getNotificationRoute = (type, data = {}) => {
  const baseRoute = NOTIFICATION_ROUTES[type] || NOTIFICATION_ROUTES[NOTIFICATION_TYPE.SYSTEM];
  
  // 为特定类型添加额外参数
  if (type === NOTIFICATION_TYPE.TODO_SHARED && data.todoId) {
    return `${baseRoute}?highlight=${data.todoId}`;
  }
  
  return baseRoute;
};

/**
 * 获取通知类型标签
 * @param {string} type - 通知类型
 * @returns {string} 类型标签
 */
export const getNotificationTypeLabel = (type) => {
  return NOTIFICATION_TYPE_LABELS[type] || '未知类型';
};

/**
 * 获取通知优先级
 * @param {string} type - 通知类型
 * @returns {number} 优先级数值（越大越重要）
 */
export const getNotificationPriority = (type) => {
  return NOTIFICATION_PRIORITY[type] || 0;
};

/**
 * 构建通知样式类名
 * @param {string} type - 通知类型
 * @param {boolean} isRead - 是否已读
 * @returns {string} 样式类名字符串
 */
export const buildNotificationClasses = (type, isRead = false) => {
  const colors = getNotificationColors(type);
  const opacity = isRead ? 'opacity-60' : 'opacity-100';
  
  return [
    'border-l-4',
    colors.border,
    colors.bg,
    colors.bgDark,
    opacity,
    'transition-opacity duration-200'
  ].join(' ');
}; 