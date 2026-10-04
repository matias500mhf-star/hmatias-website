import {copyFile,mkdir} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';

export const PUBLIC_DATA_FILES=Object.freeze(['catalog.json','opportunities.json','source-registry.json']);
const dataRoot=fileURLToPath(new URL('../../data/',import.meta.url));

export async function copyPublicData(destination){
  await mkdir(destination,{recursive:true});
  for(const name of PUBLIC_DATA_FILES) await copyFile(path.join(dataRoot,name),path.join(destination,name));
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  if(!process.argv[2]) throw new Error('Public data destination is required');
  await copyPublicData(path.resolve(process.argv[2]));
}
