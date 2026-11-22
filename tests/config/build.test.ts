/** @jest-environment node */
import fs from 'node:fs';
import path from 'node:path';
import { buildProd } from './helpers';

let build: Awaited<ReturnType<typeof buildProd>>;

beforeAll(async () => {
  build = await buildProd();
}, 180_000);

afterAll(() => {
  if (build) fs.rmSync(build.outDir, { recursive: true, force: true });
});

describe('production build', () => {
  it('emits index.html that references the main bundle', () => {
    const html = fs.readFileSync(path.join(build.outDir, 'index.html'), 'utf8');
    expect(html).toContain('js/main.js');
    expect(html).toContain('id="root"');
  });

  it('emits main.js and its source map', () => {
    expect(build.files).toContain('js/main.js');
    expect(build.files).toContain('js/main.js.map');
  });
});
