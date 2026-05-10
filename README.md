# NexaHub 多行业运营平台

pnpm workspace monorepo，包含 NestJS API、Vue3 后台、uni-app 移动端占位、DIY 编辑器预留目录和共享包。

## 目录结构

```text
apps/
  api/          NestJS + TypeScript + Prisma + SQLite
  admin/        Vue3 + Vite + TypeScript + Naive UI
  mobile/       uni-app + Vue3 空项目
  diy-editor/   DIY 编辑器预留目录
packages/
  shared/       共享类型与工具
```

## 快速开始

```bash
pnpm install
pnpm --filter @nexahub/api prisma:generate
pnpm dev
```

开发入口：

- Admin 统一入口: `http://localhost:5173`
- API 代理: `http://localhost:5173/api`
- DIY 装修: `http://localhost:5173/diy-editor?pageId=1`
- Mobile H5: `http://localhost:5173/mobile`

API、DIY 编辑器和 Mobile H5 在开发期作为本机内部服务启动，由 admin Vite dev server 代理；浏览器不要直接访问内部端口。

后台首页会调用 `GET /api/health`，成功后显示 API 连接成功。

## 环境变量

复制 `.env.example` 到 `.env` 或 `apps/api/.env` 后按需调整。

```env
DATABASE_URL="file:./dev.db"
API_PORT=3000
VITE_API_BASE_URL=/api
```

## 常用命令

```bash
pnpm dev
pnpm build
pnpm typecheck
pnpm prisma:generate
```
