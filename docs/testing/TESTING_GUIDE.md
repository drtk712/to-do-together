# To Do Together - 测试指南

## 📋 概述

本文档详细介绍了 **To Do Together** 项目的测试策略、测试框架配置和最佳实践。

## 🧪 测试策略

### 测试金字塔

```
        /\
       /  \
      / E2E \     <- 少量端到端测试
     /______\
    /        \
   /Integration\ <- 适量集成测试
  /__________\
 /            \
/  Unit Tests  \   <- 大量单元测试
/______________\
```

### 测试类型

1. **单元测试 (Unit Tests)**
   - 测试单个函数、组件或模块
   - 快速执行，易于调试
   - 覆盖率目标：80%+

2. **集成测试 (Integration Tests)**
   - 测试多个模块间的交互
   - 验证数据流和API集成
   - 重点测试关键业务流程

3. **端到端测试 (E2E Tests)**
   - 模拟真实用户操作
   - 验证完整的用户流程
   - 确保核心功能正常工作

## 🛠️ 测试框架配置

### Jest 配置

```javascript
// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Next.js 应用的路径
  dir: './',
});

const customJestConfig = {
  // 测试环境
  testEnvironment: 'jsdom',
  
  // 模块路径映射
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/app/components/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/app/hooks/$1',
    '^@/services/(.*)$': '<rootDir>/src/app/services/$1',
    '^@/utils/(.*)$': '<rootDir>/src/app/utils/$1',
  },
  
  // 设置文件
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // 测试文件匹配模式
  testMatch: [
    '<rootDir>/tests/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
  ],
  
  // 覆盖率配置
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/layout.js',
    '!src/app/page.js',
  ],
  
  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  // 模拟模块
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};

module.exports = createJestConfig(customJestConfig);
```

### 测试设置文件

```javascript
// tests/setup.js
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// 全局变量设置
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
global.sessionStorage = localStorageMock;
```

## 🧪 单元测试

### 组件测试示例

```javascript
// tests/unit/components/TodoItem.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TodoItem } from '@/components/TodoItem';

describe('TodoItem 组件', () => {
  const mockTodo = {
    $id: '1',
    title: '测试待办事项',
    description: '这是一个测试描述',
    completed: false,
    priority: 'medium',
    dueDate: '2024-12-31',
  };

  const mockProps = {
    todo: mockTodo,
    onUpdate: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('应该正确渲染待办事项', () => {
    render(<TodoItem {...mockProps} />);
    
    expect(screen.getByText('测试待办事项')).toBeInTheDocument();
    expect(screen.getByText('这是一个测试描述')).toBeInTheDocument();
  });

  it('应该处理完成状态切换', async () => {
    render(<TodoItem {...mockProps} />);
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    await waitFor(() => {
      expect(mockProps.onUpdate).toHaveBeenCalledWith({
        ...mockTodo,
        completed: true,
      });
    });
  });

  it('应该处理删除操作', async () => {
    render(<TodoItem {...mockProps} />);
    
    const deleteButton = screen.getByLabelText('删除待办事项');
    fireEvent.click(deleteButton);
    
    await waitFor(() => {
      expect(mockProps.onDelete).toHaveBeenCalledWith(mockTodo.$id);
    });
  });

  it('应该根据优先级显示不同样式', () => {
    const highPriorityTodo = { ...mockTodo, priority: 'high' };
    render(<TodoItem {...mockProps} todo={highPriorityTodo} />);
    
    const todoElement = screen.getByTestId('todo-item');
    expect(todoElement).toHaveClass('priority-high');
  });
});
```

### Hook 测试示例

