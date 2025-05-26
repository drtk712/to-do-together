"use client";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import ProfileForm from "../components/ProfileForm";
import LoadingSpinner from "../components/LoadingSpinner";
import NotificationIcon from "../components/NotificationIcon";
import FriendsPage from "./friends/page";
import TodosPage from "./todos/page";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("todos");
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  if (!user) {
    return <LoadingSpinner />;
  }

  const tabs = [
    { 
      key: "todos", 
      label: "待办", 
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
      color: "from-blue-500 to-blue-600"
    },
    { 
      key: "friends", 
      label: "好友", 
      icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z",
      color: "from-purple-500 to-purple-600"
    },
    { 
      key: "profile", 
      label: "我的", 
      icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
      color: "from-indigo-500 to-indigo-600"
    }
  ];

  const currentTab = tabs.find(tab => tab.key === activeTab);

  return (
    <div className="h-screen-mobile flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden page-transition">
      {/* 顶部导航栏 - 简化设计 */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex-shrink-0 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700"
      >
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* 左侧：Logo 和当前页面标题 */}
            <div className="flex items-center space-x-3">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className={`w-8 h-8 rounded-lg bg-gradient-to-br ${currentTab.color} flex items-center justify-center shadow-md`}
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={currentTab.icon} />
                </svg>
              </motion.div>
              <div>
                <motion.h1 
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-lg font-semibold text-gray-900 dark:text-white"
                >
                  {currentTab.label}
                </motion.h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  To Do Together
                </p>
              </div>
            </div>
            
            {/* 右侧：通知和菜单 */}
            <div className="flex items-center space-x-2">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <NotificationIcon />
              </motion.div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* 主要内容区域 - 使用 flex-1 和 overflow-hidden */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              duration: 0.3 
            }}
            className="h-full overflow-hidden"
          >
            {activeTab === "todos" && <TodosPage />}
            {activeTab === "friends" && <FriendsPage />}
            {activeTab === "profile" && (
              <div className="h-full overflow-y-auto custom-scrollbar bounce-scroll">
                <div className="p-4">
                  <ProfileForm user={user} />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 底部标签页导航 - 优化设计 */}
      <motion.nav 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.2 }}
        className="flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 safe-area-pb mobile-button"
      >
        <div className="flex">
          {tabs.map((tab, index) => (
            <motion.button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 relative"
              whileTap={{ scale: 0.95 }}
            >
              <div className={`flex flex-col items-center justify-center py-3 px-2 transition-all duration-300 ${
                activeTab === tab.key
                  ? "text-white"
                  : "text-gray-500 dark:text-gray-400"
              }`}>
                
                {/* 活跃状态背景 */}
                {activeTab === tab.key && (
                  <motion.div
                    layoutId="activeTab"
                    className={`absolute inset-0 bg-gradient-to-r ${tab.color} rounded-t-2xl`}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                
                {/* 图标 */}
                <motion.div
                  className="relative z-10"
                  animate={{ 
                    scale: activeTab === tab.key ? 1.1 : 1,
                    y: activeTab === tab.key ? -2 : 0
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                  </svg>
                </motion.div>
                
                {/* 标签文字 */}
                <motion.span 
                  className="text-xs font-medium relative z-10"
                  animate={{ 
                    fontWeight: activeTab === tab.key ? 600 : 500,
                    y: activeTab === tab.key ? -2 : 0
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {tab.label}
                </motion.span>
                
                {/* 活跃指示器 */}
                {activeTab === tab.key && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"
                  />
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </motion.nav>
    </div>
  );
}
