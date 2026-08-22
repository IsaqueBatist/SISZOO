// SISZOO — Shell (sidebar + topbar) with role-aware nav and dropdowns
// Reads <body data-page="..."> and persists role in localStorage.

(function() {
  // ===== Role system =====
  const ROLE_KEY = 'siszoo_role';
  const ROLES = {
    admin: {
      label: 'Administrador', short: 'ADMIN', badgeCls: 'badge-role-admin',
      name: 'Paulo Henriques', initials: 'PH', email: 'paulo.henriques@itu.sp.gov.br',
      access: ['dashboard','animais','ocorrencias','processos','relatorios','baias','usuarios','config'],
    },
    vet: {
      label: 'Veterinária', short: 'VET', badgeCls: 'badge-role-vet',
      name: 'Stéphanie Lima', initials: 'SL', email: 'stephanie.lima@itu.sp.gov.br',
      access: ['dashboard','animais','ocorrencias','processos','relatorios','baias','config'],
    },
    agente: {
      label: 'Agente Sanitário', short: 'AGENTE', badgeCls: 'badge-role-agent',
      name: 'Rafael Santos', initials: 'RS', email: 'rafael.santos@itu.sp.gov.br',
      access: ['dashboard','animais','ocorrencias','processos','relatorios','config'],
    },
  };
  const currentRoleKey = (function() {
    try { return localStorage.getItem(ROLE_KEY) || 'vet'; } catch { return 'vet'; }
  })();
  const currentRole = ROLES[currentRoleKey] || ROLES.vet;
  window.SISZOO_ROLE = { key: currentRoleKey, ...currentRole };

  // ===== Nav definition =====
  const NAV_ALL = [
    { group: 'PRINCIPAL' },
    { id: 'dashboard',   label: 'Dashboard',           href: 'dashboard.html',   icon: iconHome() },
    { id: 'animais',     label: 'Animais',             href: 'animais.html',     icon: iconPaw() },
    { id: 'ocorrencias', label: 'Ocorrências',         href: 'ocorrencias.html', icon: iconAlert(), badge: 4 },
    { id: 'processos',   label: 'Processos Sanitários',href: 'processos.html',   icon: iconClipboard() },
    { id: 'relatorios',  label: 'Relatórios',          href: 'relatorios.html',  icon: iconChart() },
    { group: 'ADMINISTRAÇÃO' },
    { id: 'baias',       label: 'Gestão de Baias',     href: 'baias.html',       icon: iconGrid() },
    { id: 'usuarios',    label: 'Usuários',            href: 'usuarios.html',    icon: iconUsers() },
    { id: 'config',      label: 'Configurações',       href: 'configuracoes.html', icon: iconCog() },
  ];
  // Filter by role access; also drop a group label if no items below it remain
  const NAV = (function() {
    const allowed = new Set(currentRole.access);
    const out = [];
    NAV_ALL.forEach((item, i) => {
      if (item.group) {
        // peek ahead: only push if at least one following item (until next group) is allowed
        let hasItem = false;
        for (let j = i + 1; j < NAV_ALL.length; j++) {
          if (NAV_ALL[j].group) break;
          if (allowed.has(NAV_ALL[j].id)) { hasItem = true; break; }
        }
        if (hasItem) out.push(item);
        return;
      }
      if (allowed.has(item.id)) out.push(item);
    });
    return out;
  })();

  // ===== Breadcrumbs =====
  const BREADCRUMBS = {
    'dashboard':   [{ label: 'Dashboard', current: true }],
    'animais':     [{ label: 'Animais', href: 'animais.html' }, { label: 'Lista', current: true }],
    'animal':      [{ label: 'Animais', href: 'animais.html' }, { label: 'Ficha do Animal', current: true }],
    'cadastrar-animal': [{ label: 'Animais', href: 'animais.html' }, { label: 'Cadastrar novo', current: true }],
    'ocorrencias': [{ label: 'Ocorrências', href: 'ocorrencias.html' }, { label: 'Lista', current: true }],
    'ocorrencia':  [{ label: 'Ocorrências', href: 'ocorrencias.html' }, { label: 'Detalhe', current: true }],
    'cadastrar-ocorrencia': [{ label: 'Ocorrências', href: 'ocorrencias.html' }, { label: 'Registrar nova', current: true }],
    'processos':   [{ label: 'Processos Sanitários', href: 'processos.html' }, { label: 'Lista', current: true }],
    'processo':    [{ label: 'Processos Sanitários', href: 'processos.html' }, { label: 'Detalhe', current: true }],
    'relatorios':  [{ label: 'Relatórios', current: true }],
    'baias':       [{ label: 'Administração' }, { label: 'Gestão de Baias', current: true }],
    'usuarios':    [{ label: 'Administração' }, { label: 'Usuários', current: true }],
    'design-system': [{ label: 'Design System', current: true }],
    'configuracoes': [{ label: 'Configurações', current: true }],
    'perfil':      [{ label: 'Meu Perfil', current: true }],
    'ajuda':       [{ label: 'Central de Ajuda', current: true }],
  };

  const page = document.body.dataset.page || 'dashboard';

  // ===== Role-based redirect: if user can't access page, kick to dashboard =====
  const ACCESS_REDIRECT = {
    'usuarios': 'usuarios',
    'baias': 'baias',
    'processos': 'processos',
    'processo': 'processos',
  };
  const pageAccessKey = ACCESS_REDIRECT[page] || page;
  if (pageAccessKey !== 'design-system' && pageAccessKey !== 'index'
      && pageAccessKey !== 'perfil' && pageAccessKey !== 'ajuda'
      && !['login'].includes(page)
      && !currentRole.access.includes(pageAccessKey)
      && currentRole.access.includes('dashboard')) {
    // Soft-redirect with a notice — only redirect if page exists in nav model
    if (NAV_ALL.find(n => n.id === pageAccessKey)) {
      // Show a friendly "access denied" overlay rather than hard redirect, to make role gating visible
      window.SISZOO_BLOCKED = pageAccessKey;
    }
  }

  // Map detail pages back to their parent nav key
  const ACTIVE_KEY = {
    'animal': 'animais', 'cadastrar-animal': 'animais',
    'ocorrencia': 'ocorrencias', 'cadastrar-ocorrencia': 'ocorrencias',
    'processo': 'processos',
  };
  const activeKey = ACTIVE_KEY[page] || page;

  // ===== Build sidebar HTML =====
  let navHtml = '';
  for (const item of NAV) {
    if (item.group) {
      navHtml += `<div class="sidebar-group-label">${item.group}</div>`;
      continue;
    }
    const active = item.id === activeKey ? ' active' : '';
    const badge = item.badge ? `<span class="badge-count">${item.badge}</span>` : '';
    navHtml += `<a href="${item.href}" class="sidebar-item${active}" data-key="${item.id}">
      <span class="icon">${item.icon}</span>
      <span class="label">${item.label}</span>
      ${badge}
    </a>`;
  }

  const sidebar = `
    <aside class="sidebar">
      <div class="sidebar-header">
        <a href="dashboard.html" class="sidebar-logo" style="text-decoration:none;">
          <div class="wordmark">
            <span class="mark">${iconPaw('#fff')}</span>
            SISZOO
          </div>
          <div class="tagline">CCZ Itu</div>
        </a>
        <button class="sidebar-toggle" title="Recolher" id="sb-toggle">${iconChevronLeft()}</button>
      </div>
      <nav class="sidebar-nav">${navHtml}</nav>
      <div class="sidebar-footer">
        <div class="avatar">${currentRole.initials}</div>
        <div style="min-width:0;">
          <div class="user-name">${currentRole.name}</div>
          <div class="user-role">${currentRole.label}</div>
        </div>
        <button class="logout-btn" title="Sair" id="sb-logout">${iconLogout()}</button>
      </div>
    </aside>
  `;

  const crumbs = BREADCRUMBS[page] || BREADCRUMBS['dashboard'];
  const crumbHtml = crumbs.map((c, i) => {
    const sep = i < crumbs.length - 1 ? '<span class="sep">/</span>' : '';
    const cls = c.current ? 'crumb current' : 'crumb';
    const inner = c.href ? `<a href="${c.href}" class="${cls}">${c.label}</a>` : `<span class="${cls}">${c.label}</span>`;
    return `${inner}${sep}`;
  }).join(' ');

  const topbar = `
    <header class="topbar">
      <div class="breadcrumb">${crumbHtml}</div>
      <div class="global-search">
        <span class="search-icon">${iconSearch()}</span>
        <input type="text" placeholder="Buscar animal, protocolo, ocorrência..." />
      </div>
      <div class="topbar-actions">
        <span class="role-pill badge ${currentRole.badgeCls}" title="Papel atual">${currentRole.short}</span>
        <div class="dropdown-wrap" id="dd-help-wrap">
          <button class="icon-btn" title="Ajuda" id="dd-help-btn" aria-haspopup="true">${iconHelp()}</button>
          <div class="dropdown" id="dd-help">
            <div class="dd-header">Central de Ajuda</div>
            <a href="ajuda.html" class="dd-item">${iconHelp(14)}<span>Documentação do SISZOO</span></a>
            <a href="design-system.html" class="dd-item">${iconGrid()}<span>Design System</span></a>
            <a href="index.html" class="dd-item">${iconHome(14)}<span>Mapa do protótipo</span></a>
            <div class="dd-sep"></div>
            <a href="#" class="dd-item">${iconBell(14)}<span>Reportar problema</span></a>
            <a href="#" class="dd-item">${iconPhone(14)}<span>Suporte: (11) 4022-7777</span></a>
            <div class="dd-foot">SISZOO v1.0 · 2026</div>
          </div>
        </div>
        <div class="dropdown-wrap" id="dd-notif-wrap">
          <button class="icon-btn" title="Notificações" id="dd-notif-btn">${iconBell()}<span class="dot"></span></button>
          <div class="dropdown" id="dd-notif" style="width: 340px;">
            <div class="dd-header" style="display: flex; justify-content: space-between; align-items: center;">
              <span>Notificações</span>
              <a href="#" style="font-size: 11px;">Marcar tudo como lido</a>
            </div>
            <a href="processo.html" class="dd-notif-item urgent">
              <span class="dd-notif-ico" style="background: var(--color-danger-bg); color: var(--color-danger);">${iconAlert(14)}</span>
              <div>
                <div class="dd-notif-title">Processo 045/2026 — URGENTE</div>
                <div class="dd-notif-desc">Contato humano-animal confirmado. Resultado aguardando.</div>
                <div class="dd-notif-time">há 2h</div>
              </div>
            </a>
            <a href="animal.html" class="dd-notif-item">
              <span class="dd-notif-ico" style="background: var(--color-warning-bg); color: var(--color-warning);">${iconSyringe(14)}</span>
              <div>
                <div class="dd-notif-title">5 vacinas vencem em 7 dias</div>
                <div class="dd-notif-desc">Rex, Bolinha, Luna, Thor, Mel</div>
                <div class="dd-notif-time">há 3h</div>
              </div>
            </a>
            <a href="baias.html" class="dd-notif-item">
              <span class="dd-notif-ico" style="background: var(--color-warning-bg); color: var(--color-warning);">${iconGrid()}</span>
              <div>
                <div class="dd-notif-title">Baia 3 superlotada</div>
                <div class="dd-notif-desc">8 animais em 6 lugares — remanejar</div>
                <div class="dd-notif-time">há 4h</div>
              </div>
            </a>
            <a href="ocorrencias.html" class="dd-notif-item">
              <span class="dd-notif-ico" style="background: var(--color-info-bg); color: var(--color-info);">${iconAlert(14)}</span>
              <div>
                <div class="dd-notif-title">Nova ocorrência registrada</div>
                <div class="dd-notif-desc">089/2026 · Vila Esperança</div>
                <div class="dd-notif-time">há 5h</div>
              </div>
            </a>
            <div class="dd-foot"><a href="#">Ver todas as notificações →</a></div>
          </div>
        </div>
        <div class="dropdown-wrap" id="dd-user-wrap">
          <button class="topbar-user" id="dd-user-btn">
            <div class="avatar">${currentRole.initials}</div>
            <span class="name">${currentRole.name.split(' ')[0]}</span>
            ${iconChevronDown(14)}
          </button>
          <div class="dropdown" id="dd-user">
            <div class="dd-user-head">
              <div class="dd-user-avatar">${currentRole.initials}</div>
              <div>
                <div class="dd-user-name">${currentRole.name}</div>
                <div class="dd-user-email">${currentRole.email}</div>
                <span class="badge ${currentRole.badgeCls}" style="margin-top: 4px;">${currentRole.short}</span>
              </div>
            </div>
            <div class="dd-sep"></div>
            <a href="perfil.html" class="dd-item">${iconUser(14)}<span>Meu perfil</span></a>
            <a href="configuracoes.html" class="dd-item">${iconCog(14)}<span>Preferências</span></a>
            <a href="ajuda.html" class="dd-item">${iconHelp(14)}<span>Ajuda</span></a>
            <div class="dd-sep"></div>
            <div class="dd-role-switch">
              <div class="dd-role-label">Trocar papel (demo)</div>
              <div class="dd-role-chips" id="role-chips">
                ${Object.entries(ROLES).map(([k, r]) => `
                  <button class="dd-role-chip ${k === currentRoleKey ? 'active' : ''}" data-role="${k}">${r.short}</button>
                `).join('')}
              </div>
            </div>
            <div class="dd-sep"></div>
            <a href="login.html" class="dd-item danger" id="dd-logout">${iconLogout(14)}<span>Sair</span></a>
          </div>
        </div>
      </div>
    </header>
  `;

  // Style for dropdowns + role pill
  const ddStyles = `
    <style>
      .dropdown-wrap { position: relative; }
      .dropdown {
        position: absolute;
        right: 0; top: calc(100% + 6px);
        min-width: 240px;
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        box-shadow: 0 12px 32px rgba(0,0,0,0.14);
        padding: 6px;
        display: none;
        z-index: 100;
        animation: ddIn 150ms ease-out;
      }
      .dropdown.open { display: block; }
      @keyframes ddIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
      .dd-header { padding: 8px 12px 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-text-secondary); font-weight: 600; }
      .dd-item {
        display: flex; align-items: center; gap: 10px;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 13px;
        color: var(--color-text-primary);
        text-decoration: none;
      }
      .dd-item:hover { background: var(--color-bg); text-decoration: none; }
      .dd-item.danger { color: var(--color-danger); }
      .dd-item.danger:hover { background: var(--color-danger-bg); }
      .dd-sep { height: 1px; background: var(--color-border); margin: 4px 0; }
      .dd-foot { padding: 8px 12px; font-size: 11px; color: var(--color-text-muted); text-align: center; }
      .dd-user-head {
        display: flex; gap: 12px;
        padding: 12px;
      }
      .dd-user-avatar {
        width: 40px; height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, #4CAF50, #2E7D32);
        color: #fff; font-weight: 600;
        display: inline-flex; align-items: center; justify-content: center;
        flex-shrink: 0;
      }
      .dd-user-name { font-weight: 600; font-size: 14px; }
      .dd-user-email { font-size: 11px; color: var(--color-text-secondary); font-family: var(--font-mono); }
      .dd-role-switch { padding: 8px 12px; }
      .dd-role-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-text-secondary); font-weight: 600; margin-bottom: 6px; }
      .dd-role-chips { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
      .dd-role-chip {
        padding: 6px 8px;
        font-size: 11px; font-weight: 700;
        border: 1px solid var(--color-border);
        background: var(--color-surface);
        color: var(--color-text-secondary);
        border-radius: 6px;
        cursor: pointer;
        font-family: var(--font-body);
        letter-spacing: 0.06em;
      }
      .dd-role-chip:hover { border-color: var(--color-primary); color: var(--color-primary); }
      .dd-role-chip.active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
      .role-pill {
        background: var(--color-bg) !important;
        padding: 4px 10px !important;
        margin-right: 4px;
      }
      .dd-notif-item {
        display: flex; gap: 10px;
        padding: 10px 12px;
        border-radius: 6px;
        text-decoration: none;
        color: var(--color-text-primary);
      }
      .dd-notif-item:hover { background: var(--color-bg); text-decoration: none; }
      .dd-notif-item.urgent { background: rgba(198,40,40,0.04); }
      .dd-notif-item.urgent:hover { background: rgba(198,40,40,0.08); }
      .dd-notif-ico {
        width: 30px; height: 30px; border-radius: 8px;
        display: inline-flex; align-items: center; justify-content: center;
        flex-shrink: 0;
      }
      .dd-notif-title { font-size: 13px; font-weight: 600; }
      .dd-notif-desc { font-size: 11px; color: var(--color-text-secondary); }
      .dd-notif-time { font-size: 10px; color: var(--color-text-muted); margin-top: 2px; font-family: var(--font-mono); }

      /* Access blocked overlay */
      .blocked-overlay {
        background: var(--color-surface);
        border: 1px solid var(--color-warning-border);
        border-left: 4px solid var(--color-warning);
        border-radius: var(--radius-md);
        padding: 20px 24px;
        margin-bottom: var(--space-5);
        display: flex; gap: 16px; align-items: flex-start;
      }
      .blocked-overlay .b-ico {
        width: 40px; height: 40px;
        background: var(--color-warning-bg);
        color: var(--color-warning);
        border-radius: 10px;
        display: inline-flex; align-items: center; justify-content: center;
        flex-shrink: 0;
      }
      .blocked-overlay h4 { font-size: 15px; color: var(--color-warning); margin-bottom: 4px; }
      .blocked-overlay p { font-size: 13px; color: var(--color-text-secondary); }
    </style>
  `;

  // Inject
  const root = document.querySelector('[data-shell-root]');
  if (root) {
    const pageContent = root.innerHTML;
    let blockedHtml = '';
    if (window.SISZOO_BLOCKED) {
      blockedHtml = `<div class="blocked-overlay">
        <div class="b-ico">${iconLock()}</div>
        <div>
          <h4>Acesso restrito a ${window.SISZOO_BLOCKED}</h4>
          <p>Você está conectado como <strong>${currentRole.label}</strong> e não tem permissão para esta seção. O conteúdo abaixo está em modo somente leitura para fins de demonstração. Troque o papel pelo menu do usuário (canto superior direito) para visualizar com outras permissões.</p>
        </div>
      </div>`;
    }
    root.innerHTML = ddStyles + `
      <div class="app-shell">
        ${sidebar}
        <div class="main">
          ${topbar}
          <main class="page">${blockedHtml}${pageContent}</main>
        </div>
      </div>
    `;
    // Sidebar toggle
    const toggle = document.getElementById('sb-toggle');
    if (toggle) toggle.addEventListener('click', () => document.querySelector('.app-shell').classList.toggle('collapsed'));

    // Dropdowns
    function bindDropdown(btnId, ddId) {
      const btn = document.getElementById(btnId);
      const dd = document.getElementById(ddId);
      if (!btn || !dd) return;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Close other dropdowns
        document.querySelectorAll('.dropdown').forEach(x => { if (x !== dd) x.classList.remove('open'); });
        dd.classList.toggle('open');
      });
      dd.addEventListener('click', (e) => e.stopPropagation());
    }
    bindDropdown('dd-help-btn',  'dd-help');
    bindDropdown('dd-notif-btn', 'dd-notif');
    bindDropdown('dd-user-btn',  'dd-user');
    document.addEventListener('click', () => {
      document.querySelectorAll('.dropdown.open').forEach(d => d.classList.remove('open'));
    });

    // Role switcher
    document.querySelectorAll('.dd-role-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        try { localStorage.setItem(ROLE_KEY, chip.dataset.role); } catch {}
        location.reload();
      });
    });

    // Logout
    const sbLogout = document.getElementById('sb-logout');
    if (sbLogout) sbLogout.addEventListener('click', logout);
    const ddLogout = document.getElementById('dd-logout');
    if (ddLogout) ddLogout.addEventListener('click', (e) => {
      // Let the href navigate; just clear stale state
      try { /* keep role for demo; clear nothing */ } catch {}
    });
  }

  function logout() {
    // Soft logout — preserve role choice but go to login
    window.location.href = 'login.html';
  }

  // ===== Inline icon helpers =====
  function svg(d, opts) {
    const sw = (opts && opts.sw) || 2;
    const size = (opts && opts.size) || 18;
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  }
  function iconHome(s) { return svg('<path d="M3 12 12 3l9 9"/><path d="M5 10v10h14V10"/>', { size: s }); }
  function iconPaw(c) {
    const stroke = c || 'currentColor';
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="${stroke}"><circle cx="6" cy="9" r="2"/><circle cx="10" cy="5" r="2"/><circle cx="14" cy="5" r="2"/><circle cx="18" cy="9" r="2"/><path d="M12 11c-3 0-5 2.5-5 5 0 2 1.5 3 3 3 1 0 1.5-.5 2-.5s1 .5 2 .5c1.5 0 3-1 3-3 0-2.5-2-5-5-5z"/></svg>`;
  }
  function iconAlert(s) { return svg('<path d="M12 3 2 21h20L12 3z"/><line x1="12" y1="10" x2="12" y2="14"/><circle cx="12" cy="17.5" r="0.5" fill="currentColor"/>', { size: s }); }
  function iconClipboard() { return svg('<rect x="6" y="4" width="12" height="16" rx="2"/><path d="M9 4h6v3H9z"/><line x1="9" y1="11" x2="15" y2="11"/><line x1="9" y1="15" x2="13" y2="15"/>'); }
  function iconChart() { return svg('<line x1="4" y1="20" x2="20" y2="20"/><rect x="6" y="11" width="3" height="8"/><rect x="11" y="6" width="3" height="13"/><rect x="16" y="14" width="3" height="5"/>'); }
  function iconGrid() { return svg('<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>'); }
  function iconUsers() { return svg('<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2"/><path d="M3 19c1-3 3-5 6-5s5 2 6 5"/><path d="M15 19c.5-2 2-3 3.5-3"/>'); }
  function iconCog(s) { return svg('<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2.1-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2l-.4-2.6h-4l-.4 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2.1 1.6A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2.1 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2l.4 2.6h4l.4-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2.1-1.6c.1-.4.1-.8.1-1.2z"/>', { size: s }); }
  function iconSearch() { return svg('<circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="20" y2="20"/>'); }
  function iconBell(s) { return svg('<path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 2h16l-2-2z"/><path d="M10 21a2 2 0 0 0 4 0"/>', { size: s }); }
  function iconHelp(s) { return svg('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 4 2c-1 0-1.5 1-1.5 2"/><circle cx="12" cy="17" r="0.5" fill="currentColor"/>', { size: s }); }
  function iconChevronLeft() { return svg('<polyline points="14 6 8 12 14 18"/>'); }
  function iconChevronDown(s) { return svg('<polyline points="6 9 12 15 18 9"/>', { size: s || 14 }); }
  function iconLogout(s) { return svg('<path d="M14 4h4v16h-4"/><polyline points="9 16 4 12 9 8"/><line x1="4" y1="12" x2="14" y2="12"/>', { size: s || 14 }); }
  function iconUser(s) { return svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c1-5 4-7 8-7s7 2 8 7"/>', { size: s }); }
  function iconPhone(s) { return svg('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>', { size: s }); }
  function iconSyringe(s) { return svg('<path d="M14 3l7 7"/><path d="M16 5l-9 9 3 3 9-9"/><path d="M10 17l-4 4"/><path d="M6 13l4 4"/>', { size: s }); }
  function iconLock(s) { return svg('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', { size: s || 20 }); }
})();
