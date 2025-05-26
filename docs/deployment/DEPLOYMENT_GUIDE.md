# To Do Together - 部署指南

## 📋 概述

本文档详细介绍了 **To Do Together** 项目的部署流程，包括开发环境、测试环境和生产环境的部署配置。

## 🚀 快速部署

### Vercel 部署（推荐）

1. **连接 GitHub 仓库**
   ```bash
   # 确保代码已推送到 GitHub
   git push origin main
   ```

2. **在 Vercel 中导入项目**
   - 访问 [Vercel Dashboard](https://vercel.com/dashboard)
   - 点击 "New Project"
   - 选择 GitHub 仓库
   - 选择 `to-do-together` 项目

3. **配置环境变量**
   ```bash
   NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_APPWRITE_DATABASE_ID=your-database-id
   NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID=your-users-collection-id
   NEXT_PUBLIC_APPWRITE_TODOS_COLLECTION_ID=your-todos-collection-id
   NEXT_PUBLIC_APPWRITE_FRIENDSHIPS_COLLECTION_ID=your-friendships-collection-id
   NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID=your-notifications-collection-id
   ```

4. **部署**
   - 点击 "Deploy" 按钮
   - 等待构建完成
   - 访问生成的 URL

## 🏗️ 环境配置

### 开发环境

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local

# 启动开发服务器
npm run dev
```

### 测试环境

```bash
# 运行测试
npm run test

# 运行测试覆盖率
npm run test:coverage

# 运行 E2E 测试
npm run test:e2e
```

### 生产环境

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 或使用 PM2
pm2 start ecosystem.config.js
```

## 🔧 构建配置

### Next.js 配置

```javascript
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 输出配置
  output: 'standalone',
  
  // 图片优化
  images: {
    domains: ['cloud.appwrite.io'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // 压缩配置
  compress: true,
  
  // 实验性功能
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['framer-motion'],
  },
  
  // 环境变量
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

export default nextConfig;
```

### 构建优化

```bash
# 分析构建包大小
npm run analyze

# 优化构建
npm run build:optimize
```

## 🌐 域名配置

### 自定义域名

1. **在 Vercel 中添加域名**
   - 进入项目设置
   - 点击 "Domains"
   - 添加自定义域名

2. **DNS 配置**
   ```
   Type: CNAME
   Name: www
   Value: your-project.vercel.app
   
   Type: A
   Name: @
   Value: 76.76.19.61
   ```

3. **SSL 证书**
   - Vercel 自动提供 SSL 证书
   - 支持自动续期

## 📊 监控配置

### 性能监控

```javascript
// 添加到 _app.js
import { Analytics } from '@vercel/analytics/react';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}
```

### 错误监控

```javascript
// 集成 Sentry
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

## 🔒 安全配置

### 环境变量安全

```bash
# 生产环境变量（不要提交到代码库）
APPWRITE_API_KEY=your-secret-api-key
DATABASE_URL=your-database-url
JWT_SECRET=your-jwt-secret
```

### 安全头配置

```javascript
// next.config.mjs
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
];

const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};
```

## 🚀 CI/CD 配置

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test
      
      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_APPWRITE_ENDPOINT: ${{ secrets.APPWRITE_ENDPOINT }}
          NEXT_PUBLIC_APPWRITE_PROJECT_ID: ${{ secrets.APPWRITE_PROJECT_ID }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## 📈 性能优化

### 构建优化

```javascript
// 代码分割
const DynamicComponent = dynamic(() => import('../components/HeavyComponent'), {
  loading: () => <LoadingSpinner />,
  ssr: false
});

// 预加载关键资源
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossOrigin="" />
```

### 缓存策略

```javascript
// 静态资源缓存
const nextConfig = {
  async headers() {
    return [
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};
```

## 🔍 故障排除

### 常见问题

1. **构建失败**
   ```bash
   # 清理缓存
   npm run clean
   rm -rf .next
   npm install
   npm run build
   ```

2. **环境变量未生效**
   ```bash
   # 检查变量名前缀
   NEXT_PUBLIC_* # 客户端可访问
   # 其他变量仅服务端可访问
   ```

3. **部署后页面空白**
   ```bash
   # 检查控制台错误
   # 确认所有环境变量已配置
   # 检查 Appwrite 服务状态
   ```

### 日志查看

```bash
# Vercel 日志
vercel logs your-deployment-url

# 本地调试
npm run dev -- --debug
```

## 📋 部署检查清单

### 部署前检查

- [ ] 所有测试通过
- [ ] 环境变量已配置
- [ ] 构建成功
- [ ] 安全配置已启用
- [ ] 性能优化已应用

### 部署后验证

- [ ] 网站可正常访问
- [ ] 所有功能正常工作
- [ ] 性能指标符合预期
- [ ] 错误监控正常
- [ ] SSL 证书有效

## 🔄 回滚策略

### 快速回滚

```bash
# Vercel 回滚到上一个版本
vercel rollback

# 或指定特定部署
vercel rollback deployment-url
```

### 数据库回滚

```bash
# 如果需要数据库回滚
# 1. 停止应用
# 2. 恢复数据库备份
# 3. 重新部署对应版本
```

---

## 📊 总结

通过本部署指南，你可以：

1. **快速部署**: 使用 Vercel 一键部署
2. **环境配置**: 正确配置各种环境
3. **安全保障**: 实施安全最佳实践
4. **性能优化**: 应用性能优化策略
5. **监控运维**: 建立完善的监控体系

**🔗 相关链接**:
- [Vercel 文档](https://vercel.com/docs)
- [Next.js 部署文档](https://nextjs.org/docs/deployment)
- [Appwrite 部署指南](https://appwrite.io/docs/self-hosting) 