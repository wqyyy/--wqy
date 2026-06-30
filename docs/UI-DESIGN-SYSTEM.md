# 惠企政策大脑 — UI 设计规范

> 目标：统一字号、间距与布局，减少 `text-[13px]`、`text-[15px]`、`max-w-[1440px]` 等随意写法。  
> 新代码优先使用语义化 class；旧页面逐步迁移，不要求一次性改完。

---

## 1. 字体与字号

**字体**：`Noto Sans SC`（已在 `index.css` 全局设置）

**原则**：优先 Tailwind 标准档 + 项目扩展档，禁止新增任意 `text-[Npx]`（已有存量可保留，改动时顺带替换）。

| 语义 | Class | 字号 | 字重 | 用途 |
|------|-------|------|------|------|
| 展示标题 | `text-display` | 30px | 700 | 仅 `PageHero` 主标题 |
| 页面标题 | `text-page-title` | 20px (`text-xl`) | 600 | 历史任务列表 H1、详情页 H1 |
| 区块标题 | `text-section-title` | 18px (`text-lg`) | 600 | 流程步骤 H2、Dashboard 区块 |
| 卡片标题 | `text-card-title` | 16px (`text-base`) | 600 | 任务卡片、列表项标题 |
| 面板标题 | `text-panel-title` | 14px (`text-sm`) | 600 | 侧栏「大纲编辑」、流程条标题 |
| 正文 | `text-body` | 14px (`text-sm`) | 400 | 说明、表单标签、列表正文 |
| 辅助说明 | `text-caption` | 12px (`text-xs`) | 400 | 时间戳、次要说明 |
| 紧凑标签 | `text-micro` | 11px | 400/500 | Badge、状态标签、统计小字 |
| 角标 | `text-nano` | 10px | 600 | 待办数字角标、步骤序号 |

**行高**：

- 正文/说明：`leading-relaxed`（1.625）
- 标题：`leading-normal` 或组件默认
- 政策正文编辑区（长文）：`leading-7`（28px）

---

## 2. 颜色

**优先语义色**，避免硬编码灰色/红色：

| 用途 | 推荐 | 避免 |
|------|------|------|
| 主色 | `text-primary` / `bg-primary` | `#d21639`、`text-red-500` |
| 正文 | `text-foreground` | `text-gray-800` |
| 次要 | `text-muted-foreground` | `text-gray-500`、`#8b90a0` |
| 页面背景 | `bg-background` | `bg-[#f7f4f4]`（布局壳层可暂保留） |
| 卡片 | `bg-card` + `border-border` | 裸 `bg-white`（特殊首页除外） |
| 主按钮渐变 | `gov-gradient` | 内联 `from-[#d21639]` |

---

## 3. 布局

### 3.1 页面壳层（带侧栏的业务页）

```tsx
<div className="page-shell">
  <div className="page-container">
    {/* 内容 */}
  </div>
</div>
```

等价于：`p-5 md:p-6` + `mx-auto max-w-7xl space-y-6`

**适用**：政策兑现、政策触达、任务列表、政策制定入口等大多数页面。

### 3.2 多步流程内容区

```tsx
<div className="flow-container">
  {/* 步骤表单 */}
</div>
```

等价于：`max-w-5xl px-6 py-8 md:px-8`

**适用**：前评估、政策起草步骤内容、`PolicyAssessmentFlow`。

### 3.3 全宽 / 沉浸页

| 场景 | 最大宽度 | 说明 |
|------|----------|------|
| 首页 | `max-w-6xl` | 数字人 + 问答，居中 |
| 标准业务页 | `max-w-page`（80rem / 1280px） | **默认** |
| 宽表格页 | `max-w-pageWide`（90rem） | 政策检索、工具箱 |
| 政策编辑全屏 | 无 max-width | `PolicyOutputPage` 占满主区 |

> 统一后不再使用 `max-w-[1400px]`、`max-w-[1800px]` 等魔法数字；宽页用 `max-w-pageWide`。

### 3.4 侧栏面板

- 工具面板宽度：**360px**（`w-[360px]`）
- 主布局侧栏：**244px** 展开 / **72px** 收起（`AppLayout` 已定，勿改）

### 3.5 间距

| 场景 | 推荐 |
|------|------|
| 页面区块之间 | `space-y-6` 或 `gap-6` |
| 列表页紧凑区块 | `gap-4` / `space-y-4` |
| 卡片内边距 | `p-4`（紧凑）/ `p-5`（标准）/ `p-6`（大卡片） |
| 表单项之间 | `space-y-3` |

---

## 4. 圆角

| 元素 | Class |
|------|-------|
| 按钮、输入框（默认） | `rounded-md`（`--radius: 0.5rem`） |
| 卡片、面板 | `rounded-xl` |
| 大卡片、弹窗 | `rounded-2xl` |
| PageHero | `rounded-[28px]`（仅此组件） |

---

## 5. 组件尺寸

### 按钮

使用 `@/components/ui/button`，不手写高度：

| 场景 | size |
|------|------|
| 默认操作 | `default`（h-10, text-sm） |
| 工具栏/表格内 | `sm`（h-9） |
| 强调主操作 | `lg`（h-11） |

内联小按钮（如待办「查看」）应逐步改为 `<Button size="sm">`。

### 输入框

| 场景 | 高度 |
|------|------|
| 标准表单 | `h-10`（`Input` 默认） |
| 搜索框 / 上传区 | `h-11` |
| 首页大输入 | 自定义，仅首页 |

---

## 6. 典型页面模板

### 带 PageHero 的列表页

```tsx
<div className="page-shell">
  <div className="page-container">
    <PageHero title="…" description="…" />
    {/* 筛选栏 */}
    {/* 卡片网格 gap-4 */}
  </div>
</div>
```

### 历史任务列表（已统一）

- H1：`text-page-title`（`text-xl font-semibold`）
- 卡片标题：`text-card-title`
- 元信息：`text-caption`
- Badge：`text-micro` 或 Badge `text-[10px]` → 逐步改为 `text-micro`

---

## 7. 当前主要不一致点（迁移清单）

| 问题 | 出现位置 | 目标 |
|------|----------|------|
| `text-[13px]`、`text-[15px]` | HomePage、PolicyOutputPage、PolicySearch | `text-sm` / `text-body` |
| `text-[18px]` 与 `text-lg` 混用 | 多页 | 统一 `text-section-title` 或 `text-lg` |
| `text-[17px]` 侧栏导航 | AppLayout | 改为 `text-base`（16px）或保留为导航特例并文档化 |
| `max-w-[1440px]` 等 | PolicySearch、PolicyToolbox | `max-w-pageWide` |
| `p-6 md:p-8` vs `p-5 md:p-6` | 前评估 vs 其他页 | 统一 `page-shell` |
| 硬编码 `#d21639`、`gray-*` | HomePage | 语义色 + `gov-gradient` |

---

## 8. 开发约定

1. **新页面**必须使用 `page-shell` + `page-container`（或 `flow-container`）。
2. **新文字样式**从第 1 节表格选取，禁止新增 `text-[Npx]`。
3. **新颜色**使用 CSS 变量 / Tailwind 语义色。
4. 改动旧页面时，顺手替换所在文件内的魔法数字。
5. shadcn 组件（Button、Input、Badge）优先于原生 `<button>` + 手写 class。

---

## 9. Token 定义位置

- 颜色 / 圆角：`src/index.css` → `:root`
- 字号 / 间距扩展：`tailwind.config.ts` → `theme.extend`
- 布局 / 标题工具类：`src/index.css` → `@layer utilities`
