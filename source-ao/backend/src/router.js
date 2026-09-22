import core from './index.js';
import {
  createSourcingRequest,
  getSourcingRequest,
  listSourcingRequests,
  updateSourcingRequestStatus,
  demandRadar
} from './sourcing.js';
import {enforceRateLimit,hardenResponse,safeRequestLog} from './security.js';

function securityFailure(env,requestId){
  return new Response(JSON.stringify({
    ok:false,
    error:{code:'security_unavailable',message:'Security controls are temporarily unavailable.'}
  }),{
    status:503,
    headers:{
      'content-type':'application/json; charset=utf-8',
      'cache-control':'no-store',
      'access-control-allow-origin':env.PUBLIC_ORIGIN||'https://comercialhmatiasps.com',
      'x-request-id':requestId
    }
  });
}

export default {
  async fetch(request,env){
    const started=Date.now();
    const url=new URL(request.url);
    const requestId=crypto.randomUUID();
    let rateMeta=null;
    let response;

    try{
      const rateResult=await enforceRateLimit(request,env,url.pathname,requestId);
      if(rateResult instanceof Response){
        response=rateResult;
      }else{
        rateMeta=rateResult;

        if(request.method==='POST' && url.pathname==='/api/sourcing-requests'){
          response=await createSourcingRequest(request,env);
        }else{
          const publicRequest=url.pathname.match(/^\/api\/sourcing-requests\/([^/]+)$/);
          if(publicRequest && request.method==='GET'){
            response=await getSourcingRequest(request,env,publicRequest[1]);
          }else if(url.pathname==='/api/admin/sourcing-requests' && request.method==='GET'){
            response=await listSourcingRequests(request,env);
          }else{
            const adminStatus=url.pathname.match(/^\/api\/admin\/sourcing-requests\/([^/]+)\/status$/);
            if(adminStatus && request.method==='POST'){
              response=await updateSourcingRequestStatus(request,env,adminStatus[1]);
            }else if(url.pathname==='/api/admin/demand-radar' && request.method==='GET'){
              response=await demandRadar(request,env);
            }else{
              response=await core.fetch(request,env);
            }
          }
        }
      }
    }catch(error){
      console.error(JSON.stringify({
        type:'source_ao_security_error',
        request_id:requestId,
        method:request.method,
        route:url.pathname,
        message:error instanceof Error?error.message:'unknown_error'
      }));
      response=securityFailure(env,requestId);
    }

    const hardened=hardenResponse(response,requestId,rateMeta);
    console.log(safeRequestLog({
      requestId,
      method:request.method,
      pathname:url.pathname,
      status:hardened.status,
      durationMs:Date.now()-started,
      env
    }));
    return hardened;
  }
};
