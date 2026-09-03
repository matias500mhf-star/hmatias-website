/* HMATIAS V2 — performance enhancements
   Lightweight, dependency-free. Keeps the critical path small. */
(function(){
  'use strict';

  // Reduce rendering work for long below-the-fold sections without
  // changing the visual layout. The browser reveals each section as needed.
  if ('contentVisibility' in document.documentElement.style) {
    document.querySelectorAll('main > section').forEach(function(section, index){
      if (index > 1) section.style.contentVisibility = 'auto';
      if (index > 1 && !section.style.containIntrinsicSize) {
        section.style.containIntrinsicSize = '700px';
      }
    });
  }

  // Respect reduced-motion preferences for accessibility and performance.
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var style = document.createElement('style');
    style.textContent = '*,:before,:after{scroll-behavior:auto!important;animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}';
    document.head.appendChild(style);
  }
})();
