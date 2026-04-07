'use client';

import { useState, useCallback } from 'react';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { parseClashYaml } from '@/lib/merge/parser';
import { mergeConfigs } from '@/lib/merge/engine';
import { getRegionDistribution } from '@/lib/merge/groups';
import type { MergeStrategy, MergeResult, SourceInput } from '@/types/clash';

interface ParsedSourceInfo {
  name: string;
  type: 'file' | 'url';
  content: string;
  url?: string;
  proxyCount: number;
  regionDistribution: Record<string, number>;
}

export default function MergePage() {
  const [step, setStep] = useState(1);
  const [sources, setSources] = useState<ParsedSourceInfo[]>([]);
  const [strategy, setStrategy] = useState<MergeStrategy>('template');
  const [mixedPort, setMixedPort] = useState(7890);
  const [allowLan, setAllowLan] = useState(true);
  const [mode, setMode] = useState('rule');
  const [logLevel, setLogLevel] = useState('info');
  const [mergeResult, setMergeResult] = useState<MergeResult | null>(null);
  const [subUrl, setSubUrl] = useState('');
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [configName, setConfigName] = useState('');

  // R2 上传相关状态
  const [showUploadConfirm, setShowUploadConfirm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');

  // 浏览器端解析 YAML 文件
  const handleFiles = useCallback(async (files: FileList) => {
    for (const file of Array.from(files)) {
      if (!file.name.endsWith('.yml') && !file.name.endsWith('.yaml')) {
        toast.error(`${file.name} 不是 YAML 文件`);
        continue;
      }
      try {
        const content = await file.text();
        const config = parseClashYaml(content);
        const regionDist = getRegionDistribution(config.proxies);
        setSources((prev) => [
          ...prev,
          {
            name: file.name,
            type: 'file',
            content,
            proxyCount: config.proxies.length,
            regionDistribution: regionDist,
          },
        ]);
        toast.success(`${file.name} 解析成功: ${config.proxies.length} 个节点`);
      } catch (err) {
        toast.error(`${file.name}: ${err instanceof Error ? err.message : '解析失败'}`);
      }
    }
  }, []);

  // 拖拽
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  // 订阅链接拉取（仍需服务端代理解决 CORS）
  const handleFetchUrl = async () => {
    if (!subUrl.trim()) return;
    setFetchingUrl(true);
    try {
      const res = await fetch('/api/fetch-sub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: subUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        return;
      }

      // 浏览器端解析
      const config = parseClashYaml(data.content);
      const regionDist = getRegionDistribution(config.proxies);
      const urlName = new URL(subUrl).hostname;

      setSources((prev) => [
        ...prev,
        {
          name: urlName,
          type: 'url',
          content: data.content,
          url: subUrl,
          proxyCount: config.proxies.length,
          regionDistribution: regionDist,
        },
      ]);
      toast.success(`${urlName}: ${config.proxies.length} 个节点`);
      setSubUrl('');
    } catch {
      toast.error('拉取失败');
    } finally {
      setFetchingUrl(false);
    }
  };

  // 删除来源
  const removeSource = (index: number) => {
    setSources((prev) => prev.filter((_, i) => i !== index));
  };

  // 浏览器端执行合并
  const handleMerge = () => {
    try {
      const sourceInputs: SourceInput[] = sources.map((s) => ({
        name: s.name,
        type: s.type,
        content: s.content,
        url: s.url,
      }));

      const result = mergeConfigs(sourceInputs, {
        strategy,
        generalSettings: { mixedPort, allowLan, mode, logLevel },
      });

      setMergeResult(result);
      setStep(3);
      setGeneratedLink('');
      toast.success('合并成功！');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '合并失败');
    }
  };

  // 下载
  const handleDownload = () => {
    if (!mergeResult) return;
    const blob = new Blob([mergeResult.yaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${configName || 'merged-config'}.yaml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 上传到 R2 生成订阅链接
  const handleUploadToR2 = async () => {
    if (!mergeResult) return;
    setShowUploadConfirm(false);
    setUploading(true);
    try {
      const res = await fetch('/api/upload-r2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          yaml: mergeResult.yaml,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || '上传失败');
        return;
      }
      setGeneratedLink(data.url);
      toast.success('订阅链接已生成！请务必保存');
    } catch {
      toast.error('上传请求失败');
    } finally {
      setUploading(false);
    }
  };

  // 复制链接
  const copyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    toast.success('订阅链接已复制到剪贴板');
  };

  const totalProxies = sources.reduce((sum, s) => sum + s.proxyCount, 0);

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Steps indicator */}
        <div className="flex items-center justify-center mb-8 sm:mb-10 gap-0">
          {[
            { num: 1, label: '添加来源' },
            { num: 2, label: '设置策略' },
            { num: 3, label: '预览结果' },
          ].map((s, i) => (
            <div key={s.num} className="flex items-center">
              <button
                onClick={() => {
                  if (s.num <= step) setStep(s.num);
                }}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  step === s.num
                    ? 'bg-primary text-primary-foreground'
                    : step > s.num
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs border border-current/30">
                  {step > s.num ? '✓' : s.num}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < 2 && (
                <div
                  className={`w-8 sm:w-16 h-px mx-1 sm:mx-2 ${
                    step > s.num ? 'bg-primary' : 'bg-border'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: 添加来源 */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2">添加配置来源</h2>
              <p className="text-sm text-muted-foreground">
                上传 Clash YML 文件或粘贴订阅链接
              </p>
            </div>

            {/* Upload area */}
            <Card
              className={`border-2 border-dashed transition-all duration-200 ${
                dragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-border/50 hover:border-primary/30'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <div className="p-8 sm:p-12 text-center">
                <div className="text-3xl sm:text-4xl mb-3">📁</div>
                <p className="text-sm sm:text-base font-medium mb-2">
                  拖拽 YML 文件到此处
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  支持 .yml 和 .yaml 格式
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.multiple = true;
                    input.accept = '.yml,.yaml';
                    input.onchange = (e) => {
                      const files = (e.target as HTMLInputElement).files;
                      if (files) handleFiles(files);
                    };
                    input.click();
                  }}
                  className="cursor-pointer"
                >
                  选择文件
                </Button>
              </div>
            </Card>

            {/* URL input */}
            <Card className="p-4 sm:p-5 glass border-border/30">
              <Label className="text-sm font-medium mb-2 block">
                🔗 订阅链接
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="粘贴 Clash 订阅链接..."
                  value={subUrl}
                  onChange={(e) => setSubUrl(e.target.value)}
                  className="bg-background/50"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleFetchUrl();
                  }}
                />
                <Button
                  onClick={handleFetchUrl}
                  disabled={fetchingUrl || !subUrl.trim()}
                  className="shrink-0 cursor-pointer"
                >
                  {fetchingUrl ? '拉取中...' : '拉取'}
                </Button>
              </div>
            </Card>

            {/* Sources list */}
            {sources.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    已添加来源 ({sources.length})
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    共 {totalProxies} 个节点
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {sources.map((source, i) => (
                    <Card
                      key={i}
                      className="p-4 glass border-border/30 group hover:border-primary/20 transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-lg">
                            {source.type === 'file' ? '📄' : '🔗'}
                          </span>
                          <span className="text-sm font-medium truncate">
                            {source.name}
                          </span>
                        </div>
                        <button
                          onClick={() => removeSource(i)}
                          className="text-muted-foreground hover:text-destructive transition-colors text-sm opacity-0 group-hover:opacity-100 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {source.proxyCount} 节点
                        </Badge>
                        {Object.entries(source.regionDistribution)
                          .slice(0, 3)
                          .map(([region, count]) => (
                            <Badge
                              key={region}
                              variant="outline"
                              className="text-xs"
                            >
                              {region} {count}
                            </Badge>
                          ))}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={sources.length === 0}
                size="lg"
                className="cursor-pointer"
              >
                下一步: 选择策略 →
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: 策略选择 */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2">合并策略</h2>
              <p className="text-sm text-muted-foreground">
                选择代理分组的生成方式
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card
                className={`p-5 sm:p-6 cursor-pointer transition-all duration-200 ${
                  strategy === 'template'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                    : 'glass border-border/30 hover:border-primary/20'
                }`}
                onClick={() => setStrategy('template')}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-2xl">🧠</div>
                  <div>
                    <h3 className="font-semibold">方案 A: 智能模板分组</h3>
                    <Badge variant="secondary" className="text-xs mt-1">
                      推荐
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  自动按地区归类节点（🇭🇰 香港 / 🇺🇸 美国 / 🇯🇵 日本...），
                  生成标准代理分组和分流规则。适合大多数用户。
                </p>
              </Card>

              <Card
                className={`p-5 sm:p-6 cursor-pointer transition-all duration-200 ${
                  strategy === 'preserve'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                    : 'glass border-border/30 hover:border-primary/20'
                }`}
                onClick={() => setStrategy('preserve')}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-2xl">📂</div>
                  <h3 className="font-semibold">方案 B: 保留原始分组</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  保留各来源文件的原有分组结构，合并同名分组。
                  适合已有成熟配置、不想改动分组结构的用户。
                </p>
              </Card>
            </div>

            <Separator className="my-4" />

            {/* General settings */}
            <Card className="p-5 sm:p-6 glass border-border/30">
              <h3 className="font-semibold mb-4">通用设置</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Mixed Port</Label>
                  <Input
                    type="number"
                    value={mixedPort}
                    onChange={(e) => setMixedPort(parseInt(e.target.value) || 7890)}
                    className="bg-background/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">运行模式</Label>
                  <Select value={mode} onValueChange={(v) => v && setMode(v)}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rule">Rule (规则模式)</SelectItem>
                      <SelectItem value="global">Global (全局代理)</SelectItem>
                      <SelectItem value="direct">Direct (直连)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">日志级别</Label>
                  <Select value={logLevel} onValueChange={(v) => v && setLogLevel(v)}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="silent">Silent</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="debug">Debug</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-background/30">
                  <Label className="text-sm">Allow LAN</Label>
                  <Switch
                    checked={allowLan}
                    onCheckedChange={setAllowLan}
                  />
                </div>
              </div>
            </Card>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="cursor-pointer"
              >
                ← 返回
              </Button>
              <Button
                onClick={handleMerge}
                size="lg"
                className="cursor-pointer"
              >
                🔄 执行合并
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: 预览结果 */}
        {step === 3 && mergeResult && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2">合并结果</h2>
              <p className="text-sm text-muted-foreground">
                预览合并后的配置，下载或上传生成订阅链接
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: '原始节点', value: mergeResult.stats.totalProxies, icon: '📊' },
                { label: '去重后', value: mergeResult.stats.dedupedProxies, icon: '✨' },
                { label: '代理分组', value: mergeResult.stats.groupCount, icon: '📂' },
                { label: '路由规则', value: mergeResult.stats.ruleCount, icon: '📋' },
              ].map((stat) => (
                <Card key={stat.label} className="p-3 sm:p-4 glass border-border/30 text-center">
                  <div className="text-xl sm:text-2xl mb-1">{stat.icon}</div>
                  <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </Card>
              ))}
            </div>

            {/* Tabs */}
            <Card className="glass border-border/30">
              <Tabs defaultValue="distribution" className="w-full">
                <TabsList className="w-full justify-start rounded-none border-b border-border/30 bg-transparent h-auto p-0">
                  <TabsTrigger
                    value="distribution"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-3 text-sm"
                  >
                    📊 地区分布
                  </TabsTrigger>
                  <TabsTrigger
                    value="yaml"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-3 text-sm"
                  >
                    📝 YAML 预览
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="distribution" className="p-4 sm:p-5">
                  <div className="space-y-2">
                    {Object.entries(mergeResult.stats.regionDistribution)
                      .sort(([, a], [, b]) => b - a)
                      .map(([region, count]) => {
                        const total = mergeResult.stats.dedupedProxies || 1; // 保护除数为0
                        const percent = Math.round((count / total) * 100);
                        return (
                          <div key={region} className="flex items-center gap-3">
                            <span className="text-sm w-28 sm:w-32 shrink-0 truncate">{region}</span>
                            <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all duration-500"
                                style={{ width: `${Math.max(percent, 3)}%` }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground w-16 text-right shrink-0">
                              {count} ({percent}%)
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </TabsContent>

                <TabsContent value="yaml" className="p-0">
                  <pre className="p-4 sm:p-5 text-xs sm:text-sm font-mono overflow-x-auto max-h-96 leading-relaxed">
                    {mergeResult.yaml}
                  </pre>
                </TabsContent>
              </Tabs>
            </Card>

            {/* 生成链接区域 */}
            {generatedLink ? (
              <Card className="p-5 glass border-primary/30 bg-primary/5">
                <div className="text-center mb-3">
                  <div className="text-2xl mb-1">✅</div>
                  <h3 className="font-semibold text-primary">订阅链接已生成</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    ⚠️ 此链接仅展示一次，刷新后将无法再查看，请务必保存！
                  </p>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={generatedLink}
                    readOnly
                    className="bg-background/50 font-mono text-xs"
                  />
                  <Button onClick={copyLink} className="shrink-0 cursor-pointer">
                    复制
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="p-4 sm:p-5 glass border-border/30">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
                  <div className="flex-1 space-y-2">
                    <Label className="text-sm">配置名称（仅用于本地下载文件名）</Label>
                    <Input
                      placeholder="例如: my-merged-config"
                      value={configName}
                      onChange={(e) => setConfigName(e.target.value)}
                      className="bg-background/50"
                    />
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="outline"
                      onClick={handleDownload}
                      className="cursor-pointer"
                    >
                      📥 下载
                    </Button>
                    <Button
                      onClick={() => setShowUploadConfirm(true)}
                      disabled={uploading}
                      className="cursor-pointer"
                    >
                      {uploading ? '上传中...' : '🔗 生成订阅链接'}
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            <div className="flex justify-start">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="cursor-pointer"
              >
                ← 返回修改策略
              </Button>
            </div>
          </div>
        )}

        {/* R2 上传确认弹窗 */}
        {showUploadConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowUploadConfirm(false)}
            />
            <Card className="relative z-10 max-w-md w-full p-6 glass border-border/30 animate-in fade-in zoom-in-95 duration-200">
              <div className="text-center mb-4">
                <div className="text-3xl mb-2">☁️</div>
                <h3 className="text-lg font-semibold">确认上传</h3>
              </div>

              <div className="space-y-3 mb-6">
                <p className="text-sm text-muted-foreground text-center leading-relaxed">
                  你的合并配置将上传到 <span className="text-foreground font-medium">Cloudflare R2</span> 云端存储，
                  并生成一个可公开访问的订阅链接。
                </p>
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-xs text-amber-200 leading-relaxed">
                    🔒 <strong>安全提示：</strong>只要你不暴露此订阅链接，其他人无法访问你的配置文件。
                    链接使用随机字符生成，不可能被猜测到。
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    ⚠️ <strong>重要：</strong>订阅链接仅在本页展示一次，刷新后将无法再查看。
                    如需删除已上传的配置，请前往「删除配置」页面。
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 cursor-pointer"
                  onClick={() => setShowUploadConfirm(false)}
                >
                  取消
                </Button>
                <Button
                  className="flex-1 cursor-pointer"
                  onClick={handleUploadToR2}
                >
                  确认上传
                </Button>
              </div>
            </Card>
          </div>
        )}
      </main>
    </>
  );
}
