import React from 'react';
import { motion } from 'framer-motion';
import Button from './Button';

// 优先级配置
const PRIORITY_OPTIONS = [
  { value: "high", icon: "🔥", label: "高优先级" },
  { value: "medium", icon: "⭐", label: "中优先级" },
  { value: "low", icon: "🌱", label: "低优先级" }
];

/**
 * Todo过滤器组件
 * 负责管理和显示所有过滤选项
 */
const TodoFilters = React.memo(({ 
  filters, 
  showAll, 
  onTogglePriorityFilter, 
  onToggleShowAll, 
  onResetFilters,
  hasActiveFilters 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
      <div className="space-y-3">
        {/* 优先级筛选 */}
        <div>
          <div className="flex items-center space-x-3">
            {PRIORITY_OPTIONS.map((priority) => (
              <motion.button
                key={priority.value}
                onClick={() => onTogglePriorityFilter(priority.value)}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg border transition-all ${
                  filters.priority.includes(priority.value)
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-lg">{priority.icon}</span>
                <span className="text-sm font-medium">{priority.label}</span>
                {filters.priority.includes(priority.value) && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center"
                  >
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* 状态筛选和重置按钮 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showAll}
              onChange={onToggleShowAll}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-600">
              显示所有状态
            </span>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={onResetFilters}
            disabled={!hasActiveFilters}
            className="px-3 py-1"
          >
            重置
          </Button>
        </div>
      </div>
    </div>
  );
});

TodoFilters.displayName = 'TodoFilters';

export default TodoFilters; 