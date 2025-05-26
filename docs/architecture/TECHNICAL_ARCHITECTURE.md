# To Do Together - 技术架构文档

## 🏗️ 系统架构概览

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        前端应用层                              │
├─────────────────────────────────────────────────────────────┤
│  Next.js App Router  │  React Components  │  Framer Motion  │
│  Tailwind CSS       │  Zustand Store     │  Custom Hooks   │
├─────────────────────────────────────────────────────────────┤
│                        缓存管理层                              │
├─────────────────────────────────────────────────────────────┤
│  Cache Manager      │  TTL + LRU         │  Performance     │
│  Service Layer      │  Optimistic Update │  Monitoring      │
├─────────────────────────────────────────────────────────────┤
│                        服务接口层                              │
├─────────────────────────────────────────────────────────────┤
│  Auth Service       │  Todo Service      │  Friend Service  │
│  Error Handling     │  Data Validation   │  API Abstraction │
├─────────────────────────────────────────────────────────────┤
│                        后端服务层                              │
├─────────────────────────────────────────────────────────────┤
│                        Appwrite BaaS                         │
│  Database          │  Authentication    │  Storage         │
│  Real-time         │  Functions         │  Security        │
└─────────────────────────────────────────────────────────────┘
```

## 📱 前端架构

### 1. 组件架构

#### 组件层次结构
```
App Layout (layout.js)
├── Dashboard (dashboard/page.js)
│   ├── Navigation Header
│   ├── Tab Content
│   │   ├── TodosPage (dashboard/todos/page.js)
│   │   │   ├── Fixed Header
│   │   │   ├── TodoList Component
│   │   │   │   ├── TodoFilters
│   │   │   │   ├── TodoItem[]
│   │   │   │   └── TodoDetailModal
│   │   │   └── AddTodoModal
│   │   ├── FriendsPage (dashboard/friends/page.js)
│   │   │   ├── Fixed Header
│   │   │   ├── Friend List
│   │   │   └── AddFriendModal
│   │   └── ProfilePage
│   └── Bottom Navigation
├── Auth Pages
│   ├── Login (login/page.js)
│   └── Register (register/page.js)
└── Global Components
    ├── LoadingSpinner
    ├── CacheMonitor
    └── NotificationIcon
```

#### 组件设计原则
- **单一职责**: 每个组件只负责一个功能
- **可复用性**: 通用组件可在多处使用
- **状态提升**: 共享状态提升到合适的父组件
- **Props接口**: 清晰的Props定义和类型检查

### 2. 状态管理架构

#### Zustand Store 结构
```javascript
// authStore.js
{
  user: User | null,
  session: Session | null,
  isLoading: boolean,
  setAuth: (user, session) => void,
  clearAuth: () => void,
  checkAuth: () => Promise<void>
}
```

#### 本地状态管理
- **组件状态**: useState for UI state
- **表单状态**: 受控组件模式
- **缓存状态**: 自定义Hook管理
- **异步状态**: useEffect + useState 模式

### 3. 路由架构

#### Next.js App Router 结构
```
src/app/
├── page.js                 # 首页 (/)
├── layout.js               # 根布局
├── globals.css             # 全局样式
├── login/
│   └── page.js            # 登录页 (/login)
├── register/
│   └── page.js            # 注册页 (/register)
└── dashboard/
    ├── page.js            # Dashboard主页 (/dashboard)
    ├── todos/
    │   └── page.js        # 待办页面 (/dashboard/todos)
    └── friends/
        └── page.js        # 好友页面 (/dashboard/friends)
```

#### 路由保护策略
- **认证检查**: useAuth Hook自动检查登录状态
- **重定向逻辑**: 未登录用户重定向到登录页
- **会话管理**: 自动刷新和过期处理

## 🔧 服务层架构

### 1. 服务分层设计

#### 基础服务层
```javascript
// authService.js - 认证服务
class AuthService {
  async login(email, password)
  async register(email, password, name)
  async logout()
  async getCurrentUser()
  async updateProfile(data)
}

