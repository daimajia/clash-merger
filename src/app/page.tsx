'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Navbar } from '@/components/navbar';

const features = [
  {
    icon: '📁',
    title: '多源合并',
    description: '支持同时上传多个 YML 文件或粘贴订阅链接，一键智能合并',
  },
  {
    icon: '🧠',
    title: '智能分组',
    description: '自动识别节点所在地区，按地区归类生成标准代理分组',
  },
  {
    icon: '☁️',
    title: '云端订阅',
    description: '合并后上传至 Cloudflare R2 存储，生成可直接导入 Clash 的订阅链接',
  },
  {
    icon: '🛡️',
    title: '节点去重',
    description: '智能检测重复节点（同服务器/端口/协议），保留最优配置',
  },
  {
    icon: '📋',
    title: '内置规则',
    description: '预设分流规则模板，覆盖 AI 服务、流媒体、Telegram 等常用场景',
  },
  {
    icon: '🔒',
    title: '隐私安全',
    description: '全浏览器端解析合并，服务端只负责上传。链接不暴露则无人可访问',
  },
];

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        {/* Hero */}
        <section className="relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-1/4 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-48 sm:w-72 h-48 sm:h-72 bg-chart-3/5 rounded-full blur-3xl" />
          </div>

          <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-12 sm:pb-20 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs sm:text-sm text-primary mb-6 sm:mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              开源免费 · 纯前端合并
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
              <span className="gradient-text">智能合并</span>
              <br className="sm:hidden" />
              <span className="text-foreground"> 你的 Clash 配置</span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-8 sm:mb-10 leading-relaxed px-4">
              多个机场订阅、自建节点，一键合并为统一配置。
              <br className="hidden sm:block" />
              自动去重、智能分组、生成云端订阅链接。
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <Link href="/merge">
                <Button size="lg" className="w-full sm:w-auto text-base px-6 sm:px-8 cursor-pointer">
                  🚀 开始合并
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((feature, i) => (
              <Card
                key={i}
                className="p-5 sm:p-6 glass border-border/30 hover:border-primary/30 transition-all duration-300 group"
              >
                <div className="text-2xl sm:text-3xl mb-3 group-hover:animate-float transition-all">
                  {feature.icon}
                </div>
                <h3 className="text-base sm:text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </section>

        {/* Security Section */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
          <div className="text-center mb-8 sm:mb-10">
            <div className="text-3xl sm:text-4xl mb-3">🛡️</div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">你的隐私，我们的底线</h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
              我们从架构设计上确保你的配置安全，而非仅靠承诺
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
            <Card className="p-5 sm:p-6 glass border-border/30">
              <div className="flex items-start gap-4">
                <div className="text-2xl shrink-0">🖥️</div>
                <div>
                  <h3 className="font-semibold mb-1">隐私优先的处理机制</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    YAML 解析、节点去重、分组合并等核心逻辑<strong className="text-foreground">全部在你的浏览器中运行</strong>。
                    本地上传文件不经过任何服务器；订阅链接仅通过服务端纯代理拉取，绝不存储。
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-5 sm:p-6 glass border-border/30">
              <div className="flex items-start gap-4">
                <div className="text-2xl shrink-0">🔐</div>
                <div>
                  <h3 className="font-semibold mb-1">不可猜测的链接</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    订阅链接使用 128-bit 随机 UUID 生成，共有 <strong className="text-foreground">3.4×10³⁸</strong> 种可能组合。
                    暴力遍历在数学上不可行。
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-5 sm:p-6 glass border-border/30">
              <div className="flex items-start gap-4">
                <div className="text-2xl shrink-0">☁️</div>
                <div>
                  <h3 className="font-semibold mb-1">Cloudflare R2 存储</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    合并后的配置存储在 Cloudflare R2 — 全球领先的云存储基础设施。
                    无目录浏览、无索引页面，<strong className="text-foreground">只有知道精确链接才能访问</strong>。
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-5 sm:p-6 glass border-border/30">
              <div className="flex items-start gap-4">
                <div className="text-2xl shrink-0">🗑️</div>
                <div>
                  <h3 className="font-semibold mb-1">随时可删除</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    你可以随时通过「删除配置」页面，输入订阅链接彻底删除云端文件。
                    删除后文件<strong className="text-foreground">不可恢复</strong>，链接立即失效。
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-4 sm:p-5 glass border-primary/20 bg-primary/5">
            <div className="flex items-start gap-3">
              <div className="text-lg shrink-0 mt-0.5">💡</div>
              <div>
                <h4 className="text-sm font-semibold mb-1">安全使用建议</h4>
                <ul className="text-xs text-muted-foreground space-y-1 leading-relaxed">
                  <li>• 生成的订阅链接<strong className="text-foreground">仅展示一次</strong>，刷新页面后无法再查看，请立即保存</li>
                  <li>• 不要在公开场合（论坛、群聊）分享你的订阅链接，这相当于暴露你的全部代理节点</li>
                  <li>• 如果怀疑链接泄露，前往「删除配置」删除旧文件，然后重新生成新链接</li>
                  <li>• 本工具代码开源，你可以自行审查、自行部署到自己的服务器</li>
                </ul>
              </div>
            </div>
          </Card>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/30 py-6 sm:py-8 text-center text-xs sm:text-sm text-muted-foreground">
          <p>Clash Merger · 纯前端 Clash 配置合并工具</p>
        </footer>
      </main>
    </>
  );
}
