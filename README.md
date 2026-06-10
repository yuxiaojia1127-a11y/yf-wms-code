# YF-WMS-Code

自研仓储系统（WMS）的 HTML 高保真原型仓库，包含 WEB 端、APP 端原型及配套需求文档，部署在 Vercel。

- 线上入口：https://wms-prototypes.vercel.app
- WEB 原型：https://wms-prototypes.vercel.app/WEB端HTML原型/WMS-WEB端原型.html
- APP 原型：https://wms-prototypes.vercel.app/APP端HTML原型/WMS-APP端原型.html

## 目录结构

```
public/wms-prototypes/        原型唯一维护源目录（即 Vercel 部署目录）
├── WMS原型总入口.html         正式入口（线上根路径指向此文件）
├── WEB端HTML原型/
│   ├── WMS-WEB端原型.html     WEB 正式入口
│   ├── pages/                各功能页面（仅含页面结构，引用共享 assets）
│   ├── assets/
│   │   ├── wms-requirement-data.json 需求数据唯一来源（纯 JSON，app js fetch 加载）
│   │   └── wms-content-app.js        应用代码唯一来源
│   └── prototype_live_server.py      本地预览服务（含需求编辑保存接口）
├── APP端HTML原型/             APP 端原型（同样使用共享 assets）
├── _docs/                    需求、设计、API 文档
└── _drafts/                  AI 生成的草稿 HTML（不进正式链路）
scripts/                      部署与校验脚本
skills/                       AI 技能/提示词
```

## 常用命令

```bash
npm run preview:wms-prototypes   # 本地预览（端口 8091，带保存接口）
npm run check:wms-prototypes     # 完整性 + 防内嵌副本校验
npm run deploy:wms-prototypes    # 生产部署（自动执行校验）
```

## 核心约定

- **单一数据源**：需求数据和应用代码各只有一份（见上方 assets），页面只通过 `<script src>` 引用，禁止内嵌副本
- **正式文件只有 3 个**：总入口、WEB 原型、APP 原型；AI 生成的新 HTML 先进 `_drafts/`
- **部署只走 npm 脚本**：禁止手动 `vercel deploy`；提交作者邮箱须为 `yuxiaojia1127@gmail.com`

完整规则见 `AGENTS.md` 与 `public/wms-prototypes/_docs/WMS原型维护与部署工作流.md`。
