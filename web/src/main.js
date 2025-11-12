import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

// ==============================================
// 🔧 调试日志系统
// ==============================================
const DEBUG = true; // 生产环境设为 false

function logDebug(message, data = null) {
  if (!DEBUG) return;
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`[${timestamp}] 🔧 ${message}`, data || '');
}

function logError(message, error = null) {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.error(`[${timestamp}] ❌ ${message}`, error || '');
}

function logSuccess(message, data = null) {
  if (!DEBUG) return;
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`[${timestamp}] ✅ ${message}`, data || '');
}

// ==============================================
// 🚀 应用初始化
// ==============================================
console.log('%c==============================================', 'color: #00f; font-weight: bold');
console.log('%cCon-Nav-Item 导航系统', 'color: #00f; font-size: 16px; font-weight: bold');
console.log('%cVersion: 2025.11.12.debug', 'color: #666');
console.log('%c==============================================', 'color: #00f; font-weight: bold');
console.log('');

logDebug('📦 模块导入完成');
logDebug('  - Vue:', { version: createApp.version || 'unknown' });
logDebug('  - App Component:', App ? '✓' : '✗');
logDebug('  - Router:', router ? '✓' : '✗');

try {
  logDebug('🎯 检查挂载点...');
  const appElement = document.getElementById('app');
  
  if (!appElement) {
    logError('✗ 找不到 #app 元素！请检查 HTML 模板');
    throw new Error('Mount point #app not found');
  }
  
  logSuccess('#app 元素存在');
  logDebug('  - Element:', appElement);
  
  logDebug('🎨 创建 Vue 应用实例...');
  const app = createApp(App);
  logSuccess('Vue 应用实例创建成功');
  
  logDebug('🛣️ 注册路由...');
  app.use(router);
  logSuccess('路由注册成功');
  
  logDebug('📌 挂载应用到 #app...');
  app.mount('#app');
  logSuccess('✨ 应用挂载成功！');
  
  console.log('');
  console.log('%c✅ 应用启动完成', 'color: #0f0; font-size: 14px; font-weight: bold');
  console.log('');
  
  // 设置全局调试信息
  window.__APP_DEBUG__ = {
    version: '2025.11.12.debug',
    vue: app,
    router: router,
    mounted: true,
    timestamp: new Date().toISOString()
  };
  
  logDebug('📊 调试信息已设置到 window.__APP_DEBUG__');
  
} catch (error) {
  logError('❗ 应用启动失败', error);
  console.error('Error details:', {
    name: error.name,
    message: error.message,
    stack: error.stack
  });
  
  // 显示错误信息到页面
  const appElement = document.getElementById('app');
  if (appElement) {
    appElement.innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
        <h1 style="color: #f00;">❌ 应用启动失败</h1>
        <p style="color: #666;">${error.message}</p>
        <p style="color: #999; font-size: 12px;">请打开浏览器控制台查看详细错误信息</p>
      </div>
    `;
  }
  
  throw error;
}
