"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useFriendOperations } from '../hooks/useFriendOperations';
import { sharedTodoService } from '../services/sharedTodoService';
import Button from './Button';

/**
 * 分享待办事项模态框组件
 * 允许用户选择好友来分享待办事项
 */
const ShareTodoModal = ({ 
  isOpen, 
  todo, 
  onClose, 
  onSuccess,
  onError 
}) => {
  const { user } = useAuth();
  const { friends, loading: friendsLoading, fetchFriends } = useFriendOperations();
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [isSharing, setIsSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  // 重置状态并获取好友数据
  useEffect(() => {
    if (isOpen) {
      setSelectedFriends([]);
      setShareMessage('');
      // 当模态框打开时，获取好友列表
      if (user?.$id) {
        fetchFriends();
      }
    }
  }, [isOpen, user?.$id, fetchFriends]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const toggleFriendSelection = (friendId) => {
    setSelectedFriends(prev => 
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleShare = async () => {
    if (!todo || !user || selectedFriends.length === 0) return;

    try {
      setIsSharing(true);
      
      // 调用分享服务
      await sharedTodoService.shareTodoWithFriends(
        todo.$id,
        selectedFriends,
        user.$id
      );

      // 通知成功
      if (onSuccess) {
        onSuccess(selectedFriends.length);
      }

      onClose();
    } catch (error) {
      console.error('Share todo error:', error);
      if (onError) {
        onError(error.message || '分享失败，请重试');
      }
    } finally {
      setIsSharing(false);
    }
  };

  if (!todo) return null;

  return (
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
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 头部 */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    分享待办事项
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    选择要分享给的好友
                  </p>
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

            {/* 待办事项信息 */}
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {todo.title}
                  </h4>
                  {todo.description && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {todo.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 好友列表 */}
            <div className="flex-1 overflow-y-auto">
              {friendsLoading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mx-auto"></div>
                  <p className="text-sm text-gray-600 mt-2">加载好友列表...</p>
                </div>
              ) : friends.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="text-4xl mb-2">👥</div>
                  <p className="text-sm text-gray-600">暂无好友</p>
                  <p className="text-xs text-gray-400 mt-1">先添加好友才能分享待办事项</p>
                </div>
              ) : (
                <div className="p-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    选择好友 ({selectedFriends.length} 已选择)
                  </p>
                  <div className="space-y-2">
                    {friends.map((friend) => (
                      <motion.div
                        key={friend.friendshipId}
                        whileTap={{ scale: 0.98 }}
                        className={`
                          p-3 rounded-lg border-2 cursor-pointer transition-all duration-200
                          ${selectedFriends.includes(friend.user.userId)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                          }
                        `}
                        onClick={() => toggleFriendSelection(friend.user.userId)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            {friend.user.avatar ? (
                              <img 
                                src={friend.user.avatar} 
                                alt={friend.user.name}
                                className="w-10 h-10 rounded-full"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-600">
                                  {friend.user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            {selectedFriends.includes(friend.user.userId) && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center"
                              >
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </motion.div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {friend.user.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {friend.user.email}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 底部操作按钮 */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  size="md"
                  onClick={onClose}
                  className="flex-1"
                  disabled={isSharing}
                >
                  取消
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleShare}
                  className="flex-1"
                  disabled={selectedFriends.length === 0 || isSharing}
                  loading={isSharing}
                >
                  {isSharing ? '分享中...' : `分享给 ${selectedFriends.length} 位好友`}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ShareTodoModal; 