export default {
    async fetch(request, env, ctx) {
        // 将请求直连转发到已绑定的 Worker（见步骤 3 中的 Service Binding）
        // 如果你的 Worker 依赖 Host/绝对 URL，可将 URL 主机名改为 workers.dev
        const inUrl = new URL(request.url);
        const fwdUrl = new URL(request.url);
        fwdUrl.protocol = 'https:';
        fwdUrl.hostname = 'pgaotcdn.ixiaocang.workers.dev';

        // 透传方法/头/体；如需增强缓存，可在下方按需设置 cf 参数
        const upstreamReq = new Request(fwdUrl.toString(), request);

        const resp = await env.PGAOTCDN.fetch(upstreamReq);
        // 如需处理 301/302 回源到 workers.dev 的跳转，可在此重写 Location
        const headers = new Headers(resp.headers);
        const loc = headers.get('location');
        if (loc && loc.includes('pgaotcdn.ixiaocang.workers.dev')) {
            headers.set('location', loc.replace('pgaotcdn.ixiaocang.workers.dev', inUrl.host));
        }
        return new Response(resp.body, { status: resp.status, headers });
    }
}