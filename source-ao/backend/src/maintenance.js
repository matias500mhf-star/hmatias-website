const iso=(date=new Date())=>date.toISOString();

export function maintenanceCutoffs(now=Date.now()){
  return {
    now:iso(new Date(now)),
    rateLimitBefore:iso(new Date(now-48*60*60*1000))
  };
}

export async function runMaintenance(env,now=Date.now()){
  if(!env.SOURCE_AO_DB) throw new Error('SOURCE_AO_DB is required for maintenance');
  const cutoffs=maintenanceCutoffs(now);
  const results=await env.SOURCE_AO_DB.batch([
    env.SOURCE_AO_DB.prepare(`
      UPDATE verification_requests
      SET status='expired',updated_at=?
      WHERE status='sent' AND expires_at<=?
    `).bind(cutoffs.now,cutoffs.now),
    env.SOURCE_AO_DB.prepare(`
      DELETE FROM rate_limit_windows
      WHERE updated_at<?
    `).bind(cutoffs.rateLimitBefore)
  ]);

  return {
    ok:true,
    expired_verification_requests:Number(results?.[0]?.meta?.changes||0),
    deleted_rate_limit_windows:Number(results?.[1]?.meta?.changes||0),
    completed_at:cutoffs.now
  };
}
