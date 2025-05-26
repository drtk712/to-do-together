/**
 * 性能监控工具
 * 用于监控组件重构后的性能指标
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.isEnabled = process.env.NODE_ENV === 'development';
  }

  // 开始测量性能
  startMeasure(name) {
    if (!this.isEnabled) return;
    
    const startTime = performance.now();
    this.metrics.set(name, {
      startTime,
      endTime: null,
      duration: null,
      memory: this.getMemoryUsage()
    });
  }

  // 结束测量
  endMeasure(name) {
    if (!this.isEnabled) return;
    
    const metric = this.metrics.get(name);
    if (!metric) return;

    const endTime = performance.now();
    metric.endTime = endTime;
    metric.duration = endTime - metric.startTime;
    metric.memoryAfter = this.getMemoryUsage();
    metric.memoryDelta = metric.memoryAfter - metric.memory;

    this.logMetric(name, metric);
    return metric;
  }

  // 获取内存使用情况
  getMemoryUsage() {
    if (typeof window !== 'undefined' && window.performance && window.performance.memory) {
      return {
        used: window.performance.memory.usedJSHeapSize,
        total: window.performance.memory.totalJSHeapSize,
        limit: window.performance.memory.jsHeapSizeLimit
      };
    }
    return null;
  }

  // 监控组件渲染性能
  measureComponentRender(componentName, renderFn) {
    if (!this.isEnabled) return renderFn();

    this.startMeasure(`${componentName}_render`);
    const result = renderFn();
    this.endMeasure(`${componentName}_render`);
    
    return result;
  }

  // 监控 Hook 性能
  measureHookPerformance(hookName, hookFn) {
    if (!this.isEnabled) return hookFn();

    this.startMeasure(`${hookName}_execution`);
    const result = hookFn();
    this.endMeasure(`${hookName}_execution`);
    
    return result;
  }

  // 监控列表渲染性能
  measureListRender(listName, items, renderFn) {
    if (!this.isEnabled) return renderFn();

    const measureName = `${listName}_list_render_${items.length}_items`;
    this.startMeasure(measureName);
    const result = renderFn();
    this.endMeasure(measureName);
    
    return result;
  }

  // 监控网络请求性能
  async measureNetworkRequest(requestName, requestFn) {
    if (!this.isEnabled) return requestFn();

    this.startMeasure(`${requestName}_network`);
    try {
      const result = await requestFn();
      this.endMeasure(`${requestName}_network`);
      return result;
    } catch (error) {
      this.endMeasure(`${requestName}_network`);
      throw error;
    }
  }

  // 记录用户交互性能
  measureUserInteraction(interactionName, interactionFn) {
    if (!this.isEnabled) return interactionFn();

    this.startMeasure(`${interactionName}_interaction`);
    const result = interactionFn();
    
    // 使用 setTimeout 确保在下一个事件循环中测量
    setTimeout(() => {
      this.endMeasure(`${interactionName}_interaction`);
    }, 0);
    
    return result;
  }

  // 监控缓存性能
  measureCacheOperation(operation, operationFn) {
    if (!this.isEnabled) return operationFn();

    this.startMeasure(`cache_${operation}`);
    const result = operationFn();
    this.endMeasure(`cache_${operation}`);
    
    return result;
  }

  // 记录性能指标
  logMetric(name, metric) {
    // 只在开发环境输出详细日志
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    const formatDuration = (duration) => {
      if (duration < 1) return `${(duration * 1000).toFixed(2)}μs`;
      if (duration < 1000) return `${duration.toFixed(2)}ms`;
      return `${(duration / 1000).toFixed(2)}s`;
    };

    const formatMemory = (bytes) => {
      if (!bytes) return 'N/A';
      const mb = bytes / (1024 * 1024);
      return `${mb.toFixed(2)}MB`;
    };

    console.group(`🚀 Performance: ${name}`);
    console.log(`⏱️ Duration: ${formatDuration(metric.duration)}`);
    
    if (metric.memory && metric.memoryAfter) {
      console.log(`💾 Memory before: ${formatMemory(metric.memory.used)}`);
      console.log(`💾 Memory after: ${formatMemory(metric.memoryAfter.used)}`);
      console.log(`📈 Memory delta: ${formatMemory(metric.memoryDelta)}`);
    }
    
    // 性能建议
    if (metric.duration > 100) {
      console.warn(`⚠️ 性能警告: ${name} 耗时超过100ms，考虑优化`);
    } else if (metric.duration > 16.67) {
      console.info(`ℹ️ 性能提示: ${name} 耗时超过一帧时间(16.67ms)`);
    } else {
      console.log(`✅ 性能良好: ${name} 耗时在合理范围内`);
    }
    
    console.groupEnd();
  }

  // 获取性能报告
  getPerformanceReport() {
    if (!this.isEnabled) return null;

    const metrics = Array.from(this.metrics.entries()).map(([name, metric]) => ({
      name,
      duration: metric.duration,
      memoryDelta: metric.memoryDelta,
      timestamp: metric.startTime
    }));

    const summary = {
      totalMeasurements: metrics.length,
      averageDuration: metrics.reduce((sum, m) => sum + (m.duration || 0), 0) / metrics.length,
      slowestOperation: metrics.reduce((slowest, current) => 
        (current.duration > (slowest?.duration || 0)) ? current : slowest, null),
      fastestOperation: metrics.reduce((fastest, current) => 
        (current.duration < (fastest?.duration || Infinity)) ? current : fastest, null),
    };

    return {
      summary,
      metrics: metrics.sort((a, b) => (b.duration || 0) - (a.duration || 0))
    };
  }

  // 清除所有指标
  clearMetrics() {
    this.metrics.clear();
  }

  // 开始监控页面加载性能
  monitorPageLoad() {
    if (!this.isEnabled || typeof window === 'undefined') return;

    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0];
        if (perfData && process.env.NODE_ENV === 'development') {
          console.group('📊 Page Load Performance');
          console.log(`🔄 DOM Content Loaded: ${perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart}ms`);
          console.log(`📄 Page Load Complete: ${perfData.loadEventEnd - perfData.loadEventStart}ms`);
          console.log(`🌐 Total Load Time: ${perfData.loadEventEnd - perfData.fetchStart}ms`);
          console.groupEnd();
        }
      }, 0);
    });
  }

  // 启用性能监控
  enable() {
    this.isEnabled = true;
  }

  // 禁用性能监控
  disable() {
    this.isEnabled = false;
  }
}

// 创建全局实例
const performanceMonitor = new PerformanceMonitor();

// 在开发环境下自动启动页面加载监控
if (typeof window !== 'undefined') {
  performanceMonitor.monitorPageLoad();
}

export default performanceMonitor; 