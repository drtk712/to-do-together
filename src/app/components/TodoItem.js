import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TodoSwipeActions from './TodoSwipeActions';
import { useTodoSwipe } from '../hooks/useTodoSwipe';
import { useTodoLongPress } from '../hooks/useTodoLongPress';

// 优先级背景颜色
const PRIORITY_BACKGROUNDS = {
  high: "bg-gradient-to-r from-red-100 to-red-50 border-l-4 border-red-400",
  medium: "bg-gradient-to-r from-yellow-100 to-yellow-50 border-l-4 border-yellow-400",
  low: "bg-gradient-to-r from-green-100 to-green-50 border-l-4 border-green-400",
};

// 优先级图标
const PRIORITY_ICONS = {
  high: "🔥",
  medium: "⭐",
  low: "🌱",
};

/**
 * 单个Todo项目组件
 * 集成滑动、长按和交互功能
 */
const TodoItem = React.memo(({ 
  todo, 
  onStatusChange, 
  onDelete, 
  onLongPress,
  formatDate 
}) => {
  const {
    handleTouchStart: handleSwipeStart,
    handleTouchMove: handleSwipeMove,
    handleTouchEnd: handleSwipeEnd,
    cancelSwipe,
    confirmAction,
    getSwipeState,
    SWIPE_FIXED_DISTANCE
  } = useTodoSwipe();

  const {
    handleLongPressStart,
    handleLongPressMove,
    handleLongPressEnd,
    getLongPressState
  } = useTodoLongPress();

  const swipeState = getSwipeState(todo.$id);
  const longPressState = getLongPressState(todo.$id);

  const handleTouchStart = (e) => {
    // 如果已经有滑动状态，不处理新的触摸
    if (swipeState.isSwipeActive) return;
    
    // 先处理长按，因为它需要更早开始计时
    handleLongPressStart(todo.$id, e, onLongPress);
    // 然后处理滑动
    handleSwipeStart(todo.$id, e);
  };

  const handleTouchMove = (e) => {
    // 如果已经有滑动状态，不处理移动
    if (swipeState.isSwipeActive) return;
    
    const touch = e.touches[0];
    
    // 先检查长按状态
    const longPressCancelled = handleLongPressMove(todo.$id, touch.clientX, touch.clientY);
    
    // 如果长按没有被取消，且没有触发长按动作，则处理滑动
    if (!longPressCancelled && !longPressState.isLongPress) {
      handleSwipeMove(todo.$id, e, todo.status);
    }
  };

  const handleTouchEnd = (e) => {
    // 如果已经有滑动状态，不处理结束
    if (swipeState.isSwipeActive) return;
    
    // 先处理长按结束
    handleLongPressEnd(todo.$id);
    
    // 如果不在长按状态，处理滑动
    if (!longPressState.isLongPress) {
      handleSwipeEnd(todo.$id, e);
    }
  };

  const handleCardClick = (e) => {
    e.stopPropagation();
    
    // 如果有激活的滑动状态，点击卡片取消滑动
    if (swipeState.isSwipeActive) {
      cancelSwipe(todo.$id);
      return;
    }
    
    // 其他点击逻辑可以在这里添加
  };

  const handleConfirmAction = (todoId) => {
    const result = confirmAction(todoId);
    if (result.confirmed && result.action) {
      if (result.action === 'complete') {
        onStatusChange(todoId, 'completed');
      } else if (result.action === 'delete') {
        onDelete(todoId);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="relative overflow-hidden"
      layout
    >
      {/* 背景操作按钮 */}
      <TodoSwipeActions
        todoId={todo.$id}
        todoStatus={todo.status}
        swipeState={swipeState}
        onConfirmAction={handleConfirmAction}
      />

      {/* 主要卡片内容 */}
      <motion.div
        className={`relative rounded-lg p-4 cursor-pointer select-none ${PRIORITY_BACKGROUNDS[todo.priority]}`}
        style={{
          zIndex: 10,
          touchAction: 'pan-y pinch-zoom'
        }}
        initial={false}
        animate={{
          x: swipeState.offset,
          scale: longPressState.isLongPress ? 1.02 : 1,
        }}
        transition={{ 
          type: "spring",
          stiffness: 300,
          damping: 30,
          mass: 0.5
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleCardClick}
      >
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
            {formatDate(todo.$createdAt).split(' ')[0]}
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

        {/* 长按脉冲效果 */}
        <motion.div
          className="absolute inset-0 rounded-lg border-2 border-blue-400"
          initial={false}
          animate={{
            opacity: longPressState.isLongPress ? [0, 0.6, 0] : 0,
            scale: longPressState.isLongPress ? [1, 1.05, 1] : 1
          }}
          transition={{
            duration: 1,
            repeat: longPressState.isLongPress ? Infinity : 0,
            ease: "easeInOut"
          }}
        />

        {/* 长按提示气泡 */}
        <AnimatePresence>
          {longPressState.isLongPress && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 10 }}
              className="absolute -top-10 right-2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-medium shadow-lg"
              style={{ zIndex: 20 }}
            >
              <div className="relative">
                查看详情
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-blue-600"></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 滑动进度指示器 */}
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-green-400 to-blue-400 rounded-b-lg"
          initial={false}
          animate={{
            width: swipeState.isSwiping ? `${Math.min(Math.abs(swipeState.offset) / SWIPE_FIXED_DISTANCE * 100, 100)}%` : '0%',
            opacity: swipeState.isSwiping ? 0.8 : 0
          }}
          transition={{ 
            type: "spring",
            stiffness: 300,
            damping: 30
          }}
        />
      </motion.div>
    </motion.div>
  );
});

TodoItem.displayName = 'TodoItem';

export default TodoItem; 