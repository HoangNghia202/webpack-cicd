# Kế hoạch học Webpack (tối ưu bundle) + CI/CD (GitHub Actions & GitLab CI)

## 0. Giả định (có thể chỉnh)
- Trình độ: đã dùng webpack cơ bản. Thời lượng: **4 tuần** (~8–10h/tuần).
- Stack: **React 18 + TypeScript**, npm, Node 22.
- CI/CD: **làm cả GitHub Actions và GitLab CI** cho cùng một pipeline logic để so sánh.
- Deploy: static site lên GitHub Pages / GitLab Pages + image Docker (Nginx) đẩy lên registry.
- Không dùng CRA/Vite: tự viết toàn bộ webpack config.

## 1. Mục tiêu đầu ra
Một dự án "**Mini Admin Dashboard**" đủ phức tạp để chạm ~80% config thường gặp:
- Nhiều route (lazy), thư viện nặng (chart, editor, date), CSS/SCSS/Tailwind, ảnh/font/SVG, i18n, env theo môi trường.
- Có **bundle budget**: CI fail nếu bundle vượt ngưỡng.
- Pipeline tự động: lint → typecheck → test → build → phân tích bundle → deploy preview/production.

## 2. Phạm vi dự án mẫu
| Trang | Mục đích học |
|---|---|
| `/` Dashboard (chart – echarts/chart.js) | code splitting, thư viện nặng, `splitChunks` vendor |
| `/editor` (Monaco/Quill) | dynamic import, prefetch/preload, lazy loading |
| `/tables` (bảng lớn + lodash/dayjs) | tree-shaking, `sideEffects`, thay moment→dayjs, lodash-es |
| `/settings` (i18n, theme) | env vars, DefinePlugin, JSON/asset modules |
| Widget từ app khác (tuỳ chọn, tuần 4) | Module Federation |

## 3. Cấu trúc repo đề xuất
```
webpack-cicd/
  src/ (pages, components, i18n, assets)
  config/
    webpack.common.js
    webpack.dev.js
    webpack.prod.js
    webpack.analyze.js        # hoặc dùng --env analyze
  tests/                      # jest/vitest + RTL
  .github/workflows/          # ci.yml, deploy.yml, pr-preview.yml
  .gitlab-ci.yml
  Dockerfile, nginx.conf
  budgets.json / size-limit config
  docs/                       # ghi chú học + so sánh kết quả mỗi tuần
```

## 4. Lộ trình 4 tuần

### Tuần 1 – Nền tảng webpack & DX (dev)
**Học:** entry/output, `mode`, loaders vs plugins, `resolve` (alias, extensions), `devtool`.
**Làm:**
- Setup TS + React với `babel-loader` (hoặc `swc-loader`; so sánh tốc độ với `ts-loader`).
- CSS: `css-loader`, `style-loader`, SCSS, PostCSS + Tailwind, CSS Modules.
- Asset Modules (`asset/resource|inline|source`), SVG as component, font.
- `HtmlWebpackPlugin`, `webpack-dev-server` (HMR, proxy, historyApiFallback), React Fast Refresh.
- Tách config common/dev/prod bằng `webpack-merge`; env bằng `DefinePlugin`/`dotenv-webpack`.
- ESLint + Prettier + `tsc --noEmit`; `fork-ts-checker-webpack-plugin`.
**Deliverable:** app chạy dev, HMR OK, 2–3 trang.
**Kiểm chứng:** đổi file thấy HMR không reload; build dev có sourcemap tốt.

