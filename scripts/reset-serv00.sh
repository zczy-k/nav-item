#!/bin/bash

# Con-Nav-Item Serv00 重置脚本
# 作者: zczy-k
# GitHub: https://github.com/zczy-k/Con-Nav-Item

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
reading() { read -p "$(red "$1")" "$2"; }

HOSTNAME=$(hostname)
USERNAME=$(whoami | tr '[:upper:]' '[:lower:]')
export DOMAIN=${DOMAIN:-''}

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

echo ""
red "=========================================="
red "  Con-Nav-Item Serv00 重置脚本"
red "  这将删除所有数据！"
red "=========================================="
echo ""

# 确认操作
yellow "即将重置站点: ${CURRENT_DOMAIN}\n"
yellow "工作目录: ${WORKDIR}\n"
echo ""
red "⚠️  警告：此操作将删除所有应用数据、数据库和配置！\n"
echo ""

read -p "$(red '确认要继续吗？(yes/no): ')" confirm

if [[ "$confirm" != "yes" ]]; then
    yellow "操作已取消\n"
    exit 0
fi

echo ""
yellow "开始重置...\n"

# 停止站点
yellow "停止站点...\n"
devil www stop "${CURRENT_DOMAIN}" > /dev/null 2>&1

# 删除站点
yellow "删除站点配置...\n"
devil www del "${CURRENT_DOMAIN}" > /dev/null 2>&1

# 删除工作目录
if [ -d "$WORKDIR" ]; then
    yellow "删除应用目录...\n"
    rm -rf "$WORKDIR"
    green "应用目录已删除\n"
else
    yellow "应用目录不存在，跳过\n"
fi

# 清理可能的临时文件
yellow "清理临时文件...\n"
rm -f "${HOME}/npm-install.log" 2>/dev/null
rm -f "${HOME}/.pm2/logs/*" 2>/dev/null

# 清理 npm 缓存（可选）
read -p "$(yellow '是否清理 npm 缓存？(y/n): ')" clean_cache
if [[ "$clean_cache" == "y" ]]; then
    yellow "清理 npm 缓存...\n"
    npm cache clean --force 2>/dev/null
    green "npm 缓存已清理\n"
fi

echo ""
green "=========================================="
green "  重置完成！"
green "=========================================="
echo ""

yellow "现在你可以重新运行安装脚本：\n"
echo ""
echo -e "${purple}DOMAIN=${CURRENT_DOMAIN} bash <(curl -Ls https://raw.githubusercontent.com/zczy-k/Con-Nav-Item/main/scripts/install-serv00.sh)${re}"
echo ""
green "=========================================="
