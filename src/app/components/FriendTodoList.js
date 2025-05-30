"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import { useTodoOperations } from "../hooks/useTodoOperations";
import { useFriendOperations } from "../hooks/useFriendOperations";

/**
 * 我们的待办事项列表组件
 * 显示好友分享的待办事项
 */
const FriendTodoList = ({ 
  onCountChange, 
  friendTodos = [], 
  loading = false, 
  error = "",
  onRefresh 
}) => {
  const [localError, setLocalError] = useState("");

  // 通知父组件数量变化
  useEffect(() => {
    if (onCountChange) {
      onCountChange(friendTodos.length);
    }
  }, [friendTodos.length, onCountChange]);

  // 处理刷新
  const handleRefresh = useCallback(() => {
    if (onRefresh) {
      onRefresh();
    }
  }, [onRefresh]);

  // 合并错误状态
  const displayError = error || localError;

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

  // 优先级配置
  const PRIORITY_BACKGROUNDS = {
    high: "bg-gradient-to-r from-red-100 to-red-50 border-l-4 border-red-400",
    medium: "bg-gradient-to-r from-yellow-100 to-yellow-50 border-l-4 border-yellow-400",
    low: "bg-gradient-to-r from-green-100 to-green-50 border-l-4 border-green-400",
  };

  const PRIORITY_ICONS = {
    high: "🔥",
    medium: "⭐",
    low: "🌱",
  };

  return (
    <div className="h-full flex flex-col">
      {/* 错误提示 */}
      {displayError && (
        <div className="flex-shrink-0 px-4 pt-2">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center justify-between"
          >
            <span>{displayError}</span>
            <button
              onClick={() => setLocalError("")}
              className="ml-3 text-red-400 hover:text-red-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        </div>
      )}

      {/* 我们的待办事项列表 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bounce-scroll px-4 pb-4">
        {/* 加载状态 */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-xl"
          >
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
            <p className="text-gray-600 mt-3 text-base">加载中...</p>
          </motion.div>
        )}
        
        {/* 好友Todo项目列表 */}
        <div className="space-y-3 pt-4">
          <AnimatePresence mode="popLayout">
            {friendTodos.map((todo) => (
              <motion.div
                key={todo.$id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 20,
                  mass: 1
                }}
                className={`
                  relative p-4 rounded-xl shadow-sm transition-all duration-300
                  ${PRIORITY_BACKGROUNDS[todo.priority]}
                  hover:shadow-md cursor-pointer
                  ${todo.status === 'completed' ? 'opacity-70' : ''}
                `}
              >
                {/* 好友信息头部 */}
                <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-gray-200">
                  {todo.friendAvatar ? (
                    <img 
                      src={todo.friendAvatar} 
                      alt={todo.friendName}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-medium">
                      {todo.friendName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm text-gray-600 font-medium">
                    {todo.friendName}
                  </span>
                  <span className="text-xs text-gray-400">分享了待办</span>
                </div>

                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">{PRIORITY_ICONS[todo.priority]}</span>
                      <h3 className={`text-lg font-semibold leading-tight ${
                        todo.status === 'completed' 
                          ? 'line-through text-gray-600' 
                          : 'text-gray-900'
                      }`}>
                        {todo.title}
                      </h3>
                    </div>
                    
                    {todo.description && (
                      <p className={`text-sm leading-relaxed mb-3 ${
                        todo.status === 'completed' 
                          ? 'text-gray-500' 
                          : 'text-gray-600'
                      }`}>
                        {todo.description.length > 100 
                          ? `${todo.description.substring(0, 100)}...` 
                          : todo.description
                        }
                      </p>
                    )}
                  </div>

                  {/* 状态指示器 */}
                  {todo.status === 'completed' && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center ml-3"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  )}
                </div>

                {/* 时间信息 */}
                <motion.div className="flex items-center justify-between text-xs text-gray-500 mt-3">
                  <span>
                    创建于 {formatDate(todo.$createdAt).split(' ')[0]}
                  </span>
                  {todo.dueDate && (
                    <span className="bg-gray-200 px-2 py-1 rounded-full">
                      截止 {new Date(todo.dueDate).toLocaleDateString('zh-CN', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  )}
                </motion.div>

                {/* 共享标识 */}
                <div className="absolute top-2 right-2">
                  <div className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs font-medium">
                    共享
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* 空状态 */}
        {friendTodos.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="text-4xl mb-3">👥</div>
            <p className="text-lg text-gray-500">
              暂无好友分享的待办事项
            </p>
            <p className="text-sm text-gray-400 mt-1">
              邀请好友一起使用，分享你们的待办任务
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default FriendTodoList; 