### Tuần 2 – Tối ưu bundle (production)
**Học & làm (đo trước/sau mỗi bước, ghi vào `docs/bundle-log.md`):**
1. **Baseline:** `webpack-bundle-analyzer`, `source-map-explorer`, `--stats`.
2. **Minify:** `TerserPlugin`, `CssMinimizerPlugin`, `ImageMinimizerPlugin`.
3. **Code splitting:** dynamic `import()` + `React.lazy`, magic comments (`webpackChunkName`, `webpackPrefetch/Preload`).
4. **splitChunks:** `vendor`, `react`, `common`, `cacheGroups`, `maxSize`, `runtimeChunk: 'single'`.
5. **Tree-shaking:** `sideEffects`, ESM-only libs, `usedExports`, lodash→lodash-es, moment→dayjs, import chọn lọc icon.
6. **Caching:** `[contenthash]`, `moduleIds: 'deterministic'`, filesystem `cache: { type: 'filesystem' }`.
7. **CSS:** `MiniCssExtractPlugin`, PurgeCSS/Tailwind purge, critical CSS (tuỳ chọn).
8. **Nén:** `CompressionWebpackPlugin` (gzip/brotli); `performance.hints/maxAssetSize`.
9. **Build speed:** `thread-loader`/swc, `cache`, `include/exclude`, `resolve.modules`; đo bằng `speed-measure-webpack-plugin`.
10. **Khác:** `externals` + CDN, `ProvidePlugin`, `IgnorePlugin` (moment locales), PWA/Workbox (tuỳ chọn).
**Deliverable:** bảng so sánh bundle size / build time trước–sau (mục tiêu giảm ≥50% initial JS).

### Tuần 3 – CI/CD (GitHub Actions + GitLab CI)
**Pipeline logic chung:** install (cache) → lint → typecheck → unit test → build → bundle-size check → artifact → deploy.
**GitHub Actions:** triggers (`push`, `pull_request`, `workflow_dispatch`), `actions/setup-node` + cache npm, matrix (Node 20/22), `concurrency`, artifacts, job `needs`, `environments` + approval, secrets/vars, reusable workflow, deploy Pages, build & push Docker lên GHCR, bundle-size comment trên PR (`size-limit`/`compressed-size-action`), Dependabot.
**GitLab CI:** `stages`, `rules`, `cache` (key theo lockfile) vs `artifacts`, `needs`/DAG, `extends`/`!reference`/`include`, `environments`, CI/CD variables (protected/masked), `pages` job, Docker build với registry, merge-request pipelines, review apps.
**Deliverable:** cả hai pipeline xanh, deploy production từ `main`, preview cho PR/MR, fail khi vượt budget.
**Kiểm chứng:** cố ý import thư viện nặng → pipeline phải fail ở bước size check.

### Tuần 4 – Nâng cao, hoàn thiện & tổng kết
- Tích hợp: test + coverage trong CI, Lighthouse CI, source map upload (Sentry mock) – chọn 1–2.
- Release: semantic versioning/tag → pipeline release; cache busting & rollback.
- Tuỳ chọn: Module Federation (host/remote), monorepo cơ bản.
- Bảo mật: `npm audit`, secret scanning, pin action theo SHA, least-privilege `permissions`.
- Viết `docs/cheatsheet.md` (config nào dùng khi nào) và so sánh GH Actions vs GitLab CI.

## 5. Checklist coverage (~80%)
Webpack: entry/output · loaders (babel/ts, css, scss, postcss, asset) · plugins (html, mini-css, define, copy, clean) · dev-server/HMR · sourcemap · splitChunks · lazy · tree-shaking · minify · cache/contenthash · externals · analyzer · compression · env configs · performance budget.
CI/CD: triggers · cache · artifacts · matrix · secrets/env · needs/DAG · reusable config · deploy (pages + docker) · preview env · quality gates (lint/test/size) · release/tag · security basics.

## 6. Tiêu chí hoàn thành
1. `npm run build` ra initial JS gzip ≤ ngưỡng đặt trong `budgets.json`.
2. Rebuild không đổi vendor hash khi chỉ sửa code app.
3. Cả hai CI xanh, deploy tự động từ `main`.
4. `docs/bundle-log.md` ghi đủ số liệu từng kỹ thuật.

## 7. Bước tiếp theo
Sau khi bạn duyệt/chỉnh plan (đặc biệt phần giả định mục 0), sẽ chuyển sang `writing-plans` để tạo kế hoạch triển khai chi tiết theo từng task, rồi scaffold dự án.
