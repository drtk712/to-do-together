import { userService } from './userService';
import { friendshipService } from './friendshipService';
import { notificationService } from './notificationService';
import { logError, handleApiError } from '../utils/errorHandler';
import { FRIENDSHIP_STATUS } from '../constants/friendshipStatus';

/**
 * 综合好友服务 - 整合用户信息、好友关系和通知功能
 */
export { FRIENDSHIP_STATUS };

export const friendService = {
  /**
   * 根据邮箱搜索并添加好友
   */
  async addFriendByEmail(currentUserId, friendEmail) {
    try {
      if (!currentUserId || !friendEmail) {
        throw new Error('当前用户ID和好友邮箱都是必需的');
      }

      // 1. 根据邮箱查找用户
      const friendUser = await userService.getUserByEmail(friendEmail);
      if (!friendUser) {
        throw new Error('未找到该邮箱对应的用户');
      }

      if (friendUser.userId === currentUserId) {
        throw new Error('不能添加自己为好友');
      }

      // 2. 获取当前用户信息（用于通知）
      const currentUser = await userService.getUserById(currentUserId);
      if (!currentUser) {
        throw new Error('当前用户信息不存在');
      }

      // 3. 发送好友请求
      const friendship = await friendshipService.sendFriendRequest(currentUserId, friendUser.userId);

      // 4. 创建通知
      await notificationService.createFriendRequestNotification(
        currentUserId,
        friendUser.userId,
        currentUser.name || currentUser.email
      );

      return {
        friendship,
        friendUser: {
          userId: friendUser.userId,
          name: friendUser.name,
          email: friendUser.email,
          avatar: friendUser.avatar
        }
      };
    } catch (error) {
      logError(error, { context: 'friendService.addFriendByEmail', currentUserId, friendEmail });
      throw handleApiError(error, '添加好友失败');
    }
  },

  /**
   * 通过邮箱精准查询用户
   */
  async searchUserByEmail(email, currentUserId) {
    try {
      if (!email || !currentUserId) {
        throw new Error('邮箱和当前用户ID都是必需的');
      }

      // 1. 根据邮箱查找用户
      const user = await userService.getUserByEmail(email);
      if (!user) {
        return null;
      }

      if (user.userId === currentUserId) {
        throw new Error('不能添加自己为好友');
      }

      // 2. 获取好友关系状态
      const friendshipStatus = await friendshipService.getFriendshipStatus(currentUserId, user.userId);

      return {
        userId: user.userId,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        friendshipStatus
      };
    } catch (error) {
      logError(error, { context: 'friendService.searchUserByEmail', email, currentUserId });
      throw handleApiError(error, '通过邮箱查询用户失败');
    }
  },

  /**
   * 通过用户名精准查询用户
   */
  async searchUsersByName(name, currentUserId) {
    try {
      if (!name || !currentUserId) {
        throw new Error('用户名和当前用户ID都是必需的');
      }

      // 1. 根据用户名查找用户
      const users = await userService.getUserByName(name, currentUserId);
      if (!users || users.length === 0) {
        return [];
      }

      // 2. 为每个用户添加好友关系状态
      const usersWithStatus = await Promise.all(
        users.map(async (user) => {
          try {
            const friendshipStatus = await friendshipService.getFriendshipStatus(currentUserId, user.userId);
            return {
              userId: user.userId,
              name: user.name,
              email: user.email,
              avatar: user.avatar,
              friendshipStatus
            };
          } catch (error) {
            logError(error, { context: 'friendService.searchUsersByName.getStatus', userId: user.userId });
            return {
              userId: user.userId,
              name: user.name,
              email: user.email,
              avatar: user.avatar,
              friendshipStatus: null
            };
          }
        })
      );

      return usersWithStatus;
    } catch (error) {
      logError(error, { context: 'friendService.searchUsersByName', name, currentUserId });
      throw handleApiError(error, '通过用户名查询用户失败');
    }
  },



  /**
   * 发送好友请求（通过用户对象）
   */
  async sendFriendRequest(currentUserId, targetUser) {
    try {
      if (!currentUserId || !targetUser) {
        throw new Error('当前用户ID和目标用户都是必需的');
      }

      if (targetUser.userId === currentUserId) {
        throw new Error('不能添加自己为好友');
      }

      // 1. 获取当前用户信息（用于通知）
      const currentUser = await userService.getUserById(currentUserId);
      if (!currentUser) {
        throw new Error('当前用户信息不存在');
      }

      // 2. 发送好友请求
      const friendship = await friendshipService.sendFriendRequest(currentUserId, targetUser.userId);

      // 3. 创建通知
      await notificationService.createFriendRequestNotification(
        currentUserId,
        targetUser.userId,
        currentUser.name || currentUser.email
      );

      return {
        friendship,
        friendUser: {
          userId: targetUser.userId,
          name: targetUser.name,
          email: targetUser.email,
          avatar: targetUser.avatar
        }
      };
    } catch (error) {
      logError(error, { context: 'friendService.sendFriendRequest', currentUserId, targetUser });
      throw handleApiError(error, '发送好友请求失败');
    }
  },

  /**
   * 获取好友列表（包含用户详细信息）
   */
  async getFriendsWithDetails(userId) {
    try {
      if (!userId) {
        throw new Error('用户ID是必需的');
      }

      // 1. 获取好友关系列表
      const friendships = await friendshipService.getFriends(userId);

      if (friendships.length === 0) {
        return [];
      }

      // 2. 提取好友的用户ID
      const friendUserIds = friendships.map(friendship => {
        return friendship.fromUserId === userId ? friendship.toUserId : friendship.fromUserId;
      });

      // 3. 批量获取好友的用户信息
      const friendUsers = await userService.getUsersByIds(friendUserIds);

      // 4. 合并好友关系和用户信息
      const friendsWithDetails = friendships.map(friendship => {
        const friendUserId = friendship.fromUserId === userId ? friendship.toUserId : friendship.fromUserId;
        const friendUser = friendUsers.find(user => user.userId === friendUserId);
        
        return {
          friendshipId: friendship.$id,
          friendship,
          user: friendUser ? {
            userId: friendUser.userId,
            name: friendUser.name,
            email: friendUser.email,
            avatar: friendUser.avatar
          } : null
        };
      }).filter(item => item.user !== null); // 过滤掉用户信息不存在的记录

      return friendsWithDetails;
    } catch (error) {
      logError(error, { context: 'friendService.getFriendsWithDetails', userId });
      throw handleApiError(error, '获取好友列表失败');
    }
  },

  /**
   * 获取待处理的好友请求（包含发送者信息）
   */
  async getPendingRequestsWithDetails(userId) {
    try {
      if (!userId) {
        throw new Error('用户ID是必需的');
      }

      // 1. 获取待处理的好友请求
      const pendingRequests = await friendshipService.getPendingFriendRequests(userId);

      if (pendingRequests.length === 0) {
        return [];
      }

      // 2. 提取发送者的用户ID
      const senderUserIds = pendingRequests.map(request => request.fromUserId);

      // 3. 批量获取发送者的用户信息
      const senderUsers = await userService.getUsersByIds(senderUserIds);

      // 4. 合并请求和用户信息
      const requestsWithDetails = pendingRequests.map(request => {
        const senderUser = senderUsers.find(user => user.userId === request.fromUserId);
        
        return {
          requestId: request.$id,
          request,
          sender: senderUser ? {
            userId: senderUser.userId,
            name: senderUser.name,
            email: senderUser.email,
            avatar: senderUser.avatar
          } : null
        };
      }).filter(item => item.sender !== null);

      return requestsWithDetails;
    } catch (error) {
      logError(error, { context: 'friendService.getPendingRequestsWithDetails', userId });
      throw handleApiError(error, '获取待处理好友请求失败');
    }
  },

  /**
   * 接受好友请求
   */
  async acceptFriendRequest(requestId, userId) {
    try {
      if (!requestId || !userId) {
        throw new Error('请求ID和用户ID都是必需的');
      }

      // 1. 接受好友请求
      const updatedFriendship = await friendshipService.acceptFriendRequest(requestId, userId);

      // 2. 获取当前用户信息
      const currentUser = await userService.getUserById(userId);
      if (!currentUser) {
        throw new Error('当前用户信息不存在');
      }

      // 3. 创建接受通知给发送者
      await notificationService.createFriendAcceptedNotification(
        userId,
        updatedFriendship.fromUserId,
        currentUser.name || currentUser.email
      );

      return updatedFriendship;
    } catch (error) {
      logError(error, { context: 'friendService.acceptFriendRequest', requestId, userId });
      throw handleApiError(error, '接受好友请求失败');
    }
  },

  /**
   * 拒绝好友请求
   */
  async rejectFriendRequest(requestId, userId) {
    try {
      if (!requestId || !userId) {
        throw new Error('请求ID和用户ID都是必需的');
      }

      const result = await friendshipService.rejectFriendRequest(requestId, userId);
      return result;
    } catch (error) {
      logError(error, { context: 'friendService.rejectFriendRequest', requestId, userId });
      throw handleApiError(error, '拒绝好友请求失败');
    }
  },

  /**
   * 删除好友
   */
  async removeFriend(friendshipId, userId) {
    try {
      if (!friendshipId || !userId) {
        throw new Error('好友关系ID和用户ID都是必需的');
      }

      const result = await friendshipService.removeFriend(friendshipId, userId);
      return result;
    } catch (error) {
      logError(error, { context: 'friendService.removeFriend', friendshipId, userId });
      throw handleApiError(error, '删除好友失败');
    }
  },

  /**
   * 屏蔽用户
   */
  async blockUser(currentUserId, targetUserId) {
    try {
      if (!currentUserId || !targetUserId) {
        throw new Error('当前用户ID和目标用户ID都是必需的');
      }

      const result = await friendshipService.blockUser(currentUserId, targetUserId);
      return result;
    } catch (error) {
      logError(error, { context: 'friendService.blockUser', currentUserId, targetUserId });
      throw handleApiError(error, '屏蔽用户失败');
    }
  },

  /**
   * 检查两个用户是否是好友
   */
  async areFriends(userId1, userId2) {
    try {
      return await friendshipService.areFriends(userId1, userId2);
    } catch (error) {
      logError(error, { context: 'friendService.areFriends', userId1, userId2 });
      return false;
    }
  },

  /**
   * 获取好友关系状态
   */
  async getFriendshipStatus(userId1, userId2) {
    try {
      return await friendshipService.getFriendshipStatus(userId1, userId2);
    } catch (error) {
      logError(error, { context: 'friendService.getFriendshipStatus', userId1, userId2 });
      return null;
    }
  },

  /**
   * 获取发送的好友请求（包含接收者信息）
   */
  async getSentRequestsWithDetails(userId) {
    try {
      if (!userId) {
        throw new Error('用户ID是必需的');
      }

      // 1. 获取发送的好友请求
      const sentRequests = await friendshipService.getSentFriendRequests(userId);

      if (sentRequests.length === 0) {
        return [];
      }

      // 2. 提取接收者的用户ID
      const receiverUserIds = sentRequests.map(request => request.toUserId);

      // 3. 批量获取接收者的用户信息
      const receiverUsers = await userService.getUsersByIds(receiverUserIds);

      // 4. 合并请求和用户信息
      const requestsWithDetails = sentRequests.map(request => {
        const receiverUser = receiverUsers.find(user => user.userId === request.toUserId);
        
        return {
          requestId: request.$id,
          request,
          receiver: receiverUser ? {
            userId: receiverUser.userId,
            name: receiverUser.name,
            email: receiverUser.email,
            avatar: receiverUser.avatar
          } : null
        };
      }).filter(item => item.receiver !== null);

      return requestsWithDetails;
    } catch (error) {
      logError(error, { context: 'friendService.getSentRequestsWithDetails', userId });
      throw handleApiError(error, '获取发送的好友请求失败');
    }
  },

  /**
   * 取消发送的好友请求
   */
  async cancelFriendRequest(requestId, userId) {
    try {
      if (!requestId || !userId) {
        throw new Error('请求ID和用户ID都是必需的');
      }

      // 验证请求是否属于当前用户
      const friendship = await friendshipService.getFriendshipById(requestId);
      if (!friendship || friendship.fromUserId !== userId) {
        throw new Error('无权取消此好友请求');
      }

      if (friendship.status !== FRIENDSHIP_STATUS.PENDING) {
        throw new Error('只能取消待处理的好友请求');
      }

      const result = await friendshipService.removeFriend(requestId, userId);
      return result;
    } catch (error) {
      logError(error, { context: 'friendService.cancelFriendRequest', requestId, userId });
      throw handleApiError(error, '取消好友请求失败');
    }
  }
};