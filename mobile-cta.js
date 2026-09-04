/* HMATIAS — Mobile conversion dock */
(function(){
  'use strict';
  if (window.matchMedia && !window.matchMedia('(max-width: 850px)').matches) return;
  if (document.querySelector('.mobile-cta')) return;
  var bar=document.createElement('nav');
  bar.className='mobile-cta';
  bar.setAttribute('aria-label','Contactos rápidos');
  bar.innerHTML='<a class="cta-whatsapp" href="https://wa.me/244948806673" target="_blank" rel="noopener noreferrer" aria-label="Falar com a HMATIAS pelo WhatsApp"><span aria-hidden="true">WA</span><span>WhatsApp</span></a>'+
    '<a class="cta-call" href="tel:+244948806673" aria-label="Ligar para a HMATIAS"><span aria-hidden="true">☎</span><span>Ligar</span></a>'+
    '<a class="cta-quote" href="#orcamento" aria-label="Solicitar orçamento à HMATIAS"><span aria-hidden="true">↗</span><span>Orçamento</span></a>';
  document.body.appendChild(bar);
})();
