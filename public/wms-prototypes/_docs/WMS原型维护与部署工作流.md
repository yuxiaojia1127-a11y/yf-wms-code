# WMS 原型维护与部署工作流

## 1. 当前主链路

当前 WMS HTML 原型的维护、预览、部署、线上访问，统一围绕 `public/wms-prototypes` 这一套目录执行。

- 唯一维护源目录：`public/wms-prototypes`
- WEB 原型目录：`public/wms-prototypes/WEB端HTML原型`
- APP 原型目录：`public/wms-prototypes/APP端HTML原型`
- 正式文件：`WMS原型总入口.html`、`WMS-WEB端原型.html`、`WMS-APP端原型.html`
- 当前 Vercel 项目：`yuxiaojia1127-4465s-projects/wms-prototypes`
- 当前线上别名：`https://wms-prototypes.vercel.app`

## 2. 为什么之前会混乱

之前混乱的主要原因有 4 个：

1. 仓库里同时存在两套原型目录：
   - `docs/原型设计/WMS原型设计/00原型方案`
   - `public/wms-prototypes`
2. 还有一套旧访问结构：`public/prototype`
3. 之前部署时曾经从不同目录执行过 `vercel deploy`，导致 Vercel 新建了多个项目
4. Vercel 生产部署会校验最新 Git 提交作者邮箱，邮箱不一致时会拦截部署

## 3. 现在的统一约定

后续请统一按以下规则执行：

- 只在 `public/wms-prototypes` 下修改原型
- 本地预览只看 `public/wms-prototypes`
- 生产部署只发 `public/wms-prototypes`
- 线上入口统一使用 `https://wms-prototypes.vercel.app`

以下内容不再作为当前维护主链路：

- `docs/原型设计/WMS原型设计/00原型方案`
- `public/prototype`
- 旧的独立 Vercel 项目或旧部署地址

## 4. 本地调整

日常修改时，只改以下目录：

- `public/wms-prototypes/02WEB端HTML版`
- `public/wms-prototypes/03APP端HTML版`

不要再把 `docs/原型设计/WMS原型设计/00原型方案` 当成当前可编辑主目录，否则后续容易出现“改了一套、部署的是另一套”的问题。

正式入口只认以下 3 个固定文件名：

- `public/wms-prototypes/02WEB端HTML版/WMS原型总入口.html`
- `public/wms-prototypes/02WEB端HTML版/WMS-WEB端原型.html`
- `public/wms-prototypes/03APP端HTML版/WMS-APP端原型.html`

AI 新生成的 HTML 不直接进入正式链路，应先放入 `public/wms-prototypes/_drafts`，确认后再人工合并或替换正式文件。

## 5. 本地预览

在仓库根目录运行：

```bash
npm run preview:wms-prototypes
```

该命令会启动本地静态服务，服务目录是 `public`。

常用本地预览地址：

- 总入口：`http://127.0.0.1:8094/wms-prototypes/02WEB端HTML版/WMS原型总入口.html`
- WEB 原型：`http://127.0.0.1:8094/wms-prototypes/02WEB端HTML版/WMS-WEB端原型.html`
- APP 原型：`http://127.0.0.1:8094/wms-prototypes/03APP端HTML版/WMS-APP端原型.html`

本地查看最新调整时，优先使用这组地址，不要再使用旧的 `127.0.0.1:5173/prototype/...` 路径。

## 6. 生产部署

在仓库根目录运行：

```bash
npm run deploy:wms-prototypes
```

这个命令已经固化了当前正确流程，会自动执行以下动作：

1. 检查最新 Git 提交作者邮箱是否为 `yuxiaojia1127@gmail.com`
2. 发布到 Vercel 生产项目 `yuxiaojia1127-4465s-projects/wms-prototypes`

## 7. 线上访问

当前线上统一入口如下：

- 根入口：`https://wms-prototypes.vercel.app`
- WEB 总入口：`https://wms-prototypes.vercel.app/WEB端HTML原型/WMS原型总入口.html`
- WEB 原型：`https://wms-prototypes.vercel.app/WEB端HTML原型/WMS-WEB端原型.html`
- APP 原型：`https://wms-prototypes.vercel.app/APP端HTML原型/WMS-APP端原型.html`

说明：

- 线上根路径 `/` 已通过 `public/wms-prototypes/vercel.json` 指向 `WMS原型总入口.html`
- 总入口里的 WEB / APP 按钮已经改成绝对路径，避免线上再出现相对路径解析错误导致的 404

## 8. 推荐使用顺序

以后每次改原型，按下面固定顺序执行：

1. 在 `public/wms-prototypes` 下修改 HTML
2. 运行 `npm run preview:wms-prototypes` 做本地预览
3. 确认没有问题后，在 `public/wms-prototypes` 目录运行 `npx vercel deploy --prod --scope yuxiaojia1127-4465s-projects`
4. 到 `https://wms-prototypes.vercel.app` 验证线上效果

## 9. 风险提醒

目前最大的风险不是部署本身，而是“误用旧目录或旧路径”：

- 如果继续改 `docs/原型设计/WMS原型设计/00原型方案`，很容易和当前主链路脱节
- 如果继续用 `/prototype/web/index.html` 作为线上访问路径，会和当前部署目录结构不匹配
- 如果最新 Git 提交作者邮箱不是 `yuxiaojia1127@gmail.com`，Vercel 仍然可能拦截部署

## 10. 一句话记忆版

只改 `public/wms-prototypes`，只用本地 Python 服务器预览，只用 `npx vercel deploy --prod` 部署，只看 `https://wms-prototypes.vercel.app` 线上结果。
