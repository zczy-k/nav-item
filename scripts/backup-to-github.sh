#!/bin/bash

# Nav-Item 备份到 GitHub 脚本
# 作者: zczy-k
# 用途: 将导航站备份推送到私有 GitHub 仓库

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
BACKUP_DIR="${HOME}/nav-item-github-backup"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo ""
green "=========================================="
green "  Nav-Item 备份到 GitHub"
green "  GitHub: github.com/zczy-k/nav-item"
green "=========================================="
echo ""

# 检查项目目录是否存在
if [ ! -d "$WORKDIR" ]; then
    red "错误: 未找到导航站项目目录"
    red "目录: $WORKDIR"
    exit 1
fi

# 检查是否已配置 GitHub
GITHUB_REPO=""
GITHUB_TOKEN=""
CONFIG_FILE="${HOME}/.nav-item-github-config"

if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
fi

# 如果没有配置，引导用户配置
if [ -z "$GITHUB_REPO" ] || [ -z "$GITHUB_TOKEN" ]; then
    yellow "首次使用需要配置 GitHub 仓库信息\n"
    echo ""
    yellow "步骤1: 创建 GitHub Personal Access Token"
    echo "1. 访问: https://github.com/settings/tokens"
    echo "2. 点击 'Generate new token (classic)'"
    echo "3. 设置名称，如: nav-item-backup"
    echo "4. 勾选权限: repo (完整仓库权限)"
    echo "5. 点击 'Generate token' 并复制"
    echo ""
    
    reading "请输入 GitHub Token: " GITHUB_TOKEN
    echo ""
    
    yellow "步骤2: 配置 GitHub 仓库"
    echo "格式: username/repo-name"
    echo "示例: your-username/nav-item-backup"
    echo ""
    
    reading "请输入仓库名称: " GITHUB_REPO
    echo ""
    
    # 保存配置
    cat > "$CONFIG_FILE" <<EOF
GITHUB_REPO="$GITHUB_REPO"
GITHUB_TOKEN="$GITHUB_TOKEN"
EOF
    
    chmod 600 "$CONFIG_FILE"
    green "✓ 配置已保存\n"
fi

# 创建备份目录
mkdir -p "$BACKUP_DIR"
cd "$BACKUP_DIR"

# 如果是首次使用，克隆仓库
if [ ! -d "$BACKUP_DIR/.git" ]; then
    yellow "正在初始化备份仓库...\n"
    
    # 尝试克隆仓库（如果存在）
    git clone "https://${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git" "$BACKUP_DIR" 2>/dev/null
    
    if [ $? -ne 0 ]; then
        # 仓库不存在，创建新仓库
        yellow "仓库不存在，正在创建...\n"
        git init
        git config user.name "Nav-Item Backup"
        git config user.email "backup@nav-item.local"
        
        # 创建 README
        cat > README.md <<EOF
# Nav-Item 备份仓库

⚠️ **私有仓库** - 包含敏感数据，请勿公开！

## 备份信息

- 自动备份时间: 每次运行备份脚本
- 备份内容: 数据库、上传文件、配置
- 服务器: $HOSTNAME
- 域名: $CURRENT_DOMAIN

## 恢复方法

查看 [BACKUP.md](https://github.com/zczy-k/nav-item/blob/main/BACKUP.md)
EOF

        # 创建 .gitignore
        cat > .gitignore <<EOF
# Node modules
node_modules/

# 临时文件
*.tmp
*.log
EOF
        
        git add README.md .gitignore
        git commit -m "Initial commit: Nav-Item backup repository"
        git branch -M main
        git remote add origin "https://${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git"
        
        green "✓ 仓库初始化完成\n"
    else
        cd "$BACKUP_DIR"
        git config user.name "Nav-Item Backup"
        git config user.email "backup@nav-item.local"
        green "✓ 仓库已克隆\n"
    fi
fi

# 创建备份目录
BACKUP_FOLDER="backups/${TIMESTAMP}"
mkdir -p "$BACKUP_FOLDER"

yellow "正在备份数据...\n"

# 备份数据库
if [ -d "$WORKDIR/database" ]; then
    yellow "正在备份数据库..."
    cp -r "$WORKDIR/database" "$BACKUP_FOLDER/" 2>/dev/null
    green "✓ 数据库备份完成\n"
fi

# 备份上传文件
if [ -d "$WORKDIR/uploads" ]; then
    yellow "正在备份上传文件..."
    cp -r "$WORKDIR/uploads" "$BACKUP_FOLDER/" 2>/dev/null
    green "✓ 上传文件备份完成\n"
fi

# 备份环境配置（敏感）
if [ -f "$WORKDIR/.env" ]; then
    yellow "正在备份环境配置..."
    cp "$WORKDIR/.env" "$BACKUP_FOLDER/" 2>/dev/null
    green "✓ 环境配置备份完成\n"
fi

# 创建备份信息
cat > "$BACKUP_FOLDER/backup-info.txt" <<EOF
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
EOF

# 提交到 Git
yellow "正在提交到 GitHub...\n"

git add .
git commit -m "Backup: ${TIMESTAMP} from ${CURRENT_DOMAIN}" 2>/dev/null

if [ $? -eq 0 ]; then
    # 推送到 GitHub
    git push -u origin main 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo ""
        green "=========================================="
        green "  备份成功！"
        green "=========================================="
        echo ""
        purple "GitHub 仓库: ${green}https://github.com/${GITHUB_REPO}${re}"
        purple "备份时间: ${green}${TIMESTAMP}${re}"
        echo ""
        yellow "提示:"
        echo "1. 查看所有备份: https://github.com/${GITHUB_REPO}/tree/main/backups"
        echo "2. 确保仓库是私有的，避免泄露敏感数据"
        echo "3. 可以设置定时任务自动备份"
        echo ""
        green "=========================================="
    else
        red "✗ 推送失败！"
        red "可能原因："
        echo "1. GitHub Token 权限不足"
        echo "2. 网络连接问题"
        echo "3. 仓库名称错误"
        echo ""
        yellow "本地备份已保存到: $BACKUP_DIR"
        exit 1
    fi
else
    yellow "! 没有新的变化需要备份\n"
fi
