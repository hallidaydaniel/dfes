/* DFES 2026 prototype — App shell + Tweaks panel */
/* eslint-disable */

const { useState: useStateA, useEffect: useEffectA } = React;
const IconA = window.DFESLib.Icon;
const { Hero, StatsStrip } = window.DFESLib;
const { Workspace } = window.DFESLib2;
const { ScenarioCards, CompareTable, CalloutBand, Footer } = window.DFESLib3;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "mode": "bold",
  "heroAnim": "on",
  "heroSource": "sites",
  "showCallout": true,
  "showCompare": true
}/*EDITMODE-END*/;

function Header() {
  return (
    <>
      <div className="utility-bar">
        <div className="holder">
          <div>
            <a>About us</a>
            <a>Our network</a>
            <a>Connections</a>
            <a>Priority Services</a>
          </div>
          <a href="#" className="powercut">
            <IconA name="bolt" size={12}/> Power cut? 105
          </a>
        </div>
      </div>
      <header className="site-header">
        <div className="holder">
          <a href="#" className="brand">
            <img src="assets/npg-logo.svg" alt="Northern Powergrid"/>
            <span className="breadcrumb">Future Energy Scenarios <strong>2026</strong></span>
          </a>
          <nav className="site-nav">
            <a href="#workspace">Map</a>
            <a href="#about">Scenarios</a>
            <a href="#compare">Compare</a>
            <a className="btn btn--outline btn--sm" style={{padding: '8px 16px'}}>Download data</a>
          </nav>
        </div>
      </header>
    </>
  );
}

function App() {
  const [tweaks, setTweaks] = useStateA(TWEAK_DEFAULTS);
  const [headerCtx, setHeaderCtx] = useStateA(null);

  // Apply mode class to body
  useEffectA(() => {
    document.body.classList.toggle('mode-calm', tweaks.mode === 'calm');
    document.body.classList.toggle('mode-bold', tweaks.mode === 'bold');
  }, [tweaks.mode]);

  const setTweak = (k, v) => {
    setTweaks(prev => {
      const next = typeof k === 'object' ? { ...prev, ...k } : { ...prev, [k]: v };
      window.parent.postMessage({ type: '__edit_mode_set_keys', edits: next }, '*');
      return next;
    });
  };

  // Tweaks panel host protocol
  const [panelOpen, setPanelOpen] = useStateA(false);
  useEffectA(() => {
    const onMsg = (e) => {
      const d = e.data || {};
      if (d.type === '__activate_edit_mode') setPanelOpen(true);
      else if (d.type === '__deactivate_edit_mode') setPanelOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);
  const close = () => {
    setPanelOpen(false);
    window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*');
  };

  return (
    <>
      <Header/>
      <Hero tweaks={tweaks}/>
      {headerCtx && <StatsStrip scenario={headerCtx.scenario} param={headerCtx.param} year={headerCtx.year}/>}
      <Workspace tweaks={tweaks} setHeader={setHeaderCtx}/>
      <ScenarioCards/>
      {tweaks.showCompare && <CompareTable/>}
      {tweaks.showCallout && <CalloutBand/>}
      <Footer/>

      {panelOpen && (
        <div style={{
          position:'fixed', right: 24, bottom: 24, width: 320, zIndex: 9999,
          background: '#fff', borderRadius: 12, border: '1px solid var(--navy-10)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.18)', padding: 20, fontFamily: 'var(--font-body)'
        }}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 16}}>
            <div style={{fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: 0.5, textTransform:'uppercase'}}>Tweaks</div>
            <button onClick={close} style={{padding:6, lineHeight:0}}><IconA name="x" size={14}/></button>
          </div>

          <div style={{marginBottom: 16}}>
            <div style={{fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--black-70)', marginBottom:8}}>Direction</div>
            <div className="segmented" style={{display:'flex', width:'100%'}}>
              <button className={tweaks.mode==='bold'?'active':''} onClick={()=>setTweak('mode','bold')} style={{flex:1}}>Bold / impact</button>
              <button className={tweaks.mode==='calm'?'active':''} onClick={()=>setTweak('mode','calm')} style={{flex:1}}>Calm / editorial</button>
            </div>
            <p style={{fontSize:12, color:'var(--black-70)', marginTop:8, lineHeight:1.4}}>
              {tweaks.mode==='bold'
                ? 'Red impact hero, dark stats strip, tinted feature band.'
                : 'Off-white hero, paper feel, subdued accents — reads more editorial.'}
            </p>
          </div>

          <div style={{marginBottom: 16}}>
            <div style={{fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--black-70)', marginBottom:8}}>Hero network</div>
            <div className="segmented" style={{display:'flex', width:'100%'}}>
              <button className={tweaks.heroAnim==='on'?'active':''} onClick={()=>setTweak('heroAnim','on')} style={{flex:1}}>Animated</button>
              <button className={tweaks.heroAnim==='static'?'active':''} onClick={()=>setTweak('heroAnim','static')} style={{flex:1}}>Static</button>
              <button className={tweaks.heroAnim==='off'?'active':''} onClick={()=>setTweak('heroAnim','off')} style={{flex:1}}>Off</button>
            </div>
          </div>

          <div style={{marginBottom: 16}}>
            <div style={{fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--black-70)', marginBottom:8}}>Hero data source</div>
            <div className="segmented" style={{display:'flex', width:'100%'}}>
              <button className={(tweaks.heroSource||'cities')==='cities'?'active':''} onClick={()=>setTweak('heroSource','cities')} style={{flex:1}}>City-scale</button>
              <button className={tweaks.heroSource==='sites'?'active':''} onClick={()=>setTweak('heroSource','sites')} style={{flex:1}}>Real NPG sites</button>
            </div>
            <p style={{fontSize:12, color:'var(--black-70)', marginTop:8, lineHeight:1.4}}>
              {tweaks.heroSource==='sites'
                ? '93 real Grid Supply, Bulk Supply & strategic secondary substations from NPG open data — sized by purpose.'
                : '~30 named towns and cities across the licence area — abstract, legible.'}
            </p>
          </div>

          <div style={{marginBottom: 12}}>
            <label style={{display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:14, fontWeight:600}}>
              Show comparison table
              <input type="checkbox" checked={tweaks.showCompare} onChange={e=>setTweak('showCompare', e.target.checked)} />
            </label>
          </div>
          <div>
            <label style={{display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:14, fontWeight:600}}>
              Show “region in transition” band
              <input type="checkbox" checked={tweaks.showCallout} onChange={e=>setTweak('showCallout', e.target.checked)} />
            </label>
          </div>
        </div>
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
