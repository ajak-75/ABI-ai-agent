/**
 * PHASE 1 logic tests (no device needed).
 * Runs the pure functions that decide routing text and approvals.
 */
const assert = require('node:assert');

const { buildPlaceholderReply } = require('../.scratch/engine/placeholderReply.js');
const { requiresApproval, canAutoApprove, DEFAULT_POLICY } = require('../.scratch/security/approvals.js');

let passed = 0;

function test(name, fn) {
  fn();
  passed += 1;
  console.log(`  ok - ${name}`);
}

test('placeholder reply echoes the user text and marks phase 1', () => {
  const text = buildPlaceholderReply({
    messages: [
      { role: 'user', content: '안녕하세요, 대화가 저장되나요?' },
      { role: 'assistant', content: '...' },
      { role: 'user', content: '두 번째 질문' },
    ],
    mode: 'auto',
    engineLabel: '로컬 엔진 (미연결)',
  });

  assert.ok(text.includes('두 번째 질문'), 'last user turn is echoed');
  assert.ok(!text.includes('첫 질문'), 'only the last user turn is echoed');
  assert.ok(text.includes('1단계'), 'states that it is phase 1');
  assert.ok(text.includes('자동'), 'shows the requested route label');
  assert.ok(text.includes('SQLite'), 'mentions local storage');
});

test('placeholder reply truncates very long input', () => {
  const long = 'x'.repeat(200);
  const text = buildPlaceholderReply({
    messages: [{ role: 'user', content: long }],
    mode: 'local',
    engineLabel: '로컬 엔진 (미연결)',
  });
  assert.ok(text.includes('…'), 'adds an ellipsis for long input');
  assert.ok(!text.includes(long), 'full 200-char string is not repeated');
});

test('placeholder reply handles empty history', () => {
  const text = buildPlaceholderReply({ messages: [], mode: 'cloud_free', engineLabel: '무료 클라우드 (미연결)' });
  assert.ok(text.includes('입력을 확인했어요.'), 'falls back to a generic acknowledgement');
});

test('approval policy requires consent for medium and high risk', () => {
  assert.strictEqual(requiresApproval('low'), false);
  assert.strictEqual(requiresApproval('medium'), true);
  assert.strictEqual(requiresApproval('high'), true);
});

test('low risk may auto-run, medium/high may not', () => {
  assert.strictEqual(canAutoApprove('low'), true);
  assert.strictEqual(canAutoApprove('medium'), false);
  assert.strictEqual(canAutoApprove('high'), false);
});

test('forbidden categories are declared', () => {
  assert.ok(DEFAULT_POLICY.forbiddenCategories.includes('payment_without_confirmation'));
  assert.ok(DEFAULT_POLICY.forbiddenCategories.includes('credential_export'));
});

console.log(`\nLOGIC TESTS: ${passed} passed`);
