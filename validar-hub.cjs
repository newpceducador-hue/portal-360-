/* Verifica a distribuição do hub sem instalar dependências. Execute: node tools/validar-hub.cjs */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const core = require('../hub/core.js');
const catalog = require('../hub/catalogo.js');
assert.deepEqual(core.validateCatalog(catalog), [], 'Cadastro inválido');
const index = read('index.html');
const ids = [...index.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
assert.equal(new Set(ids).size, ids.length, 'IDs HTML duplicados');
for (const name of fs.readdirSync(path.join(root, 'hub')).filter(name => name.endsWith('.js'))) {
  const source = read('hub/' + name);
  new vm.Script(source, { filename: name });
  if (name === 'app.js' || name === 'media.js') for (const match of source.matchAll(/\$\('([^']+)'\)/g)) {
    assert.ok(ids.includes(match[1]), 'Elemento HTML não encontrado: ' + match[1]);
  }
}
for (const match of index.matchAll(/(?:src|href)="(hub\/[^"?#]+)(?:[?#][^"]*)?"/g)) {
  assert.ok(fs.existsSync(path.join(root, match[1])), 'Arquivo do hub ausente: ' + match[1]);
}
for (const match of read('diagnostico-vr.html').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) new vm.Script(match[1], { filename: 'diagnostico-vr.html' });
assert.ok(index.includes('assets/sala/sala-cliente.js?v=1.7.0'), 'Referência da sala removida');
assert.ok(index.includes('id="lessonFullscreen"'), 'Wrapper da aula ausente');
console.log('OK: cadastro, sintaxe JavaScript, elementos da interface e arquivos do hub.');
console.log('Aplicações e mídias originais devem estar presentes na instalação de destino.');
