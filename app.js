(() => {
  'use strict';
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined';
  const hasScrollTrigger = typeof window.ScrollTrigger !== 'undefined';

  const toggleMenu = (open) => { const button = $('.menu-toggle'); const menu = $('.mobile-menu'); button?.classList.toggle('open', open); menu?.classList.toggle('open', open); button?.setAttribute('aria-expanded', String(open)); menu?.setAttribute('aria-hidden', String(!open)); document.body.classList.toggle('menu-open', open); };
  $('.menu-toggle')?.addEventListener('click', () => toggleMenu(!$('.mobile-menu')?.classList.contains('open')));
  $$('.mobile-menu a').forEach((link) => link.addEventListener('click', () => toggleMenu(false)));

  const splitHeroWords = () => $$('.split-word').forEach((word) => { const text = word.firstChild?.textContent || ''; word.innerHTML = [...text].map((char) => `<span>${char === ' ' ? '&nbsp;' : char}</span>`).join('') + (word.classList.contains('accent-word') ? '<sup>01</sup>' : ''); });

  const initCursor = () => {
    if (!finePointer || reduceMotion) return;
    const dot = $('.cursor-dot'); const ring = $('.cursor-ring'); if (!dot || !ring) return;
    let mouseX = innerWidth / 2; let mouseY = innerHeight / 2; let ringX = mouseX; let ringY = mouseY;
    addEventListener('mousemove', (event) => { mouseX = event.clientX; mouseY = event.clientY; dot.style.left = `${mouseX}px`; dot.style.top = `${mouseY}px`; }, { passive: true });
    const render = () => { ringX += (mouseX - ringX) * .14; ringY += (mouseY - ringY) * .14; ring.style.left = `${ringX}px`; ring.style.top = `${ringY}px`; requestAnimationFrame(render); }; render();
    $$('a,button,.tilt-card,.service-item,.experience-row,.cert-slot').forEach((element) => { element.addEventListener('mouseenter', () => ring.classList.add('active')); element.addEventListener('mouseleave', () => ring.classList.remove('active')); });
  };

  const initMagnetic = () => {
    if (!finePointer || reduceMotion) return;
    $$('.magnetic').forEach((element) => { const strength = Number(element.dataset.magnetic || .18); element.addEventListener('mousemove', (event) => { const rect = element.getBoundingClientRect(); const x = (event.clientX - rect.left - rect.width / 2) * strength; const y = (event.clientY - rect.top - rect.height / 2) * strength; hasGSAP ? gsap.to(element, { x, y, duration: .45, ease: 'power3.out', overwrite: true }) : (element.style.transform = `translate(${x}px,${y}px)`); }); element.addEventListener('mouseleave', () => { if (hasGSAP) gsap.to(element, { x: 0, y: 0, duration: .7, ease: 'elastic.out(1,.45)', overwrite: true }); else element.style.transform = ''; }); });
  };

  const initTilt = () => { if (!finePointer || reduceMotion || typeof window.VanillaTilt === 'undefined') return; VanillaTilt.init($$('.tilt-card'), { max: 7, perspective: 1100, scale: 1.018, speed: 500, glare: true, 'max-glare': .14, gyroscope: false }); };

  const initMarquees = () => {
    const tracks = $$('.cert-track'); if (!tracks.length || reduceMotion) return;
    const state = tracks.map((track, index) => { track.style.animation = 'none'; return { track, x: index ? -50 : 0, base: index ? .18 : -.2, velocity: 1 }; }); let last = performance.now();
    const tick = (now) => { const dt = Math.min(40, now - last); last = now; state.forEach((item) => { item.x += item.base * item.velocity * dt / 16; if (item.x < -50) item.x += 50; if (item.x > 0) item.x -= 50; item.track.style.transform = `translate3d(${item.x}%,0,0)`; }); requestAnimationFrame(tick); }; requestAnimationFrame(tick);
    addEventListener('wheel', (event) => { const direction = Math.sign(event.deltaY) || 1; state.forEach((item) => { item.velocity = Math.max(.65, Math.min(3.8, 1 + Math.abs(event.deltaY) / 500)); item.base = Math.abs(item.base) * direction * (item.track.closest('.marquee-reverse') ? -1 : 1); }); }, { passive: true });
    addEventListener('scroll', () => { if (hasScrollTrigger) { const speed = Math.max(.7, Math.min(3.4, 1 + Math.abs(ScrollTrigger.getVelocity()) / 2200)); state.forEach((item) => { item.velocity += (speed - item.velocity) * .25; }); } }, { passive: true });
  };

  const initProgress = () => { const bar = $('.site-progress span'); const update = () => { const max = document.documentElement.scrollHeight - innerHeight; if (bar) bar.style.width = `${max ? scrollY / max * 100 : 0}%`; }; addEventListener('scroll', update, { passive: true }); update(); };

  const initCertificateModal = () => {
    const cards = $$('.certificate-card');
    if (!cards.length) return;
    const modal = document.createElement('div');
    modal.className = 'certificate-modal';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = '<div class="certificate-modal-content" role="dialog" aria-modal="true" aria-label="Certificate preview"><button class="certificate-modal-close" type="button" aria-label="Close certificate preview">×</button><img class="certificate-modal-image" alt="" /><p class="certificate-modal-title"></p></div>';
    document.body.append(modal);
    const modalImage = $('.certificate-modal-image', modal);
    const modalTitle = $('.certificate-modal-title', modal);
    const close = () => { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); document.body.classList.remove('modal-open'); };
    cards.forEach((card) => {
      const image = $('img', card);
      if (!image) return;
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `View ${image.alt} larger`);
      const open = () => { modalImage.src = image.src; modalImage.alt = image.alt; modalTitle.textContent = image.alt; modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); document.body.classList.add('modal-open'); };
      card.addEventListener('click', open);
      card.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } });
    });
    modal.addEventListener('click', (event) => { if (event.target === modal || event.target.closest('.certificate-modal-close')) close(); });
    addEventListener('keydown', (event) => { if (event.key === 'Escape' && modal.classList.contains('open')) close(); });
  };

  const initAnimations = () => {
    const dismissPreloader = () => { const preloader = $('.preloader'); if (preloader) { preloader.style.transition = 'transform .7s ease'; preloader.style.transform = 'translateY(-100%)'; } };
    if (!hasGSAP) { $$('.reveal-up,.reveal-fly,.split-word>span').forEach((el) => { el.style.opacity = '1'; el.style.transform = 'none'; }); dismissPreloader(); return; }
    if (!hasScrollTrigger || reduceMotion) { gsap.set('.reveal-up,.reveal-fly,.split-word>span', { opacity: 1, y: 0, x: 0, scale: 1, rotate: 0 }); dismissPreloader(); return; }
    gsap.registerPlugin(ScrollTrigger);
    if (typeof window.Lenis !== 'undefined') { const lenis = new window.Lenis({ duration: 1.1, smoothWheel: true, syncTouch: true, touchMultiplier: 1.1 }); lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add((time) => lenis.raf(time * 1000)); gsap.ticker.lagSmoothing(0); }
    const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
    intro.to('.preloader', { yPercent: -100, duration: .9, delay: .25 }).to('.split-word>span', { y: '0%', rotate: 0, opacity: 1, duration: 1, stagger: .045 }, '-=.35').to('.reveal-up', { y: 0, opacity: 1, duration: .85, stagger: .08 }, '-=.6').from('.hero-visual', { scale: .78, opacity: 0, rotate: -12, duration: 1.5 }, '-=1');
    gsap.to('.hero-visual', { yPercent: 15, rotate: 8, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.2 } }); gsap.to('.hero-grid', { yPercent: 25, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.2 } });
    if (finePointer) { const depthNodes = $$('[data-depth]').map((node) => ({ amount: Number(node.dataset.depth || 10), x: gsap.quickTo(node, 'x', { duration: 1, ease: 'power3.out' }), y: gsap.quickTo(node, 'y', { duration: 1, ease: 'power3.out' }) })); addEventListener('mousemove', (event) => { const px = (event.clientX / innerWidth - .5) * 2; const py = (event.clientY / innerHeight - .5) * 2; depthNodes.forEach((item) => { item.x(px * item.amount); item.y(py * item.amount); }); }, { passive: true }); }
    $$('.stacked-section').forEach((section, index) => { gsap.fromTo(section, { y: '13vh', scale: .96, rotateX: 4, opacity: .65 }, { y: 0, scale: 1, rotateX: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: section, start: 'top bottom', end: 'top 15%', scrub: 1 } }); const flies = $$('.reveal-fly,.fly-item', section); gsap.fromTo(flies, { y: 70, x: (i) => (i % 2 ? 45 : -45), z: -180, rotate: (i) => i % 2 ? 3 : -3, opacity: 0 }, { y: 0, x: 0, z: 0, rotate: 0, opacity: 1, duration: 1, stagger: .07, ease: 'expo.out', scrollTrigger: { trigger: section, start: index === 0 ? 'top 70%' : 'top 55%', toggleActions: 'play none none reverse' } }); });
    gsap.to('.about-orbit,.closing-grid', { rotate: 28, scale: 1.1, ease: 'none', scrollTrigger: { trigger: '#about', start: 'top bottom', end: 'bottom top', scrub: 1.2 } });
  };

  splitHeroWords(); initCursor(); initMagnetic(); initTilt(); initProgress(); initMarquees(); initCertificateModal(); initAnimations();
})();
