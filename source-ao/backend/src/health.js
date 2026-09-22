const REQUIRED_SECURITY_KEYS=['ADMIN_API_TOKEN','CONFIRMATION_SECRET','PII_ENCRYPTION_KEY','RATE_LIMIT_SECRET'];

export function missingReadinessConfig(env={}){
  const missing=[];
  if(!env.SOURCE_AO_DB) missing.push('SOURCE_AO_DB');
  for(const key of REQUIRED_SECURITY_KEYS){
    if(typeof env[key]!=='string'||env[key].trim().length<16) missing.push(key);
  }
  if(typeof env.PUBLIC_ORIGIN!=='string'||!env.PUBLIC_ORIGIN.startsWith('https://')) missing.push('PUBLIC_ORIGIN');
  return missing;
}

function headers(env){
  return {
    'content-type':'application/json; charset=utf-8',
    'cache-control':'no-store',
    'access-control-allow-origin':env.PUBLIC_ORIGIN||'https://comercialhmatiasps.com'
  };
}

export async function readinessResponse(env){
  const missing=missingReadinessConfig(env);
  if(missing.length){
    return new Response(JSON.stringify({ok:false,ready:false,checks:{configuration:false,database:false},missing}),{status:503,headers:headers(env)});
  }

  try{
    const db=await env.SOURCE_AO_DB.prepare('SELECT 1 AS ok').first();
    const rateTable=await env.SOURCE_AO_DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='rate_limit_windows'").first();
    const ready=Number(db?.ok)===1&&rateTable?.name==='rate_limit_windows';
    return new Response(JSON.stringify({
      ok:ready,
      ready,
      service:'source-ao-api',
      environment:env.SOURCE_AO_ENV||'unknown',
      release:env.SOURCE_AO_RELEASE||null,
      checks:{configuration:true,database:Number(db?.ok)===1,rate_limits:rateTable?.name==='rate_limit_windows'}
    }),{status:ready?200:503,headers:headers(env)});
  }catch{
    return new Response(JSON.stringify({ok:false,ready:false,service:'source-ao-api',checks:{configuration:true,database:false,rate_limits:false}}),{status:503,headers:headers(env)});
  }
}
