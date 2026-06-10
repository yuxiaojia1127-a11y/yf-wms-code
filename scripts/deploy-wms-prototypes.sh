#!/bin/bash
# WMS 原型生产部署脚本
# 用法: npm run deploy:wms-prototypes
# 固化部署前检查，防止误发：邮箱校验 + 正式文件校验 + 共享资源校验
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROTO_DIR="$REPO_ROOT/public/wms-prototypes"
EXPECTED_EMAIL="yuxiaojia1127@gmail.com"
VERCEL_SCOPE="yuxiaojia1127-4465s-projects"

echo "==> 1/3 校验最新提交作者邮箱"
AUTHOR_EMAIL="$(git -C "$REPO_ROOT" log -1 --format='%ae')"
if [ "$AUTHOR_EMAIL" != "$EXPECTED_EMAIL" ]; then
  echo "❌ 最新提交作者邮箱为 $AUTHOR_EMAIL，应为 $EXPECTED_EMAIL（Vercel 会拦截部署）"
  exit 1
fi

echo "==> 2/3 运行完整性与防回归校验"
bash "$REPO_ROOT/scripts/check-wms-prototypes.sh"

echo "==> 3/3 从 $PROTO_DIR 部署到 Vercel 生产环境"
cd "$PROTO_DIR"
npx vercel deploy --prod --scope "$VERCEL_SCOPE"

echo "✅ 部署完成，请到 https://wms-prototypes.vercel.app 验证"
