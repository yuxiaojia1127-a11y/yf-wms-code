#!/usr/bin/env python3
"""同步简易需求源文档 → 原型静态副本（assets/requirements）。

源文档位于 public/wms-prototypes/_docs/需求方案/需求文档/00简易需求（WEB）/，
原型生产/静态环境只读取 WEB端HTML原型/assets/requirements/ 下的副本，
两者不同步会导致线上看到旧版需求文档。

用法:
  python3 scripts/sync-requirements.py            # 一次性同步（源 → 副本）
  python3 scripts/sync-requirements.py --check    # 仅校验，不一致时退出码 1（供部署前检查调用）
  python3 scripts/sync-requirements.py --watch    # 监听源文档变更，自动同步（写文档时挂着）

新增文档时在 MAPPING 中加一行即可。
"""
import argparse
import pathlib
import sys
import time

REPO_ROOT = pathlib.Path(__file__).resolve().parent.parent
PROTO_DIR = REPO_ROOT / "public" / "wms-prototypes"
SOURCE_BASE = PROTO_DIR / "_docs" / "需求方案" / "需求文档" / "00简易需求（WEB）"
TARGET_DIR = PROTO_DIR / "WEB端HTML原型" / "assets" / "requirements"

# 副本文件名 → 源文档（相对 SOURCE_BASE）。None 表示暂无源文档，副本即唯一版本。
MAPPING = {
    "cockpit-self-operated.md": "驾驶舱/00驾驶舱简易需求-自营版.md",
    "exception-urgent-list.md": "驾驶舱/超时紧急列表-简易需求文档.md",
    "inbound.md": "入库管理/02入库管理简易需求-1.0简化版.md",
    "inventory-detail.md": "库存中心/库存明细-简易需求文档.md",
    "inventory-query.md": "库存中心/库存查询-简易需求文档.md",
    "inventory-risk-list.md": "库存中心/库存风险列表-简易需求文档.md",
    "logistics-track-list.md": "驾驶舱/物流跟踪明细列表-简易需求文档.md",
    "outbound.md": "出库管理/WMB-出库管理简易需求.md",
    "product-listing-log.md": "商品管理/06商品接口上下架简易需求.md",
    "stock-flow.md": None,  # 出入库流水：_docs 中无简易需求源文档，副本即唯一版本
    "warehouse-operation-track-list.md": "驾驶舱/仓内作业跟踪简易需求文档.md",
    "warehouse-room.md": "仓储管理/库房管理简易需求文档.md",
}


def pairs():
    """返回 [(源路径, 副本路径)]，跳过无源文档的条目。"""
    result = []
    for target_name, source_rel in MAPPING.items():
        if source_rel is None:
            continue
        result.append((SOURCE_BASE / source_rel, TARGET_DIR / target_name))
    return result


def diff_pairs():
    """返回内容不一致或缺失的 (源, 副本) 列表；源文档缺失时报错退出。"""
    stale = []
    missing_sources = []
    for src, dst in pairs():
        if not src.exists():
            missing_sources.append(src)
            continue
        if not dst.exists() or src.read_bytes() != dst.read_bytes():
            stale.append((src, dst))
    if missing_sources:
        print("❌ 以下源文档缺失（被移动或改名后请同步更新 scripts/sync-requirements.py 的 MAPPING）：")
        for p in missing_sources:
            print(f"   - {p.relative_to(PROTO_DIR)}")
        sys.exit(1)
    return stale


def do_sync(quiet=False):
    stale = diff_pairs()
    for src, dst in stale:
        dst.write_bytes(src.read_bytes())
        print(f"✅ 已同步: {src.relative_to(SOURCE_BASE)} → assets/requirements/{dst.name}")
    if not stale and not quiet:
        print("✅ 全部副本已是最新，无需同步")
    return len(stale)


def do_check():
    stale = diff_pairs()
    if stale:
        print("❌ 以下原型需求副本落后于源文档，请先运行: npm run sync:requirements")
        for src, dst in stale:
            print(f"   - assets/requirements/{dst.name}  ←  {src.relative_to(SOURCE_BASE)}")
        sys.exit(1)
    print("   需求文档副本与源文档一致")


def do_watch(interval):
    print(f"👀 监听源文档变更（每 {interval}s 轮询，Ctrl+C 退出）…")
    do_sync(quiet=True)
    mtimes = {src: src.stat().st_mtime for src, _ in pairs() if src.exists()}
    while True:
        time.sleep(interval)
        for src, dst in pairs():
            if not src.exists():
                continue
            mtime = src.stat().st_mtime
            if mtime != mtimes.get(src):
                mtimes[src] = mtime
                if src.read_bytes() != dst.read_bytes():
                    dst.write_bytes(src.read_bytes())
                    print(f"[{time.strftime('%H:%M:%S')}] ✅ 已同步: {src.name} → {dst.name}")


def main():
    parser = argparse.ArgumentParser(description="同步简易需求源文档到原型 assets/requirements 副本")
    parser.add_argument("--check", action="store_true", help="仅校验一致性，不一致时退出码 1")
    parser.add_argument("--watch", action="store_true", help="监听源文档变更并自动同步")
    parser.add_argument("--interval", type=float, default=2.0, help="watch 轮询间隔秒数（默认 2）")
    args = parser.parse_args()

    if args.check:
        do_check()
    elif args.watch:
        try:
            do_watch(args.interval)
        except KeyboardInterrupt:
            print("\n已停止监听")
    else:
        do_sync()


if __name__ == "__main__":
    main()
