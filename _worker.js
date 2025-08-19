// 主入口函数
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 健康检查端点
    if (url.pathname === '/health') {
      return new Response('OK', { status: 200 });
    }

    // 构建新的请求对象
    const modifiedReq = new Request(url, {
      method: request.method,
      headers: new Headers(request.headers),
      body: request.body,
      redirect: 'manual'
    });

    // 设置必要的请求头
    modifiedReq.headers.set('X-Forwarded-Host', request.headers.get('Host'));
    modifiedReq.headers.set('X-Forwarded-For', request.headers.get('CF-Connecting-IP'));
    modifiedReq.headers.set('X-Forwarded-Proto', 'https');
    modifiedReq.headers.delete('CF-RAY');
    modifiedReq.headers.delete('CF-IPCountry');

    try {
      // 优先使用 Service Binding（兼容两种命名）
      const boundService = env.ORIGIN_WORKER || env.pgaotcdn;
      if (boundService && typeof boundService.fetch === 'function') {
        const response = await boundService.fetch(modifiedReq);
        return modifyResponse(response);
      }

      // 未配置 Service Binding 时，回退到直连上游域名（需在环境变量配置 UPSTREAM_URL）
      if (env.UPSTREAM_URL) {
        const upstream = new URL(url.pathname + url.search, 'https://' + env.UPSTREAM_URL.replace(/^https?:\/\//, ''));
        const directReq = new Request(upstream, {
          method: request.method,
          headers: new Headers(modifiedReq.headers),
          body: request.body,
          redirect: 'manual'
        });
        const response = await fetch(directReq);
        return modifyResponse(response);
      }

      throw new Error('Missing service binding and UPSTREAM_URL');
    } catch (error) {
      return new Response('服务连接异常', { status: 502 });
    }
  }
}

// 修改响应头避免冲突
function modifyResponse(response) {
  const newHeaders = new Headers(response.headers);
  newHeaders.delete('CF-RAY');
  newHeaders.delete('CF-Cache-Status');
  newHeaders.delete('CF-EW-Via');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}
