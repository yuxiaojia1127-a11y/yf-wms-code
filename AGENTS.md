# YF-WMS-Code 项目 AI 协作规则

任何 AI 工具（Claude、Cursor、Codex 等）修改本项目前，必须遵守以下规则。

## 1. 单一数据源（最重要）

WEB 端原型的数据和应用代码**各只有一份**，所有页面通过 `<script src>` 引用：

- 需求数据唯一来源：`public/wms-prototypes/WEB端HTML原型/assets/wms-requirement-data.json`（纯 JSON，由 wms-content-app.js fetch 加载）
- 应用代码唯一来源：`public/wms-prototypes/WEB端HTML原型/assets/wms-content-app.js`

**禁止**：

- 在任何页面 HTML 内嵌 `window.WMS_REQUIREMENT_DATA = {...}` 数据副本
- 在任何页面 HTML 内嵌应用代码副本（历史上 20 个页面各嵌一份，导致漂移和覆盖事故，已于 2026-06 重构收敛）
- 生成"整页 HTML 包含全部数据和脚本"的单文件版本来替换正式页面

修改需求数据、菜单、页面交互逻辑时：**只改上述两个共享文件**。修改页面结构时才改对应页面 HTML。

## 2. 正式文件与草稿

正式链路只认 3 个固定文件：

- `public/wms-prototypes/WMS原型总入口.html`
- `public/wms-prototypes/WEB端HTML原型/WMS-WEB端原型.html`
- `public/wms-prototypes/APP端HTML原型/WMS-APP端原型.html`

AI 新生成的 HTML 一律先放 `public/wms-prototypes/_drafts/`，命名 `YYYYMMDD-模块-用途.html`。禁止直接覆盖正式文件、禁止在正式目录堆"最终版/优化版/副本"。

## 3. 文件归位

- 生成的文件必须放到 `public/` 下分类存放，不能乱放项目根目录
- 文档放 `public/wms-prototypes/_docs/` 对应子目录
- 项目脚本放 `scripts/`

## 4. 预览与部署

- 本地预览：`npm run preview:wms-prototypes`（端口 8091，带需求编辑保存接口）
- 生产部署：`npm run deploy:wms-prototypes`（含提交邮箱、正式文件、JS 语法校验）
- **禁止**在任何目录直接执行 `vercel deploy`；仓库根目录没有也不应再出现 vercel.json
- git 提交作者邮箱必须为 `yuxiaojia1127@gmail.com`，否则 Vercel 拦截部署

## 5. 保存机制（不要绕过）

页面内"保存"由 `prototype_live_server.py` 的 `/__save_requirement__` 接口处理：按模块 key 合并写入共享数据文件，自动 `.bak` 备份 + 原子写入。不要新增直接整文件覆写数据文件的脚本或接口。

## 6. 详细文档

- 工作流：`public/wms-prototypes/_docs/WMS原型维护与部署工作流.md`
- AI 生成文件规则：`public/wms-prototypes/_docs/AI生成原型文件处理规则.md`
