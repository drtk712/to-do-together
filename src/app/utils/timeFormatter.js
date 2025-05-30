/**
 * 时间格式化工具函数
 * 统一处理通知系统中的时间显示格式
 */

/**
 * 格式化相对时间
 * @param {string|Date} timestamp - 时间戳
 * @returns {string} 格式化后的相对时间字符串
 */
export const formatRelativeTime = (timestamp) => {
  try {
    const now = Date.now();
    const notificationTime = new Date(timestamp).getTime();
    
    // 验证时间戳有效性
    if (isNaN(notificationTime)) {
      return '时间未知';
    }
    
    const diff = now - notificationTime;
    
    // 处理未来时间
    if (diff < 0) {
      return '刚刚';
    }
    
    // 时间间隔常量（毫秒）
    const MINUTE = 60 * 1000;
    const HOUR = 60 * MINUTE;
    const DAY = 24 * HOUR;
    const WEEK = 7 * DAY;
    const MONTH = 30 * DAY;
    const YEAR = 365 * DAY;
    
    if (diff < MINUTE) {
      return '刚刚';
    } else if (diff < HOUR) {
      const minutes = Math.floor(diff / MINUTE);
      return `${minutes}分钟前`;
    } else if (diff < DAY) {
      const hours = Math.floor(diff / HOUR);
      return `${hours}小时前`;
    } else if (diff < WEEK) {
      const days = Math.floor(diff / DAY);
      return `${days}天前`;
    } else if (diff < MONTH) {
      const weeks = Math.floor(diff / WEEK);
      return `${weeks}周前`;
    } else if (diff < YEAR) {
      const months = Math.floor(diff / MONTH);
      return `${months}个月前`;
    } else {
      const years = Math.floor(diff / YEAR);
      return `${years}年前`;
    }
  } catch (error) {
    console.error('Time formatting error:', error);
    return '时间未知';
  }
};

/**
 * 格式化绝对时间
 * @param {string|Date} timestamp - 时间戳
 * @param {Object} options - 格式化选项
 * @returns {string} 格式化后的绝对时间字符串
 */
export const formatAbsoluteTime = (timestamp, options = {}) => {
  try {
    const date = new Date(timestamp);
    
    if (isNaN(date.getTime())) {
      return '时间未知';
    }
    
    const defaultOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      ...options
    };
    
    return date.toLocaleString('zh-CN', defaultOptions);
  } catch (error) {
    console.error('Absolute time formatting error:', error);
    return '时间未知';
  }
};

/**
 * 格式化时间范围文本
 * @param {string|Date} startTime - 开始时间
 * @param {string|Date} endTime - 结束时间
 * @returns {string} 时间范围文本
 */
export const formatTimeRange = (startTime, endTime) => {
  try {
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return '时间范围未知';
    }
    
    const isSameDay = start.toDateString() === end.toDateString();
    
    if (isSameDay) {
      return `${formatAbsoluteTime(start, { 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
      })} - ${formatAbsoluteTime(end, { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
    } else {
      return `${formatAbsoluteTime(start)} - ${formatAbsoluteTime(end)}`;
    }
  } catch (error) {
    console.error('Time range formatting error:', error);
    return '时间范围未知';
  }
};

/**
 * 判断是否为今天
 * @param {string|Date} timestamp - 时间戳
 * @returns {boolean} 是否为今天
 */
export const isToday = (timestamp) => {
  try {
    const date = new Date(timestamp);
    const today = new Date();
    
    return date.toDateString() === today.toDateString();
  } catch (error) {
    return false;
  }
};

/**
 * 判断是否为昨天
 * @param {string|Date} timestamp - 时间戳
 * @returns {boolean} 是否为昨天
 */
export const isYesterday = (timestamp) => {
  try {
    const date = new Date(timestamp);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    return date.toDateString() === yesterday.toDateString();
  } catch (error) {
    return false;
  }
};

/**
 * 智能时间格式化
 * 根据时间距离选择最合适的显示格式
 * @param {string|Date} timestamp - 时间戳
 * @returns {string} 智能格式化后的时间字符串
 */
export const formatSmartTime = (timestamp) => {
  try {
    if (isToday(timestamp)) {
      return formatAbsoluteTime(timestamp, { hour: '2-digit', minute: '2-digit' });
    } else if (isYesterday(timestamp)) {
      return '昨天 ' + formatAbsoluteTime(timestamp, { hour: '2-digit', minute: '2-digit' });
    } else {
      const now = Date.now();
      const time = new Date(timestamp).getTime();
      const diff = now - time;
      const WEEK = 7 * 24 * 60 * 60 * 1000;
      
      if (diff < WEEK) {
        return formatRelativeTime(timestamp);
      } else {
        return formatAbsoluteTime(timestamp, { 
          month: '2-digit', 
          day: '2-digit',
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
    }
  } catch (error) {
    console.error('Smart time formatting error:', error);
    return formatRelativeTime(timestamp);
  }
}; 