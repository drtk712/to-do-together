"use client";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useDataManager } from "../../hooks/useDataManager";
import TodoList from "../../components/TodoList";
import FriendTodoList from "../../components/FriendTodoList";
import AddTodoModal from "../../components/AddTodoModal";
import LoadingSpinner from "../../components/LoadingSpinner";
import { motion, AnimatePresence } from "framer-motion";

const TodosPage = () => {
  const { user } = useAuth();
  const [isAddTodoModalOpen, setIsAddTodoModalOpen] = useState(false);
  const [todoCount, setTodoCount] = useState(0);
  const [sharedTodoCount, setSharedTodoCount] = useState(0);
  const [myTodosExpanded, setMyTodosExpanded] = useState(true);
  const [friendTodosExpanded, setFriendTodosExpanded] = useState(false);
  const todoListRef = useRef();

  // 使用统一的数据管理
  const {
    processedSharedTodos,
    loading,
    error,
    refreshData,
    clearError
  } = useDataManager();

  // 更新分享待办数量
  useEffect(() => {
    setSharedTodoCount(processedSharedTodos.length);
  }, [processedSharedTodos]);

  // 处理添加成功 - 触发列表刷新
  const handleAddSuccess = () => {
    // 触发TodoList刷新
    if (todoListRef.current) {
      todoListRef.current.refresh();
    }
    // 刷新分享数据，因为新添加的待办可能会被分享
    refreshData({ includeShared: true, includeFriends: false });
  };

  // 处理模态框关闭
  const handleCloseModal = () => {
    setIsAddTodoModalOpen(false);
  };

  // 切换我的待办展开状态
  const toggleMyTodos = () => {
    setMyTodosExpanded(!myTodosExpanded);
    if (!myTodosExpanded) {
      setFriendTodosExpanded(false);
    }
  };

  // 切换我们的待办展开状态
  const toggleFriendTodos = () => {
    setFriendTodosExpanded(!friendTodosExpanded);
    if (!friendTodosExpanded) {
      setMyTodosExpanded(false);
      // 如果数据比较旧，刷新一下
      refreshData({ includeShared: true, includeFriends: true });
    }
  };

  if (!user) {
    return <LoadingSpinner />;
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* 全局错误提示 */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="flex-shrink-0 mx-4 mt-2 bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm flex items-center justify-between"
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
      )}

      {/* 页面头部信息 */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-shrink-0 px-4 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              待办事项
            </h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              管理你的任务和好友分享的待办
            </p>
          </div>
          
          {/* 添加待办按钮 - 优化动画效果 */}
          <motion.button
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 15,
              delay: 0.3
            }}
            whileHover={{ 
              scale: 1.1, 
              rotate: 90,
              boxShadow: "0 8px 20px rgba(59, 130, 246, 0.3)"
            }}
            whileTap={{ scale: 0.9, rotate: 45 }}
            onClick={() => setIsAddTodoModalOpen(true)}
            className="relative p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl shadow-lg transition-all duration-300 mobile-button"
          >
            {/* 背景光晕效果 */}
            <motion.div
              className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400 to-blue-500 opacity-0"
              whileHover={{ opacity: 0.3, scale: 1.1 }}
              transition={{ duration: 0.3 }}
            />
            
            {/* 图标 */}
            <motion.svg 
              className="w-5 h-5 relative z-10" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              whileHover={{ rotate: 90 }}
              transition={{ duration: 0.3 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </motion.svg>
            
            {/* 脉冲效果 */}
            <motion.div
              className="absolute inset-0 rounded-2xl border-2 border-blue-300 opacity-0"
              animate={{ 
                scale: [1, 1.3, 1], 
                opacity: [0, 0.4, 0] 
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.button>
        </div>
      </motion.div>

      {/* 可折叠的待办事项内容 */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          
          {/* 我的待办部分 */}
          <motion.div 
            className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <motion.button
              onClick={toggleMyTodos}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.05)" }}
              whileTap={{ scale: 0.998 }}
            >
              <div className="flex items-center space-x-3">
                <motion.div
                  animate={{ rotate: myTodosExpanded ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-gray-500 dark:text-gray-400"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  我的待办
                </h2>
                <motion.span 
                  key={todoCount}
                  initial={{ scale: 1.2, color: "#3B82F6" }}
                  animate={{ scale: 1, color: "#6B7280" }}
                  transition={{ duration: 0.3 }}
                  className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full"
                >
                  {todoCount}
                </motion.span>
              </div>
              <div className="text-sm text-gray-400 dark:text-gray-500">
                {myTodosExpanded ? '收起' : '展开'}
              </div>
            </motion.button>
            
            <AnimatePresence>
              {myTodosExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  style={{ overflow: "hidden" }}
                >
                  <div style={{ height: myTodosExpanded ? "400px" : "0" }}>
                    <TodoList 
                      ref={todoListRef} 
                      onCountChange={setTodoCount}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* 我们的待办部分 */}
          <motion.div 
            className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <motion.button
              onClick={toggleFriendTodos}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              whileHover={{ backgroundColor: "rgba(16, 185, 129, 0.05)" }}
              whileTap={{ scale: 0.998 }}
            >
              <div className="flex items-center space-x-3">
                <motion.div
                  animate={{ rotate: friendTodosExpanded ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-gray-500 dark:text-gray-400"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  我们的待办
                </h2>
                <motion.span 
                  key={sharedTodoCount}
                  initial={{ scale: 1.2, color: "#10B981" }}
                  animate={{ scale: 1, color: "#6B7280" }}
                  transition={{ duration: 0.3 }}
                  className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full"
                >
                  {sharedTodoCount}
                </motion.span>
              </div>
              <div className="text-sm text-gray-400 dark:text-gray-500">
                {friendTodosExpanded ? '收起' : '展开'}
              </div>
            </motion.button>
            
            <AnimatePresence>
              {friendTodosExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  style={{ overflow: "hidden" }}
                >
                  <div style={{ height: friendTodosExpanded ? "400px" : "0" }}>
                    <FriendTodoList 
                      friendTodos={processedSharedTodos}
                      loading={loading.shared}
                      error={error}
                      onCountChange={setSharedTodoCount}
                      onRefresh={() => refreshData({ includeShared: true, includeFriends: true })}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* 填充剩余空间 */}
          <div className="flex-1 bg-gray-50 dark:bg-gray-900"></div>
        </div>
      </div>

      {/* 添加待办事项弹窗 */}
      <AddTodoModal
        isOpen={isAddTodoModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleAddSuccess}
      />
    </div>
  );
};

export default TodosPage; 