```javascript
// tests/unit/hooks/useTodoOperations.test.js
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTodoOperations } from '@/hooks/useTodoOperations';
import { cachedTodoService } from '@/services/cachedTodoService';

// Mock 服务
jest.mock('@/services/cachedTodoService');

describe('useTodoOperations Hook', () => {
  const mockUser = { $id: 'user-123' };
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock useAuth hook
    jest.doMock('@/hooks/useAuth', () => ({
      useAuth: () => ({ user: mockUser }),
    }));
  });

  it('应该正确加载待办事项列表', async () => {
    const mockTodos = [
      { $id: '1', title: 'Todo 1', userId: mockUser.$id },
      { $id: '2', title: 'Todo 2', userId: mockUser.$id },
    ];

    cachedTodoService.getTodos.mockResolvedValue(mockTodos);

    const { result } = renderHook(() => useTodoOperations());

    await waitFor(() => {
      expect(result.current.todos).toEqual(mockTodos);
      expect(result.current.loading).toBe(false);
    });
  });

  it('应该正确处理创建待办事项', async () => {
    const newTodo = { title: '新待办事项', description: '描述' };
    const createdTodo = { $id: 'new-id', ...newTodo, userId: mockUser.$id };

    cachedTodoService.createTodo.mockResolvedValue(createdTodo);

    const { result } = renderHook(() => useTodoOperations());

    await act(async () => {
      await result.current.createTodo(newTodo);
    });

    expect(cachedTodoService.createTodo).toHaveBeenCalledWith({
      ...newTodo,
      userId: mockUser.$id,
    });
  });

  it('应该正确处理错误状态', async () => {
    const errorMessage = '网络错误';
    cachedTodoService.getTodos.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useTodoOperations());

    await waitFor(() => {
      expect(result.current.error).toBe('获取待办事项失败');
      expect(result.current.loading).toBe(false);
    });
  });
});
```

### 工具函数测试

```javascript
// tests/unit/utils/cacheManager.test.js
import { CacheManager } from '@/utils/cacheManager';

describe('CacheManager', () => {
  let cacheManager;

  beforeEach(() => {
    cacheManager = new CacheManager({
      maxSize: 5,
      defaultTTL: 1000,
    });
  });

  afterEach(() => {
    cacheManager.clear();
  });

  it('应该正确设置和获取缓存', () => {
    const key = 'test-key';
    const value = { data: 'test-value' };

    cacheManager.set(key, value);
    const result = cacheManager.get(key);

    expect(result).toEqual(value);
  });

  it('应该正确处理TTL过期', async () => {
    const key = 'expire-key';
    const value = 'expire-value';

    cacheManager.set(key, value, 100); // 100ms TTL

    // 立即获取应该成功
    expect(cacheManager.get(key)).toBe(value);

    // 等待过期
    await new Promise(resolve => setTimeout(resolve, 150));

    // 过期后应该返回null
    expect(cacheManager.get(key)).toBeNull();
  });

  it('应该正确执行LRU淘汰', () => {
    // 填满缓存
    for (let i = 1; i <= 5; i++) {
      cacheManager.set(`key${i}`, `value${i}`);
    }

    // 访问key1使其成为最近使用
    cacheManager.get('key1');

    // 添加新项目，应该淘汰key2
    cacheManager.set('key6', 'value6');

    expect(cacheManager.get('key1')).toBe('value1'); // 保留
    expect(cacheManager.get('key2')).toBeNull(); // 被淘汰
    expect(cacheManager.get('key6')).toBe('value6'); // 新添加
  });
});
```

## 🔗 集成测试

### API 集成测试

