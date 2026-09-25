import {
  createCollectorRun,
  addCollectorCandidate,
  finishCollectorRun,
  getCollectorRun
} from './collector.js';

export async function collectorRoute(request,env,pathname){
  if(request.method==='POST' && pathname==='/api/admin/collector/runs'){
    return createCollectorRun(request,env);
  }

  const run=pathname.match(/^\/api\/admin\/collector\/runs\/([^/]+)$/);
  if(run && request.method==='GET'){
    return getCollectorRun(request,env,run[1]);
  }

  const candidate=pathname.match(/^\/api\/admin\/collector\/runs\/([^/]+)\/candidates$/);
  if(candidate && request.method==='POST'){
    return addCollectorCandidate(request,env,candidate[1]);
  }

  const finish=pathname.match(/^\/api\/admin\/collector\/runs\/([^/]+)\/finish$/);
  if(finish && request.method==='POST'){
    return finishCollectorRun(request,env,finish[1]);
  }

  return null;
}
