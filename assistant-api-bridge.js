/* HMATIAS AI API compatibility bridge.
   The custom api subdomain is currently challenged by Cloudflare. Route assistant
   requests to the deployed workers.dev endpoint; the Worker validates site origins. */
(() => {
  'use strict';
  const legacy = 'https://api.comercialhmatiasps.com/api/ai';
  const worker = 'https://hmatias-ai-assistant.matias500-mhf.workers.dev/api/ai';
  if (window.__HMATIAS_AI_API_BRIDGE__) return;
  const originalFetch = window.fetch.bind(window);
  window.__HMATIAS_AI_API_BRIDGE__ = true;
  window.fetch = function(input, init) {
    const isRequest = typeof Request !== 'undefined' && input instanceof Request;
    const url = isRequest ? input.url : String(input);
    if (url === legacy) {
      const redirected = isRequest ? new Request(worker, input) : worker;
      return originalFetch(redirected, init);
    }
    return originalFetch(input, init);
  };
})();
