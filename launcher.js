/* Portal 360º VR — one selected experience, one iframe, explicit user activation.
 * Optional lifecycle contract: hub/bridge.js. Legacy apps expose alternarVR('vr').
 * Never infer an XR session from a resolved request or patch navigator.xr.
 */
(function (global) {
  'use strict';

  const ICON_CLOSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';
  const ICON_BACK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6M8 12h12"/></svg>';
  const ICON_VR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6h14a2 2 0 0 1 2 2l1 8a2 2 0 0 1-2 2h-5l-3-3-3 3H4a2 2 0 0 1-2-2l1-8a2 2 0 0 1 2-2Z"/><path d="M7 10v3m-1.5-1.5h3M17 10v3m-1.5-1.5h3"/></svg>';
  const waitLimit = 30000;
  let instanceNumber = 0;

  function create(options) {
    const opts = options || {};
    const identifier = ++instanceNumber;
    let dialog = null;
    let ui = null;
    let frame = null;
    let active = null;
    let generation = 0;
    let poll = null;
    let timeout = null;
    let supportTimeout = null;
    let requestTimer = null;
    let restoreFocus = null;
    let previousOverflow = '';
    let emittedLaunch = false;
    let canEnter = false;
    let bridgeReady = false;
    let hasSession = false;
    let requesting = false;
    let xrSupport = false;

    function notify(name) {
      if (typeof opts[name] !== 'function') return;
      try { opts[name].apply(null, Array.prototype.slice.call(arguments, 1)); }
      catch (err) { console.warn('Portal 360: callback ' + name + ' falhou.', err); }
    }

    function urlFor(app, mode, embedded) {
      if (!app || typeof app.path !== 'string' || !app.path.trim()) throw new Error('O endereço desta experiência não foi cadastrado.');
      const url = new URL(app.path, document.baseURI);
      if (!/^https?:$/.test(url.protocol)) throw new Error('Abra o portal por um endereço HTTP ou HTTPS para carregar as experiências.');
      url.searchParams.delete('vr');
      url.searchParams.delete('embed');
      url.searchParams.delete('quiosque');
      if (mode === 'vr' && !embedded) url.searchParams.set('vr', '1');
      if (embedded) {
        url.searchParams.set('embed', '1');
        url.searchParams.set('quiosque', '0');
      }
      if (opts.version) url.searchParams.set('v', String(opts.version));
      return url;
    }

    function stopTimers() {
      clearInterval(poll); poll = null;
      clearTimeout(timeout); timeout = null;
      clearTimeout(supportTimeout); supportTimeout = null;
      clearTimeout(requestTimer); requestTimer = null;
    }

    function removeFrame() {
      if (!frame) return;
      frame.remove();
      frame = null;
    }

    function emitLaunch() {
      if (emittedLaunch || !active) return;
      emittedLaunch = true;
      notify('onLaunch', active.app, active.mode);
    }

    function offers3D() {
      return !!(active && Array.isArray(active.app.formats) && active.app.formats.includes('3d'));
    }

    function ensureDialog() {
      if (dialog) return;
      dialog = document.createElement('dialog');
      dialog.className = 'ph-launcher';
      dialog.setAttribute('aria-labelledby', 'ph-launch-title-' + identifier);
      dialog.innerHTML = '<div class="ph-launch-shell">' +
        '<header class="ph-launch-bar"><button type="button" class="ph-launch-back" data-launch="close">' + ICON_BACK + '<span>Catálogo</span></button>' +
        '<div class="ph-launch-heading"><strong id="ph-launch-title-' + identifier + '"></strong><span data-launch="toolbar-status" aria-live="polite"></span></div>' +
        '<div class="ph-launch-tools"><button type="button" data-launch="toolbar-vr" class="ph-launch-button ph-launch-button-primary" hidden>' + ICON_VR + '<span>Entrar em VR</span></button>' +
        '<button type="button" data-launch="reload" class="ph-launch-button" hidden>Recarregar</button>' +
        '<a data-launch="direct" class="ph-launch-button">Abrir diretamente</a>' +
        '<button type="button" class="ph-launch-icon" data-launch="close" aria-label="Fechar experiência e voltar ao catálogo">' + ICON_CLOSE + '</button></div></header>' +
        '<div class="ph-launch-stage" data-launch="stage">' +
        '<section class="ph-launch-prep" data-launch="prep" aria-labelledby="ph-prep-title-' + identifier + '">' +
        '<div class="ph-launch-card"><div class="ph-launch-art" data-launch="art"><img alt="" data-launch="cover"><div class="ph-launch-art-mark">' + ICON_VR + '</div></div>' +
        '<div class="ph-launch-copy"><span class="ph-launch-eyebrow">PORTAL 360º VR</span><h2 id="ph-prep-title-' + identifier + '" data-launch="message"></h2>' +
        '<p data-launch="description"></p><div class="ph-launch-progress" data-launch="progress"><span></span><span></span><span></span><span class="ph-sr-only">Aguarde</span></div>' +
        '<div class="ph-launch-actions"><button type="button" class="ph-launch-button ph-launch-button-primary" data-launch="enter" hidden>' + ICON_VR + 'Entrar em VR</button>' +
        '<button type="button" class="ph-launch-button ph-launch-button-primary" data-launch="retry" hidden>Tentar novamente</button>' +
        '<button type="button" class="ph-launch-button" data-launch="three" hidden>Explorar em 3D</button>' +
        '<button type="button" class="ph-launch-button" data-launch="show" hidden>Ver aplicação</button>' +
        '<button type="button" class="ph-launch-button" data-launch="close">Voltar ao catálogo</button></div>' +
        '<p class="ph-launch-note" data-launch="note"></p></div></div></section></div></div>';
      document.body.appendChild(dialog);
      ui = {};
      dialog.querySelectorAll('[data-launch]').forEach(function (element) {
        const key = element.dataset.launch;
        if (key !== 'close') ui[key] = element;
      });
      ui.title = dialog.querySelector('#ph-launch-title-' + identifier);
      dialog.querySelectorAll('[data-launch="close"]').forEach(function (button) { button.addEventListener('click', close); });
      ui.enter.addEventListener('click', requestVR);
      ui['toolbar-vr'].addEventListener('click', requestVR);
      ui.retry.addEventListener('click', retry);
      ui.reload.addEventListener('click', retry);
      ui.three.addEventListener('click', function () {
        if (!active) return;
        active.mode = '3d';
        emittedLaunch = false;
        updateDirect();
        if (frame) showFrame(); else beginFrame(generation);
      });
      ui.show.addEventListener('click', showFrame);
      dialog.addEventListener('cancel', function (event) { event.preventDefault(); close(); });
      // close events are queued by the browser. A previous close must not close
      // an experience that has already reopened this same dialog.
      dialog.addEventListener('close', function () { if (active && !dialog.open) close(); });
      global.addEventListener('message', onMessage);
    }

    function setState(message, description, config) {
      const state = config || {};
      ui.message.textContent = message;
      ui.description.textContent = description;
      ui.note.textContent = state.note || '';
      ui.progress.hidden = !state.loading;
      ui.enter.hidden = !state.enter;
      ui.retry.hidden = !state.retry;
      ui.three.hidden = !state.three;
      ui.show.hidden = !state.show;
      ui['toolbar-status'].textContent = state.status || message;
      ui.prep.hidden = false;
      dialog.classList.remove('is-viewing');
    }

    function updateDirect() {
      try {
        ui.direct.href = urlFor(active.app, active.mode, false).href;
        ui.direct.hidden = false;
      } catch (_) { ui.direct.hidden = true; ui.direct.removeAttribute('href'); }
    }

    function setCover(app) {
      ui.cover.hidden = true;
      ui.art.classList.remove('has-image');
      ui.cover.removeAttribute('src');
      if (!app.cover) return;
      try {
        const url = new URL(app.cover, document.baseURI);
        if (!/^https?:$/.test(url.protocol)) return;
        ui.cover.onload = function () { ui.cover.hidden = false; ui.art.classList.add('has-image'); };
        ui.cover.onerror = function () { ui.cover.hidden = true; ui.art.classList.remove('has-image'); };
        ui.cover.src = url.href;
      } catch (_) { /* The launcher remains usable without a cover. */ }
    }

    function errorState(message, details) {
      stopTimers();
      canEnter = false;
      requesting = false;
      ui['toolbar-vr'].hidden = true;
      ui.reload.hidden = !frame;
      setState(message, details, { retry: true, show: !!frame, note: 'Você pode tentar novamente, abrir a experiência diretamente ou voltar ao catálogo.' });
    }

    function supportFailure(kind) {
      const three = offers3D();
      const reasons = {
        insecure: ['O VR precisa de uma conexão segura', 'Acesse o portal por HTTPS no navegador dos óculos. Neste dispositivo, você pode explorar ' + (three ? 'a versão 3D.' : 'a experiência na tela.')],
        unavailable: [three ? 'Explore em 3D neste dispositivo' : 'Abra a experiência neste dispositivo', 'Este navegador não oferece realidade virtual imersiva. Para entrar em VR, abra este mesmo portal no navegador de um headset compatível.'],
        unsupported: ['O VR não está disponível agora', 'Nenhum dispositivo com realidade virtual imersiva foi identificado neste navegador. Abra o portal nos óculos ou continue ' + (three ? 'em 3D.' : 'na tela.')],
        permission: ['O navegador bloqueou a verificação de VR', 'Confira as permissões de realidade virtual do site ou abra a experiência diretamente no navegador dos óculos.'],
        timeout: ['Não foi possível verificar os óculos', 'A verificação demorou mais que o esperado. Você pode tentar novamente ou explorar ' + (three ? 'em 3D.' : 'na tela.')],
        unknown: ['Não foi possível verificar o VR', 'O navegador não concluiu a verificação do dispositivo. Tente novamente ou abra a experiência diretamente.']
      };
      const reason = reasons[kind] || reasons.unknown;
      setState(reason[0], reason[1], { three: true, retry: kind !== 'unavailable' && kind !== 'insecure', note: (three ? 'A versão 3D' : 'A exploração na tela') + ' não exige óculos de realidade virtual.' });
    }

    function checkSupport(token) {
      if (!global.isSecureContext) { supportFailure('insecure'); return; }
      if (!navigator.xr || typeof navigator.xr.isSessionSupported !== 'function') { supportFailure('unavailable'); return; }
      setState('Conectando à experiência', 'Verificando se este dispositivo permite realidade virtual imersiva.', { loading: true });
      let settled = false;
      supportTimeout = setTimeout(function () {
        if (token !== generation || !active || settled) return;
        settled = true;
        supportFailure('timeout');
      }, 6500);
      Promise.resolve().then(function () { return navigator.xr.isSessionSupported('immersive-vr'); }).then(function (supported) {
        if (token !== generation || !active || settled) return;
        settled = true; clearTimeout(supportTimeout);
        xrSupport = !!supported;
        if (!supported) { supportFailure('unsupported'); return; }
        beginFrame(token);
      }).catch(function (err) {
        if (token !== generation || !active || settled) return;
        settled = true; clearTimeout(supportTimeout);
        supportFailure(err && (err.name === 'SecurityError' || err.name === 'NotAllowedError') ? 'permission' : 'unknown');
      });
    }

    function legacyWindow() {
      try {
        const win = frame && frame.contentWindow;
        // A bridge-aware app owns its readiness signal. Its legacy function may
        // exist long before models are loaded, so wait for the explicit event.
        if (win && win.PortalHubBridge && typeof win.PortalHubBridge.requestVR === 'function') return null;
        return win && typeof win.alternarVR === 'function' ? win : null;
      } catch (_) { return null; }
    }

    function inspectDocument() {
      try {
        const doc = frame && frame.contentDocument;
        if (!doc || !doc.body) return null;
        const title = (doc.title || '').trim();
        const heading = doc.querySelector('h1');
        const firstHeading = heading ? heading.textContent.trim() : '';
        if (/\b404\b|page not found|site not found|página não encontrada|arquivo não encontrado/i.test(title) || /^(404|not found|page not found|página não encontrada)(\b|\s|[.!])/i.test(firstHeading)) {
          return 'Não encontramos os arquivos desta experiência neste endereço. Confira se a pasta da aplicação está publicada junto com o portal.';
        }
        if (doc.querySelector('.stage.error, #stage.error')) return 'A aplicação informou uma falha ao carregar a cena 3D. Confira os arquivos e tente novamente.';
      } catch (_) { return 'A aplicação redirecionou para outro domínio. Use “Abrir diretamente” para continuar.'; }
      return null;
    }

    function ready(isBridge) {
      if (!active || !frame) return;
      if (canEnter && (!isBridge || bridgeReady)) return;
      if (isBridge && dialog.classList.contains('is-viewing')) {
        bridgeReady = true;
        canEnter = true;
        ui['toolbar-vr'].hidden = !xrSupport || hasSession;
        return;
      }
      stopTimers();
      bridgeReady = !!isBridge;
      canEnter = true;
      ui.reload.hidden = false;
      ui['toolbar-vr'].hidden = !xrSupport;
      setState(isBridge ? 'Tudo pronto para explorar' : 'Controles de VR carregados',
        isBridge ? 'Coloque os óculos e selecione “Entrar em VR”. O navegador poderá pedir sua autorização.' : 'Selecione “Entrar em VR” para solicitar a imersão. Os modelos e texturas ainda podem estar terminando de carregar dentro da aplicação.',
        { enter: xrSupport, three: true, status: 'Aguardando seu comando', note: 'O VR começa somente após seu clique. Se não abrir, a opção “Abrir diretamente” continua disponível.' });
    }

    function beginFrame(token) {
      if (token !== generation || !active) return;
      stopTimers(); removeFrame();
      canEnter = false; bridgeReady = false; hasSession = false; requesting = false;
      ui['toolbar-vr'].hidden = true;
      ui.reload.hidden = true;
      let url;
      try { url = urlFor(active.app, active.mode, true); }
      catch (err) { errorState('Não foi possível abrir', err.message); return; }
      if (url.origin !== location.origin) {
        setState('Esta experiência abre em outro site', 'Use “Abrir diretamente” para continuar. O catálogo permanece disponível pelo botão Voltar do navegador.', {});
        return;
      }
      setState('Carregando ' + active.app.title, 'Abrindo a aplicação selecionada. Você pode voltar ao catálogo a qualquer momento.', { loading: true, note: 'Somente esta experiência será carregada.' });
      const nextFrame = document.createElement('iframe');
      frame = nextFrame;
      nextFrame.className = 'ph-launch-frame';
      nextFrame.title = active.app.title + ' — experiência interativa';
      nextFrame.setAttribute('allow', 'xr-spatial-tracking; fullscreen; autoplay; accelerometer; gyroscope');
      nextFrame.setAttribute('allowfullscreen', '');
      nextFrame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      nextFrame.addEventListener('load', function () {
        if (token !== generation || frame !== nextFrame || !active) return;
        const problem = inspectDocument();
        if (problem) { errorState('A experiência não carregou', problem); return; }
        if (active.mode === '3d') { showFrame(); return; }
        if (canEnter) return; // A bridge can announce readiness before window.load.
        if (legacyWindow()) { ready(false); return; }
        poll = setInterval(function () {
          if (token !== generation || frame !== nextFrame || !active) return;
          const issue = inspectDocument();
          if (issue) { errorState('A cena não carregou', issue); return; }
          if (legacyWindow()) ready(false);
        }, 250);
      });
      nextFrame.addEventListener('error', function () {
        if (token === generation && frame === nextFrame && active) errorState('Falha ao abrir a experiência', 'Confira a conexão e tente novamente.');
      });
      timeout = setTimeout(function () {
        if (token !== generation || frame !== nextFrame || !active) return;
        errorState('O carregamento demorou mais que o esperado', 'A aplicação ainda não confirmou seus controles. Você pode visualizar a aplicação, tentar novamente ou abrir diretamente.');
      }, waitLimit);
      nextFrame.src = url.href;
      ui.stage.prepend(nextFrame);
    }

    function showFrame() {
      if (!active || !frame) return;
      stopTimers();
      ui.prep.hidden = true;
      dialog.classList.add('is-viewing');
      ui.reload.hidden = false;
      ui['toolbar-vr'].hidden = !xrSupport || !canEnter || hasSession;
      ui['toolbar-status'].textContent = active.mode === '3d' ? (offers3D() ? 'Exploração em 3D' : 'Exploração') + ' · volte ao catálogo quando quiser' : 'Use os controles da experiência ou entre em VR';
      emitLaunch();
      frame.focus();
    }

    function requestVR() {
      if (!active || !frame || !canEnter || !xrSupport || requesting || hasSession) return;
      const token = generation;
      let enter;
      try {
        const win = frame.contentWindow;
        if (bridgeReady && win.PortalHubBridge && typeof win.PortalHubBridge.requestVR === 'function') enter = function () { return win.PortalHubBridge.requestVR(); };
        else if (typeof win.alternarVR === 'function') enter = function () { return win.alternarVR('vr'); };
      } catch (_) { /* Report through the regular recovery screen. */ }
      if (!enter) { errorState('O controle de VR não está disponível', 'Abra a aplicação diretamente para usar o botão de realidade virtual dela.'); return; }
      requesting = true;
      active.mode = 'vr';
      updateDirect();
      ui.enter.disabled = true;
      ui['toolbar-vr'].disabled = true;
      // Keep the request in the click's call stack. No await, timers, native API patch,
      // or synthetic click may come between the gesture and the app's XR handler.
      let result;
      try { result = enter(); }
      catch (err) { requestFailed(err, token); return; }
      showFrame();
      ui['toolbar-status'].textContent = 'VR solicitado · confirme a autorização nos óculos';
      if (result && typeof result.then === 'function') Promise.resolve(result).catch(function (err) { requestFailed(err, token); });
      requestTimer = setTimeout(function () {
        if (token !== generation || !active) return;
        requesting = false;
        ui.enter.disabled = false;
        ui['toolbar-vr'].disabled = false;
        if (!hasSession) ui['toolbar-status'].textContent = 'Se o VR não abrir, use o botão VR da aplicação ou “Abrir diretamente”';
      }, 1600);
    }

    function requestFailed(err, token) {
      if (token !== generation || !active) return;
      requesting = false;
      ui.enter.disabled = false;
      ui['toolbar-vr'].disabled = false;
      const denied = err && (err.name === 'NotAllowedError' || err.name === 'SecurityError');
      showFrame();
      ui['toolbar-status'].textContent = denied ? 'VR não autorizado · confira as permissões ou abra diretamente' : 'O VR não abriu · tente pelo botão da aplicação ou abra diretamente';
    }

    function onMessage(event) {
      if (!active || !frame || event.source !== frame.contentWindow || event.origin !== location.origin) return;
      const message = event.data;
      if (!message || typeof message !== 'object' || message.source !== 'portal360-app' || message.version !== 1) return;
      if (message.type === 'ready') {
        if (active.mode === '3d') showFrame();
        else if (message.canEnterVR === true) ready(true);
      } else if (message.type === 'xr-start') {
        // This event must be emitted by the app from its actual XR session start.
        clearTimeout(requestTimer); requestTimer = null;
        hasSession = true; requesting = false;
        ui['toolbar-vr'].hidden = true;
        ui['toolbar-status'].textContent = 'Sessão VR iniciada';
      } else if (message.type === 'xr-end') {
        clearTimeout(requestTimer); requestTimer = null;
        hasSession = false; requesting = false;
        ui.enter.disabled = false; ui['toolbar-vr'].disabled = false;
        ui['toolbar-vr'].hidden = !canEnter || !xrSupport;
        ui['toolbar-status'].textContent = 'Sessão VR encerrada · entre novamente ou volte ao catálogo';
      } else if (message.type === 'error') {
        errorState('A aplicação informou um problema', typeof message.message === 'string' ? message.message.slice(0, 400) : 'Tente novamente ou abra a experiência diretamente.');
      } else if (message.type === 'back') close();
    }

    function retry() {
      if (!active) return;
      generation++;
      stopTimers(); removeFrame();
      canEnter = false; bridgeReady = false; hasSession = false; requesting = false;
      ui.enter.disabled = false; ui['toolbar-vr'].disabled = false;
      ui['toolbar-vr'].hidden = true;
      ui.reload.hidden = true;
      if (active.mode === 'vr') checkSupport(generation); else beginFrame(generation);
    }

    function open(app, mode) {
      if (!app) return;
      if (active) close();
      ensureDialog();
      generation++;
      active = { app: app, mode: mode === 'vr' ? 'vr' : '3d' };
      emittedLaunch = false; canEnter = false; bridgeReady = false; hasSession = false; requesting = false; xrSupport = false;
      restoreFocus = document.activeElement;
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      ui.title.textContent = app.title || 'Experiência';
      ui.three.textContent = offers3D() ? 'Explorar em 3D' : 'Abrir experiência';
      ui.enter.disabled = false; ui['toolbar-vr'].disabled = false;
      ui['toolbar-vr'].hidden = true; ui.reload.hidden = true;
      updateDirect(); setCover(app);
      if (!dialog.open) dialog.showModal();
      notify('onOpen', app, active.mode);
      if (active.mode === 'vr') checkSupport(generation); else beginFrame(generation);
    }

    function close() {
      if (!active) return;
      active = null;
      generation++;
      stopTimers(); removeFrame();
      requesting = false; hasSession = false; canEnter = false;
      if (dialog && dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
      notify('onClose');
      if (restoreFocus && restoreFocus.isConnected && typeof restoreFocus.focus === 'function') restoreFocus.focus({ preventScroll: true });
      restoreFocus = null;
    }

    return { open: open, close: close };
  }

  global.PortalHubLauncher = Object.freeze({ create: create });
})(window);
