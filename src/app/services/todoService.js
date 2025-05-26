import { databases, ID, Query } from "../appwrite";
import { APPWRITE_CONFIG, APP_CONFIG } from "../config/appwrite.js";
import {
  safeLocalStorage,
  handleApiError,
  handleCacheError,
  logError,
  withRetry,
} from "../utils/errorHandler";

const COLLECTION_ID = APPWRITE_CONFIG.collections.todos;

// 同步队列相关常量
const SYNC_QUEUE_KEY = "todo_sync_queue";

// 同步队列管理（保留离线同步功能）
const syncQueueManager = {
  get: (userId) => {
    if (!userId) {
      logError(new Error("userId is required for sync queue operations"), {
        context: "syncQueueManager.get",
      });
      return [];
    }

    try {
      const key = `${SYNC_QUEUE_KEY}_${userId}`;
      const queue = safeLocalStorage.getItem(key);
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      handleCacheError(error, "sync queue read");
      return [];
    }
  },

  add: (action, userId) => {
    if (!userId) {
      logError(new Error("userId is required for sync queue operations"), {
        context: "syncQueueManager.add",
      });
      return false;
    }

    try {
      const key = `${SYNC_QUEUE_KEY}_${userId}`;
      const queue = syncQueueManager.get(userId);

      // 使用统一的标识符：类型_ID
      const actionIdentifier = `${action.type}_${action.data.$id}`;

      // 检查是否已存在相同的操作，如果存在则更新，否则添加
      const existingIndex = queue.findIndex(
        (item) => item.id === actionIdentifier
      );

      if (existingIndex >= 0) {
        queue[existingIndex] = {
          ...action,
          id: actionIdentifier,
          timestamp: Date.now(),
          retryCount: queue[existingIndex].retryCount || 0,
        };
      } else {
        queue.push({
          ...action,
          id: actionIdentifier,
          timestamp: Date.now(),
          retryCount: 0,
        });
      }

      const success = safeLocalStorage.setItem(key, JSON.stringify(queue));
      if (success) {
        triggerSync(userId);
      }
      return success;
    } catch (error) {
      handleCacheError(error, "sync queue write");
      return false;
    }
  },

  remove: (actionId, userId) => {
    if (!userId) {
      return false;
    }

    try {
      const key = `${SYNC_QUEUE_KEY}_${userId}`;
      const queue = syncQueueManager.get(userId);
      const newQueue = queue.filter((item) => item.id !== actionId);
      return safeLocalStorage.setItem(key, JSON.stringify(newQueue));
    } catch (error) {
      handleCacheError(error, "sync queue remove");
      return false;
    }
  },

  clear: (userId) => {
    try {
      if (userId) {
        // 清除特定用户的同步队列
        const key = `${SYNC_QUEUE_KEY}_${userId}`;
        return safeLocalStorage.removeItem(key);
      } else {
        // 清除所有同步队列
        if (typeof window !== "undefined") {
          const keys = Object.keys(localStorage);
          keys.forEach((key) => {
            if (key.startsWith(SYNC_QUEUE_KEY)) {
              safeLocalStorage.removeItem(key);
            }
          });
        }
        return true;
      }
    } catch (error) {
      handleCacheError(error, "sync queue clear");
      return false;
    }
  },

  // 获取待同步的操作数量
  getPendingCount: (userId) => {
    return syncQueueManager.get(userId).length;
  },

  // 获取同步队列状态
  getQueueStatus: (userId) => {
    const queue = syncQueueManager.get(userId);
    return {
      total: queue.length,
      byType: queue.reduce((acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
      }, {}),
      oldestTimestamp: queue.length > 0 ? Math.min(...queue.map(item => item.timestamp)) : null
    };
  }
};

// 同步状态管理
const syncStates = new Map();

// 触发异步同步
const triggerSync = (userId) => {
  if (!userId) return;

  const state = syncStates.get(userId) || { isSyncing: false, timeout: null };

  if (state.timeout) {
    clearTimeout(state.timeout);
  }

  state.timeout = setTimeout(async () => {
    if (!state.isSyncing) {
      await processSyncQueue(userId);
    }
  }, 1000);

  syncStates.set(userId, state);
};

