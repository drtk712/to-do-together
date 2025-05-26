"use client";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import TodoList from "../../components/TodoList";
import AddTodoModal from "../../components/AddTodoModal";
import LoadingSpinner from "../../components/LoadingSpinner";
import { motion } from "framer-motion";

const TodosPage = () => {
  const { user } = useAuth();
  const [isAddTodoModalOpen, setIsAddTodoModalOpen] = useState(false);
  const [todoCount, setTodoCount] = useState(0);
  const todoListRef = useRef();

  // 处理添加成功 - 触发列表刷新
  const handleAddSuccess = () => {
    // 触发TodoList刷新
    if (todoListRef.current) {
      todoListRef.current.refresh();
    }
  };

  // 处理模态框关闭
  const handleCloseModal = () => {
    setIsAddTodoModalOpen(false);
  };

  if (!user) {
    return <LoadingSpinner />;
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* 页面头部信息 */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-shrink-0 px-4 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {todoCount} 个任务
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              保持专注，逐一完成
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

      {/* 待办事项列表内容 - 使用 flex-1 和 overflow-hidden */}
      <div className="flex-1 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="h-full"
        >
          <TodoList 
            ref={todoListRef} 
            onCountChange={setTodoCount}
          />
        </motion.div>
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