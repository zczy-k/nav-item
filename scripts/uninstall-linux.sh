#!/bin/bash

# Con-Nav-Item Linux 服务器卸载脚本
# 用于完全卸载应用并恢复部署前的状态

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
green "  Con-Nav-Item 卸载脚本"
green "  GitHub: github.com/zczy-k/Con-Nav-Item"
green "=========================================="
echo ""

# 默认安装目录
INSTALL_DIR=${INSTALL_DIR:-"$HOME/Con-Nav-Item"}

# 确认卸载
confirm_uninstall() {
    red "⚠️  警告：此操作将卸载 Con-Nav-Item 并删除所有数据！"
    echo ""
    yellow "将要执行的操作："
    echo "  1. 停止并删除 PM2 进程"
    echo "  2. 删除应用目录: $INSTALL_DIR"
    echo "  3. 清理 PM2 启动配置"
    echo ""
    red "💡 提示：数据将会备份到 ${INSTALL_DIR}_uninstall_backup_$(date +%Y%m%d_%H%M%S)"
    echo ""
    
    read -p "确认卸载？(yes/no): " -r
    echo
    
    if [ "$REPLY" != "yes" ]; then
        yellow "取消卸载"
        exit 0
    fi
}

# 检查安装目录
check_installation() {
    if [ ! -d "$INSTALL_DIR" ]; then
        red "错误：未找到安装目录 $INSTALL_DIR"
        red "请检查安装目录或使用 INSTALL_DIR 环境变量指定正确路径"
        echo ""
        yellow "示例："
        echo "  INSTALL_DIR=/opt/Con-Nav-Item bash uninstall-linux.sh"
        exit 1
    fi
    
    green "✓ 找到安装目录: $INSTALL_DIR"
}

# 停止 PM2 进程
stop_pm2_process() {
    yellow "停止 PM2 进程..."
    
    if ! command -v pm2 &> /dev/null; then
        yellow "PM2 未安装，跳过"
        return 0
    fi
    
    # 检查进程是否存在
    if pm2 list | grep -q "Con-Nav-Item"; then
        pm2 stop Con-Nav-Item 2>/dev/null || true
        pm2 delete Con-Nav-Item 2>/dev/null || true
        green "✓ PM2 进程已停止"
    else
        yellow "未找到运行中的 Con-Nav-Item 进程"
    fi
    
    # 保存 PM2 状态
    pm2 save --force 2>/dev/null || true
}

# 备份数据
backup_data() {
    yellow "备份数据..."
    
    BACKUP_DIR="${INSTALL_DIR}_uninstall_backup_$(date +%Y%m%d_%H%M%S)"
    
    # 创建备份目录
    mkdir -p "$BACKUP_DIR"
    
    # 备份数据库
    if [ -d "$INSTALL_DIR/database" ]; then
        cp -r "$INSTALL_DIR/database" "$BACKUP_DIR/"
        green "✓ 数据库已备份"
    fi
    
    # 备份上传文件
    if [ -d "$INSTALL_DIR/uploads" ]; then
        cp -r "$INSTALL_DIR/uploads" "$BACKUP_DIR/"
        green "✓ 上传文件已备份"
    fi
    
    # 备份配置文件
    if [ -f "$INSTALL_DIR/.env" ]; then
        cp "$INSTALL_DIR/.env" "$BACKUP_DIR/"
        green "✓ 配置文件已备份"
    fi
    
    # 备份本地备份文件
    if [ -d "$INSTALL_DIR/backups" ]; then
        cp -r "$INSTALL_DIR/backups" "$BACKUP_DIR/"
        green "✓ 本地备份文件已备份"
    fi
    
    # 备份自动备份配置
    if [ -d "$INSTALL_DIR/config" ]; then
        cp -r "$INSTALL_DIR/config" "$BACKUP_DIR/"
        green "✓ 自动备份配置已备份"
    fi
    
    green "✓ 数据已备份到: $BACKUP_DIR"
    echo ""
}

