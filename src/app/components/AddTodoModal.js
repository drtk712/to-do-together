"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useTodoOperations } from "../hooks/useTodoOperations";
import { motion, AnimatePresence } from "framer-motion";

const AddTodoModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const { createTodo } = useTodoOperations();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(false);


  // 检测移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 监听模态框关闭，重置状态
  useEffect(() => {
    if (!isOpen) {
      // 立即重置状态，因为延迟现在在父组件中处理
      resetState();
    }
  }, [isOpen]);

  // 重置状态
  const resetState = () => {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setDueDate("");
    setError("");
    setIsSubmitting(false);
  };

  // 关闭弹窗
  const handleClose = () => {
    onClose();
  };

  // 提交表单
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError("请输入待办事项标题");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const todoData = {
        title: title.trim(),
        description: description.trim(),
        priority,
        dueDate: dueDate || null,
        completed: false,
        userId: user.$id
      };

      // 使用hook中的createTodo方法，它会自动更新本地状态
      const newTodo = await createTodo(todoData);
      
      if (newTodo) {
        // 通知父组件操作成功（可选，用于显示成功消息等）
        if (onSuccess) {
          onSuccess();
        }
        
        // 重置表单并关闭弹窗
        resetState();
        onClose();
      } else {
        setError("创建失败，请重试");
      }
      
    } catch (error) {
      console.error("创建待办事项失败:", error);
      setError(error.message || "创建失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 优先级选项
  const priorityOptions = [
    { value: "low", label: "低优先级", color: "text-green-600 bg-green-50", icon: "⬇️" },
    { value: "medium", label: "中优先级", color: "text-yellow-600 bg-yellow-50", icon: "➡️" },
    { value: "high", label: "高优先级", color: "text-red-600 bg-red-50", icon: "⬆️" }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="todo-modal"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0.0, 0.2, 1] }}
        >
          {/* 背景遮罩 - 优化关闭动画 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 0.3,
              ease: [0.4, 0.0, 0.2, 1]
            }}
            className="absolute inset-0 bg-black/60 modal-backdrop smooth-blur"
            onClick={handleClose}
          />
          
          {/* 弹窗内容 - 优化关闭动画 */}
          <motion.div
            initial={{ 
              opacity: 0, 
              scale: 0.9, 
              y: isMobile ? 100 : 20
            }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.9, 
              y: isMobile ? 50 : 10
            }}
            transition={{
              type: "tween",
              duration: 0.3,
              ease: [0.4, 0.0, 0.2, 1]
            }}
            className="relative bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[85vh] sm:max-h-[80vh] overflow-hidden modal-content"
            style={{
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)'
            }}
          >
            {/* 头部 - 移动端优化 */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ 
                duration: 0.3,
                delay: 0.1,
                ease: [0.4, 0.0, 0.2, 1]
              }}
              className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700"
            >
              {/* 移动端拖拽指示器 */}
              <motion.div 
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                exit={{ opacity: 0, scaleX: 0 }}
                transition={{ 
                  duration: 0.3,
                  delay: 0.2,
                  ease: [0.4, 0.0, 0.2, 1]
                }}
                className="absolute top-2 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gray-300 dark:bg-gray-600 rounded-full sm:hidden"
              />
              
              <motion.h2 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
                transition={{ 
                  duration: 0.3,
                  delay: 0.15,
                  ease: [0.4, 0.0, 0.2, 1]
                }}
                className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white"
              >
                添加待办事项
              </motion.h2>
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ 
                  duration: 0.3,
                  delay: 0.2,
                  ease: [0.4, 0.0, 0.2, 1]
                }}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </motion.div>

            {/* 内容区域 - 移动端优化 */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ 
                duration: 0.3,
                delay: 0.2,
                ease: [0.4, 0.0, 0.2, 1]
              }}
              className="p-4 sm:p-6 max-h-96 overflow-y-auto"
            >
              {/* 错误提示 */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-200 rounded-lg text-sm"
                >
                  {error}
                </motion.div>
              )}

              {/* 表单 */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 标题输入 */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                >
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    待办事项标题 *
                  </label>
                  <motion.input
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35, duration: 0.3 }}
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="输入待办事项标题"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors text-base"
                    required
                  />
                </motion.div>

                {/* 描述输入 */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                >
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    描述（可选）
                  </label>
                  <motion.textarea
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.45, duration: 0.3 }}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="添加详细描述..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors text-base resize-none"
                  />
                </motion.div>

                {/* 优先级选择 */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                >
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    优先级
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {priorityOptions.map((option, index) => (
                      <motion.button
                        key={option.value}
                        type="button"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.55 + index * 0.05, duration: 0.3 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setPriority(option.value)}
                        className={`p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                          priority === option.value
                            ? `${option.color} border-current`
                            : 'text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                      >
                        <div className="flex flex-col items-center space-y-1">
                          <span className="text-lg">{option.icon}</span>
                          <span className="text-xs">{option.label}</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>

                {/* 截止日期 */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.3 }}
                >
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    截止日期（可选）
                  </label>
                  <motion.input
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.65, duration: 0.3 }}
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors text-base"
                  />
                </motion.div>

                {/* 提交按钮 */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.3 }}
                  className="flex space-x-3 pt-4"
                >
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.75, duration: 0.3 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleClose}
                    className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                  >
                    取消
                  </motion.button>
                  <motion.button
                    type="submit"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8, duration: 0.3 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isSubmitting || !title.trim()}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>创建中...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>创建待办</span>
                      </>
                    )}
                  </motion.button>
                </motion.div>
              </form>

              {/* 提示信息 */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.85, duration: 0.3 }}
                className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
              >
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  💡 创建后可以在待办列表中管理和编辑
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddTodoModal; 