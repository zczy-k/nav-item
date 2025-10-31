# 扩展打包指南

## 方案1：使用开发者模式（推荐）

不打包，直接使用源代码：

1. 打开 `chrome://extensions/`
2. 开启"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择 `browser-extension` 文件夹

**优点：** 不会被禁用，可以随时修改

---

## 方案2：使用持久化密钥打包

如果需要 CRX 文件，使用持久化密钥避免扩展 ID 变化：

### 首次打包

```bash
# 使用 Chrome 打包
chrome --pack-extension=/path/to/browser-extension

# 会生成两个文件：
# - browser-extension.crx（扩展文件）
# - browser-extension.pem（私钥，重要！）
```

**⚠️ 重要：** 保存好 `.pem` 文件，下次更新时需要用到

### 更新打包（使用相同密钥）

```bash
chrome --pack-extension=/path/to/browser-extension \
       --pack-extension-key=/path/to/browser-extension.pem
```

这样每次打包的扩展 ID 都相同。

---

## 方案3：发布到 Chrome 应用商店

### 准备工作

1. 注册 Chrome 开发者账号：https://chrome.google.com/webstore/devconsole
   - 需要支付 $5 一次性注册费
   - 使用 Google 账号登录

2. 准备扩展资源：
   - 128x128 应用图标 ✅（已有）
   - 1280x800 或 640x400 截图（至少1张，最多5张）
   - 440x280 宣传图（可选）
   - 扩展描述和说明

### 打包上传

```bash
# 1. 打包扩展为 ZIP（不是 CRX）
cd browser-extension
zip -r ../nav-newtab-extension.zip *

# 2. 在开发者控制台上传 ZIP 文件
# 3. 填写扩展信息
# 4. 提交审核
```

### 审核时间

- 首次提交：1-3 天
- 更新提交：几小时到 1 天

---

## 方案4：分发给其他用户

### 选项A：GitHub Releases

1. 使用持久化密钥打包
2. 上传 `.crx` 到 GitHub Releases
3. 用户下载后拖入 `chrome://extensions/`

**问题：** 仍会提示"非来源"警告

### 选项B：提供源代码

1. 用户下载源代码
2. 使用开发者模式加载
3. 最稳定的方式

---

## 推荐方案对比

| 方案 | 稳定性 | 易用性 | 成本 | 适用场景 |
|------|--------|--------|------|----------|
| 开发者模式 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 免费 | 个人使用 |
| Chrome 商店 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | $5 | 公开分发 |
| CRX 文件 | ⭐⭐⭐ | ⭐⭐⭐ | 免费 | 内部分发 |
| 组策略 | ⭐⭐⭐⭐ | ⭐⭐ | 免费 | 企业环境 |

---

## 当前项目建议

**对于个人使用：**
- 使用开发者模式加载（方案1）
- 最稳定，不会被禁用

**对于公开分发：**
- 发布到 Chrome 应用商店（方案3）
- 需要 $5，但体验最好

**对于内部团队：**
- 提供源代码，团队成员使用开发者模式加载
- 或使用企业组策略