# 删除应用目录
remove_app_directory() {
    yellow "删除应用目录..."
    
    if [ -d "$INSTALL_DIR" ]; then
        rm -rf "$INSTALL_DIR"
        green "✓ 应用目录已删除: $INSTALL_DIR"
    else
        yellow "应用目录不存在，跳过"
    fi
}

# 清理 PM2 配置（可选）
cleanup_pm2_config() {
    echo ""
    yellow "是否完全清理 PM2 配置？"
    echo "  - 如果你还有其他应用使用 PM2，请选择 'n'"
    echo "  - 如果只有 Con-Nav-Item 使用 PM2，可以选择 'y'"
    echo ""
    read -p "清理 PM2 配置和开机自启？(y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if command -v pm2 &> /dev/null; then
            # 检查是否还有其他进程
            PROCESS_COUNT=$(pm2 list | grep -c "online\|stopped\|errored" || echo "0")
            
            if [ "$PROCESS_COUNT" -gt 0 ]; then
                yellow "检测到其他 PM2 进程，保留 PM2 配置"
            else
                yellow "删除 PM2 开机自启配置..."
                pm2 unstartup systemd -u $USER --hp $HOME 2>/dev/null || true
                green "✓ PM2 开机自启已禁用"
            fi
        fi
    else
        yellow "保留 PM2 配置"
    fi
}

# 是否删除 Node.js 和 PM2（可选）
cleanup_dependencies() {
    echo ""
    yellow "是否卸载依赖？"
    echo "  - Node.js 和 PM2 可能被其他应用使用"
    echo "  - 建议保留，除非确定不再需要"
    echo ""
    read -p "卸载 Node.js 和 PM2？(y/n): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        yellow "保留 Node.js 和 PM2"
        return 0
    fi
    
    # 卸载 PM2
    if command -v pm2 &> /dev/null; then
        yellow "卸载 PM2..."
        npm uninstall -g pm2 2>/dev/null || sudo npm uninstall -g pm2 2>/dev/null || true
        green "✓ PM2 已卸载"
    fi
    
    # 卸载 Node.js
    if command -v node &> /dev/null; then
        yellow "卸载 Node.js..."
        
        if [ -f /etc/os-release ]; then
            . /etc/os-release
            OS=$ID
            
            case "$OS" in
                ubuntu|debian)
                    sudo apt-get remove -y nodejs npm 2>/dev/null || true
                    sudo apt-get autoremove -y 2>/dev/null || true
                    ;;
                centos|rhel|fedora)
                    sudo yum remove -y nodejs npm 2>/dev/null || true
                    ;;
                *)
                    yellow "请手动卸载 Node.js"
                    ;;
            esac
            
            green "✓ Node.js 已卸载"
        fi
    fi
}

# 显示卸载结果
show_result() {
    echo ""
    green "=========================================="
    green "  卸载完成！"
    green "=========================================="
    echo ""
    
    green "已完成的操作："
    echo "  ✓ 停止并删除 PM2 进程"
    echo "  ✓ 删除应用目录"
    echo "  ✓ 备份数据到: $BACKUP_DIR"
    echo ""
    
    yellow "备份说明："
    echo "  - 数据库: $BACKUP_DIR/database/"
    echo "  - 上传文件: $BACKUP_DIR/uploads/"
    echo "  - 配置文件: $BACKUP_DIR/.env"
    echo "  - 本地备份: $BACKUP_DIR/backups/"
    echo ""
    
    purple "如需重新安装，请运行："
    echo "  bash <(curl -Ls https://raw.githubusercontent.com/zczy-k/Con-Nav-Item/main/scripts/install-linux.sh)"
    echo ""
    
    purple "如需恢复数据，重新安装后执行："
    echo "  cp -r $BACKUP_DIR/database/* ~/Con-Nav-Item/database/"
    echo "  cp -r $BACKUP_DIR/uploads/* ~/Con-Nav-Item/uploads/"
    echo "  pm2 restart Con-Nav-Item"
    echo ""
    
    green "=========================================="
}

# 主函数
main() {
    confirm_uninstall
    check_installation
    stop_pm2_process
    backup_data
    remove_app_directory
    cleanup_pm2_config
    cleanup_dependencies
    show_result
}

main
