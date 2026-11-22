/** @jest-environment node */
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM, VirtualConsole } from 'jsdom';
import { buildProd } from './helpers';

let build: Awaited<ReturnType<typeof buildProd>>;

beforeAll(async () => {
  build = await buildProd();
}, 180_000);

afterAll(() => {
  if (build) fs.rmSync(build.outDir, { recursive: true, force: true });
});

describe('production build', () => {
  it('writes temporary output outside the repository', () => {
    const relativePath = path.relative(process.cwd(), build.outDir);
    expect(
      relativePath === '..' ||
        relativePath.startsWith(`..${path.sep}`) ||
        path.isAbsolute(relativePath),
    ).toBe(true);
  });

  it('emits index.html that references the main bundle', () => {
    const html = fs.readFileSync(path.join(build.outDir, 'index.html'), 'utf8');
    expect(html).toContain('js/main.js');
    expect(html).toContain('id="root"');
  });

  it('emits main.js and its source map', () => {
    expect(build.files).toContain('js/main.js');
    expect(build.files).toContain('js/main.js.map');
  });

  it('processes Tailwind through PostCSS', () => {
    expect(build.js).toContain('--tw-border-spacing-x');
  });

  it('compiles SCSS variables (no raw $brand left)', () => {
    expect(build.js).toContain('#4f46e5');
    expect(build.js).not.toContain('$brand');
  });

  it('generates scoped class names for CSS Modules', () => {
    expect(build.js).toMatch(/Tables\S*__table--/);
  });

  it('renders the table with its scoped class in the production bundle', async () => {
    const dom = new JSDOM('<!doctype html><div id="root"></div>', {
      url: 'http://localhost/tables',
      runScripts: 'dangerously',
      virtualConsole: new VirtualConsole(),
    });

    try {
      dom.window.eval(build.js);
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(dom.window.document.querySelector('table')?.className).toMatch(/Tables\S*__table--/);
    } finally {
      dom.window.close();
    }
  });

  it('asset/resource: ?url svg is emitted as a file', () => {
    expect(build.files).toContain('assets/pattern.svg');
  });

  it('SVGR: default svg import becomes a component, not a file', () => {
    expect(build.files).not.toContain('assets/logo.svg');
  });

  it('asset/inline: ?inline svg is embedded as a data URI', () => {
    expect(build.js).toContain('data:image/svg+xml;base64');
  });

  it('asset/source: ?raw text is embedded verbatim', () => {
    expect(build.js).toContain('RAW_SOURCE_MARKER');
  });

  it('emits fontsource woff2 files under fonts/', () => {
    expect(build.files.some((f) => /^fonts\/.+\.woff2$/.test(f))).toBe(true);
  });

  it('inlines production env values and the app version', () => {
    expect(build.js).toContain('Webpack Lab');
    expect(build.js).not.toContain('(dev)');
    expect(build.js).not.toContain('__APP_VERSION__');
  });
});
