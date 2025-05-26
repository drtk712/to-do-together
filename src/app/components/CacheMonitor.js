"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { globalCache } from '../utils/cacheManager';
import { CACHE_MONITORING } from '../config/cacheConfig';

/**
 * 缓存监控组件
 * 用于开发环境下监控缓存状态和性能
 */
const CacheMonitor = ({ isVisible = false }) => {
  const [stats, setStats] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [health, setHealth] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // 更新缓存统计信息
  const updateStats = () => {
    try {
      const cacheStats = globalCache.getStats();
      const performanceMetrics = globalCache.getPerformanceMetrics();
      const healthStatus = globalCache.getHealthStatus();
      
      setStats(cacheStats);
      setMetrics(performanceMetrics);
      setHealth(healthStatus);
    } catch (error) {
      console.error('Failed to get cache stats:', error);
    }
  };

  // 自动刷新
  useEffect(() => {
    if (!isVisible || !autoRefresh) return;

    updateStats();
    const interval = setInterval(updateStats, CACHE_MONITORING.METRICS_INTERVAL);
    return () => clearInterval(interval);
  }, [isVisible, autoRefresh]);

  // 手动刷新
  const handleRefresh = () => {
    updateStats();
  };

  // 清理缓存
  const handleCleanup = () => {
    const cleaned = globalCache.cleanup();
    updateStats();
    console.log(`Cleaned ${cleaned} expired cache items`);
  };

  // 重置指标
  const handleResetMetrics = () => {
    globalCache.resetMetrics();
    updateStats();
  };

  // 获取健康状态颜色
  const getHealthColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  // 获取健康状态图标
  const getHealthIcon = (status) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'critical': return '🚨';
      default: return '❓';
    }
  };

  // 拖拽处理
  const handleDragStart = (e) => {
    setIsDragging(true);
    const clientX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
    const clientY = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY;
    
    dragStartRef.current = {
      x: clientX - position.x,
      y: clientY - position.y
    };
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;
    
    e.preventDefault();
    const clientX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
    const clientY = e.type === 'mousemove' ? e.clientY : e.touches[0].clientY;
    
    const newX = clientX - dragStartRef.current.x;
    const newY = clientY - dragStartRef.current.y;
    
    // 限制拖拽范围在视窗内
    const maxX = window.innerWidth - 300; // 组件宽度约300px
    const maxY = window.innerHeight - 200; // 组件高度约200px
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // 添加全局事件监听
  useEffect(() => {
    if (isDragging) {
      const handleMouseMove = (e) => handleDragMove(e);
      const handleMouseUp = () => handleDragEnd();
      const handleTouchMove = (e) => handleDragMove(e);
      const handleTouchEnd = () => handleDragEnd();

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, position]);

  // 初始化位置
  useEffect(() => {
    if (isVisible && position.x === 0 && position.y === 0) {
      setPosition({
        x: window.innerWidth - 320, // 距离右边20px
        y: window.innerHeight - 220  // 距离底部20px
      });
    }
  }, [isVisible]);

  if (!isVisible || !stats) return null;

  return (
    <motion.div
      ref={dragRef}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 50,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      className={`select-none ${isDragging ? 'pointer-events-none' : ''}`}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden min-w-[280px] max-w-[320px]">
        {/* 头部 */}
        <div 
          className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 cursor-grab active:cursor-grabbing flex items-center justify-between"
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          onClick={(e) => {
            // 只有在没有拖拽时才触发展开/收起
            if (!isDragging) {
              setIsExpanded(!isExpanded);
            }
          }}
        >
                                  <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                📊 缓存监控
              </span>
              {health && (
                <span className={`text-xs ${getHealthColor(health.overall)}`}>
                  {getHealthIcon(health.overall)}
                </span>
              )}
              {/* 拖拽指示器 */}
              <span className="text-xs text-gray-400 dark:text-gray-500">⋮⋮</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setAutoRefresh(!autoRefresh);
                }}
                className={`text-xs px-2 py-1 rounded ${
                  autoRefresh 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                }`}
              >
                {autoRefresh ? '自动' : '手动'}
              </button>
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                className="text-gray-500"
              >
                ▼
              </motion.div>
            </div>
        </div>

        {/* 基础统计 */}
        <div className="px-4 py-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">缓存项:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                {stats.valid}/{stats.total}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">命中率:</span>
              <span className={`ml-2 font-medium ${
                metrics?.hitRate > 0.7 ? 'text-green-600' : 
                metrics?.hitRate > 0.5 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {metrics ? `${(metrics.hitRate * 100).toFixed(1)}%` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* 详细信息 */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-200 dark:border-gray-600"
            >
              {/* 性能指标 */}
              {metrics && (
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    性能指标
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>命中: {metrics.hits}</div>
                    <div>未命中: {metrics.misses}</div>
                    <div>设置: {metrics.sets}</div>
                    <div>删除: {metrics.deletes}</div>
                    <div>驱逐: {metrics.evictions}</div>
                    <div>内存: {(metrics.memoryUsage * 100).toFixed(1)}%</div>
                  </div>
                </div>
              )}

              {/* 健康状态 */}
              {health && health.issues.length > 0 && (
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    健康状态
                  </h4>
                  <div className="space-y-1">
                    {health.issues.map((issue, index) => (
                      <div key={index} className="text-xs text-red-600 dark:text-red-400">
                        • {issue}
                      </div>
                    ))}
                  </div>
                  {health.recommendations.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        建议:
                      </div>
                      {health.recommendations.map((rec, index) => (
                        <div key={index} className="text-xs text-blue-600 dark:text-blue-400">
                          • {rec}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 操作按钮 */}
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700">
                <div className="flex space-x-2">
                  <button
                    onClick={handleRefresh}
                    className="flex-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                  >
                    刷新
                  </button>
                  <button
                    onClick={handleCleanup}
                    className="flex-1 px-3 py-1 text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 rounded hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors"
                  >
                    清理
                  </button>
                  <button
                    onClick={handleResetMetrics}
                    className="flex-1 px-3 py-1 text-xs bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                  >
                    重置
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default CacheMonitor; 