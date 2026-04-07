import type { ClashConfig, MergeOptions, MergeResult, SourceInput } from '@/types/clash';
import { parseSource, serializeClashYaml } from './parser';
import { deduplicateProxies } from './dedup';
import { buildTemplateGroups, buildPreserveGroups, getRegionDistribution } from './groups';
import { mergeRules } from './rules';
import { DEFAULT_DNS } from './templates';

/**
 * 合并引擎入口
 * 接收多个来源的 YAML 内容，按选定策略合并
 */
export function mergeConfigs(
  sourceInputs: SourceInput[],
  options: MergeOptions
): MergeResult {
  // 1. 解析所有来源
  const parsedSources = sourceInputs.map((input) =>
    parseSource(input.name, input.content, input.type, input.url)
  );

  // 2. 提取并去重代理
  const proxiesBySource = parsedSources.map((s) => ({
    sourceName: s.name,
    proxies: s.config.proxies,
  }));

  const { proxies, totalBefore, totalAfter, proxyMapping } = deduplicateProxies(proxiesBySource);

  // 3. 构建代理分组
  let proxyGroups;
  if (options.strategy === 'template') {
    proxyGroups = buildTemplateGroups(proxies);
  } else {
    const sourceGroups = parsedSources
      .filter((s) => s.config['proxy-groups'] && s.config['proxy-groups']!.length > 0)
      .map((s) => ({
        sourceName: s.name,
        groups: s.config['proxy-groups']!,
      }));
    proxyGroups = buildPreserveGroups(proxies, sourceGroups, proxyMapping);
  }

  // 4. 合并规则
  const sourceRules = parsedSources.map((s) => s.config.rules || []);
  const rules = mergeRules(options.strategy, sourceRules);

  // 5. 组装最终配置
  const mergedConfig: ClashConfig = {
    'mixed-port': options.generalSettings.mixedPort,
    'allow-lan': options.generalSettings.allowLan,
    mode: options.generalSettings.mode,
    'log-level': options.generalSettings.logLevel,
    'external-controller': '127.0.0.1:9090',
    dns: DEFAULT_DNS,
    proxies,
    'proxy-groups': proxyGroups,
    rules,
  };

  // 6. 序列化
  const yamlStr = serializeClashYaml(mergedConfig);

  // 7. 统计
  const regionDistribution = getRegionDistribution(proxies);

  return {
    yaml: yamlStr,
    stats: {
      totalProxies: totalBefore,
      dedupedProxies: totalAfter,
      groupCount: proxyGroups.length,
      ruleCount: rules.length,
      regionDistribution,
    },
  };
}
