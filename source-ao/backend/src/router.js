import core from './index.js';
import {
  createSourcingRequest,
  getSourcingRequest,
  listSourcingRequests,
  updateSourcingRequestStatus,
  demandRadar
} from './sourcing.js';

export default {
  async fetch(request,env){
    const url=new URL(request.url);

    if(request.method==='POST' && url.pathname==='/api/sourcing-requests'){
      return createSourcingRequest(request,env);
    }

    const publicRequest=url.pathname.match(/^\/api\/sourcing-requests\/([^/]+)$/);
    if(publicRequest && request.method==='GET'){
      return getSourcingRequest(request,env,publicRequest[1]);
    }

    if(url.pathname==='/api/admin/sourcing-requests' && request.method==='GET'){
      return listSourcingRequests(request,env);
    }

    const adminStatus=url.pathname.match(/^\/api\/admin\/sourcing-requests\/([^/]+)\/status$/);
    if(adminStatus && request.method==='POST'){
      return updateSourcingRequestStatus(request,env,adminStatus[1]);
    }

    if(url.pathname==='/api/admin/demand-radar' && request.method==='GET'){
      return demandRadar(request,env);
    }

    return core.fetch(request,env);
  }
};
