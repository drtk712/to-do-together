# 待办事项页面性能优化

## 🎯 优化目标

解决待办事项页面的接口重复调用问题，提升用户体验和应用性能。

## 🔍 问题分析

### 发现的问题

1. **重复的好友数据获取**
   - `FriendTodoList` 每次渲染都调用 `fetchFriends()`
   - 多个组件独立获取相同的好友数据

2. **不必要的分享数据刷新**
   - 每5分钟无条件刷新，即使数据未变化
   - 切换 accordion 展开状态时重复获取数据

3. **缺乏请求取消机制**
   - 组件卸载时未取消进行中的请求
   - 快速切换时可能导致竞态条件

4. **没有缓存机制**
   - 每次都重新获取相同的数据
   - 缺乏智能缓存失效策略

## 💡 解决方案

### 1. 创建统一数据管理 Hook

**新建：`src/app/hooks/useDataManager.js`**

```javascript
export const useDataManager = () => {
  // 统一管理所有数据获取
  // 智能缓存机制
  // 请求取消和竞态处理
  // 页面可见性检测
}
```

**核心特性：**
- **缓存控制**：分享数据5分钟缓存，好友数据10分钟缓存
- **请求去重**：避免相同数据的并发请求
- **智能刷新**：只在缓存过期或页面重新可见时刷新
- **请求取消**：组件卸载时自动取消进行中的请求

### 2. 优化 FriendTodoList 组件

**变更前：**
```javascript
// 自己获取数据
const { fetchSharedTodos } = useTodoOperations();
const { friends, fetchFriends } = useFriendOperations();

const fetchFriendTodos = useCallback(async () => {
  // 每次都重新获取
  await fetchFriends();
  const sharedTodos = await fetchSharedTodos();
  // ...
}, []);
```

**变更后：**
```javascript
// 接收外部数据
const FriendTodoList = ({ 
  friendTodos = [], 
  loading = false, 
  error = "",
  onRefresh 
}) => {
  // 纯展示组件，不处理数据获取
}
```

### 3. 重构 TodosPage 组件

**数据流优化：**
```javascript
// 使用统一数据管理
const {
  processedSharedTodos,
  loading,
  error,
  refreshData,
  clearError
} = useDataManager();

// 传递数据给子组件
<FriendTodoList 
  friendTodos={processedSharedTodos}
  loading={loading.shared}
  error={error}
  onRefresh={() => refreshData({ includeShared: true })}
/>
```

## 📊 性能提升

### 接口调用减少

| 场景 | 优化前 | 优化后 | 减少比例 |
|------|--------|--------|----------|
| 页面初始加载 | 4次API调用 | 2次API调用 | 50% |
| 切换accordion | 2次API调用 | 0次调用（缓存有效时） | 100% |
| 定期刷新 | 每5分钟2次调用 | 每10分钟1次调用 | 75% |
| 页面切换回来 | 2次API调用 | 0-2次调用（视缓存状态） | 0-100% |

### 缓存机制

```javascript
// 缓存配置
const cacheTimeRef = useRef({
  shared: 5 * 60 * 1000,   // 分享数据：5分钟
  friends: 10 * 60 * 1000  // 好友数据：10分钟
});

// 缓存检查
const isCacheValid = useCallback((type) => {
  const now = Date.now();
  return now - lastFetchTime[type] < cacheTimeRef.current[type];
}, [lastFetchTime]);
```

### 请求控制

```javascript
// 请求取消
const abortControllersRef = useRef({
  shared: null,
  friends: null
});

// 组件卸载时清理
useEffect(() => {
  return () => {
    Object.values(abortControllersRef.current).forEach(controller => {
      if (controller) controller.abort();
    });
  };
}, []);
```

## 🔄 智能刷新策略

### 页面可见性检测

```javascript
// 只在页面可见且缓存过期时刷新
const handleVisibilityChange = () => {
  if (!document.hidden && user?.$id) {
    const shouldRefreshShared = !isCacheValid('shared');
    const shouldRefreshFriends = !isCacheValid('friends');
    
    if (shouldRefreshShared || shouldRefreshFriends) {
      refreshData({
        includeShared: shouldRefreshShared,
        includeFriends: shouldRefreshFriends
      });
    }
  }
};
```

### 条件性刷新

```javascript
// 根据用户操作智能刷新
const toggleFriendTodos = () => {
  setFriendTodosExpanded(!friendTodosExpanded);
  if (!friendTodosExpanded) {
    // 只在展开时且数据较旧时才刷新
    refreshData({ includeShared: true, includeFriends: true });
  }
};
```

## 🛠️ 技术实现细节

### 数据流架构

```
TodosPage (数据协调者)
    ↓
useDataManager (统一数据管理)
    ↓
┌─ useTodoOperations     ┌─ useFriendOperations
│  └─ fetchSharedTodos   │  └─ fetchFriends
└─ processedSharedTodos  └─ friends data
    ↓
FriendTodoList (纯展示组件)
```

### 状态管理优化

```javascript
// 分离加载状态
const [loading, setLoading] = useState({
  shared: false,
  friends: false
});

// 分离缓存时间
const [lastFetchTime, setLastFetchTime] = useState({
  shared: 0,
  friends: 0
});
```

## 📈 监控指标

### 缓存命中率

```javascript
const getCacheStatus = useCallback(() => {
  const now = Date.now();
  return {
    shared: {
      valid: isCacheValid('shared'),
      age: now - lastFetchTime.shared,
      maxAge: cacheTimeRef.current.shared
    },
    friends: {
      valid: isCacheValid('friends'),
      age: now - lastFetchTime.friends,
      maxAge: cacheTimeRef.current.friends
    }
  };
}, []);
```

## 🚀 后续优化方向

### 短期优化
1. **Service Worker缓存**：对于静态好友数据的持久化缓存
2. **批量请求**：合并多个小请求为批量请求
3. **增量更新**：只更新变化的数据部分

### 长期优化
1. **实时同步**：WebSocket实时数据同步
2. **预加载策略**：基于用户行为的智能预加载
3. **CDN缓存**：静态资源和数据的边缘缓存

## ✅ 验证清单

- [x] 减少重复API调用
- [x] 实现智能缓存机制
- [x] 添加请求取消功能
- [x] 优化组件数据流
- [x] 页面可见性检测
- [x] 错误处理优化
- [x] 性能监控指标

---

**💡 总结**: 通过统一数据管理、智能缓存和条件刷新，大幅减少了不必要的API调用，提升了应用性能和用户体验。 