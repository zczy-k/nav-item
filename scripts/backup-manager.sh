#!/bin/bash

# Nav-Item 备份管理脚本
# 作者: zczy-k
# 用途: 统一管理备份和恢复操作

export LC_ALL=C
red="\033[1;91m"
green="\e[1;32m"
yellow="\e[1;33m"
purple="\e[1;35m"
blue="\e[1;34m"
re="\033[0m"

red() { echo -e "\e[1;91m$1\033[0m"; }
green() { echo -e "\e[1;32m$1\033[0m"; }
yellow() { echo -e "\e[1;33m$1\033[0m"; }
purple() { echo -e "\e[1;35m$1\033[0m"; }
blue() { echo -e "\e[1;34m$1\033[0m"; }
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
LOCAL_BACKUP_DIR="${HOME}/nav-item-backups"
GITHUB_BACKUP_DIR="${HOME}/nav-item-github-backup"
GITHUB_CONFIG="${HOME}/.nav-item-github-config"

# 显示主菜单
show_main_menu() {
    clear
    echo ""
    green "=========================================="
    green "  Nav-Item 备份管理工具"
    green "  GitHub: github.com/zczy-k/nav-item"
    green "=========================================="
    echo ""
    echo -e "\e[1;34m当前域名: \e[1;33m${CURRENT_DOMAIN}\033[0m"
    echo ""
    echo "请选择操作："
    echo ""
    echo -e "  \e[1;32m1\033[0m) 📦 创建本地备份"
    echo -e "  \e[1;32m2\033[0m) 💙 备份到 GitHub"
    echo -e "  \e[1;32m3\033[0m) 🔄 恢复本地备份"
    echo -e "  \e[1;32m4\033[0m) 🔄 从 GitHub 恢复"
    echo -e "  \e[1;32m5\033[0m) 📋 查看备份列表"
    echo -e "  \e[1;32m6\033[0m) ⚙️  GitHub 配置"
    echo -e "  \e[1;32m0\033[0m) 🚪 退出"
    echo ""
}

# 创建本地备份
create_local_backup() {
    echo ""
    yellow "=========================================="
    yellow "  创建本地备份"
    yellow "=========================================="
    echo ""
    
    if [ ! -d "$WORKDIR" ]; then
        red "错误: 未找到项目目录 $WORKDIR"
        return 1
    fi
    
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_NAME="nav-item-backup-${TIMESTAMP}"
    BACKUP_PATH="${LOCAL_BACKUP_DIR}/${BACKUP_NAME}"
    
    mkdir -p "$LOCAL_BACKUP_DIR"
    mkdir -p "$BACKUP_PATH"
    
    yellow "正在备份数据...\n"
    
    # 备份数据库
    if [ -d "$WORKDIR/database" ]; then
        cp -r "$WORKDIR/database" "$BACKUP_PATH/" 2>/dev/null && green "✓ 数据库备份完成" || red "✗ 数据库备份失败"
    fi
    
    # 备份上传文件
    if [ -d "$WORKDIR/uploads" ]; then
        cp -r "$WORKDIR/uploads" "$BACKUP_PATH/" 2>/dev/null && green "✓ 上传文件备份完成" || red "✗ 上传文件备份失败"
    fi
    
    # 备份环境配置
    if [ -f "$WORKDIR/.env" ]; then
        cp "$WORKDIR/.env" "$BACKUP_PATH/" 2>/dev/null && green "✓ 环境配置备份完成" || red "✗ 环境配置备份失败"
    fi
    
    # 创建备份信息
    cat > "$BACKUP_PATH/backup-info.txt" <<EOF
Nav-Item 备份信息
================
备份时间: $(date '+%Y-%m-%d %H:%M:%S')
服务器: $HOSTNAME
域名: $CURRENT_DOMAIN
EOF
    
    # 压缩备份
    echo ""
    yellow "正在压缩备份..."
    cd "$LOCAL_BACKUP_DIR"
    tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        rm -rf "$BACKUP_PATH"
        BACKUP_FILE="${LOCAL_BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        
        echo ""
        green "✓ 备份成功！"
        echo ""
        purple "备份文件: ${green}$BACKUP_FILE"
        purple "文件大小: ${green}$BACKUP_SIZE"
        echo ""
    else
        red "✗ 备份压缩失败"
        return 1
    fi
}