// todoService.js - 待办事项服务
class TodoService {
  async getTodos(userId, filters)
  async createTodo(data)
  async updateTodo(id, data)
  async deleteTodo(id)
  async toggleComplete(id)
}

// friendshipService.js - 好友服务
class FriendshipService {
  async getFriends(userId)
  async sendFriendRequest(fromUserId, toUserId)
  async acceptFriendRequest(requestId)
  async removeFriend(friendshipId)
}
```

#### 缓存服务层
```javascript
// cachedTodoService.js - 带缓存的待办服务
class CachedTodoService extends TodoService {
  constructor() {
    this.cache = globalCache;
    this.baseService = new TodoService();
  }

  async getTodos(userId, filters) {
    const cacheKey = `todos:${userId}:${JSON.stringify(filters)}`;
    
    // 尝试从缓存获取
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;
    
    // 缓存未命中，调用基础服务
    const result = await this.baseService.getTodos(userId, filters);
    
    // 存入缓存
    this.cache.set(cacheKey, result, 120000); // 2分钟TTL
    return result;
  }
}
```

### 2. 错误处理架构

#### 统一错误处理
```javascript
// 服务层错误处理
class ServiceError extends Error {
  constructor(message, code, details) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

// Hook层错误处理
const useTodoOperations = () => {
  const [error, setError] = useState("");
  
  const handleError = (err) => {
    if (err instanceof ServiceError) {
      setError(err.message);
    } else {
      setError("操作失败，请重试");
    }
    console.error("Todo operation error:", err);
  };
};
```

## 💾 缓存系统架构

### 1. 缓存管理器设计

#### 核心缓存类
```javascript
class CacheManager {
  constructor(options = {}) {
    this.cache = new Map();           // 主缓存存储
    this.ttlMap = new Map();          // TTL时间戳
    this.accessOrder = [];            // LRU访问顺序
    this.dependencyMap = new Map();   // 依赖关系
    this.maxSize = options.maxSize || 1000;
    this.defaultTTL = options.defaultTTL || 300000;
  }

