"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useFriendOperations } from "../hooks/useFriendOperations";
import { FRIENDSHIP_STATUS } from "../constants/friendshipStatus";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const AddFriendModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const { 
    sendFriendRequest, 
    searchUserByEmail, 
    searchUsersByName 
  } = useFriendOperations();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
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
    setSearchTerm("");
    setSearchResults([]);
    setError("");
    setIsSearching(false);
  };

  // 关闭弹窗
  const handleClose = () => {
    onClose();
  };

  // 搜索用户 - 使用Hook的缓存搜索方法
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError("请输入搜索内容");
      return;
    }

    try {
      setIsSearching(true);
      setError("");
      setSearchResults([]);
      
      // 检查是否是邮箱格式
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(searchTerm.trim());
      
      if (isEmail) {
        // 通过邮箱精准查询用户（使用缓存）
        const result = await searchUserByEmail(searchTerm.trim());
        if (result) {
          setSearchResults([result]);
        } else {
          setError("未找到该邮箱对应的用户");
        }
      } else {
        // 通过用户名精准查询用户（使用缓存）
        const results = await searchUsersByName(searchTerm.trim());
        if (results.length === 0) {
          setError("未找到该用户名对应的用户");
        } else {
          setSearchResults(results);
        }
      }
    } catch (error) {
      console.error("搜索用户失败:", error);
      setError(error.message || "搜索失败，请重试");
    } finally {
      setIsSearching(false);
    }
  };

  // 发送好友请求 - 使用hook方法
  const handleSendRequest = async (targetUser) => {
    try {
      setError("");
      
      // 使用hook中的sendFriendRequest方法（会自动处理缓存）
      const success = await sendFriendRequest(targetUser.userId, targetUser);
      
      if (success) {
        // 更新搜索结果中的状态
        setSearchResults(prev => 
          prev.map(result => 
            result.userId === targetUser.userId 
              ? { ...result, friendshipStatus: FRIENDSHIP_STATUS.PENDING }
              : result
          )
        );
        
        // 不需要刷新好友列表，因为发送请求不会立即改变好友关系
        // 只在真正需要时才调用onSuccess（比如显示成功消息）
        if (onSuccess) {
          onSuccess();
        }
        
        // 显示成功消息
        alert("好友请求已发送！");
      }
    } catch (error) {
      console.error("发送好友请求失败:", error);
      setError(error.message || "发送失败，请重试");
    }
  };

  // 键盘事件处理
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="friend-modal"
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
                添加好友
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

              {/* 搜索区域 - 移动端优化 */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="mb-6"
              >
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  搜索用户
                </label>
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                  <motion.input
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35, duration: 0.3 }}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="输入邮箱地址或用户名"
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors text-base"
                  />
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSearch}
                    disabled={isSearching || !searchTerm.trim()}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 font-medium"
                  >
                    {isSearching ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>搜索中</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span>搜索</span>
                      </>
                    )}
                  </motion.button>
                </div>
                
                {/* 搜索提示 */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.45, duration: 0.3 }}
                  className="mt-3"
                >
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    💡 支持邮箱地址或完整用户名的精准搜索
                  </p>
                </motion.div>
              </motion.div>

              {/* 搜索结果 - 移动端优化 */}
              {searchResults.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="space-y-4"
                >
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    搜索结果
                  </h3>
                  
                  {searchResults.map((result, index) => (
                    <motion.div
                      key={result.userId}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ 
                        delay: 0.4 + index * 0.1, 
                        duration: 0.3,
                        type: "spring",
                        stiffness: 200
                      }}
                      whileHover={{ scale: 1.02 }}
                      className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                          {result.avatar ? (
                            <Image
                              src={result.avatar}
                              alt={result.name}
                              width={48}
                              height={48}
                              className="rounded-full"
                              unoptimized
                            />
                          ) : (
                            <span className="text-white font-medium text-lg">
                              {result.name?.charAt(0)?.toUpperCase() || "?"}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {result.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {result.email}
                          </p>
                        </div>
                      </div>
                      
                      {/* 状态和操作按钮 */}
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center">
                          {result.friendshipStatus === FRIENDSHIP_STATUS.ACCEPTED && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="flex items-center space-x-2 text-green-600 dark:text-green-400"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span className="text-sm font-medium">已是好友</span>
                            </motion.div>
                          )}
                          
                          {result.friendshipStatus === FRIENDSHIP_STATUS.PENDING && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="flex items-center space-x-2 text-yellow-600 dark:text-yellow-400"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                              </svg>
                              <span className="text-sm font-medium">已发送</span>
                            </motion.div>
                          )}
                          
                          {result.friendshipStatus === FRIENDSHIP_STATUS.BLOCKED && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="flex items-center space-x-2 text-red-600 dark:text-red-400"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                              </svg>
                              <span className="text-sm font-medium">已屏蔽</span>
                            </motion.div>
                          )}
                        </div>
                        
                        {!result.friendshipStatus && (
                          <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSendRequest(result)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                          >
                            添加好友
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* 空状态 */}
              {!isSearching && searchTerm && searchResults.length === 0 && !error && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="text-center py-8"
                >
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                    className="text-gray-400 text-3xl mb-2"
                  >
                    🔍
                  </motion.div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    没有找到匹配的用户
                  </p>
                </motion.div>
              )}

              {/* 初始状态 */}
              {!searchTerm && searchResults.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="text-center py-8"
                >
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                    className="text-gray-400 text-3xl mb-2"
                  >
                    👥
                  </motion.div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                    搜索并添加新朋友
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs">
                    输入邮箱地址或用户名开始搜索
                  </p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddFriendModal; 