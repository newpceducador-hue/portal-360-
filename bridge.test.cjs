const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../hub/bridge.js'), 'utf8');

function createBridge(embedded = true) {
  const messages = [];
  const window = {};
  window.parent = embedded ? { postMessage: (data, origin) => messages.push({ data, origin }) } : window;
  vm.runInNewContext(source, { window, location: { origin: 'https://portal.example' }, Object, String, Error });
  return { bridge: window.PortalHubBridge, messages };
}

test('bridge is passive; ready and VR launch require explicit calls', () => {
  const { bridge, messages } = createBridge();
  assert.equal(messages.length, 0);
  assert.throws(() => bridge.requestVR(), /não registrou/);
  let calls = 0;
  bridge.ready({ enterVR: () => { calls++; return 'started-by-app'; } });
  assert.equal(calls, 0);
  assert.equal(messages[0].origin, 'https://portal.example');
  assert.equal(messages[0].data.type, 'ready');
  assert.equal(messages[0].data.canEnterVR, true);
  assert.equal(bridge.requestVR(), 'started-by-app');
  assert.equal(calls, 1);
  assert.equal(messages.length, 1, 'requestVR must not invent a session-start event');
  assert.equal(Object.isFrozen(bridge), true);
});

test('lifecycle, recovery and back messages only follow explicit app signals', () => {
  const { bridge, messages } = createBridge();
  bridge.ready();
  assert.equal(messages[0].data.canEnterVR, false);
  bridge.xrStart();
  bridge.xrEnd();
  bridge.error('x'.repeat(500));
  bridge.back();
  assert.deepEqual(messages.map(x => x.data.type), ['ready', 'xr-start', 'xr-end', 'error', 'back']);
  assert.equal(messages[3].data.message.length, 400);
  for (const entry of messages) {
    assert.equal(entry.origin, 'https://portal.example');
    assert.equal(entry.data.source, 'portal360-app');
    assert.equal(entry.data.version, 1);
  }
});

test('standalone apps remain usable without a parent hub', () => {
  const { bridge, messages } = createBridge(false);
  let requested = false;
  bridge.ready({ enterVR: () => { requested = true; } });
  bridge.requestVR();
  bridge.xrStart();
  bridge.xrEnd();
  bridge.back();
  assert.equal(requested, true);
  assert.equal(messages.length, 0);
});
