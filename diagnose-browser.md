# 浏览器端诊断步骤

如果网页空白但控制台没有错误，请按以下步骤诊断：

## 🔍 步骤 1：检查 HTML 是否加载

1. **打开开发者工具（F12）**
2. **切换到 "Elements"（元素）或 "Inspector"（检查器）标签**
3. **查看 HTML 结构**

**期望结果：**
- 应该看到完整的 HTML 结构
- 有 `<div id="app"></div>` 元素
- `<head>` 中有 `<script>` 标签引用 JS 文件

**如果 HTML 是空的或不完整：** 说明服务器返回的 HTML 有问题

---

## 🔍 步骤 2：检查 JavaScript 文件是否加载

1. **在开发者工具中，切换到 "Network"（网络）标签**
2. **刷新页面（Ctrl+R）**
3. **查看所有请求**

**重点检查：**
- 找到 `index-*.js` 文件（如 `index-DdlO8TPE.js`）
- 点击它，查看：
  - **Status Code**（状态码）：应该是 `200 OK`
  - **Response**（响应）标签：应该能看到 JavaScript 代码
  - **Size**（大小）：应该是 90+ KB

**如果状态码是 404、502、或其他错误：** JS 文件没有正确加载

---

## 🔍 步骤 3：检查 Vue 应用是否挂载

1. **在开发者工具的 "Console"（控制台）标签**
2. **输入以下命令并回车：**

```javascript
document.getElementById('app')
```

**期望结果：**
- 应该显示 `<div id="app">...</div>` 和其内部的内容
- 如果是空的 `<div id="app"></div>`，说明 Vue 没有挂载

3. **再输入以下命令：**

```javascript
console.log('App Version:', window.APP_VERSION || 'Not Found')
```

**检查是否输出版本信息**

---

## 🔍 步骤 4：手动检查 JS 文件内容

1. **在 "Network" 标签找到 `index.html`**
2. **点击它，切换到 "Response" 标签**
3. **查看 HTML 源代码，找到 `<script>` 标签**

**应该看到类似：**
```html
<script type="module" src="/assets/index-DdlO8TPE.js"></script>
```

4. **复制 JS 文件的 URL（如 `/assets/index-DdlO8TPE.js`）**
5. **在浏览器新标签页直接访问：**
```
http://你的服务器IP:3000/assets/index-DdlO8TPE.js
```

**期望结果：**
- 应该能看到 JavaScript 代码
- 搜索 "App Version"，应该能找到这个字符串

**如果浏览器显示错误或下载文件而不是显示代码：** MIME 类型配置有问题

---

## 🔍 步骤 5：检查 Vue DevTools

如果你安装了 Vue DevTools 扩展：

1. **打开开发者工具**
2. **切换到 "Vue" 标签**

**如果没有 "Vue" 标签：** Vue 应用没有正确初始化

---

## 🔍 步骤 6：检查是否有 JavaScript 错误被忽略

1. **在 Console 标签，点击右上角的齿轮图标（设置）**
2. **确保勾选了：**
   - ☑️ "Preserve log"（保留日志）
   - ☑️ "Show timestamps"（显示时间戳）
   - ☑️ "Verbose"（详细）
3. **刷新页面，查看是否有任何输出**

---

## 🔍 步骤 7：检查服务器端

在服务器上执行：

```bash
# 1. 检查容器日志
docker logs --tail 100 Con-Nav-Item

# 2. 检查容器内的文件
docker exec Con-Nav-Item ls -lh /app/web/dist/
docker exec Con-Nav-Item ls -lh /app/web/dist/assets/

# 3. 检查 index.html 内容
docker exec Con-Nav-Item cat /app/web/dist/index.html

# 4. 测试容器内的服务
docker exec Con-Nav-Item wget -qO- http://localhost:3000 | head -50
```

---

## 📊 请提供以下信息

完成上述步骤后，请告诉我：

1. **步骤 1** - HTML 结构是否完整？`#app` 元素内有内容吗？
2. **步骤 2** - JS 文件的 Status Code 是什么？Size 多大？
3. **步骤 3** - `document.getElementById('app')` 输出了什么？
4. **步骤 4** - 能否直接访问 JS 文件？能否搜索到 "App Version"？
5. **步骤 6** - Console 中是否有任何输出（包括 log、warn、error）？
6. **步骤 7** - 容器日志显示了什么？

根据你提供的信息，我会精确定位问题所在。

---

## 💡 常见原因

1. **CSP 阻止了 script 执行** - 会在 Console 看到 CSP 错误
2. **MIME 类型错误** - JS 文件被当作其他类型处理
3. **Vue 挂载失败** - JavaScript 代码有语法错误
4. **路径问题** - JS 文件路径不正确，404
5. **缓存问题** - 浏览器缓存了旧版本的空页面
