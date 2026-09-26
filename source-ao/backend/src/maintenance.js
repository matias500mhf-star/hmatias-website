const iso=(date=new Date())=>date.toISOString();

export function parseContactRetentionDays(value){
  const days=Number(value);
  if(!Number.isFinite(days)||days<30||days>1095) return null;
  return Math.trunc(days);
}

export function maintenanceCutoffs(now=Date.now(),contactRetentionDays=null){
  const retention=parseContactRetentionDays(contactRetentionDays);
  return {
    now:iso(new Date(now)),
    rateLimitBefore:iso(new Date(now-48*60*60*1000)),
    contactBefore:retention?iso(new Date(now-retention*24*60*60*1000)):null,
    contactRetentionDays:retention
  };
}

export async function runMaintenance(env,now=Date.now()){
  if(!env.SOURCE_AO_DB) throw new Error('SOURCE_AO_DB is required for maintenance');
  const cutoffs=maintenanceCutoffs(now,env.CONTACT_RETENTION_DAYS);
  const statements=[
    env.SOURCE_AO_DB.prepare(`
      UPDATE verification_requests
      SET status='expired',updated_at=?
      WHERE status='sent' AND datetime(expires_at)<=datetime(?)
    `).bind(cutoffs.now,cutoffs.now),
    env.SOURCE_AO_DB.prepare(`
      DELETE FROM rate_limit_windows
      WHERE datetime(updated_at)<datetime(?)
    `).bind(cutoffs.rateLimitBefore),
    env.SOURCE_AO_DB.prepare(`
      UPDATE opportunities
      SET status='expired',updated_at=?
      WHERE status='active' AND datetime(deadline)<=datetime(?)
    `).bind(cutoffs.now,cutoffs.now)
  ];

  if(cutoffs.contactBefore){
    statements.push(env.SOURCE_AO_DB.prepare(`
      UPDATE sourcing_requests
      SET contact_encrypted='PURGED',contact_hint='purged',contact_purged_at=?
      WHERE status IN ('completed','closed')
        AND contact_purged_at IS NULL
        AND datetime(updated_at)<datetime(?)
    `).bind(cutoffs.now,cutoffs.contactBefore));
  }

  const results=await env.SOURCE_AO_DB.batch(statements);
  return {
    ok:true,
    expired_verification_requests:Number(results?.[0]?.meta?.changes||0),
    deleted_rate_limit_windows:Number(results?.[1]?.meta?.changes||0),
    expired_opportunities:Number(results?.[2]?.meta?.changes||0),
    purged_requester_contacts:Number(results?.[3]?.meta?.changes||0),
    contact_retention_days:cutoffs.contactRetentionDays,
    completed_at:cutoffs.now
  };
}
