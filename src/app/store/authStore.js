import { create } from 'zustand';
import { account } from '../appwrite';
import { safeLocalStorage, handleApiError, logError } from '../utils/errorHandler';

const AUTH_STORAGE_KEY = 'auth_data';

/**
 * 统一的认证状态管理 Store
 * 整合了用户、会话和认证相关的所有功能
 */
const useAuthStore = create((set, get) => ({
  // 状态
  user: null,
  session: null,
  isLoading: false,
  error: null,
  isInitialized: false,

  // 设置认证数据
  setAuth: (userData, sessionData) => {
    try {
      const authData = { user: userData, session: sessionData };
      safeLocalStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
      set({ 
        user: userData, 
        session: sessionData, 
        error: null,
        isInitialized: true 
      });
    } catch (error) {
      const appError = handleApiError(error);
      logError(appError, { context: 'setAuth', userData, sessionData });
      set({ error: appError.getUserMessage() });
    }
  },

  // 设置用户数据
  setUser: (userData) => {
    try {
      const { session } = get();
      const authData = { user: userData, session };
      safeLocalStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
      set({ user: userData, error: null });
    } catch (error) {
      const appError = handleApiError(error);
      logError(appError, { context: 'setUser', userData });
      set({ error: appError.getUserMessage() });
    }
  },

  // 设置会话数据
  setSession: (sessionData) => {
    try {
      const { user } = get();
      const authData = { user, session: sessionData };
      safeLocalStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
      set({ session: sessionData, error: null });
    } catch (error) {
      const appError = handleApiError(error);
      logError(appError, { context: 'setSession', sessionData });
      set({ error: appError.getUserMessage() });
    }
  },

  // 设置加载状态
  setLoading: (isLoading) => {
    set({ isLoading });
  },

  // 设置错误信息
  setError: (error) => {
    const appError = handleApiError(error);
    logError(appError, { context: 'setError' });
    set({ error: appError.getUserMessage() });
  },

  // 清除错误信息
  clearError: () => {
    set({ error: null });
  },

  // 获取用户数据
  fetchUser: async () => {
    set({ isLoading: true, error: null });
    try {
      const userData = await account.get();
      const { session } = get();
      
      const authData = { user: userData, session };
      safeLocalStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
      
      set({ 
        user: userData, 
        isLoading: false,
        error: null,
        isInitialized: true 
      });
      return userData;
    } catch (error) {
      const appError = handleApiError(error);
      logError(appError, { context: 'fetchUser' });
      set({ 
        error: appError.getUserMessage(), 
        isLoading: false,
        isInitialized: true 
      });
      throw appError;
    }
  },

  // 更新用户信息
  updateUser: async (updateData) => {
    set({ isLoading: true, error: null });
    try {
      // 根据更新类型调用不同的API
      let updatedUser;
      
      if (updateData.name) {
        updatedUser = await account.updateName(updateData.name);
      }
      
      if (updateData.email) {
        updatedUser = await account.updateEmail(
          updateData.email, 
          updateData.password
        );
      }
      
      if (updateData.password) {
        await account.updatePassword(
          updateData.newPassword,
          updateData.currentPassword
        );
        // 密码更新后重新获取用户信息
        updatedUser = await account.get();
      }
      
      // 更新本地状态
      if (updatedUser) {
        const { session } = get();
        const authData = { user: updatedUser, session };
        safeLocalStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
        set({ user: updatedUser, isLoading: false, error: null });
        return updatedUser;
      }
      
      set({ isLoading: false });
      return get().user;
    } catch (error) {
      const appError = handleApiError(error);
      logError(appError, { context: 'updateUser', updateData });
      set({ 
        error: appError.getUserMessage(), 
        isLoading: false 
      });
      throw appError;
    }
  },

  // 清除认证数据
  clearAuth: () => {
    try {
      safeLocalStorage.removeItem(AUTH_STORAGE_KEY);
      set({ 
        user: null, 
        session: null, 
        error: null,
        isLoading: false,
        isInitialized: true 
      });
    } catch (error) {
      const appError = handleApiError(error);
      logError(appError, { context: 'clearAuth' });
      // 即使清除失败，也要重置状态
      set({ 
        user: null, 
        session: null, 
        error: appError.getUserMessage(),
        isLoading: false,
        isInitialized: true 
      });
    }
  },

  // 初始化认证数据
  initializeAuth: () => {
    try {
      const stored = safeLocalStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const { user, session } = JSON.parse(stored);
        set({ 
          user, 
          session,
          isInitialized: true,
          error: null 
        });
      } else {
        set({ isInitialized: true });
      }
    } catch (error) {
      const appError = handleApiError(error);
      logError(appError, { context: 'initializeAuth' });
      set({ 
        error: appError.getUserMessage(),
        isInitialized: true 
      });
    }
  },

  // 检查是否已认证
  isAuthenticated: () => {
    const { user, session } = get();
    return !!(user && session);
  },

  // 检查会话是否有效
  isSessionValid: () => {
    const { session } = get();
    if (!session) return false;
    
    // 检查会话是否过期
    const now = new Date();
    const expiryDate = new Date(session.expire);
    return now < expiryDate;
  },

  // 获取用户角色（如果有的话）
  getUserRole: () => {
    const { user } = get();
    return user?.prefs?.role || 'user';
  },

  // 获取用户权限
  getUserPermissions: () => {
    const { user } = get();
    return user?.prefs?.permissions || [];
  },

  // 检查用户是否有特定权限
  hasPermission: (permission) => {
    const permissions = get().getUserPermissions();
    return permissions.includes(permission);
  },

  // 刷新会话
  refreshSession: async () => {
    set({ isLoading: true, error: null });
    try {
      const session = await account.getSession('current');
      const { user } = get();
      
      const authData = { user, session };
      safeLocalStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
      
      set({ 
        session, 
        isLoading: false,
        error: null 
      });
      return session;
    } catch (error) {
      const appError = handleApiError(error);
      logError(appError, { context: 'refreshSession' });
      set({ 
        error: appError.getUserMessage(), 
        isLoading: false 
      });
      throw appError;
    }
  },

  // 获取状态快照（用于调试）
  getStateSnapshot: () => {
    const state = get();
    return {
      hasUser: !!state.user,
      hasSession: !!state.session,
      isLoading: state.isLoading,
      error: state.error,
      isInitialized: state.isInitialized,
      isAuthenticated: state.isAuthenticated(),
      isSessionValid: state.isSessionValid(),
      userRole: state.getUserRole(),
    };
  },
}));

export default useAuthStore; 