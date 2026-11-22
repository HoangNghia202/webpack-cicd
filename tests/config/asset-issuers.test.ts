/** @jest-environment node */
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Configuration } from 'webpack';
import prodConfig from '../../config/webpack.prod';
import { runBuild } from './helpers';

const outDir = path.resolve(process.cwd(), `.webpack-build-${randomUUID()}`);
let dom: any;

beforeAll(async () => {
  const config: Configuration = {
    ...prodConfig,
    entry: './tests/config/fixtures/asset-issuers.js',
    output: { ...prodConfig.output, path: outDir },
  };
  await runBuild(config);
  const { JSDOM } = require('jsdom');
  dom = new JSDOM('<!doctype html>', { url: 'http://localhost/', runScripts: 'dangerously' });
  dom.window.eval(fs.readFileSync(path.join(outDir, 'js/main.js'), 'utf8'));
}, 180_000);

afterAll(() => {
  dom?.window.close();
  fs.rmSync(outDir, { recursive: true, force: true });
});

it('imports SVG with ?raw as the original source text', () => {
  const original = fs.readFileSync(path.resolve('src/assets/pattern.svg'), 'utf8');
  expect(dom.window.rawSvg).toBe(original);
});

it('emits a usable SVG for a CSS url issuer', () => {
  const css = dom.window.document.querySelector('style')?.textContent;
  expect(css).toContain('/assets/dot.svg');
  expect(fs.readFileSync(path.join(outDir, 'assets/dot.svg'), 'utf8'))
    .toBe(fs.readFileSync(path.resolve('src/assets/dot.svg'), 'utf8'));
});
