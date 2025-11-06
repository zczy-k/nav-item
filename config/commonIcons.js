// 常用网站图标映射配置
// 用于为被墙或不稳定的网站提供本地图标

const commonIcons = {
  // GitHub
  'github.com': '/icons/common/github.png',
  'www.github.com': '/icons/common/github.png',
  'raw.githubusercontent.com': '/icons/common/github.png',
  'gist.github.com': '/icons/common/github.png',
  
  // NodeSeek
  'nodeseek.com': '/icons/common/nodeseek.png',
  'www.nodeseek.com': '/icons/common/nodeseek.png',
};

// 从URL中提取域名
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.toLowerCase();
  } catch {
    return null;
  }
}

// 获取常用网站的本地图标
function getCommonIcon(url) {
  const domain = extractDomain(url);
  if (!domain) return null;
  
  // 精确匹配
  if (commonIcons[domain]) {
    return commonIcons[domain];
  }
  
  // 尝试去掉 www. 前缀匹配
  const domainWithoutWww = domain.replace(/^www\./, '');
  if (commonIcons[domainWithoutWww]) {
    return commonIcons[domainWithoutWww];
  }
  
  return null;
}

module.exports = {
  commonIcons,
  getCommonIcon,
  extractDomain
};
