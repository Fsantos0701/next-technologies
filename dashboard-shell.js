(function () {
  const NAV_ITEMS = [
    { page: 'dashboard', href: '/dashboard.html', icon: 'icon-grid', label: 'Dashboard' },
    { page: 'vendas', href: '/vendas.html', icon: 'icon-cart', label: 'Vendas' },
    { page: 'transacoes', href: '/transacoes.html', icon: 'icon-activity', label: 'Transações' },
    { page: 'contestacoes', href: '/contestacoes.html', icon: 'icon-alert', label: 'Contestações' },
    { page: 'recuperacao', href: '/recuperacao.html', icon: 'icon-repeat', label: 'Recuperação' },
    { page: 'taxas', href: '/taxas.html', icon: 'icon-percent', label: 'Taxas' },
    { page: 'saques', href: '/saques.html', icon: 'icon-wallet', label: 'Saques' },
    { page: 'integracoes', href: '/integracoes.html', icon: 'icon-plug', label: 'Integrações' },
    { page: 'apis', href: '/apis.html', icon: 'icon-code', label: 'APIs' },
    { page: 'webhooks', href: '/webhooks.html', icon: 'icon-branch', label: 'Webhooks' },
    { page: 'emails', href: '/emails.html', icon: 'icon-mail', label: 'E-mails' },
    { page: 'relatorios', href: '/relatorios.html', icon: 'icon-file-text', label: 'Relatórios' },
    { page: 'configuracoes', href: '/configuracoes.html', icon: 'icon-settings', label: 'Configurações' },
    { page: 'suporte', href: '/suporte.html', icon: 'icon-headset', label: 'Suporte' },
  ];

  const ICON_SPRITE = `
    <symbol id="icon-grid" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></symbol>
    <symbol id="icon-cart" viewBox="0 0 24 24"><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.4 12.4a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L22 7H6"/></symbol>
    <symbol id="icon-activity" viewBox="0 0 24 24"><path d="M3 12h4l2 7 4-14 2 7h6"/></symbol>
    <symbol id="icon-alert" viewBox="0 0 24 24"><path d="M12 3l10 18H2L12 3z"/><path d="M12 10v4"/><path d="M12 17.5v.01"/></symbol>
    <symbol id="icon-repeat" viewBox="0 0 24 24"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></symbol>
    <symbol id="icon-percent" viewBox="0 0 24 24"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></symbol>
    <symbol id="icon-wallet" viewBox="0 0 24 24"><path d="M20 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 5H4"/><circle cx="17" cy="13" r="1.4"/></symbol>
    <symbol id="icon-plug" viewBox="0 0 24 24"><path d="M9 2v4"/><path d="M15 2v4"/><path d="M6 8h12v4a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5V8z"/><path d="M12 17v5"/></symbol>
    <symbol id="icon-code" viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></symbol>
    <symbol id="icon-branch" viewBox="0 0 24 24"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></symbol>
    <symbol id="icon-mail" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></symbol>
    <symbol id="icon-file-text" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></symbol>
    <symbol id="icon-settings" viewBox="0 0 24 24"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></symbol>
    <symbol id="icon-headset" viewBox="0 0 24 24"><path d="M4 13v-1a8 8 0 0 1 16 0v1"/><rect x="2" y="13" width="5" height="7" rx="2"/><rect x="17" y="13" width="5" height="7" rx="2"/><path d="M20 20a4 4 0 0 1-4 3h-2"/></symbol>
    <symbol id="icon-bell" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6"/><path d="M10 21a2 2 0 0 0 4 0"/></symbol>
    <symbol id="icon-download" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></symbol>
    <symbol id="icon-bar-chart" viewBox="0 0 24 24"><path d="M4 20V10"/><path d="M12 20V4"/><path d="M20 20v-7"/></symbol>
    <symbol id="icon-trending-up" viewBox="0 0 24 24"><path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/></symbol>
    <symbol id="icon-receipt" viewBox="0 0 24 24"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z"/><path d="M9 8h6"/><path d="M9 12h6"/></symbol>
    <symbol id="icon-check" viewBox="0 0 24 24"><path d="M4 12l5 5L20 6"/></symbol>
    <symbol id="icon-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></symbol>
    <symbol id="icon-calendar" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></symbol>
    <symbol id="icon-inbox" viewBox="0 0 24 24"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></symbol>
    <symbol id="icon-shield-check" viewBox="0 0 24 24"><path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/></symbol>
    <symbol id="icon-eye" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></symbol>
    <symbol id="icon-eye-off" viewBox="0 0 24 24"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a19.7 19.7 0 0 1 5.06-5.94M9.9 4.24A10.4 10.4 0 0 1 12 4c7 0 11 8 11 8a19.7 19.7 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24"/><path d="M1 1l22 22"/></symbol>
    <symbol id="icon-copy" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></symbol>
    <symbol id="icon-refresh" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></symbol>
    <symbol id="icon-trash" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></symbol>
  `;

  function navHtml(activePage) {
    return NAV_ITEMS.map((item) => (
      '<a href="' + item.href + '" class="dash-nav-item' + (item.page === activePage ? ' is-active' : '') + '">' +
      '<svg class="icon"><use href="#' + item.icon + '"></use></svg>' + item.label +
      '</a>'
    )).join('');
  }

  function shellHtml(activePage) {
    return (
      '<a href="/" class="logo dash-logo">' +
      '<svg width="30" height="30" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<rect width="100" height="100" rx="22" fill="url(#logoGrad)"/>' +
      '<path d="M28 70V30h9l26 27V30h9v40h-9L37 43v27z" fill="#061024"/>' +
      '<defs><linearGradient id="logoGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">' +
      '<stop stop-color="#00E0C6"/><stop offset="1" stop-color="#2F6BFF"/></linearGradient></defs>' +
      '</svg><span class="logo-word">NEXT <b>TECHNOLOGIES</b></span></a>' +
      '<nav class="dash-nav"><span class="dash-nav-label">Minha loja</span>' + navHtml(activePage) + '</nav>'
    );
  }

  function topbarHtml(title, subtitle) {
    return (
      '<div><h1 class="dash-title">' + title + '</h1>' +
      '<p class="dash-subtitle">' + subtitle + ' · <span id="dashName"></span></p></div>' +
      '<div class="dash-topbar-actions">' +
      '<button class="dash-icon-btn" aria-label="Notificações" type="button"><svg class="icon"><use href="#icon-bell"></use></svg></button>' +
      '<div class="dash-user"><span class="dash-avatar" id="dashAvatar"></span><span class="dash-user-name" id="dashWelcome"></span></div>' +
      '<button class="btn btn-outline btn-sm" id="logoutBtn" type="button">Sair</button>' +
      '</div>'
    );
  }

  window.DashboardShell = {
    async init({ page, title, subtitle }) {
      const sidebar = document.getElementById('dashSidebar');
      const topbar = document.getElementById('dashTopbar');
      if (sidebar) sidebar.innerHTML = shellHtml(page);
      if (topbar) topbar.innerHTML = topbarHtml(title, subtitle);

      const spriteWrap = document.createElement('div');
      spriteWrap.innerHTML = '<svg class="icon-sprite" aria-hidden="true" focusable="false"><defs>' + ICON_SPRITE + '</defs></svg>';
      document.body.appendChild(spriteWrap.firstElementChild);

      const res = await fetch('/api/me');
      if (!res.ok) { window.location.href = '/login.html'; return null; }
      const { user } = await res.json();

      document.getElementById('dashWelcome').textContent = user.name;
      document.getElementById('dashName').textContent = user.name;
      document.getElementById('dashAvatar').textContent = user.name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

      if (user.isAdmin && sidebar) {
        const nav = sidebar.querySelector('.dash-nav');
        const label = document.createElement('span');
        label.className = 'dash-nav-label';
        label.style.marginTop = '14px';
        label.textContent = 'Administração';
        const link = document.createElement('a');
        link.href = '/admin.html';
        link.className = 'dash-nav-item' + (page === 'admin' ? ' is-active' : '');
        link.innerHTML = '<svg class="icon"><use href="#icon-shield-check"></use></svg>Usuários';
        nav.appendChild(label);
        nav.appendChild(link);
      }

      document.getElementById('logoutBtn').addEventListener('click', async () => {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = '/login.html';
      });

      document.dispatchEvent(new CustomEvent('shell:ready', { detail: { user } }));
      return user;
    },
  };
})();
