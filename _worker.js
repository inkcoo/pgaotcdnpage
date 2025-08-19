export default {
    /**
     * Cloudflare Pages Functions 入口
     * - 通过 Service Binding 直连你账号内的 Worker 服务（绑定名：PGAOTCDN）
     * - 将请求 URL 的主机名重写为上游 Worker 期望的 workers.dev 主机
     * - 透传方法/头/体，重写上游跳转 Location 到当前域
     */
    async fetch(incomingRequest, env, ctx) {
        const incomingUrl = new URL(incomingRequest.url);

        // 将请求 URL 改写为上游 Worker 的域名（若你的上游按 Host 做路由，这一步很关键）
        const upstreamUrl = new URL(incomingRequest.url);
        upstreamUrl.protocol = 'https:';
        upstreamUrl.hostname = 'pgaotcdn.ixiaocang.workers.dev';

        // 构造上游请求，尽量保持与原始请求一致
        const upstreamRequest = new Request(upstreamUrl.toString(), incomingRequest);

        // 通过 Service Binding 直连调用（需在 Pages 项目设置中绑定 name=PGAOTCDN → 选择你的 Worker 服务）
        const upstreamResponse = await env.PGAOTCDN.fetch(upstreamRequest);

        // 处理上游返回头：
        // - 将任何指向 workers.dev 的跳转改写回当前域，避免浏览器跳出到不可达域
        const responseHeaders = new Headers(upstreamResponse.headers);
        const locationHeader = responseHeaders.get('location');
        if (locationHeader && locationHeader.includes('pgaotcdn.ixiaocang.workers.dev')) {
            responseHeaders.set(
                'location',
                locationHeader.replace('pgaotcdn.ixiaocang.workers.dev', incomingUrl.host)
            );
        }

        // 可按需设置缓存策略：仅对 GET 生效，这里保守不过度缓存
        // 你可以根据站点特点开启：cf: { cacheEverything: true, cacheTtl: 300 }

        return new Response(upstreamResponse.body, {
            status: upstreamResponse.status,
            statusText: upstreamResponse.statusText,
            headers: responseHeaders
        });
    }
};