  // 核心方法
  set(key, value, ttl)              // 设置缓存
  get(key)                          // 获取缓存
  delete(key)                       // 删除缓存
  invalidate(pattern)               // 批量失效
  cleanup()                         // 清理过期
  getStats()                        // 获取统计
}
```

#### 缓存策略
- **TTL (Time To Live)**: 自动过期机制
- **LRU (Least Recently Used)**: 内存限制时的淘汰策略
- **依赖失效**: 相关数据变更时的智能失效
- **预加载**: 预测性数据加载

### 2. 缓存层级设计

#### 三级缓存架构
```
┌─────────────────┐
│   浏览器缓存      │ ← HTTP缓存、localStorage
├─────────────────┤
│   应用内存缓存    │ ← CacheManager、组件状态
├─────────────────┤
│   服务端缓存      │ ← Appwrite内置缓存
└─────────────────┘
```

#### 缓存键命名规范
```javascript
// 用户相关
`user:${userId}`
`user:profile:${userId}`

// 待办事项相关
`todos:${userId}`
`todos:${userId}:${filterHash}`
`todo:detail:${todoId}`

// 好友相关
`friends:${userId}`
`friend:requests:${userId}`
`friend:search:${query}`
```

## 🎨 UI/UX 架构

### 1. 设计系统

#### 色彩系统
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        secondary: {
          500: '#8b5cf6',
          600: '#7c3aed',
        }
      }
    }
  }
}
```

#### 组件样式规范
```javascript
// 按钮样式系统
const buttonVariants = {
  primary: "bg-blue-600 hover:bg-blue-700 text-white",
  secondary: "bg-gray-200 hover:bg-gray-300 text-gray-900",
  danger: "bg-red-600 hover:bg-red-700 text-white",
  ghost: "hover:bg-gray-100 text-gray-700"
};

// 尺寸系统
const buttonSizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg"
};
```

### 2. 动画系统

#### Framer Motion 配置
```javascript
// 通用动画变体
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// 页面切换动画
const pageTransition = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.3, ease: "easeInOut" }
};
```

#### 性能优化策略
- **GPU加速**: transform和opacity动画
- **will-change**: 提前声明动画属性
- **动画分层**: 避免重排和重绘
- **帧率控制**: 60fps目标

### 3. 响应式设计

#### 断点系统
```javascript
// Tailwind CSS 断点
const breakpoints = {
  sm: '640px',   // 手机横屏
  md: '768px',   // 平板
  lg: '1024px',  // 小型桌面
  xl: '1280px',  // 大型桌面
  '2xl': '1536px' // 超大屏幕
};
```

#### 布局策略
- **移动优先**: 从小屏幕开始设计
- **弹性布局**: Flexbox和Grid结合
- **相对单位**: rem、em、vh、vw
- **内容优先**: 内容决定布局

## 🔐 安全架构

### 1. 认证安全

#### JWT Token 管理
```javascript
// Token 存储策略
const tokenStorage = {
  // 访问令牌存储在内存中（更安全）
  accessToken: null,
  
  // 刷新令牌存储在 httpOnly cookie 中
  refreshToken: 'httpOnly cookie',
  
  // 自动刷新机制
  autoRefresh: true,
  refreshThreshold: 5 * 60 * 1000 // 5分钟前刷新
};
```

#### 会话管理
- **自动过期**: Token过期自动登出
- **活动检测**: 用户活动延长会话
- **多标签同步**: 跨标签页状态同步
- **安全登出**: 清除所有本地数据

### 2. 数据安全

#### 输入验证
```javascript
// 前端验证
const validateTodoInput = (data) => {
  const errors = {};
  
  if (!data.title?.trim()) {
    errors.title = "标题不能为空";
  }
  
  if (data.title?.length > 100) {
    errors.title = "标题不能超过100字符";
  }
  
  return errors;
};

// XSS防护
const sanitizeInput = (input) => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};
```

#### 权限控制
- **基于角色**: 用户角色权限控制
- **资源访问**: 只能访问自己的数据
- **API权限**: 服务端权限验证
- **前端隐藏**: 敏感功能前端隐藏

## 📊 性能架构

### 1. 加载性能

#### 代码分割策略
```javascript
// 路由级别分割
const TodosPage = lazy(() => import('./dashboard/todos/page'));
const FriendsPage = lazy(() => import('./dashboard/friends/page'));

// 组件级别分割
const AddTodoModal = lazy(() => import('./components/AddTodoModal'));

// 第三方库分割
const FramerMotion = lazy(() => import('framer-motion'));
```

#### 资源优化
- **图片优化**: Next.js Image组件
- **字体优化**: 字体预加载和fallback
- **CSS优化**: Tailwind CSS purge
- **JS优化**: Tree shaking和压缩

### 2. 运行时性能

#### React 优化
```javascript
// memo 优化
const TodoItem = memo(({ todo, onUpdate }) => {
  return <div>{todo.title}</div>;
});

// useMemo 优化
const filteredTodos = useMemo(() => {
  return todos.filter(todo => 
    filters.status === 'all' || todo.status === filters.status
  );
}, [todos, filters.status]);

// useCallback 优化
const handleTodoUpdate = useCallback((id, data) => {
  updateTodo(id, data);
}, [updateTodo]);
```

#### 虚拟化支持
- **长列表**: React Window虚拟滚动
- **无限滚动**: 分页加载
- **懒加载**: 图片和组件懒加载

### 3. 监控和分析

#### 性能指标
```javascript
// Core Web Vitals
const performanceMetrics = {
  LCP: 'Largest Contentful Paint',  // < 2.5s
  FID: 'First Input Delay',         // < 100ms
  CLS: 'Cumulative Layout Shift',   // < 0.1
  FCP: 'First Contentful Paint',    // < 1.8s
  TTI: 'Time to Interactive'        // < 3.8s
};

// 自定义指标
const customMetrics = {
  cacheHitRate: '缓存命中率',
  apiResponseTime: 'API响应时间',
  errorRate: '错误率',
  userEngagement: '用户参与度'
};
```

## 🚀 部署架构

### 1. 构建优化

#### Next.js 配置
```javascript
// next.config.js
module.exports = {
  // 生产优化
  swcMinify: true,
  compress: true,
  
  // 图片优化
  images: {
    domains: ['appwrite.example.com'],
    formats: ['image/webp', 'image/avif']
  },
  
  // 实验性功能
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: []
  }
};
```

#### 环境配置
```javascript
// 环境变量管理
const config = {
  development: {
    APPWRITE_ENDPOINT: 'http://localhost:80/v1',
    CACHE_TTL: 60000,
    DEBUG_MODE: true
  },
  production: {
    APPWRITE_ENDPOINT: 'https://api.appwrite.io/v1',
    CACHE_TTL: 300000,
    DEBUG_MODE: false
  }
};
```

### 2. 监控和运维

#### 错误监控
```javascript
// 全局错误处理
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // 发送到监控服务
  sendErrorToMonitoring(event.error);
});

// React 错误边界
class ErrorBoundary extends Component {
  componentDidCatch(error, errorInfo) {
    console.error('React error:', error, errorInfo);
    sendErrorToMonitoring(error, errorInfo);
  }
}
```

#### 性能监控
```javascript
// 性能数据收集
const collectPerformanceData = () => {
  const navigation = performance.getEntriesByType('navigation')[0];
  const paint = performance.getEntriesByType('paint');
  
  return {
    loadTime: navigation.loadEventEnd - navigation.loadEventStart,
    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
    firstPaint: paint.find(p => p.name === 'first-paint')?.startTime,
    firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime
  };
};
```

## 📈 扩展性架构

### 1. 模块化设计

#### 功能模块
```
modules/
├── auth/           # 认证模块
│   ├── components/
│   ├── hooks/
│   ├── services/
│   └── types/
├── todos/          # 待办模块
├── friends/        # 好友模块
├── notifications/  # 通知模块
└── shared/         # 共享模块
```

#### 插件系统
```javascript
// 插件接口
interface Plugin {
  name: string;
  version: string;
  install(app: App): void;
  uninstall(app: App): void;
}

// 插件管理器
class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  
  register(plugin: Plugin) {
    this.plugins.set(plugin.name, plugin);
    plugin.install(this.app);
  }
}
```

### 2. 微前端准备

#### 模块联邦配置
```javascript
// webpack.config.js
const ModuleFederationPlugin = require('@module-federation/webpack');

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'todoApp',
      filename: 'remoteEntry.js',
      exposes: {
        './TodoModule': './src/modules/todos',
        './FriendModule': './src/modules/friends'
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true }
      }
    })
  ]
};
```

---

## 🎯 架构优势

### 1. 可维护性
- **模块化设计**: 清晰的模块边界
- **单一职责**: 每个模块职责明确
- **依赖注入**: 松耦合的组件关系
- **文档完善**: 详细的技术文档

### 2. 可扩展性
- **插件系统**: 支持功能扩展
- **微前端**: 支持团队独立开发
- **API抽象**: 易于更换后端服务
- **配置驱动**: 通过配置控制行为

### 3. 性能优秀
- **智能缓存**: 减少网络请求
- **代码分割**: 按需加载资源
- **虚拟化**: 处理大量数据
- **优化策略**: 多层次性能优化

### 4. 用户体验
- **响应式**: 适配所有设备
- **流畅动画**: 60fps动画性能
- **即时反馈**: 乐观更新机制
- **离线支持**: 基础离线功能

这个技术架构为 **To Do Together** 项目提供了坚实的技术基础，支持项目的长期发展和功能扩展。 