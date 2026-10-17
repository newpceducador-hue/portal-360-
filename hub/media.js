/* Abertura local e videoaulas. Toda reprodução parte de uma ação do usuário. */
(function (root) {
  'use strict';
  root.PortalHubMedia = {
    create: function (options) {
      options = options || {};
      const $ = id => document.getElementById(id);
      const intro = $('intro'), catalog = $('catalog'), video = $('introVideo');
      const fallback = $('startFallback'), status = $('introStatus');
      const lesson = $('lessonDialog'), frame = $('lessonFrame'), lessonFullscreen = $('lessonFullscreen');
      let watchdog = null, introBusy = false, blocked = false;
      let lessonApp = null, lessonPlayer = null, lessonGeneration = 0, lessonFS = false;
      let lessonOpener = null, youtubePromise = null, ended = false;
      const storage = (method, key, value) => { try { return sessionStorage[method](key, value); } catch (_) { return null; } };
      const config = options.intro || {};
      if (config.video) video.src = config.video;
      if (config.poster) video.poster = config.poster;

      function clearWatchdog() { clearTimeout(watchdog); watchdog = null; }
      function pauseBackground() {
        blocked = true;
        document.querySelectorAll('#catalog video').forEach(v => v.pause());
        video.pause();
      }
      function resumeBackground() {
        blocked = false;
        // O hub usa uma capa estática: nenhuma cena WebGL ou vídeo roda em segundo plano.
      }
      function showCatalog() {
        const focusWasInsideIntro = intro.contains(document.activeElement);
        clearWatchdog(); introBusy = false;
        video.pause();
        intro.hidden = true; catalog.hidden = false;
        document.body.classList.remove('intro-mode');
        $('btnStartIntro').disabled = false;
        storage('setItem', 'portal360_intro_done', '1');
        if (options.onCatalog) options.onCatalog();
        if (focusWasInsideIntro) $('heroOpen').focus({ preventScroll: true });
      }
      function showIntro() {
        pauseBackground(); closeLesson();
        intro.hidden = false; catalog.hidden = true;
        fallback.hidden = false; status.textContent = '';
        $('btnStartIntro').disabled = false;
        document.body.classList.add('intro-mode');
        video.pause(); try { video.currentTime = 0; } catch (_) {}
        introBusy = false; clearWatchdog();
        $('btnStartIntro').focus();
      }
      function startIntro() {
        if (introBusy) return;
        introBusy = true; blocked = false;
        $('btnStartIntro').disabled = true;
        status.textContent = 'Preparando a apresentação…';
        try {
          const fs = document.documentElement.requestFullscreen;
          if (fs && !document.fullscreenElement) Promise.resolve(fs.call(document.documentElement)).catch(() => {});
        } catch (_) {}
        video.muted = storage('getItem', 'portal360_intro_muted') === '1';
        $('btnIntroMute').textContent = video.muted ? 'Ativar som' : 'Silenciar';
        $('btnIntroMute').setAttribute('aria-pressed', String(video.muted));
        video.volume = 1;
        try { video.currentTime = 0; } catch (_) {}
        clearWatchdog(); watchdog = setTimeout(showCatalog, 6000);
        const fail = () => { if (introBusy) showCatalog(); };
        try { const play = video.play(); if (play && play.catch) play.catch(fail); } catch (_) { fail(); }
      }
      video.addEventListener('playing', () => {
        if (intro.hidden || blocked) { video.pause(); return; }
        clearWatchdog(); fallback.hidden = true; status.textContent = '';
      });
      video.addEventListener('ended', showCatalog);
      video.addEventListener('error', () => {
        if (introBusy) showCatalog();
        else status.textContent = 'Apresentação indisponível. Você pode abrir o catálogo.';
      });
      $('btnStartIntro').addEventListener('click', startIntro);
      $('btnSkipIntro').addEventListener('click', showCatalog);
      $('btnIntro').addEventListener('click', showIntro);
      $('btnIntroMute').addEventListener('click', () => {
        video.muted = !video.muted;
        storage('setItem', 'portal360_intro_muted', video.muted ? '1' : '0');
        $('btnIntroMute').textContent = video.muted ? 'Ativar som' : 'Silenciar';
        $('btnIntroMute').setAttribute('aria-pressed', String(video.muted));
      });
      document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !intro.hidden) showCatalog();
      });
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          video.pause();
          try { if (lessonPlayer) lessonPlayer.pauseVideo(); } catch (_) {}
        } else if (!intro.hidden && introBusy) {
          // Não retomar som automaticamente após trocar de aba.
          clearWatchdog(); introBusy = false; fallback.hidden = false;
          $('btnStartIntro').disabled = false; status.textContent = 'Toque para assistir novamente ou abrir o catálogo.';
        }
      });

      function notifyRoom(value) {
        try { if (root.Portal360Sala && typeof root.Portal360Sala.midiaExterna === 'function') root.Portal360Sala.midiaExterna(value); } catch (_) {}
      }
      function loadYouTubeAPI() {
        if (root.YT && root.YT.Player) return Promise.resolve(root.YT);
        if (youtubePromise) return youtubePromise;
        youtubePromise = new Promise((resolve, reject) => {
          let timer;
          const before = root.onYouTubeIframeAPIReady;
          root.onYouTubeIframeAPIReady = () => {
            clearTimeout(timer);
            try { if (before) before(); } catch (_) {}
            resolve(root.YT);
          };
          timer = setTimeout(() => reject(new Error('API de vídeo indisponível')), 8000);
          if (!document.getElementById('portal-youtube-api')) {
            const script = document.createElement('script');
            script.id = 'portal-youtube-api'; script.src = 'https://www.youtube.com/iframe_api';
            script.onerror = () => { clearTimeout(timer); reject(new Error('API de vídeo indisponível')); };
            document.head.appendChild(script);
          }
        });
        youtubePromise.catch(() => { youtubePromise = null; });
        return youtubePromise;
      }
      function stopLesson() {
        lessonGeneration++;
        notifyRoom(null);
        try { if (lessonPlayer) lessonPlayer.destroy(); } catch (_) {}
        lessonPlayer = null; frame.replaceChildren();
        if (document.fullscreenElement === lessonFullscreen && document.exitFullscreen) document.exitFullscreen().catch(() => {});
        lessonFS = false;
      }
      function closeLesson() {
        if (lesson.open || lessonPlayer || frame.childNodes.length) stopLesson();
        if (lesson.open) lesson.close();
      }
      function openLesson(app) {
        if (!app || !/^[A-Za-z0-9_-]{11}$/.test(app.videoId || '')) return;
        pauseBackground(); closeLesson(); lessonApp = app; ended = false;
        const generation = ++lessonGeneration;
        lessonOpener = document.activeElement;
        $('lessonTitle').textContent = app.title + ' · videoaula';
        $('lessonExternal').href = 'https://www.youtube.com/watch?v=' + app.videoId;
        const iframe = document.createElement('iframe');
        iframe.id = 'portal-lesson-player';
        const src = new URL('https://www.youtube-nocookie.com/embed/' + app.videoId);
        src.search = new URLSearchParams({ autoplay: '1', rel: '0', hl: 'pt-BR', playsinline: '1', enablejsapi: '1', origin: location.origin }).toString();
        iframe.src = src.href; iframe.title = app.title + ': videoaula';
        iframe.allow = 'autoplay; fullscreen; picture-in-picture'; iframe.allowFullscreen = true;
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        frame.replaceChildren(iframe); lesson.showModal();
        $('closeLesson').focus();
        if (lessonFullscreen.requestFullscreen) lessonFullscreen.requestFullscreen().then(() => {
          if (generation === lessonGeneration && lesson.open) lessonFS = true;
          else if (document.fullscreenElement === lessonFullscreen && document.exitFullscreen) document.exitFullscreen().catch(() => {});
        }).catch(() => {});
        if (root.Portal360Sala && root.Portal360Sala.sala) {
          loadYouTubeAPI().then(YT => {
            if (generation !== lessonGeneration || !lesson.open) return;
            lessonPlayer = new YT.Player(iframe, { events: {
              onReady: () => {
                if (generation !== lessonGeneration) return;
                notifyRoom({ tipo: 'video', nome: app.title + ' · videoaula', estado: () => {
                  if (!lessonPlayer || !lessonPlayer.getPlayerState) return null;
                  const s = lessonPlayer.getPlayerState();
                  return { tocando: s === 1 || s === 3, pos: lessonPlayer.getCurrentTime(), dur: lessonPlayer.getDuration(), fim: ended || s === 0 };
                } });
              }, onStateChange: event => { if (event.data === 0) ended = true; }
            } });
          }).catch(() => {});
        }
      }
      $('closeLesson').addEventListener('click', closeLesson);
      lesson.addEventListener('close', () => {
        if (lesson.open) return; // Ignore an old queued close after reopening the same dialog.
        stopLesson(); resumeBackground();
        if (lessonOpener && lessonOpener.isConnected) lessonOpener.focus();
      });
      lesson.addEventListener('click', e => { if (e.target === lesson && e.clientX !== 0) {
        const r = lesson.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeLesson();
      } });
      $('lessonContinue').addEventListener('click', () => {
        const app = lessonApp; closeLesson();
        if (options.onExplore) options.onExplore(app);
      });
      document.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement === lessonFullscreen && lesson.open) lessonFS = true;
        else if (lessonFS && lesson.open) closeLesson();
      });
      window.addEventListener('pagehide', () => { pauseBackground(); closeLesson(); });

      const direct = new URLSearchParams(location.search).get('catalog') === '1' || storage('getItem', 'portal360_intro_done') === '1';
      if (direct) showCatalog(); else { intro.hidden = false; catalog.hidden = true; document.body.classList.add('intro-mode'); }
      return { showCatalog, showIntro, pauseBackground, resumeBackground, openLesson, closeLesson };
    }
  };
})(window);
