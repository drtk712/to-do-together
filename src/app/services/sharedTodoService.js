import { databases, ID, Query } from "../appwrite";
import { APPWRITE_CONFIG, APP_CONFIG } from "../config/appwrite.js";
import { handleApiError, logError, withRetry } from "../utils/errorHandler";

const COLLECTION_ID = APPWRITE_CONFIG.collections.shared_todos;

// 分享状态枚举
export const SHARED_TODO_STATUS = {
  UNREAD: 'unread',     // 未读
  PENDING: 'pending',   // 待处理  
  COMPLETE: 'complete'  // 已完成
};

// 分享待办事项服务
export const sharedTodoService = {
  
  /**
   * 分享待办事项给好友
   * @param {string} todoId - 待办事项ID
   * @param {string[]} friendIds - 好友ID数组
   * @param {string} fromUserId - 分享者ID
   * @returns {Promise<Object[]>} 创建的分享记录数组
   */
  async shareTodoWithFriends(todoId, friendIds, fromUserId) {
    if (!todoId || !friendIds || !Array.isArray(friendIds) || !fromUserId) {
      throw handleApiError(new Error("todoId, friendIds array, and fromUserId are required"));
    }

    try {
      const shareRecords = [];
      
      // 0. 获取待办事项信息和分享者信息
      const { todoService } = await import('./todoService.js');
      const { userService } = await import('./userService.js');
      const { notificationService } = await import('./notificationService.js');
      
      const todo = await todoService.getTodoById(todoId, fromUserId);
      if (!todo) {
        throw new Error("Todo not found or access denied");
      }
      
      const sharer = await userService.getUserById(fromUserId);
      if (!sharer) {
        throw new Error("Sharer user not found");
      }
      
      const sharerName = sharer.name || sharer.email || '好友';
      
      // 1. 首先将分享者自己也加到分享记录中（状态为pending，表示自己可以看到）
      const selfShareData = {
        todoId,
        userId: fromUserId,     // 分享者自己
        fromUserId,             // 分享者ID
        status: SHARED_TODO_STATUS.PENDING, // 分享者默认为pending状态
        $createdAt: new Date().toISOString(),
        $updatedAt: new Date().toISOString(),
      };

      const selfResult = await withRetry(async () => {
        return await databases.createDocument(
          APPWRITE_CONFIG.databaseId,
          COLLECTION_ID,
          ID.unique(),
          selfShareData
        );
      }, APP_CONFIG.retry);

      shareRecords.push(selfResult);
      
      // 2. 为每个好友创建分享记录和通知
      for (const friendId of friendIds) {
        // 创建分享记录
        const shareData = {
          todoId,
          userId: friendId, // 接收分享的用户ID
          fromUserId,       // 分享者ID
          status: SHARED_TODO_STATUS.UNREAD,
          $createdAt: new Date().toISOString(),
          $updatedAt: new Date().toISOString(),
        };

        const result = await withRetry(async () => {
          return await databases.createDocument(
            APPWRITE_CONFIG.databaseId,
            COLLECTION_ID,
            ID.unique(),
            shareData
          );
        }, APP_CONFIG.retry);

        shareRecords.push(result);
        
        // 创建通知
        try {
          await notificationService.createTodoSharedNotification(
            fromUserId,
            friendId,
            sharerName,
            todo.title,
            todoId
          );
        } catch (notificationError) {
          // 通知创建失败不影响主流程，但记录错误
          logError(notificationError, { 
            context: "shareTodoWithFriends.createNotification", 
            fromUserId, 
            friendId, 
            todoId 
          });
        }
      }

      // 3. 更新原待办事项的状态为 'shared'
      await todoService.updateTodo(todoId, { status: 'shared' }, fromUserId);

      return shareRecords;
    } catch (error) {
      const appError = handleApiError(error);
      logError(appError, { context: "shareTodoWithFriends", todoId, friendIds, fromUserId });
      throw appError;
    }
  },

  /**
   * 获取用户收到的分享待办事项
   * @param {string} userId - 用户ID
   * @param {Object} filters - 过滤条件
   * @returns {Promise<Object>} 分享记录列表
   */
  async getSharedTodosForUser(userId, filters = {}) {
    if (!userId) {
      throw handleApiError(new Error("userId is required"));
    }

    try {
      const queries = [
        Query.equal("userId", userId),
        Query.select([
          "$id",
          "todoId", 
          "userId",
          "fromUserId",
          "status",
          "$createdAt",
          "$updatedAt"
        ]),
      ];

      // 添加状态过滤
      if (filters.status) {
        queries.push(Query.equal("status", filters.status));
      }

      // 按创建时间倒序排列
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
      logError(appError, { context: "getSharedTodosForUser", userId, filters });
      throw appError;
    }
  },

  /**
   * 更新分享状态
   * @param {string} shareId - 分享记录ID
   * @param {string} status - 新状态
   * @param {string} userId - 用户ID（权限验证）
   * @returns {Promise<Object>} 更新后的记录
   */
  async updateShareStatus(shareId, status, userId) {
    if (!shareId || !status || !userId) {
      throw handleApiError(new Error("shareId, status, and userId are required"));
    }

    if (!Object.values(SHARED_TODO_STATUS).includes(status)) {
      throw handleApiError(new Error("Invalid status value"));
    }

    try {
      // 先验证用户权限
      const existing = await withRetry(async () => {
        return await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          COLLECTION_ID,
          [
            Query.equal("$id", shareId),
            Query.equal("userId", userId),
            Query.limit(1)
          ]
        );
      }, APP_CONFIG.retry);

      if (existing.documents.length === 0) {
        throw new Error("Share record not found or access denied");
      }

      const result = await withRetry(async () => {
        return await databases.updateDocument(
          APPWRITE_CONFIG.databaseId,
          COLLECTION_ID,
          shareId,
          {
            status,
            $updatedAt: new Date().toISOString(),
          }
        );
      }, APP_CONFIG.retry);

      return result;
    } catch (error) {
      const appError = handleApiError(error);
      logError(appError, { context: "updateShareStatus", shareId, status, userId });
      throw appError;
    }
  },

  /**
   * 删除分享记录
   * @param {string} shareId - 分享记录ID
   * @param {string} userId - 用户ID（权限验证）
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteShare(shareId, userId) {
    if (!shareId || !userId) {
      throw handleApiError(new Error("shareId and userId are required"));
    }

    try {
      // 先验证用户权限（可以是分享者或接收者）
      const existing = await withRetry(async () => {
        return await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          COLLECTION_ID,
          [
            Query.equal("$id", shareId),
            Query.or([
              Query.equal("userId", userId),
              Query.equal("fromUserId", userId)
            ]),
            Query.limit(1)
          ]
        );
      }, APP_CONFIG.retry);

      if (existing.documents.length === 0) {
        throw new Error("Share record not found or access denied");
      }

      await withRetry(async () => {
        return await databases.deleteDocument(
          APPWRITE_CONFIG.databaseId,
          COLLECTION_ID,
          shareId
        );
      }, APP_CONFIG.retry);

      return true;
    } catch (error) {
      const appError = handleApiError(error);
      logError(appError, { context: "deleteShare", shareId, userId });
      throw appError;
    }
  },

  /**
   * 获取待办事项的分享列表
   * @param {string} todoId - 待办事项ID
   * @param {string} fromUserId - 分享者ID
   * @returns {Promise<Object>} 分享列表
   */
  async getSharesForTodo(todoId, fromUserId) {
    if (!todoId || !fromUserId) {
      throw handleApiError(new Error("todoId and fromUserId are required"));
    }

    try {
      const queries = [
        Query.equal("todoId", todoId),
        Query.equal("fromUserId", fromUserId),
        Query.select([
          "$id",
          "todoId",
          "userId", 
          "fromUserId",
          "status",
          "$createdAt",
          "$updatedAt"
        ]),
        Query.orderDesc("$createdAt")
      ];

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
      logError(appError, { context: "getSharesForTodo", todoId, fromUserId });
      throw appError;
    }
  },

  /**
   * 检查待办事项是否已分享给特定用户
   * @param {string} todoId - 待办事项ID
   * @param {string} userId - 用户ID
   * @param {string} fromUserId - 分享者ID
   * @returns {Promise<boolean>} 是否已分享
   */
  async isSharedWithUser(todoId, userId, fromUserId) {
    if (!todoId || !userId || !fromUserId) {
      return false;
    }

    try {
      const result = await withRetry(async () => {
        return await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          COLLECTION_ID,
          [
            Query.equal("todoId", todoId),
            Query.equal("userId", userId),
            Query.equal("fromUserId", fromUserId),
            Query.limit(1)
          ]
        );
      }, APP_CONFIG.retry);

      return result.documents.length > 0;
    } catch (error) {
      logError(error, { context: "isSharedWithUser", todoId, userId, fromUserId });
      return false;
    }
  }
}; 