#!/bin/bash

# Nav-Item 一键备份脚本
# 作者: zczy-k
# 用途: 备份导航站的数据库、上传文件和配置

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
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="nav-item-backup-${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

echo ""
green "=========================================="
green "  Nav-Item 一键备份脚本"
green "  GitHub: github.com/zczy-k/nav-item"
green "=========================================="
echo ""

# 检查项目目录是否存在
if [ ! -d "$WORKDIR" ]; then
    red "错误: 未找到导航站项目目录"
    red "目录: $WORKDIR"
    exit 1
fi

# 创建备份目录
mkdir -p "$BACKUP_DIR"
mkdir -p "$BACKUP_PATH"

yellow "开始备份...\n"
yellow "项目目录: $WORKDIR"
yellow "备份目录: $BACKUP_PATH\n"

# 1. 备份数据库
if [ -d "$WORKDIR/database" ]; then
    yellow "正在备份数据库..."
    cp -r "$WORKDIR/database" "$BACKUP_PATH/" 2>/dev/null
    if [ $? -eq 0 ]; then
        green "✓ 数据库备份完成\n"
    else
        red "✗ 数据库备份失败\n"
    fi
else
    yellow "! 未找到数据库目录，跳过\n"
fi

# 2. 备份上传文件
if [ -d "$WORKDIR/uploads" ]; then
    yellow "正在备份上传文件..."
    cp -r "$WORKDIR/uploads" "$BACKUP_PATH/" 2>/dev/null
    if [ $? -eq 0 ]; then
        green "✓ 上传文件备份完成\n"
    else
        red "✗ 上传文件备份失败\n"
    fi
else
    yellow "! 未找到上传目录，跳过\n"
fi

# 3. 备份环境变量配置
if [ -f "$WORKDIR/.env" ]; then
    yellow "正在备份环境配置..."
    cp "$WORKDIR/.env" "$BACKUP_PATH/" 2>/dev/null
    if [ $? -eq 0 ]; then
        green "✓ 环境配置备份完成\n"
    else
        red "✗ 环境配置备份失败\n"
    fi
else
    yellow "! 未找到 .env 文件，跳过\n"
fi

# 4. 创建备份信息文件
cat > "$BACKUP_PATH/backup-info.txt" <<EOF
Nav-Item 备份信息
================

备份时间: $(date '+%Y-%m-%d %H:%M:%S')
服务器: $HOSTNAME
用户: $USERNAME
域名: $CURRENT_DOMAIN
项目路径: $WORKDIR

包含内容:
- database/     数据库文件
- uploads/      上传的图片文件
- .env          环境变量配置

恢复方法:
使用 restore-serv00.sh 脚本恢复备份
EOF

green "✓ 备份信息文件已创建\n"

# 5. 打包备份
yellow "正在压缩备份文件..."
cd "$BACKUP_DIR"
tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME" 2>/dev/null

if [ $? -eq 0 ]; then
    # 删除临时目录
    rm -rf "$BACKUP_PATH"
    
    BACKUP_FILE="${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    
    green "✓ 备份压缩完成\n"
    echo ""
    green "=========================================="
    green "  备份成功！"
    green "=========================================="
    echo ""
    purple "备份文件: ${green}$BACKUP_FILE${re}"
    purple "文件大小: ${green}$BACKUP_SIZE${re}"
    echo ""
    yellow "提示:"
    echo "1. 下载备份文件到本地："
    echo "   ${green}scp ${USERNAME}@${HOSTNAME}:${BACKUP_FILE} .${re}"
    echo ""
    echo "2. 查看所有备份："
    echo "   ${green}ls -lh ${BACKUP_DIR}${re}"
    echo ""
    echo "3. 恢复备份："
    echo "   ${green}bash <(curl -Ls https://raw.githubusercontent.com/zczy-k/nav-item/main/scripts/restore-serv00.sh)${re}"
    echo ""
    green "=========================================="
else
    red "✗ 备份压缩失败"
    exit 1
fi
