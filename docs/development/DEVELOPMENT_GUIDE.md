# To Do Together - 开发指南

## 🚀 快速开始

### 环境要求

- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0
- **Git**: 最新版本
- **现代浏览器**: Chrome 90+, Firefox 88+, Safari 14+

### 安装和启动

```bash
# 克隆项目
git clone <repository-url>
cd to-do-together

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 文件，填入你的 Appwrite 配置

# 启动开发服务器
npm run dev

# 打开浏览器访问
# http://localhost:3000
```

### 环境变量配置

```bash
# .env.local
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your-database-id
NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID=your-users-collection-id
NEXT_PUBLIC_APPWRITE_TODOS_COLLECTION_ID=your-todos-collection-id
NEXT_PUBLIC_APPWRITE_FRIENDSHIPS_COLLECTION_ID=your-friendships-collection-id
```

## 📁 项目结构详解

### 核心目录说明

```
src/app/
├── components/           # 可复用组件
│   ├── ui/              # 基础UI组件
│   ├── forms/           # 表单组件
│   ├── modals/          # 弹窗组件
│   └── layout/          # 布局组件
├── hooks/               # 自定义Hooks
│   ├── useAuth.js       # 认证相关
│   ├── useTodo*.js      # 待办事项相关
│   └── useFriend*.js    # 好友相关
├── services/            # 服务层
│   ├── base/            # 基础服务
│   ├── cached/          # 缓存服务
│   └── utils/           # 服务工具
├── utils/               # 工具函数
│   ├── cache/           # 缓存相关
│   ├── validation/      # 验证相关
│   └── helpers/         # 辅助函数
├── config/              # 配置文件
├── constants/           # 常量定义
└── types/               # 类型定义 (未来TypeScript)
```

### 文件命名规范

- **组件文件**: PascalCase (如 `TodoItem.js`)
- **Hook文件**: camelCase with use前缀 (如 `useTodoOperations.js`)
- **服务文件**: camelCase with Service后缀 (如 `todoService.js`)
- **工具文件**: camelCase (如 `cacheManager.js`)
- **常量文件**: camelCase (如 `friendshipStatus.js`)

## 🧩 组件开发指南

### 组件开发原则

1. **单一职责**: 每个组件只负责一个功能
2. **可复用性**: 设计时考虑复用场景
3. **Props接口**: 清晰的Props定义
4. **性能优化**: 合理使用memo、useMemo、useCallback

### 组件模板

```javascript
"use client";
import React, { memo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * 组件描述
 * @param {Object} props - 组件属性
 * @param {string} props.title - 标题
 * @param {Function} props.onAction - 操作回调
 */
const ComponentName = memo(({ title, onAction, ...props }) => {
  const [localState, setLocalState] = useState(null);

  const handleAction = useCallback((data) => {
    // 处理逻辑
    onAction?.(data);
  }, [onAction]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="component-container"
      {...props}
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      {/* 组件内容 */}
    </motion.div>
  );
});

ComponentName.displayName = 'ComponentName';

ComponentName.propTypes = {
  title: PropTypes.string.isRequired,
  onAction: PropTypes.func,
};

ComponentName.defaultProps = {
  onAction: null,
};

export default ComponentName;
```

### 样式规范

#### Tailwind CSS 使用规范

```javascript
// ✅ 推荐：使用语义化的类名组合
const buttonClasses = `
  inline-flex items-center justify-center
  px-4 py-2 text-sm font-medium
  bg-blue-600 hover:bg-blue-700
  text-white rounded-lg
  transition-colors duration-200
  focus:outline-none focus:ring-2 focus:ring-blue-500
  disabled:opacity-50 disabled:cursor-not-allowed
`;

// ❌ 避免：过长的类名字符串
const badClasses = "inline-flex items-center justify-center px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed";
```

#### 响应式设计

```javascript
// 移动优先的响应式设计
const responsiveClasses = `
  // 基础样式（移动端）
  px-4 py-2 text-sm
  
  // 平板及以上
  sm:px-6 sm:py-3 sm:text-base
  
  // 桌面及以上
  lg:px-8 lg:py-4 lg:text-lg
`;
```

### 动画规范

#### Framer Motion 使用指南

