import {
  createCollectorRun,
  addCollectorCandidate,
  finishCollectorRun,
  getCollectorRun
} from './collector.js';
import {discoverCollectorRun,getDiscoveryStatusResponse} from './collector-discovery.js';

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


  const discover=pathname.match(/^\/api\/admin\/collector\/runs\/([^/]+)\/discover$/);
  if(discover && request.method==='POST'){
    return discoverCollectorRun(request,env,discover[1]);
  }

  const discovery=pathname.match(/^\/api\/admin\/collector\/runs\/([^/]+)\/discovery$/);
  if(discovery && request.method==='GET'){
    return getDiscoveryStatusResponse(request,env,discovery[1]);
  }

  const finish=pathname.match(/^\/api\/admin\/collector\/runs\/([^/]+)\/finish$/);
  if(finish && request.method==='POST'){
    return finishCollectorRun(request,env,finish[1]);
  }

  return null;
}
