import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

let cachedS3Client: S3Client | null = null;
function getS3Client() {
  if (cachedS3Client) return cachedS3Client;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 环境变量未配置');
  }

  cachedS3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return cachedS3Client;
}

function getBucket() {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) throw new Error('R2_BUCKET_NAME 未配置');
  return bucket;
}

function getPublicUrl() {
  const url = process.env.R2_PUBLIC_URL;
  if (!url) throw new Error('R2_PUBLIC_URL 未配置');
  return url.replace(/\/$/, '');
}

// 从 URL 中严格提取 R2 key，防止任意删除
function extractKeyFromUrl(url: string): string | null {
  const publicUrl = getPublicUrl();
  // 仅允许我们自己的 public URL 开头的请求
  if (url.startsWith(publicUrl)) {
    const path = url.slice(publicUrl.length + 1); // +1 for the slash
    // 强制只能匹配 UUID 格式的配置文件，防止恶意跨目录删除
    if (/^configs\/[0-9a-fA-F]{32}\.yaml$/.test(path)) {
      return path;
    }
  }
  return null;
}

// POST — 上传 YAML 到 R2
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { yaml } = body;

    if (!yaml || typeof yaml !== 'string') {
      return NextResponse.json({ error: '配置内容不能为空' }, { status: 400 });
    }

    // 限制内容大小 (不超过 5MB)
    if (yaml.length > 5 * 1024 * 1024) {
      return NextResponse.json({ error: '合并后配置过大 (超过 5MB)' }, { status: 400 });
    }

    const client = getS3Client();
    const bucket = getBucket();
    const publicUrl = getPublicUrl();

    // 强制使用随机 UUID（32个字符）作为文件名，忽略前端传的 filename
    const id = crypto.randomUUID().replace(/-/g, '');
    const key = `configs/${id}.yaml`;

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: yaml,
        ContentType: 'text/yaml; charset=utf-8',
      })
    );

    const url = `${publicUrl}/${key}`;

    return NextResponse.json({ url, key });
  } catch (error) {
    const message = error instanceof Error ? error.message : '上传失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE — 从 R2 删除文件
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { url: fileUrl } = body;

    if (!fileUrl) {
      return NextResponse.json({ error: '请提供要删除的订阅链接 URL' }, { status: 400 });
    }

    const key = extractKeyFromUrl(fileUrl);

    if (!key) {
      return NextResponse.json({ error: '无效的订阅链接或权限不足' }, { status: 400 });
    }

    const client = getS3Client();
    const bucket = getBucket();

    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );

    return NextResponse.json({ success: true, key });
  } catch (error) {
    const message = error instanceof Error ? error.message : '删除失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
