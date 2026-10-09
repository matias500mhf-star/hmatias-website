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
import {sendPendingIntakeAlerts,intakeAlertStatus} from './intake-alerts.js';
import {websiteLeadConfig,websiteLeadCors,createWebsiteLead,listWebsiteLeads,getWebsiteLead,updateWebsiteLeadStatus,deliverWebsiteLeadAlerts,pruneWebsiteLeads} from './website-leads.js';
import {publicSearch} from './public-search.js';
import {smartSearchPlan} from './smart-search.js';
import {procurementMission} from './procurement-mission.js';
import {discoverExternalSuppliers} from './external-supplier-discovery.js';
import {collectorRoute} from './collector-route.js';
import {processPendingDiscoveryJobs} from './collector-discovery.js';
import {copilotOpportunityResponse} from './intelligence-route.js';
import {
  listOpportunitySources,
  upsertOpportunitySource,
  runOpportunityScanResponse,
  listOpportunityCandidates,
  reviewOpportunityCandidate,
  scanOpportunitySources
} from './opportunity-pipeline.js';
import {listCommercialPartners,upsertCommercialPartner} from './partner-network.js';
import {createPartnerApplication,listPartnerApplications,getPartnerApplication,reviewPartnerApplication} from './partner-applications.js';
import {
  listPrivateSourcingSuppliers,
  upsertPrivateSourcingSupplier,
  getPrivateSourcingSupplierContact
} from './private-sourcing-suppliers.js';
import {getCommercialCase,upsertCostOption,updateCommercialCase,getProposalDraft} from './commercial-case.js';
import {getFulfillmentCase,updateFulfillmentCase} from './fulfillment.js';
import {getCommercialDashboard} from './commercial-dashboard.js';
import {getCollectionsCase,upsertInvoice,addPayment,voidPayment} from './collections.js';
import {getCommercialActions} from './commercial-actions.js';
import {listOpportunityPursuits,upsertOpportunityPursuit} from './opportunity-pursuits.js';

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
        }else if(request.method==='GET' && url.pathname==='/api/admin/intake-alerts/status'){
          const alertHeaders={
            'content-type':'application/json; charset=utf-8',
            'cache-control':'no-store',
            'access-control-allow-origin':env.PUBLIC_ORIGIN||'https://comercialhmatiasps.com',
            'access-control-allow-methods':'GET,OPTIONS',
            'access-control-allow-headers':'authorization,content-type'
          };
          if(!isAdmin(request,env)){
            response=new Response(JSON.stringify({ok:false,error:{code:'unauthorized'}}),{
              status:401,headers:alertHeaders
            });
          }else{
            response=new Response(JSON.stringify({ok:true,...await intakeAlertStatus(env)}),{
              status:200,headers:alertHeaders
            });
          }
        }else if(request.method==='GET' && url.pathname==='/api/website-leads/config'){
          response=websiteLeadConfig(request,env);
        }else if(request.method==='OPTIONS' && url.pathname==='/api/website-leads'){
          response=websiteLeadCors(request);
        }else if(request.method==='POST' && url.pathname==='/api/website-leads'){
          response=await createWebsiteLead(request,env);
        }else if(request.method==='GET' && url.pathname==='/api/admin/website-leads'){
          response=await listWebsiteLeads(request,env);
        }else if(request.method==='GET' && /^\/api\/admin\/website-leads\/wl_[0-9a-f-]{36}$/.test(url.pathname)){
          response=await getWebsiteLead(request,env,url.pathname.split('/').pop());
        }else if(request.method==='POST' && /^\/api\/admin\/website-leads\/wl_[0-9a-f-]{36}\/status$/.test(url.pathname)){
          response=await updateWebsiteLeadStatus(request,env,url.pathname.split('/').at(-2));
        }else if(request.method==='GET' && url.pathname==='/api/search'){
          response=await publicSearch(request,env);
        }else if(request.method==='GET' && url.pathname==='/api/search-intelligence'){
          response=await smartSearchPlan(request,env);
        }else if(request.method==='POST' && url.pathname==='/api/admin/supplier-discovery'){
          response=await discoverExternalSuppliers(request,env);
        }else if(request.method==='GET' && url.pathname==='/api/procurement-mission'){
          response=await procurementMission(request,env);
        }else if(request.method==='GET' && url.pathname==='/api/admin/procurement-mission'){
          response=await procurementMission(request,env,{privateView:true});
        }else if(request.method==='POST' && url.pathname==='/api/sourcing-requests'){
          response=await createSourcingRequest(request,env);
        }else if(request.method==='POST' && url.pathname==='/api/partner-applications'){
          response=await createPartnerApplication(request,env);
        }else{
          const publicRequest=url.pathname.match(/^\/api\/sourcing-requests\/([^/]+)$/);
          if(publicRequest && request.method==='GET'){
            response=await getSourcingRequest(request,env,publicRequest[1]);
          }else if(url.pathname==='/api/admin/sourcing-requests' && request.method==='GET'){
            response=await listSourcingRequests(request,env);
          }else if(url.pathname==='/api/admin/commercial-dashboard' && request.method==='GET'){
            response=await getCommercialDashboard(request,env);
          }else if(url.pathname==='/api/admin/commercial-actions' && request.method==='GET'){
            response=await getCommercialActions(request,env);
          }else if(url.pathname==='/api/admin/opportunity-pursuits' && request.method==='GET'){
            response=await listOpportunityPursuits(request,env);
          }else{
            const opportunityPursuit=url.pathname.match(/^\/api\/admin\/opportunities\/([^/]+)\/pursuit$/);
            const adminStatus=url.pathname.match(/^\/api\/admin\/sourcing-requests\/([^/]+)\/status$/);
            const commercialCase=url.pathname.match(/^\/api\/admin\/sourcing-requests\/([^/]+)\/commercial-case$/);
            const costOptions=url.pathname.match(/^\/api\/admin\/sourcing-requests\/([^/]+)\/cost-options$/);
            const proposalDraft=url.pathname.match(/^\/api\/admin\/sourcing-requests\/([^/]+)\/proposal-draft$/);
            const fulfillmentCase=url.pathname.match(/^\/api\/admin\/sourcing-requests\/([^/]+)\/fulfillment$/);
            const collectionsCase=url.pathname.match(/^\/api\/admin\/sourcing-requests\/([^/]+)\/collections$/);
            const invoiceCase=url.pathname.match(/^\/api\/admin\/sourcing-requests\/([^/]+)\/invoice$/);
            const paymentCase=url.pathname.match(/^\/api\/admin\/sourcing-requests\/([^/]+)\/payments$/);
            const voidPaymentCase=url.pathname.match(/^\/api\/admin\/sourcing-requests\/([^/]+)\/payments\/([^/]+)\/void$/);
            if(opportunityPursuit && request.method==='POST'){
              response=await upsertOpportunityPursuit(request,env,opportunityPursuit[1]);
            }else if(adminStatus && request.method==='POST'){
              response=await updateSourcingRequestStatus(request,env,adminStatus[1]);
            }else if(commercialCase && request.method==='GET'){
              response=await getCommercialCase(request,env,commercialCase[1]);
            }else if(commercialCase && request.method==='POST'){
              response=await updateCommercialCase(request,env,commercialCase[1]);
            }else if(costOptions && request.method==='POST'){
              response=await upsertCostOption(request,env,costOptions[1]);
            }else if(proposalDraft && request.method==='GET'){
              response=await getProposalDraft(request,env,proposalDraft[1]);
            }else if(fulfillmentCase && request.method==='GET'){
              response=await getFulfillmentCase(request,env,fulfillmentCase[1]);
            }else if(fulfillmentCase && request.method==='POST'){
              response=await updateFulfillmentCase(request,env,fulfillmentCase[1]);
            }else if(collectionsCase && request.method==='GET'){
              response=await getCollectionsCase(request,env,collectionsCase[1]);
            }else if(invoiceCase && request.method==='POST'){
              response=await upsertInvoice(request,env,invoiceCase[1]);
            }else if(paymentCase && request.method==='POST'){
              response=await addPayment(request,env,paymentCase[1]);
            }else if(voidPaymentCase && request.method==='POST'){
              response=await voidPayment(request,env,voidPaymentCase[1],voidPaymentCase[2]);
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
            }else if(url.pathname==='/api/admin/partner-network' && request.method==='GET'){
              response=await listCommercialPartners(request,env);
            }else if(url.pathname==='/api/admin/partner-network' && request.method==='POST'){
              response=await upsertCommercialPartner(request,env);
            }else if(url.pathname==='/api/admin/partner-applications' && request.method==='GET'){
              response=await listPartnerApplications(request,env);
            }else{
              const partnerApplication=url.pathname.match(/^\/api\/admin\/partner-applications\/([^/]+)$/);
              const partnerApplicationReview=url.pathname.match(/^\/api\/admin\/partner-applications\/([^/]+)\/review$/);
              if(partnerApplication && request.method==='GET'){
                response=await getPartnerApplication(request,env,partnerApplication[1]);
              }else if(partnerApplicationReview && request.method==='POST'){
                response=await reviewPartnerApplication(request,env,partnerApplicationReview[1]);
              }else if(url.pathname==='/api/admin/sourcing-suppliers' && request.method==='GET'){
              response=await listPrivateSourcingSuppliers(request,env);
            }else if(url.pathname==='/api/admin/sourcing-suppliers' && request.method==='POST'){
              response=await upsertPrivateSourcingSupplier(request,env);
            }else{
              const privateSupplierContact=url.pathname.match(/^\/api\/admin\/sourcing-suppliers\/([^/]+)\/contact$/);
              if(privateSupplierContact && request.method==='GET'){
                response=await getPrivateSourcingSupplierContact(request,env,privateSupplierContact[1]);
              }else{
              const copilotCandidate=url.pathname.match(/^\/api\/admin\/copilot\/candidates\/([^/]+)$/);
              const copilotOpportunity=url.pathname.match(/^\/api\/admin\/copilot\/opportunities\/([^/]+)$/);
              if(copilotCandidate && request.method==='GET'){
                response=await copilotOpportunityResponse(request,env,{kind:'candidate',id:copilotCandidate[1]});
              }else if(copilotOpportunity && request.method==='GET'){
                response=await copilotOpportunityResponse(request,env,{kind:'opportunity',id:copilotOpportunity[1]});
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
        const intake=await sendPendingIntakeAlerts(env,{limit:8});
        console.log(JSON.stringify({type:'source_ao_intake_notification_tick',cron,...intake}));
        const websiteAlerts=await deliverWebsiteLeadAlerts(env,{limit:5});
        console.log(JSON.stringify({type:'hmatias_website_leads_alert_tick',cron,...websiteAlerts}));
        const discovery=await processPendingDiscoveryJobs(env,{limit:4});
        console.log(JSON.stringify({type:'source_ao_discovery_tick',cron,...discovery}));
        const opportunityScan=await scanOpportunitySources(env,{limitSources:2});
        console.log(JSON.stringify({type:'source_ao_opportunity_scan',cron,...opportunityScan}));
        if(cron==='17 2 * * *'){
          const websitePruned=await pruneWebsiteLeads(env);
          console.log(JSON.stringify({type:'hmatias_website_leads_retention',deleted:websitePruned}));
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
