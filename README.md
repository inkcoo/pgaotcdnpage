# Cloudflare Pages + Service Binding 直连 Worker 项目

本项目通过 Pages Functions 将请求直连（Service Binding）到你的 Worker：`pgaotcdn.ixiaocang.workers.dev`，对外以 Pages 域名或自定义域名提供访问。

## 快速开始（通过 GitHub 部署）
1. 推送到 GitHub（在该目录下执行）：
```bash
git init
git add .
git commit -m "init: pages functions + service binding"
git branch -M main
git remote add origin <你的仓库URL>
git push -u origin main
```
2. 在 Cloudflare Dashboard → Pages → Create a project → Connect to Git，选择此仓库。
3. 构建配置：
   - Framework preset：None
   - Build command：空
   - Output directory：根目录（空即可）
   - 自动识别 `_worker.js` 为 Functions-only 项目
4. 部署完成后，进入 Pages 项目 → Settings → Functions → Service bindings：
   - Add binding：
     - Binding name：`pgaotcdn`
     - Service：选择你的 Worker（`pgaotcdn`）
     - Environment：production
   - 保存后如未自动重建，点击“Retry deployment”。
5. 通过 Pages 默认域名或绑定自定义域名访问。

## 说明
- `_worker.js` 会：
  - 将请求的主机名改写到 `pgaotcdn.ixiaocang.workers.dev` 并通过 `env.PGAOTCDN.fetch(...)` 直连上游 Worker。
  - 将上游返回的 `Location` 中的 `workers.dev` 主机改写回当前域，避免跳转不可达。
- 如需开启缓存（仅 GET），可在 `_worker.js` 中对 `fetch` 添加 `cf.cacheEverything` 与 `cacheTtl` 参数。
- 请仅反代你拥有/控制的站点，遵守 Cloudflare 服务条款与当地法律法规。

## 本地预览（可选）
- 需要安装 Wrangler：`npm i -g wrangler`
- 预览运行：`wrangler pages dev .`
- 正式部署（若不用 GitHub 流程）：`wrangler pages deploy .`