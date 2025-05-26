# 环境变量配置指南

## 快速开始

1. 在项目根目录创建 `.env.local` 文件
2. 复制以下内容并替换为你的实际配置值

```env
# Appwrite 配置
# 从 Appwrite 控制台获取这些值

# 项目基础配置
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_STORAGE_ID=your_storage_bucket_id_here

# 数据库配置
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id_here

# 集合配置 (建议使用以下默认值)
NEXT_PUBLIC_APPWRITE_DATABASE_COLLECTION_TODOS_ID=todos
NEXT_PUBLIC_APPWRITE_DATABASE_COLLECTION_USERS_ID=users
NEXT_PUBLIC_APPWRITE_DATABASE_COLLECTION_FRIENDSHIPS_ID=friendships
NEXT_PUBLIC_APPWRITE_DATABASE_COLLECTION_NOTIFICATIONS_ID=notifications
```

## 获取配置值

### 1. 项目ID (NEXT_PUBLIC_APPWRITE_PROJECT_ID)
- 登录 [Appwrite 控制台](https://cloud.appwrite.io)
- 选择你的项目
- 在项目设置中找到 Project ID

### 2. 端点 (NEXT_PUBLIC_APPWRITE_ENDPOINT)
- 如果使用 Appwrite Cloud：`https://cloud.appwrite.io/v1`
- 如果自托管：你的 Appwrite 服务器地址

### 3. 存储桶ID (NEXT_PUBLIC_APPWRITE_STORAGE_ID)
- 在 Appwrite 控制台中进入 Storage
- 创建一个存储桶或使用现有的
- 复制存储桶ID

### 4. 数据库ID (NEXT_PUBLIC_APPWRITE_DATABASE_ID)
- 在 Appwrite 控制台中进入 Databases
- 创建一个数据库或使用现有的
- 复制数据库ID

### 5. 集合ID
- 按照 `DATABASE_SETUP.md` 创建相应的集合
- 建议使用默认的集合名称：`todos`, `users`, `friendships`, `notifications`

## 验证配置

启动开发服务器后，在浏览器控制台中应该看到：
- ✅ 所有必需的环境变量已配置

如果看到错误信息，请检查：
1. `.env.local` 文件是否在项目根目录
2. 所有环境变量是否正确设置
3. Appwrite 项目是否正确配置

## 注意事项

- 所有环境变量都以 `NEXT_PUBLIC_` 开头，这意味着它们会暴露给客户端
- 不要在这些变量中存储敏感信息
- `.env.local` 文件不应提交到版本控制系统 