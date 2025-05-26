import { useState, useCallback, useRef } from 'react';

const SWIPE_THRESHOLD = 35; // 触发滑动的最小距离
const SWIPE_FIXED_DISTANCE = 80; // 滑动的固定距离
const VERTICAL_THRESHOLD = 30; // 垂直移动阈值

/**
 * 管理TodoItem滑动交互的自定义Hook
 */
export const useTodoSwipe = () => {
  const [swipeStates, setSwipeStates] = useState({});
  const swipeStatesRef = useRef({});

  // 更新 ref 和 state
  const updateSwipeState = useCallback((todoId, newState) => {
    swipeStatesRef.current = {
      ...swipeStatesRef.current,
      [todoId]: newState
    };
    setSwipeStates(swipeStatesRef.current);
  }, []);

  // 处理滑动开始
  const handleTouchStart = useCallback((todoId, e) => {
    const touch = e.touches[0];
    const newState = {
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      isSwiping: false,
      isSwipeActive: false, // 滑动是否已激活（到达固定位置）
      action: null,
      direction: null,
      initialDirection: null,
    };
    updateSwipeState(todoId, newState);
  }, [updateSwipeState]);

  // 处理滑动移动
  const handleTouchMove = useCallback((todoId, e, todoStatus) => {
    const touch = e.touches[0];
    const state = swipeStatesRef.current[todoId];
    
    if (!state) return;
    
    const deltaX = touch.clientX - state.startX;
    const deltaY = touch.clientY - state.startY;
    
    // 确定初始滑动方向
    if (!state.initialDirection && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
      const newState = {
        ...state,
        initialDirection: Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical'
      };
      updateSwipeState(todoId, newState);
    }
    
    // 如果初始方向是垂直，则不允许水平滑动
    if (state.initialDirection === 'vertical') {
      return;
    }
    
    // 如果垂直移动超过阈值，取消滑动
    if (Math.abs(deltaY) > VERTICAL_THRESHOLD) {
      return;
    }
    
    // 确定滑动方向和动作
    let action = null;
    let direction = null;
    
    if (deltaX > SWIPE_THRESHOLD) {
      // 右滑完成（只有未完成的任务可以右滑）
      if (todoStatus !== 'completed') {
        direction = 'right';
        action = 'complete';
      }
    } else if (deltaX < -SWIPE_THRESHOLD) {
      // 左滑删除
      direction = 'left';
      action = 'delete';
    }
    
    // 如果没有有效动作，重置状态
    if (!action) {
      const newState = {
        ...state,
        currentX: touch.clientX,
        currentY: touch.clientY,
        isSwiping: Math.abs(deltaX) > 10,
        isSwipeActive: false,
        action: null,
        direction: null,
      };
      updateSwipeState(todoId, newState);
      return;
    }
    
    const newState = {
      ...state,
      currentX: touch.clientX,
      currentY: touch.clientY,
      isSwiping: true,
      isSwipeActive: false,
      action,
      direction,
    };
    
    updateSwipeState(todoId, newState);
  }, [updateSwipeState]);

  // 处理滑动结束
  const handleTouchEnd = useCallback((todoId, e) => {
    const state = swipeStatesRef.current[todoId];
    
    if (!state || !state.action) {
      // 没有有效滑动，清除状态
      const newStates = { ...swipeStatesRef.current };
      delete newStates[todoId];
      swipeStatesRef.current = newStates;
      setSwipeStates(newStates);
      return;
    }
    
    // 滑动到固定位置
    const newState = {
      ...state,
      isSwipeActive: true,
      isSwiping: false,
    };
    updateSwipeState(todoId, newState);
    
  }, [updateSwipeState]);

  // 取消滑动（点击卡片）
  const cancelSwipe = useCallback((todoId) => {
    const state = swipeStatesRef.current[todoId];
    if (!state || !state.isSwipeActive) return false;
    
    // 清除状态，触发回弹动画
    const newStates = { ...swipeStatesRef.current };
    delete newStates[todoId];
    swipeStatesRef.current = newStates;
    setSwipeStates(newStates);
    
    return true; // 返回true表示取消了滑动
  }, []);

  // 确认动作
  const confirmAction = useCallback((todoId) => {
    const state = swipeStatesRef.current[todoId];
    if (!state || !state.isSwipeActive) return { action: null, confirmed: false };
    
    const action = state.action;
    
    // 清除状态
    const newStates = { ...swipeStatesRef.current };
    delete newStates[todoId];
    swipeStatesRef.current = newStates;
    setSwipeStates(newStates);
    
    return { action, confirmed: true };
  }, []);

  // 获取特定todo的滑动状态
  const getSwipeState = useCallback((todoId) => {
    const state = swipeStatesRef.current[todoId];
    if (!state) return { 
      offset: 0, 
      action: null, 
      isSwiping: false, 
      isSwipeActive: false,
      direction: null 
    };
    
    // 计算偏移量
    let offset = 0;
    if (state.isSwipeActive) {
      // 滑动已激活，固定在指定位置
      offset = state.direction === 'right' ? SWIPE_FIXED_DISTANCE : -SWIPE_FIXED_DISTANCE;
    } else if (state.isSwiping && state.action) {
      // 正在滑动中，跟随手指
      const deltaX = state.currentX - state.startX;
      if (state.direction === 'right') {
        offset = Math.min(deltaX, SWIPE_FIXED_DISTANCE);
      } else {
        offset = Math.max(deltaX, -SWIPE_FIXED_DISTANCE);
      }
    }
    
    return {
      offset,
      action: state.action,
      isSwiping: state.isSwiping,
      isSwipeActive: state.isSwipeActive,
      direction: state.direction,
    };
  }, []);

  // 重置所有滑动状态
  const resetSwipeStates = useCallback(() => {
    swipeStatesRef.current = {};
    setSwipeStates({});
  }, []);

  return {
    swipeStates,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    cancelSwipe,
    confirmAction,
    getSwipeState,
    resetSwipeStates,
    SWIPE_FIXED_DISTANCE,
  };
}; 