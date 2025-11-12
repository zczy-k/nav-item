#!/bin/bash
# Docker 镜像和部署完整诊断脚本

echo "=========================================="
echo "Docker 镜像和部署完整诊断"
echo "=========================================="
echo ""

# 1. 检查 GitHub Actions 最新构建
echo "1. 检查 GitHub Actions 最新构建状态"
echo "   访问: https://github.com/zczy-k/Con-Nav-Item/actions"
echo "   请确认最新的工作流是否成功完成（绿色勾）"
echo ""
read -p "按回车继续..."

# 2. 检查本地镜像信息
echo ""
echo "2. 本地 Docker 镜像信息"
echo "----------------------------------------"
docker images ghcr.io/zczy-k/con-nav-item:latest --format "table {{.Repository}}:{{.Tag}}\t{{.ID}}\t{{.CreatedAt}}\t{{.Size}}"
echo ""

# 3. 检查镜像的构建历史
echo "3. 镜像构建历史（最近5层）"
echo "----------------------------------------"
docker history ghcr.io/zczy-k/con-nav-item:latest --no-trunc | head -n 6
echo ""

# 4. 启动临时容器检查文件
echo "4. 检查镜像内部文件"
echo "----------------------------------------"
echo "正在启动临时容器..."

CONTAINER_ID=$(docker run -d ghcr.io/zczy-k/con-nav-item:latest tail -f /dev/null)
echo "容器 ID: $CONTAINER_ID"
echo ""

echo "4.1 检查前端 JS 文件:"
docker exec $CONTAINER_ID ls -lh /app/web/dist/assets/index-*.js
echo ""

echo "4.2 检查 index.html 中引用的 JS 文件名:"
docker exec $CONTAINER_ID grep -o 'index-[^"]*\.js' /app/web/dist/index.html
echo ""

echo "4.3 检查后端工具文件:"
docker exec $CONTAINER_ID ls -lh /app/utils/dbHelpers.js 2>/dev/null && echo "✓ dbHelpers.js 存在" || echo "✗ dbHelpers.js 不存在"
echo ""

echo "4.4 检查 package.json 版本信息:"
docker exec $CONTAINER_ID cat /app/package.json | grep -A 2 '"name"'
echo ""

echo "4.5 检查容器内构建时间戳（如果有）:"
docker exec $CONTAINER_ID env | grep -E 'BUILDTIME|VERSION' || echo "未设置构建时间戳"
echo ""

# 5. 清理临时容器
echo "5. 清理临时容器"
echo "----------------------------------------"
docker stop $CONTAINER_ID > /dev/null
docker rm $CONTAINER_ID > /dev/null
echo "✓ 临时容器已清理"
echo ""

# 6. 检查当前运行的容器
echo "6. 当前运行的容器信息"
echo "----------------------------------------"
if docker ps | grep -q Con-Nav-Item; then
    echo "容器状态:"
    docker ps --filter "name=Con-Nav-Item" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    
    echo "容器内文件检查:"
    docker exec Con-Nav-Item ls -lh /app/web/dist/assets/index-*.js 2>/dev/null
    echo ""
    
    echo "容器日志（最后20行）:"
    docker logs --tail 20 Con-Nav-Item
else
    echo "✗ 容器 Con-Nav-Item 未运行"
fi
echo ""

# 7. 浏览器调试建议
echo "=========================================="
echo "7. 浏览器调试步骤"
echo "=========================================="
echo ""
echo "请在浏览器中执行以下操作："
echo ""
echo "A. 打开开发者工具（F12）"
echo ""
echo "B. 切换到 Network（网络）标签"
echo ""
echo "C. 刷新页面（Ctrl+Shift+R 强制刷新）"
echo ""
echo "D. 找到 index-DxtRh-uD.js 的请求，记录以下信息："
echo "   - Request URL（完整的请求地址）"
echo "   - Status Code（状态码）"
echo "   - Request Headers（请求头）"
echo "   - Response Headers（响应头）"
echo ""
echo "E. 切换到 Console（控制台）标签，记录所有错误信息"
echo ""
echo "F. 查看 index.html 的源代码："
echo "   - 在 Network 标签找到 index.html"
echo "   - 查看 Response，搜索 'index-' 关键字"
echo "   - 确认 HTML 中引用的是哪个 JS 文件"
echo ""
echo "=========================================="
echo "请将以上信息提供给开发者进行进一步分析"
echo "=========================================="
