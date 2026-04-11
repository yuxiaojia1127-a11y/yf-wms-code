from __future__ import annotations

from collections import Counter, defaultdict
from pathlib import Path
from typing import Dict, List, Tuple

import sys


ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from tools.extract_feature_list import read_sheet_table


def _carry_down(rows: List[Dict[str, str]], keys: List[str]) -> None:
    last = {k: "" for k in keys}
    for r in rows:
        for k in keys:
            v = (r.get(k) or "").strip()
            if v:
                last[k] = v
            else:
                r[k] = last[k]


def summarize_modules(rows: List[Dict[str, str]]) -> Tuple[Counter, Counter]:
    c1 = Counter((r.get("一级菜单") or "").strip() for r in rows)
    c2 = Counter(((r.get("一级菜单") or "").strip(), (r.get("二级菜单") or "").strip()) for r in rows)
    return c1, c2


def group_features(rows: List[Dict[str, str]]) -> Dict[Tuple[str, str], List[Dict[str, str]]]:
    grouped: Dict[Tuple[str, str], List[Dict[str, str]]] = defaultdict(list)
    for r in rows:
        key = ((r.get("一级菜单") or "").strip(), (r.get("二级菜单") or "").strip())
        grouped[key].append(r)
    return grouped


def main() -> None:
    xlsx = Path("需求文档/租车供应商管理系统功能清单.xlsx")
    rows = read_sheet_table(xlsx, "功能清单")
    _carry_down(rows, ["一级菜单", "二级菜单"])

    print(f"rows={len(rows)}")
    c1, c2 = summarize_modules(rows)

    print("\n一级菜单")
    for k, v in c1.most_common():
        if k:
            print(f"- {k}: {v}")

    print("\n二级菜单")
    for (a, b), v in c2.most_common():
        if a or b:
            print(f"- {a} / {b}: {v}")

    grouped = group_features(rows)
    print("\n功能点（按二级菜单）")
    for (a, b) in sorted(grouped.keys()):
        items = grouped[(a, b)]
        if not (a or b):
            continue
        print(f"\n== {a} / {b} ({len(items)}) ==")
        for r in items:
            fp = (r.get("功能点") or "").strip()
            client = (r.get("客户端") or "").strip()
            if fp:
                print(f"- {fp} | {client}")


if __name__ == "__main__":
    main()
