const header = document.getElementById('siteHeader');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  });

  // Reveal on scroll
  const revealEls = document.querySelectorAll('.kicker, .historia-grid, .producto-grid, .filo-card, .fundador-grid, .contact-grid');
  revealEls.forEach(el => { el.style.opacity = 0; el.style.transform = 'translateY(24px)'; el.style.transition = 'opacity .8s ease, transform .8s ease'; });
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if(e.isIntersecting){
        e.target.style.opacity = 1;
        e.target.style.transform = 'translateY(0)';
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => io.observe(el));

  // Mobile menu (simple toggle -> smooth scroll to nav list shown as column)
  const menuBtn = document.getElementById('menuBtn');
  const navlinks = document.querySelector('.navlinks');
  menuBtn.addEventListener('click', () => {
    const isOpen = navlinks.style.display === 'flex';
    if(isOpen){
      navlinks.style.display = 'none';
    } else {
      navlinks.style.cssText = 'display:flex; position:fixed; top:64px; left:0; right:0; background:#130c0a; flex-direction:column; padding:24px 32px; gap:20px; border-bottom:1px solid rgba(201,162,75,0.2);';
    }
  });
