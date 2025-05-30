# 分享自引用功能实现

## 📋 功能概述

当用户第一次分享待办事项时：
1. **自动添加分享者记录**：将分享者自己也添加到 `shared_todos` 表中
2. **更新待办状态**：将原待办事项的状态设置为 `shared`
3. **显示在"我们的待办"**：分享者可以在"我们的待办"部分看到自己分享的待办

## 🔧 技术实现

### 1. 待办状态扩展

**新增状态常量** (`src/app/services/todoService.js`):
```javascript
export const TODO_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  SHARED: 'shared'  // 新增：已分享状态
};
```

**数据库字段扩展**:
- `status`: 支持 'shared' 状态
- `originalStatus`: 用于记录完成状态切换前的原始状态

### 2. 分享服务更新

**自引用逻辑** (`src/app/services/sharedTodoService.js`):
```javascript
// 1. 为分享者创建记录
const selfShareData = {
  todoId,
  userId: fromUserId,     // 分享者自己
  fromUserId,             // 分享者ID
  status: SHARED_TODO_STATUS.COMPLETE, // 分享者默认为complete状态
};

// 2. 为好友创建分享记录
for (const friendId of friendIds) { ... }

// 3. 更新原待办状态
await todoService.updateTodo(todoId, { status: 'shared' }, fromUserId);
```

### 3. 状态切换优化

**智能状态管理**:
- 从 `completed` 返回时，恢复到 `originalStatus`（可能是 `shared` 或 `pending`）
- 切换到 `completed` 时，记录当前状态到 `originalStatus`

### 4. UI 显示优化

**分享来源识别** (`src/app/components/FriendTodoList.js`):
```javascript
const isMyShare = fromUserId === user.$id;
const friendName = isMyShare ? "我分享的" : (friend?.user.name || "未知用户");
const friendAvatar = isMyShare ? user.avatar : (friend?.user.avatar || null);
```

## 📊 数据流程

### 分享流程
```
1. 用户A创建待办 (status: 'pending')
2. 用户A分享给好友B和C
3. 系统创建记录：
   - shared_todos: {userId: A, fromUserId: A, status: 'complete'}
   - shared_todos: {userId: B, fromUserId: A, status: 'unread'}  
   - shared_todos: {userId: C, fromUserId: A, status: 'unread'}
4. 原待办状态更新: status -> 'shared'
```

### 显示流程
```
用户A查看"我们的待办":
- 获取 shared_todos 记录 (userId: A)
- 关联原始待办数据
- 识别 isMyShare = true
- 显示"我分享的"标签
```

## 🏗️ 数据库结构

### todos 集合字段更新
```javascript
{
  // ... 原有字段
  status: 'pending' | 'completed' | 'shared',
  originalStatus: 'pending' | 'shared' | null  // 新增字段
}
```

### shared_todos 集合结构
```javascript
{
  todoId: string,        // 待办事项ID
  userId: string,        // 接收者ID（包括分享者自己）
  fromUserId: string,    // 分享者ID
  status: 'unread' | 'pending' | 'complete',
  $createdAt: string,
  $updatedAt: string
}
```

## ⚙️ 配置要求

### 环境变量
```env
NEXT_PUBLIC_APPWRITE_DATABASE_COLLECTION_SHARED_TODOS_ID=your_shared_todos_collection_id
```

### Appwrite 数据库字段
在 `todos` 集合中添加:
- `originalStatus` (字符串类型，可选)

## 🎯 用户体验

### 分享者视角
1. 分享待办后，原待办状态变为"已分享"
2. 在"我们的待办"中能看到自己分享的待办
3. 显示"我分享的"标签，区别于好友分享

### 接收者视角
1. 在"我们的待办"中看到好友分享的待办
2. 显示分享者头像和姓名
3. 共享标识徽章

## 🔄 状态管理

### 完成状态切换
- `pending` ↔ `completed`
- `shared` ↔ `completed`  
- 保持原始状态不丢失

### 分享状态管理
- `unread`: 未读取的分享
- `pending`: 待处理的分享  
- `complete`: 已查看的分享

## 🚀 后续扩展

### 可能的功能增强
1. **分享统计**：显示分享给了多少人
2. **分享历史**：查看历史分享记录
3. **取消分享**：撤销分享操作
4. **分享权限**：不同级别的分享权限

### 性能优化
1. **批量操作**：大量好友分享时的批量处理
2. **缓存策略**：分享数据的缓存管理
3. **实时通知**：分享状态的实时更新

---

**✨ 总结**: 分享自引用功能让分享者也能在统一的"我们的待办"界面中管理所有相关的待办事项，提供了一致的用户体验。 