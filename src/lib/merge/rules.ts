import { DEFAULT_RULES } from './templates';

/**
 * 合并规则
 * 策略 A (template): 使用内置默认规则
 * 策略 B (preserve): 合并所有源文件规则 + 去重
 */
export function mergeRules(
  strategy: 'template' | 'preserve',
  sourceRules: string[][]
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
