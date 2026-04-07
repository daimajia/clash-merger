// Clash 配置类型定义

export interface ClashProxy {
  name: string;
  type: string; // vmess, vless, ss, ssr, trojan, hysteria2, tuic, etc.
  server: string;
  port: number;
  [key: string]: unknown;
}

export interface ClashProxyGroup {
  name: string;
  type: 'select' | 'url-test' | 'fallback' | 'load-balance' | 'relay';
  proxies: string[];
  url?: string;
  interval?: number;
  tolerance?: number;
  lazy?: boolean;
  [key: string]: unknown;
}

export interface ClashRuleProvider {
  type: string;
  behavior: string;
  url?: string;
  path?: string;
  interval?: number;
}

export interface ClashDNS {
  enable?: boolean;
  listen?: string;
  'enhanced-mode'?: string;
  nameserver?: string[];
  fallback?: string[];
  'fallback-filter'?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ClashConfig {
  port?: number;
  'socks-port'?: number;
  'mixed-port'?: number;
  'allow-lan'?: boolean;
  mode?: string;
  'log-level'?: string;
  'external-controller'?: string;
  dns?: ClashDNS;
  proxies: ClashProxy[];
  'proxy-groups'?: ClashProxyGroup[];
  rules?: string[];
  'rule-providers'?: Record<string, ClashRuleProvider>;
  [key: string]: unknown;
}

export interface ParsedSource {
  name: string;
  type: 'file' | 'url';
  url?: string;
  config: ClashConfig;
  proxyCount: number;
}

export type MergeStrategy = 'template' | 'preserve';

export interface MergeOptions {
  strategy: MergeStrategy;
  generalSettings: {
    mixedPort: number;
    allowLan: boolean;
    mode: string;
    logLevel: string;
  };
}

export interface MergeResult {
  yaml: string;
  stats: {
    totalProxies: number;
    dedupedProxies: number;
    groupCount: number;
    ruleCount: number;
    regionDistribution: Record<string, number>;
  };
}

export interface SourceInput {
  name: string;
  type: 'file' | 'url';
  content: string;
  url?: string;
}
