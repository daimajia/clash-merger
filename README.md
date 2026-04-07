# Clash Merger

Clash Merger 是一个完全基于客户端的隐私保护型 Clash 配置文件合并工具。它允许用户将多个 Clash 订阅链接或配置文件合并为一个统一的订阅链接，所有核心的 YAML 解析和合并逻辑均在浏览器端完成，确保用户的隐私和节点数据安全。

## ✨ 核心特性

- **🔒 隐私优先 (Client-Side Processing)**: 下载、解析和合并配置的逻辑均在用户的浏览器端完成，服务器不会长期保存或窥探用户的代理节点信息。
- **⚡️ 临时订阅链接 (Transient Links)**: 借助 Cloudflare R2，生成一次性或短效的临时订阅链接，方便快速导入至 Clash/Clash Meta 客户端，极大降低配置泄露风险。
- **🗑️ 多维度管理**: 提供安全的用户界面，支持用户随时手动删除已生成的云端配置。
- **🚀 现代技术栈**: 基于 Next.js 15、React 19 以及 Tailwind CSS v4 构建，提供丝滑的交互体验和极速的加载响应。

## 🛠️ 技术架构

- **前端框架**: [Next.js](https://nextjs.org) (App Router), React 19
- **样式与 UI**: Tailwind CSS v4, [shadcn/ui](https://ui.shadcn.com), Lucide React
- **配置解析**: `js-yaml`
- **云端存储/分发**: [Cloudflare R2](https://developers.cloudflare.com/r2/) & S3 SDK (`@aws-sdk/client-s3`)

## 🚀 快速开始

### 1. 环境准备

请确保系统已安装 `Node.js` 环境 (推荐 v18+)。

### 2. 获取代码与安装依赖

```bash
git clone <repository-url>
cd clash-merger
npm install
```

### 3. 配置环境变量 (可选)

> 💡 **提示**: 本项目的大部分合并、解析功能完全在本地浏览器运行。**仅当**你需要使用**“生成云端临时订阅链接”**功能时，才需要配置下方 Cloudflare R2 相关的环境变量。如果仅在本地合并并复制/下载配置文本，则**无需**配置。

在项目根目录创建 `.env.local` 文件，配置与 Cloudflare R2 通信所需的 S3 凭证信息：

```env
# Cloudflare R2 Configuration Example
R2_ACCOUNT_ID="你的 Cloudflare Account ID"
R2_ACCESS_KEY_ID="你的访问密钥"
R2_SECRET_ACCESS_KEY="你的安全密钥"
R2_BUCKET_NAME="你的存储桶名称"
R2_PUBLIC_URL="https://pub-xxxxxx.r2.dev" # 你的公开访问域名或者自定义域名
```

### 4. 启动开发环境

```bash
npm run dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000) 即可开始使用。

## 📄 核心目录结构

- `src/app/` - Next.js App Router 主路由
  - `merge/` - 合并器的主页面 (客户端逻辑)
  - `delete/` - 链接销毁/删除的管理页面
  - `api/` - 服务端 API 路由，包含对接 Cloudflare R2 以生成安全上传和删除凭证等功能
- `src/components/` - 项目通用组件和 `shadcn` 封装 UI 组件
- `src/lib/merge/` - 核心业务库 (运行在客户端)：包含 YAML 解析 (`parser.ts`)、合并引擎 (`engine.ts`)、去重 (`dedup.ts`) 和策略组规则 (`rules.ts`, `groups.ts`) 等
- `src/types/` - TypeScript 接口和类型定义

## 🤝 参与贡献

欢迎提交 Issue 或 Pull Request，一起让本工具变得更好！

## 📄 开源协议

MIT License
