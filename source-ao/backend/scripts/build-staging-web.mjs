import {cp,copyFile,mkdir,readFile,rm,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const sourceRoot=fileURLToPath(new URL('../../',import.meta.url));
const backendRoot=fileURLToPath(new URL('../',import.meta.url));
const out=path.join(backendRoot,'.staging-web');
const apiBase=(process.env.SOURCE_AO_API_BASE||'').replace(/\/$/,'');
const publicOrigin=(process.env.SOURCE_AO_STAGING_PUBLIC_ORIGIN||'').replace(/\/$/,'');

for(const [name,value] of [['SOURCE_AO_API_BASE',apiBase],['SOURCE_AO_STAGING_PUBLIC_ORIGIN',publicOrigin]]){
  let parsed;
  try{parsed=new URL(value);}catch{throw new Error(`${name} must be a valid URL`);}
  if(parsed.protocol!=='https:') throw new Error(`${name} must use HTTPS`);
}

const publicFiles=[
  'index.html','favicon.svg','sourceao.css','sourceao.js','data-engine.js','api-client.js','verified-results.css','verified-results.js',
  'sourcing-ui.css','sourcing-ui.js',
  'track.html','track.css','track.js',
  'confirm.html','confirm.css','confirm.js',
  'opportunity-radar.html','opportunity-radar.css','opportunity-radar.js',
  'privacy.html','terms.html','legal.css'
];

await rm(out,{recursive:true,force:true});
await mkdir(out,{recursive:true});
for(const file of publicFiles){
  await copyFile(path.join(sourceRoot,file),path.join(out,file));
}

for(const file of publicFiles.filter(file=>file.endsWith('.html'))){
  const target=path.join(out,file);
  let html=await readFile(target,'utf8');
  const noindex='<meta name="robots" content="noindex,nofollow,noarchive">';
  if(/<meta\s+name=["']robots["'][^>]*>/i.test(html)){
    html=html.replace(/<meta\s+name=["']robots["'][^>]*>/i,noindex);
  }else{
    html=html.replace(/(<meta\s+name=["']viewport["'][^>]*>)/i,`$1\n  ${noindex}`);
  }
  await writeFile(target,html,{mode:0o644});
}
await cp(path.join(sourceRoot,'data'),path.join(out,'data'),{recursive:true});

const runtime=`(()=>{\n  'use strict';\n  window.SOURCE_AO_RUNTIME=Object.freeze({\n    environment:'staging',\n    apiBase:${JSON.stringify(apiBase)}\n  });\n})();\n`;
await writeFile(path.join(out,'runtime-config.js'),runtime,{mode:0o644});
await writeFile(path.join(out,'robots.txt'),'User-agent: *\nDisallow: /\n',{mode:0o644});

const config={
  $schema:'node_modules/wrangler/config-schema.json',
  name:'source-ao-web-staging',
  compatibility_date:'2026-09-23',
  assets:{directory:'./.staging-web'}
};
await writeFile(path.join(backendRoot,'wrangler.web.staging.runtime.jsonc'),JSON.stringify(config,null,2)+'\n',{mode:0o600});

console.log(JSON.stringify({
  ok:true,
  environment:'staging',
  public_origin:publicOrigin,
  api_base:apiBase,
  public_files:publicFiles.length,
  data_directory:true,
  internal_desks_bundled:false,
  backend_bundled:false,
  docs_bundled:false
},null,2));
