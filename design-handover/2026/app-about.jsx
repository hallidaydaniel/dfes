/* DFES 2026 prototype — About / scenario comparison + Footer */
/* eslint-disable */

const Dx = window.DFES_DATA;
const IconX = window.DFESLib.Icon;

function ScenarioCards() {
  return (
    <section className="about-band" id="about" data-screen-label="04 Scenarios">
      <div className="holder">
        <div className="about-head">
          <div className="eyebrow eye-red">Scenarios at a glance</div>
          <h2>Five futures for the North</h2>
          <p>
            Together with ERM and our stakeholders we model five distinct pathways to 2050.
            Four reach net zero by different routes. One does not — it shows what business
            as usual would look like.
          </p>
        </div>

        <div className="scenario-grid">
          {Dx.scenarios.map(s => (
            <article key={s.id} className="scen-card">
              <div className="topbar" style={{background: s.color}}/>
              <div className="scen-eye">{s.short}</div>
              <h3>{s.name}</h3>
              <span className={'nz-pill ' + (s.netZero ? 'yes' : 'no')}>
                {s.netZero ? <IconX name="check" size={12}/> : <IconX name="x" size={12}/>}
                {s.netZero ? 'Net zero by 2050' : 'Misses 2050'}
              </span>
              <p className="scen-desc">{s.desc}</p>
              <div className="scen-stats">
                {s.stats.map((st, i) => (
                  <div className="scen-stat" key={i}>
                    <span className="k">{st.k}</span>
                    <span className="v">{st.v}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function CompareTable() {
  const rows = [
    { k: 'Heating strategy', vals: ['Heat pumps lead', 'Mostly electric, some H₂', 'All electric', 'H₂ boilers + heat pumps', 'Mostly gas'] },
    { k: 'ICE vehicle ban', vals: ['2030', '2035', '2035', '2035', '2040'] },
    { k: 'Industrial H₂ (TWh by 2040)', vals: ['10+', '10+', '10+', '15+', '<5'] },
    { k: 'Peak demand 2050', vals: ['+62%', '+48%', '+71%', '+34%', '+18%'] },
    { k: 'Grid flexibility', vals: ['High', 'High', 'Highest', 'Lower', 'Lowest'] }
  ];
  return (
    <section className="compare-band" data-screen-label="05 Compare">
      <div className="holder">
        <div className="about-head" style={{maxWidth: 720, marginBottom: 'var(--sp-6)'}}>
          <div className="eyebrow eye-red">Side-by-side</div>
          <h2 style={{fontSize: 'clamp(28px, 3.5vw, 40px)'}}>How the scenarios stack up</h2>
        </div>
        <div style={{overflowX: 'auto', border: '1px solid var(--navy-10)', borderRadius: 'var(--r-md)'}}>
        <table className="compare-table">
          <thead>
            <tr>
              <th>Assumption</th>
              {Dx.scenarios.map(s => (
                <th key={s.id}>
                  <span className="swatch-cell">
                    <span className="sw" style={{background: s.color}}/>
                    {s.short}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.k}>
                <td className="row-label">{r.k}</td>
                {r.vals.map((v, i) => <td key={i}>{v}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </section>
  );
}

function CalloutBand() {
  return (
    <section className="callout-band" data-screen-label="06 Callout">
      <div className="holder">
        <div className="callout-grid">
          <div>
            <div className="eyebrow eye-red">A region in transition</div>
            <h2>Working with you to shape the grid we’ll all rely on.</h2>
            <p className="quote">
              “From Newcastle to Hull, every postcode in our patch shows up in
              this model. That’s how plans for 3.9 million customers get made.”
            </p>
          </div>
          <div className="callout-numbers">
            <div className="callout-num">
              <div className="v">96k</div>
              <div className="l">Kilometres of cable kept running, day and night.</div>
            </div>
            <div className="callout-num">
              <div className="v">63k</div>
              <div className="l">Substations forecast across every scenario.</div>
            </div>
            <div className="callout-num">
              <div className="v">27</div>
              <div className="l">Years of forecasts — from 2024 through 2050.</div>
            </div>
            <div className="callout-num">
              <div className="v">5</div>
              <div className="l">Scenarios stress-tested against ENA Open Networks.</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="site-footer" data-screen-label="07 Footer">
      <div className="holder">
        <div className="footer-top">
          <div>
            <h4>Don’t be a stranger.</h4>
            <p>
              Our system forecasting team is here for stakeholders, planners
              and partners. Questions, corrections, partnerships — send them through.
            </p>
            <a href="mailto:System.Forecasting@Northernpowergrid.com" className="btn btn--primary">
              Get in touch <IconX name="arrow-right" size={14}/>
            </a>
          </div>
          <div className="footer-col">
            <div className="col-eye">DFES</div>
            <ul>
              <li><a>2026 (this report)</a></li>
              <li><a>2024 archive</a></li>
              <li><a>2023 archive</a></li>
              <li><a>All previous years</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <div className="col-eye">Data &amp; tools</div>
            <ul>
              <li><a>Open Data Portal</a></li>
              <li><a>Methodology</a></li>
              <li><a>Download CSVs</a></li>
              <li><a>Report an issue</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <div className="col-eye">Northern Powergrid</div>
            <ul>
              <li><a>Power cuts · 105</a></li>
              <li><a>Connections</a></li>
              <li><a>Priority Services</a></li>
              <li><a>About us</a></li>
            </ul>
          </div>
        </div>
        <div className="partners">
          <span className="partner-eye">In partnership with</span>
          <div className="partner-row">
            <span style={{color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: 600}}>Open Innovations</span>
            <span style={{color: 'rgba(255,255,255,0.4)'}}>·</span>
            <span style={{color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: 600}}>ERM</span>
          </div>
        </div>
        <div className="footer-bottom">
          <div>
            © Northern Powergrid 2026. Visualisation © Open Innovations.
            DFES data © Northern Powergrid &amp; ERM, released under CC-BY.
          </div>
          <div>
            <a>Accessibility</a> &nbsp;·&nbsp; <a>Open Data Licence</a> &nbsp;·&nbsp; <a>Privacy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

window.DFESLib3 = { ScenarioCards, CompareTable, CalloutBand, Footer };