// 处理同步队列
const processSyncQueue = async (userId) => {
  if (!userId) return;

  const state = syncStates.get(userId) || { isSyncing: false };
  if (state.isSyncing) return;

  const queue = syncQueueManager.get(userId);
  if (queue.length === 0) return;

  state.isSyncing = true;
  syncStates.set(userId, state);

  try {
    for (const action of queue) {
      try {
        // 使用重试机制执行同步操作
        await withRetry(async () => {
          let serverResponse = null;
          switch (action.type) {
            case "CREATE":
              serverResponse = await databases.createDocument(
                APPWRITE_CONFIG.databaseId,
                COLLECTION_ID,
                action.data.$id,
                action.data
              );
              break;
            case "UPDATE":
              serverResponse = await databases.updateDocument(
                APPWRITE_CONFIG.databaseId,
                COLLECTION_ID,
                action.data.$id,
                action.data
              );
              break;
            case "DELETE":
              await databases.deleteDocument(
                APPWRITE_CONFIG.databaseId,
                COLLECTION_ID,
                action.data.$id
              );
              break;
          }
          return serverResponse;
        }, APP_CONFIG.retry);

        // 同步成功后，使用action的唯一标识符移除队列项
        const actionIdentifier = `${action.type}_${action.data.$id}`;
        syncQueueManager.remove(actionIdentifier, userId);
      } catch (error) {
        const appError = handleApiError(error);
        logError(appError, {
          context: "processSyncQueue",
          action,
          userId,
          attempt: action.retryCount + 1,
        });

        if (action.retryCount >= APP_CONFIG.retry.maxAttempts) {
          const actionIdentifier = `${action.type}_${action.data.$id}`;
          syncQueueManager.remove(actionIdentifier, userId);
        } else {
          const queue = syncQueueManager.get(userId);
          const updatedQueue = queue.map((item) =>
            item.id === action.id
              ? { ...item, retryCount: item.retryCount + 1 }
              : item
          );
          safeLocalStorage.setItem(
            `${SYNC_QUEUE_KEY}_${userId}`,
            JSON.stringify(updatedQueue)
          );
        }
      }
    }
  } finally {
    state.isSyncing = false;
    syncStates.set(userId, state);

    // 检查是否还有需要同步的操作
    const remainingQueue = syncQueueManager.get(userId);
    if (remainingQueue.length > 0) {
      triggerSync(userId);
    }
  }
};

