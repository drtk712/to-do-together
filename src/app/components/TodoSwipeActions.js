import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Todo滑动操作组件
 * 显示在todo项目后面的操作按钮
 */
const TodoSwipeActions = React.memo(({ 
  todoId,
  todoStatus,
  swipeState,
  onConfirmAction
}) => {
  // 修改显示逻辑：在滑动过程中和激活状态下都显示按钮
  const showCompleteButton = swipeState.action === 'complete' && (swipeState.isSwiping || swipeState.isSwipeActive) && Math.abs(swipeState.offset) > 0;
  const showDeleteButton = swipeState.action === 'delete' && (swipeState.isSwiping || swipeState.isSwipeActive) && Math.abs(swipeState.offset) > 0;

  return (
    <div className="absolute inset-0 flex items-center">
      {/* 完成按钮 - 占满左侧空白区域 */}
      <AnimatePresence>
        {showCompleteButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-0 bottom-0 bg-green-500 text-white flex items-center justify-center hover:bg-green-600 active:bg-green-700 transition-colors rounded-l-lg"
            style={{ 
              width: `${Math.abs(swipeState.offset)}px`,
              left: 0
            }}
            onClick={() => onConfirmAction(todoId)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex flex-col items-center space-y-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-medium">完成</span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* 删除按钮 - 占满右侧空白区域 */}
      <AnimatePresence>
        {showDeleteButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-0 bottom-0 bg-red-500 text-white flex items-center justify-center hover:bg-red-600 active:bg-red-700 transition-colors rounded-r-lg"
            style={{ 
              width: `${Math.abs(swipeState.offset)}px`,
              right: 0
            }}
            onClick={() => onConfirmAction(todoId)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex flex-col items-center space-y-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="text-sm font-medium">删除</span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
});

TodoSwipeActions.displayName = 'TodoSwipeActions';

export default TodoSwipeActions; 