(function(){
  const tabs = document.querySelectorAll('.g-tab');
  const panels = document.querySelectorAll('.g-panel');
  tabs.forEach(t => t.addEventListener('click', () => {
    const id = t.dataset.tab;
    tabs.forEach(x => x.classList.toggle('active', x === t));
    panels.forEach(p => p.classList.toggle('active', p.dataset.panel === id));
    window.scrollTo({top: document.querySelector('.g-tabs').offsetTop - 60, behavior: 'smooth'});
  }));
  // Smooth scroll for mini-toc anchors
  document.querySelectorAll('.g-mini-toc-item').forEach(a => {
    a.addEventListener('click', e => {
      const tgt = document.querySelector(a.getAttribute('href'));
      if (tgt) { e.preventDefault(); tgt.scrollIntoView({behavior:'smooth', block:'start'}); }
    });
  });
})();
