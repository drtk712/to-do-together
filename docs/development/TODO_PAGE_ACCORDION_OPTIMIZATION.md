# 待办事项页面手风琴式布局优化

## 概述

为了提升用户体验，将待办事项页面重构为手风琴式（Accordion）布局，包含"我的待办"和"好友待办"两个可折叠部分，实现更清晰的信息组织和交互体验。

## 优化目标

1. **信息分层**: 将个人待办和好友待办清晰分离
2. **空间利用**: 通过折叠机制优化页面空间使用
3. **交互体验**: 提供流畅的展开/收起动画效果
4. **功能扩展**: 为好友待办功能预留完整的展示空间

## 实现方案

### 1. 页面布局重构

#### 原始布局
```
┌─────────────────────────────────────┐
│ 页面头部 (统计信息 + 添加按钮)         │
├─────────────────────────────────────┤
│ 待办事项列表 (所有待办混合显示)        │
│ ├─ 过滤器                           │
│ ├─ 待办事项1                        │
│ ├─ 待办事项2                        │
│ └─ ...                             │
└─────────────────────────────────────┘
```

#### 优化后布局
```
┌─────────────────────────────────────┐
│ 页面头部 (标题 + 添加按钮)            │
├─────────────────────────────────────┤
│ 🔽 我的待办 [数量徽章]                │
│ ├─ 完整的TodoList组件                │
│ │  ├─ 过滤器                        │
│ │  ├─ 待办事项列表                   │
│ │  └─ 滚动区域                      │
├─────────────────────────────────────┤
│ ▶️ 好友待办 [数量徽章]                │
│ └─ FriendTodoList组件               │
│    ├─ 好友待办事项列表               │
│    └─ 滚动区域                      │
└─────────────────────────────────────┘
```

### 2. 核心组件改动

#### 2.1 TodosPage 主页面重构

**文件**: `src/app/dashboard/todos/page.js`

**主要变化**:
```javascript
// 新增状态管理
const [myTodosExpanded, setMyTodosExpanded] = useState(true);
const [friendTodosExpanded, setFriendTodosExpanded] = useState(false);
const [sharedTodoCount, setSharedTodoCount] = useState(0);

// 互斥展开逻辑
const toggleMyTodos = () => {
  setMyTodosExpanded(!myTodosExpanded);
  if (!myTodosExpanded) {
    setFriendTodosExpanded(false); // 确保只有一个部分展开
  }
};
```

**UI结构**:
- 可折叠的头部按钮，包含箭头图标、标题和数量徽章
- 使用`AnimatePresence`和`motion.div`实现平滑的展开/收起动画
- 固定高度容器（400px）确保布局稳定

#### 2.2 FriendTodoList 新组件

**文件**: `src/app/components/FriendTodoList.js`

**核心功能**:
- 获取和显示好友分享的待办事项
- 为每个待办事项显示分享者信息（头像、姓名）
- 与TodoList保持一致的视觉设计
- 独立的加载状态和错误处理

**特色设计**:
```javascript
// 好友信息头部
<div className="flex items-center space-x-2 mb-3 pb-2 border-b border-gray-200">
  {todo.friendAvatar ? (
    <img src={todo.friendAvatar} alt={todo.friendName} className="w-6 h-6 rounded-full" />
  ) : (
    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-medium">
      {todo.friendName.charAt(0).toUpperCase()}
    </div>
  )}
  <span className="text-sm text-gray-600 font-medium">{todo.friendName}</span>
  <span className="text-xs text-gray-400">分享了待办</span>
</div>
```

### 3. 动画效果实现

#### 3.1 箭头旋转动画
```javascript
<motion.div
  animate={{ rotate: myTodosExpanded ? 90 : 0 }}
  transition={{ duration: 0.2 }}
  className="text-gray-500 dark:text-gray-400"
>
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
</motion.div>
```

#### 3.2 内容展开/收起动画
```javascript
<AnimatePresence>
  {myTodosExpanded && (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      style={{ overflow: "hidden" }}
    >
      <div style={{ height: myTodosExpanded ? "400px" : "0" }}>
        <TodoList ref={todoListRef} onCountChange={setTodoCount} />
      </div>
    </motion.div>
  )}
</AnimatePresence>
```