```javascript
// tests/integration/api.test.js
import { todoService } from '@/services/todoService';
import { friendService } from '@/services/friendService';

describe('API 集成测试', () => {
  // 使用测试数据库
  const testUserId = 'test-user-123';

  beforeAll(async () => {
    // 设置测试环境
    process.env.NODE_ENV = 'test';
  });

  afterEach(async () => {
    // 清理测试数据
    await cleanupTestData(testUserId);
  });

  describe('待办事项 API', () => {
    it('应该能够创建和获取待办事项', async () => {
      const todoData = {
        title: '集成测试待办事项',
        description: '这是集成测试',
        userId: testUserId,
      };

      // 创建待办事项
      const createdTodo = await todoService.createTodo(todoData);
      expect(createdTodo).toMatchObject(todoData);
      expect(createdTodo.$id).toBeDefined();

      // 获取待办事项列表
      const todos = await todoService.getTodos(testUserId);
      expect(todos).toContainEqual(createdTodo);
    });

    it('应该能够更新待办事项', async () => {
      // 先创建一个待办事项
      const todoData = {
        title: '原始标题',
        userId: testUserId,
      };
      const createdTodo = await todoService.createTodo(todoData);

      // 更新待办事项
      const updateData = { title: '更新后的标题' };
      const updatedTodo = await todoService.updateTodo(createdTodo.$id, updateData);

      expect(updatedTodo.title).toBe('更新后的标题');
    });
  });

  describe('好友系统 API', () => {
    it('应该能够发送和接受好友请求', async () => {
      const friendUserId = 'friend-user-123';

      // 发送好友请求
      const friendship = await friendService.sendFriendRequest(testUserId, friendUserId);
      expect(friendship.status).toBe('pending');

      // 接受好友请求
      const acceptedFriendship = await friendService.acceptFriendRequest(friendship.$id);
      expect(acceptedFriendship.status).toBe('accepted');

      // 验证好友列表
      const friends = await friendService.getFriends(testUserId);
      expect(friends).toHaveLength(1);
    });
  });
});

// 测试工具函数
async function cleanupTestData(userId) {
  try {
    // 清理待办事项
    const todos = await todoService.getTodos(userId);
    for (const todo of todos) {
      await todoService.deleteTodo(todo.$id);
    }

    // 清理好友关系
    const friendships = await friendService.getFriendships(userId);
    for (const friendship of friendships) {
      await friendService.deleteFriendship(friendship.$id);
    }
  } catch (error) {
    console.warn('清理测试数据失败:', error);
  }
}
```

## 🎭 端到端测试

### Playwright 配置

```javascript
// playwright.config.js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E 测试示例

```javascript
// tests/e2e/todo-workflow.spec.js
import { test, expect } from '@playwright/test';

test.describe('待办事项工作流', () => {
  test.beforeEach(async ({ page }) => {
    // 登录测试用户
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'testpassword');
    await page.click('[data-testid="login-button"]');
    
    // 等待跳转到仪表板
    await expect(page).toHaveURL('/dashboard');
  });

  test('应该能够创建新的待办事项', async ({ page }) => {
    // 点击添加待办事项按钮
    await page.click('[data-testid="add-todo-button"]');
    
    // 填写待办事项表单
    await page.fill('[data-testid="todo-title-input"]', '测试待办事项');
    await page.fill('[data-testid="todo-description-input"]', '这是一个测试描述');
    await page.selectOption('[data-testid="todo-priority-select"]', 'high');
    
    // 提交表单
    await page.click('[data-testid="submit-todo-button"]');
    
    // 验证待办事项已创建
    await expect(page.locator('[data-testid="todo-item"]')).toContainText('测试待办事项');
    await expect(page.locator('[data-testid="todo-item"]')).toHaveClass(/priority-high/);
  });

  test('应该能够标记待办事项为完成', async ({ page }) => {
    // 假设已有待办事项
    const todoItem = page.locator('[data-testid="todo-item"]').first();
    const checkbox = todoItem.locator('[data-testid="todo-checkbox"]');
    
    // 点击复选框
    await checkbox.click();
    
    // 验证状态变化
    await expect(checkbox).toBeChecked();
    await expect(todoItem).toHaveClass(/completed/);
  });

  test('应该能够删除待办事项', async ({ page }) => {
    const todoItem = page.locator('[data-testid="todo-item"]').first();
    const deleteButton = todoItem.locator('[data-testid="delete-todo-button"]');
    
    // 点击删除按钮
    await deleteButton.click();
    
    // 确认删除
    await page.click('[data-testid="confirm-delete-button"]');
    
    // 验证待办事项已删除
    await expect(todoItem).not.toBeVisible();
  });
});

