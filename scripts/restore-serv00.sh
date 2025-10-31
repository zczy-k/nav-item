#!/bin/bash

# Nav-Item 一键恢复脚本
# 作者: zczy-k
# 用途: 恢复导航站的备份数据

export LC_ALL=C
red="\033[1;91m"
green="\e[1;32m"
yellow="\e[1;33m"
purple="\e[1;35m"
re="\033[0m"

red() { echo -e "\e[1;91m$1\033[0m"; }
green() { echo -e "\e[1;32m$1\033[0m"; }
yellow() { echo -e "\e[1;33m$1\033[0m"; }
purple() { echo -e "\e[1;35m$1\033[0m"; }
reading() { read -p "$(red "$1")" "$2"; }

HOSTNAME=$(hostname)
USERNAME=$(whoami | tr '[:upper:]' '[:lower:]')
export DOMAIN=${DOMAIN:-''}

# 确定域名
if [[ -z "$DOMAIN" ]]; then
    if [[ "$HOSTNAME" =~ ct8 ]]; then
        CURRENT_DOMAIN="${USERNAME}.ct8.pl"
    elif [[ "$HOSTNAME" =~ hostuno ]]; then
        CURRENT_DOMAIN="${USERNAME}.useruno.com"
    else
        CURRENT_DOMAIN="${USERNAME}.serv00.net"
    fi
else
    CURRENT_DOMAIN="$DOMAIN"
fi

WORKDIR="${HOME}/domains/${CURRENT_DOMAIN}/public_nodejs"
BACKUP_DIR="${HOME}/nav-item-backups"

echo ""
green "=========================================="
green "  Nav-Item 一键恢复脚本"
green "  GitHub: github.com/zczy-k/nav-item"
green "=========================================="
echo ""

# 检查备份目录
if [ ! -d "$BACKUP_DIR" ]; then
    red "错误: 未找到备份目录"
    red "目录: $BACKUP_DIR"
    exit 1
fi

# 列出所有备份
yellow "可用的备份文件：\n"
BACKUPS=($(ls -t "$BACKUP_DIR"/*.tar.gz 2>/dev/null))

if [ ${#BACKUPS[@]} -eq 0 ]; then
    red "错误: 未找到任何备份文件"
    exit 1
fi

# 显示备份列表
for i in "${!BACKUPS[@]}"; do
    BACKUP_FILE="${BACKUPS[$i]}"
    BACKUP_NAME=$(basename "$BACKUP_FILE")
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    BACKUP_TIME=$(echo "$BACKUP_NAME" | grep -oP '\d{8}_\d{6}' | sed 's/_/ /')
    
    echo "[$((i+1))] $BACKUP_NAME"
    echo "    时间: $BACKUP_TIME | 大小: $BACKUP_SIZE"
    echo ""
done

# 选择备份
reading "请选择要恢复的备份编号 (1-${#BACKUPS[@]}): " BACKUP_NUM
echo ""

if [[ ! "$BACKUP_NUM" =~ ^[0-9]+$ ]] || [ "$BACKUP_NUM" -lt 1 ] || [ "$BACKUP_NUM" -gt ${#BACKUPS[@]} ]; then
    red "无效的备份编号"
    exit 1
fi

SELECTED_BACKUP="${BACKUPS[$((BACKUP_NUM-1))]}"
yellow "已选择: $(basename "$SELECTED_BACKUP")\n"

# 确认恢复
red "⚠️  警告: 恢复备份将覆盖当前的数据库和上传文件！\n"
reading "确认要恢复此备份吗？(输入 yes 继续): " CONFIRM
echo ""

if [ "$CONFIRM" != "yes" ]; then
    yellow "已取消恢复操作"
    exit 0
fi

# 检查项目目录
if [ ! -d "$WORKDIR" ]; then
    red "错误: 未找到项目目录"
    red "目录: $WORKDIR"
    red "请先运行安装脚本"
    exit 1
fi

# 解压备份
yellow "正在解压备份文件...\n"
TEMP_DIR="${BACKUP_DIR}/temp_restore"
mkdir -p "$TEMP_DIR"
tar -xzf "$SELECTED_BACKUP" -C "$TEMP_DIR" 2>/dev/null

if [ $? -ne 0 ]; then
    red "✗ 解压失败"
    rm -rf "$TEMP_DIR"
    exit 1
fi

green "✓ 解压完成\n"

# 查找解压后的目录
EXTRACTED_DIR=$(find "$TEMP_DIR" -maxdepth 1 -type d -name "nav-item-backup-*" | head -n 1)

if [ -z "$EXTRACTED_DIR" ]; then
    red "✗ 未找到备份内容"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# 恢复数据库
if [ -d "$EXTRACTED_DIR/database" ]; then
    yellow "正在恢复数据库..."
    rm -rf "$WORKDIR/database"
    cp -r "$EXTRACTED_DIR/database" "$WORKDIR/"
    if [ $? -eq 0 ]; then
        green "✓ 数据库恢复完成\n"
    else
        red "✗ 数据库恢复失败\n"
    fi
else
    yellow "! 备份中无数据库，跳过\n"
fi

# 恢复上传文件
if [ -d "$EXTRACTED_DIR/uploads" ]; then
    yellow "正在恢复上传文件..."
    rm -rf "$WORKDIR/uploads"
    cp -r "$EXTRACTED_DIR/uploads" "$WORKDIR/"
    if [ $? -eq 0 ]; then
        green "✓ 上传文件恢复完成\n"
    else
        red "✗ 上传文件恢复失败\n"
    fi
else
    yellow "! 备份中无上传文件，跳过\n"
fi

# 恢复环境配置
if [ -f "$EXTRACTED_DIR/.env" ]; then
    yellow "正在恢复环境配置..."
    cp "$EXTRACTED_DIR/.env" "$WORKDIR/"
    if [ $? -eq 0 ]; then
        green "✓ 环境配置恢复完成\n"
    else
        red "✗ 环境配置恢复失败\n"
    fi
else
    yellow "! 备份中无环境配置，跳过\n"
fi

# 显示备份信息
if [ -f "$EXTRACTED_DIR/backup-info.txt" ]; then
    echo ""
    yellow "备份信息："
    cat "$EXTRACTED_DIR/backup-info.txt"
    echo ""
fi

# 清理临时文件
rm -rf "$TEMP_DIR"

# 重启应用
yellow "正在重启应用..."
devil www restart "$CURRENT_DOMAIN" > /dev/null 2>&1
green "✓ 应用已重启\n"

echo ""
green "=========================================="
green "  恢复成功！"
green "=========================================="
echo ""
purple "访问地址: ${green}https://${CURRENT_DOMAIN}${re}"
purple "后台管理: ${green}https://${CURRENT_DOMAIN}/admin${re}"
echo ""
green "=========================================="
