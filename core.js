/* Funções puras compartilhadas pela interface e pelos testes. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PortalHubCore = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  // Categorias são extensíveis: o rótulo vem de categoryLabel no cadastro.
  var categoryPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  var levels = ['efi', 'efii', 'em'];
  var formats = ['3d', 'vr', '360', 'simulacao'];

  function normalize(value) {
    return String(value == null ? '' : value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').replace(/\s+/g, ' ').trim();
  }

  function filterExperiences(items, options) {
    options = options || {};
    var tokens = normalize(options.query).split(' ').filter(Boolean);
    var favorites = new Set(options.favorites || []);
    return items.filter(function (item) {
      if (options.category && item.category !== options.category) return false;
      if (options.level && item.levels.indexOf(options.level) === -1) return false;
      if (options.format && item.formats.indexOf(options.format) === -1) return false;
      if (options.status && item.status !== options.status) return false;
      if (options.onlyFavorites && !favorites.has(item.id)) return false;
      var haystack = normalize([item.title, item.summary, item.description, item.categoryLabel].concat(item.keywords || []).join(' '));
      return tokens.every(function (token) { return haystack.indexOf(token) !== -1; });
    });
  }

  function sortExperiences(items, order, recent) {
    order = order || 'recommended';
    recent = recent || [];
    var recentIndex = new Map();
    recent.forEach(function (id, index) { if (!recentIndex.has(id)) recentIndex.set(id, index); });
    return items.map(function (item, index) { return { item: item, index: index }; }).sort(function (a, b) {
      var comparison = 0;
      if (order === 'title') {
        comparison = a.item.title.localeCompare(b.item.title, 'pt-BR', { sensitivity: 'base' });
      } else if (order === 'recent') {
        var aRank = recentIndex.has(a.item.id) ? recentIndex.get(a.item.id) : Number.MAX_SAFE_INTEGER;
        var bRank = recentIndex.has(b.item.id) ? recentIndex.get(b.item.id) : Number.MAX_SAFE_INTEGER;
        comparison = aRank - bRank;
      } else {
        comparison = Number(b.item.status === 'available') - Number(a.item.status === 'available');
        if (!comparison) comparison = Number(!!b.item.featured) - Number(!!a.item.featured);
      }
      return comparison || a.index - b.index;
    }).map(function (entry) { return entry.item; });
  }

  function safePath(path, prefix, allowHttps) {
    if (typeof path !== 'string' || !path || path.trim() !== path || /[\u0000-\u0020\u007f\\]/.test(path)) return false;
    if (/^https:\/\//i.test(path) && allowHttps) {
      try {
        var external = new URL(path);
        return external.protocol === 'https:' && !!external.hostname && !external.username && !external.password;
      } catch (error) { return false; }
    }
    if (path.indexOf(prefix + '/') !== 0) return false;
    var pathname = path.split(/[?#]/)[0];
    try {
      // Decode repeatedly to reject encoded traversal and encoded separators.
      for (var pass = 0; pass < 4; pass++) {
        var decoded = decodeURIComponent(pathname);
        if (decoded === pathname) break;
        pathname = decoded;
      }
    } catch (error) { return false; }
    if (/%|[\u0000-\u0020\u007f\\?#]/.test(pathname)) return false;
    return pathname.indexOf(prefix + '/') === 0 && pathname.split('/').every(function (segment) { return segment !== '..' && segment !== '.'; });
  }

  function getAppUrl(app, mode, baseUrl, version) {
    if (!app || !safePath(app.path, 'apps', true)) throw new TypeError('Endereço de aplicação inválido. Use apps/... ou uma URL HTTPS.');
    if (mode !== '3d' && mode !== 'vr') throw new TypeError('Modo de aplicação inválido.');
    var url = new URL(app.path, baseUrl);
    // "3d" representa a abertura convencional no navegador, inclusive para
    // experiências de vídeo 360° ou simulações sem um modo 3D separado.
    if (mode === 'vr') url.searchParams.set('vr', '1');
    else url.searchParams.delete('vr');
    if (version) url.searchParams.set('v', String(version));
    return url.href;
  }

  function validateCatalog(config) {
    var errors = [];
    if (!config || typeof config !== 'object') return ['Catálogo ausente ou inválido.'];
    if (typeof config.version !== 'string' || !config.version.trim()) errors.push('O catálogo precisa de uma versão.');
    if (!config.intro || typeof config.intro !== 'object') errors.push('Configuração da abertura ausente.');
    else ['video', 'poster', 'background'].forEach(function (key) {
      if (!safePath(config.intro[key], 'assets', true)) errors.push('Endereço inválido em intro.' + key + '.');
    });
    if (!Array.isArray(config.experiences)) return errors.concat('A lista de experiências é inválida.');
    var ids = new Set();
    config.experiences.forEach(function (item, index) {
      var label = 'Experiência ' + (index + 1);
      if (!item || typeof item !== 'object') { errors.push(label + ': registro inválido.'); return; }
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id || '')) errors.push(label + ': id inválido.');
      if (ids.has(item.id)) errors.push(label + ': id duplicado (' + item.id + ').');
      ids.add(item.id);
      ['title', 'summary', 'description', 'categoryLabel'].forEach(function (key) {
        if (typeof item[key] !== 'string' || !item[key].trim()) errors.push(label + ': ' + key + ' obrigatório.');
      });
      if (typeof item.category !== 'string' || !categoryPattern.test(item.category)) errors.push(label + ': categoria inválida.');
      if (['available', 'soon'].indexOf(item.status) === -1) errors.push(label + ': status inválido.');
      [['levels', levels], ['formats', formats]].forEach(function (field) {
        var values = item[field[0]];
        if (!Array.isArray(values) || !values.length || values.some(function (value) { return field[1].indexOf(value) === -1; })) errors.push(label + ': ' + field[0] + ' inválido.');
      });
      ['keywords', 'objectives'].forEach(function (key) {
        if (!Array.isArray(item[key]) || item[key].some(function (value) { return typeof value !== 'string' || !value.trim(); })) errors.push(label + ': ' + key + ' inválido.');
      });
      if (typeof item.featured !== 'boolean') errors.push(label + ': featured deve ser verdadeiro ou falso.');
      if (item.status === 'available' || item.path != null) {
        if (!safePath(item.path, 'apps', true)) errors.push(label + ': endereço de aplicação inválido.');
      }
      if (item.cover != null && !safePath(item.cover, 'assets', true)) errors.push(label + ': endereço de capa inválido.');
      if (item.status === 'available' && !item.cover) errors.push(label + ': capa obrigatória para experiências disponíveis.');
      if (item.videoId != null && !/^[A-Za-z0-9_-]{11}$/.test(item.videoId)) errors.push(label + ': identificador de vídeo inválido.');
    });
    return errors;
  }

  return {
    normalize: normalize,
    filterExperiences: filterExperiences,
    sortExperiences: sortExperiences,
    getAppUrl: getAppUrl,
    validateCatalog: validateCatalog
  };
});
