import { databases, ID, Query } from "../appwrite";
import { APPWRITE_CONFIG } from "../config/appwrite.js";
import { handleApiError, logError, withRetry } from "../utils/errorHandler";
import { FRIENDSHIP_STATUS } from "../constants/friendshipStatus";

const COLLECTION_ID = APPWRITE_CONFIG.collections.friendships;

// 导出常量以保持向后兼容性
export { FRIENDSHIP_STATUS };

/**
 * 好友关系服务 - 管理好友关系
 */
export const friendshipService = {
  /**
   * 发送好友请求
   */
  async sendFriendRequest(fromUserId, toUserId) {
    try {
      if (!fromUserId || !toUserId) {
        throw new Error('发送者和接收者ID都是必需的');
      }

      if (fromUserId === toUserId) {
        throw new Error('不能向自己发送好友请求');
      }

      // 检查是否已存在好友关系
      const existingFriendship = await this.getFriendshipBetweenUsers(fromUserId, toUserId);
      if (existingFriendship) {
        if (existingFriendship.status === FRIENDSHIP_STATUS.PENDING) {
          throw new Error('好友请求已发送，请等待对方确认');
        } else if (existingFriendship.status === FRIENDSHIP_STATUS.ACCEPTED) {
          throw new Error('你们已经是好友了');
        } else if (existingFriendship.status === FRIENDSHIP_STATUS.BLOCKED) {
          throw new Error('无法发送好友请求');
        }
      }

      const friendshipDoc = {
        fromUserId,
        toUserId,
        status: FRIENDSHIP_STATUS.PENDING,
        $createdAt: new Date().toISOString(),
        $updatedAt: new Date().toISOString(),
      };

      const result = await withRetry(async () => {
        return await databases.createDocument(
          APPWRITE_CONFIG.databaseId,
          COLLECTION_ID,
          ID.unique(),
          friendshipDoc
        );
      });

      return result;
    } catch (error) {
      logError(error, { context: 'friendshipService.sendFriendRequest', fromUserId, toUserId });
      throw handleApiError(error, '发送好友请求失败');
    }
  },

  /**
   * 接受好友请求
   */
  async acceptFriendRequest(friendshipId, userId) {
    try {
      if (!friendshipId || !userId) {
        throw new Error('好友关系ID和用户ID都是必需的');
      }

      const friendship = await this.getFriendshipForValidation(friendshipId);
      if (!friendship) {
        throw new Error('好友请求不存在');
      }

      if (friendship.toUserId !== userId) {
        throw new Error('只有接收者可以接受好友请求');
      }

      if (friendship.status !== FRIENDSHIP_STATUS.PENDING) {
        throw new Error('该好友请求已处理');
      }

      const result = await withRetry(async () => {
        return await databases.updateDocument(
          APPWRITE_CONFIG.databaseId,
          COLLECTION_ID,
          friendshipId,
          {
            status: FRIENDSHIP_STATUS.ACCEPTED,
            $updatedAt: new Date().toISOString(),
          }
        );
      });

      return result;
    } catch (error) {
      logError(error, { context: 'friendshipService.acceptFriendRequest', friendshipId, userId });
      throw handleApiError(error, '接受好友请求失败');
    }
  },

  /**
   * 拒绝好友请求
   */
  async rejectFriendRequest(friendshipId, userId) {
    try {
      if (!friendshipId || !userId) {
        throw new Error('好友关系ID和用户ID都是必需的');
      }

      const friendship = await this.getFriendshipForValidation(friendshipId);
      if (!friendship) {
        throw new Error('好友请求不存在');
      }

      if (friendship.toUserId !== userId) {
        throw new Error('只有接收者可以拒绝好友请求');
      }

      if (friendship.status !== FRIENDSHIP_STATUS.PENDING) {
        throw new Error('该好友请求已处理');
      }

      const result = await withRetry(async () => {
        return await databases.updateDocument(
          APPWRITE_CONFIG.databaseId,
          COLLECTION_ID,
          friendshipId,
          {
            status: FRIENDSHIP_STATUS.REJECTED,
            $updatedAt: new Date().toISOString(),
          }
        );
      });

      return result;
    } catch (error) {
      logError(error, { context: 'friendshipService.rejectFriendRequest', friendshipId, userId });
      throw handleApiError(error, '拒绝好友请求失败');
    }
  },

  /**
   * 删除好友关系
   */
  async removeFriend(friendshipId, userId) {
    try {
      if (!friendshipId || !userId) {
        throw new Error('好友关系ID和用户ID都是必需的');
      }

      const friendship = await this.getFriendshipForValidation(friendshipId);
      if (!friendship) {
        throw new Error('好友关系不存在');
      }

      // 只有好友关系的参与者才能删除
      if (friendship.fromUserId !== userId && friendship.toUserId !== userId) {
        throw new Error('无权删除此好友关系');
      }

      await withRetry(async () => {
        return await databases.deleteDocument(
          APPWRITE_CONFIG.databaseId,
          COLLECTION_ID,
          friendshipId
        );
      });

      return true;
    } catch (error) {
      logError(error, { context: 'friendshipService.removeFriend', friendshipId, userId });
      throw handleApiError(error, '删除好友关系失败');
    }
  },

  /**
   * 屏蔽用户
   */
  async blockUser(fromUserId, toUserId) {
    try {
      if (!fromUserId || !toUserId) {
        throw new Error('用户ID都是必需的');
      }

      if (fromUserId === toUserId) {
        throw new Error('不能屏蔽自己');
      }

      // 检查是否已存在关系
      const existingFriendship = await this.getFriendshipBetweenUsers(fromUserId, toUserId);
      
      if (existingFriendship) {
        // 更新现有关系为屏蔽状态
        const result = await withRetry(async () => {
          return await databases.updateDocument(
            APPWRITE_CONFIG.databaseId,
            COLLECTION_ID,
            existingFriendship.$id,
            {
              status: FRIENDSHIP_STATUS.BLOCKED,
              $updatedAt: new Date().toISOString(),
            }
          );
        });
        return result;
      } else {
        // 创建新的屏蔽关系
        const friendshipDoc = {
          fromUserId,
          toUserId,
          status: FRIENDSHIP_STATUS.BLOCKED,
          $createdAt: new Date().toISOString(),
          $updatedAt: new Date().toISOString(),
        };

        const result = await withRetry(async () => {
          return await databases.createDocument(
            APPWRITE_CONFIG.databaseId,
            COLLECTION_ID,
            ID.unique(),
            friendshipDoc
          );
        });
        return result;
      }
    } catch (error) {
      logError(error, { context: 'friendshipService.blockUser', fromUserId, toUserId });
      throw handleApiError(error, '屏蔽用户失败');
    }
  },

  /**
   * 获取好友列表
   */
  async getFriends(userId) {
    try {
      if (!userId) {
        throw new Error('用户ID是必需的');
      }

      const result = await withRetry(async () => {
        return await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          COLLECTION_ID,
          [
            Query.or([
              Query.and([
                Query.equal('fromUserId', userId),
                Query.equal('status', FRIENDSHIP_STATUS.ACCEPTED)
              ]),
              Query.and([
                Query.equal('toUserId', userId),
                Query.equal('status', FRIENDSHIP_STATUS.ACCEPTED)
              ])
            ]),
            Query.orderDesc('$updatedAt'),
            Query.limit(100),
            Query.select([
              "$id",
              "fromUserId",
              "toUserId", 
              "status",
              "$createdAt",
              "$updatedAt"
            ])
          ]
        );
      });

      return result.documents;
    } catch (error) {
      logError(error, { context: 'friendshipService.getFriends', userId });
      throw handleApiError(error, '获取好友列表失败');
    }
  },

  /**
   * 获取待处理的好友请求（收到的）
   */
  async getPendingFriendRequests(userId) {
    try {
      if (!userId) {
        throw new Error('用户ID是必需的');
      }

      const result = await withRetry(async () => {
        return await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          COLLECTION_ID,
          [
            Query.equal('toUserId', userId),
            Query.equal('status', FRIENDSHIP_STATUS.PENDING),
            Query.orderDesc('$createdAt'),
            Query.limit(50),
            Query.select([
              "$id",
              "fromUserId",
              "toUserId", 
              "status",
              "$createdAt",
              "$updatedAt"
            ])
          ]
        );
      });

      return result.documents;
    } catch (error) {
      logError(error, { context: 'friendshipService.getPendingFriendRequests', userId });
      throw handleApiError(error, '获取待处理好友请求失败');
    }
  },

  /**
   * 获取发送的好友请求
   */
  async getSentFriendRequests(userId) {
    try {
      if (!userId) {
        throw new Error('用户ID是必需的');
      }

      const result = await withRetry(async () => {
        return await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          COLLECTION_ID,
          [
            Query.equal('fromUserId', userId),
            Query.equal('status', FRIENDSHIP_STATUS.PENDING),
            Query.orderDesc('$createdAt'),
            Query.limit(50),
            Query.select([
              "$id",
              "fromUserId",
              "toUserId", 
              "status",
              "$createdAt",
              "$updatedAt"
            ])
          ]
        );
      });

      return result.documents;
    } catch (error) {
      logError(error, { context: 'friendshipService.getSentFriendRequests', userId });
      throw handleApiError(error, '获取发送的好友请求失败');
    }
  },

  /**
   * 获取两个用户之间的好友关系
   */
  async getFriendshipBetweenUsers(userId1, userId2) {
    try {
      if (!userId1 || !userId2) {
        throw new Error('两个用户ID都是必需的');
      }

      const result = await withRetry(async () => {
        return await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          COLLECTION_ID,
          [
            Query.or([
              Query.and([
                Query.equal('fromUserId', userId1),
                Query.equal('toUserId', userId2)
              ]),
              Query.and([
                Query.equal('fromUserId', userId2),
                Query.equal('toUserId', userId1)
              ])
            ]),
            Query.limit(1),
            Query.select([
              "$id",
              "fromUserId",
              "toUserId", 
              "status",
              "$createdAt",
              "$updatedAt"
            ])
          ]
        );
      });

      return result.documents.length > 0 ? result.documents[0] : null;
    } catch (error) {
      logError(error, { context: 'friendshipService.getFriendshipBetweenUsers', userId1, userId2 });
      throw handleApiError(error, '获取好友关系失败');
    }
  },

  /**
   * 根据ID获取好友关系
   */
  async getFriendshipById(friendshipId) {
    try {
      if (!friendshipId) {
        throw new Error('好友关系ID是必需的');
      }

      const result = await withRetry(async () => {
        return await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          COLLECTION_ID,
          [
            Query.equal('$id', friendshipId),
            Query.limit(1),
            Query.select([
              "$id",
              "fromUserId",
              "toUserId", 
              "status",
              "$createdAt",
              "$updatedAt"
            ])
          ]
        );
      });

      return result.documents.length > 0 ? result.documents[0] : null;
    } catch (error) {
      logError(error, { context: 'friendshipService.getFriendshipById', friendshipId });
      throw handleApiError(error, '获取好友关系详情失败');
    }
  },

  /**
   * 根据ID获取好友关系（仅用于验证，只查询必要字段）
   */
  async getFriendshipForValidation(friendshipId) {
    try {
      if (!friendshipId) {
        throw new Error('好友关系ID是必需的');
      }

      const result = await withRetry(async () => {
        return await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          COLLECTION_ID,
          [
            Query.equal('$id', friendshipId),
            Query.limit(1),
            Query.select([
              "$id",
              "fromUserId",
              "toUserId", 
              "status"
            ])
          ]
        );
      });

      return result.documents.length > 0 ? result.documents[0] : null;
    } catch (error) {
      logError(error, { context: 'friendshipService.getFriendshipForValidation', friendshipId });
      throw handleApiError(error, '获取好友关系验证信息失败');
    }
  },

  /**
   * 检查两个用户是否是好友
   */
  async areFriends(userId1, userId2) {
    try {
      const friendship = await this.getFriendshipBetweenUsers(userId1, userId2);
      return friendship && friendship.status === FRIENDSHIP_STATUS.ACCEPTED;
    } catch (error) {
      logError(error, { context: 'friendshipService.areFriends', userId1, userId2 });
      return false;
    }
  },

  /**
   * 获取好友关系状态
   */
  async getFriendshipStatus(userId1, userId2) {
    try {
      const friendship = await this.getFriendshipBetweenUsers(userId1, userId2);
      return friendship ? friendship.status : null;
    } catch (error) {
      logError(error, { context: 'friendshipService.getFriendshipStatus', userId1, userId2 });
      return null;
    }
  }
}; 