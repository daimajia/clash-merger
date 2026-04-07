/**
 * 地区检测模板
 * 根据节点名中的关键词自动分类地区
 */

export interface RegionTemplate {
  name: string;
  emoji: string;
  keywords: RegExp;
}

export const REGION_TEMPLATES: RegionTemplate[] = [
  {
    name: '香港',
    emoji: '🇭🇰',
    keywords: /(?:HK|Hong\s*Kong|香港|🇭🇰)/i,
  },
  {
    name: '台湾',
    emoji: '🇹🇼',
    keywords: /(?:TW|Taiwan|台湾|台灣|🇹🇼)/i,
  },
  {
    name: '日本',
    emoji: '🇯🇵',
    keywords: /(?:JP|Japan|日本|东京|大阪|🇯🇵)/i,
  },
  {
    name: '新加坡',
    emoji: '🇸🇬',
    keywords: /(?:SG|Singapore|新加坡|狮城|🇸🇬)/i,
  },
  {
    name: '美国',
    emoji: '🇺🇸',
    keywords: /(?:US|USA|United\s*States|美国|洛杉矶|硅谷|西雅图|芝加哥|🇺🇸)/i,
  },
  {
    name: '韩国',
    emoji: '🇰🇷',
    keywords: /(?:KR|Korea|韩国|首尔|🇰🇷)/i,
  },
  {
    name: '英国',
    emoji: '🇬🇧',
    keywords: /(?:UK|GB|United\s*Kingdom|英国|伦敦|🇬🇧)/i,
  },
  {
    name: '德国',
    emoji: '🇩🇪',
    keywords: /(?:DE|Germany|德国|法兰克福|🇩🇪)/i,
  },
  {
    name: '法国',
    emoji: '🇫🇷',
    keywords: /(?:FR|France|法国|巴黎|🇫🇷)/i,
  },
  {
    name: '加拿大',
    emoji: '🇨🇦',
    keywords: /(?:CA|Canada|加拿大|🇨🇦)/i,
  },
  {
    name: '澳大利亚',
    emoji: '🇦🇺',
    keywords: /(?:AU|Australia|澳大利亚|澳洲|悉尼|🇦🇺)/i,
  },
  {
    name: '印度',
    emoji: '🇮🇳',
    keywords: /(?:IN|India|印度|孟买|🇮🇳)/i,
  },
  {
    name: '俄罗斯',
    emoji: '🇷🇺',
    keywords: /(?:RU|Russia|俄罗斯|莫斯科|🇷🇺)/i,
  },
  {
    name: '土耳其',
    emoji: '🇹🇷',
    keywords: /(?:TR|Turkey|Türkiye|土耳其|🇹🇷)/i,
  },
  {
    name: '阿根廷',
    emoji: '🇦🇷',
    keywords: /(?:AR|Argentina|阿根廷|🇦🇷)/i,
  },
];

/**
 * 检测节点名所属地区
 */
export function detectRegion(proxyName: string): RegionTemplate | null {
  for (const template of REGION_TEMPLATES) {
    if (template.keywords.test(proxyName)) {
      return template;
    }
  }
  return null;
}

/**
 * 默认规则模板
 */
