import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import less from 'less';
import { chromium } from 'playwright';

const beforeLess = execFileSync('git', ['show', 'bb53e09e1ac49c7efa98d6042e94230da8330f01:core/src/index.less'], { encoding: 'utf8' });
const afterLess = readFileSync('core/src/index.less', 'utf8');
const browser = await chromium.launch({ headless: true });
try {
  async function measure(source, mode, height) {
    const { css } = await less.render(source);
    const page = await browser.newPage({ viewport: { width: 1100, height: 700 } });
    await page.setContent(`<!doctype html><style>${css}</style>
      <div class="w-md-editor w-md-editor-show-${mode}" style="height:${height};width:600px">
        <div class="w-md-editor-content">
          <div class="w-md-editor-preview"><div style="height:180px"><h1>Long markdown preview</h1><p>Content</p></div></div>
        </div>
      </div>`);
    const values = await page.evaluate(() => {
      const root = document.querySelector('.w-md-editor');
      const content = document.querySelector('.w-md-editor-content');
      const preview = document.querySelector('.w-md-editor-preview');
      return { root: root.getBoundingClientRect().height, content: content.getBoundingClientRect().height,
        preview: preview.getBoundingClientRect().height, position: getComputedStyle(preview).position };
    });
    await page.close();
    return values;
  }
  const before = await measure(beforeLess, 'preview', '100%');
  const after = await measure(afterLess, 'preview', '100%');
  const live = await measure(afterLess, 'live', '200px');
  const fixed = await measure(afterLess, 'preview', '200px');
  console.log({ before, after, live, fixed });
  assert.equal(before.position, 'absolute');
  assert.ok(before.content < 40, 'baseline should reproduce collapsed preview');
  assert.equal(after.position, 'relative');
  assert.ok(after.content >= 180, 'preview-only should make the content grow');
  assert.ok(after.root >= 180, 'editor should grow with preview content');
  assert.equal(live.position, 'absolute');
  assert.equal(fixed.position, 'relative');
  assert.equal(Math.round(fixed.root), 200, 'fixed-height editors should retain their height');
  console.log('Adaptive preview height browser regression passed');
} finally {
  await browser.close();
}
