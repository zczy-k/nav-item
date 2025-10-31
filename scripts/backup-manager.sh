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
    echo -e "  \e[1;32m5\e[0m) 📋 查看备份列表"
    echo -e "  \e[1;32m6\e[0m) ⚙️  GitHub 配置"
    echo -e "  \e[1;31m7\e[0m) 🧹 清理本地Git缓存"
    echo -e "  \e[1;32m0\e[0m) 🚪 退出"
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

    # 检查本地仓库配置是否有效
    if [ -d ".git" ]; then
        # 检查远程仓库是否可达
        if ! git ls-remote --exit-code origin > /dev/null 2>&1; then
            yellow "检测到无效的远程仓库配置，正在自动修复...\n"
            cd ..
            rm -rf "$GITHUB_BACKUP_DIR"
            mkdir -p "$GITHUB_BACKUP_DIR"
            cd "$GITHUB_BACKUP_DIR"
        fi
    fi

    # 初始化或更新仓库
    if [ ! -d ".git" ]; then
        yellow "正在初始化 GitHub 仓库...\n"
        # 尝试克隆现有仓库
        CLONE_OUTPUT=$(git clone "https://${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git" . 2>&1)
        if [ $? -ne 0 ]; then
            # 克隆失败，自动创建新仓库
            yellow "仓库不存在，正在自动创建...\n"
            REPO_NAME=$(echo "$GITHUB_REPO" | cut -d'/' -f2)
            CREATE_RESULT=$(curl -s -X POST \
                -H "Authorization: token ${GITHUB_TOKEN}" \
                -H "Accept: application/vnd.github.v3+json" \
                https://api.github.com/user/repos \
                -d "{\"name\":\"${REPO_NAME}\",\"private\":true}")

            if echo "$CREATE_RESULT" | grep -q '"id"'; then
                green "✓ 仓库创建成功\n"
                sleep 2
                git init
                git config user.name "Nav-Item Backup"
                git config user.email "backup@nav-item.local"
                git remote add origin "https://${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git"
                git checkout -b main 2>/dev/null
            elif echo "$CREATE_RESULT" | grep -q "name already exists"; then
                red "✗ 远程仓库已存在，但本地配置错误，请删除后重试"
                red "  rm -rf ${GITHUB_BACKUP_DIR}"
                return 1
            else
                red "✗ 仓库创建失败"
                yellow "错误信息: $(echo "$CREATE_RESULT" | grep -o '"message":"[^"]*"' || echo '未知错误')"
                return 1
            fi
        fi
    fi

    # 更新仓库
    git pull origin $(git symbolic-ref --short HEAD 2>/dev/null || echo "main") --allow-unrelated-histories --quiet 2>/dev/null || true
    
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
    
    # 如果推送失败且是因为仓库不存在，尝试创建仓库
    if [ $PUSH_STATUS -ne 0 ] && echo "$PUSH_OUTPUT" | grep -q "Repository not found"; then
        echo ""
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
            sleep 3  # 等待 GitHub 同步
            
            # 重试推送
            yellow "重试推送..."
            PUSH_OUTPUT=$(git push -u origin "$CURRENT_BRANCH" 2>&1)
            PUSH_STATUS=$?
        elif echo "$CREATE_RESULT" | grep -q "name already exists"; then
            yellow "仓库已存在，重试推送...\n"
            PUSH_OUTPUT=$(git push -u origin "$CURRENT_BRANCH" 2>&1)
            PUSH_STATUS=$?
        else
            red "✗ 仓库创建失败"
            yellow "错误信息: $(echo "$CREATE_RESULT" | grep -o '"message":"[^"]*"' || echo '未知错误')"
        fi
    fi
    
    if [ $PUSH_STATUS -eq 0 ]; then
        echo ""
        green "✓ 备份到 GitHub 成功！"
        purple "仓库: https://github.com/${GITHUB_REPO}"
        purple "分支: ${CURRENT_BRANCH}"
        echo ""
    else
        # 推送失败，完全清理未推送的提交和备份
        echo ""
        red "✗ 推送失败，正在清理未同步的备份..."
        
        # 如果是 root commit 失败，删除整个 .git 目录
        if git rev-parse HEAD~1 > /dev/null 2>&1; then
            git reset --hard HEAD~1 2>/dev/null
        else
            # 是第一个 commit，删除 .git 和所有备份
            cd ..
            rm -rf "$GITHUB_BACKUP_DIR"
            mkdir -p "$GITHUB_BACKUP_DIR"
            cd "$GITHUB_BACKUP_DIR"
        fi
        
        rm -rf "$BACKUP_FOLDER"
        green "✓ 已清理"
        echo ""
        yellow "错误信息:"
        echo "$PUSH_OUTPUT" | grep -v "${GITHUB_TOKEN}" || echo "$PUSH_OUTPUT" | sed "s/${GITHUB_TOKEN}/***TOKEN***/g"
        echo ""
        yellow "可能的原因:"
        echo "  1. Token 权限不足（需要 repo 完整权限）"
        echo "  2. 仓库名称错误"
        echo "  3. 网络连接问题"
        echo "  4. Token 已过期"
        echo ""
        yellow "解决方法:"
        echo "  - 重新配置 GitHub Token 和仓库（选项 6）"
        echo "  - 确保 Token 有 repo 完整权限"
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
    
    # 检查是否已有配置
    if [ -f "$GITHUB_CONFIG" ]; then
        source "$GITHUB_CONFIG"
        echo ""
        yellow "当前配置:"
        echo "  仓库: ${GITHUB_REPO}"
        echo ""
        reading "是否更改配置? (y/N): " CHANGE_CONFIG
        if [[ ! "$CHANGE_CONFIG" =~ ^[Yy]$ ]]; then
            yellow "已取消"
            return 0
        fi
        echo ""
        red "⚠️  警告: 更改配置将清理旧仓库的本地缓存！"
        reading "确认继续? (yes/no): " CONFIRM
        if [ "$CONFIRM" != "yes" ]; then
            yellow "已取消"
            return 0
        fi
        echo ""
        # 清理旧仓库
        if [ -d "$GITHUB_BACKUP_DIR" ]; then
            yellow "正在清理旧仓库..."
            rm -rf "$GITHUB_BACKUP_DIR"
            green "✓ 旧仓库已清理"
            echo ""
        fi
    fi
    
    echo "步骤1: 创建 GitHub Personal Access Token"
    echo "  访问: https://github.com/settings/tokens"
    echo "  权限: repo (完整仓库权限)"
    echo ""
    reading "GitHub Token: " NEW_GITHUB_TOKEN
    echo ""
    
    echo "步骤2: 配置仓库"
    echo "  格式: username/repo-name"
    echo "  示例: zczy-k/nav-item-backup"
    echo ""
    reading "仓库名称: " NEW_GITHUB_REPO
    echo ""
    
    # 验证仓库名称格式
    if [[ ! "$NEW_GITHUB_REPO" =~ ^[a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+$ ]]; then
        red "✗ 仓库名称格式错误，应为: username/repo-name"
        return 1
    fi
    
    # 保存新配置
    cat > "$GITHUB_CONFIG" <<EOF
GITHUB_REPO="$NEW_GITHUB_REPO"
GITHUB_TOKEN="$NEW_GITHUB_TOKEN"
EOF
    
    chmod 600 "$GITHUB_CONFIG"
    echo ""
    green "✓ 配置已保存"
    purple "仓库: https://github.com/${NEW_GITHUB_REPO}"
    echo ""
    yellow "提示: 下次备份到 GitHub 时将自动创建仓库（如果不存在）"
    echo ""
}

# 查看备份列表
list_backups() {
    echo ""
    yellow "=========================================="
    yellow "  备份列表"
    yellow "=========================================="
    echo ""
    
    # 本地备份
    echo -e "${blue}本地备份:${re}"
    if [ -d "$LOCAL_BACKUP_DIR" ] && [ -n "$(ls -A "$LOCAL_BACKUP_DIR"/*.tar.gz 2>/dev/null)" ]; then
        BACKUPS=($(ls -t "$LOCAL_BACKUP_DIR"/*.tar.gz 2>/dev/null))
        for i in "${!BACKUPS[@]}"; do
            BACKUP_NAME=$(basename "${BACKUPS[$i]}")
            BACKUP_SIZE=$(du -h "${BACKUPS[$i]}" | cut -f1)
            BACKUP_TIME=$(echo "$BACKUP_NAME" | grep -o '[0-9]\{8\}_[0-9]\{6\}' | sed 's/\([0-9]\{4\}\)\([0-9]\{2\}\)\([0-9]\{2\}\)_\([0-9]\{2\}\)\([0-9]\{2\}\)\([0-9]\{2\}\)/\1-\2-\3 \4:\5:\6/')
            echo -e "  ${green}$((i+1))${re}) $BACKUP_TIME (${BACKUP_SIZE})"
        done
        echo ""
        reading "是否删除本地备份? (y/N): " DELETE_CHOICE
        if [[ "$DELETE_CHOICE" =~ ^[Yy]$ ]]; then
            echo ""
            reading "请输入要删除的编号 (多个用空格分隔, 或输入 'all' 删除全部): " DELETE_NUMS
            echo ""
            if [ "$DELETE_NUMS" = "all" ]; then
                red "⚠️  警告: 将删除所有本地备份！"
                reading "确认删除? (yes/no): " CONFIRM
                if [ "$CONFIRM" = "yes" ]; then
                    rm -f "$LOCAL_BACKUP_DIR"/*.tar.gz
                    green "✓ 已删除所有本地备份"
                else
                    yellow "已取消"
                fi
            else
                for num in $DELETE_NUMS; do
                    if [[ "$num" =~ ^[0-9]+$ ]] && [ "$num" -ge 1 ] && [ "$num" -le ${#BACKUPS[@]} ]; then
                        rm -f "${BACKUPS[$((num-1))]}"
                        green "✓ 已删除: $(basename "${BACKUPS[$((num-1))]}")"
                    else
                        red "✗ 无效编号: $num"
                    fi
                done
            fi
        fi
    else
        echo "  无"
    fi
    echo ""
    
    # GitHub 备份
    echo -e "${blue}GitHub 备份:${re}"
    if [ -f "$GITHUB_CONFIG" ]; then
        source "$GITHUB_CONFIG"
        echo "  仓库: https://github.com/${GITHUB_REPO}"
        
        if [ -d "$GITHUB_BACKUP_DIR/.git" ]; then
            cd "$GITHUB_BACKUP_DIR"
            
            # 先从远程更新最新状态
            yellow "正在从 GitHub 更新备份列表..."
            git fetch origin --quiet 2>/dev/null
            green "✓ 更新完成\n"
            
            # 获取远程默认分支名
            REMOTE_REF=$(git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null)
            if [ -z "$REMOTE_REF" ]; then
                REMOTE_REF="origin/main"
            fi
            
            # 检查当前HEAD状态下是否存在backups目录
            BACKUP_DIRS=$(git ls-tree -d --name-only "$REMOTE_REF:backups" 2>/dev/null)
            
            if [ -n "$BACKUP_DIRS" ]; then
                echo ""
                echo "  可用备份:"
                
                # 遍历backups下的所有子目录（实际存在的备份）
                BACKUP_COUNT=0
                while IFS= read -r backup_dir; do
                    # 提取时间戳
                    TIMESTAMP=$(echo "$backup_dir" | grep -o '[0-9]\{8\}_[0-9]\{6\}')
                    if [ -n "$TIMESTAMP" ]; then
                        FORMATTED_TIME=$(echo "$TIMESTAMP" | sed 's/\([0-9]\{4\}\)\([0-9]\{2\}\)\([0-9]\{2\}\)_\([0-9]\{2\}\)\([0-9]\{2\}\)\([0-9]\{2\}\)/\1-\2-\3 \4:\5:\6/')
                        ((BACKUP_COUNT++))
                        echo "    $BACKUP_COUNT) $FORMATTED_TIME"
                    fi
                done <<< "$BACKUP_DIRS"
                
                if [ $BACKUP_COUNT -eq 0 ]; then
                    echo "    无可用备份"
                fi
            else
                echo ""
                echo "  无备份记录"
            fi
        fi
    else
        echo "  未配置"
    fi
    echo ""
}

# 从 GitHub 恢复备份
restore_from_github() {
    echo ""
    yellow "=========================================="
    yellow "  从 GitHub 恢复备份"
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
    
    # 初始化或更新本地仓库
    mkdir -p "$GITHUB_BACKUP_DIR"
    cd "$GITHUB_BACKUP_DIR"
    
    if [ ! -d ".git" ]; then
        yellow "正在克隆 GitHub 仓库...\n"
        CLONE_OUTPUT=$(git clone "https://${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git" . 2>&1)
        if [ $? -ne 0 ]; then
            red "✗ 克隆失败"
            echo "$CLONE_OUTPUT" | grep -v "${GITHUB_TOKEN}" || echo "$CLONE_OUTPUT" | sed "s/${GITHUB_TOKEN}/***TOKEN***/g"
            return 1
        fi
        green "✓ 克隆成功\n"
    else
        yellow "正在更新仓库...\n"
        git fetch origin --quiet 2>/dev/null
        if [ $? -ne 0 ]; then
            red "✗ 更新失败，请检查网络或配置"
            return 1
        fi
        green "✓ 更新成功\n"
    fi
    
    # 列出可用的备份（只显示实际存在备份文件的提交）
    # 先从远程更新最新状态
    yellow "正在从 GitHub 更新备份列表..."
    git fetch origin --quiet 2>/dev/null
    green "✓ 更新完成\n"

    # 获取远程默认分支名
    REMOTE_REF=$(git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null)
    if [ -z "$REMOTE_REF" ]; then
        REMOTE_REF="origin/main"
    fi

    # 检查当前HEAD状态下是否存在backups目录
    BACKUP_DIRS=$(git ls-tree -d --name-only "$REMOTE_REF:backups" 2>/dev/null)
    
    if [ -z "$BACKUP_DIRS" ]; then
        red "错误: 未找到任何备份文件"
        return 1
    fi
    
    echo "可用的备份："
    echo ""
    
    # 解析备份目录
    declare -a BACKUP_FOLDERS
    declare -a BACKUP_TIMES
    
    i=1
    while IFS= read -r backup_dir; do
        # 提取时间戳
        TIMESTAMP=$(echo "$backup_dir" | grep -o '[0-9]\{8\}_[0-9]\{6\}')
        if [ -n "$TIMESTAMP" ]; then
            FORMATTED_TIME=$(echo "$TIMESTAMP" | sed 's/\([0-9]\{4\}\)\([0-9]\{2\}\)\([0-9]\{2\}\)_\([0-9]\{2\}\)\([0-9]\{2\}\)\([0-9]\{2\}\)/\1-\2-\3 \4:\5:\6/')
            
            BACKUP_FOLDERS+=("$backup_dir")
            BACKUP_TIMES+=("$FORMATTED_TIME")
            
            # 尝试从备份信息文件获取来源服务器
            BACKUP_INFO=$(git show "$REMOTE_REF:backups/$backup_dir/backup-info.txt" 2>/dev/null | grep "域名:" | awk '{print $2}')
            if [ -n "$BACKUP_INFO" ]; then
                echo -e "  ${green}${i}${re}) ${FORMATTED_TIME} (from ${BACKUP_INFO})"
            else
                echo -e "  ${green}${i}${re}) ${FORMATTED_TIME}"
            fi
            ((i++))
        fi
    done <<< "$BACKUP_DIRS"
    
    # 检查是否找到有效备份
    if [ ${#BACKUP_FOLDERS[@]} -eq 0 ]; then
        red "错误: 未找到任何可用的备份文件"
        return 1
    fi
    
    echo ""
    reading "请选择备份编号 (1-${#BACKUP_FOLDERS[@]}): " BACKUP_NUM
    echo ""
    
    if [[ ! "$BACKUP_NUM" =~ ^[0-9]+$ ]] || [ "$BACKUP_NUM" -lt 1 ] || [ "$BACKUP_NUM" -gt ${#BACKUP_FOLDERS[@]} ]; then
        red "无效的备份编号"
        return 1
    fi
    
    SELECTED_FOLDER="${BACKUP_FOLDERS[$((BACKUP_NUM-1))]}"
    SELECTED_TIME="${BACKUP_TIMES[$((BACKUP_NUM-1))]}"
    
    echo "选择的备份:"
    echo "  时间: ${SELECTED_TIME}"
    echo "  文件夹: ${SELECTED_FOLDER}"
    echo ""
    
    red "⚠️  警告: 恢复将覆盖当前数据！"
    reading "确认恢复？(输入 yes 继续): " CONFIRM
    echo ""
    
    if [ "$CONFIRM" != "yes" ]; then
        yellow "已取消"
        return 0
    fi
    
    # 切换到远程分支并检出备份文件
    yellow "正在准备恢复...\n"
    
    # 切换到远程分支
    CURRENT_BRANCH=$(echo "$REMOTE_REF" | sed 's/origin\///')
    git checkout -B "$CURRENT_BRANCH" "$REMOTE_REF" --quiet 2>/dev/null
    
    if [ $? -ne 0 ]; then
        red "✗ 切换到远程分支失败"
        return 1
    fi
    
    # 检查备份目录
    BACKUP_FOLDER="backups/$SELECTED_FOLDER"
    
    if [ -z "$BACKUP_FOLDER" ] || [ ! -d "$BACKUP_FOLDER" ]; then
        red "✗ 未找到备份数据"
        git checkout $(git symbolic-ref --short HEAD 2>/dev/null || echo "main") --quiet 2>/dev/null
        return 1
    fi
    
    yellow "正在恢复数据...\n"
    
    # 恢复数据库
    if [ -d "$BACKUP_FOLDER/database" ]; then
        rm -rf "$WORKDIR/database"
        cp -r "$BACKUP_FOLDER/database" "$WORKDIR/" && green "✓ 数据库已恢复" || red "✗ 数据库恢复失败"
    fi
    
    # 恢复上传文件
    if [ -d "$BACKUP_FOLDER/uploads" ]; then
        rm -rf "$WORKDIR/uploads"
        cp -r "$BACKUP_FOLDER/uploads" "$WORKDIR/" && green "✓ 上传文件已恢复" || red "✗ 上传文件恢复失败"
    fi
    
    # 恢复环境配置（询问用户）
    if [ -f "$BACKUP_FOLDER/.env" ]; then
        echo ""
        reading "是否恢复环境配置 .env? (y/N): " RESTORE_ENV
        if [[ "$RESTORE_ENV" =~ ^[Yy]$ ]]; then
            cp "$BACKUP_FOLDER/.env" "$WORKDIR/" && green "✓ 环境配置已恢复" || red "✗ 环境配置恢复失败"
        else
            yellow "已跳过环境配置"
        fi
    fi
    
    # 不需要切回，因为我们已经在正确的分支上
    
    # 重启服务
    devil www restart "$CURRENT_DOMAIN" > /dev/null 2>&1
    
    echo ""
    green "✓ 恢复成功！"
    purple "备份时间: ${SELECTED_TIME}"
    purple "来源服务器: ${SELECTED_DOMAIN}"
    echo ""
}

# 清理本地Git缓存
clean_local_git_cache() {
    echo ""
    yellow "=========================================="
    yellow "  清理本地Git缓存"
    yellow "=========================================="
    echo ""

    if [ -d "$GITHUB_BACKUP_DIR" ]; then
        red "⚠️  警告: 这将删除本地的GitHub备份缓存目录"
        red "         下次操作会从GitHub重新克隆，确保列表最新。"
        echo ""
        reading "确认清理? (输入 yes 继续): " CONFIRM
        echo ""

        if [ "$CONFIRM" = "yes" ]; then
            rm -rf "$GITHUB_BACKUP_DIR"
            if [ $? -eq 0 ]; then
                green "✓ 本地Git缓存已成功清理！"
            else
                red "✗ 清理失败，请检查权限。"
            fi
        else
            yellow "已取消。"
        fi
    else
        green "✓ 本地Git缓存目录不存在，无需清理。"
    fi
    echo ""
}

# 主循环
main() {
    while true; do
        show_main_menu
        reading "请选择 (0-7): " choice
        
        case $choice in
            1) create_local_backup ;;
            2) backup_to_github ;;
            3) restore_local_backup ;;
            4) restore_from_github ;;
            5) list_backups ;;
            6) github_config ;;
            7) clean_local_git_cache ;;
            0) echo ""; green "再见！"; exit 0 ;;
            *) echo ""; red "无效选项" ;;
        esac
        
        echo ""
        reading "按回车继续..." dummy
    done
}

main
