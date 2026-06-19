#!/bin/bash
# WMS 原型完整性校验（可独立运行，也被部署脚本调用）
# 用法: npm run check:wms-prototypes
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROTO_DIR="$REPO_ROOT/public/wms-prototypes"

echo "==> 校验 3 个正式入口文件"
for f in "$PROTO_DIR/WMS原型总入口.html" \
         "$PROTO_DIR/WEB端HTML原型/WMS-WEB端原型.html" \
         "$PROTO_DIR/APP端HTML原型/WMS-APP端原型.html"; do
  if [ ! -f "$f" ]; then
    echo "❌ 正式文件缺失：$f"
    exit 1
  fi
done

echo "==> 校验共享数据/代码文件"
APP_JS="$PROTO_DIR/WEB端HTML原型/assets/wms-content-app.js"
DATA_JSON="$PROTO_DIR/WEB端HTML原型/assets/wms-requirement-data.json"
for f in "$APP_JS" "$DATA_JSON"; do
  if [ ! -f "$f" ]; then
    echo "❌ 共享文件缺失：$f"
    exit 1
  fi
done
if ! node --check "$APP_JS" 2>/dev/null; then
  echo "❌ JS 语法检查未通过：$APP_JS"
  exit 1
fi
if ! python3 -c "import json,sys; d=json.load(open(sys.argv[1])); assert isinstance(d, dict)" "$DATA_JSON" 2>/dev/null; then
  echo "❌ 数据文件不是有效 JSON 对象：$DATA_JSON"
  exit 1
fi

echo "==> 校验页面未重新内嵌数据/代码副本（防回归）"
python3 - "$PROTO_DIR" <<'EOF'
import re, sys, pathlib

proto_dir = pathlib.Path(sys.argv[1])
# 独立小型原型页，自带专属脚本，豁免大小检查（仍不允许内嵌 WMS_REQUIREMENT_DATA）
SIZE_EXEMPT = set()
MAX_INLINE_SCRIPT = 50_000  # 字节。正常页面内联脚本远小于此值；历史事故副本为 9万+/42万+

script_pat = re.compile(r'<script(?:\s[^>]*)?>([\s\S]*?)</script>', re.I)
data_pat = re.compile(r'window\.WMS_REQUIREMENT_DATA\s*=\s*\{')

errors = []
for p in sorted(proto_dir.rglob('*.html')):
    rel = p.relative_to(proto_dir)
    if rel.parts[0] in ('_drafts', '_docs'):
        continue  # 草稿与文档不参与正式链路校验
    text = p.read_text(encoding='utf-8', errors='replace')
    if data_pat.search(text):
        errors.append(f"{rel}: 检测到内嵌 WMS_REQUIREMENT_DATA 数据副本（数据应放在 assets/wms-requirement-data.json）")
    for s in script_pat.findall(text):
        size = len(s.encode('utf-8'))
        if size > MAX_INLINE_SCRIPT and str(rel) not in SIZE_EXEMPT:
            errors.append(f"{rel}: 内联 <script> 过大（{size} 字节 > {MAX_INLINE_SCRIPT}），疑似代码副本（应引用共享 assets）")

if errors:
    print("❌ 防回归校验失败：")
    for e in errors:
        print("   -", e)
    sys.exit(1)
print("   内嵌副本检查通过")
EOF

echo "==> 校验需求文档副本与源文档一致（assets/requirements）"
python3 "$REPO_ROOT/scripts/sync-requirements.py" --check

echo "✅ 校验全部通过"
