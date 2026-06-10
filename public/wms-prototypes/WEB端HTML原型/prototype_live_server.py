from __future__ import annotations

import argparse
import json
import os
import re
import tempfile
import threading
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent  # wms-prototypes/ 根目录，同时覆盖 WEB 与 APP 两个子目录
WEB_ENTRY = "WMS原型总入口.html"  # ROOT 下的总入口文件

# 需求数据唯一数据源：所有页面统一通过 <script src> 引用该文件，
# 保存接口也只写这个文件，避免多份内嵌数据相互覆盖、漂移。
DATA_FILE = ROOT / "WEB端HTML原型" / "assets" / "wms-requirement-data.js"

# 匹配 window.WMS_REQUIREMENT_DATA = { ... }; 数据块
# ^};$ 匹配顶层闭合行（无缩进的 };），确保精确替换最外层对象
WMS_DATA_PATTERN = re.compile(
    r'(window\.WMS_REQUIREMENT_DATA\s*=\s*)([\s\S]+?)(^};$)',
    re.MULTILINE,
)

# 串行化写入，避免并发保存产生竞态
_WRITE_LOCK = threading.Lock()


class PrototypeLiveHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self) -> None:
        if self.path == "/__health__":
            self._send_json({"ok": True, "root": str(ROOT)})
            return
        if self.path in ("/", ""):
            self.send_response(HTTPStatus.FOUND)
            self.send_header("Location", f"/{WEB_ENTRY}")
            self.end_headers()
            return
        super().do_GET()

    def do_POST(self) -> None:
        if self.path == "/__save_requirement__":
            self._handle_save_requirement()
        else:
            self.send_error(HTTPStatus.NOT_FOUND, "Unknown API")

    def _handle_save_requirement(self) -> None:
        try:
            payload = self._read_json_body()
            data = payload.get("data")
            if not isinstance(data, dict):
                raise ValueError("缺少 data 参数或格式不正确（应为对象）")
            self._write_requirement_data(data)
            self._send_json({"ok": True, "file": DATA_FILE.name})
        except ValueError as exc:
            self._send_json({"ok": False, "message": str(exc)}, status=HTTPStatus.BAD_REQUEST)
        except Exception as exc:  # pragma: no cover - defensive fallback
            self._send_json({"ok": False, "message": f"保存失败：{exc}"}, status=HTTPStatus.INTERNAL_SERVER_ERROR)

    def _read_json_body(self) -> dict:
        content_length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(content_length)
        try:
            return json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError as exc:
            raise ValueError(f"请求体不是有效 JSON：{exc}") from exc

    def _write_requirement_data(self, data: dict) -> None:
        """合并写入共享数据文件：先备份，再临时文件 + 原子替换。

        采用按模块 key 合并而非整体覆盖，降低多页面/多标签页
        同时编辑时"后保存者覆盖先保存者"的丢数据风险。
        """
        with _WRITE_LOCK:
            if not DATA_FILE.exists():
                raise ValueError(f"数据文件不存在：{DATA_FILE}")
            text = DATA_FILE.read_text(encoding="utf-8")
            match = WMS_DATA_PATTERN.search(text)
            if not match:
                raise ValueError("数据文件中未找到 window.WMS_REQUIREMENT_DATA 数据块")

            # 按模块 key 合并：只更新客户端送来的 key，保留文件中其余模块
            current_raw = f"{match.group(2)}{match.group(3)[:-1]}"  # 去掉结尾分号
            try:
                merged = json.loads(current_raw)
            except json.JSONDecodeError:
                merged = {}
            merged.update(data)

            serialized = json.dumps(merged, ensure_ascii=False, indent=2)
            replaced = WMS_DATA_PATTERN.sub(
                lambda m: f"{m.group(1)}{serialized};",
                text,
                count=1,
            )

            # 备份当前版本
            backup_path = DATA_FILE.with_suffix(DATA_FILE.suffix + ".bak")
            backup_path.write_text(text, encoding="utf-8")

            # 临时文件 + 原子替换，避免写入中断留下半截文件
            fd, tmp_name = tempfile.mkstemp(
                dir=str(DATA_FILE.parent), prefix=".wms-data-", suffix=".tmp"
            )
            try:
                with os.fdopen(fd, "w", encoding="utf-8") as tmp:
                    tmp.write(replaced)
                os.replace(tmp_name, DATA_FILE)
            except BaseException:
                if os.path.exists(tmp_name):
                    os.unlink(tmp_name)
                raise

    def _send_json(self, payload: dict, status: HTTPStatus = HTTPStatus.OK) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)


def main() -> None:
    parser = argparse.ArgumentParser(description="Prototype live server with editable requirement persistence")
    parser.add_argument("--port", type=int, default=8091, help="Server port")
    args = parser.parse_args()

    server = ThreadingHTTPServer(("127.0.0.1", args.port), PrototypeLiveHandler)
    print(f"Prototype live server running at http://127.0.0.1:{args.port}/")
    print(f"  总入口: http://127.0.0.1:{args.port}/{WEB_ENTRY}")
    print(f"  WEB端:  http://127.0.0.1:{args.port}/WEB端HTML原型/WMS-WEB端原型.html")
    print(f"  APP端:  http://127.0.0.1:{args.port}/APP端HTML原型/WMS-APP端原型.html")
    print(f"Serving directory: {ROOT}")
    print(f"需求数据文件: {DATA_FILE}")
    server.serve_forever()


if __name__ == "__main__":
    main()
