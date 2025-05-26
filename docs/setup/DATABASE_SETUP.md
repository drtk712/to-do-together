# Appwrite 数据库设置指南

## 概述

本项目需要在 Appwrite 中创建以下集合来支持好友功能：

## 1. 用户信息集合 (users)

**集合ID**: `users`

### 字段配置

| 字段名 | 类型 | 必填 | 默认值 | 描述 |
|--------|------|------|--------|------|
| userId | String | ✓ | - | Appwrite 用户ID |
| email | String | ✓ | - | 用户邮箱 |
| name | String | ✓ | - | 用户姓名 |
| avatar | String | ✗ | null | 头像URL |
| $createdAt | DateTime | ✓ | - | 创建时间 |
| $updatedAt | DateTime | ✓ | - | 更新时间 |

### 索引配置

- `userId` - 唯一索引
- `email` - 唯一索引，用于邮箱查询
- `name` - 全文搜索索引

### 权限设置

- **创建**: 用户 (Users)
- **读取**: 用户 (Users) 
- **更新**: 用户 (Users)
- **删除**: 用户 (Users)

## 2. 好友关系集合 (friendships)

**集合ID**: `friendships`

### 字段配置

| 字段名 | 类型 | 必填 | 默认值 | 描述 |
|--------|------|------|--------|------|
| fromUserId | String | ✓ | - | 发送请求的用户ID |
| toUserId | String | ✓ | - | 接收请求的用户ID |
| status | String | ✓ | pending | 关系状态 (pending/accepted/rejected/blocked) |
| $createdAt | DateTime | ✓ | - | 创建时间 |
| $updatedAt | DateTime | ✓ | - | 更新时间 |

### 索引配置

- `fromUserId` - 普通索引
- `toUserId` - 普通索引
- `status` - 普通索引
- `fromUserId,toUserId` - 复合索引（确保唯一性）

### 权限设置

- **创建**: 用户 (Users)
- **读取**: 用户 (Users)
- **更新**: 用户 (Users)
- **删除**: 用户 (Users)

## 3. 消息提醒集合 (notifications)

**集合ID**: `notifications`

### 字段配置

| 字段名 | 类型 | 必填 | 默认值 | 描述 |
|--------|------|------|--------|------|
| toUserId | String | ✓ | - | 接收通知的用户ID |
| fromUserId | String | ✗ | null | 发送通知的用户ID |
| type | String | ✓ | - | 通知类型 |
| title | String | ✓ | - | 通知标题 |
| message | String | ✓ | - | 通知内容 |
| data | String | ✗ | {} | 附加数据 (JSON字符串) |
| actionUrl | String | ✗ | null | 操作链接 |
| status | String | ✓ | unread | 状态 (unread/read/archived) |
| $createdAt | DateTime | ✓ | - | 创建时间 |
| $updatedAt | DateTime | ✓ | - | 更新时间 |

### 索引配置

- `toUserId` - 普通索引
- `fromUserId` - 普通索引
- `type` - 普通索引
- `status` - 普通索引
- `toUserId,status` - 复合索引

### 权限设置

- **创建**: 用户 (Users)
- **读取**: 用户 (Users)
- **更新**: 用户 (Users)
- **删除**: 用户 (Users)

## 设置步骤

### 1. 登录 Appwrite 控制台

访问你的 Appwrite 控制台并选择对应的项目。

### 2. 创建数据库

如果还没有数据库，请先创建一个数据库。

### 3. 创建集合

按照上述配置为每个集合创建相应的字段和索引。

### 4. 配置权限

确保每个集合的权限设置正确，允许用户进行相应的操作。

### 5. 更新环境变量

确保 `.env.local` 文件中包含所有必需的环境变量：

```env
# Appwrite 基础配置
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_STORAGE_ID=your_storage_id

# 数据库配置
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id

# 集合配置
NEXT_PUBLIC_APPWRITE_DATABASE_COLLECTION_TODOS_ID=todos
NEXT_PUBLIC_APPWRITE_DATABASE_COLLECTION_USERS_ID=users
NEXT_PUBLIC_APPWRITE_DATABASE_COLLECTION_FRIENDSHIPS_ID=friendships
NEXT_PUBLIC_APPWRITE_DATABASE_COLLECTION_NOTIFICATIONS_ID=notifications
```

## 注意事项

1. **数据一致性**: 确保用户在首次登录时自动创建用户信息记录
2. **权限控制**: 用户只能访问和修改自己相关的数据
3. **索引优化**: 根据查询需求创建合适的索引以提高性能
4. **数据清理**: 定期清理过期的通知和无效的好友关系

## 测试

创建集合后，可以通过以下方式测试：

1. 注册新用户，检查是否自动创建用户信息
2. 搜索用户并发送好友请求
3. 接受/拒绝好友请求
4. 查看通知功能是否正常工作

## 故障排除

如果遇到问题，请检查：

1. 集合ID是否与代码中的配置一致
2. 字段类型和名称是否正确
3. 权限设置是否允许用户操作
4. 索引是否正确创建 