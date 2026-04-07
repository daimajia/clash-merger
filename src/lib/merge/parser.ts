import yaml from 'js-yaml';
import type { ClashConfig, ClashProxy, ParsedSource } from '@/types/clash';

/**
 * 解析 YAML 字符串为 ClashConfig
 * 支持 Clash 和 Clash Meta 格式
 */
export function parseClashYaml(content: string): ClashConfig {
  const parsed = yaml.load(content) as Record<string, unknown>;

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('无效的 YAML 格式');
  }

  // 尝试从不同字段提取 proxies
  let proxies: ClashProxy[] = [];

  if (Array.isArray(parsed.proxies)) {
    proxies = parsed.proxies as ClashProxy[];
  } else if (Array.isArray(parsed.Proxy)) {
    // 旧版 Clash 格式
    proxies = parsed.Proxy as ClashProxy[];
  }

  if (proxies.length === 0) {
    throw new Error('配置文件中未找到代理节点 (proxies)');
  }

  // 校验每个 proxy 的基本字段
  proxies = proxies.filter((p) => {
    return p && p.name && p.type && p.server && p.port;
  });

  if (proxies.length === 0) {
    throw new Error('配置文件中没有有效的代理节点');
  }

  return {
    ...parsed,
    proxies,
    'proxy-groups': (parsed['proxy-groups'] || parsed['Proxy Group'] || []) as ClashConfig['proxy-groups'],
    rules: (parsed.rules || parsed.Rule || []) as string[],
    'rule-providers': (parsed['rule-providers'] || {}) as ClashConfig['rule-providers'],
  };
}

/**
 * 从 YAML 字符串解析出 ParsedSource
 */
export function parseSource(name: string, content: string, type: 'file' | 'url', url?: string): ParsedSource {
  const config = parseClashYaml(content);

  return {
    name,
    type,
    url,
    config,
    proxyCount: config.proxies.length,
  };
}

/**
 * 将 ClashConfig 序列化为 YAML 字符串
 */
export function serializeClashYaml(config: ClashConfig): string {
  // 按照 Clash 标准字段顺序输出
  const ordered: Record<string, unknown> = {};

  // 通用设置
  if (config['mixed-port']) ordered['mixed-port'] = config['mixed-port'];
  if (config.port) ordered.port = config.port;
  if (config['socks-port']) ordered['socks-port'] = config['socks-port'];
  if (config['allow-lan'] !== undefined) ordered['allow-lan'] = config['allow-lan'];
  if (config.mode) ordered.mode = config.mode;
  if (config['log-level']) ordered['log-level'] = config['log-level'];
  if (config['external-controller']) ordered['external-controller'] = config['external-controller'];

  // DNS
  if (config.dns) ordered.dns = config.dns;

  // 核心
  ordered.proxies = config.proxies;
  if (config['proxy-groups'] && config['proxy-groups'].length > 0) {
    ordered['proxy-groups'] = config['proxy-groups'];
  }
  if (config['rule-providers'] && Object.keys(config['rule-providers']).length > 0) {
    ordered['rule-providers'] = config['rule-providers'];
  }
  if (config.rules && config.rules.length > 0) {
    ordered.rules = config.rules;
  }

  return yaml.dump(ordered, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    sortKeys: false,
  });
}
