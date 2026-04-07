'use client';

import { useState } from 'react';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function DeletePage() {
  const [url, setUrl] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleDelete() {
    if (!url.trim()) {
      toast.error('请输入订阅链接');
      return;
    }

    setShowConfirm(false);
    setDeleting(true);

    try {
      const res = await fetch('/api/upload-r2', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || '删除失败');
        return;
      }

      toast.success('配置文件已从 Cloudflare R2 删除');
      setUrl('');
    } catch {
      toast.error('删除请求失败，请检查网络');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="text-center mb-8 sm:mb-10">
          <div className="text-4xl sm:text-5xl mb-4">🗑️</div>
          <h1 className="text-xl sm:text-2xl font-bold mb-2">删除订阅配置</h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            输入你的订阅链接 URL，即可从 Cloudflare R2 中永久删除对应的配置文件。
            删除后该链接将失效。
          </p>
        </div>

        <Card className="p-5 sm:p-6 glass border-border/30">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">订阅链接 URL</Label>
              <Input
                placeholder="粘贴你的订阅链接地址..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="bg-background/50 font-mono text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && url.trim()) setShowConfirm(true);
                }}
              />
              <p className="text-xs text-muted-foreground">
                例如: https://your-r2-domain.com/configs/xxxx.yaml
              </p>
            </div>

            <Button
              variant="destructive"
              className="w-full cursor-pointer"
              disabled={!url.trim() || deleting}
              onClick={() => setShowConfirm(true)}
            >
              {deleting ? '删除中...' : '🗑️ 删除此配置'}
            </Button>
          </div>
        </Card>

        {/* 确认弹窗 */}
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowConfirm(false)}
            />
            <Card className="relative z-10 max-w-md w-full p-6 glass border-border/30 animate-in fade-in zoom-in-95 duration-200">
              <div className="text-center mb-4">
                <div className="text-3xl mb-2">⚠️</div>
                <h3 className="text-lg font-semibold">确认删除</h3>
              </div>
              <p className="text-sm text-muted-foreground text-center mb-2">
                你确定要从 Cloudflare R2 删除此配置文件吗？
              </p>
              <p className="text-xs text-destructive text-center mb-6 font-medium">
                此操作不可恢复，删除后该订阅链接将永久失效。
              </p>
              <div className="text-xs font-mono text-muted-foreground bg-background/50 p-2 rounded mb-6 break-all">
                {url}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 cursor-pointer"
                  onClick={() => setShowConfirm(false)}
                >
                  取消
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 cursor-pointer"
                  onClick={handleDelete}
                >
                  确认删除
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Tips */}
        <Card className="mt-6 p-4 glass border-border/30">
          <h3 className="text-sm font-semibold mb-2">💡 提示</h3>
          <ul className="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
            <li>• 删除后，使用该链接的 Clash 客户端将无法更新配置</li>
            <li>• 如果你丢失了订阅链接，可以重新合并生成新的链接</li>
            <li>• 建议定期清理不再使用的旧配置</li>
          </ul>
        </Card>
      </main>
    </>
  );
}
