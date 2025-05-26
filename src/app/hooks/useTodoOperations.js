import { useState, useCallback, useEffect } from 'react';
import { cachedTodoService } from '../services/cachedTodoService';
import { useAuth } from './useAuth';

/**
 * 管理Todo数据操作的自定义Hook（带缓存功能）
 */
export const useTodoOperations = () => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cacheStats, setCacheStats] = useState(null);
  const { user } = useAuth();

  // 获取待办事项列表（使用缓存）
  const fetchTodos = useCallback(async (filters = {}) => {
    if (!user?.$id) {
      setTodos([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      const response = await cachedTodoService.getTodos(user.$id, filters);
      setTodos(response.documents || response);
    } catch (err) {
      setError(err.message || '获取待办事项失败');
      console.error('Fetch todos error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.$id]);

  // 获取共享待办事项（使用缓存）
  const fetchSharedTodos = useCallback(async (filters = {}) => {
    if (!user?.$id) return [];
    
    try {
      const response = await cachedTodoService.getSharedTodos(user.$id, filters);
      return response.documents || response;
    } catch (err) {
      setError(err.message || '获取共享待办事项失败');
      console.error('Fetch shared todos error:', err);
      return [];
    }
  }, [user?.$id]);

  // 更新待办事项状态（带缓存失效）
  const updateTodoStatus = useCallback(async (todoId, newStatus) => {
    if (!user?.$id) return false;
    
    try {
      // 乐观更新本地状态
      setTodos(prevTodos => 
        prevTodos.map(todo => 
          todo.$id === todoId ? { ...todo, status: newStatus } : todo
        )
      );

      await cachedTodoService.toggleTodoComplete(todoId, user.$id);
      
      setError("");
      return true;
    } catch (err) {
      // 回滚乐观更新
      setTodos(prevTodos => 
        prevTodos.map(todo => 
          todo.$id === todoId ? { ...todo, status: todo.status === newStatus ? 
            (newStatus === 'completed' ? 'pending' : 'completed') : todo.status } : todo
        )
      );
      
      setError(err.message || '更新状态失败');
      console.error('Update todo status error:', err);
      return false;
    }
  }, [user?.$id]);

  // 删除待办事项（带缓存失效）
  const deleteTodo = useCallback(async (todoId) => {
    if (!user?.$id) return false;
    
    // 保存原始数据用于回滚
    const originalTodos = todos;
    
    try {
      // 乐观更新本地状态
      setTodos(prevTodos => prevTodos.filter(todo => todo.$id !== todoId));
      
      await cachedTodoService.deleteTodo(todoId, user.$id);
      
      setError("");
      return true;
    } catch (err) {
      // 回滚乐观更新
      setTodos(originalTodos);
      
      setError(err.message || '删除失败');
      console.error('Delete todo error:', err);
      return false;
    }
  }, [user?.$id, todos]);

  // 创建新的待办事项（带缓存失效）
  const createTodo = useCallback(async (todoData) => {
    if (!user?.$id) return null;
    
    // 生成临时ID用于乐观更新
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const optimisticTodo = {
      $id: tempId,
      ...todoData,
      userId: user.$id,
      $createdAt: new Date().toISOString(),
      $updatedAt: new Date().toISOString(),
      status: todoData.status || 'pending'
    };
    
    // 乐观更新本地状态
    setTodos(prevTodos => [optimisticTodo, ...prevTodos]);
    
    try {
      const newTodo = await cachedTodoService.createTodo({
        ...todoData,
        userId: user.$id
      });
      
      // 用真实数据替换临时数据
      setTodos(prevTodos => 
        prevTodos.map(todo => 
          todo.$id === tempId ? newTodo : todo
        )
      );
      
      setError("");
      return newTodo;
    } catch (err) {
      // 移除乐观更新的数据
      setTodos(prevTodos => 
        prevTodos.filter(todo => todo.$id !== tempId)
      );
      
      setError(err.message || '创建待办事项失败');
      console.error('Create todo error:', err);
      return null;
    }
  }, [user?.$id]);

  // 更新待办事项（带缓存失效）
  const updateTodo = useCallback(async (todoId, updates) => {
    if (!user?.$id) return false;
    
    // 保存原始数据用于回滚
    const originalTodos = todos;
    
    try {
      // 乐观更新本地状态
      setTodos(prevTodos => 
        prevTodos.map(todo => 
          todo.$id === todoId ? { ...todo, ...updates } : todo
        )
      );

      const updatedTodo = await cachedTodoService.updateTodo(todoId, updates, user.$id);
      
      // 使用服务器返回的数据更新状态
      setTodos(prevTodos => 
        prevTodos.map(todo => 
          todo.$id === todoId ? updatedTodo : todo
        )
      );
      
      setError("");
      return true;
    } catch (err) {
      // 回滚乐观更新
      setTodos(originalTodos);
      
      setError(err.message || '更新待办事项失败');
      console.error('Update todo error:', err);
      return false;
    }
  }, [user?.$id, todos]);

  // 分享待办事项（带缓存失效）
  const shareTodo = useCallback(async (todoId, friendIds) => {
    if (!user?.$id) return false;
    
    try {
      await cachedTodoService.shareTodo(todoId, friendIds, user.$id);
      
      // 刷新数据以获取最新的分享状态
      await fetchTodos();
      
      setError("");
      return true;
    } catch (err) {
      setError(err.message || '分享待办事项失败');
      console.error('Share todo error:', err);
      return false;
    }
  }, [user?.$id, fetchTodos]);

  // 取消分享待办事项（带缓存失效）
  const unshareTodo = useCallback(async (todoId, friendIds) => {
    if (!user?.$id) return false;
    
    try {
      await cachedTodoService.unshareTodo(todoId, friendIds, user.$id);
      
      // 刷新数据以获取最新的分享状态
      await fetchTodos();
      
      setError("");
      return true;
    } catch (err) {
      setError(err.message || '取消分享失败');
      console.error('Unshare todo error:', err);
      return false;
    }
  }, [user?.$id, fetchTodos]);

  // 搜索待办事项（使用缓存）
  const searchTodos = useCallback(async (query, filters = {}) => {
    if (!user?.$id) return [];
    
    try {
      const results = await cachedTodoService.searchTodos(user.$id, query, filters);
      return results.documents || results;
    } catch (err) {
      setError(err.message || '搜索失败');
      console.error('Search todos error:', err);
      return [];
    }
  }, [user?.$id]);

  // 获取待办事项统计（使用缓存）
  const getTodoStats = useCallback(async () => {
    if (!user?.$id) return null;
    
    try {
      const stats = await cachedTodoService.getTodoStats(user.$id);
      return stats;
    } catch (err) {
      setError(err.message || '获取统计失败');
      console.error('Get todo stats error:', err);
      return null;
    }
  }, [user?.$id]);

  // 批量操作（带缓存失效）
  const batchUpdateStatus = useCallback(async (todoIds, newStatus) => {
    if (!user?.$id || !todoIds.length) return false;
    
    // 保存原始数据用于回滚
    const originalTodos = todos;
    
    try {
      // 乐观更新本地状态
      setTodos(prevTodos => 
        prevTodos.map(todo => 
          todoIds.includes(todo.$id) ? { ...todo, status: newStatus } : todo
        )
      );

      // 并行执行批量更新
      const updatePromises = todoIds.map(todoId => 
        cachedTodoService.updateTodo(todoId, { status: newStatus }, user.$id)
      );
      
      await Promise.all(updatePromises);
      
      setError("");
      return true;
    } catch (err) {
      // 回滚乐观更新
      setTodos(originalTodos);
      
      setError(err.message || '批量更新失败');
      console.error('Batch update error:', err);
      return false;
    }
  }, [user?.$id, todos]);

  // 缓存管理功能
  const getCacheStats = useCallback(() => {
    const stats = cachedTodoService.getCacheStats();
    setCacheStats(stats);
    return stats;
  }, []);

  const cleanupCache = useCallback(() => {
    const cleaned = cachedTodoService.cleanupCache();
    setCacheStats(cachedTodoService.getCacheStats());
    return cleaned;
  }, []);

  const invalidateCache = useCallback(() => {
    if (user?.$id) {
      cachedTodoService.invalidateTodoCache(user.$id);
      setCacheStats(cachedTodoService.getCacheStats());
    }
  }, [user?.$id]);

  // 清除错误
  const clearError = useCallback(() => {
    setError("");
  }, []);

  // 刷新数据
  const refresh = useCallback((filters) => {
    return fetchTodos(filters);
  }, [fetchTodos]);

  // 当用户登出时清除数据和缓存
  useEffect(() => {
    if (!user) {
      setTodos([]);
      setError("");
      setLoading(false);
      setCacheStats(null);
      // 清除所有缓存
      cachedTodoService.cleanupCache();
    }
  }, [user]);

  // 定期更新缓存统计
  useEffect(() => {
    if (user?.$id) {
      const interval = setInterval(() => {
        setCacheStats(cachedTodoService.getCacheStats());
      }, 30000); // 每30秒更新一次

      return () => clearInterval(interval);
    }
  }, [user?.$id]);

  return {
    // 数据状态
    todos,
    loading,
    error,
    cacheStats,
    
    // 基础操作方法
    fetchTodos,
    fetchSharedTodos,
    createTodo,
    updateTodo,
    deleteTodo,
    updateTodoStatus,
    
    // 高级操作方法
    shareTodo,
    unshareTodo,
    searchTodos,
    getTodoStats,
    batchUpdateStatus,
    
    // 缓存管理方法
    getCacheStats,
    cleanupCache,
    invalidateCache,
    
    // 工具方法
    clearError,
    refresh
  };
}; 