```javascript
// 通用动画变体
export const animations = {
  // 淡入淡出
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  
  // 滑入滑出
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  },
  
  // 缩放
  scale: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 }
  },
  
  // 错开动画
  stagger: {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }
};

// 使用示例
<motion.div
  variants={animations.slideUp}
  initial="initial"
  animate="animate"
  exit="exit"
  transition={{ duration: 0.3 }}
>
  {content}
</motion.div>
```

## 🔧 Hook 开发指南

### Hook 设计原则

1. **单一职责**: 每个Hook专注一个功能领域
2. **可组合性**: Hook之间可以组合使用
3. **错误处理**: 统一的错误处理机制
4. **性能优化**: 避免不必要的重新渲染

### Hook 模板

```javascript
import { useState, useCallback, useEffect } from 'react';

/**
 * 自定义Hook描述
 * @param {Object} options - 配置选项
 * @returns {Object} Hook返回值
 */
export const useCustomHook = (options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 清除错误
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 主要操作方法
  const performAction = useCallback(async (params) => {
    try {
      setLoading(true);
      setError(null);
      
      // 执行操作
      const result = await someAsyncOperation(params);
      setData(result);
      
      return result;
    } catch (err) {
      setError(err.message || '操作失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 副作用处理
  useEffect(() => {
    // 初始化逻辑
    return () => {
      // 清理逻辑
    };
  }, []);

  return {
    data,
    loading,
    error,
    performAction,
    clearError
  };
};
```

### 常用Hook模式

#### 数据获取Hook

```javascript
export const useDataFetching = (fetchFn, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    refetch();
  }, dependencies);

  return { data, loading, error, refetch };
};
```

#### 表单处理Hook

```javascript
export const useForm = (initialValues, validationSchema) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const setValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
  }, []);

  const setFieldTouched = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  }, []);

  const validate = useCallback(() => {
    const validationErrors = validationSchema(values);
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  }, [values, validationSchema]);

  const handleSubmit = useCallback((onSubmit) => {
    return (e) => {
      e.preventDefault();
      if (validate()) {
        onSubmit(values);
      }
    };
  }, [values, validate]);

  return {
    values,
    errors,
    touched,
    setValue,
    setFieldTouched,
    validate,
    handleSubmit
  };
};
```

## 🔌 服务层开发指南

### 服务设计原则

1. **接口抽象**: 统一的服务接口
2. **错误处理**: 统一的错误处理机制
3. **缓存策略**: 合理的缓存设计
4. **类型安全**: 清晰的参数和返回值类型

### 基础服务模板

```javascript
import { AppwriteException } from 'appwrite';

class BaseService {
  constructor(client) {
    this.client = client;
  }

  /**
   * 统一错误处理
   * @param {Error} error - 错误对象
   * @throws {ServiceError} 格式化后的错误
   */
  handleError(error) {
    if (error instanceof AppwriteException) {
      throw new ServiceError(
        error.message || '服务请求失败',
        error.code,
        error
      );
    }
    
    throw new ServiceError(
      error.message || '未知错误',
      'UNKNOWN_ERROR',
      error
    );
  }

  /**
   * 统一请求包装
   * @param {Function} requestFn - 请求函数
   * @returns {Promise} 请求结果
   */
  async executeRequest(requestFn) {
    try {
      return await requestFn();
    } catch (error) {
      this.handleError(error);
    }
  }
}

// 具体服务实现
class TodoService extends BaseService {
  async getTodos(userId, filters = {}) {
    return this.executeRequest(async () => {
      const queries = this.buildQueries(userId, filters);
      const response = await this.client.database.listDocuments(
        DATABASE_ID,
        TODOS_COLLECTION_ID,
        queries
      );
      return response.documents;
    });
  }

  buildQueries(userId, filters) {
    const queries = [Query.equal('userId', userId)];
    
    if (filters.status && filters.status !== 'all') {
      queries.push(Query.equal('status', filters.status));
    }
    
    if (filters.priority) {
      queries.push(Query.equal('priority', filters.priority));
    }
    
    return queries;
  }
}
```

### 缓存服务模板

