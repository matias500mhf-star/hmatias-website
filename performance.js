/* HMATIAS V2 — performance enhancements
   Lightweight, dependency-free. Keeps the critical path small. */
(function(){
  'use strict';
  if ('IntersectionObserver' in window) {
    var imgs = document.querySelectorAll('img[data-lazy]');
    var io = new IntersectionObserver(function(entries, observer){
      entries.forEach(function(entry){
        if (!entry.isIntersecting) return;
        var img = entry.target;
        if (img.dataset.src) img.src = img.dataset.src;
        if (img.dataset.srcset) img.srcset = img.dataset.srcset;
        img.removeAttribute('data-lazy');
        observer.unobserve(img);
      });
    }, {rootMargin:'250px 0px', threshold:0.01});
    imgs.forEach(function(img){ io.observe(img); });
  }
})();