#### 3.3 数量徽章动画
```javascript
<motion.span 
  key={todoCount}
  initial={{ scale: 1.2, color: "#3B82F6" }}
  animate={{ scale: 1, color: "#6B7280" }}
  transition={{ duration: 0.3 }}
  className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full"
>
  {todoCount}
</motion.span>
```

### 4. 后端支持

#### 4.1 新增getSharedTodos方法

**文件**: `src/app/services/todoService.js`

```javascript
// 获取好友分享的待办事项
async getSharedTodos(userId, filters = {}) {
  if (!userId) {
    throw handleApiError(new Error("userId is required"));
  }

  try {
    // 构建查询条件 - 查询所有不是当前用户创建但与其相关的待办事项
    const queries = [
      Query.notEqual("userId", userId), // 不是当前用户创建的
      Query.select([
        "$id", "userId", "title", "description", "dueDate", 
        "priority", "status", "$createdAt", "$updatedAt",
      ]),
    ];

    // 添加过滤和排序
    if (filters.status) {
      queries.push(Query.equal("status", filters.status));
    }
    queries.push(Query.orderDesc("$createdAt"));

    const response = await withRetry(async () => {
      return await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        COLLECTION_ID,
        queries
      );
    }, APP_CONFIG.retry);

    // 暂时返回空数组，预留分享功能实现
    return { documents: [] };
    
  } catch (error) {
    const appError = handleApiError(error);
    logError(appError, { context: "getSharedTodos", userId, filters });
    throw appError;
  }
}
```

## 交互设计细节

### 1. 互斥展开机制
- 同时只能展开一个部分（我的待办 或 好友待办）
- 点击已展开的部分可以收起
- 点击收起的部分会展开并自动收起另一个部分

### 2. 视觉反馈
- **悬停效果**: 按钮悬停时显示主题色背景
- **点击反馈**: 轻微的缩放动画（scale: 0.998）
- **状态指示**: 箭头旋转 + 文字提示（展开/收起）

### 3. 主题色区分
- **我的待办**: 蓝色主题（`rgba(59, 130, 246, 0.05)`）
- **好友待办**: 绿色主题（`rgba(16, 185, 129, 0.05)`）

## 性能优化

### 1. 条件渲染
- 只有展开状态下才渲染内容组件
- 避免不必要的DOM节点和事件监听

### 2. 固定高度容器
- 防止内容变化时的布局抖动
- 提供稳定的滚动体验

### 3. 懒加载数据
- 好友待办数据仅在需要时获取
- 避免页面初始化时的额外网络请求

## 可访问性支持

### 1. 键盘导航
- 支持Tab键在折叠按钮间导航
- 支持Enter/Space键展开/收起

### 2. 屏幕阅读器
- 明确的aria-label和状态描述
- 语义化的HTML结构

### 3. 视觉指引
- 清晰的视觉层次和对比度
- 直观的图标和文字提示

## 未来扩展

### 1. 短期计划
- [ ] 实现真正的好友待办数据获取
- [ ] 添加好友待办的操作功能（评论、点赞等）
- [ ] 支持自定义展开高度

### 2. 中期计划
- [ ] 添加更多可折叠部分（团队待办、共享项目等）
- [ ] 实现拖拽排序功能
- [ ] 支持多部分同时展开模式

### 3. 长期计划
- [ ] 添加搜索和过滤功能到折叠头部
- [ ] 实现个性化的布局保存
- [ ] 支持自定义主题和配色

## 测试要点

### 1. 功能测试
- ✅ 展开/收起动画流畅
- ✅ 互斥展开逻辑正确
- ✅ 数量统计实时更新
- ✅ 错误状态正确显示

### 2. 性能测试
- ✅ 页面加载速度无明显影响
- ✅ 动画性能在低端设备上表现良好
- ✅ 内存使用稳定

### 3. 兼容性测试
- ✅ 各浏览器动画效果一致
- ✅ 移动端触控操作正常
- ✅ 暗色模式显示正确

## 总结

通过手风琴式布局优化，待办事项页面实现了：

1. **更清晰的信息架构** - 个人和好友待办分离显示
2. **更好的空间利用** - 折叠机制节省屏幕空间
3. **更流畅的用户体验** - 丰富的动画效果和交互反馈
4. **更强的扩展性** - 为未来功能预留了架构支持

这次优化为好友协作功能奠定了良好的UI基础，同时保持了原有功能的完整性和性能表现。 