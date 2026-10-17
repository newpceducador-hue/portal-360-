/* Optional integration for future apps. Nothing here initializes or modifies XR.
 * Load from an app: <script src="../../hub/bridge.js"></script>
 * After assets/scene are ready:
 *   PortalHubBridge.ready({ enterVR: () => alternarVR('vr') });
 * From REAL session lifecycle callbacks:
 *   renderer.xr.addEventListener('sessionstart', () => PortalHubBridge.xrStart());
 *   renderer.xr.addEventListener('sessionend', () => PortalHubBridge.xrEnd());
 * Other explicit signals: error('Mensagem útil'), back().
 * requestVR is called synchronously by the same-origin hub on a user click.
 */
(function (global) {
  'use strict';
  let enterVR = null;
  function emit(type, extra) {
    if (global.parent === global || location.origin === 'null') return;
    global.parent.postMessage(Object.assign({ source: 'portal360-app', version: 1, type: type }, extra || {}), location.origin);
  }
  global.PortalHubBridge = Object.freeze({
    ready: function (options) {
      enterVR = options && typeof options.enterVR === 'function' ? options.enterVR : null;
      emit('ready', { canEnterVR: !!enterVR });
    },
    requestVR: function () {
      if (!enterVR) throw new Error('A aplicação não registrou um controle de VR.');
      return enterVR();
    },
    xrStart: function () { emit('xr-start'); },
    xrEnd: function () { emit('xr-end'); },
    error: function (message) { emit('error', { message: String(message || 'Não foi possível carregar a experiência.').slice(0, 400) }); },
    back: function () { emit('back'); }
  });
})(window);
