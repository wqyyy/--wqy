# 惠企政策大脑

政策制定、起草、检索、触达、评估与专报的一体化前端应用（Vite + React + TypeScript）。

## 本地开发

```bash
npm install
cp .env.example .env   # 按需配置 VITE_POLICY_LLM_* 等大模型变量
npm run dev            # 默认 http://localhost:8080
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发服务器 |
| `npm run build` | 生产构建 |
| `npm run lint` | ESLint |
| `npm run test` | Vitest |

## 目录说明

| 路径 | 说明 |
|------|------|
| `src/pages/` | 页面路由 |
| `src/components/policy-drafting/` | 政策起草流程 |
| `src/lib/` | API、LLM、素材与规则 |
| `docs/` | 产品/功能说明文档 |

## 仓库说明

本仓库**仅维护根目录这一份应用**。历史上并存的 `wqy`、`wqy-sidebar`、`integrated-policy-project/policy-compass` 等副本已移除，避免重复改代码。

主要能力包括：政策起草（分步/快速）、大纲编辑与体例模版上传、审稿核稿、素材库引用、政策触达与评估等。
