/* Interface do hub: o acervo vem exclusivamente de catalogo.js. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const catalog = window.PortalHubCatalog, core = window.PortalHubCore;
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  if (!catalog || !core || !window.PortalHubMedia || !window.PortalHubLauncher) {
    $('intro').hidden = true; $('catalog').hidden = false;
    document.body.classList.remove('intro-mode');
    $('resultCount').textContent = 'Não foi possível carregar o catálogo. Atualize a página ou verifique se a pasta hub foi enviada junto com o index.html.';
    return;
  }
  const issues = core.validateCatalog(catalog);
  if (issues.length) {
    console.error('Portal 360º: cadastro inválido', issues);
    $('intro').hidden = true; $('catalog').hidden = false;
    document.body.classList.remove('intro-mode');
    $('resultCount').textContent = 'O cadastro de experiências precisa de revisão. Consulte o guia de manutenção.';
    return;
  }
  const items = catalog.experiences;
  const byId = new Map(items.map(app => [app.id, app]));
  const formatLabels = { '3d': '3D', vr: 'VR', '360': 'Vídeo 360°', simulacao: 'Simulação' };
  const levelLabels = { efi: 'Fundamental I', efii: 'Fundamental II', em: 'Ensino Médio' };
  const prefsKey = 'portal360_hub_preferences_v2', viewKey = 'portal360_hub_view_v2';
  let prefs = readJSON(localStorageSafe(), prefsKey, {});
  prefs = { favorites: Array.isArray(prefs.favorites) ? prefs.favorites.filter(id => byId.has(id)) : [], recent: Array.isArray(prefs.recent) ? prefs.recent.filter(id => byId.has(id)).slice(0, 20) : [] };
  let view = readJSON(sessionStorageSafe(), viewKey, {});
  if (!view || typeof view !== 'object' || Array.isArray(view)) view = {};
  const state = { query: String(view.query || ''), category: String(view.category || ''), level: String(view.level || ''), format: String(view.format || ''), order: String(view.order || 'recommended'), onlyFavorites: view.onlyFavorites === true };
  let xrSupport = null, media, toastTimer, detailApp = null, detailOpener = null, helpOpener = null;
  let restoredScroll = false, capabilityRequest = 0, recentDirty = false, lastOpenedId = null;

  function localStorageSafe() { try { return window.localStorage; } catch (_) { return null; } }
  function sessionStorageSafe() { try { return window.sessionStorage; } catch (_) { return null; } }
  function readJSON(storage, key, fallback) {
    try { const value = JSON.parse(storage && storage.getItem(key)); return value && typeof value === 'object' && !Array.isArray(value) ? value : fallback; } catch (_) { return fallback; }
  }
  function writeJSON(storage, key, value) { try { if (storage) storage.setItem(key, JSON.stringify(value)); } catch (_) {} }
  function savePrefs() { writeJSON(localStorageSafe(), prefsKey, prefs); }
  function saveView() { writeJSON(sessionStorageSafe(), viewKey, Object.assign({}, state, { scroll: window.scrollY })); }
  function toast(message) {
    $('toast').textContent = message; $('toast').hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('toast').hidden = true; }, 3400);
  }
  function icon(name) {
    const paths = {
      arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
      vr: '<rect x="3" y="6" width="18" height="12" rx="4"/><path d="m9 18 3-3 3 3M7 11h2m6 0h2"/>',
      screen: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/>',
      favorite: '<path d="m12 3 2.8 5.7 6.3.9-4.6 4.5 1.1 6.2L12 17.4l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z"/>',
      play: '<path d="m9 5 11 7-11 7z"/>',
      astronomy: '<circle cx="12" cy="12" r="4"/><ellipse cx="12" cy="12" rx="11" ry="5" transform="rotate(-30 12 12)"/>',
      biology: '<path d="M7 2c0 8 10 12 10 20M17 2C17 10 7 14 7 22M8 5h8M9 9h6M9 15h6M8 19h8"/>',
      earth: '<circle cx="12" cy="12" r="9"/><path d="m5 6 5 2-1 4 4 2 1 6m1-17-1 5 4 2 3-2"/>',
      collection: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>'
    };
    return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (paths[name] || paths.collection) + '</svg>';
  }
  function artIcon(app) { return app.category === 'astronomia' ? 'astronomy' : app.category === 'biologia' ? 'biology' : app.category === 'geociencias' ? 'earth' : 'collection'; }
  function levelText(app) {
    if (app.levels.length === 3) return 'Fundamental I ao Médio';
    return app.levels.map(x => levelLabels[x]).join(' e ');
  }
  function primaryMode(app) { return xrSupport === true && app.formats.includes('vr') ? 'vr' : '3d'; }
  function primaryLabel(app) { return primaryMode(app) === 'vr' ? 'Entrar em VR' : app.formats.includes('3d') ? 'Explorar em 3D' : 'Abrir experiência'; }
  function mediaCover(app, className) {
    return '<div class="card-art" aria-hidden="true">' + icon(artIcon(app)) + '</div>' + (app.cover ? '<img class="' + className + '" src="' + esc(app.cover) + '" alt="" loading="lazy" decoding="async">' : '');
  }
  function hookImages(scope) {
    scope.querySelectorAll('img').forEach(img => {
      const failed = () => { img.parentElement.classList.add('image-missing'); img.hidden = true; };
      img.addEventListener('error', failed, { once: true });
      if (img.complete && img.naturalWidth === 0) failed();
    });
  }
  function card(app) {
    const favorite = prefs.favorites.includes(app.id), soon = app.status === 'soon';
    return '<article class="experience-card' + (soon ? ' is-upcoming' : '') + '" data-app-id="' + esc(app.id) + '">' +
      '<div class="card-image-wrap' + (!app.cover ? ' image-missing' : '') + '">' + mediaCover(app, 'card-cover') +
      (soon ? '<span class="card-tag">Em desenvolvimento</span>' : '<button type="button" class="favorite-btn" data-action="favorite" data-id="' + esc(app.id) + '" aria-pressed="' + favorite + '" aria-label="' + (favorite ? 'Remover ' : 'Salvar ') + esc(app.title) + (favorite ? ' dos favoritos' : ' nos favoritos') + '">' + icon('favorite') + '</button>') + '</div>' +
      '<div class="card-content"><p class="card-category">' + esc(app.categoryLabel) + '</p><h3 class="card-title">' + esc(app.title) + '</h3><p class="card-summary">' + esc(app.summary) + '</p>' +
      '<div class="card-meta"><span>' + esc(levelText(app)) + '</span>' + (!soon ? '<span>' + app.formats.map(x => esc(formatLabels[x])).join(' · ') + '</span>' : '') + '</div>' +
      '<div class="card-actions">' + (!soon ? '<button type="button" class="card-primary" data-action="open" data-id="' + esc(app.id) + '">' + icon(primaryMode(app) === 'vr' ? 'vr' : 'arrow') + esc(primaryLabel(app)) + '</button>' : '') +
      '<button type="button" class="card-secondary" data-action="details" data-id="' + esc(app.id) + '">' + (soon ? 'Conhecer proposta' : 'Detalhes') + '</button></div></div></article>';
  }
  const categories = [...new Map(items.map(app => [app.category, app.categoryLabel])).entries()];
  if (state.category && !categories.some(([id]) => id === state.category)) state.category = '';
  function renderCategories() {
    $('categoryControls').innerHTML = [['', 'Todos os temas']].concat(categories).map(([id, label]) => '<button type="button" class="chip' + (id === state.category ? ' is-active' : '') + '" data-category="' + esc(id) + '" aria-pressed="' + (id === state.category) + '">' + esc(label) + '</button>').join('');
  }
  function render() {
    const filters = Object.assign({}, state, { favorites: prefs.favorites, status: 'available' });
    const available = core.sortExperiences(core.filterExperiences(items, filters), state.order, prefs.recent);
    const soon = state.onlyFavorites ? [] : core.filterExperiences(items, Object.assign({}, filters, { status: 'soon' }));
    $('gridCards').innerHTML = available.map(card).join('');
    $('gridUpcoming').innerHTML = soon.map(card).join('');
    $('emptyState').hidden = available.length > 0;
    $('upcomingSection').hidden = soon.length === 0;
    const total = items.filter(app => app.status === 'available').length;
    $('resultCount').textContent = available.length + (available.length === 1 ? ' experiência' : ' experiências') + (state.onlyFavorites ? ' nos favoritos' : ' de ' + total + ' disponíveis');
    $('btnFavorites').setAttribute('aria-pressed', String(state.onlyFavorites));
    $('btnFavorites').classList.toggle('is-active', state.onlyFavorites);
    $('clearFilters').disabled = !state.query && !state.category && !state.level && !state.format && !state.onlyFavorites && state.order === 'recommended';
    renderCategories(); hookImages($('gridCards')); hookImages($('gridUpcoming')); renderHero(); renderResume();
  }
  const featured = items.find(app => app.featured && app.status === 'available') || items.find(app => app.status === 'available');
  function renderHero() {
    if (!featured) { $('heroFeatured').hidden = true; return; }
    $('heroTitle').textContent = featured.title;
    $('heroSummary').textContent = featured.summary;
    $('heroCategory').textContent = featured.categoryLabel;
    $('heroOpen').innerHTML = esc(primaryLabel(featured)) + icon('arrow');
    const heroCover = $('heroCover');
    const src = featured.id === 'sistema-solar' ? 'assets/capa-sistema-solar-hero.webp' : featured.cover;
    if (heroCover.getAttribute('src') !== src) heroCover.src = src;
  }
  function renderResume() {
    const recent = byId.get(prefs.recent[0]);
    $('resumeArea').hidden = !recent || recent.status !== 'available';
    if (recent) $('resumeButton').textContent = 'Abrir novamente: ' + recent.title;
  }
  function remember(app) {
    prefs.recent = [app.id].concat(prefs.recent.filter(id => id !== app.id)).slice(0, 20);
    savePrefs(); renderResume();
    if (state.order === 'recent') recentDirty = true;
  }
  const launcher = window.PortalHubLauncher.create({
    version: catalog.version,
    onOpen: () => { saveView(); if (media) { media.closeLesson(); media.pauseBackground(); } document.body.classList.add('app-open'); },
    onClose: () => {
      document.body.classList.remove('app-open'); if (media) media.resumeBackground();
      if (recentDirty) { recentDirty = false; render(); }
      requestAnimationFrame(() => {
        if (document.querySelector('.ph-launcher[open]')) return;
        const focused = document.activeElement;
        if (!focused || focused === document.body || !focused.isConnected || focused.closest('.ph-launcher')) {
          const target = lastOpenedId && $('gridCards').querySelector('[data-action="open"][data-id="' + lastOpenedId + '"]');
          (target || $('heroOpen')).focus({ preventScroll: true });
        }
      });
    },
    onLaunch: app => remember(app)
  });
  function openApp(app, mode) {
    if (!app || app.status !== 'available') return;
    lastOpenedId = app.id;
    closeDetails();
    if ($('helpDialog').open) $('helpDialog').close();
    saveView();
    try { sessionStorage.setItem('portal360_intro_done', '1'); } catch (_) {}
    launcher.open(app, mode || primaryMode(app));
  }
  function closeDetails() { if ($('detailDialog').open) $('detailDialog').close(); }
  function showDetails(app) {
    detailApp = app;
    if (!$('detailDialog').open) detailOpener = document.activeElement;
    const soon = app.status === 'soon';
    $('detailBody').innerHTML = '<div class="detail-hero' + (!app.cover ? ' image-missing' : '') + '">' + mediaCover(app, 'detail-cover') + '</div>' +
      '<div class="detail-content"><p class="detail-category">' + esc(app.categoryLabel) + '</p><h2 class="detail-title" id="detailTitle">' + esc(app.title) + '</h2>' +
      '<p class="detail-description">' + esc(app.description) + '</p><div class="detail-meta"><span class="pill">' + esc(levelText(app)) + '</span>' + (!soon ? app.formats.map(x => '<span class="pill">' + esc(formatLabels[x]) + '</span>').join('') : '<span class="pill">Em desenvolvimento</span>') + '</div>' +
      '<section class="detail-section"><h3>' + (soon ? 'Objetivos previstos' : 'O que explorar') + '</h3><ul class="detail-list">' + app.objectives.map(text => '<li>' + esc(text) + '</li>').join('') + '</ul></section>' +
      (soon ? '<p class="detail-note">Esta experiência ainda está em desenvolvimento. Ela aparecerá no catálogo principal quando estiver disponível.</p>' :
        '<div class="detail-actions"><button type="button" class="button button-primary" data-action="open" data-id="' + esc(app.id) + '">' + icon(primaryMode(app) === 'vr' ? 'vr' : 'screen') + esc(primaryLabel(app)) + '</button>' +
        (app.formats.includes('vr') && primaryMode(app) !== 'vr' ? '<button type="button" class="button button-secondary" data-action="vr" data-id="' + esc(app.id) + '">' + icon('vr') + 'Usar com óculos VR</button>' : app.formats.includes('3d') && primaryMode(app) === 'vr' ? '<button type="button" class="button button-secondary" data-action="3d" data-id="' + esc(app.id) + '">' + icon('screen') + 'Explorar em 3D</button>' : '') +
        (app.videoId ? '<button type="button" class="button button-secondary" data-action="lesson" data-id="' + esc(app.id) + '">' + icon('play') + 'Assistir à videoaula</button>' : '') + '</div><p class="detail-note">Cada aplicação oferece seus próprios recursos de exploração e atividades.</p>') + '</div>';
    $('detailDialog').setAttribute('aria-labelledby', 'detailTitle');
    hookImages($('detailBody'));
    if (!$('detailDialog').open) $('detailDialog').showModal();
    $('closeDetail').focus();
  }
  $('closeDetail').addEventListener('click', closeDetails);
  $('detailDialog').addEventListener('close', () => { if (detailOpener && detailOpener.isConnected) detailOpener.focus(); });
  $('closeHelp').addEventListener('click', () => $('helpDialog').close());
  $('btnHelp').addEventListener('click', () => { helpOpener = document.activeElement; $('helpDialog').showModal(); $('closeHelp').focus(); });
  $('helpDialog').addEventListener('close', () => { if (helpOpener && helpOpener.isConnected) helpOpener.focus(); });
  [$('detailDialog'), $('helpDialog')].forEach(dialog => dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
  }));

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-action][data-id]');
    if (!button) return;
    const app = byId.get(button.dataset.id); if (!app) return;
    switch (button.dataset.action) {
      case 'open': openApp(app); break;
      case '3d': openApp(app, '3d'); break;
      case 'vr': openApp(app, 'vr'); break;
      case 'details': showDetails(app); break;
      case 'lesson': closeDetails(); media.openLesson(app); break;
      case 'favorite': {
        const exists = prefs.favorites.includes(app.id);
        prefs.favorites = exists ? prefs.favorites.filter(id => id !== app.id) : prefs.favorites.concat(app.id);
        savePrefs(); render();
        const target = $('gridCards').querySelector('[data-action="favorite"][data-id="' + app.id + '"]');
        if (target) target.focus(); else $('btnFavorites').focus();
        toast(exists ? 'Experiência removida dos favoritos.' : 'Experiência salva nos favoritos deste dispositivo.');
        break;
      }
    }
  });
  function applyFilters() {
    state.query = $('fBusca').value; state.level = $('fSerie').value; state.format = $('fFormato').value; state.order = $('fOrdem').value;
    saveView(); render();
  }
  function clearFilters() {
    Object.assign(state, { query: '', category: '', level: '', format: '', order: 'recommended', onlyFavorites: false });
    $('fBusca').value = ''; $('fSerie').value = ''; $('fFormato').value = ''; $('fOrdem').value = 'recommended';
    saveView(); render(); $('fBusca').focus();
  }
  $('categoryControls').addEventListener('click', event => {
    const button = event.target.closest('[data-category]'); if (!button) return;
    const id = button.dataset.category; state.category = id; applyFilters();
    const replacement = [...$('categoryControls').querySelectorAll('[data-category]')].find(el => el.dataset.category === id); if (replacement) replacement.focus();
  });
  $('btnFavorites').addEventListener('click', () => { state.onlyFavorites = !state.onlyFavorites; applyFilters(); $('experiencias').scrollIntoView({ behavior: 'auto', block: 'start' }); });
  $('fBusca').addEventListener('input', applyFilters);
  ['fSerie', 'fFormato', 'fOrdem'].forEach(id => $(id).addEventListener('change', applyFilters));
  $('clearFilters').addEventListener('click', clearFilters); $('resetEmpty').addEventListener('click', clearFilters);
  $('heroOpen').addEventListener('click', () => openApp(featured));
  $('heroDetails').addEventListener('click', () => { if (featured) showDetails(featured); });
  $('resumeButton').addEventListener('click', () => openApp(byId.get(prefs.recent[0])));
  $('fBusca').value = state.query; $('fSerie').value = state.level; $('fFormato').value = state.format; $('fOrdem').value = state.order;
  // Valores de uma versão anterior não devem deixar selects sem uma opção válida.
  if (!$('fOrdem').value) $('fOrdem').value = 'recommended';
  state.level = $('fSerie').value; state.format = $('fFormato').value; state.order = $('fOrdem').value;
  render(); hookImages(document);
  media = window.PortalHubMedia.create({ intro: catalog.intro, onExplore: app => openApp(app, '3d'), onCatalog: () => {
    if (!restoredScroll) {
      restoredScroll = true;
      if (Number.isFinite(view.scroll) && view.scroll > 0) requestAnimationFrame(() => window.scrollTo({ top: view.scroll, behavior: 'auto' }));
    }
  } });
  window.addEventListener('pagehide', saveView);
  async function detectXR() {
    const request = ++capabilityRequest;
    let timer, supported = null;
    try {
      if (!window.isSecureContext || !navigator.xr || typeof navigator.xr.isSessionSupported !== 'function') supported = false;
      else supported = await Promise.race([navigator.xr.isSessionSupported('immersive-vr'), new Promise(resolve => { timer = setTimeout(() => resolve(null), 4000); })]);
    } catch (_) { supported = false; } finally { clearTimeout(timer); }
    if (request !== capabilityRequest) return;
    xrSupport = supported;
    $('deviceStatus').textContent = xrSupport === true ? 'Navegador com suporte a VR' : xrSupport === null ? 'Explore em 3D ou verifique o VR em Ajuda' : 'Explore em 3D · para VR, abra no headset';
    $('deviceStatus').dataset.state = xrSupport === true ? 'ready' : 'neutral';
    const focused = document.activeElement;
    const focusAction = focused && focused.dataset.action, focusId = focused && focused.dataset.id;
    render();
    if (focusAction && focusId) {
      const replacement = document.querySelector('[data-action="' + focusAction + '"][data-id="' + focusId + '"]'); if (replacement) replacement.focus();
    }
    if ($('detailDialog').open && detailApp) showDetails(detailApp);
  }
  detectXR();
  if (navigator.xr && navigator.xr.addEventListener) navigator.xr.addEventListener('devicechange', detectXR);
})();
