# Week 1 – Webpack Foundation & Dev Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a hand-configured webpack 5 + React 18 + TypeScript app ("Mini Admin Dashboard", 3 pages) with a full dev experience (HMR, Fast Refresh, proxy), styles/asset pipelines, env handling, lint/typecheck, and tests that verify the webpack config itself.

**Architecture:** Config split into `config/webpack.{common,dev,prod}.js` merged with `webpack-merge`. Babel (`babel-loader`) transpiles TS/React. Config behavior is verified by Jest tests that run a real production build into a temp dir and assert on emitted files/bundle content. Week 2 will add optimization (splitChunks, minify, etc.) on top of this base.

**Tech Stack:** Node 22, webpack 5, webpack-cli, webpack-dev-server 5, React 18, react-router-dom 6, TypeScript, Babel, Tailwind CSS 3 + PostCSS, Sass, SVGR, dotenv-webpack, Jest 29 + React Testing Library, ESLint 9 (flat) + Prettier.

## Global Constraints

- Node 22 (`.nvmrc` = `22`), npm as package manager.
- No CRA / Vite; every webpack option is written by hand.
- React 18 (not 19), react-router-dom 6, Tailwind **3** (not 4), Jest 29, ESLint 9 flat config, `eslint-plugin-react-hooks@5`.
- TypeScript `strict: true`; alias `@` → `src`.
- Webpack configs are CommonJS JS files in `config/`, each annotated with `/** @type {import('webpack').Configuration} */`.
- Build output dir: `dist/`; dev server port `3000`; `publicPath: '/'`.
- Dev uses `style-loader` for CSS (MiniCssExtract is Week 2).
- Commit after every task. The repository is initialized on `main`; the controller commits the plan and `.gitignore` as the base before creating the implementation worktree. Do not run `git init` again in the worktree.
- Run all implementation commands from the worktree created for this plan; do not hardcode the original checkout path.

## File Structure

```
.nvmrc  .gitignore  .prettierrc  .prettierignore
babel.config.js  tsconfig.json  jest.config.js  eslint.config.js
postcss.config.js  tailwind.config.js
.env.development  .env.production  .env.example
public/index.html
config/webpack.common.js   # entry/output/resolve/loaders/shared plugins
config/webpack.dev.js      # mode, devtool, devServer, React Refresh, dev env
config/webpack.prod.js     # mode, devtool, prod env
src/index.tsx  src/App.tsx
src/components/Layout.tsx
src/pages/{Dashboard,Tables,Settings}.tsx  src/pages/Tables.module.scss
src/data/users.ts
src/styles/{tailwind.css,global.scss,_variables.scss}
src/assets/{logo.svg,pattern.svg,dot.svg,about.txt}
src/types/{assets.d.ts,global.d.ts}
tests/setup.ts  tests/mocks/{empty.js,file.js,svg.js}
tests/App.test.tsx
tests/config/{helpers.ts,build.test.ts,dev.test.ts}
docs/week1-notes.md
```

---

### Task 1: Repo, toolchain, and test harness

**Files:**
- Create: `.nvmrc`, `.gitignore`, `babel.config.js`, `tsconfig.json`, `jest.config.js`, `tests/setup.ts`, `tests/mocks/empty.js`, `tests/mocks/file.js`, `tests/mocks/svg.js`, `tests/toolchain.test.tsx`
- Modify: `package.json`

**Interfaces:**
- Produces: npm scripts `test`, `typecheck`; Babel config that adds `react-refresh/babel` only when `NODE_ENV=development`; Jest moduleNameMapper (css/svg/raw stubs, `@` alias); global test setup defining `__APP_VERSION__='test'`, `process.env.APP_NAME='Webpack Lab (test)'`, `process.env.API_URL='/api'`.

- [ ] **Step 1: Init repo and install deps**

```bash
echo "22" > .nvmrc
npm init -y
npm pkg set name=webpack-cicd-lab version=0.1.0 private=true
npm i react@18 react-dom@18
npm i -D typescript @types/react@18 @types/react-dom@18 @types/node @types/jest \
  @babel/core @babel/preset-env @babel/preset-react @babel/preset-typescript \
  jest@29 jest-environment-jsdom@29 babel-jest@29 identity-obj-proxy \
  @testing-library/react @testing-library/dom @testing-library/jest-dom cross-env
npm pkg set scripts.test="jest" scripts.typecheck="tsc --noEmit"
```

- [ ] **Step 2: Create `.gitignore`**

```
node_modules
dist
coverage
.env.local
.DS_Store
```

- [ ] **Step 3: Create `babel.config.js`**

