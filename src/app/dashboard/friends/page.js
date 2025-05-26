"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useFriendOperations } from "../../hooks/useFriendOperations";
import LoadingSpinner from "../../components/LoadingSpinner";
import AddFriendModal from "../../components/AddFriendModal";
import Image from "next/image";
import { motion } from "framer-motion";

const FriendsPage = () => {
  const { user } = useAuth();
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const isInitialMount = useRef(true);

  // 使用自定义Hook管理好友操作
  const {
    friends,
    loading,
    error,
    fetchFriends,
    removeFriend,
    clearError,
  } = useFriendOperations();

  // 删除好友 - 使用乐观更新
  const handleRemoveFriend = async (friendshipId) => {
    if (!confirm("确定要删除这个好友吗？")) return;
    
    const success = await removeFriend(friendshipId);
    if (success) {
      // 可以添加成功提示，但不需要手动刷新数据
      // alert("已删除好友");
    }
  };

  // 处理添加好友成功 - 简化处理
  const handleAddFriendSuccess = () => {
    // 发送好友请求不需要刷新好友列表
    // 只有当好友请求被接受时才会更新好友列表
    // 这里可以添加成功提示等其他逻辑
  };

  // 处理模态框关闭
  const handleCloseModal = () => {
    setIsAddFriendModalOpen(false);
  };

  // 初始化数据获取 - 只在组件挂载时执行一次
  useEffect(() => {
    if (isInitialMount.current && user) {
      fetchFriends();
      isInitialMount.current = false;
    }
  }, [fetchFriends, user]);

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
              {friends.length} 位好友
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              一起完成更多任务
            </p>
          </div>
          
          {/* 添加好友按钮 - 优化动画效果 */}
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
              boxShadow: "0 8px 20px rgba(139, 92, 246, 0.3)"
            }}
            whileTap={{ scale: 0.9, rotate: 45 }}
            onClick={() => setIsAddFriendModalOpen(true)}
            className="relative p-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl shadow-lg transition-all duration-300 mobile-button"
          >
            {/* 背景光晕效果 */}
            <motion.div
              className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-400 to-purple-500 opacity-0"
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
              className="absolute inset-0 rounded-2xl border-2 border-purple-300 opacity-0"
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

      {/* 错误提示 */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-4 p-3 bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-200 rounded-lg flex items-center justify-between"
        >
          <span>{error}</span>
          <button
            onClick={clearError}
            className="ml-3 text-red-400 hover:text-red-600 dark:hover:text-red-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </motion.div>
      )}

      {/* 好友列表内容 - 使用 flex-1 和 overflow-hidden */}
      <div className="flex-1 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
                     className="h-full overflow-y-auto px-4 py-4 custom-scrollbar bounce-scroll"
        >
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : friends.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="text-gray-400 text-6xl mb-4">👥</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                还没有好友
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                点击右上角的 + 按钮开始添加好友吧！
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsAddFriendModalOpen(true)}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                添加第一个好友
              </motion.button>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {friends.map((friend, index) => (
                <motion.div
                  key={friend.friendshipId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center shadow-md">
                          {friend.user.avatar ? (
                            <Image
                              src={friend.user.avatar}
                              alt={friend.user.name}
                              width={48}
                              height={48}
                              className="rounded-full"
                              unoptimized
                            />
                          ) : (
                            <span className="text-white font-semibold text-lg">
                              {friend.user.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {friend.user.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {friend.user.email}
                        </p>
                      </div>
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleRemoveFriend(friend.friendshipId)}
                      className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* 添加好友弹窗 */}
      <AddFriendModal
        isOpen={isAddFriendModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleAddFriendSuccess}
      />
    </div>
  );
};

export default FriendsPage; 