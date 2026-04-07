import type { ClashProxy } from '@/types/clash';

interface DeduplicatedProxy extends ClashProxy {
  _source?: string;
}

/**
 * 生成代理的唯一标识 key
 * 基于 type + server + port (同一服务器同端口同协议为重复)
 */
function getProxyKey(proxy: ClashProxy): string {
  return `${proxy.type}://${proxy.server}:${proxy.port}`;
}

/**
 * 计算 proxy 配置的"完整度"分数
 * 字段越多越完整，保留配置更完整的那个
 */
function getProxyCompleteness(proxy: ClashProxy): number {
  return Object.keys(proxy).filter((k) => !k.startsWith('_') && proxy[k] !== undefined && proxy[k] !== null).length;
}

/**
 * 对多源代理列表进行去重
 * 返回去重后的代理列表
 */
export function deduplicateProxies(
  proxiesBySource: { sourceName: string; proxies: ClashProxy[] }[]
): {
  proxies: DeduplicatedProxy[];
  totalBefore: number;
  totalAfter: number;
  proxyMapping: Record<string, Record<string, string>>;
} {
  const seen = new Map<string, DeduplicatedProxy>();
  const nameCount = new Map<string, number>();
  let totalBefore = 0;

  // 记录每个来源的节点原始名到 key 的映射
  const proxyEntitiesBySource: Record<string, { oldName: string; key: string }[]> = {};

  // 第一轮：收集所有代理，按 key 去重
  for (const { sourceName, proxies } of proxiesBySource) {
    proxyEntitiesBySource[sourceName] = [];
    for (const proxy of proxies) {
      totalBefore++;
      const key = getProxyKey(proxy);
      proxyEntitiesBySource[sourceName].push({ oldName: proxy.name, key });
      const existing = seen.get(key);

      if (!existing || getProxyCompleteness(proxy) > getProxyCompleteness(existing)) {
        seen.set(key, { ...proxy, _source: sourceName });
      }
    }
  }

  // 第二轮：处理名称冲突
  const result: DeduplicatedProxy[] = [];
  const finalNames = new Set<string>();
  const keyToNewName = new Map<string, string>(); // <key, newName>

  for (const [key, proxy] of seen.entries()) {
    let name = proxy.name;

    if (finalNames.has(name)) {
      // 名称冲突，追加来源标记
      const count = (nameCount.get(name) || 1) + 1;
      nameCount.set(name, count);
      name = `${name} [${proxy._source || count}]`;
    }

    finalNames.add(name);
    keyToNewName.set(key, name);
    
    const { _source, ...cleanProxy } = proxy;
    result.push({ ...cleanProxy, name });
  }

  // 第三轮：构建 mapping，供后续修复代理组引用
  const proxyMapping: Record<string, Record<string, string>> = {};
  for (const sourceName of Object.keys(proxyEntitiesBySource)) {
    proxyMapping[sourceName] = {};
    for (const entity of proxyEntitiesBySource[sourceName]) {
      const newName = keyToNewName.get(entity.key);
      if (newName) {
        proxyMapping[sourceName][entity.oldName] = newName;
      }
    }
  }

  return {
    proxies: result,
    totalBefore,
    totalAfter: result.length,
    proxyMapping,
  };
}
