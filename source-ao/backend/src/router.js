import core,{isAdmin} from './index.js';
import {
  createSourcingRequest,
  getSourcingRequest,
  listSourcingRequests,
  updateSourcingRequestStatus,
  demandRadar
} from './sourcing.js';
import {enforceRateLimit,hardenResponse,safeRequestLog} from './security.js';
import {readinessResponse} from './health.js';
import {runMaintenance} from './maintenance.js';
import {publicSearch} from './public-search.js';
import {smartSearchPlan} from './smart-search.js';
import {procurementMission} from './procurement-mission.js';
import {collectorRoute} from './collector-route.js';
import {processPendingDiscoveryJobs} from './collector-discovery.js';
import {
  listOpportunitySources,
  upsertOpportunitySource,
  runOpportunityScanResponse,
  listOpportunityCandidates,
  reviewOpportunityCandidate,
  scanOpportunitySources
} from './opportunity-pipeline.js';

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

        const collectorResponse=await collectorRoute(request,env,url.pathname);
        if(collectorResponse){
          response=collectorResponse;
        }else if(request.method==='GET' && url.pathname==='/ready'){
          response=await readinessResponse(env);
        }else if(request.method==='GET' && url.pathname==='/api/search'){
          response=await publicSearch(request,env);
        }else if(request.method==='GET' && url.pathname==='/api/search-intelligence'){
          response=await smartSearchPlan(request,env);
        }else if(request.method==='GET' && url.pathname==='/api/procurement-mission'){
          response=await procurementMission(request,env);
        }else if(request.method==='POST' && url.pathname==='/api/sourcing-requests'){
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
            }else if(url.pathname==='/api/admin/maintenance/run' && request.method==='POST'){
              if(env.SOURCE_AO_ENV!=='staging'){
                response=new Response(JSON.stringify({ok:false,error:{code:'not_found',message:'Not found.'}}),{
                  status:404,
                  headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}
                });
              }else if(!isAdmin(request,env)){
                response=new Response(JSON.stringify({ok:false,error:{code:'unauthorized',message:'Admin authorization required.'}}),{
                  status:401,
                  headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}
                });
              }else{
                const result=await runMaintenance(env);
                response=new Response(JSON.stringify(result),{
                  status:200,
                  headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}
                });
              }
            }else if(url.pathname==='/api/admin/demand-radar' && request.method==='GET'){
              response=await demandRadar(request,env);
            }else if(url.pathname==='/api/admin/opportunity-pipeline/sources' && request.method==='GET'){
              response=await listOpportunitySources(request,env);
            }else if(url.pathname==='/api/admin/opportunity-pipeline/sources' && request.method==='POST'){
              response=await upsertOpportunitySource(request,env);
            }else if(url.pathname==='/api/admin/opportunity-pipeline/scan' && request.method==='POST'){
              response=await runOpportunityScanResponse(request,env);
            }else if(url.pathname==='/api/admin/opportunity-pipeline/candidates' && request.method==='GET'){
              response=await listOpportunityCandidates(request,env);
            }else{
              const opportunityReview=url.pathname.match(/^\/api\/admin\/opportunity-pipeline\/candidates\/([^/]+)\/review$/);
              if(opportunityReview && request.method==='POST'){
                response=await reviewOpportunityCandidate(request,env,opportunityReview[1]);
              }else{
                response=await core.fetch(request,env);
              }
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
  },

  async scheduled(controller,env,ctx){
    ctx.waitUntil((async()=>{
      const cron=controller?.cron||'';
      try{
        const discovery=await processPendingDiscoveryJobs(env,{limit:4});
        console.log(JSON.stringify({type:'source_ao_discovery_tick',cron,...discovery}));
        const opportunityScan=await scanOpportunitySources(env,{limitSources:2});
        console.log(JSON.stringify({type:'source_ao_opportunity_scan',cron,...opportunityScan}));
        if(cron==='17 2 * * *'){
          const result=await runMaintenance(env);
          console.log(JSON.stringify({type:'source_ao_maintenance',...result}));
        }
      }catch(error){
        console.error(JSON.stringify({
          type:'source_ao_scheduled_error',
          cron,
          message:error instanceof Error?error.message:'unknown_error'
        }));
        throw error;
      }
    })());
  }
};
