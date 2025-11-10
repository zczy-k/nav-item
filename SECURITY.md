# 安全加固文档

## 概述

本项目已实施全面的安全加固措施，保护系统免受常见的Web安全威胁。

## 🛡️ 已实施的安全措施

### 1. 身份认证与授权

#### JWT令牌安全
- ✅ JWT密钥从环境变量读取，不再硬编码
- ✅ 令牌有效期设置为2小时
- ✅ 使用bcrypt加密存储密码（10轮盐值）

**配置方法：**
```bash
# 在.env文件中设置（生产环境必须修改）
JWT_SECRET=your-very-secure-random-key-here
```

#### 密码策略
- ✅ 最小长度：8位
- ✅ 复杂度要求：必须包含以下至少3种
  - 大写字母 (A-Z)
  - 小写字母 (a-z)
  - 数字 (0-9)
  - 特殊字符 (!@#$%^&*等)
- ✅ 最大长度：128位

#### 用户名规则
- ✅ 长度：3-20位
- ✅ 允许字符：字母、数字、下划线
- ✅ 禁止特殊字符防止注入

### 2. 请求频率限制 (Rate Limiting)

| 接口类型 | 时间窗口 | 最大请求数 | 说明 |
|---------|---------|----------|------|
| 通用API | 15分钟 | 100次 | 所有/api路径 |
| 登录接口 | 15分钟 | 5次 | 防暴力破解 |
| 文件上传 | 1小时 | 50次 | 防滥用 |
| 备份操作 | 1小时 | 10次 | 保护资源 |

**触发限制时返回：**
```json
{
  "error": "请求过于频繁，请稍后再试"
}
```

### 3. 文件上传安全

#### 文件类型白名单
```javascript
允许的MIME类型：
- image/jpeg (.jpg, .jpeg)
- image/png (.png)
- image/gif (.gif)
- image/webp (.webp)
- image/svg+xml (.svg)
- image/x-icon (.ico)
```

#### 安全措施
- ✅ MIME类型验证（双重检查）
- ✅ 文件扩展名与MIME匹配验证
- ✅ 文件大小限制：5MB
- ✅ 文件名随机化（加密随机字符串）
- ✅ 需要身份认证才能上传
- ✅ 上传频率限制

### 4. 路径遍历防护

**备份文件操作安全：**
- ✅ 文件名白名单验证（仅允许字母数字和连字符）
- ✅ 禁止`..`相对路径
- ✅ 路径规范化检查
- ✅ 确保文件在指定目录内

**示例防护代码：**
```javascript
function isPathSafe(basePath, targetPath) {
  const resolvedBase = path.resolve(basePath);
  const resolvedTarget = path.resolve(targetPath);
  return resolvedTarget.startsWith(resolvedBase);
}
```

### 5. 输入清理与验证

#### HTML清理
- ✅ 所有用户输入自动清理HTML标签
- ✅ 防止XSS（跨站脚本）攻击
- ✅ 递归清理对象和数组

#### URL验证
- ✅ 仅允许http/https协议
- ✅ URL格式严格验证
- ✅ 防止javascript:伪协议注入

### 6. 安全响应头 (Helmet)

已启用的安全头：

```http
Content-Security-Policy: 限制资源加载来源
X-Content-Type-Options: nosniff
X-Frame-Options: DENY (防止点击劫持)
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
```

### 7. 错误处理

#### 生产环境
- ❌ 不暴露详细错误信息
- ✅ 返回通用错误消息
- ✅ 完整错误记录在服务器日志

#### 开发环境
- ✅ 显示详细错误和堆栈跟踪
- ✅ 方便调试

**环境切换：**
```bash
NODE_ENV=production  # 生产环境
NODE_ENV=development # 开发环境
```

### 8. SQL注入防护

- ✅ 所有数据库查询使用参数化语句
- ✅ 永不拼接SQL字符串
- ✅ 使用`?`占位符传递参数

**示例：**
```javascript
// ✅ 安全
db.run('SELECT * FROM users WHERE username=?', [username], callback);

// ❌ 危险 (已禁止)
db.run(`SELECT * FROM users WHERE username='${username}'`, callback);
```

## 🔧 配置指南

### 环境变量

创建`.env`文件：

```env
# 服务器配置
PORT=3000
NODE_ENV=production

# 安全配置（生产环境必须修改！）
JWT_SECRET=generate-a-random-64-char-string-here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=YourSecurePassword123!

# CORS配置（可选，生产环境建议限制）
CORS_ORIGIN=https://yourdomain.com
```

### 生成安全的JWT密钥

```bash
# Linux/Mac
openssl rand -base64 64

# Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

## 📋 安全检查清单

部署前请确认：

- [ ] 已修改默认管理员账号和密码
- [ ] 已设置强随机JWT_SECRET
- [ ] 已设置NODE_ENV=production
- [ ] 已限制CORS_ORIGIN（如果需要）
- [ ] 已启用HTTPS（生产环境）
- [ ] 已配置防火墙规则
- [ ] 已定期更新依赖包
- [ ] 已启用数据库备份

## 🚨 漏洞报告

如发现安全问题，请通过以下方式报告：

1. **不要**公开披露漏洞
2. 发送邮件至项目维护者
3. 提供详细的复现步骤
4. 等待修复后再公开

## 🔄 更新日志

### v2.0.0 - 安全加固版本

**新增：**
- JWT密钥环境变量化
- 请求频率限制
- 文件上传安全加固
- 路径遍历防护
- 输入清理中间件
- Helmet安全头
- 统一错误处理
- 密码强度验证
- 用户名格式验证

**修复：**
- SQL注入风险（参数化查询）
- XSS攻击风险（HTML清理）
- 路径遍历漏洞（路径验证）
- 信息泄露（安全错误处理）
- 暴力破解风险（登录限流）
- 文件上传滥用（认证+限流+类型验证）

## 📚 参考资源

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security](https://expressjs.com/en/advanced/best-practice-security.html)
- [Helmet.js Documentation](https://helmetjs.github.io/)

## 🧪 安全测试

推荐使用以下工具进行安全测试：

```bash
# npm依赖安全审计
npm audit

# 自动安全扫描
npm install -g snyk
snyk test

# 代码质量检查
npm install -g eslint
eslint .
```

## 📞 技术支持

如需帮助，请：
1. 查看 [README.md](README.md)
2. 提交 [Issue](https://github.com/zczy-k/Con-Nav-Item/issues)
3. 查看项目文档

---

**重要提示：** 安全是一个持续的过程，请定期检查更新并关注安全公告。
