#!/bin/bash
# Docker 镜像和容器诊断脚本

echo "========================================"
echo "   Docker 镜像和容器诊断工具"
echo "========================================"
echo ""

# 1. 检查本地镜像
echo "1️⃣  本地 Docker 镜像列表:"
echo "----------------------------------------"
docker images | grep -E "REPOSITORY|con-nav-item"
echo ""

# 2. 检查容器状态
echo "2️⃣  容器状态:"
echo "----------------------------------------"
docker ps -a | grep -E "CONTAINER|Con-Nav-Item"
echo ""

# 3. 检查容器使用的镜像 ID
echo "3️⃣  容器使用的镜像:"
echo "----------------------------------------"
docker inspect Con-Nav-Item 2>/dev/null | grep -A 3 "Image"
echo ""

# 4. 检查容器内的文件
echo "4️⃣  容器内关键文件检查:"
echo "----------------------------------------"
echo "📁 检查 utils/dbHelpers.js (新增文件):"
docker exec Con-Nav-Item ls -lh /app/utils/dbHelpers.js 2>&1 | head -1
echo ""

echo "📁 检查 middleware/security.js 修改时间:"
docker exec Con-Nav-Item ls -lh /app/middleware/security.js 2>&1 | head -1
echo ""

echo "📁 检查前端构建文件:"
docker exec Con-Nav-Item ls -lh /app/web/dist/assets/*.js 2>&1 | head -5
echo ""

# 5. 检查容器内的代码版本
echo "5️⃣  检查代码内容（CSP 配置）:"
echo "----------------------------------------"
docker exec Con-Nav-Item grep -A 2 "connectSrc" /app/middleware/security.js 2>&1
echo ""

# 6. 容器启动时间
echo "6️⃣  容器创建/启动时间:"
echo "----------------------------------------"
docker inspect Con-Nav-Item 2>/dev/null | grep -E "Created|StartedAt" | head -2
echo ""

# 7. 容器日志（最后 10 行）
echo "7️⃣  容器日志（最后 10 行）:"
echo "----------------------------------------"
docker logs --tail 10 Con-Nav-Item 2>&1
echo ""

# 8. 测试 API 响应
echo "8️⃣  测试 API 响应:"
echo "----------------------------------------"
echo "GET /api/menus:"
curl -s http://localhost:3000/api/menus 2>&1 | head -c 200
echo "..."
echo ""

echo "========================================"
echo "   诊断完成！"
echo "========================================"
echo ""
echo "💡 如何判断是否使用了新镜像："
echo "   ✅ 如果 utils/dbHelpers.js 存在 = 新镜像"
echo "   ❌ 如果 utils/dbHelpers.js 不存在 = 旧镜像"
echo ""
echo "💡 如何判断 CSP 配置是否更新："
echo "   ✅ 如果 connectSrc 包含 'https:', 'http:' = 新配置"
echo "   ❌ 如果 connectSrc 只有 \"'self'\" = 旧配置"
echo ""
