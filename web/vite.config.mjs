import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { copyFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

export default defineConfig({
  // Force rebuild: 202511120855
  plugins: [
    vue(),
    {
      name: 'copy-pwa-files',
      closeBundle() {
        // 复制 PWA 文件到 dist 目录
        const publicDir = resolve(__dirname, 'public');
        const distDir = resolve(__dirname, 'dist');
        const iconsDir = resolve(distDir, 'icons');
        
        try {
          // 确保 icons 目录存在
          mkdirSync(iconsDir, { recursive: true });
          
          // 复制 PWA 相关文件
          copyFileSync(resolve(publicDir, 'manifest.json'), resolve(distDir, 'manifest.json'));
          copyFileSync(resolve(publicDir, 'sw.js'), resolve(distDir, 'sw.js'));
          copyFileSync(resolve(publicDir, 'icons/icon-192x192.png'), resolve(iconsDir, 'icon-192x192.png'));
          copyFileSync(resolve(publicDir, 'icons/icon-512x512.png'), resolve(iconsDir, 'icon-512x512.png'));
          
          console.log('✅ PWA 文件复制成功');
        } catch (err) {
          console.error('❌ PWA 文件复制失败:', err.message);
        }
      }
    }
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2015',
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false
  }
});
