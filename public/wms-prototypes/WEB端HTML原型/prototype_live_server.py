from __future__ import annotations

import argparse
import json
import os
import tempfile
import threading
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent  # wms-prototypes/ 根目录，同时覆盖 WEB 与 APP 两个子目录
WEB_ENTRY = "WMS原型总入口.html"  # ROOT 下的总入口文件

# 需求数据唯一数据源（纯 JSON）：所有页面由 wms-content-app.js fetch 加载，
# 保存接口也只写这个文件，避免多份内嵌数据相互覆盖、漂移。
DATA_FILE = ROOT / "WEB端HTML原型" / "assets" / "wms-requirement-data.json"

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
        """合并写入共享 JSON 数据文件：先备份，再临时文件 + 原子替换。

        按模块 key 合并而非整体覆盖，降低多页面/多标签页
        同时编辑时"后保存者覆盖先保存者"的丢数据风险。
        """
        with _WRITE_LOCK:
            if not DATA_FILE.exists():
                raise ValueError(f"数据文件不存在：{DATA_FILE}")
            text = DATA_FILE.read_text(encoding="utf-8")
            try:
                merged = json.loads(text)
            except json.JSONDecodeError as exc:
                raise ValueError(f"数据文件不是有效 JSON，拒绝写入以免破坏：{exc}") from exc
            if not isinstance(merged, dict):
                raise ValueError("数据文件顶层应为对象")
            merged.update(data)

            serialized = json.dumps(merged, ensure_ascii=False, indent=2) + "\n"

            # 备份当前版本
            backup_path = DATA_FILE.with_suffix(DATA_FILE.suffix + ".bak")
            backup_path.write_text(text, encoding="utf-8")

            # 临时文件 + 原子替换，避免写入中断留下半截文件
            fd, tmp_name = tempfile.mkstemp(
                dir=str(DATA_FILE.parent), prefix=".wms-data-", suffix=".tmp"
            )
            try:
                with os.fdopen(fd, "w", encoding="utf-8") as tmp:
                    tmp.write(serialized)
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
