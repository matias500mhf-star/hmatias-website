const enc = new TextEncoder();

export function rateLimitPolicy(request, pathname='') {
  if (request.method === 'OPTIONS' || pathname === '/health') return null;

  if (request.method === 'POST' && pathname === '/api/sourcing-requests') {
    return {bucket:'sourcing-create', limit:6, windowSeconds:600};
  }
  if (/^\/api\/confirm\/[^/]+$/.test(pathname)) {
    return request.method === 'POST'
      ? {bucket:'supplier-confirm-submit', limit:12, windowSeconds:600}
      : {bucket:'supplier-confirm-view', limit:30, windowSeconds:600};
  }
  if (request.method === 'GET' && pathname === '/api/search') {
    return {bucket:'public-search', limit:90, windowSeconds:60};
  }
  if (request.method === 'GET' && pathname === '/api/opportunities') {
    return {bucket:'public-opportunities', limit:60, windowSeconds:60};
  }
  if (request.method === 'GET' && /^\/api\/sourcing-requests\/[^/]+$/.test(pathname)) {
    return {bucket:'private-tracking', limit:45, windowSeconds:600};
  }
  if (pathname.startsWith('/api/admin/')) {
    return {bucket:'admin-api', limit:180, windowSeconds:60};
  }
  return {bucket:'api-default', limit:120, windowSeconds:60};
}

export function clientAddress(request) {
  const cf = (request.headers.get('cf-connecting-ip') || '').trim();
  if (cf) return cf;
  const forwarded = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
  return forwarded || 'unknown';
}

export async function hashClientKey(secret, value) {
  if (!secret || !value) throw new Error('Missing rate-limit secret or client identity');
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), {name:'HMAC', hash:'SHA-256'}, false, ['sign']);
  const digest = await crypto.subtle.sign('HMAC', key, enc.encode(value));
  return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
}

function json429(policy, retryAfter, requestId) {
  return new Response(JSON.stringify({
    ok:false,
    error:{code:'rate_limited',message:'Too many requests. Please try again shortly.'}
  }),{
    status:429,
    headers:{
      'content-type':'application/json; charset=utf-8',
      'cache-control':'no-store',
      'retry-after':String(retryAfter),
      'x-ratelimit-limit':String(policy.limit),
      'x-request-id':requestId
    }
  });
}

export async function enforceRateLimit(request, env, pathname, requestId) {
  const policy = rateLimitPolicy(request, pathname);
  if (!policy) return null;

  if (!env.SOURCE_AO_DB || !env.RATE_LIMIT_SECRET) {
    if (env.SOURCE_AO_ENV === 'production' || env.SOURCE_AO_ENV === 'staging') {
      return new Response(JSON.stringify({ok:false,error:{code:'security_not_configured',message:'Service security configuration is incomplete.'}}),{
        status:503,
        headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-request-id':requestId}
      });
    }
    return null;
  }

  const nowSeconds = Math.floor(Date.now()/1000);
  const windowStart = Math.floor(nowSeconds/policy.windowSeconds)*policy.windowSeconds;
  const retryAfter = Math.max(1, windowStart + policy.windowSeconds - nowSeconds);
  const clientHash = await hashClientKey(env.RATE_LIMIT_SECRET, clientAddress(request));

  const row = await env.SOURCE_AO_DB.prepare(`
    INSERT INTO rate_limit_windows(bucket,client_hash,window_start,count,updated_at)
    VALUES(?,?,?,?,CURRENT_TIMESTAMP)
    ON CONFLICT(bucket,client_hash,window_start)
    DO UPDATE SET count=count+1,updated_at=CURRENT_TIMESTAMP
    RETURNING count
  `).bind(policy.bucket,clientHash,windowStart,1).first();

  const count = Number(row?.count || 1);
  if (count > policy.limit) return json429(policy,retryAfter,requestId);
  return {policy,count,retryAfter};
}

export function hardenResponse(response, requestId, rateMeta=null) {
  const headers = new Headers(response.headers);
  headers.set('x-content-type-options','nosniff');
  headers.set('referrer-policy','no-referrer');
  headers.set('permissions-policy','camera=(), microphone=(), geolocation=()');
  headers.set('x-frame-options','DENY');
  headers.set('x-request-id',requestId);
  headers.set('vary','Origin');
  if (rateMeta?.policy) {
    headers.set('x-ratelimit-limit',String(rateMeta.policy.limit));
    headers.set('x-ratelimit-remaining',String(Math.max(0,rateMeta.policy.limit-rateMeta.count)));
    headers.set('x-ratelimit-reset',String(rateMeta.retryAfter));
  }
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}

export function safeRequestLog({requestId,method,pathname,status,durationMs,env}) {
  return JSON.stringify({
    type:'source_ao_request',
    request_id:requestId,
    method,
    route:pathname,
    status,
    duration_ms:durationMs,
    environment:env?.SOURCE_AO_ENV || 'unknown',
    release:env?.SOURCE_AO_RELEASE || null
  });
}
