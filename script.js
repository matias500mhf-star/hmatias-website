(function(){
  'use strict';

  // ========================================
  // MOBILE MENU TOGGLE
  // ========================================
  var menuToggle = document.querySelector('[aria-label="Toggle menu"]');
  var mainNav = document.querySelector('.main-nav');
  
  if(menuToggle) {
    menuToggle.addEventListener('click', function(e){
      e.preventDefault();
      mainNav.classList.toggle('active');
      menuToggle.setAttribute('aria-expanded', 
        menuToggle.getAttribute('aria-expanded') === 'false' ? 'true' : 'false'
      );
    });
  }

  // Close menu on link click
  if(mainNav) {
    var navLinks = mainNav.querySelectorAll('a');
    navLinks.forEach(function(link){
      link.addEventListener('click', function(){
        mainNav.classList.remove('active');
        if(menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ========================================
  // CONTACT FORM: BUILD MAILTO
  // ========================================
  var form = document.getElementById('contact-form');
  if(form){
    form.addEventListener('submit', function(e){
      e.preventDefault();

      var name = (form.name && form.name.value || '').trim();
      var email = (form.email && form.email.value || '').trim();
      var phone = (form.phone && form.phone.value || '').trim();
      var message = (form.message && form.message.value || '').trim();

      // Validação
      if(!name || !email || !message){
        alert('Por favor preencha o Nome, Email e Mensagem antes de enviar.');
        return;
      }

      // Validação de email
      var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if(!emailRegex.test(email)){
        alert('Por favor introduza um email válido.');
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

      // Open mail client
      window.location.href = mailto;
    }, false);
  }

  // ========================================
  // LIGHTBOX FOR GALLERY IMAGES
  // ========================================
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

  // Close handlers
  if(lbClose) lbClose.addEventListener('click', closeLightbox);
  if(lb) lb.addEventListener('click', function(e){ if(e.target === lb) closeLightbox(); });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape' || e.key === 'Esc') closeLightbox(); });

  // ========================================
  // SMOOTH SCROLL ANCHOR LINKS
  // ========================================
  var anchorLinks = document.querySelectorAll('a[href^="#"]');
  anchorLinks.forEach(function(link){
    link.addEventListener('click', function(e){
      var href = this.getAttribute('href');
      if(href === '#') return;
      
      var target = document.querySelector(href);
      if(target){
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ========================================
  // SCROLL ANIMATIONS - INTERSECTION OBSERVER
  // ========================================
  var observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  var observer = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe elements with animation classes
  var animatedElements = document.querySelectorAll('.service-card, .project-card, .why-grid article, .capability, .solution-card');
  animatedElements.forEach(function(el){
    observer.observe(el);
  });

  // ========================================
  // NAVBAR SCROLL EFFECT
  // ========================================
  var nav = document.querySelector('.nav');
  var lastScrollTop = 0;

  window.addEventListener('scroll', function(){
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if(scrollTop > 50){
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
    
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
  }, false);

  // ========================================
  // FORM INPUT VALIDATION & REAL-TIME FEEDBACK
  // ========================================
  var inputs = document.querySelectorAll('.contact-form input, .contact-form textarea');
  inputs.forEach(function(input){
    input.addEventListener('blur', function(){
      validateInput(this);
    });
    
    input.addEventListener('input', function(){
      if(this.classList.contains('error')){
        validateInput(this);
      }
    });
  });

  function validateInput(input){
    var value = input.value.trim();
    var type = input.type;
    var isValid = true;

    input.classList.remove('error', 'success');

    if(!value){
      input.classList.add('error');
      return false;
    }

    if(type === 'email'){
      var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      isValid = emailRegex.test(value);
    }

    if(type === 'tel'){
      var phoneRegex = /^[\d\s\-\+\(\)]+$/;
      isValid = phoneRegex.test(value) && value.length >= 7;
    }

    if(isValid){
      input.classList.add('success');
    } else {
      input.classList.add('error');
    }

    return isValid;
  }

  // ========================================
  // WHATSAPP WIDGET (Mobile Only)
  // ========================================
  if(window.innerWidth < 768){
    var whatsappButton = document.createElement('a');
    whatsappButton.href = 'https://wa.me/244948806673?text=Olá,%20gostaria%20de%20solicitar%20um%20orçamento';
    whatsappButton.className = 'whatsapp-widget';
    whatsappButton.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.272-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-4.935 1.208l-.344.202-.356.01-1.237-.237 1.237 3.852.19.342-.023.364a9.846 9.846 0 001.515 4.833l.217.304.356.047 3.842-1.218.361-.11.378.074a9.847 9.847 0 004.839-1.24c.152-.088.274-.228.274-.39v-1.356c0-.162-.122-.302-.274-.39a9.868 9.868 0 00-4.839-1.24z"/></svg>';
    whatsappButton.setAttribute('title', 'Fale connosco no WhatsApp');
    whatsappButton.setAttribute('aria-label', 'Abrir WhatsApp');
    whatsappButton.setAttribute('target', '_blank');
    whatsappButton.setAttribute('rel', 'noopener noreferrer');
    document.body.appendChild(whatsappButton);
  }

  // ========================================
  // LAZY LOADING FOR IMAGES
  // ========================================
  if('IntersectionObserver' in window){
    var imageObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          var img = entry.target;
          if(img.dataset.src){
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            img.classList.add('loaded');
          }
          imageObserver.unobserve(img);
        }
      });
    });

    var lazyImages = document.querySelectorAll('img[data-src]');
    lazyImages.forEach(function(img){
      imageObserver.observe(img);
    });
  }

  // ========================================
  // PERFORMANCE: DEBOUNCE SCROLL & RESIZE
  // ========================================
  function debounce(func, wait){
    var timeout;
    return function executedFunction(){
      var later = function(){
        clearTimeout(timeout);
        func();
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // ========================================
  // TRACK CUSTOM EVENTS (GA)
  // ========================================
  if(typeof gtag !== 'undefined'){
    // Track form submission
    if(form){
      form.addEventListener('submit', function(){
        gtag('event', 'form_submit', {
          'event_category': 'engagement',
          'event_label': 'contact_form'
        });
      });
    }

    // Track WhatsApp clicks
    var whatsappLinks = document.querySelectorAll('a[href^="https://wa.me"]');
    whatsappLinks.forEach(function(link){
      link.addEventListener('click', function(){
        gtag('event', 'whatsapp_click', {
          'event_category': 'engagement',
          'event_label': 'whatsapp_cta'
        });
      });
    });

    // Track gallery opens
    galleryImages.forEach(function(img){
      img.addEventListener('click', function(){
        gtag('event', 'gallery_open', {
          'event_category': 'engagement',
          'event_label': 'project_image'
        });
      });
    });
  }

  // ========================================
  // DETECT TOUCH DEVICE
  // ========================================
  var isTouchDevice = function(){
    return (('ontouchstart' in window) ||
            (navigator.maxTouchPoints > 0) ||
            (navigator.msMaxTouchPoints > 0));
  };

  if(isTouchDevice()){
    document.body.classList.add('touch-device');
  }

})();
