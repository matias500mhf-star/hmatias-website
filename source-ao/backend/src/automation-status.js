const iso=value=>new Date(value).toISOString();

function parseTime(value){
  if(!value)return null;
  const parsed=Date.parse(value);
  return Number.isFinite(parsed)?parsed:null;
}

export function summarizeAutomationSources(rows=[],now=Date.now()){
  const active=Array.isArray(rows)?rows:[];
  const checked=active.map(row=>parseTime(row.last_checked_at)).filter(Number.isFinite);
  const successful=active.map(row=>parseTime(row.last_success_at)).filter(Number.isFinite);
  let overdue=0;
  let failed=0;

  for(const row of active){
    const lastChecked=parseTime(row.last_checked_at);
    const interval=Math.max(15,Math.min(1440,Number(row.scan_interval_minutes)||60));
    const graceMs=(interval*3+30)*60_000;
    if(lastChecked===null||now-lastChecked>graceMs)overdue++;
    if(row.last_error)failed++;
  }

  return {
    active_sources:active.length,
    overdue_sources:overdue,
    sources_with_last_error:failed,
    last_checked_at:checked.length?new Date(Math.max(...checked)).toISOString():null,
    last_success_at:successful.length?new Date(Math.max(...successful)).toISOString():null,
    status:active.length===0?'not_configured':overdue>0||failed>0?'attention':'operational'
  };
}

const headers=env=>({
  'content-type':'application/json; charset=utf-8',
  'cache-control':'no-store',
  'access-control-allow-origin':env.PUBLIC_ORIGIN||'https://comercialhmatiasps.com'
});

export async function automationStatusResponse(env,now=Date.now()){
  if(!env?.SOURCE_AO_DB){
    return new Response(JSON.stringify({ok:false,status:'unavailable'}),{status:503,headers:headers(env||{})});
  }

  try{
    const [sources,opportunities]=await Promise.all([
      env.SOURCE_AO_DB.prepare(`
        SELECT scan_interval_minutes,last_checked_at,last_success_at,last_error
        FROM opportunity_sources
        WHERE active=1 AND country_code='AO'
      `).all(),
      env.SOURCE_AO_DB.prepare(`
        SELECT COUNT(*) AS active_angola,MAX(source_checked_at) AS last_source_checked_at
        FROM opportunities
        WHERE status='active' AND country_code='AO' AND deadline>?
      `).bind(iso(now)).first()
    ]);

    const sourceSummary=summarizeAutomationSources(sources.results||[],now);
    return new Response(JSON.stringify({
      ok:true,
      service:'source-ao-automation',
      status:sourceSummary.status,
      checked_at:iso(now),
      schedule:{
        opportunity_scan_minutes:15,
        radar_refresh_minutes:5,
        daily_maintenance_utc:'02:17'
      },
      sources:sourceSummary,
      public_opportunities:{
        active_angola:Number(opportunities?.active_angola||0),
        last_source_checked_at:opportunities?.last_source_checked_at||null
      }
    }),{status:200,headers:headers(env)});
  }catch{
    return new Response(JSON.stringify({ok:false,status:'unavailable'}),{status:503,headers:headers(env)});
  }
}
