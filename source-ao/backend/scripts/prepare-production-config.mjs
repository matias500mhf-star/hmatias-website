import {writeFile} from 'node:fs/promises';

const d1=(process.env.SOURCE_AO_PRODUCTION_D1_ID||'').trim();
const release=(process.env.GITHUB_SHA||process.env.SOURCE_AO_RELEASE||'source-ao-v1').trim();
const googleStudioBase=(process.env.SOURCE_AO_GOOGLE_STUDIO_API_BASE||'').trim();
const googleStudioKey=(process.env.SOURCE_AO_GOOGLE_STUDIO_API_KEY||'').trim();

if(!/^[0-9a-f-]{32,40}$/i.test(d1)){
  console.error('SOURCE_AO_PRODUCTION_D1_ID is missing or invalid');
  process.exit(2);
}

if(Boolean(googleStudioBase)!==Boolean(googleStudioKey)){
  console.error('SOURCE_AO_GOOGLE_STUDIO_API_BASE and SOURCE_AO_GOOGLE_STUDIO_API_KEY must be configured together');
  process.exit(2);
}

let googleStudioOrigin='';
if(googleStudioBase){
  try{
    const url=new URL(googleStudioBase);
    const host=url.hostname.toLowerCase();
    if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash||!host.endsWith('.run.app')||/^ais-(dev|pre)-/i.test(host)||/(^|[-.])(dev|development|stage|staging|preview|pre)([-.]|$)/i.test(host)) throw new Error();
    googleStudioOrigin=url.origin;
  }catch{
    console.error('SOURCE_AO_GOOGLE_STUDIO_API_BASE must be a stable HTTPS production Cloud Run origin');
    process.exit(2);
  }
}

const config={
  $schema:'node_modules/wrangler/config-schema.json',
  name:'source-ao-api',
  main:'src/router.js',
  compatibility_date:'2026-09-22',
  triggers:{crons:['*/15 * * * *','17 2 * * *']},
  observability:{logs:{enabled:true,head_sampling_rate:0.1}},
  d1_databases:[{
    binding:'SOURCE_AO_DB',
    database_name:'source-ao',
    database_id:d1,
    migrations_dir:'migrations'
  }],
  vars:{
    PUBLIC_ORIGIN:'https://comercialhmatiasps.com',
    SOURCE_AO_ENV:'production',
    SOURCE_AO_RELEASE:release,
    CONTACT_RETENTION_DAYS:'180',
    WEBSITE_LEAD_INTAKE_ENABLED:'false',
    ...(googleStudioOrigin?{SOURCE_AO_GOOGLE_STUDIO_API_BASE:googleStudioOrigin}:{})
  }
};

await writeFile('wrangler.production.runtime.jsonc',JSON.stringify(config,null,2)+'\n',{mode:0o600});
console.log('Generated protected production config for source-ao-api');
