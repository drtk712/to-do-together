import { useState, useCallback, useMemo } from 'react';

/**
 * 管理Todo过滤器的自定义Hook
 */
export const useTodoFilters = () => {
  const [filters, setFilters] = useState({
    status: "pending",
    priority: [],
  });
  const [showAll, setShowAll] = useState(false);

  // 切换优先级过滤器
  const togglePriorityFilter = useCallback((priority) => {
    setFilters(prev => ({
      ...prev,
      priority: prev.priority.includes(priority)
        ? prev.priority.filter(p => p !== priority)
        : [...prev.priority, priority]
    }));
  }, []);

  // 设置状态过滤器
  const setStatusFilter = useCallback((status) => {
    setFilters(prev => ({
      ...prev,
      status
    }));
  }, []);

  // 切换显示所有状态
  const toggleShowAll = useCallback(() => {
    setShowAll(prev => !prev);
  }, []);

  // 重置所有过滤器
  const resetFilters = useCallback(() => {
    setFilters({
      status: "pending",
      priority: [],
    });
    setShowAll(false);
  }, []);

  // 检查是否有活动过滤器
  const hasActiveFilters = useMemo(() => {
    return filters.priority.length > 0 || showAll;
  }, [filters.priority.length, showAll]);

  // 应用过滤器到todo列表
  const applyFilters = useCallback((todos) => {
    if (!todos || !Array.isArray(todos)) return [];

    let filteredTodos = [...todos];

    // 应用状态过滤
    if (!showAll && filters.status) {
      filteredTodos = filteredTodos.filter(todo => todo.status === filters.status);
    }

    // 应用优先级过滤
    if (filters.priority.length > 0) {
      filteredTodos = filteredTodos.filter(todo => 
        filters.priority.includes(todo.priority)
      );
    }

    // 按创建时间排序（最新的在前）
    filteredTodos.sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt));

    return filteredTodos;
  }, [filters, showAll]);

  // 获取过滤器统计信息
  const getFilterStats = useCallback((todos) => {
    if (!todos || !Array.isArray(todos)) {
      return {
        total: 0,
        pending: 0,
        completed: 0,
        high: 0,
        medium: 0,
        low: 0,
      };
    }

    const stats = {
      total: todos.length,
      pending: todos.filter(todo => todo.status === 'pending').length,
      completed: todos.filter(todo => todo.status === 'completed').length,
      high: todos.filter(todo => todo.priority === 'high').length,
      medium: todos.filter(todo => todo.priority === 'medium').length,
      low: todos.filter(todo => todo.priority === 'low').length,
    };

    return stats;
  }, []);

  return {
    filters,
    showAll,
    setFilters,
    setShowAll,
    togglePriorityFilter,
    setStatusFilter,
    toggleShowAll,
    resetFilters,
    hasActiveFilters,
    applyFilters,
    getFilterStats,
  };
}; 