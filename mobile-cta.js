/* HMATIAS — Responsive mobile layout refinements */
(function(){
  'use strict';
  if (!window.matchMedia || !window.matchMedia('(max-width: 850px)').matches) return;

  var style = document.createElement('style');
  style.id = 'hmatias-mobile-refinements';
  style.textContent = `
    @media (max-width:850px){
      html{scroll-padding-top:82px;overflow-x:hidden}
      body{width:100%;overflow-x:hidden}
      .container{width:calc(100% - 32px);max-width:none}
      .topbar{height:32px;font-size:10px}
      .topbar-inner{height:32px}
      .topbar-inner>span{white-space:nowrap}
      .header{z-index:100}
      .nav{min-height:72px;height:72px;gap:10px}
      .brand,.brand img{width:176px;height:56px}
      .menu-toggle{width:44px;height:44px;flex:0 0 44px}
      .nav-menu{top:72px;left:12px;right:12px;border-radius:12px;padding:8px;max-height:calc(100vh - 88px);overflow:auto}
      .nav-menu a{padding:12px 14px;font-size:13px}
      .hero-grid{min-height:0}
      .hero-copy{padding:48px 0 42px}
      .eyebrow{font-size:9px;letter-spacing:1.5px}
      .hero h1{font-size:clamp(34px,10vw,42px);line-height:1.06;letter-spacing:-1.4px;margin-bottom:18px}
      .hero-copy>p{font-size:14px;line-height:1.58}
      .hero-actions{gap:10px;margin-top:23px}
      .hero-actions .btn{width:100%;min-height:48px;padding:13px 18px}
      .hero-values{gap:12px;margin-top:30px}
      .hero-values div{font-size:10px;line-height:1.35}
      .proof-grid{grid-template-columns:1fr 1fr}
      .proof-grid div{padding:16px 12px;min-width:0}
      .proof-grid strong{font-size:12px}
      .proof-grid span{font-size:10px;line-height:1.35}
      .services,.sectors,.company,.leadership,.why-us,.projects,.supply,.contact{padding:56px 0}
      .section-heading{margin-bottom:28px}
      .section-heading.center{margin-bottom:30px}
      .section-heading h2,.company h2,.contact h2,.supply h2,.cta h2{font-size:30px;line-height:1.14;letter-spacing:-.8px}
      .section-heading p{font-size:13px;line-height:1.55}
      .service-grid,.project-grid,.sector-grid,.why-us-grid{grid-template-columns:1fr;gap:14px}
      .service-card{padding:23px 19px}
      .service-card p{min-height:0;font-size:12px;line-height:1.55}
      .service-icon{margin-bottom:15px}
      .sector-grid article{min-height:0;padding:22px 18px}
      .sector-grid h3{margin:17px 0 7px}
      .company-grid,.contact-grid,.supply-inner{grid-template-columns:1fr;gap:30px}
      .company p{font-size:14px;line-height:1.6}
      .company-points{margin-top:20px}
      .company-points div{gap:12px;padding:11px 12px}
      .company-panel{min-height:270px;padding:32px;border-radius:18px}
      .panel-mark{font-size:68px}
      .company-panel strong{font-size:17px}
      .company-panel span{margin-top:22px}
      .project-image{height:220px}
      .project-caption{padding:16px}
      .project-caption p{min-height:0;line-height:1.5}
      .supply-list{grid-template-columns:1fr;gap:8px}
      .supply-card{padding:24px}
      .cta{padding:48px 0}
      .cta-inner{display:grid;gap:22px}
      .cta-inner .btn{width:100%;min-height:48px}
      .contact-form{grid-template-columns:1fr;padding:20px;gap:13px}
      .contact-form label:nth-of-type(5),.contact-form button,.form-note{grid-column:auto}
      .contact-form button{width:100%;min-height:48px}
      .contact-list{margin-top:22px}
      .contact-list a,.contact-list>span{font-size:13px;line-height:1.45}
      .footer-grid{grid-template-columns:1fr;gap:24px;padding-bottom:30px}
      .footer-grid>div:first-child{grid-column:auto}
      .footer-logo{width:190px;height:62px}
      .copyright{line-height:1.5}
      .mobile-cta,.mobile-sticky-contact,.whatsapp-float{display:none!important}
    }
    @media (max-width:380px){
      .container{width:calc(100% - 24px)}
      .brand,.brand img{width:160px;height:52px}
      .hero-copy{padding-top:42px}
      .hero h1{font-size:33px}
      .hero-values{grid-template-columns:1fr}
      .proof-grid{grid-template-columns:1fr}
      .proof-grid div{border-left:1px solid var(--border)!important;border-right:1px solid var(--border)!important}
      .company-panel{padding:26px;min-height:245px}
      .section-heading h2,.company h2,.contact h2,.supply h2,.cta h2{font-size:28px}
    }
    @media (prefers-reduced-motion:reduce){
      .hero-actions .btn,.service-card,.project-image{transition:none}
    }
  `;
  document.head.appendChild(style);

  var duplicateBars = document.querySelectorAll('.mobile-cta, .mobile-sticky-contact');
  duplicateBars.forEach(function(el){ el.remove(); });
})();
