# WMS Prototypes

## 当前约定

- 这里是当前 WMS HTML 原型的唯一维护目录。
- WEB 原型在 `WEB端HTML原型`
- APP 原型在 `APP端HTML原型`
- 正式文件只认 3 个固定文件名：`WMS原型总入口.html`、`WMS-WEB端原型.html`、`WMS-APP端原型.html`
- AI 新生成的版本先放 `_drafts`，不要直接替换入口文件

## 本地预览

在当前目录运行：

```bash
cd public/wms-prototypes
python3 -m http.server 8099
```

然后访问：

- `/WMS原型总入口.html`
- `/WEB端HTML原型/WMS-WEB端原型.html`
- `/APP端HTML原型/WMS-APP端原型.html`

## 生产部署

在当前目录运行：

```bash
npx vercel deploy --prod --scope yuxiaojia1127-4465s-projects
```

根路径 `/` 已通过本目录下的 `vercel.json` 指向 `WMS原型总入口.html`。
