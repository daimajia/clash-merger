import { DEFAULT_RULES } from './templates';

/**
 * 合并规则
 * 策略 A (template): 使用内置默认规则
 * 策略 B (preserve): 合并所有源文件规则 + 去重，并验证 target 分组是否存在
 */
export function mergeRules(
  strategy: 'template' | 'preserve',
  sourceRules: string[][],
  validGroupNames?: Set<string>
): string[] {
  if (strategy === 'template') {
    return DEFAULT_RULES;
  }

  // preserve 策略: 合并所有来源的规则
  const seen = new Set<string>();
  const merged: string[] = [];
  let matchRule: string | null = null;

  for (const rules of sourceRules) {
    for (const rule of rules) {
      // MATCH 规则放在最后
      if (rule.startsWith('MATCH,') || rule === 'MATCH') {
        if (!matchRule) matchRule = rule;
        continue;
      }

      // 基于规则目标去重 (取 DOMAIN/IP 部分)
      const ruleKey = getRuleKey(rule);
      if (!seen.has(ruleKey)) {
        seen.add(ruleKey);
        merged.push(rule);
      }
    }
  }

  // 确保有兜底规则
  merged.push(matchRule || 'MATCH,🐟 漏网之鱼');

  // 如果提供了有效分组名集合，验证并修复规则的 target
  if (validGroupNames && validGroupNames.size > 0) {
    return merged.map((rule) => fixRuleTarget(rule, validGroupNames));
  }

  return merged;
}

/**
 * 提取规则的唯一标识
 * 例如 "DOMAIN-SUFFIX,google.com,🚀 节点选择" → "DOMAIN-SUFFIX,google.com"
 */
function getRuleKey(rule: string): string {
  const parts = rule.split(',');
  if (parts.length >= 2) {
    return `${parts[0]},${parts[1]}`;
  }
  return rule;
}

/**
 * 验证规则的 target 分组是否存在，不存在则替换为兜底分组
 * 例如 "DOMAIN-SUFFIX,google.com,🚀 节点选择" 中 "🚀 节点选择" 不存在时
 * 替换为 "🚀 总节点选择"（preserve 模式的总入口组）
 */
function fixRuleTarget(rule: string, validGroupNames: Set<string>): string {
  const parts = rule.split(',');

  // 不处理这些特殊情况：
  // - 只有1-2个部分的规则（如 MATCH 或无 target 的规则）
  // - target 是 DIRECT 或 REJECT（内置策略）
  if (parts.length < 3) return rule;

  // 规则格式: TYPE,MATCH,TARGET 或 TYPE,MATCH,TARGET,no-resolve
  // target 通常在最后一个位置，但如果有 no-resolve 则在倒数第二个
  const lastPart = parts[parts.length - 1].trim();
  let targetIndex: number;

  if (lastPart === 'no-resolve') {
    targetIndex = parts.length - 2;
  } else {
    targetIndex = parts.length - 1;
  }

  const target = parts[targetIndex].trim();

  // DIRECT 和 REJECT 是内置策略，不需要验证
  if (target === 'DIRECT' || target === 'REJECT') return rule;

  // target 存在于有效分组名中，无需修复
  if (validGroupNames.has(target)) return rule;

  // target 不存在，替换为兜底分组
  // 优先使用 "🚀 总节点选择"（preserve 模式会创建），其次 "🚀 节点选择"
  const fallback = validGroupNames.has('🚀 总节点选择')
    ? '🚀 总节点选择'
    : validGroupNames.has('🚀 节点选择')
    ? '🚀 节点选择'
    : 'DIRECT';

  parts[targetIndex] = fallback;
  return parts.join(',');
}

