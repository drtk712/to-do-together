import { databases, ID, Query } from "../appwrite";
import { APPWRITE_CONFIG } from "../config/appwrite.js";
import { handleApiError, logError, withRetry } from "../utils/errorHandler";

const COLLECTION_ID = APPWRITE_CONFIG.collections.users;

/**
 * 用户服务 - 管理用户信息
 */
export const userService = {
  /**
   * 创建或更新用户信息（首次登录时自动调用）
   */
  async createOrUpdateUser(userData) {
    try {
      const { userId, email, name, avatar } = userData;
      
      if (!userId || !email) {
        throw new Error('用户ID和邮箱是必需的');
      }

      // 先检查用户是否已存在
      const existingUser = await this.getUserById(userId);
      
      if (existingUser) {
        // 用户已存在，更新信息
        return await this.updateUser(userId, { name, avatar });
      } else {
        // 创建新用户
        const userDoc = {
          userId,
          email: email.toLowerCase(),
          name: name || email.split('@')[0], // 如果没有名字，使用邮箱前缀
          avatar: avatar || null,
          $createdAt: new Date().toISOString(),
          $updatedAt: new Date().toISOString(),
        };

        const result = await withRetry(async () => {
          return await databases.createDocument(
            APPWRITE_CONFIG.databaseId,
            COLLECTION_ID,
            ID.unique(),
            userDoc
          );
        });

        return result;
      }
    } catch (error) {
      logError(error, { context: 'userService.createOrUpdateUser', userData });
      throw handleApiError(error, '创建或更新用户信息失败');
    }
  },

  /**
   * 根据用户ID获取用户信息
   */
  async getUserById(userId) {
    try {
      if (!userId) {
        throw new Error('用户ID是必需的');
      }

      const result = await withRetry(async () => {
        return await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          COLLECTION_ID,
          [
            Query.equal('userId', userId),
            Query.select([
              "$id",
              "userId", 
              "email",
              "name",
              "avatar",
              "$createdAt",
              "$updatedAt"
            ])
          ]
        );
      });

      return result.documents.length > 0 ? result.documents[0] : null;
    } catch (error) {
      logError(error, { context: 'userService.getUserById', userId });
      throw handleApiError(error, '获取用户信息失败');
    }
  },

  /**
   * 根据邮箱精准查询用户
   */
  async getUserByEmail(email) {
    try {
      if (!email) {
        throw new Error('邮箱是必需的');
      }

      const normalizedEmail = email.toLowerCase().trim();
      
      const result = await withRetry(async () => {
        return await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          COLLECTION_ID,
          [
            Query.equal('email', normalizedEmail),
            Query.select([
              "$id",
              "userId", 
              "email",
              "name",
              "avatar",
              "$createdAt",
              "$updatedAt"
            ])
          ]
        );
      });

      return result.documents.length > 0 ? result.documents[0] : null;
    } catch (error) {
      logError(error, { context: 'userService.getUserByEmail', email });
      throw handleApiError(error, '根据邮箱查询用户失败');
    }
  },

  /**
   * 根据用户名精准查询用户
   */
  async getUserByName(name, currentUserId) {
    try {
      if (!name) {
        throw new Error('用户名是必需的');
      }

      const normalizedName = name.trim();
      
      const result = await withRetry(async () => {
        return await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          COLLECTION_ID,
          [
            Query.equal('name', normalizedName),
            Query.notEqual('userId', currentUserId), // 排除当前用户
            Query.limit(10), // 限制结果数量，因为可能有重名
            Query.select([
              "$id",
              "userId", 
              "email",
              "name",
              "avatar"
            ])
          ]
        );
      });

      return result.documents;
    } catch (error) {
      logError(error, { context: 'userService.getUserByName', name, currentUserId });
      throw handleApiError(error, '根据用户名查询用户失败');
    }
  },

  /**
   * 搜索用户（支持邮箱和姓名模糊搜索）
   */
  async searchUsers(searchTerm, currentUserId) {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        return [];
      }

      const term = searchTerm.toLowerCase().trim();
      
      const result = await withRetry(async () => {
        return await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          COLLECTION_ID,
          [
            Query.or([
              Query.search('email', term),
              Query.search('name', term)
            ]),
            Query.notEqual('userId', currentUserId), // 排除当前用户
            Query.limit(20), // 限制结果数量
            Query.select([
              "$id",
              "userId", 
              "email",
              "name",
              "avatar"
            ])
          ]
        );
      });

      return result.documents;
    } catch (error) {
      logError(error, { context: 'userService.searchUsers', searchTerm, currentUserId });
      throw handleApiError(error, '搜索用户失败');
    }
  },

  /**
   * 更新用户信息
   */
  async updateUser(userId, updates) {
    try {
      if (!userId) {
        throw new Error('用户ID是必需的');
      }

      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      const updateData = {
        ...updates,
        $updatedAt: new Date().toISOString(),
      };

      const result = await withRetry(async () => {
        return await databases.updateDocument(
          APPWRITE_CONFIG.databaseId,
          COLLECTION_ID,
          user.$id,
          updateData
        );
      });

      return result;
    } catch (error) {
      logError(error, { context: 'userService.updateUser', userId, updates });
      throw handleApiError(error, '更新用户信息失败');
    }
  },

  /**
   * 获取多个用户信息（根据用户ID列表）
   */
  async getUsersByIds(userIds) {
    try {
      if (!userIds || userIds.length === 0) {
        return [];
      }

      const result = await withRetry(async () => {
        return await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          COLLECTION_ID,
          [
            Query.equal('userId', userIds),
            Query.limit(100),
            Query.select([
              "$id",
              "userId", 
              "email",
              "name",
              "avatar"
            ])
          ]
        );
      });

      return result.documents;
    } catch (error) {
      logError(error, { context: 'userService.getUsersByIds', userIds });
      throw handleApiError(error, '批量获取用户信息失败');
    }
  },

  /**
   * 删除用户信息（谨慎使用）
   */
  async deleteUser(userId) {
    try {
      if (!userId) {
        throw new Error('用户ID是必需的');
      }

      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      await withRetry(async () => {
        return await databases.deleteDocument(
          APPWRITE_CONFIG.databaseId,
          COLLECTION_ID,
          user.$id
        );
      });

      return true;
    } catch (error) {
      logError(error, { context: 'userService.deleteUser', userId });
      throw handleApiError(error, '删除用户信息失败');
    }
  }
}; 