export const DEFAULT_RULES: string[] = [
  // AI 服务
  'DOMAIN-SUFFIX,openai.com,🤖 AI 服务',
  'DOMAIN-SUFFIX,ai.com,🤖 AI 服务',
  'DOMAIN-SUFFIX,anthropic.com,🤖 AI 服务',
  'DOMAIN-SUFFIX,claude.ai,🤖 AI 服务',
  'DOMAIN-SUFFIX,gemini.google.com,🤖 AI 服务',
  'DOMAIN-SUFFIX,bard.google.com,🤖 AI 服务',
  'DOMAIN-SUFFIX,copilot.microsoft.com,🤖 AI 服务',
  'DOMAIN-SUFFIX,perplexity.ai,🤖 AI 服务',

  // 流媒体
  'DOMAIN-SUFFIX,netflix.com,🎬 流媒体',
  'DOMAIN-SUFFIX,nflxvideo.net,🎬 流媒体',
  'DOMAIN-SUFFIX,youtube.com,🎬 流媒体',
  'DOMAIN-SUFFIX,googlevideo.com,🎬 流媒体',
  'DOMAIN-SUFFIX,ytimg.com,🎬 流媒体',
  'DOMAIN-SUFFIX,disney.com,🎬 流媒体',
  'DOMAIN-SUFFIX,disneyplus.com,🎬 流媒体',
  'DOMAIN-SUFFIX,hbo.com,🎬 流媒体',
  'DOMAIN-SUFFIX,hbomax.com,🎬 流媒体',
  'DOMAIN-SUFFIX,spotify.com,🎬 流媒体',
  'DOMAIN-SUFFIX,twitch.tv,🎬 流媒体',

  // Telegram
  'IP-CIDR,91.108.4.0/22,📲 Telegram,no-resolve',
  'IP-CIDR,91.108.8.0/22,📲 Telegram,no-resolve',
  'IP-CIDR,91.108.12.0/22,📲 Telegram,no-resolve',
  'IP-CIDR,91.108.16.0/22,📲 Telegram,no-resolve',
  'IP-CIDR,91.108.20.0/22,📲 Telegram,no-resolve',
  'IP-CIDR,91.108.56.0/22,📲 Telegram,no-resolve',
  'IP-CIDR,149.154.160.0/20,📲 Telegram,no-resolve',
  'DOMAIN-SUFFIX,telegram.org,📲 Telegram',
  'DOMAIN-SUFFIX,t.me,📲 Telegram',

  // Apple
  'DOMAIN-SUFFIX,apple.com,🍎 Apple',
  'DOMAIN-SUFFIX,icloud.com,🍎 Apple',
  'DOMAIN-SUFFIX,mzstatic.com,🍎 Apple',

  // Google
  'DOMAIN-SUFFIX,google.com,🚀 节点选择',
  'DOMAIN-SUFFIX,googleapis.com,🚀 节点选择',
  'DOMAIN-SUFFIX,gstatic.com,🚀 节点选择',
  'DOMAIN-SUFFIX,gmail.com,🚀 节点选择',

  // 社交媒体
  'DOMAIN-SUFFIX,twitter.com,🚀 节点选择',
  'DOMAIN-SUFFIX,x.com,🚀 节点选择',
  'DOMAIN-SUFFIX,twimg.com,🚀 节点选择',
  'DOMAIN-SUFFIX,facebook.com,🚀 节点选择',
  'DOMAIN-SUFFIX,instagram.com,🚀 节点选择',
  'DOMAIN-SUFFIX,reddit.com,🚀 节点选择',
  'DOMAIN-SUFFIX,github.com,🚀 节点选择',
  'DOMAIN-SUFFIX,githubusercontent.com,🚀 节点选择',
  'DOMAIN-SUFFIX,wikipedia.org,🚀 节点选择',

  // 常见代理域名
  'DOMAIN-SUFFIX,amazonaws.com,🚀 节点选择',
  'DOMAIN-SUFFIX,cloudfront.net,🚀 节点选择',

  // 国内直连
  'DOMAIN-SUFFIX,cn,DIRECT',
  'DOMAIN-KEYWORD,baidu,DIRECT',
  'DOMAIN-KEYWORD,alibaba,DIRECT',
  'DOMAIN-KEYWORD,tencent,DIRECT',
  'DOMAIN-KEYWORD,bilibili,DIRECT',
  'DOMAIN-KEYWORD,taobao,DIRECT',
  'DOMAIN-KEYWORD,jd.com,DIRECT',
  'DOMAIN-SUFFIX,qq.com,DIRECT',
  'DOMAIN-SUFFIX,weixin.qq.com,DIRECT',
  'DOMAIN-SUFFIX,wechat.com,DIRECT',
  'DOMAIN-SUFFIX,163.com,DIRECT',
  'DOMAIN-SUFFIX,126.com,DIRECT',
  'DOMAIN-SUFFIX,zhihu.com,DIRECT',
  'DOMAIN-SUFFIX,douyin.com,DIRECT',
  'DOMAIN-SUFFIX,tiktokv.com,DIRECT',
  'DOMAIN-SUFFIX,bytecdn.cn,DIRECT',
  'DOMAIN-SUFFIX,bdstatic.com,DIRECT',
  'DOMAIN-SUFFIX,aliyuncs.com,DIRECT',

  // 局域网
  'DOMAIN-SUFFIX,local,DIRECT',
  'IP-CIDR,127.0.0.0/8,DIRECT',
  'IP-CIDR,172.16.0.0/12,DIRECT',
  'IP-CIDR,192.168.0.0/16,DIRECT',
  'IP-CIDR,10.0.0.0/8,DIRECT',

  // GeoIP 中国直连
  'GEOIP,CN,DIRECT',

  // 兜底
  'MATCH,🐟 漏网之鱼',
];

/**
 * 默认 DNS 配置
 */
export const DEFAULT_DNS = {
  enable: true,
  listen: '0.0.0.0:53',
  'enhanced-mode': 'fake-ip',
  'fake-ip-range': '198.18.0.1/16',
  nameserver: [
    'https://dns.alidns.com/dns-query',
    'https://doh.pub/dns-query',
  ],
  fallback: [
    'https://dns.google/dns-query',
    'https://dns.cloudflare.com/dns-query',
  ],
  'fallback-filter': {
    geoip: true,
    'geoip-code': 'CN',
  },
};
