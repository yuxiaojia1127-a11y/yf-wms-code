from __future__ import annotations

import argparse
import json
import re
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent  # wms-prototypes/ 根目录，同时覆盖 WEB 与 APP 两个子目录
WEB_ENTRY = "WMS原型总入口.html"  # ROOT 下的总入口文件

# 匹配 <script id="requirementData" type="application/json"> 格式（旧格式，向后兼容）
REQUIREMENT_SCRIPT_PATTERN = re.compile(
    r'(<script id="requirementData" type="application/json">\s*)([\s\S]*?)(\s*</script>)'
)

# 匹配 window.WMS_REQUIREMENT_DATA = { ... }; 格式（当前页面使用的格式）
# ^};$ 匹配顶层闭合行（无缩进的 };），确保精确替换最外层对象
WMS_DATA_PATTERN = re.compile(
    r'(window\.WMS_REQUIREMENT_DATA\s*=\s*)([\s\S]+?)(^};$)',
    re.MULTILINE,
)


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
        elif self.path == "/__sync_requirement_docs__":
            self._handle_sync_requirement_docs()
        else:
            self.send_error(HTTPStatus.NOT_FOUND, "Unknown API")

    def _handle_save_requirement(self) -> None:
        try:
            payload = self._read_json_body()
            file_name = payload.get("file", "")
            data = payload.get("data")
            target_path = self._resolve_html_path(file_name)
            self._write_requirement_data(target_path, data)
            self._send_json({"ok": True, "file": target_path.name})
        except ValueError as exc:
            self._send_json({"ok": False, "message": str(exc)}, status=HTTPStatus.BAD_REQUEST)
        except Exception as exc:  # pragma: no cover - defensive fallback
            self._send_json({"ok": False, "message": f"保存失败：{exc}"}, status=HTTPStatus.INTERNAL_SERVER_ERROR)

    def _handle_sync_requirement_docs(self) -> None:
        """
        同步外部需求文档到页面 HTML 文件。
        客户端在重新加载外部 MD 文档前调用此接口，确保服务端与最新文件同步。
        当前实现返回 ok 即可（客户端会随后自行 fetch 外部 MD 文件）。
        """
        self._send_json({"ok": True, "message": "sync acknowledged"})

    def log_message(self, format: str, *args) -> None:
        super().log_message(format, *args)

    def _read_json_body(self) -> dict:
        content_length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(content_length)
        try:
            return json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError as exc:
            raise ValueError(f"请求体不是有效 JSON：{exc}") from exc

    def _resolve_html_path(self, file_name: str) -> Path:
        if not file_name:
            raise ValueError("缺少 file 参数")
        candidate = (ROOT / file_name).resolve()
        if ROOT not in candidate.parents and candidate != ROOT:
            raise ValueError("不允许访问当前目录之外的文件")
        if candidate.suffix.lower() != ".html":
            raise ValueError("仅允许保存到 HTML 原型文件")
        if not candidate.exists():
            raise ValueError(f"目标文件不存在：{file_name}")
        return candidate

    def _write_requirement_data(self, target_path: Path, data: object) -> None:
        html = target_path.read_text(encoding="utf-8")
        serialized = json.dumps(data, ensure_ascii=False, indent=2)

        # 优先尝试旧格式 <script id="requirementData" type="application/json">
        if REQUIREMENT_SCRIPT_PATTERN.search(html):
            replaced = REQUIREMENT_SCRIPT_PATTERN.sub(
                lambda m: f"{m.group(1)}{serialized}{m.group(3)}",
                html,
                count=1,
            )
        # 再尝试当前页面使用的 window.WMS_REQUIREMENT_DATA = {...}; 格式
        elif WMS_DATA_PATTERN.search(html):
            replaced = WMS_DATA_PATTERN.sub(
                lambda m: f"{m.group(1)}{serialized};",
                html,
                count=1,
            )
        else:
            raise ValueError("原型文件中未找到 requirementData 数据块（支持 <script id='requirementData'> 和 window.WMS_REQUIREMENT_DATA 两种格式）")

        target_path.write_text(replaced, encoding="utf-8")

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
    server.serve_forever()


if __name__ == "__main__":
    main()
