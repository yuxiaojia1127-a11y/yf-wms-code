import os
import sys
import json
from feishu_client import get_tenant_access_token, create_document

def main():
    if len(sys.argv) < 2:
        print("usage: python tools/feishu_create_doc.py <title> [folder_token]")
        sys.exit(2)
    title = sys.argv[1]
    folder_token = sys.argv[2] if len(sys.argv) > 2 else None
    app_id = os.getenv("FEISHU_APP_ID")
    app_secret = os.getenv("FEISHU_APP_SECRET")
    if not app_id or not app_secret:
        print("missing FEISHU_APP_ID or FEISHU_APP_SECRET in environment")
        sys.exit(3)
    try:
        token, expire = get_tenant_access_token(app_id, app_secret)
        result = create_document(token, title, folder_token)
        print(json.dumps(result, ensure_ascii=False))
        sys.exit(0)
    except Exception as e:
        print(str(e))
        sys.exit(1)

if __name__ == "__main__":
    main()
