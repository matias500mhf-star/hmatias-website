import {writeFile} from 'node:fs/promises';

const d1=(process.env.SOURCE_AO_STAGING_D1_ID||'').trim();
const origin=(process.env.SOURCE_AO_STAGING_PUBLIC_ORIGIN||'').trim();

if(!/^[0-9a-f-]{32,40}$/i.test(d1)){
  console.error('SOURCE_AO_STAGING_D1_ID is missing or invalid');
  process.exit(2);
}

let parsedOrigin;
try{parsedOrigin=new URL(origin);}catch{
  console.error('SOURCE_AO_STAGING_PUBLIC_ORIGIN must be a valid URL');
  process.exit(2);
}
if(parsedOrigin.protocol!=='https:'){
  console.error('SOURCE_AO_STAGING_PUBLIC_ORIGIN must use HTTPS');
  process.exit(2);
}

const config={
  $schema:'node_modules/wrangler/config-schema.json',
  name:'source-ao-api-staging',
  main:'src/router.js',
  compatibility_date:'2026-09-22',
  d1_databases:[{
    binding:'SOURCE_AO_DB',
    database_name:'source-ao-staging',
    database_id:d1,
    migrations_dir:'migrations'
  }],
  vars:{
    PUBLIC_ORIGIN:origin,
    SOURCE_AO_ENV:'staging',
    SOURCE_AO_RELEASE:process.env.GITHUB_SHA||'source-ao-v1'
  }
};

await writeFile('wrangler.staging.runtime.jsonc',JSON.stringify(config,null,2)+'\n',{mode:0o600});
console.log('Generated protected staging config for source-ao-api-staging');