```js
module.exports = (api) => {
  const isDev = api.env('development');
  return {
    presets: [
      ['@babel/preset-env', { targets: 'defaults' }],
      ['@babel/preset-react', { runtime: 'automatic' }],
      '@babel/preset-typescript',
    ],
    plugins: isDev ? ['react-refresh/babel'] : [],
  };
};
```

- [ ] **Step 4: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "allowJs": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },
    "types": ["node", "jest"]
  },
  "include": ["src", "tests", "config"]
}
```

- [ ] **Step 5: Create Jest config, setup and mocks**

`jest.config.js` (order matters: first matching pattern wins, alias last):

```js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleNameMapper: {
    '\\.module\\.s?css$': 'identity-obj-proxy',
    '\\.s?css$': '<rootDir>/tests/mocks/empty.js',
    '\\.svg\\?(url|inline)$': '<rootDir>/tests/mocks/file.js',
    '\\?raw$': '<rootDir>/tests/mocks/file.js',
    '\\.svg$': '<rootDir>/tests/mocks/svg.js',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

`tests/setup.ts`:

```ts
import '@testing-library/jest-dom';

Object.assign(globalThis, { __APP_VERSION__: 'test' });
process.env.APP_NAME = 'Webpack Lab (test)';
process.env.API_URL = '/api';
```

`tests/mocks/empty.js`: `module.exports = {};`
`tests/mocks/file.js`: `module.exports = { __esModule: true, default: 'test-file-stub' };`
`tests/mocks/svg.js`: `module.exports = { __esModule: true, default: () => null };`

- [ ] **Step 6: Write a toolchain smoke test** — `tests/toolchain.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';

it('compiles TSX through babel-jest', () => {
  render(<p>hello</p>);
  expect(screen.getByText('hello')).toBeInTheDocument();
});
```

- [ ] **Step 7: Run tests and typecheck**

Run: `npm test && npm run typecheck`
Expected: 1 test PASS; `tsc` exits 0.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "chore: init repo with TS, Babel, Jest toolchain"
```

---

### Task 2: Minimal production build (common/prod config split)

**Learn:** `entry`, `output` (`path`, `filename`, `publicPath`, `clean`), `mode`, `resolve.extensions/alias`, `module.rules` + `babel-loader`, `HtmlWebpackPlugin`, `devtool: 'source-map'`, `webpack-merge`, `ForkTsCheckerWebpackPlugin`.

**Files:**
- Create: `public/index.html`, `src/index.tsx`, `src/App.tsx`, `config/webpack.common.js`, `config/webpack.prod.js`, `tests/config/helpers.ts`, `tests/config/build.test.ts`
- Modify: `package.json` (scripts)

**Interfaces:**
- Produces: `config/webpack.common.js` exports a Configuration object (no `mode`); `config/webpack.prod.js` exports merged Configuration. `tests/config/helpers.ts` exports `runBuild(config): Promise<Stats>` and `buildProd(): Promise<{ outDir: string; stats: Stats; files: string[]; js: string }>` where `js` is all emitted `.js` concatenated.

- [ ] **Step 1: Install webpack deps**

```bash
npm i -D webpack webpack-cli webpack-merge html-webpack-plugin babel-loader fork-ts-checker-webpack-plugin
npm pkg set scripts.build="cross-env NODE_ENV=production webpack --config config/webpack.prod.js"
```

- [ ] **Step 2: Write the failing test**

`tests/config/helpers.ts`:

```ts
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import webpack, { Configuration, Stats } from 'webpack';
import prodConfig from '../../config/webpack.prod';

export function runBuild(config: Configuration): Promise<Stats> {
  return new Promise((resolve, reject) => {
    webpack(config, (err, stats) => {
      if (err) return reject(err);
      if (!stats) return reject(new Error('webpack returned no stats'));
      if (stats.hasErrors()) {
        return reject(new Error(stats.toString({ all: false, errors: true })));
      }
      resolve(stats);
    });
  });
}

export async function buildProd() {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-'));
  const config: Configuration = {
    ...prodConfig,
    output: { ...prodConfig.output, path: outDir },
  };
  const stats = await runBuild(config);
  const files = fs.readdirSync(outDir, { recursive: true }) as string[];
  const js = files
    .filter((f) => f.endsWith('.js'))
    .map((f) => fs.readFileSync(path.join(outDir, f), 'utf8'))
    .join('\n');
  return { outDir, stats, files, js };
}
```

`tests/config/build.test.ts`:

```ts
/** @jest-environment node */
import fs from 'node:fs';
import path from 'node:path';
import { buildProd } from './helpers';

let build: Awaited<ReturnType<typeof buildProd>>;

beforeAll(async () => {
  build = await buildProd();
}, 180_000);

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
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx jest tests/config/build.test.ts`
Expected: FAIL – "Cannot find module '../../config/webpack.prod'".

- [ ] **Step 4: Create app skeleton**

`public/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Webpack Lab</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

`src/App.tsx`:

```tsx
export default function App() {
  return <h1>Webpack Lab</h1>;
}
```

`src/index.tsx`:

```tsx
import { createRoot } from 'react-dom/client';
import App from '@/App';

createRoot(document.getElementById('root')!).render(<App />);
```

- [ ] **Step 5: Create webpack configs**

`config/webpack.common.js`:

```js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const root = path.resolve(__dirname, '..');

/** @type {import('webpack').Configuration} */
module.exports = {
  context: root,
  entry: './src/index.tsx',
  output: {
    path: path.resolve(root, 'dist'),
    filename: 'js/[name].js',
    publicPath: '/',
    clean: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: { '@': path.resolve(root, 'src') },
  },
  module: {
    rules: [{ test: /\.[jt]sx?$/, exclude: /node_modules/, use: 'babel-loader' }],
  },
  plugins: [
    new HtmlWebpackPlugin({ template: './public/index.html' }),
    new ForkTsCheckerWebpackPlugin(),
  ],
};
```

`config/webpack.prod.js`:

```js
const { merge } = require('webpack-merge');
const common = require('./webpack.common');

/** @type {import('webpack').Configuration} */
module.exports = merge(common, {
  mode: 'production',
  devtool: 'source-map',
});
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx jest tests/config/build.test.ts`
Expected: PASS (2 tests). Then `npm run build && ls dist dist/js` shows `index.html`, `js/main.js`, `js/main.js.map`.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: minimal webpack prod build with common/prod split"
```

---

### Task 3: Dev server, HMR, React Fast Refresh, proxy

**Learn:** `mode: 'development'`, `devtool` choices (`eval-cheap-module-source-map` vs `source-map`), `devServer.hot`, `historyApiFallback` (SPA routing), `proxy`, error overlay, Fast Refresh = Babel plugin + `ReactRefreshWebpackPlugin`.

**Files:**
- Create: `config/webpack.dev.js`, `tests/config/dev.test.ts`
- Modify: `package.json` (scripts)

**Interfaces:**
- Consumes: `config/webpack.common.js`, Babel plugin gate on `NODE_ENV=development` (Task 1).
- Produces: `config/webpack.dev.js` default export Configuration; scripts `dev`, `build:dev`.

- [ ] **Step 1: Install deps and scripts**

```bash
npm i -D webpack-dev-server @pmmmwh/react-refresh-webpack-plugin react-refresh
npm pkg set scripts.dev="cross-env NODE_ENV=development webpack serve --config config/webpack.dev.js"
npm pkg set scripts.build:dev="cross-env NODE_ENV=development webpack --config config/webpack.dev.js"
```

- [ ] **Step 2: Write the failing test** — `tests/config/dev.test.ts`

```ts
/** @jest-environment node */
import devConfig from '../../config/webpack.dev';

describe('dev config', () => {
  it('uses development mode and a fast source map', () => {
    expect(devConfig.mode).toBe('development');
    expect(devConfig.devtool).toBe('eval-cheap-module-source-map');
  });

  it('enables HMR, SPA fallback and port 3000', () => {
    expect(devConfig.devServer).toMatchObject({
      hot: true,
      historyApiFallback: true,
      port: 3000,
    });
  });

  it('proxies /api to the backend', () => {
    expect(devConfig.devServer?.proxy).toEqual([
      { context: ['/api'], target: 'http://localhost:4000', changeOrigin: true },
    ]);
  });

  it('registers React Fast Refresh', () => {
    const names = (devConfig.plugins ?? []).map((p) => (p as object)?.constructor?.name);
    expect(names).toContain('ReactRefreshPlugin');
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npx jest tests/config/dev.test.ts`
Expected: FAIL – cannot find `config/webpack.dev`.

- [ ] **Step 4: Implement `config/webpack.dev.js`**

```js
const { merge } = require('webpack-merge');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const common = require('./webpack.common');

/** @type {import('webpack').Configuration} */
module.exports = merge(common, {
  mode: 'development',
  devtool: 'eval-cheap-module-source-map',
  devServer: {
    port: 3000,
    hot: true,
    compress: true,
    historyApiFallback: true,
    client: { overlay: true },
    proxy: [{ context: ['/api'], target: 'http://localhost:4000', changeOrigin: true }],
  },
  plugins: [new ReactRefreshWebpackPlugin()],
});
```

- [ ] **Step 5: Run unit test**

Run: `npx jest tests/config/dev.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Smoke test the real server**

Run in an async shell: `npm run dev`. Wait until output shows "compiled successfully", then:

```bash
curl -s localhost:3000 | grep -c 'id="root"'
curl -s localhost:3000/some/deep/route | grep -c 'id="root"'
```
Expected: both print `1` (second proves `historyApiFallback`). Stop the server.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: dev server with HMR, fast refresh, proxy"
```

---

### Task 4: Routing and three pages (TDD with RTL)

**Files:**
- Create: `src/data/users.ts`, `src/components/Layout.tsx`, `src/pages/Dashboard.tsx`, `src/pages/Tables.tsx`, `src/pages/Settings.tsx`, `tests/App.test.tsx`
- Modify: `src/App.tsx`, `src/index.tsx`
- Delete: `tests/toolchain.test.tsx`

**Interfaces:**
- Produces: `users: { id: number; name: string; email: string; role: string }[]` exported from `@/data/users`; default exports `Layout`, `Dashboard`, `Tables`, `Settings`; `App` renders `<Routes>` (must be wrapped by a Router by caller). Routes: `/` Dashboard, `/tables`, `/settings`. Nav link texts: `Dashboard`, `Tables`, `Settings`. Settings has a button toggling class `dark` on `document.documentElement` with names "Switch to dark" / "Switch to light".

- [ ] **Step 1: Install router**

```bash
npm i react-router-dom@6
git rm -q tests/toolchain.test.tsx
```

- [ ] **Step 2: Write the failing test** — `tests/App.test.tsx`

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '@/App';
import { users } from '@/data/users';

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );

afterEach(() => document.documentElement.classList.remove('dark'));

it('renders the dashboard at /', () => {
  renderAt('/');
  expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  expect(screen.getByText('Revenue')).toBeInTheDocument();
});

it('lists every user in the table', () => {
  renderAt('/tables');
  expect(screen.getByRole('heading', { name: 'Tables' })).toBeInTheDocument();
  expect(screen.getAllByRole('row')).toHaveLength(users.length + 1);
});

it('toggles dark mode on the settings page', () => {
  renderAt('/settings');
  fireEvent.click(screen.getByRole('button', { name: /switch to dark/i }));
  expect(document.documentElement).toHaveClass('dark');
  expect(screen.getByRole('button', { name: /switch to light/i })).toBeInTheDocument();
});

it('navigates with the main nav', () => {
  renderAt('/');
  fireEvent.click(screen.getByRole('link', { name: 'Tables' }));
  expect(screen.getByRole('heading', { name: 'Tables' })).toBeInTheDocument();
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npx jest tests/App.test.tsx`
Expected: FAIL (headings/links not found; `@/data/users` missing).

- [ ] **Step 4: Implement**

`src/data/users.ts`:

```ts
export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export const users: User[] = [
  { id: 1, name: 'Ada Lovelace', email: 'ada@example.com', role: 'Admin' },
  { id: 2, name: 'Alan Turing', email: 'alan@example.com', role: 'Editor' },
  { id: 3, name: 'Grace Hopper', email: 'grace@example.com', role: 'Editor' },
  { id: 4, name: 'Linus Torvalds', email: 'linus@example.com', role: 'Viewer' },
  { id: 5, name: 'Margaret Hamilton', email: 'margaret@example.com', role: 'Viewer' },
];
```

`src/components/Layout.tsx`:

```tsx
import { NavLink, Outlet } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/tables', label: 'Tables' },
  { to: '/settings', label: 'Settings' },
];

export default function Layout() {
  return (
    <div>
      <nav aria-label="Main">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end>
            {l.label}
          </NavLink>
        ))}
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
```

`src/pages/Dashboard.tsx`:

```tsx
const stats = [
  { label: 'Users', value: '1,280' },
  { label: 'Revenue', value: '$48,200' },
  { label: 'Orders', value: '342' },
];

export default function Dashboard() {
  return (
    <section>
      <h1>Dashboard</h1>
      <dl>
        {stats.map((s) => (
          <div key={s.label}>
            <dt>{s.label}</dt>
            <dd>{s.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
```

`src/pages/Tables.tsx`:

```tsx
import { users } from '@/data/users';

export default function Tables() {
  return (
    <section>
      <h1>Tables</h1>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
```

`src/pages/Settings.tsx`:

```tsx
import { useState } from 'react';

export default function Settings() {
  const [dark, setDark] = useState(false);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
  };

  return (
    <section>
      <h1>Settings</h1>
      <button type="button" onClick={toggle}>
        {dark ? 'Switch to light' : 'Switch to dark'}
      </button>
    </section>
  );
}
```

`src/App.tsx`:

```tsx
import { Route, Routes } from 'react-router-dom';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Settings from '@/pages/Settings';
import Tables from '@/pages/Tables';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="tables" element={<Tables />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
```

`src/index.tsx`:

```tsx
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '@/App';

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
```

- [ ] **Step 5: Run all tests + typecheck**

Run: `npm test && npm run typecheck`
Expected: all PASS, tsc exit 0.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: routing and dashboard/tables/settings pages"
```

---

### Task 5: Style pipeline (CSS, SCSS, CSS Modules, PostCSS, Tailwind)

**Learn:** loader order (right-to-left / bottom-to-top): `sass-loader → postcss-loader → css-loader → style-loader`; `importLoaders`; CSS Modules `localIdentName`; PostCSS plugins; Tailwind `content` scanning + `darkMode: 'class'`.

**Files:**
- Create: `postcss.config.js`, `tailwind.config.js`, `src/styles/tailwind.css`, `src/styles/_variables.scss`, `src/styles/global.scss`, `src/pages/Tables.module.scss`, `src/types/assets.d.ts`
- Modify: `config/webpack.common.js`, `src/index.tsx`, `src/components/Layout.tsx`, `src/pages/Dashboard.tsx`, `src/pages/Tables.tsx`, `tests/config/build.test.ts`

**Interfaces:**
- Consumes: `buildProd()` result `{ js }` (Task 2).
- Produces: `*.module.scss` default export `Record<string,string>`; style rules in `webpack.common.js` via `styleRule({ test, exclude?, modules?, sass? })`.

- [ ] **Step 1: Install deps**

```bash
npm i -D style-loader css-loader postcss postcss-loader autoprefixer tailwindcss@3 sass sass-loader
```

- [ ] **Step 2: Add failing assertions** — append inside the `describe` in `tests/config/build.test.ts`

```ts
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
```

- [ ] **Step 3: Run to verify failure**

Run: `npx jest tests/config/build.test.ts`
Expected: 3 new tests FAIL.

- [ ] **Step 4: Create style files**

`postcss.config.js`:

```js
module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

`tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./public/index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
};
```

`src/styles/tailwind.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

`src/styles/_variables.scss`:

```scss
$brand: #4f46e5;
$text: #0f172a;
```

`src/styles/global.scss`:

```scss
@use 'variables' as *;

body {
  margin: 0;
  font-family: system-ui, sans-serif;
  color: $text;
}

a {
  color: $brand;
}

.dark body {
  color: #e2e8f0;
}
```

`src/pages/Tables.module.scss`:

```scss
@use '../styles/variables' as *;

.table {
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    padding: 0.5rem 0.75rem;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
  }

  th {
    color: $brand;
  }
}
```

`src/types/assets.d.ts`:

```ts
declare module '*.module.scss' {
  const classes: Record<string, string>;
  export default classes;
}
declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}
```

- [ ] **Step 5: Add rules to `config/webpack.common.js`**

Add above `module.exports`:

```js
const cssModuleOptions = { localIdentName: '[name]__[local]--[hash:base64:5]' };

const styleRule = ({ test, exclude, modules = false, sass = false }) => ({
  test,
  exclude,
  use: [
    'style-loader',
    {
      loader: 'css-loader',
      options: { importLoaders: sass ? 2 : 1, modules: modules ? cssModuleOptions : false },
    },
    'postcss-loader',
    ...(sass ? ['sass-loader'] : []),
  ],
});
```

Extend `module.rules`:

```js
    rules: [
      { test: /\.[jt]sx?$/, exclude: /node_modules/, use: 'babel-loader' },
      styleRule({ test: /\.module\.scss$/, modules: true, sass: true }),
      styleRule({ test: /\.module\.css$/, modules: true }),
      styleRule({ test: /\.scss$/, exclude: /\.module\.scss$/, sass: true }),
      styleRule({ test: /\.css$/, exclude: /\.module\.css$/ }),
    ],
```

- [ ] **Step 6: Wire styles into the app**

`src/index.tsx` — add before other imports' usage:

```tsx
import '@/styles/tailwind.css';
import '@/styles/global.scss';
```

`src/components/Layout.tsx` (replace return):

```tsx
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 dark:text-slate-100">
      <nav aria-label="Main" className="flex gap-4 bg-slate-900 px-6 py-3 text-white">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end
            className={({ isActive }) =>
              isActive ? 'font-semibold underline' : 'opacity-80 hover:opacity-100'
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
      <main className="mx-auto max-w-4xl p-6">
        <Outlet />
      </main>
    </div>
```

`src/pages/Dashboard.tsx` — change `<dl>` and children:

```tsx
      <dl className="mt-4 grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg bg-white p-4 shadow dark:bg-slate-800">
            <dt className="text-sm text-slate-500">{s.label}</dt>
            <dd className="text-2xl font-semibold">{s.value}</dd>
          </div>
        ))}
      </dl>
```

`src/pages/Tables.tsx` — add `import styles from './Tables.module.scss';` and change `<table>` to `<table className={styles.table}>`.

- [ ] **Step 7: Run all verification**

Run: `npm test && npm run typecheck`
Expected: PASS (all build assertions incl. 3 new ones; App tests still pass via mappers).

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: css/scss/modules/postcss/tailwind pipeline"
```

---

### Task 6: Asset Modules (resource / inline / source), SVG as component, fonts

**Learn:** `asset/resource` (emit file + URL), `asset/inline` (data URI), `asset/source` (raw string), `asset` (auto by size via `dataUrlCondition`), `resourceQuery` to choose behavior per import, `output.assetModuleFilename`, `generator.filename`.

**Files:**
- Create: `src/assets/logo.svg`, `src/assets/pattern.svg`, `src/assets/dot.svg`, `src/assets/about.txt`
- Modify: `config/webpack.common.js`, `src/types/assets.d.ts`, `src/index.tsx`, `src/pages/Settings.tsx`, `tests/config/build.test.ts`

**Interfaces:**
- Produces: import conventions — `import Logo from '@/assets/logo.svg'` (React component), `'x.svg?url'` (string URL, emitted to `assets/`), `'x.svg?inline'` (data URI string), `'x.txt?raw'` (file contents string). Fonts emitted to `fonts/`.

- [ ] **Step 1: Install deps**

```bash
npm i @fontsource/inter
npm i -D @svgr/webpack
```

- [ ] **Step 2: Add failing assertions** — append inside the `describe` in `tests/config/build.test.ts`

```ts
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
```

- [ ] **Step 3: Run to verify failure**

Run: `npx jest tests/config/build.test.ts`
Expected: 5 new tests FAIL.

- [ ] **Step 4: Create assets**

`src/assets/logo.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12l8-8 8 8-8 8z"/></svg>
```

`src/assets/pattern.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40"><circle cx="20" cy="20" r="6" fill="#4f46e5"/></svg>
```

`src/assets/dot.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8" width="8" height="8"><circle cx="4" cy="4" r="3" fill="#10b981"/></svg>
```

`src/assets/about.txt`:

```
RAW_SOURCE_MARKER: this text is inlined by asset/source.
```

- [ ] **Step 5: Update `config/webpack.common.js`**

In `output` add `assetModuleFilename: 'assets/[name][ext]',`. Append to `module.rules`:

```js
      { test: /\.svg$/i, resourceQuery: /url/, type: 'asset/resource' },
      { test: /\.svg$/i, resourceQuery: /inline/, type: 'asset/inline' },
      { test: /\.svg$/i, resourceQuery: { not: [/url/, /inline/] }, use: ['@svgr/webpack'] },
      { resourceQuery: /raw/, type: 'asset/source' },
      {
        test: /\.(png|jpe?g|gif|webp)$/i,
        type: 'asset',
        parser: { dataUrlCondition: { maxSize: 8 * 1024 } },
      },
      {
        test: /\.(woff2?|ttf|eot)$/i,
        type: 'asset/resource',
        generator: { filename: 'fonts/[name][ext]' },
      },
```

- [ ] **Step 6: Add type declarations** — append to `src/types/assets.d.ts`

```ts
declare module '*.svg' {
  import type { FC, SVGProps } from 'react';
  const Component: FC<SVGProps<SVGSVGElement>>;
  export default Component;
}
declare module '*.svg?url' {
  const src: string;
  export default src;
}
declare module '*.svg?inline' {
  const src: string;
  export default src;
}
declare module '*?raw' {
  const content: string;
  export default content;
}
```

- [ ] **Step 7: Use assets in the app**

`src/index.tsx` — add `import '@fontsource/inter/400.css';` first; in `src/styles/global.scss` change font-family to `'Inter', system-ui, sans-serif;`.

`src/pages/Settings.tsx` — add imports and an "Assets" block:

```tsx
import aboutText from '@/assets/about.txt?raw';
import dotInline from '@/assets/dot.svg?inline';
import Logo from '@/assets/logo.svg';
import patternUrl from '@/assets/pattern.svg?url';
```

```tsx
      <h2 className="mt-6 text-lg font-semibold">Assets</h2>
      <div className="flex items-center gap-4">
        <Logo aria-label="logo" className="h-6 w-6 text-indigo-600" />
        <img src={patternUrl} alt="pattern (asset/resource)" width={40} height={40} />
        <img src={dotInline} alt="dot (asset/inline)" width={8} height={8} />
      </div>
      <pre className="mt-2 text-sm">{aboutText}</pre>
```
(place inside the `<section>` after the button).

- [ ] **Step 8: Run all verification**

Run: `npm test && npm run typecheck`
Expected: PASS (all build + app tests).

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "feat: asset modules, svgr and font handling"
```

---

### Task 7: Environment variables (dotenv-webpack + DefinePlugin)

**Learn:** compile-time constants vs runtime env; `DefinePlugin` replaces identifiers at build time; `dotenv-webpack` exposes only vars *referenced* in code (so secrets in `.env` aren't all leaked); per-mode env files.

**Files:**
- Create: `.env.development`, `.env.production`, `.env.example`, `src/types/global.d.ts`
- Modify: `config/webpack.common.js`, `config/webpack.dev.js`, `config/webpack.prod.js`, `src/pages/Settings.tsx`, `tests/App.test.tsx`, `tests/config/build.test.ts`

**Interfaces:**
- Produces: `process.env.APP_NAME`, `process.env.API_URL` (via dotenv per mode); `__APP_VERSION__` (from `package.json` version) via DefinePlugin.

- [ ] **Step 1: Install**

```bash
npm i -D dotenv-webpack
```

- [ ] **Step 2: Add failing tests**

Append to `tests/config/build.test.ts` `describe`:

```ts
  it('inlines production env values and the app version', () => {
    expect(build.js).toContain('Webpack Lab');
    expect(build.js).not.toContain('(dev)');
    expect(build.js).not.toContain('__APP_VERSION__');
  });
```

Append to `tests/App.test.tsx`:

```tsx
it('shows env-derived info on the settings page', () => {
  renderAt('/settings');
  expect(screen.getByText(/Webpack Lab \(test\)/)).toBeInTheDocument();
  expect(screen.getByText(/version: test/i)).toBeInTheDocument();
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npx jest`
Expected: the new build test and the new App test FAIL.

- [ ] **Step 4: Create env files**

`.env.development`:

```
APP_NAME=Webpack Lab (dev)
API_URL=/api
```

`.env.production`:

```
APP_NAME=Webpack Lab
API_URL=https://api.example.com
```

`.env.example` — same keys as above with `APP_NAME=` and `API_URL=` empty.

`src/types/global.d.ts`:

```ts
declare const __APP_VERSION__: string;
```

- [ ] **Step 5: Implement config**

`config/webpack.common.js` — add `const { DefinePlugin } = require('webpack');` and `const pkg = require('../package.json');`, then add to `plugins`:

```js
    new DefinePlugin({ __APP_VERSION__: JSON.stringify(pkg.version) }),
```

`config/webpack.dev.js` — add `const path = require('path'); const Dotenv = require('dotenv-webpack');` and to `plugins`:

```js
    new Dotenv({ path: path.resolve(__dirname, '../.env.development') }),
```

`config/webpack.prod.js` — same imports, plus:

```js
  plugins: [new Dotenv({ path: path.resolve(__dirname, '../.env.production') })],
```

`src/pages/Settings.tsx` — add inside the `<section>`:

```tsx
      <p className="mt-4 text-sm text-slate-500">
        {process.env.APP_NAME} · version: {__APP_VERSION__} · api: {process.env.API_URL}
      </p>
```

- [ ] **Step 6: Run verification**

Run: `npm test && npm run typecheck`
Expected: all PASS.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: per-mode env vars with dotenv-webpack and DefinePlugin"
```

---

### Task 8: ESLint, Prettier, typecheck gate

**Learn:** type-check outside the bundler (`tsc --noEmit`) + inside the build (`ForkTsCheckerWebpackPlugin` runs in a separate process so it doesn't slow transpile); lint flat config; one `verify` script reused by CI in Week 3.

**Files:**
- Create: `eslint.config.js`, `.prettierrc`, `.prettierignore`
- Modify: `package.json` (scripts)

**Interfaces:**
- Produces: scripts `lint`, `format`, `format:check`, `verify` (= typecheck + lint + format:check + test + build).

- [ ] **Step 1: Install**

```bash
npm i -D eslint@9 @eslint/js typescript-eslint eslint-plugin-react-hooks@5 eslint-config-prettier prettier
npm pkg set scripts.lint="eslint ." scripts.format="prettier --write ." scripts.format:check="prettier --check ."
npm pkg set scripts.verify="npm run typecheck && npm run lint && npm run format:check && npm test && npm run build"
```

- [ ] **Step 2: Create config files**

`eslint.config.js`:

```js
const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const hooks = require('eslint-plugin-react-hooks');
const prettier = require('eslint-config-prettier');

module.exports = tseslint.config(
  { ignores: ['dist', 'node_modules', 'coverage'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': hooks },
    rules: hooks.configs.recommended.rules,
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { module: 'writable', require: 'readonly', __dirname: 'readonly', process: 'readonly' },
    },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  prettier,
);
```

`.prettierrc`:

```json
{ "singleQuote": true, "semi": true, "trailingComma": "all", "printWidth": 100 }
```

`.prettierignore`:

```
dist
node_modules
coverage
package-lock.json
docs
```

- [ ] **Step 3: Format, then lint**

Run: `npm run format && npm run lint`
Expected: lint exits 0. If errors appear, fix the reported code (do not disable rules).

- [ ] **Step 4: Prove the type gate works inside the build**

```bash
printf "export const bad: number = 'not a number';\n" > src/bad.ts
npm run build; echo "exit=$?"
```
Expected: build FAILS with a TS2322 error from fork-ts-checker and `exit=1`. Then `rm src/bad.ts`.

- [ ] **Step 5: Run the full gate**

Run: `npm run verify`
Expected: every stage passes, exit 0.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "chore: eslint, prettier and verify script"
```

---

### Task 9: Manual DX verification and learning notes

**Files:**
- Create: `docs/week1-notes.md`

- [ ] **Step 1: Verify HMR / Fast Refresh manually**

Run `npm run dev`, open http://localhost:3000/settings in a browser:
1. Click "Switch to dark" (state now `dark`).
2. Edit the `<h1>` text in `src/pages/Settings.tsx` and save.
Expected: heading updates **without full page reload and the button still says "Switch to light"** (state preserved = Fast Refresh working). Network tab shows a `*.hot-update.json` request.
3. Introduce a TS type error in a file → browser overlay shows it; fix it → overlay disappears.
4. Open DevTools → Sources: original `.tsx` files visible (source map OK).

- [ ] **Step 2: Experiment – compare transpilers (temporary local config edits)**

```bash
npm i -D swc-loader @swc/core ts-loader
```
For each of `babel-loader` (baseline), `swc-loader`, `ts-loader` (with `options: { transpileOnly: true }`) swap the JS rule `use` in `config/webpack.common.js` (swc options: `{ jsc: { parser: { syntax: 'typescript', tsx: true }, transform: { react: { runtime: 'automatic' } } } }`), then run:

```bash
rm -rf node_modules/.cache dist && time npm run build:dev
```
Record three runs each in `docs/week1-notes.md`. Restore the Babel loader rule from `git show HEAD:config/webpack.common.js` before switching to another experiment; do not switch branches or change the worktree's branch.

- [ ] **Step 3: Experiment – compare `devtool`**

In `config/webpack.dev.js` try `eval`, `eval-cheap-module-source-map` (current), `source-map`, `false`; for each note build time and whether breakpoints map to original TS. Restore `eval-cheap-module-source-map` manually before finishing; do not discard unrelated working-tree changes with a checkout/restore command.

- [ ] **Step 4: Write `docs/week1-notes.md`**

```markdown
# Week 1 notes

## Concepts (answer in your own words)
1. Loader vs plugin – what is the difference and give one example of each from this repo.
2. Why do style loaders run in the order sass → postcss → css → style?
3. What does `importLoaders` do and why is it 2 for SCSS?
4. asset/resource vs asset/inline vs asset/source – when do you choose each?
5. Why does dotenv-webpack expose only referenced variables? What breaks if you write `process.env[key]`?
6. What does ForkTsCheckerWebpackPlugin buy us versus `ts-loader` without `transpileOnly`?

## Experiment 1 – transpiler comparison (seconds, 3 runs each)
| loader | run 1 | run 2 | run 3 | notes |
|---|---|---|---|---|
| babel-loader | | | | |
| swc-loader | | | | |
| ts-loader (transpileOnly) | | | | |

## Experiment 2 – devtool comparison
| devtool | build s | rebuild s | original TS in debugger? |
|---|---|---|---|
| eval | | | |
| eval-cheap-module-source-map | | | |
| source-map | | | |
| false | | | |
```
Fill every table cell with measured values.

- [ ] **Step 5: Final gate and commit**

Run: `npm run verify`
Expected: exit 0.

```bash
git add -A && git commit -m "docs: week 1 notes and verification experiments"
```

---

## Week 1 Done Criteria
- `npm run verify` is green (typecheck, lint, format, tests incl. real prod build assertions, build).
- `npm run dev` serves 3 routes with HMR/Fast Refresh and SPA fallback.
- `docs/week1-notes.md` has all answers and measurements filled in.

## Self-Review (spec coverage, Week 1)
- entry/output/mode/resolve/alias → Task 2; loaders vs plugins → Tasks 2, 5, 6; devtool → Tasks 2, 3, 9.
- babel/ts toolchain + swc/ts-loader comparison → Tasks 1, 9.
- CSS, SCSS, PostCSS + Tailwind, CSS Modules → Task 5. Asset Modules, SVG component, font → Task 6.
- HtmlWebpackPlugin → Task 2; dev-server HMR/proxy/historyApiFallback + Fast Refresh → Task 3.
- webpack-merge common/dev/prod → Tasks 2–3; DefinePlugin/dotenv-webpack → Task 7.
- ESLint + Prettier + `tsc --noEmit` + fork-ts-checker → Tasks 2, 8. 3 pages → Task 4.
