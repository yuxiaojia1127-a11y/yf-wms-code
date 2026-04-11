## Gitee Pages 部署

### 1. 构建（推荐 docs 目录）

如果你的 Gitee Pages 使用的是“仓库名子路径”，需要把 `VITE_BASE` 设置为 `/<仓库名>/`。

```bash
# 例：仓库名为 trippal-admin
VITE_BASE=/trippal-admin/ npm run build:gitee
```

产物会输出到 `docs/`，并使用 Hash 路由（避免 Pages 刷新 404）。

### 2. 推送代码

```bash
git add -A
git commit -m "build: gitee pages"
git push
```

### 3. Gitee Pages 配置

在 Gitee 仓库页面：
- 进入「服务」→「Gitee Pages」
- 构建分支选择你的默认分支（如 `master`/`main`）
- 部署目录选择 `docs`
- 点击「启动」/「更新」

### 4. 常见问题

- 页面空白：通常是 `VITE_BASE` 没设置成 `/<仓库名>/`。
- 刷新 404：已默认使用 Hash 路由（`#`），一般不会出现。

