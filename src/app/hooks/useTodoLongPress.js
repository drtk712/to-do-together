import { useState, useCallback, useRef } from 'react';

const LONG_PRESS_DURATION = 1000; // 长按时间阈值（毫秒）
const MOVE_THRESHOLD = 15; // 移动阈值（像素）
const CLICK_THRESHOLD = 5; // 点击阈值（像素）

/**
 * 管理TodoItem长按交互的自定义Hook
 */
export const useTodoLongPress = () => {
  const [longPressState, setLongPressState] = useState({});
  const longPressCallbacks = useRef({});
  const touchStartTime = useRef({});

  // 处理长按开始
  const handleLongPressStart = useCallback((todoId, e, onLongPress) => {
    const touch = e.touches[0];
    
    // 存储回调函数和开始时间
    longPressCallbacks.current[todoId] = onLongPress;
    touchStartTime.current[todoId] = Date.now();
    
    setLongPressState(prev => ({
      ...prev,
      [todoId]: {
        startX: touch.clientX,
        startY: touch.clientY,
        isLongPress: false,
        hasTriggered: false,
        timeout: setTimeout(() => {
          setLongPressState(prev => {
            const currentState = prev[todoId];
            if (currentState && !currentState.hasTriggered) {
              // 触发长按效果
              const callback = longPressCallbacks.current[todoId];
              if (callback) {
                // 使用 requestAnimationFrame 确保在下一帧执行回调
                requestAnimationFrame(() => {
                  callback(todoId);
                });
              }
              
              // 添加震动反馈
              if (navigator.vibrate) {
                navigator.vibrate(50);
              }
              
              return {
                ...prev,
                [todoId]: { 
                  ...currentState, 
                  isLongPress: true, 
                  hasTriggered: true 
                }
              };
            }
            return prev;
          });
        }, LONG_PRESS_DURATION)
      }
    }));
  }, []);

  // 处理长按移动（检查是否应该取消长按）
  const handleLongPressMove = useCallback((todoId, currentX, currentY) => {
    const state = longPressState[todoId];
    if (!state) return false;
    
    const deltaX = Math.abs(currentX - state.startX);
    const deltaY = Math.abs(currentY - state.startY);
    
    // 如果移动距离超过阈值，取消长按
    if (deltaX > MOVE_THRESHOLD || deltaY > MOVE_THRESHOLD) {
      handleLongPressEnd(todoId);
      return true; // 表示长按被取消
    }
    
    return false;
  }, [longPressState]);

  // 处理长按结束
  const handleLongPressEnd = useCallback((todoId) => {
    setLongPressState(prev => {
      const state = prev[todoId];
      if (state) {
        clearTimeout(state.timeout);
        const newState = { ...prev };
        delete newState[todoId];
        delete longPressCallbacks.current[todoId];
        delete touchStartTime.current[todoId];
        return newState;
      }
      return prev;
    });
  }, []);

  // 获取特定todo的长按状态
  const getLongPressState = useCallback((todoId) => {
    const state = longPressState[todoId];
    return {
      isLongPress: state?.isLongPress || false,
      hasTriggered: state?.hasTriggered || false,
      startX: state?.startX,
      startY: state?.startY,
      touchStartTime: touchStartTime.current[todoId],
    };
  }, [longPressState]);

  // 重置所有长按状态
  const resetLongPressStates = useCallback(() => {
    // 清除所有定时器
    Object.values(longPressState).forEach(state => {
      if (state.timeout) {
        clearTimeout(state.timeout);
      }
    });
    setLongPressState({});
    longPressCallbacks.current = {};
    touchStartTime.current = {};
  }, [longPressState]);

  return {
    longPressState,
    handleLongPressStart,
    handleLongPressMove,
    handleLongPressEnd,
    getLongPressState,
    resetLongPressStates,
    LONG_PRESS_DURATION,
    MOVE_THRESHOLD,
    CLICK_THRESHOLD,
  };
}; 