// Source from: https://ui-v5-demo-ds.pages.dev/
// Extracted: 1 inline script(s)


(function(){
  'use strict';

  /* Theme Toggle */
  var html = document.documentElement;
  var themeToggle = document.getElementById('themeToggle');
  var themeIcon = document.getElementById('themeIcon');

  function setTheme(mode){
    html.setAttribute('data-theme',mode);
    localStorage.setItem('spatial-theme',mode);
    updateIcon(mode);
  }
  function updateIcon(mode){
    if(!themeIcon) return;
    if(mode === 'dark'){
      themeIcon.innerHTML = '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
    } else {
      themeIcon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
    }
  }
  var saved = localStorage.getItem('spatial-theme');
  setTheme(saved || 'dark');
  if(themeToggle){
    themeToggle.addEventListener('click',function(e){
      e.preventDefault();
      setTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
  }

  /* 3D Tilt Engine */
  var tiltCards = document.querySelectorAll('[data-tilt]');
  tiltCards.forEach(function(card){
    var ticking = false;
    var bounding = null;
    function updateBounds(){bounding = card.getBoundingClientRect();}
    function handleTilt(e){
      if(!bounding) updateBounds();
      var rect = bounding;
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      var centerX = rect.width / 2;
      var centerY = rect.height / 2;
      var rotateY = ((x - centerX) / centerX) * 5;
      var rotateX = -((y - centerY) / centerY) * 5;
      card.style.transform = 'perspective(1000px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateZ(0)';
      var glow = card.querySelector('.card-glow');
      if(glow){
        glow.style.setProperty('--mx', ((x / rect.width) * 100) + '%');
        glow.style.setProperty('--my', ((y / rect.height) * 100) + '%');
      }
    }
    card.addEventListener('mouseenter',function(){updateBounds();card.style.transition = 'transform 0.15s ease-out';});
    card.addEventListener('mousemove',function(e){
      if(ticking) return;
      window.requestAnimationFrame(function(){handleTilt(e);ticking = false;});
      ticking = true;
    });
    card.addEventListener('mouseleave',function(){
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)';
      card.style.transition = 'transform 0.45s ease-out';
      var glow = card.querySelector('.card-glow');
      if(glow){glow.style.setProperty('--mx','50%');glow.style.setProperty('--my','50%');}
    });
    window.addEventListener('resize',updateBounds);
    window.addEventListener('scroll',updateBounds);
  });

  /* SVG Path Intersection Observer */
  if('IntersectionObserver' in window){
    document.querySelectorAll('.card-icon svg').forEach(function(svg){
      var paths = svg.querySelectorAll('path, circle, rect, line');
      var obs = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if(entry.isIntersecting){
            paths.forEach(function(p){
              p.style.strokeDashoffset = '200';
              void p.offsetWidth;
              p.style.transition = 'stroke-dashoffset 1.8s ease';
              p.style.strokeDashoffset = '0';
            });
          }
        });
      },{threshold:0.3});
      obs.observe(svg);
    });
  }

  /* Compatibility Badge */
  var badge = document.getElementById('compatBadge');
  if(badge){
    var results = [];
    results.push('backdrop-filter: ' + (CSS.supports('backdrop-filter','blur(1px)') ? '\u2713' : '\u2717 (fallback)'));
    results.push('custom-props: ' + (CSS.supports('--a','0') ? '\u2713' : '\u2717'));
    results.push('css-grid: ' + (CSS.supports('display','grid') ? '\u2713' : '\u2717'));
    results.push('oklch: ' + (CSS.supports('color','oklch(50% 0.1 200)') ? '\u2713' : '\u2717'));
    badge.textContent = results.join(' \xB7 ');
    badge.title = 'Compatibility Report \u2014 ' + results.join(', ');
  }

  /* Fade-in Scroll Observer */
  if('IntersectionObserver' in window){
    var fadeEls = document.querySelectorAll('.fade-in');
    var fadeObs = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.style.animationPlayState = 'running';
          fadeObs.unobserve(entry.target);
        }
      });
    },{threshold:0.15});
    fadeEls.forEach(function(el){el.style.animationPlayState = 'paused';fadeObs.observe(el);});
  }

  /* Nav Shadow on Scroll */
  var nav = document.querySelector('.glass-nav');
  var scrollTicking = false;
  window.addEventListener('scroll',function(){
    if(!scrollTicking){
      window.requestAnimationFrame(function(){
        if(nav) nav.style.boxShadow = window.scrollY > 10 ? '0 4px 24px oklch(0% 0 0 / 0.2)' : 'none';
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  });

  console.log('%c Spatial Bento v5.0 ','background:oklch(70% 0.18 260);color:#fff;font-weight:bold;padding:4px 8px;border-radius:4px;');
  console.log('%c 3D Tilt \xB7 SVG Path Animation \xB7 Dynamic Noise \xB7 Self-healing 2.0 ','font-size:11px;color:oklch(75% 0.04 220);');
})();
