# WMS 原型维护与部署工作流

## 1. 当前主链路

当前 WMS HTML 原型的维护、预览、部署、线上访问，统一围绕 `public/wms-prototypes` 这一套目录执行。

- 唯一维护源目录：`public/wms-prototypes`
- WEB 原型目录：`public/wms-prototypes/WEB端HTML原型`
- APP 原型目录：`public/wms-prototypes/APP端HTML原型`
- 正式文件：`WMS原型总入口.html`、`WEB端HTML原型/WMS-WEB端原型.html`、`APP端HTML原型/WMS-APP端原型.html`
- 当前 Vercel 项目：`yuxiaojia1127-4465s-projects/wms-prototypes`
- 当前线上别名：`https://wms-prototypes.vercel.app`

## 2. 单一数据源约定（重要）

WEB 端各页面不再各自内嵌数据和应用代码，统一引用以下两个共享文件：

- 需求数据唯一来源：`WEB端HTML原型/assets/wms-requirement-data.js`
- 应用代码唯一来源：`WEB端HTML原型/assets/wms-content-app.js`

约定：

- 修改需求数据/页面交互逻辑时，只改这两个文件，不要往页面 HTML 里重新内嵌副本
- 页面内"保存"功能由本地服务写入 `wms-requirement-data.js`（按模块合并、自动备份 `.bak`、原子写入）
- 新增页面时直接用 `<script src="../assets/...">` 引用共享文件

## 3. 统一规则

- 只在 `public/wms-prototypes` 下修改原型
- 本地预览只看 `public/wms-prototypes`
- 生产部署只发 `public/wms-prototypes`（仓库根目录已无 vercel.json，部署入口唯一）
- 线上入口统一使用 `https://wms-prototypes.vercel.app`
- AI 新生成的 HTML 先放 `public/wms-prototypes/_drafts`，确认后再人工合并（详见《AI生成原型文件处理规则.md》）

## 4. 本地预览

在仓库根目录运行：

```bash
npm run preview:wms-prototypes
```

该命令启动 `WEB端HTML原型/prototype_live_server.py`（端口 8091），服务目录是 `public/wms-prototypes`，并提供页面内编辑需求文档的保存接口。

常用本地预览地址：

- 总入口：`http://127.0.0.1:8091/`（自动跳转 WMS原型总入口.html）
- WEB 原型：`http://127.0.0.1:8091/WEB端HTML原型/WMS-WEB端原型.html`
- APP 原型：`http://127.0.0.1:8091/APP端HTML原型/WMS-APP端原型.html`

## 5. 生产部署

在仓库根目录运行：

```bash
npm run deploy:wms-prototypes
```

对应脚本 `scripts/deploy-wms-prototypes.sh` 固化了部署前检查，自动执行：

1. 校验最新 Git 提交作者邮箱为 `yuxiaojia1127@gmail.com`（否则 Vercel 拦截）
2. 校验 3 个正式入口文件存在
3. 校验共享数据/代码文件存在且 JS 语法通过
4. 从 `public/wms-prototypes` 执行 `npx vercel deploy --prod --scope yuxiaojia1127-4465s-projects`

## 6. 线上访问

- 根入口：`https://wms-prototypes.vercel.app`（已通过 `public/wms-prototypes/vercel.json` 指向总入口）
- WEB 原型：`https://wms-prototypes.vercel.app/WEB端HTML原型/WMS-WEB端原型.html`
- APP 原型：`https://wms-prototypes.vercel.app/APP端HTML原型/WMS-APP端原型.html`

## 7. 推荐使用顺序

1. 在 `public/wms-prototypes` 下修改（数据/逻辑改共享文件，页面结构改对应 HTML）
2. `npm run preview:wms-prototypes` 本地预览
3. 提交 git（作者邮箱用 `yuxiaojia1127@gmail.com`）
4. `npm run deploy:wms-prototypes` 部署
5. 到 `https://wms-prototypes.vercel.app` 验证

## 8. 风险提醒

- 不要在页面 HTML 里重新内嵌 `WMS_REQUIREMENT_DATA` 或应用代码副本——历史上的覆盖/漂移事故都源于多副本
- 不要从仓库根目录或其他目录执行 `vercel deploy`，部署只走 `npm run deploy:wms-prototypes`
- `.env*`、`.vercel/` 不入库也不部署（.gitignore 与 .vercelignore 已配置）
- 旧目录 `docs/原型设计/WMS原型设计/00原型方案`、`public/prototype` 已废弃，不要再改

## 9. 一句话记忆版

数据和代码只有一份在 `assets/` 下；只改 `public/wms-prototypes`；预览用 `npm run preview:wms-prototypes`；部署用 `npm run deploy:wms-prototypes`。
