#!/bin/bash

# Con-Nav-Item 通用Linux服务器一键部署脚本
# 支持：Ubuntu, Debian, CentOS, RHEL, Fedora 等

set -e

export LC_ALL=C
re="\033[0m"
red="\033[1;91m"
green="\e[1;32m"
yellow="\e[1;33m"
purple="\e[1;35m"

red() { echo -e "\e[1;91m$1\033[0m"; }
green() { echo -e "\e[1;32m$1\033[0m"; }
yellow() { echo -e "\e[1;33m$1\033[0m"; }
purple() { echo -e "\e[1;35m$1\033[0m"; }

echo ""
green "=========================================="
green "  Con-Nav-Item 通用Linux服务器部署脚本"
green "  GitHub: github.com/zczy-k/Con-Nav-Item"
green "=========================================="
echo ""

# 检测操作系统
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        VERSION=$VERSION_ID
    else
        red "无法检测操作系统"
        exit 1
    fi
    
    yellow "检测到操作系统: $OS $VERSION"
}

# 安装 Node.js 20
install_nodejs() {
    yellow "检查 Node.js..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        green "Node.js 已安装: $NODE_VERSION"
        return 0
    fi
    
    yellow "安装 Node.js 20..."
    
    case "$OS" in
        ubuntu|debian)
            curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
            sudo apt-get install -y nodejs
            ;;
        centos|rhel|fedora)
            curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
            sudo yum install -y nodejs
            ;;
        *)
            red "不支持的操作系统: $OS"
            red "请手动安装 Node.js 20: https://nodejs.org/"
            exit 1
            ;;
    esac
    
    green "Node.js 安装完成: $(node --version)"
}

# 安装 PM2
install_pm2() {
    yellow "检查 PM2..."
    
    if command -v pm2 &> /dev/null; then
        green "PM2 已安装"
        return 0
    fi
    
    yellow "安装 PM2..."
    sudo npm install -g pm2
    green "PM2 安装完成"
}

# 安装项目
install_app() {
    yellow "安装 Con-Nav-Item..."
    
    INSTALL_DIR=${INSTALL_DIR:-"$HOME/Con-Nav-Item"}
    
    # 如果目录存在，询问是否备份
    if [ -d "$INSTALL_DIR" ]; then
        yellow "检测到已存在的安装目录: $INSTALL_DIR"
        read -p "是否备份并重新安装? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            BACKUP_DIR="${INSTALL_DIR}_backup_$(date +%Y%m%d_%H%M%S)"
            yellow "备份到: $BACKUP_DIR"
            mv "$INSTALL_DIR" "$BACKUP_DIR"
        else
            yellow "取消安装"
            exit 0
        fi
    fi
    
    # 克隆项目
    yellow "克隆项目..."
    git clone https://github.com/zczy-k/Con-Nav-Item.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"
    
    # 安装后端依赖
    yellow "安装后端依赖..."
    npm install
    
    # 构建前端
    yellow "构建前端..."
    cd web
    npm install
    npm run build:prod
    cd ..
    
    green "项目安装完成！"
}

# 配置环境变量
configure_env() {
    yellow "配置环境变量..."
    
    # 读取用户输入
    read -p "设置管理员用户名 [admin]: " ADMIN_USER
    ADMIN_USER=${ADMIN_USER:-admin}
    
    read -sp "设置管理员密码 [123456]: " ADMIN_PASS
    echo
    ADMIN_PASS=${ADMIN_PASS:-123456}
    
    read -p "设置运行端口 [3000]: " PORT
    PORT=${PORT:-3000}
    
    # 创建 .env 文件
    cat > "$INSTALL_DIR/.env" <<EOF
PORT=${PORT}
ADMIN_USERNAME=${ADMIN_USER}
ADMIN_PASSWORD=${ADMIN_PASS}
NODE_ENV=production
EOF
    
    chmod 600 "$INSTALL_DIR/.env"
    green "环境配置完成"
}

# 使用 PM2 启动应用
start_with_pm2() {
    yellow "使用 PM2 启动应用..."
    
    cd "$INSTALL_DIR"
    
    # 停止旧进程（如果存在）
    pm2 stop Con-Nav-Item 2>/dev/null || true
    pm2 delete Con-Nav-Item 2>/dev/null || true
    
    # 启动应用
    pm2 start app.js --name Con-Nav-Item
    
    # 设置开机自启
    pm2 save
    pm2 startup | tail -n 1 | bash
    
    green "应用已启动！"
    pm2 status
}

# 配置防火墙（可选）
configure_firewall() {
    yellow "是否配置防火墙规则？"
    read -p "开放端口 $PORT (y/n): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return 0
    fi
    
    if command -v ufw &> /dev/null; then
        sudo ufw allow $PORT/tcp
        green "UFW 防火墙规则已添加"
    elif command -v firewall-cmd &> /dev/null; then
        sudo firewall-cmd --permanent --add-port=$PORT/tcp
        sudo firewall-cmd --reload
        green "FirewallD 规则已添加"
    else
        yellow "未检测到防火墙管理工具"
    fi
}

# 显示信息
show_info() {
    echo ""
    green "=========================================="
    green "  安装完成！"
    green "=========================================="
    echo ""
    
    IP=$(curl -s ifconfig.me 2>/dev/null || echo "YOUR_SERVER_IP")
    
    echo -e "${green}访问地址：${purple}http://${IP}:${PORT}${re}"
    echo -e "${green}后台管理：${purple}http://${IP}:${PORT}/admin${re}"
    echo -e "${green}管理账号：${purple}${ADMIN_USER}${re}"
    echo -e "${green}管理密码：${purple}${ADMIN_PASS}${re}"
    echo ""
    red "⚠️  请登录后立即修改密码！"
    echo ""
    
    yellow "常用命令："
    echo "  pm2 status              - 查看应用状态"
    echo "  pm2 logs Con-Nav-Item   - 查看日志"
    echo "  pm2 restart Con-Nav-Item - 重启应用"
    echo "  pm2 stop Con-Nav-Item   - 停止应用"
    echo ""
    
    green "=========================================="
}

# 主函数
main() {
    detect_os
    install_nodejs
    install_pm2
    install_app
    configure_env
    start_with_pm2
    configure_firewall
    show_info
}

main