# 备份到 GitHub
backup_to_github() {
    echo ""
    yellow "=========================================="
    yellow "  备份到 GitHub"
    yellow "=========================================="
    echo ""
    
    # 检查 GitHub 配置
    if [ ! -f "$GITHUB_CONFIG" ]; then
        red "未配置 GitHub，请先进行配置（选项 6）"
        return 1
    fi
    
    source "$GITHUB_CONFIG"
    
    if [ -z "$GITHUB_REPO" ] || [ -z "$GITHUB_TOKEN" ]; then
        red "GitHub 配置不完整，请重新配置（选项 6）"
        return 1
    fi
    
    mkdir -p "$GITHUB_BACKUP_DIR"
    cd "$GITHUB_BACKUP_DIR"
    
    # 初始化或更新仓库
    if [ ! -d "$GITHUB_BACKUP_DIR/.git" ]; then
        yellow "正在初始化 GitHub 仓库...\n"
        
        # 尝试克隆现有仓库
        CLONE_OUTPUT=$(git clone "https://${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git" "$GITHUB_BACKUP_DIR" 2>&1)
        
        if [ $? -ne 0 ]; then
            # 克隆失败，自动创建新仓库
            yellow "仓库不存在，正在自动创建...\n"
            
            # 使用 GitHub API 创建私有仓库
            REPO_NAME=$(echo "$GITHUB_REPO" | cut -d'/' -f2)
            CREATE_RESULT=$(curl -s -X POST \
                -H "Authorization: token ${GITHUB_TOKEN}" \
                -H "Accept: application/vnd.github.v3+json" \
                https://api.github.com/user/repos \
                -d "{\"name\":\"${REPO_NAME}\",\"private\":true,\"auto_init\":false}")
            
            # 检查是否创建成功
            if echo "$CREATE_RESULT" | grep -q '"id"'; then
                green "✓ 仓库创建成功\n"
                sleep 2  # 等待 GitHub 同步
            elif echo "$CREATE_RESULT" | grep -q "name already exists"; then
                yellow "仓库已存在，继续...\n"
            else
                red "✗ 仓库创建失败"
                yellow "错误信息: $(echo "$CREATE_RESULT" | grep -o '"message":"[^"]*"' || echo '未知错误')"
                return 1
            fi
            
            # 初始化本地仓库
            git init
            git config user.name "Nav-Item Backup"
            git config user.email "backup@nav-item.local"
            git remote add origin "https://${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git"
            git checkout -b main 2>/dev/null
        else
            green "✓ 仓库克隆成功\n"
        fi
    else
        # 更新现有仓库
        git pull origin $(git symbolic-ref --short HEAD 2>/dev/null || echo "main") 2>/dev/null || true
    fi
    
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_FOLDER="backups/${TIMESTAMP}"
    mkdir -p "$BACKUP_FOLDER"
    
    yellow "正在备份数据...\n"
    
    [ -d "$WORKDIR/database" ] && cp -r "$WORKDIR/database" "$BACKUP_FOLDER/" && green "✓ 数据库"
    [ -d "$WORKDIR/uploads" ] && cp -r "$WORKDIR/uploads" "$BACKUP_FOLDER/" && green "✓ 上传文件"
    [ -f "$WORKDIR/.env" ] && cp "$WORKDIR/.env" "$BACKUP_FOLDER/" && green "✓ 环境配置"
    
    cat > "$BACKUP_FOLDER/backup-info.txt" <<EOF
备份时间: $(date '+%Y-%m-%d %H:%M:%S')
服务器: $HOSTNAME
域名: $CURRENT_DOMAIN
EOF
    
    echo ""
    yellow "正在推送到 GitHub..."
    git add .
    git commit -m "Backup: ${TIMESTAMP} from ${CURRENT_DOMAIN}" 2>/dev/null
    
    # 检测当前分支
    CURRENT_BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null || echo "main")
    
    # 尝试推送
    PUSH_OUTPUT=$(git push -u origin "$CURRENT_BRANCH" 2>&1)
    PUSH_STATUS=$?
    
    if [ $PUSH_STATUS -eq 0 ]; then
        echo ""
        green "✓ 备份到 GitHub 成功！"
        purple "仓库: https://github.com/${GITHUB_REPO}"
        purple "分支: ${CURRENT_BRANCH}"
        echo ""
    else
        echo ""
        red "✗ 推送失败"
        echo ""
        yellow "错误信息:"
        echo "$PUSH_OUTPUT" | grep -v "${GITHUB_TOKEN}" || echo "$PUSH_OUTPUT" | sed "s/${GITHUB_TOKEN}/***TOKEN***/g"
        echo ""
        yellow "可能的原因:"
        echo "  1. Token 权限不足（需要 repo 完整权限）"
        echo "  2. 仓库不存在或名称错误"
        echo "  3. 网络连接问题"
        echo "  4. Token 已过期"
        echo ""
        yellow "解决方法:"
        echo "  - 检查 GitHub Token 和仓库配置（选项 6）"
        echo "  - 访问 https://github.com/${GITHUB_REPO} 确认仓库存在"
        echo ""
    fi
}

