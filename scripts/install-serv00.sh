#!/bin/bash

# Nav-Item Serv00 一键安装脚本
# 作者: zczy-k
# GitHub: https://github.com/zczy-k/nav-item

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
green "=========================================="
green "  Nav-Item Serv00 一键安装脚本"
green "  GitHub: github.com/zczy-k/nav-item"
green "=========================================="
echo ""

# 检查命令
command -v curl &>/dev/null && COMMAND="curl -so" || command -v wget &>/dev/null && COMMAND="wget -qO" || { red "错误: 未找到 curl 或 wget，请先安装其中之一。" >&2; exit 1; }

check_website() {
    yellow "正在检查站点配置...\n"
    CURRENT_SITE=$(devil www list | awk -v domain="$CURRENT_DOMAIN" '$1 == domain && $2 == "nodejs"')
    
    if [ -n "$CURRENT_SITE" ]; then
        green "已存在 ${CURRENT_DOMAIN} 站点\n"
    else
        EXIST_SITE=$(devil www list | awk -v domain="$CURRENT_DOMAIN" '$1 == domain')
        
        if [ -n "$EXIST_SITE" ]; then
            yellow "删除旧站点并创建新的 Node.js 站点...\n"
            devil www del "$CURRENT_DOMAIN" >/dev/null 2>&1
            devil www add "$CURRENT_DOMAIN" nodejs /usr/local/bin/node20 > /dev/null 2>&1
            green "已创建新站点 ${CURRENT_DOMAIN}\n"
        else
            yellow "创建新的 Node.js 站点...\n"
            devil www add "$CURRENT_DOMAIN" nodejs /usr/local/bin/node20 > /dev/null 2>&1
            green "已创建站点 ${CURRENT_DOMAIN}\n"
        fi
    fi
}

install_application() {
    yellow "正在安装应用，请稍等...\n"
    
    # 创建并进入工作目录
    mkdir -p "$WORKDIR"
    cd "$WORKDIR" || exit 1
    
    # 下载项目文件
    DOWNLOAD_URL="https://github.com/zczy-k/nav-item/archive/refs/heads/main.zip"
    yellow "下载项目文件...\n"
    $COMMAND "${WORKDIR}/nav-item.zip" "$DOWNLOAD_URL"
    
    if [ ! -f "${WORKDIR}/nav-item.zip" ]; then
        red "下载失败！请检查网络连接。"
        exit 1
    fi
    
    # 解压文件
    yellow "解压文件...\n"
    unzip -oq "${WORKDIR}/nav-item.zip" -d "${WORKDIR}"
    
    # 移动文件到当前目录
    if [ -d "${WORKDIR}/nav-item-main" ]; then
        cp -r ${WORKDIR}/nav-item-main/* ${WORKDIR}/
        rm -rf ${WORKDIR}/nav-item-main
    fi
    
    rm -f "${WORKDIR}/nav-item.zip"
    
    # 使用 Serv00 专用的 app.js
    if [ -f "${WORKDIR}/app.serv00.js" ]; then
        cp "${WORKDIR}/app.serv00.js" "${WORKDIR}/app.js"
        green "已使用 Serv00 专用配置\n"
    fi
    
    # 配置 Node 环境
    mkdir -p ~/bin
    ln -fs /usr/local/bin/node20 ~/bin/node > /dev/null 2>&1
    ln -fs /usr/local/bin/npm20 ~/bin/npm > /dev/null 2>&1
    mkdir -p ~/.npm-global
    npm config set prefix '~/.npm-global' 2>/dev/null || true
    
    # 创建 .bash_profile 如果不存在
    touch ~/.bash_profile
    
    if ! grep -q "~/.npm-global/bin" ~/.bash_profile 2>/dev/null; then
        echo 'export PATH=~/.npm-global/bin:~/bin:$PATH' >> ~/.bash_profile
    fi
    
    # 导入环境变量
    export PATH=~/.npm-global/bin:~/bin:/usr/local/devil/node20/bin:$PATH
    
    # 安装依赖
    yellow "安装后端依赖...（这可能需要几分钟）\n"
    
    if npm install 2>&1 | tee /tmp/npm-install.log | grep -v "^npm warn"; then
        green "依赖安装成功\n"
    else
        red "依赖安装失败！\n"
        yellow "错误日志："
        tail -20 /tmp/npm-install.log
        exit 1
    fi
    
    # 重启应用
    devil www restart "${CURRENT_DOMAIN}" > /dev/null 2>&1
    green "应用已启动\n"
}

show_info() {
    echo ""
    green "=========================================="
    green "  安装完成！"
    green "=========================================="
    echo ""
    
    if [[ -z "$DOMAIN" ]]; then
        if curl -o /dev/null -s -w "%{http_code}\n" https://${CURRENT_DOMAIN} | grep -q 200; then
            green "✓ 导航站已成功安装\n"
        else
            red "✗ 站点 ${CURRENT_DOMAIN} 无法访问"
            yellow "请稍等片刻后再次尝试，或查看日志排查问题"
            echo ""
        fi
    else
        ip_address=$(devil vhost list | awk '$2 ~ /web/ {print $1}')
        echo ""
        purple "请将域名 ${yellow}${CURRENT_DOMAIN} ${purple}添加 A 记录指向："
        yellow "$ip_address"
        purple "并在 Cloudflare 开启代理（小黄云）\n"
    fi
    
    echo -e "${green}站点地址：${purple}https://${CURRENT_DOMAIN}${re}"
    echo -e "${green}后台管理：${purple}https://${CURRENT_DOMAIN}/admin${re}"
    echo -e "${green}管理账号：${purple}admin${re}"
    echo -e "${green}管理密码：${purple}123456${re}"
    echo ""
    red "⚠️  请登录后立即修改密码！"
    echo ""
    echo -e "${yellow}项目地址：${re}${purple}https://github.com/zczy-k/nav-item${re}"
    echo -e "${yellow}部署文档：${re}${purple}查看 DEPLOY_SERV00.md${re}"
    echo ""
    green "=========================================="
}

# 主函数
main() {
    check_website
    install_application
    show_info
}

main
