"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { account } from "./appwrite";
import LoadingSpinner from "./components/LoadingSpinner";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 尝试获取当前会话
        const user = await account.get();
        console.log("user", user);
        // 如果成功获取会话，重定向到仪表板
        router.push('/dashboard');
      } catch (error) {
        // 如果获取会话失败，重定向到登录页
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  // 显示加载状态
  return <LoadingSpinner />;
}
