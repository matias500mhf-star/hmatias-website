/* Load the optional secure intake when a visitor approaches a commercial form. */
(()=>{
  'use strict';
  const root=document.documentElement;
  if(root.dataset.hmatiasLeadsEndpoint||root.dataset.hmatiasWebsiteLeadLoader)return;
  root.dataset.hmatiasWebsiteLeadLoader='true';
  const src=new URL('website-lead-intake.js?v=20261014-lazy1',document.currentScript?.src||location.href).href;
  const ids=['contactForm','businessContactForm','bookingRequestForm','cleanQuoteForm','smartRfqForm'];
  function watch(){
    const forms=ids.map(id=>document.getElementById(id)).filter(Boolean);
    if(!forms.length)return;
    let started=false;
    let observer;
    const activate=()=>{
      if(started)return;
      started=true;
      observer?.disconnect();
      for(const form of forms){
        form.removeEventListener('focusin',activate);
        form.removeEventListener('pointerdown',activate);
      }
      const script=document.createElement('script');
      script.src=src;
      script.async=true;
      script.dataset.hmatiasWebsiteIntakeCode='true';
      document.head.appendChild(script);
    };
    for(const form of forms){
      form.addEventListener('focusin',activate,{once:true});
      form.addEventListener('pointerdown',activate,{once:true,passive:true});
    }
    if('IntersectionObserver' in window){
      observer=new window.IntersectionObserver(entries=>{
        if(entries.some(entry=>entry.isIntersecting))activate();
      },{rootMargin:'600px 0px'});
      forms.forEach(form=>observer.observe(form));
    }else activate();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch,{once:true});
  else watch();
})();
