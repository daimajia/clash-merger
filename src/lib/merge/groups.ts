import type { ClashProxy, ClashProxyGroup } from '@/types/clash';
import { detectRegion, REGION_TEMPLATES } from './templates';

/**
 * 策略 A: 模板分组 — 按地区自动归类节点
 */
export function buildTemplateGroups(proxies: ClashProxy[]): ClashProxyGroup[] {
  const proxyNames = proxies.map((p) => p.name);

  // 按地区归类
  const regionMap = new Map<string, string[]>();
  const unclassified: string[] = [];

  for (const proxy of proxies) {
    const region = detectRegion(proxy.name);
    if (region) {
      const key = `${region.emoji} ${region.name}`;
      if (!regionMap.has(key)) {
        regionMap.set(key, []);
      }
      regionMap.get(key)!.push(proxy.name);
    } else {
      unclassified.push(proxy.name);
    }
  }

  const groups: ClashProxyGroup[] = [];

  // 收集所有地区分组名称（只包含有节点的地区）
  const regionGroupNames: string[] = [];
  for (const template of REGION_TEMPLATES) {
    const key = `${template.emoji} ${template.name}`;
    if (regionMap.has(key) && regionMap.get(key)!.length > 0) {
      regionGroupNames.push(key);
    }
  }

  // 如果有未分类的节点，也创建一个分组
  if (unclassified.length > 0) {
    regionGroupNames.push('🌍 其他地区');
  }

  // 🚀 节点选择 (select) — 手动选择地区分组
  groups.push({
    name: '🚀 节点选择',
    type: 'select',
    proxies: ['♻️ 自动选择', ...regionGroupNames, 'DIRECT'],
  });

  // ♻️ 自动选择 (url-test) — 全部节点
  groups.push({
    name: '♻️ 自动选择',
    type: 'url-test',
    proxies: proxyNames,
    url: 'http://www.gstatic.com/generate_204',
    interval: 300,
    tolerance: 50,
  });

  // 各地区分组
  for (const template of REGION_TEMPLATES) {
    const key = `${template.emoji} ${template.name}`;
    const regionProxies = regionMap.get(key);
    if (regionProxies && regionProxies.length > 0) {
      groups.push({
        name: key,
        type: 'url-test',
        proxies: regionProxies,
        url: 'http://www.gstatic.com/generate_204',
        interval: 300,
        tolerance: 50,
      });
    }
  }

  // 🌍 其他地区
  if (unclassified.length > 0) {
    groups.push({
      name: '🌍 其他地区',
      type: 'url-test',
      proxies: unclassified,
      url: 'http://www.gstatic.com/generate_204',
      interval: 300,
      tolerance: 50,
    });
  }

  // 🎬 流媒体
  groups.push({
    name: '🎬 流媒体',
    type: 'select',
    proxies: ['🚀 节点选择', ...regionGroupNames],
  });

  // 🤖 AI 服务 (美国, 日本, 新加坡, 英国)
  const aiPreferredNames = REGION_TEMPLATES.filter((t) =>
    ['美国', '日本', '新加坡', '英国'].includes(t.name)
  ).map((t) => `${t.emoji} ${t.name}`);

  const aiPreferred = aiPreferredNames.filter((n) => regionGroupNames.includes(n));
  groups.push({
    name: '🤖 AI 服务',
    type: 'select',
    proxies: [...aiPreferred, '🚀 节点选择', ...regionGroupNames.filter((n) => !aiPreferred.includes(n))],
  });

  // 📲 Telegram (香港, 新加坡, 美国)
  const tgPreferredNames = REGION_TEMPLATES.filter((t) =>
    ['香港', '新加坡', '美国'].includes(t.name)
  ).map((t) => `${t.emoji} ${t.name}`);

  const tgPreferred = tgPreferredNames.filter((n) => regionGroupNames.includes(n));
  groups.push({
    name: '📲 Telegram',
    type: 'select',
    proxies: ['🚀 节点选择', ...tgPreferred],
  });

  // 🍎 Apple
  groups.push({
    name: '🍎 Apple',
    type: 'select',
    proxies: ['DIRECT', '🚀 节点选择', ...regionGroupNames],
  });

  // 🐟 漏网之鱼
  groups.push({
    name: '🐟 漏网之鱼',
    type: 'select',
    proxies: ['🚀 节点选择', 'DIRECT'],
  });

  return groups;
}

export function buildPreserveGroups(
  proxies: ClashProxy[],
  sourceGroups: { sourceName: string; groups: ClashProxyGroup[] }[],
  proxyMapping: Record<string, Record<string, string>>
): ClashProxyGroup[] {
  const allProxyNames = proxies.map((p) => p.name);
  const mergedGroupMap = new Map<string, ClashProxyGroup>();

  // 合并同名 group
  for (const { sourceName, groups } of sourceGroups) {
    const mapping = proxyMapping[sourceName] || {};
    
    for (const group of groups) {
      // 转换所有的源代理名到去重后的新名字
      const mappedProxiesArray = group.proxies.map(oldName => mapping[oldName] || oldName);
      
      const existing = mergedGroupMap.get(group.name);
      if (existing) {
        // 合并 proxies 列表（去重）
        const mergedProxies = new Set([...existing.proxies, ...mappedProxiesArray]);
        existing.proxies = [...mergedProxies];
      } else {
        mergedGroupMap.set(group.name, { ...group, proxies: [...mappedProxiesArray] });
      }
    }
  }

  // 过滤掉引用了不存在节点的组
  const validNames = new Set([...allProxyNames, ...Array.from(mergedGroupMap.keys()), 'DIRECT', 'REJECT']);

  for (const [, group] of mergedGroupMap) {
    group.proxies = group.proxies.filter((name) => validNames.has(name));
  }

  // 移除空分组
  for (const [name, group] of mergedGroupMap) {
    if (group.proxies.length === 0) {
      mergedGroupMap.delete(name);
    }
  }

  const result = Array.from(mergedGroupMap.values());

  // 添加总节点选择器
  const subGroupNames = result.map((g) => g.name);
  result.unshift({
    name: '🚀 总节点选择',
    type: 'select',
    proxies: [...subGroupNames, ...allProxyNames, 'DIRECT'],
  });

  // 添加兜底
  result.push({
    name: '🐟 漏网之鱼',
    type: 'select',
    proxies: ['🚀 总节点选择', 'DIRECT'],
  });

  return result;
}

/**
 * 统计地区分布
 */
export function getRegionDistribution(proxies: ClashProxy[]): Record<string, number> {
  const distribution: Record<string, number> = {};

  for (const proxy of proxies) {
    const region = detectRegion(proxy.name);
    const key = region ? `${region.emoji} ${region.name}` : '🌍 其他';
    distribution[key] = (distribution[key] || 0) + 1;
  }

  return distribution;
}
