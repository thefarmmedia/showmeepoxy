// Run with: node --test tests/floor-visualizer.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'floor-visualizer.html'), 'utf8');

function setup() {
  const elements = new Map();
  const timers = [];
  const context = vm.createContext({
    document: { getElementById(id) {
      if (!elements.has(id)) elements.set(id, {
        style: {}, classList: { add() {}, remove() {}, toggle() {} }
      });
      return elements.get(id);
    } },
    setTimeout: fn => timers.push(fn),
    fvState: { room: 'garage', color: { name: 'First', slug: 'First' } },
    ROOMS: { garage: { alt: 'Test garage' } },
    fvRenderColorGrid() {}, fvUpdateFavButton() {}, fvUpdateQuoteLink() {},
    fvSyncUrl() {}, fvTrack() {}
  });
  vm.runInContext(html.slice(html.indexOf('var fvCanvasCache ='), html.indexOf('function fvUpdateQuoteLink')), context);
  vm.runInContext(html.slice(html.indexOf('var fvRenderRequest ='), html.indexOf('// ---------- photorealistic')), context);
  vm.runInContext(html.slice(html.indexOf('function fvSetReveal('), html.indexOf('(function initDrag()')), context);
  vm.runInContext(html.slice(html.indexOf('function fvSetStageAspect('), html.indexOf('function fvApplyRoom(')), context);
  return { context, elements, timers };
}

test('all executable inline scripts remain valid JavaScript', () => {
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (!/application\/ld\+json/.test(match[1])) new vm.Script(match[2]);
  }
});

test('reflections follow angled and stepped floor boundaries', () => {
  const { context: c } = setup();
  const poly = [{x:0,y:20},{x:40,y:20},{x:40,y:40},{x:100,y:70},{x:100,y:100},{x:0,y:100}];
  const line = c.fvFloorContactLine(poly, 0, 100);
  assert.equal(line[10], 20);
  assert.equal(line[40], 40.25);
  assert.equal(line[90], 65.25);
  assert.equal(c.fvInsideFloor(75, 30, poly), false);
  assert.equal(c.fvInsideFloor(75, 90, poly), true);
  const outside = c.fvFloorContactLine(poly, 100, 2);
  assert.equal(outside[0], Infinity);
});

test('missing reflection content fades out instead of repeating a photo edge', () => {
  const { context: c } = setup();
  assert.equal(c.fvReflectionVisibility(-10, 60), 0);
  assert.equal(c.fvReflectionVisibility(0, 60), 0);
  assert.equal(c.fvReflectionVisibility(30, 60), 0.5);
  assert.equal(c.fvReflectionVisibility(60, 60), 1);
  assert.equal(c.fvReflectionVisibility(100, 60), 1);
});

test('clearcoat mixing preserves neutral tones and bright reflected light', () => {
  const { context: c } = setup();
  assert.equal(c.fvReflectChannel(100, 255, 0), 100);
  assert.ok(Math.abs(c.fvReflectChannel(128, 128, 0.5) - 128) <= 1);
  assert.ok(Math.abs(c.fvReflectChannel(0, 255, 0.5) - 188) <= 1);
});

test('recalibrating a photo invalidates its finished-floor cache entry', () => {
  const { context: c } = setup();
  const room = { image: 'same-photo', floorClipPath: 'polygon(0% 20%,100% 20%,100% 100%)' };
  const color = { texture: 'gray-flake', baseCoatColor: '#6F7276' };
  const key = c.fvCompositeKey(room, color);
  assert.notEqual(key, c.fvCompositeKey({ ...room, floorClipPath: 'polygon(0% 40%,100% 20%,100% 100%)' }, color));
  assert.notEqual(key, c.fvCompositeKey({ ...room, horizonY: 15 }, color));
  assert.notEqual(key, c.fvCompositeKey(room, { ...color, baseCoatColor: '#000000' }));
  c.fvCanvasCache.set(key, 'cached-preview');
  let result;
  c.fvComposite(room, color, value => { result = value; });
  assert.equal(result, 'cached-preview');
});

test('an older render cannot replace the latest selected color', () => {
  const { context: c, elements, timers } = setup();
  const pending = [];
  c.fvComposite = (room, color, done, cancelled) => pending.push({ done, cancelled });
  c.fvApplyColor(true);
  pending[0].done('first-preview'); // an already-completed result waiting to display
  c.fvState.color = { name: 'Second', slug: 'Second' };
  c.fvApplyColor(true);
  assert.equal(pending[0].cancelled(), true);
  assert.equal(pending[1].cancelled(), false);
  pending[1].done('second-preview');
  pending[0].done('stale-preview'); // late image/texture request
  timers.forEach(fn => fn());
  assert.equal(elements.get('fvImgAfter').src, 'second-preview');
  assert.equal(elements.get('fvImgAfter').alt, 'Test garage coated in Second');
});

test('comparison handle stays on the visible coating edge at any position', () => {
  const { context: c, elements } = setup();
  for (const percentage of [0, 25, 50, 80, 100]) {
    c.fvSetReveal(percentage);
    assert.equal(elements.get('fvDivider').style.left, (100 - percentage) + '%');
    assert.equal(elements.get('fvAfterWrap').style.clipPath, 'inset(0 0 0 ' + (100 - percentage) + '%)');
  }
});

test('wide and portrait photos retain their complete calibrated frame', () => {
  const { context: c, elements } = setup();
  c.fvSetStageAspect(1600, 900);
  assert.equal(elements.get('fvStage').style.aspectRatio, 1600 / 900);
  c.fvSetStageAspect(600, 1600);
  assert.equal(elements.get('fvStage').style.aspectRatio, 600 / 1600);
});