test.describe('好友系统工作流', () => {
  test('应该能够添加新好友', async ({ page }) => {
    // 导航到好友页面
    await page.goto('/dashboard/friends');
    
    // 点击添加好友按钮
    await page.click('[data-testid="add-friend-button"]');
    
    // 搜索用户
    await page.fill('[data-testid="friend-search-input"]', 'friend@example.com');
    await page.click('[data-testid="search-button"]');
    
    // 等待搜索结果
    await expect(page.locator('[data-testid="search-result"]')).toBeVisible();
    
    // 发送好友请求
    await page.click('[data-testid="send-friend-request-button"]');
    
    // 验证请求已发送
    await expect(page.locator('[data-testid="success-message"]')).toContainText('好友请求已发送');
  });
});
```

## 📊 测试覆盖率

### 覆盖率配置

```javascript
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

### 覆盖率报告

```bash
# 生成覆盖率报告
npm run test:coverage

# 查看详细报告
open coverage/lcov-report/index.html
```

## 🚀 测试最佳实践

### 1. 测试命名规范

```javascript
// ✅ 好的测试命名
describe('TodoItem 组件', () => {
  it('应该在点击复选框时切换完成状态', () => {});
  it('应该在优先级为高时显示红色边框', () => {});
  it('应该在删除确认后移除待办事项', () => {});
});

// ❌ 不好的测试命名
describe('TodoItem', () => {
  it('test checkbox', () => {});
  it('test priority', () => {});
  it('test delete', () => {});
});
```

### 2. 测试数据管理

```javascript
// 使用工厂函数创建测试数据
const createMockTodo = (overrides = {}) => ({
  $id: 'mock-id',
  title: '默认标题',
  description: '默认描述',
  completed: false,
  priority: 'medium',
  userId: 'user-123',
  createdAt: new Date().toISOString(),
  ...overrides,
});

// 使用示例
const completedTodo = createMockTodo({ completed: true });
const highPriorityTodo = createMockTodo({ priority: 'high' });
```

### 3. Mock 策略

```javascript
// 模块级别的 Mock
jest.mock('@/services/todoService', () => ({
  todoService: {
    getTodos: jest.fn(),
    createTodo: jest.fn(),
    updateTodo: jest.fn(),
    deleteTodo: jest.fn(),
  },
}));

// 函数级别的 Mock
const mockCreateTodo = jest.fn();
jest.doMock('@/services/todoService', () => ({
  todoService: { createTodo: mockCreateTodo },
}));
```

### 4. 异步测试

```javascript
// 使用 waitFor 等待异步操作
await waitFor(() => {
  expect(screen.getByText('加载完成')).toBeInTheDocument();
});

// 使用 act 包装状态更新
await act(async () => {
  await result.current.createTodo(newTodo);
});
```

## 📋 测试检查清单

### 单元测试检查清单

- [ ] 所有公共函数都有测试
- [ ] 边界条件已测试
- [ ] 错误情况已覆盖
- [ ] Mock 使用合理
- [ ] 测试独立且可重复

### 集成测试检查清单

- [ ] API 集成已测试
- [ ] 数据流已验证
- [ ] 错误处理已测试
- [ ] 缓存行为已验证

### E2E 测试检查清单

- [ ] 关键用户流程已覆盖
- [ ] 跨浏览器兼容性已测试
- [ ] 移动端体验已验证
- [ ] 性能指标在可接受范围内

---

## 📊 总结

通过完善的测试体系，**To Do Together** 项目确保了：

1. **代码质量**: 高覆盖率的单元测试保证代码质量
2. **功能稳定**: 集成测试验证模块间协作
3. **用户体验**: E2E 测试确保用户流程正常
4. **持续集成**: 自动化测试支持持续交付

**🔗 相关链接**:
- [Jest 文档](https://jestjs.io/docs/getting-started)
- [Testing Library 文档](https://testing-library.com/docs/)
- [Playwright 文档](https://playwright.dev/docs/intro) 