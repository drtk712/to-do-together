import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';
import ShareTodoModal from './ShareTodoModal';

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

const PRIORITY_NAMES = {
  high: "高优先级",
  medium: "中优先级", 
  low: "低优先级",
};

/**
 * Todo详情模态框组件
 * 显示todo的完整信息和操作选项
 */
const TodoDetailModal = React.memo(({ 
  isOpen, 
  todo, 
  onClose, 
  onStatusChange, 
  onDelete,
  formatDate,
  onShareSuccess
}) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  if (!todo) return null;

  const handleComplete = () => {
    onStatusChange(todo.$id, 'completed');
    onClose();
  };

  const handleDelete = () => {
    onDelete(todo.$id);
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleShareSuccess = (friendCount) => {
    setShareMessage(`已成功分享给 ${friendCount} 位好友`);
    setTimeout(() => setShareMessage(''), 3000);
    if (onShareSuccess) {
      onShareSuccess(friendCount);
    }
  };

  const handleShareError = (error) => {
    setShareMessage(`分享失败: ${error}`);
    setTimeout(() => setShareMessage(''), 3000);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={handleBackdropClick}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 头部 */}
              <div className={`p-6 rounded-t-2xl ${PRIORITY_BACKGROUNDS[todo.priority]}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{PRIORITY_ICONS[todo.priority]}</span>
                    <span className="text-sm font-medium text-gray-700">
                      {PRIORITY_NAMES[todo.priority]}
                    </span>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center hover:bg-white/70 transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* 内容 */}
              <div className="p-6 space-y-4">
                {/* 分享成功/失败消息 */}
                {shareMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-lg text-sm ${
                      shareMessage.includes('成功') 
                        ? 'bg-green-50 text-green-600' 
                        : 'bg-red-50 text-red-600'
                    }`}
                  >
                    {shareMessage}
                  </motion.div>
                )}

                {/* 标题 */}
                <div>
                  <h3 className={`text-xl font-semibold leading-tight ${
                    todo.status === 'completed' 
                      ? 'line-through text-gray-600' 
                      : 'text-gray-900'
                  }`}>
                    {todo.title}
                  </h3>
                  {todo.status === 'completed' && (
                    <div className="flex items-center space-x-1 mt-2">
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        ✓ 已完成
                      </span>
                    </div>
                  )}
                </div>

                {/* 描述 */}
                {todo.description && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">描述</h4>
                    <p className="text-gray-600 leading-relaxed break-words whitespace-pre-wrap">
                      {todo.description}
                    </p>
                  </div>
                )}

                {/* 详细信息 */}
                <div className="space-y-3 border-t border-gray-100 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">截止日期</span>
                    <span className="text-sm text-gray-600">
                      {todo.dueDate ? formatDate(todo.dueDate).split(' ')[0] : "无"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">创建时间</span>
                    <span className="text-sm text-gray-600">
                      {formatDate(todo.$createdAt)}
                    </span>
                  </div>
                  {todo.$updatedAt && todo.$updatedAt !== todo.$createdAt && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">更新时间</span>
                      <span className="text-sm text-gray-600">
                        {formatDate(todo.$updatedAt)}
                      </span>
                    </div>
                  )}
                </div>

                {/* 操作按钮 */}
                <div className="space-y-3 pt-4">
                  {/* 分享按钮 */}
                  <Button
                    variant="outline"
                    size="md"
                    onClick={handleShare}
                    className="w-full flex items-center justify-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    <span>分享给好友</span>
                  </Button>

                  {/* 完成和删除按钮 */}
                  <div className="flex space-x-3">
                    {todo.status !== 'completed' && (
                      <Button
                        variant="success"
                        size="md"
                        onClick={handleComplete}
                        className="flex-1"
                      >
                        ✓ 标记完成
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      size="md"
                      onClick={handleDelete}
                      className="flex-1"
                    >
                      🗑 删除
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 分享模态框 */}
      <ShareTodoModal
        isOpen={showShareModal}
        todo={todo}
        onClose={() => setShowShareModal(false)}
        onSuccess={handleShareSuccess}
        onError={handleShareError}
      />
    </>
  );
});

TodoDetailModal.displayName = 'TodoDetailModal';

export default TodoDetailModal; 