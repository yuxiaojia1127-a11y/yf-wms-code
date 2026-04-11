import json
import urllib.request
import urllib.error

AUTH_URL = "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal"
DOCX_CREATE_URL = "https://open.feishu.cn/open-apis/docx/v1/documents"

def _post_json(url, payload, headers=None, timeout=20):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers or {}, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        body = resp.read()
        return resp.getcode(), resp.getheaders(), body

def get_tenant_access_token(app_id, app_secret):
    payload = {"app_id": app_id, "app_secret": app_secret}
    code, headers, body = _post_json(AUTH_URL, payload, {"Content-Type": "application/json"})
    text = body.decode("utf-8")
    obj = json.loads(text)
    if "tenant_access_token" in obj:
        return obj["tenant_access_token"], obj.get("expire")
    if "code" in obj and obj.get("code") != 0:
        raise RuntimeError("feishu auth error: " + json.dumps(obj, ensure_ascii=False))
    raise RuntimeError("unexpected feishu auth response: " + text)

def create_document(tenant_access_token, title, folder_token=None):
    headers = {
        "Authorization": "Bearer " + tenant_access_token,
        "Content-Type": "application/json",
    }
    payload = {"title": title}
    if folder_token:
        payload["folder_token"] = folder_token
    code, resp_headers, body = _post_json(DOCX_CREATE_URL, payload, headers)
    text = body.decode("utf-8")
    obj = json.loads(text)
    if "code" in obj and obj.get("code") != 0:
        raise RuntimeError("feishu docx create error: " + json.dumps(obj, ensure_ascii=False))
    return obj