```javascript
class CachedService extends BaseService {
  constructor(client, cacheManager) {
    super(client);
    this.cache = cacheManager;
    this.defaultTTL = 300000; // 5分钟
  }

  /**
   * 带缓存的数据获取
   * @param {string} cacheKey - 缓存键
   * @param {Function} fetchFn - 数据获取函数
   * @param {number} ttl - 缓存时间
   * @returns {Promise} 数据
   */
  async getCachedData(cacheKey, fetchFn, ttl = this.defaultTTL) {
    // 尝试从缓存获取
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // 缓存未命中，获取数据
    const data = await fetchFn();
    
    // 存入缓存
    this.cache.set(cacheKey, data, ttl);
    
    return data;
  }

  /**
   * 缓存失效
   * @param {string|RegExp} pattern - 失效模式
   */
  invalidateCache(pattern) {
    this.cache.invalidate(pattern);
  }
}
```

## 🎨 样式开发指南

### Tailwind CSS 最佳实践

#### 组件样式组织

```javascript
// 样式常量定义
const styles = {
  container: `
    min-h-screen bg-gray-50 dark:bg-gray-900
    transition-colors duration-200
  `,
  
  card: `
    bg-white dark:bg-gray-800
    rounded-xl shadow-sm border border-gray-200 dark:border-gray-700
    p-4 transition-all duration-200
    hover:shadow-md
  `,
  
  button: {
    base: `
      inline-flex items-center justify-center
      px-4 py-2 text-sm font-medium rounded-lg
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    primary: `
      bg-blue-600 hover:bg-blue-700 focus:ring-blue-500
      text-white
    `,
    secondary: `
      bg-gray-200 hover:bg-gray-300 focus:ring-gray-500
      text-gray-900 dark:bg-gray-700 dark:text-gray-100
      dark:hover:bg-gray-600
    `
  }
};

// 使用示例
<button className={`${styles.button.base} ${styles.button.primary}`}>
  点击按钮
</button>
```

#### 响应式设计模式

```javascript
// 响应式网格
const gridClasses = `
  grid gap-4
  grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
`;

// 响应式间距
const spacingClasses = `
  px-4 py-6
  sm:px-6 sm:py-8
  lg:px-8 lg:py-12
`;

// 响应式文字
const textClasses = `
  text-sm sm:text-base lg:text-lg
  leading-relaxed sm:leading-loose
`;
```

### 深色模式支持

```javascript
// 深色模式类名
const darkModeClasses = `
  bg-white dark:bg-gray-800
  text-gray-900 dark:text-gray-100
  border-gray-200 dark:border-gray-700
`;

// 条件深色模式
const getDarkModeClass = (lightClass, darkClass) => {
  return `${lightClass} dark:${darkClass}`;
};
```

## 🧪 测试指南

### 测试策略

1. **单元测试**: 测试独立的函数和组件
2. **集成测试**: 测试组件间的交互
3. **端到端测试**: 测试完整的用户流程

### 组件测试示例

```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import TodoItem from '../TodoItem';

describe('TodoItem', () => {
  const mockTodo = {
    $id: '1',
    title: '测试待办',
    status: 'pending',
    priority: 'medium'
  };

  const mockOnUpdate = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该正确渲染待办事项', () => {
    render(
      <TodoItem
        todo={mockTodo}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('测试待办')).toBeInTheDocument();
  });

  it('应该在点击时调用更新函数', async () => {
    render(
      <TodoItem
        todo={mockTodo}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith(
        mockTodo.$id,
        { status: 'completed' }
      );
    });
  });
});
```

### Hook 测试示例

```javascript
import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useTodoOperations } from '../useTodoOperations';

// Mock 服务
vi.mock('../services/todoService', () => ({
  getTodos: vi.fn(),
  createTodo: vi.fn(),
  updateTodo: vi.fn(),
  deleteTodo: vi.fn()
}));

describe('useTodoOperations', () => {
  it('应该正确获取待办事项', async () => {
    const mockTodos = [
      { $id: '1', title: '测试1' },
      { $id: '2', title: '测试2' }
    ];

    todoService.getTodos.mockResolvedValue({ documents: mockTodos });

    const { result } = renderHook(() => useTodoOperations());

    await act(async () => {
      await result.current.fetchTodos();
    });

    expect(result.current.todos).toEqual(mockTodos);
    expect(result.current.loading).toBe(false);
  });
});
```

## 🔍 调试指南

### 开发工具

#### React Developer Tools
- 安装 React DevTools 浏览器扩展
- 检查组件状态和props
- 分析组件渲染性能

#### 缓存监控
```javascript
// 开启缓存监控
import CacheMonitor from './components/CacheMonitor';

