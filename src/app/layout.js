"use client";
import { useEffect } from "react";
import useAuthStore from "./store/authStore";
import ErrorBoundary from "./components/ErrorBoundary";
import ConfigChecker from "./components/ConfigChecker";
import "./globals.css";
import { Inter } from "next/font/google";
import CacheMonitor from "./components/CacheMonitor";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  // 检查是否为开发环境
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    // 初始化认证状态
    try {
      initializeAuth();
    } catch (error) {
      console.error('Auth initialization failed:', error);
    }
  }, [initializeAuth]);

  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="To Do Together - 协作待办事项管理应用" />
        <title>To Do Together</title>
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <div id="app">
            {children}
          </div>
        </ErrorBoundary>
        
        {/* 开发环境组件 */}
        <ConfigChecker />
        {isDevelopment && (
          <CacheMonitor isVisible={true} />
        )}
      </body>
    </html>
  );
}