export const todoService = {
  // 创建待办事项（仅处理API调用和离线队列）
  async createTodo({
    title,
    description,
    dueDate,
    priority,
    status = "pending",
    userId,
  }) {
    if (!userId) {
      throw handleApiError(new Error("userId is required"));
    }

    try {
      const todoData = {
        title,
        description,
        dueDate,
        priority,
        status,
        userId,
        $createdAt: new Date().toISOString(),
        $updatedAt: new Date().toISOString(),
      };

      const tempId = ID.unique();
      todoData.$id = tempId;

      // 尝试直接创建，如果失败则添加到同步队列
      try {
        const result = await withRetry(async () => {
          return await databases.createDocument(
            APPWRITE_CONFIG.databaseId,
            COLLECTION_ID,
            tempId,
            todoData
          );
        }, APP_CONFIG.retry);

        return result;
      } catch (error) {
        // 网络错误或服务器错误，添加到离线同步队列
        console.warn('Failed to create todo online, adding to sync queue:', error.message);
        
        syncQueueManager.add(
          {
            type: "CREATE",
            data: todoData,
          },
          userId
        );

        // 返回临时数据，让上层处理乐观更新
        return todoData;
      }
    } catch (error) {
      const appError = handleApiError(error);
      logError(appError, { context: "createTodo", title, userId });
      throw appError;
    }
  },

  // 获取待办事项列表（纯API调用，不涉及缓存）
  async getTodos(userId, filters = {}) {
    if (!userId) {
      throw handleApiError(new Error("userId is required"));
    }

    try {
      // 构建查询条件
      const queries = [
        Query.equal("userId", userId),
        Query.select([
          "$id",
          "userId",
          "title",
          "description",
          "dueDate",
          "priority",
          "status",
          "$createdAt",
          "$updatedAt",
        ]),
      ];

      // 添加过滤条件
      if (filters.status) {
        queries.push(Query.equal("status", filters.status));
      }

      if (filters.priority && filters.priority.length > 0) {
        queries.push(Query.equal("priority", filters.priority));
      }

      // 添加排序
      queries.push(Query.orderDesc("$createdAt"));

      const response = await withRetry(async () => {
        return await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          COLLECTION_ID,
          queries
        );
      }, APP_CONFIG.retry);

      return response;
    } catch (error) {
      const appError = handleApiError(error);
      logError(appError, { context: "getTodos", userId, filters });
      throw appError;
    }
  },

  // 更新待办事项
  async updateTodo(todoId, updates, userId) {
    if (!userId) {
      throw handleApiError(new Error("userId is required"));
    }

    if (!todoId) {
      throw handleApiError(new Error("todoId is required"));
    }

    try {
      const updatedData = {
        ...updates,
        $updatedAt: new Date().toISOString(),
      };

      // 尝试直接更新，如果失败则添加到同步队列
      try {
        const result = await withRetry(async () => {
          return await databases.updateDocument(
            APPWRITE_CONFIG.databaseId,
            COLLECTION_ID,
            todoId,
            updatedData
          );
        }, APP_CONFIG.retry);

        return result;
      } catch (error) {
        // 网络错误或服务器错误，添加到离线同步队列
        console.warn('Failed to update todo online, adding to sync queue:', error.message);
        
        syncQueueManager.add(
          {
            type: "UPDATE",
            data: { $id: todoId, ...updatedData },
          },
          userId
        );

        // 返回更新后的数据，让上层处理乐观更新
        return { $id: todoId, ...updatedData };
      }
    } catch (error) {
      const appError = handleApiError(error);
      logError(appError, { context: "updateTodo", todoId, updates, userId });
      throw appError;
    }
  },

  // 删除待办事项
  async deleteTodo(todoId, userId) {
    if (!userId) {
      throw handleApiError(new Error("userId is required"));
    }

    if (!todoId) {
      throw handleApiError(new Error("todoId is required"));
    }

    try {
      // 尝试直接删除，如果失败则添加到同步队列
      try {
        await withRetry(async () => {
          return await databases.deleteDocument(
            APPWRITE_CONFIG.databaseId,
            COLLECTION_ID,
            todoId
          );
        }, APP_CONFIG.retry);

        return true;
      } catch (error) {
        // 网络错误或服务器错误，添加到离线同步队列
        console.warn('Failed to delete todo online, adding to sync queue:', error.message);
        
        syncQueueManager.add(
          {
            type: "DELETE",
            data: { $id: todoId },
          },
          userId
        );

        return true;
      }
    } catch (error) {
      const appError = handleApiError(error);
      logError(appError, { context: "deleteTodo", todoId, userId });
      throw appError;
    }
  },

  // 更新待办事项状态
  async updateTodoStatus(todoId, status, userId) {
    return this.updateTodo(todoId, { status }, userId);
  },

  // 切换待办事项完成状态
  async toggleTodoComplete(todoId, userId) {
    if (!userId) {
      throw handleApiError(new Error("userId is required"));
    }

    if (!todoId) {
      throw handleApiError(new Error("todoId is required"));
    }

    try {
      // 首先获取当前待办事项状态
      const todo = await withRetry(async () => {
        return await databases.getDocument(
          APPWRITE_CONFIG.databaseId,
          COLLECTION_ID,
          todoId
        );
      }, APP_CONFIG.retry);

      // 切换状态
      const newStatus = todo.status === 'completed' ? 'pending' : 'completed';
      
      // 更新状态
      return await this.updateTodoStatus(todoId, newStatus, userId);
    } catch (error) {
      const appError = handleApiError(error);
      logError(appError, { context: "toggleTodoComplete", todoId, userId });
      throw appError;
    }
  },

  // 清除同步队列
  clearSyncQueue: (userId) => {
    try {
      syncQueueManager.clear(userId);
      if (userId) {
        syncStates.delete(userId);
      } else {
        syncStates.clear();
      }
      return true;
    } catch (error) {
      const appError = handleCacheError(error, "clear sync queue");
      logError(appError, { context: "clearSyncQueue", userId });
      return false;
    }
  },

  // 手动触发同步
  manualSync: async (userId) => {
    if (!userId) {
      throw handleApiError(new Error("userId is required"));
    }

    try {
      await processSyncQueue(userId);
      return true;
    } catch (error) {
      const appError = handleApiError(error);
      logError(appError, { context: "manualSync", userId });
      throw appError;
    }
  },

  // 获取同步状态
  getSyncStatus: (userId) => {
    if (!userId) return null;

    const queueStatus = syncQueueManager.getQueueStatus(userId);
    const state = syncStates.get(userId);

    return {
      queueLength: queueStatus.total,
      isSyncing: state?.isSyncing || false,
      queueByType: queueStatus.byType,
      oldestPendingTimestamp: queueStatus.oldestTimestamp,
      pendingOperations: syncQueueManager.get(userId).map((item) => ({
        type: item.type,
        id: item.data.$id,
        retryCount: item.retryCount,
        timestamp: item.timestamp,
      })),
    };
  },

  // 检查是否有待同步的操作
  hasPendingSync: (userId) => {
    return syncQueueManager.getPendingCount(userId) > 0;
  },

  // 获取待同步操作数量
  getPendingSyncCount: (userId) => {
    return syncQueueManager.getPendingCount(userId);
  }
};