// 在开发环境中显示
{process.env.NODE_ENV === 'development' && (
  <CacheMonitor isVisible={true} />
)}
```

#### 性能分析
```javascript
// 性能标记
performance.mark('operation-start');
await performOperation();
performance.mark('operation-end');
performance.measure('operation', 'operation-start', 'operation-end');

// 查看性能数据
const measures = performance.getEntriesByType('measure');
console.log(measures);
```

### 常见问题排查

#### 1. 组件不更新
```javascript
// 检查依赖数组
useEffect(() => {
  // 确保依赖数组包含所有使用的变量
}, [dependency1, dependency2]);

// 检查对象引用
const memoizedValue = useMemo(() => {
  return { key: value }; // 每次都是新对象
}, [value]);

// 正确做法
const memoizedValue = useMemo(() => {
  return { key: value };
}, [value]); // 只有value变化时才创建新对象
```

#### 2. 内存泄漏
```javascript
// 清理定时器
useEffect(() => {
  const timer = setInterval(() => {
    // 定时任务
  }, 1000);

  return () => {
    clearInterval(timer); // 清理定时器
  };
}, []);

// 清理事件监听
useEffect(() => {
  const handleResize = () => {
    // 处理窗口大小变化
  };

  window.addEventListener('resize', handleResize);
  
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);
```

#### 3. 缓存问题
```javascript
// 检查缓存键
const cacheKey = `todos:${userId}:${JSON.stringify(filters)}`;

// 手动清理缓存
globalCache.invalidate(/^todos:/);

// 检查缓存统计
const stats = globalCache.getStats();
console.log('缓存统计:', stats);
```

## 📦 构建和部署

### 本地构建

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 分析构建包大小
npm run analyze
```

### 环境配置

```javascript
// next.config.js
const nextConfig = {
  // 环境变量
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // 图片域名配置
  images: {
    domains: ['cloud.appwrite.io'],
  },
  
  // 重定向配置
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
    ];
  },
};
```

### 性能优化

```javascript
// 代码分割
const LazyComponent = dynamic(() => import('./LazyComponent'), {
  loading: () => <LoadingSpinner />,
  ssr: false
});

// 图片优化
import Image from 'next/image';

<Image
  src="/image.jpg"
  alt="描述"
  width={500}
  height={300}
  priority // 关键图片优先加载
  placeholder="blur" // 模糊占位符
/>
```

## 📋 代码规范

### ESLint 配置

```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'next/core-web-vitals',
    'eslint:recommended'
  ],
  rules: {
    'no-unused-vars': 'error',
    'no-console': 'warn',
    'prefer-const': 'error',
    'react-hooks/exhaustive-deps': 'warn'
  }
};
```

### 提交规范

```bash
# 提交消息格式
<type>(<scope>): <description>

# 类型说明
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建工具或辅助工具的变动

# 示例
feat(todo): 添加待办事项优先级功能
fix(auth): 修复登录状态检查问题
docs(readme): 更新安装说明
```

## 🤝 贡献指南

### 开发流程

1. **Fork 项目**
2. **创建功能分支**: `git checkout -b feature/new-feature`
3. **提交更改**: `git commit -m 'feat: add new feature'`
4. **推送分支**: `git push origin feature/new-feature`
5. **创建 Pull Request**

### 代码审查清单

- [ ] 代码符合项目规范
- [ ] 添加了必要的测试
- [ ] 更新了相关文档
- [ ] 通过了所有测试
- [ ] 没有引入新的警告或错误

---

## 📚 学习资源

### 官方文档
- [Next.js 文档](https://nextjs.org/docs)
- [React 文档](https://react.dev)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [Framer Motion 文档](https://www.framer.com/motion/)
- [Appwrite 文档](https://appwrite.io/docs)

### 推荐阅读
- [React 性能优化](https://react.dev/learn/render-and-commit)
- [Next.js 最佳实践](https://nextjs.org/docs/pages/building-your-application/deploying/production-checklist)
- [Web 性能优化](https://web.dev/performance/)
- [无障碍性指南](https://www.w3.org/WAI/WCAG21/quickref/)

这个开发指南为 **To Do Together** 项目提供了完整的开发规范和最佳实践，帮助开发者快速上手并保持代码质量。 