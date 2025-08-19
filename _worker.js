// 主入口函数
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // 健康检查端点
    if (url.pathname === '/health') {
      return new Response('OK', {status: 200});
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
      // 通过服务绑定调用Worker
      const origin = env.pgaotcdn;
      if (!origin || typeof origin.fetch !== 'function') {
        return new Response('服务绑定未配置：请在 Pages → Settings → Functions → Service bindings 中添加绑定名 pgaotcdn 指向 Worker pgaotcdn', {status: 500});
      }
      const response = await origin.fetch(modifiedReq);
      return modifyResponse(response);
    } catch (error) {
      return new Response('服务连接异常', {status: 502});
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