# 恢复本地备份
restore_local_backup() {
    echo ""
    yellow "=========================================="
    yellow "  恢复本地备份"
    yellow "=========================================="
    echo ""
    
    if [ ! -d "$LOCAL_BACKUP_DIR" ]; then
        red "错误: 未找到备份目录"
        return 1
    fi
    
    BACKUPS=($(ls -t "$LOCAL_BACKUP_DIR"/*.tar.gz 2>/dev/null))
    
    if [ ${#BACKUPS[@]} -eq 0 ]; then
        red "错误: 未找到任何备份文件"
        return 1
    fi
    
    echo "可用的备份："
    echo ""
    for i in "${!BACKUPS[@]}"; do
        BACKUP_NAME=$(basename "${BACKUPS[$i]}")
        BACKUP_SIZE=$(du -h "${BACKUPS[$i]}" | cut -f1)
        echo "  ${green}$((i+1))${re}) $BACKUP_NAME (${BACKUP_SIZE})"
    done
    echo ""
    
    reading "请选择备份编号 (1-${#BACKUPS[@]}): " BACKUP_NUM
    echo ""
    
    if [[ ! "$BACKUP_NUM" =~ ^[0-9]+$ ]] || [ "$BACKUP_NUM" -lt 1 ] || [ "$BACKUP_NUM" -gt ${#BACKUPS[@]} ]; then
        red "无效的备份编号"
        return 1
    fi
    
    SELECTED_BACKUP="${BACKUPS[$((BACKUP_NUM-1))]}"
    
    red "⚠️  警告: 恢复将覆盖当前数据！"
    reading "确认恢复？(输入 yes 继续): " CONFIRM
    echo ""
    
    if [ "$CONFIRM" != "yes" ]; then
        yellow "已取消"
        return 0
    fi
    
    TEMP_DIR="${LOCAL_BACKUP_DIR}/temp_restore"
    mkdir -p "$TEMP_DIR"
    tar -xzf "$SELECTED_BACKUP" -C "$TEMP_DIR" 2>/dev/null
    
    EXTRACTED_DIR=$(find "$TEMP_DIR" -maxdepth 1 -type d -name "nav-item-backup-*" | head -n 1)
    
    [ -d "$EXTRACTED_DIR/database" ] && rm -rf "$WORKDIR/database" && cp -r "$EXTRACTED_DIR/database" "$WORKDIR/" && green "✓ 数据库已恢复"
    [ -d "$EXTRACTED_DIR/uploads" ] && rm -rf "$WORKDIR/uploads" && cp -r "$EXTRACTED_DIR/uploads" "$WORKDIR/" && green "✓ 上传文件已恢复"
    [ -f "$EXTRACTED_DIR/.env" ] && cp "$EXTRACTED_DIR/.env" "$WORKDIR/" && green "✓ 环境配置已恢复"
    
    rm -rf "$TEMP_DIR"
    
    devil www restart "$CURRENT_DOMAIN" > /dev/null 2>&1
    echo ""
    green "✓ 恢复成功！"
    echo ""
}

# GitHub 配置
github_config() {
    echo ""
    yellow "=========================================="
    yellow "  GitHub 配置"
    yellow "=========================================="
    echo ""
    
    echo "步骤1: 创建 GitHub Personal Access Token"
    echo "  访问: https://github.com/settings/tokens"
    echo "  权限: repo"
    echo ""
    reading "GitHub Token: " GITHUB_TOKEN
    echo ""
    
    echo "步骤2: 配置仓库"
    echo "  格式: username/repo-name"
    echo ""
    reading "仓库名称: " GITHUB_REPO
    echo ""
    
    cat > "$GITHUB_CONFIG" <<EOF
GITHUB_REPO="$GITHUB_REPO"
GITHUB_TOKEN="$GITHUB_TOKEN"
EOF
    
    chmod 600 "$GITHUB_CONFIG"
    green "✓ 配置已保存"
    echo ""
}

# 查看备份列表
list_backups() {
    echo ""
    yellow "=========================================="
    yellow "  备份列表"
    yellow "=========================================="
    echo ""
    
    echo "${blue}本地备份:${re}"
    if [ -d "$LOCAL_BACKUP_DIR" ]; then
        ls -lh "$LOCAL_BACKUP_DIR"/*.tar.gz 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'
    else
        echo "  无"
    fi
    echo ""
    
    echo "${blue}GitHub 备份:${re}"
    if [ -f "$GITHUB_CONFIG" ]; then
        source "$GITHUB_CONFIG"
        echo "  仓库: https://github.com/${GITHUB_REPO}"
    else
        echo "  未配置"
    fi
    echo ""
}

# 主循环
main() {
    while true; do
        show_main_menu
        reading "请选择 (0-6): " choice
        
        case $choice in
            1) create_local_backup ;;
            2) backup_to_github ;;
            3) restore_local_backup ;;
            4) echo ""; yellow "GitHub 恢复功能开发中..." ;;
            5) list_backups ;;
            6) github_config ;;
            0) echo ""; green "再见！"; exit 0 ;;
            *) echo ""; red "无效选项" ;;
        esac
        
        echo ""
        reading "按回车继续..." dummy
    done
}

main
