from __future__ import annotations

import argparse
import json
import re
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


ROOT = Path(__file__).resolve().parent
REQUIREMENT_SCRIPT_PATTERN = re.compile(
    r'(<script id="requirementData" type="application/json">\s*)([\s\S]*?)(\s*</script>)'
)


class PrototypeLiveHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self) -> None:
        if self.path == "/__health__":
            self._send_json({"ok": True, "root": str(ROOT)})
            return
        super().do_GET()

    def do_POST(self) -> None:
        if self.path != "/__save_requirement__":
            self.send_error(HTTPStatus.NOT_FOUND, "Unknown API")
            return

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
        if not REQUIREMENT_SCRIPT_PATTERN.search(html):
            raise ValueError("原型文件中未找到 requirementData 数据块")
        serialized = json.dumps(data, ensure_ascii=False, indent=2)
        replaced = REQUIREMENT_SCRIPT_PATTERN.sub(
            lambda match: f"{match.group(1)}{serialized}{match.group(3)}",
            html,
            count=1
        )
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
    print(f"Serving directory: {ROOT}")
    server.serve_forever()


if __name__ == "__main__":
    main()
