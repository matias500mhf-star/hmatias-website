(()=>{
  'use strict';
  // Safe default. Staging/production deployment may override apiBase at deploy time.
  window.SOURCE_AO_RUNTIME=Object.freeze({
    environment:'development',
    apiBase:''
  });
})();
