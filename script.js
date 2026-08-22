(function(){
  'use strict';

  // Contact form: build mailto and open user's email client
  var form = document.getElementById('contact-form');
  if(form){
    form.addEventListener('submit', function(e){
      e.preventDefault();

      var name = (form.name && form.name.value || '').trim();
      var email = (form.email && form.email.value || '').trim();
      var phone = (form.phone && form.phone.value || '').trim();
      var message = (form.message && form.message.value || '').trim();

      if(!name || !email || !message){
        alert('Por favor preencha o Nome, Email e Mensagem antes de enviar.');
        return;
      }

      var subject = encodeURIComponent('Pedido de Orçamento - ' + name);
      var bodyLines = [
        'Nome: ' + name,
        'Email: ' + email,
        'Telefone: ' + phone,
        '',
        'Mensagem:',
        message
      ];
      var body = encodeURIComponent(bodyLines.join('\n'));

      var mailto = 'mailto:comercial@matiasps.ao?subject=' + subject + '&body=' + body;

      // open mail client
      window.location.href = mailto;
    }, false);
  }

  // Lightbox for gallery images
  var lb = document.getElementById('lightbox');
  var lbImg = document.getElementById('lb-img');
  var lbClose = document.getElementById('lb-close');

  function openLightbox(src, alt){
    if(!lb) return;
    lbImg.src = src;
    lbImg.alt = alt || '';
    lb.setAttribute('aria-hidden','false');
    lb.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    lbClose && lbClose.focus();
  }

  function closeLightbox(){
    if(!lb) return;
    lb.setAttribute('aria-hidden','true');
    lbImg.src = '';
    lb.style.display = 'none';
    document.body.style.overflow = '';
  }

  // Open image on click
  var galleryImages = document.querySelectorAll('.gallery .project-card img');
  galleryImages.forEach(function(img){
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', function(){
      openLightbox(img.src, img.alt);
    });
  });

  // close handlers
  if(lbClose) lbClose.addEventListener('click', closeLightbox);
  if(lb) lb.addEventListener('click', function(e){ if(e.target === lb) closeLightbox(); });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape' || e.key === 'Esc') closeLightbox(); });

})();
