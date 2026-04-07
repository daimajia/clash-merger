import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {

  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: '请提供订阅链接 URL' }, { status: 400 });
    }

    // 校验 URL 格式及协议
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        return NextResponse.json({ error: '仅支持 HTTP/HTTPS 协议' }, { status: 400 });
      }

      // 检查 SSRF (拦截内网请求)
      const hostname = parsedUrl.hostname;
      const isPrivateIP = /^(localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+)$/.test(hostname);
      if (isPrivateIP) {
        return NextResponse.json({ error: '出于安全原因，禁止访问内网或本地地址' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: '无效的 URL 格式' }, { status: 400 });
    }

    // 拉取订阅内容
    const response = await fetch(parsedUrl.toString(), {
      headers: {
        'User-Agent': 'ClashForAndroid/2.5.12',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `拉取失败: HTTP ${response.status}` },
        { status: 400 }
      );
    }

    // 限制内容大小 (提前检查 header)
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > 5 * 1024 * 1024) {
      return NextResponse.json({ error: '订阅文件过大 (超过 5MB 限额)' }, { status: 400 });
    }

    const content = await response.text();

    // 再次通过字符串长度检查以防没有 content-length 的情况下
    if (content.length > 5 * 1024 * 1024) {
      return NextResponse.json({ error: '订阅文件过大 (超过 5MB 限额)' }, { status: 400 });
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: '订阅内容为空' }, { status: 400 });
    }

    // 获取订阅信息 header
    const subscriptionUserinfo = response.headers.get('subscription-userinfo');

    return NextResponse.json({
      content,
      subscriptionUserinfo,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '拉取失败';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
