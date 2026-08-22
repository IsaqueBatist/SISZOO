// SISZOO — Tweaks panel (vanilla)
// Allows the user to live-tweak visual aspects across all pages.
// Persists choices in localStorage so they survive page navigation.

(function() {
  const STORAGE_KEY = 'siszoo_tweaks';

  const DEFAULTS = {
    primaryHue: 'institutional', // institutional | forest | teal | navy
    density:    'comfortable',   // compact | comfortable | spacious
    radius:     'medium',        // sharp | medium | rounded
    bodyFont:   'inter',         // inter | manrope | sourceSans
    animalLayout: 'timeline',    // timeline | tabs
  };

  const HUES = {
    institutional: { primary: '#1B5E20', hover: '#2E7D32', light: '#E8F5E9', mid: '#4CAF50', sidebar: '#1B5E20' },
    forest:        { primary: '#1F4D2E', hover: '#316b48', light: '#E4EFE7', mid: '#4F8C68', sidebar: '#1F4D2E' },
    teal:          { primary: '#0F5257', hover: '#1A7882', light: '#DEF1F2', mid: '#3FA5AE', sidebar: '#0F5257' },
    navy:          { primary: '#1B3A6E', hover: '#2C5BA3', light: '#E3EAF5', mid: '#4D7CC8', sidebar: '#1B3A6E' },
  };

  const RADII = {
    sharp:   { sm: '2px', md: '4px',  lg: '6px',  xl: '8px'  },
    medium:  { sm: '6px', md: '10px', lg: '14px', xl: '20px' },
    rounded: { sm: '10px', md: '14px', lg: '20px', xl: '28px' },
  };

  const DENSITY = {
    compact:     { s4: '12px', s5: '14px', s6: '18px', s8: '24px', tb: '52px' },
    comfortable: { s4: '16px', s5: '20px', s6: '24px', s8: '32px', tb: '64px' },
    spacious:    { s4: '20px', s5: '24px', s6: '32px', s8: '40px', tb: '72px' },
  };

  const FONTS = {
    inter:      "'Inter', system-ui, sans-serif",
    manrope:    "'Manrope', system-ui, sans-serif",
    sourceSans: "'Source Sans 3', system-ui, sans-serif",
  };

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULTS };
      return { ...DEFAULTS, ...JSON.parse(raw) };
    } catch { return { ...DEFAULTS }; }
  }
  function save(t) { localStorage.setItem(STORAGE_KEY, JSON.stringify(t)); }

  function apply(t) {
    const root = document.documentElement.style;
    const hue = HUES[t.primaryHue] || HUES.institutional;
    root.setProperty('--color-primary', hue.primary);
    root.setProperty('--color-primary-hover', hue.hover);
    root.setProperty('--color-primary-light', hue.light);
    root.setProperty('--color-primary-mid', hue.mid);
    root.setProperty('--sidebar-bg', hue.sidebar);

    const r = RADII[t.radius] || RADII.medium;
    root.setProperty('--radius-sm', r.sm);
    root.setProperty('--radius-md', r.md);
    root.setProperty('--radius-lg', r.lg);
    root.setProperty('--radius-xl', r.xl);

    const d = DENSITY[t.density] || DENSITY.comfortable;
    root.setProperty('--space-4', d.s4);
    root.setProperty('--space-5', d.s5);
    root.setProperty('--space-6', d.s6);
    root.setProperty('--space-8', d.s8);
    root.setProperty('--topbar-height', d.tb);

    root.setProperty('--font-body', FONTS[t.bodyFont] || FONTS.inter);

    // Animal layout — handled by the animal page if present
    document.body.setAttribute('data-animal-layout', t.animalLayout);
  }

  let tweaks = load();
  apply(tweaks);

  // Build panel
  function buildPanel() {
    if (document.getElementById('tweaks-panel')) return;
    const panel = document.createElement('div');
    panel.id = 'tweaks-panel';
    panel.innerHTML = `
      <style>
        #tweaks-panel {
          position: fixed; right: 20px; bottom: 20px;
          width: 320px; max-height: 80vh; overflow-y: auto;
          background: #fff;
          border: 1px solid #E0E4EA;
          border-radius: 14px;
          box-shadow: 0 16px 40px rgba(0,0,0,0.18);
          z-index: 999;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          color: #1A2332;
          display: none;
        }
        #tweaks-panel.open { display: block; animation: tw-in 200ms ease-out; }
        @keyframes tw-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        #tweaks-panel .tw-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 16px;
          border-bottom: 1px solid #E0E4EA;
        }
        #tweaks-panel h4 { margin: 0; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 600; }
        #tweaks-panel .tw-sub { color: #5A6A7E; font-size: 11px; }
        #tweaks-panel .tw-close {
          background: transparent; border: none; cursor: pointer; padding: 4px;
          color: #5A6A7E; border-radius: 6px;
        }
        #tweaks-panel .tw-close:hover { background: #F4F6F8; }
        #tweaks-panel .tw-body { padding: 14px 16px; display: flex; flex-direction: column; gap: 16px; }
        #tweaks-panel .tw-section h5 {
          margin: 0 0 8px; font-size: 11px; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.08em;
          color: #5A6A7E; font-family: 'Inter', sans-serif;
        }
        #tweaks-panel .tw-row { display: flex; gap: 6px; flex-wrap: wrap; }
        #tweaks-panel .tw-chip {
          padding: 7px 11px;
          border: 1px solid #E0E4EA;
          border-radius: 7px;
          cursor: pointer;
          font-size: 12px;
          background: #fff;
          color: #5A6A7E;
          font-family: 'Inter', sans-serif;
        }
        #tweaks-panel .tw-chip.active {
          border-color: var(--color-primary);
          background: var(--color-primary-light);
          color: var(--color-primary);
          font-weight: 600;
        }
        #tweaks-panel .tw-swatch { display: flex; align-items: center; gap: 8px; }
        #tweaks-panel .tw-swatch .dot { width: 14px; height: 14px; border-radius: 4px; }
      </style>
      <div class="tw-header">
        <div>
          <h4>Tweaks</h4>
          <div class="tw-sub">Ajuste o visual em tempo real</div>
        </div>
        <button class="tw-close" aria-label="Fechar">&times;</button>
      </div>
      <div class="tw-body" id="tw-body"></div>
    `;
    document.body.appendChild(panel);
    panel.querySelector('.tw-close').addEventListener('click', () => deactivate());
    return panel;
  }

  function renderControls() {
    const body = document.getElementById('tw-body');
    if (!body) return;
    body.innerHTML = `
      <div class="tw-section">
        <h5>Tom institucional</h5>
        <div class="tw-row" data-key="primaryHue">
          ${Object.entries(HUES).map(([k, v]) => `
            <button class="tw-chip ${tweaks.primaryHue === k ? 'active' : ''}" data-val="${k}">
              <span class="tw-swatch"><span class="dot" style="background:${v.primary}"></span>${labelHue(k)}</span>
            </button>
          `).join('')}
        </div>
      </div>
      <div class="tw-section">
        <h5>Densidade</h5>
        <div class="tw-row" data-key="density">
          ${['compact', 'comfortable', 'spacious'].map(k => `
            <button class="tw-chip ${tweaks.density === k ? 'active' : ''}" data-val="${k}">${labelDensity(k)}</button>
          `).join('')}
        </div>
      </div>
      <div class="tw-section">
        <h5>Cantos</h5>
        <div class="tw-row" data-key="radius">
          ${['sharp', 'medium', 'rounded'].map(k => `
            <button class="tw-chip ${tweaks.radius === k ? 'active' : ''}" data-val="${k}">${labelRadius(k)}</button>
          `).join('')}
        </div>
      </div>
      <div class="tw-section">
        <h5>Fonte do corpo</h5>
        <div class="tw-row" data-key="bodyFont">
          ${['inter', 'manrope', 'sourceSans'].map(k => `
            <button class="tw-chip ${tweaks.bodyFont === k ? 'active' : ''}" data-val="${k}">${labelFont(k)}</button>
          `).join('')}
        </div>
      </div>
      <div class="tw-section">
        <h5>Ficha do Animal</h5>
        <div class="tw-row" data-key="animalLayout">
          <button class="tw-chip ${tweaks.animalLayout === 'timeline' ? 'active' : ''}" data-val="timeline">Timeline</button>
          <button class="tw-chip ${tweaks.animalLayout === 'tabs' ? 'active' : ''}" data-val="tabs">Abas</button>
        </div>
      </div>
    `;
    body.querySelectorAll('.tw-row').forEach(row => {
      const key = row.dataset.key;
      row.querySelectorAll('.tw-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          tweaks[key] = chip.dataset.val;
          save(tweaks);
          apply(tweaks);
          renderControls();
          // Notify other pages via storage event listener (handled below)
          window.dispatchEvent(new CustomEvent('siszoo:tweaks', { detail: tweaks }));
        });
      });
    });
  }

  function labelHue(k) {
    return { institutional: 'Verde Itu', forest: 'Floresta', teal: 'Teal', navy: 'Marinho' }[k] || k;
  }
  function labelDensity(k) {
    return { compact: 'Compacto', comfortable: 'Padrão', spacious: 'Espaçoso' }[k] || k;
  }
  function labelRadius(k) {
    return { sharp: 'Reto', medium: 'Médio', rounded: 'Arredondado' }[k] || k;
  }
  function labelFont(k) {
    return { inter: 'Inter', manrope: 'Manrope', sourceSans: 'Source Sans' }[k] || k;
  }

  function activate() {
    const p = buildPanel();
    renderControls();
    p.classList.add('open');
  }
  function deactivate() {
    const p = document.getElementById('tweaks-panel');
    if (p) p.classList.remove('open');
    try { window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*'); } catch {}
  }

  // Wire up the host protocol — register listener FIRST then announce
  window.addEventListener('message', (e) => {
    if (!e.data || typeof e.data !== 'object') return;
    if (e.data.type === '__activate_edit_mode') activate();
    if (e.data.type === '__deactivate_edit_mode') deactivate();
  });
  try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch {}

  // Cross-tab sync
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      try { tweaks = JSON.parse(e.newValue); apply(tweaks); renderControls(); } catch {}
    }
  });
})();
