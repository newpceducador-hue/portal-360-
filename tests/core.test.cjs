'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../hub/core.js');
const catalog = require('../hub/catalogo.js');
const items = catalog.experiences;
const ids = values => values.map(item => item.id);

test('the shipped catalog is valid and preserves the existing application paths', () => {
  assert.deepEqual(core.validateCatalog(catalog), []);
  assert.equal(items.filter(item => item.status === 'available').length, 5);
  assert.equal(items.filter(item => item.status === 'soon').length, 2);
  for (const item of items.filter(item => item.status === 'available')) assert.equal(item.path, 'apps/' + item.id + '/');
});

test('search normalizes accents and whitespace and requires every token', () => {
  assert.equal(core.normalize('  ÓRGÃOS   CÉLULA  '), 'orgaos celula');
  assert.deepEqual(ids(core.filterExperiences(items, { query: ' CELULA   fotossintese ' })), ['celula']);
  assert.deepEqual(ids(core.filterExperiences(items, { query: 'órgãos coração' })), ['corpo-humano']);
  assert.deepEqual(core.filterExperiences(items, { query: 'celula saturno' }), []);
});

test('category, education level, format and status combine as AND filters', () => {
  assert.deepEqual(ids(core.filterExperiences(items, { category: 'biologia', level: 'efi', format: 'vr', status: 'available' })), ['corpo-humano']);
  assert.deepEqual(core.filterExperiences(items, { category: 'biologia', format: '360' }), []);
});

test('favorites are matched by ID and still respect the other filters', () => {
  assert.deepEqual(ids(core.filterExperiences(items, { favorites: ['dna', 'terra'], onlyFavorites: true })), ['dna', 'terra']);
  assert.deepEqual(ids(core.filterExperiences(items, { favorites: new Set(['dna', 'terra']), onlyFavorites: true, category: 'biologia' })), ['dna']);
  assert.deepEqual(core.filterExperiences(items, { onlyFavorites: true }), []);
});

test('sorting is stable, puts recommended available experiences first and never mutates input', () => {
  const original = ids(items);
  assert.deepEqual(ids(core.sortExperiences(items)), ['sistema-solar', 'corpo-humano', 'dna', 'terra', 'celula', 'historia', 'quimica']);
  assert.deepEqual(ids(core.sortExperiences(items, 'recent', ['terra', 'dna'])), ['terra', 'dna', 'sistema-solar', 'corpo-humano', 'celula', 'historia', 'quimica']);
  assert.deepEqual(ids(core.sortExperiences(items, 'title')).slice(0, 3), ['celula', 'corpo-humano', 'dna']);
  assert.deepEqual(ids(items), original);
  const equalTitles = [{ id: 'a', title: 'Célula' }, { id: 'b', title: 'Celula' }];
  assert.deepEqual(ids(core.sortExperiences(equalTitles, 'title')), ['a', 'b']);
});

test('application URLs work in a GitHub Pages subdirectory and retain other parameters', () => {
  const app = { path: 'apps/dna/?language=pt-BR&vr=0#atividade' };
  const vr = new URL(core.getAppUrl(app, 'vr', 'https://example.com/portal-360-vr/index.html', 'build2'));
  assert.equal(vr.pathname, '/portal-360-vr/apps/dna/');
  assert.equal(vr.searchParams.get('vr'), '1');
  assert.equal(vr.searchParams.get('language'), 'pt-BR');
  assert.equal(vr.searchParams.get('v'), 'build2');
  assert.equal(vr.hash, '#atividade');
  const desktop = new URL(core.getAppUrl(app, '3d', 'https://example.com/portal-360-vr/', 'build2'));
  assert.equal(desktop.searchParams.has('vr'), false);
  assert.equal(desktop.pathname, vr.pathname);
});

test('HTTPS external addresses are prepared for future use and preserve their origin', () => {
  const url = new URL(core.getAppUrl({ path: 'https://experience.example.org/a/?theme=night' }, '3d', 'https://example.com/portal/'));
  assert.equal(url.origin, 'https://experience.example.org');
  assert.equal(url.searchParams.get('theme'), 'night');
});

test('new categories and all supported formats can be registered without editing the core', () => {
  const changed = structuredClone(catalog);
  const ecosystem = {
    ...changed.experiences[0],
    id: 'pantanal', title: 'Pantanal 360°',
    category: 'ecossistemas', categoryLabel: 'Ecossistemas',
    formats: ['360'], path: 'apps/pantanal/?vr=1'
  };
  changed.experiences.push(ecosystem);
  assert.deepEqual(core.validateCatalog(changed), []);
  assert.deepEqual(ids(core.filterExperiences(changed.experiences, { category: 'ecossistemas', format: '360' })), ['pantanal']);
  const browserUrl = new URL(core.getAppUrl(ecosystem, '3d', 'https://example.com/portal/'));
  assert.equal(browserUrl.pathname, '/portal/apps/pantanal/');
  assert.equal(browserUrl.searchParams.has('vr'), false);
  for (const format of ['3d', 'vr', '360', 'simulacao']) {
    ecosystem.formats = [format];
    assert.deepEqual(core.validateCatalog(changed), [], format);
  }
  ecosystem.category = 'categoria inválida';
  assert.ok(core.validateCatalog(changed).some(error => error.includes('categoria inválida')));
  ecosystem.category = 'ecossistemas';
  ecosystem.formats = ['desconhecido'];
  assert.ok(core.validateCatalog(changed).some(error => error.includes('formats inválido')));
});

test('unsafe schemes, traversal, protocol-relative addresses and credentials are rejected', () => {
  const paths = ['javascript:alert(1)', 'data:text/html,x', '//evil.example/app', 'http://example.com/app', 'apps/../secret', 'apps/%2e%2e/secret', 'apps/%252e%252e/secret', 'apps/%2F../secret', 'apps/\\evil.example/', 'apps/\nother/', 'https://user:password@example.com/', ' assets/a'];
  for (const path of paths) {
    assert.throws(() => core.getAppUrl({ path }, 'vr', 'https://example.com/portal/'), { name: 'TypeError' }, path);
    const changed = structuredClone(catalog);
    changed.experiences[0].path = path;
    assert.ok(core.validateCatalog(changed).some(error => error.includes('endereço de aplicação inválido')), path);
  }
});

test('catalog validation rejects duplicate IDs and malformed metadata', () => {
  const changed = structuredClone(catalog);
  changed.experiences[1].id = changed.experiences[0].id;
  changed.experiences[2].videoId = 'bad-id';
  changed.experiences[3].cover = 'javascript:alert(1)';
  const errors = core.validateCatalog(changed);
  assert.ok(errors.some(error => error.includes('id duplicado')));
  assert.ok(errors.some(error => error.includes('identificador de vídeo inválido')));
  assert.ok(errors.some(error => error.includes('endereço de capa inválido')));
});
