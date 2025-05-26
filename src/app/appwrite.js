import { APPWRITE_CONFIG } from "./config/appwrite.js";
import { Client, Account, Storage, Databases } from "appwrite";

// 初始化 Appwrite 客户端
const client = new Client()
  .setEndpoint(APPWRITE_CONFIG.endpoint)
  .setProject(APPWRITE_CONFIG.projectId);

// 导出服务实例
export const account = new Account(client);
export const storage = new Storage(client);
export const databases = new Databases(client);

// 导出配置和工具
export { APPWRITE_CONFIG };
export { ID, Query } from 'appwrite';