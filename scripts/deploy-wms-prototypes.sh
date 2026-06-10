#!/bin/bash
# WMS 原型生产部署脚本
# 用法: npm run deploy:wms-prototypes
# 固化部署前检查，防止误发：邮箱校验 + 正式文件校验 + 共享资源校验
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROTO_DIR="$REPO_ROOT/public/wms-prototypes"
EXPECTED_EMAIL="yuxiaojia1127@gmail.com"
VERCEL_SCOPE="yuxiaojia1127-4465s-projects"

echo "==> 1/4 校验最新提交作者邮箱"
AUTHOR_EMAIL="$(git -C "$REPO_ROOT" log -1 --format='%ae')"
if [ "$AUTHOR_EMAIL" != "$EXPECTED_EMAIL" ]; then
  echo "❌ 最新提交作者邮箱为 $AUTHOR_EMAIL，应为 $EXPECTED_EMAIL（Vercel 会拦截部署）"
  exit 1
fi

echo "==> 2/4 校验 3 个正式入口文件"
OFFICIAL_FILES=(
  "$PROTO_DIR/WMS原型总入口.html"
  "$PROTO_DIR/WEB端HTML原型/WMS-WEB端原型.html"
  "$PROTO_DIR/APP端HTML原型/WMS-APP端原型.html"
)
for f in "${OFFICIAL_FILES[@]}"; do
  if [ ! -f "$f" ]; then
    echo "❌ 正式文件缺失：$f"
    exit 1
  fi
done

echo "==> 3/4 校验共享数据/代码文件（页面依赖的唯一数据源）"
for f in "$PROTO_DIR/WEB端HTML原型/assets/wms-requirement-data.js" \
         "$PROTO_DIR/WEB端HTML原型/assets/wms-content-app.js"; do
  if [ ! -f "$f" ]; then
    echo "❌ 共享文件缺失：$f"
    exit 1
  fi
done
if ! node --check "$PROTO_DIR/WEB端HTML原型/assets/wms-content-app.js" 2>/dev/null; then
  echo "❌ wms-content-app.js 语法检查未通过"
  exit 1
fi

echo "==> 4/4 从 $PROTO_DIR 部署到 Vercel 生产环境"
cd "$PROTO_DIR"
npx vercel deploy --prod --scope "$VERCEL_SCOPE"

echo "✅ 部署完成，请到 https://wms-prototypes.vercel.app 验证"
