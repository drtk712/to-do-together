import { useRouter } from "next/navigation";
import { account, ID } from "../appwrite";
import useAuthStore from "../store/authStore";
import { cachedTodoService } from "../services/cachedTodoService";
import { userService } from "../services/userService";
import { cachePreloader } from "../utils/cachePreloader";

export const useAuth = () => {
  const router = useRouter();
  const { user, session, setAuth, clearAuth, isAuthenticated } = useAuthStore();

  const login = async (email, password, name = null) => {
    try {
      // 如果是注册，先创建用户
      if (name) {
        await account.create(ID.unique(), email, password, name);
      }
      
      // 创建会话
      const sessionData = await account.createEmailPasswordSession(email, password);
      const userData = await account.get();
      
      // 自动创建或更新用户信息到数据库
      try {
        await userService.createOrUpdateUser({
          userId: userData.$id,
          email: userData.email,
          name: userData.name || name,
          avatar: userData.prefs?.avatar || null
        });
      } catch (userError) {
        console.warn("创建用户信息失败，但登录成功:", userError.message);
        // 不阻止登录流程，只记录警告
      }
      
      setAuth(userData, sessionData);
      
      // 启动缓存预加载
      cachePreloader.preloadUserData(userData.$id).catch(error => {
        console.warn('Cache preload failed:', error);
      });
      
      router.push("/dashboard");
      return { success: true, user: userData };
    } catch (error) {
      throw new Error(error.message);
    }
  };

  const logout = async () => {
    try {
      const currentUserId = user?.$id;
      
      if (session) {
        await account.deleteSession(session.$id);
      }
      
      // 清除认证状态
      clearAuth();
      
      // 清除用户相关的所有缓存和同步队列
      if (currentUserId) {
        cachedTodoService.invalidateTodoCache(currentUserId);
        // 清除同步队列
        const { todoService } = await import('../services/todoService');
        todoService.clearSyncQueue(currentUserId);
      } else {
        // 如果没有用户ID，清除所有缓存和同步队列
        cachedTodoService.cleanupCache();
        const { todoService } = await import('../services/todoService');
        todoService.clearSyncQueue();
      }
      
      router.push("/login");
      return { success: true };
    } catch (error) {
      console.error("Logout failed:", error);
      // 即使API调用失败，也要清除本地状态和缓存
      const currentUserId = user?.$id;
      clearAuth();
      
      // 清除缓存和同步队列
      if (currentUserId) {
        cachedTodoService.invalidateTodoCache(currentUserId);
        const { todoService } = await import('../services/todoService');
        todoService.clearSyncQueue(currentUserId);
      } else {
        cachedTodoService.cleanupCache();
        const { todoService } = await import('../services/todoService');
        todoService.clearSyncQueue();
      }
      
      router.push("/login");
      return { success: false, error: error.message };
    }
  };

  const checkAuth = async () => {
    try {
      if (!user) {
        const userData = await account.get();
        const currentSession = await account.getSession('current');
        setAuth(userData, currentSession);
        
        // 如果是恢复会话，也启动缓存预加载
        cachePreloader.preloadUserData(userData.$id).catch(error => {
          console.warn('Cache preload failed during auth check:', error);
        });
        
        return userData;
      }
      return user;
    } catch (error) {
      clearAuth();
      throw error;
    }
  };

  return {
    user,
    session,
    login,
    logout,
    checkAuth,
    isAuthenticated: isAuthenticated(),
  };
}; 