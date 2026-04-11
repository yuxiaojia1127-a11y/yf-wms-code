# Gitee MCP 远程接入说明（公有云）

- 名称：gitee
- URL：https://api.gitee.com/mcp
- Headers：
  - Authorization: Bearer local-dev-token

使用步骤：
- 打开 设置 → MCP → 添加服务 → 远程
- 分别填入上面的名称、URL 和 Header
- 保存后点击“刷新工具列表”，应能看到仓库、Issue、PR 等工具

最小权限建议（PAT Scope）：
- projects、pull_requests、issues、notes

注意：
- 如果后续需要更换 Token，只需在 MCP 服务编辑页替换 Authorization 值即可。
*** End Patch*** }``` zvek라고  </>
