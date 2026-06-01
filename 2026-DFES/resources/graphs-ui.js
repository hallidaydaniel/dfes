(function(){
  const tabs = document.querySelectorAll('.g-tab');
  const panels = document.querySelectorAll('.g-panel');

  function activatePanel(slug, opts){
    if(!slug) return false;
    let matched = false;
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === slug));
    panels.forEach(p => {
      const on = p.dataset.panel === slug;
      p.classList.toggle('active', on);
      if(on) matched = true;
    });
    if(matched && opts && opts.scroll){
      const bar = document.querySelector('.g-tabs');
      if(bar) window.scrollTo({top: bar.offsetTop - 60, behavior: 'smooth'});
    }
    return matched;
  }

  function panelSlugForTarget(el){
    const panel = el && el.closest && el.closest('.g-panel');
    return panel ? panel.dataset.panel : null;
  }

  tabs.forEach(t => t.addEventListener('click', () => {
    activatePanel(t.dataset.tab, {scroll: true});
  }));

  document.querySelectorAll('.g-mini-toc-item').forEach(a => {
    a.addEventListener('click', e => {
      const tgt = document.querySelector(a.getAttribute('href'));
      if (tgt) {
        e.preventDefault();
        activatePanel(panelSlugForTarget(tgt));
        tgt.scrollIntoView({behavior:'smooth', block:'start'});
      }
    });
  });

  function syncToHash(){
    const hash = window.location.hash;
    if(!hash || hash.length < 2) return;
    let slug = null;
    if(hash.indexOf('#panel-') === 0){
      slug = hash.slice(7);
    } else {
      const tgt = document.querySelector(hash);
      slug = panelSlugForTarget(tgt);
    }
    if(slug && activatePanel(slug)){
      const tgt = document.querySelector(hash);
      if(tgt && hash.indexOf('#panel-') !== 0){
        tgt.scrollIntoView({behavior:'auto', block:'start'});
      }
    }
  }

  syncToHash();
  window.addEventListener('hashchange', syncToHash);
})();
