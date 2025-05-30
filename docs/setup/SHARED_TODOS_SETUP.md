# 分享待办功能设置指南

## 概述

分享待办功能允许用户将自己的待办事项分享给好友，好友可以查看分享的待办事项但不能修改。

## 数据库集合结构

### 1. shared_todos 集合

需要在Appwrite中创建一个新的集合 `shared_todos`，包含以下字段：

| 字段名 | 类型 | 必需 | 描述 |
|--------|------|------|------|
| `$id` | String | 是 | 系统生成的唯一ID |
| `todoId` | String | 是 | 被分享的待办事项ID |
| `userId` | String | 是 | 接收分享的用户ID |
| `fromUserId` | String | 是 | 分享者的用户ID |
| `status` | String | 是 | 分享状态：unread/pending/complete |
| `$createdAt` | DateTime | 是 | 创建时间 |
| `$updatedAt` | DateTime | 是 | 更新时间 |

### 2. 集合权限设置

为 `shared_todos` 集合设置以下权限：

**读取权限**：
- `users` (任何登录用户都可以读取自己相关的分享记录)

**创建权限**：
- `users` (任何登录用户都可以创建分享记录)

**更新权限**：
- `users` (只能更新自己接收到的分享记录)

**删除权限**：
- `users` (可以删除自己创建或接收的分享记录)

### 3. 索引设置

建议为以下字段创建索引以提升查询性能：

- `todoId` (单字段索引)
- `userId` (单字段索引) 
- `fromUserId` (单字段索引)
- `status` (单字段索引)
- `userId, status` (复合索引)
- `fromUserId, todoId` (复合索引)

## 环境变量配置

在 `.env.local` 文件中添加新的集合ID：

```env
# 现有的环境变量...
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id

# 现有的集合ID
NEXT_PUBLIC_APPWRITE_DATABASE_COLLECTION_TODOS_ID=your_todos_collection_id
NEXT_PUBLIC_APPWRITE_DATABASE_COLLECTION_USERS_ID=your_users_collection_id
NEXT_PUBLIC_APPWRITE_DATABASE_COLLECTION_FRIENDSHIPS_ID=your_friendships_collection_id
NEXT_PUBLIC_APPWRITE_DATABASE_COLLECTION_NOTIFICATIONS_ID=your_notifications_collection_id

# 新增：分享待办集合ID
NEXT_PUBLIC_APPWRITE_DATABASE_COLLECTION_SHARED_TODOS_ID=your_shared_todos_collection_id
```

## 功能特性

### 1. 分享待办事项

- 在待办事项详情页面点击"分享给好友"按钮
- 可以多选要分享的好友
- 分享后好友会在"我们的待办"部分看到分享的内容

### 2. 查看分享的待办

- 好友分享的待办显示在"我们的待办"部分
- 显示分享者的头像和姓名
- 标明是"共享"内容

### 3. 分享状态管理

- `unread`: 新分享，未读状态
- `pending`: 已查看，处理中状态  
- `complete`: 已完成状态

## API 接口

### sharedTodoService

新增的分享服务提供以下方法：

- `shareTodoWithFriends(todoId, friendIds, fromUserId)` - 分享待办给好友
- `getSharedTodosForUser(userId, filters)` - 获取用户收到的分享
- `updateShareStatus(shareId, status, userId)` - 更新分享状态
- `deleteShare(shareId, userId)` - 删除分享记录
- `getSharesForTodo(todoId, fromUserId)` - 获取待办的分享列表
- `isSharedWithUser(todoId, userId, fromUserId)` - 检查是否已分享

## 组件更新

### 1. ShareTodoModal

新的分享模态框组件，提供：
- 好友列表显示
- 多选好友功能
- 分享操作处理
- 加载和错误状态

### 2. TodoDetailModal

更新的详情模态框，新增：
- 分享按钮
- 分享成功/失败提示
- 集成ShareTodoModal

### 3. FriendTodoList

更新的好友待办列表，支持：
- 显示分享者信息
- 分享状态标识
- 分享时间显示

## 测试指南

### 1. 创建测试数据

1. 确保有至少2个测试用户账号
2. 在两个账号之间建立好友关系
3. 在第一个账号中创建一些待办事项

### 2. 测试分享功能

1. 在第一个账号中打开待办详情
2. 点击"分享给好友"按钮
3. 选择要分享的好友
4. 确认分享操作

### 3. 测试接收功能

1. 切换到第二个账号
2. 进入待办事项页面
3. 点击"我们的待办"部分
4. 确认能看到分享的待办事项

## 故障排除

### 1. 分享按钮不显示

检查：
- 用户是否已登录
- 是否有好友关系
- ShareTodoModal组件是否正确导入

### 2. 分享后好友看不到

检查：
- shared_todos集合权限设置
- 环境变量配置是否正确
- 网络请求是否成功

### 3. 好友列表为空

检查：
- useFriendOperations hook是否正常工作
- friendships集合数据是否正确
- 好友关系状态是否为accepted

## 安全注意事项

1. **权限验证**: 确保用户只能分享自己的待办事项
2. **数据验证**: 验证friendIds数组中的用户确实是好友关系
3. **状态保护**: 防止恶意修改他人的分享状态
4. **隐私保护**: 确保分享内容只对指定好友可见

## 扩展建议

1. **批量操作**: 支持批量分享多个待办事项
2. **分享权限**: 允许设置分享权限（查看/编辑/评论）
3. **通知集成**: 分享时发送通知给接收者
4. **分享历史**: 记录和查看分享历史
5. **过期机制**: 设置分享的有效期 