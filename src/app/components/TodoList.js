"use client";
import React, { useState, useCallback, forwardRef, useImperativeHandle, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TodoFilters from "./TodoFilters";
import TodoItem from "./TodoItem";
import TodoDetailModal from "./TodoDetailModal";
import { useTodoFilters } from "../hooks/useTodoFilters";
import { useTodoOperations } from "../hooks/useTodoOperations";

/**
 * 重构后的TodoList组件
 * 现在作为轻量级容器组件，整合所有子组件和Hook
 */
const TodoList = forwardRef(({ onCountChange, ...props }, ref) => {
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const isInitialMount = useRef(true);
  const refreshIntervalRef = useRef(null);

  // 使用自定义Hook管理过滤器
  const {
    filters,
    showAll,
    togglePriorityFilter,
    toggleShowAll,
    resetFilters,
    hasActiveFilters,
    applyFilters,
  } = useTodoFilters();

  // 使用自定义Hook管理Todo操作
  const {
    todos,
    loading,
    error,
    fetchTodos,
    updateTodoStatus,
    deleteTodo,
    clearError,
    refresh,
  } = useTodoOperations();

  // 应用过滤器到todo列表
  const filteredTodos = applyFilters(todos);

  // 通知父组件待办事项数量变化
  useEffect(() => {
    if (onCountChange) {
      onCountChange(todos.length);
    }
  }, [todos.length, onCountChange]);

  // 获取过滤后的todos - 使用稳定的函数引用，总是获取所有数据
  const refreshWithFilters = useCallback(() => {
    // 总是获取所有数据，在前端进行过滤
    return fetchTodos({});
  }, [fetchTodos]);

  // 暴露刷新方法给父组件
  useImperativeHandle(ref, () => ({
    refresh: refreshWithFilters
  }), [refreshWithFilters]);

  // 初始化数据获取 - 只在组件挂载时执行一次，获取所有数据
  useEffect(() => {
    if (isInitialMount.current) {
      // 获取所有数据，不传递过滤参数
      fetchTodos({});
      isInitialMount.current = false;
    }
  }, []); // 空依赖数组，只在挂载时执行

  // 移除过滤条件变化时的API调用，因为我们现在在前端过滤
  // 过滤逻辑已经在 applyFilters 函数中处理，不需要重新调用API

  // 设置定期刷新 - 独立的useEffect，避免重复创建定时器
  useEffect(() => {
    // 设置定时器
    refreshIntervalRef.current = setInterval(() => {
      // 定期刷新时也获取所有数据
      fetchTodos({});
    }, 5 * 60 * 1000); // 5分钟

    // 清理函数
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, []); // 空依赖数组，只在组件挂载时设置一次

  // 处理长按或点击查看详情
  const handleShowDetail = useCallback((todoId) => {
    const todo = todos.find(t => t.$id === todoId);
    if (todo) {
      setSelectedTodo(todo);
      setShowDetailModal(true);
    }
  }, [todos]);

  // 关闭详情模态框
  const closeDetailModal = useCallback(() => {
    setShowDetailModal(false);
    setSelectedTodo(null);
  }, []);

  // 处理分享成功
  const handleShareSuccess = useCallback((friendCount) => {
    // 可以在这里添加一些成功后的逻辑，如刷新数据或显示通知
    console.log(`Todo shared with ${friendCount} friends successfully`);
  }, []);

  // 格式化日期
  const formatDate = useCallback((dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 过滤器组件 */}
      <div className="flex-shrink-0 px-4 pt-4">
          <TodoFilters
            filters={filters}
            showAll={showAll}
            onTogglePriorityFilter={togglePriorityFilter}
            onToggleShowAll={toggleShowAll}
            onResetFilters={resetFilters}
            hasActiveFilters={hasActiveFilters}
          />
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="flex-shrink-0 px-4 pt-2">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center justify-between"
            >
              <span>{error}</span>
              <button
                onClick={clearError}
                className="ml-3 text-red-400 hover:text-red-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          </div>
        )}

      {/* 待办事项列表 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bounce-scroll px-4 pb-4">
        {/* 加载状态 */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-xl"
          >
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            <p className="text-gray-600 mt-3 text-base">加载中...</p>
          </motion.div>
        )}
        
        {/* Todo项目列表 */}
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filteredTodos.map((todo) => (
              <TodoItem
                key={todo.$id}
                todo={todo}
                onStatusChange={updateTodoStatus}
                onDelete={deleteTodo}
                onLongPress={handleShowDetail}
                formatDate={formatDate}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* 空状态 */}
        {filteredTodos.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="text-4xl mb-3">📝</div>
            <p className="text-lg text-gray-500">
              {hasActiveFilters ? '暂无符合条件的待办事项' : '暂无待办事项'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {hasActiveFilters ? '尝试调整过滤条件' : '添加第一个待办事项开始使用吧'}
            </p>
          </motion.div>
        )}
      </div>

      {/* 详情模态框 */}
      <TodoDetailModal
        isOpen={showDetailModal}
        todo={selectedTodo}
        onClose={closeDetailModal}
        onStatusChange={updateTodoStatus}
        onDelete={deleteTodo}
        onShareSuccess={handleShareSuccess}
        formatDate={formatDate}
      />
    </div>
  );
});

TodoList.displayName = 'TodoList';

export default TodoList; 