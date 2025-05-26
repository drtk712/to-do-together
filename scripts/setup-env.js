#!/usr/bin/env node

/**
 * 环境变量设置脚本
 * 帮助用户快速配置项目环境变量
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 环境变量配置模板
const ENV_TEMPLATE = {
  'NEXT_PUBLIC_APPWRITE_ENDPOINT': {
    description: 'Appwrite 服务端点',
    default: 'https://cloud.appwrite.io/v1',
    required: true
  },
  'NEXT_PUBLIC_APPWRITE_PROJECT_ID': {
    description: 'Appwrite 项目ID',
    default: '',
    required: true
  },
  'NEXT_PUBLIC_APPWRITE_DATABASE_ID': {
    description: 'Appwrite 数据库ID',
    default: '',
    required: true
  },
  'NEXT_PUBLIC_APPWRITE_DATABASE_COLLECTION_TODOS_ID': {
    description: 'Todos 集合ID',
    default: '',
    required: true
  },
  'NEXT_PUBLIC_APPWRITE_DATABASE_COLLECTION_USERS_ID': {
    description: 'Users 集合ID',
    default: '',
    required: true
  },
  'NEXT_PUBLIC_APPWRITE_DATABASE_COLLECTION_FRIENDSHIPS_ID': {
    description: 'Friendships 集合ID',
    default: '',
    required: true
  },
  'NEXT_PUBLIC_APPWRITE_DATABASE_COLLECTION_NOTIFICATIONS_ID': {
    description: 'Notifications 集合ID',
    default: '',
    required: true
  },
  'NEXT_PUBLIC_APPWRITE_STORAGE_ID': {
    description: 'Appwrite 存储桶ID (可选)',
    default: '',
    required: false
  }
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupEnvironment() {
  console.log(colorize('\n🚀 To Do Together 环境配置向导\n', 'cyan'));
  console.log('这个向导将帮助您配置项目所需的环境变量。\n');

  const envPath = path.join(process.cwd(), '.env.local');
  const envExamplePath = path.join(process.cwd(), 'env.example');
  
  // 检查是否已存在 .env.local
  if (fs.existsSync(envPath)) {
    const overwrite = await question(
      colorize('⚠️  .env.local 文件已存在，是否覆盖？ (y/N): ', 'yellow')
    );
    if (overwrite.toLowerCase() !== 'y') {
      console.log(colorize('✅ 配置已取消', 'green'));
      rl.close();
      return;
    }
  }

  console.log(colorize('📋 请提供以下配置信息:\n', 'blue'));

  const envConfig = {};

  // 逐个收集环境变量
  for (const [key, config] of Object.entries(ENV_TEMPLATE)) {
    const requiredText = config.required ? colorize(' (必需)', 'red') : colorize(' (可选)', 'yellow');
    const defaultText = config.default ? ` [默认: ${config.default}]` : '';
    
    const prompt = `${config.description}${requiredText}${defaultText}: `;
    let value = await question(prompt);
    
    // 使用默认值
    if (!value && config.default) {
      value = config.default;
    }
    
    // 检查必需字段
    if (config.required && !value) {
      console.log(colorize('❌ 这是必需字段，请提供值', 'red'));
      // 重新询问
      value = await question(prompt);
      while (config.required && !value) {
        console.log(colorize('❌ 这是必需字段，请提供值', 'red'));
        value = await question(prompt);
      }
    }
    
    if (value) {
      envConfig[key] = value;
    }
  }

  // 生成 .env.local 文件内容
  let envContent = '# To Do Together 环境配置\n';
  envContent += '# 由配置向导自动生成\n\n';
  
  for (const [key, value] of Object.entries(envConfig)) {
    envContent += `${key}=${value}\n`;
  }
  
  envContent += '\n# 应用环境\n';
  envContent += 'NODE_ENV=development\n';

  try {
    // 写入文件
    fs.writeFileSync(envPath, envContent);
    
    console.log(colorize('\n✅ 环境配置完成！', 'green'));
    console.log(colorize(`📁 配置文件已保存到: ${envPath}`, 'blue'));
    
    // 显示下一步
    console.log(colorize('\n📋 下一步:', 'cyan'));
    console.log('1. 确保您已在 Appwrite 控制台创建了相应的项目和数据库');
    console.log('2. 运行 npm run dev 启动开发服务器');
    console.log('3. 访问 http://localhost:3000 查看应用');
    
    console.log(colorize('\n💡 提示:', 'yellow'));
    console.log('- 如需修改配置，可以直接编辑 .env.local 文件');
    console.log('- 重启开发服务器后配置才会生效');
    console.log('- .env.local 文件不会被提交到版本控制系统');
    
  } catch (error) {
    console.error(colorize('❌ 写入配置文件失败:', 'red'), error.message);
  }

  rl.close();
}

// 检查是否在项目根目录
function checkProjectRoot() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.error(colorize('❌ 请在项目根目录运行此脚本', 'red'));
    process.exit(1);
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (packageJson.name !== 'to-do-together') {
      console.warn(colorize('⚠️  当前目录可能不是 To Do Together 项目', 'yellow'));
    }
  } catch (error) {
    console.warn(colorize('⚠️  无法读取 package.json', 'yellow'));
  }
}

// 主函数
async function main() {
  try {
    checkProjectRoot();
    await setupEnvironment();
  } catch (error) {
    console.error(colorize('❌ 配置过程中发生错误:', 'red'), error.message);
    process.exit(1);
  }
}

// 处理中断信号
process.on('SIGINT', () => {
  console.log(colorize('\n\n👋 配置已取消', 'yellow'));
  rl.close();
  process.exit(0);
});

// 运行主函数
if (require.main === module) {
  main();
} 