"use client";
import { useState, useEffect } from 'react';
import { APPWRITE_CONFIG, isConfigured } from '../config/appwrite.js';

/**
 * 配置检查组件
 * 在开发环境中显示配置状态，帮助开发者快速定位配置问题
 */
export default function ConfigChecker() {
  const [showChecker, setShowChecker] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // 只在开发环境和客户端显示
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      setShowChecker(true);
      
      const configured = isConfigured();
      
      // 如果配置完整，10秒后隐藏
      if (configured) {
        const timer = setTimeout(() => {
          setIsVisible(false);
        }, 10000); // 10秒
        
        return () => clearTimeout(timer);
      }
    }
  }, []);

  // 生产环境或服务端不显示
  if (!showChecker || !isVisible) {
    return null;
  }

  const configured = isConfigured();

  return (
    <div className="fixed top-4 right-4 z-50">
      {configured ? (
        <div className="bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded shadow animate-pulse">
          <div className="flex items-center">
            <span className="text-green-500 mr-1">✅</span>
            配置完整 (10秒后隐藏)
          </div>
        </div>
      ) : (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded shadow">
          <div className="flex items-center">
            <span className="text-red-500 mr-1">❌</span>
            配置缺失
          </div>
          <div className="text-xs mt-1">
            请检查 .env.local 文件
          </div>
        </div>
      )}
    </div>
  );
} 