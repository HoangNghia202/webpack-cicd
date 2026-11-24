# Giải thích cấu hình Week 1

Tài liệu này giải thích các cấu hình Week 1 theo thứ tự phụ thuộc: bắt đầu từ
môi trường và công cụ, tiếp đến TypeScript/Babel, Webpack dùng chung, các
pipeline xử lý file, cấu hình riêng cho development/production, rồi đến test và
các bước kiểm tra chất lượng.

## Bản đồ tổng thể

```text
Node.js và npm packages
        ↓
TypeScript + Babel
        ↓
Webpack common: entry, output, resolve, rules, plugins
        ├─ Rules gọi PostCSS/Tailwind khi xử lý CSS
        ↓
Ghép với Webpack dev hoặc prod (source map, server, env)
        ↓
Jest, ESLint, Prettier và verify
```

Webpack cần biết điểm bắt đầu của ứng dụng, cách tìm các module được import,
rồi mới có thể áp dụng quy tắc xử lý cho từng loại file. Sau đó cấu hình
development và production kế thừa phần dùng chung nhưng chọn hành vi phù hợp
với từng môi trường.

## 1. Môi trường và các package

### `.nvmrc`

Chọn Node.js 22 cho dự án để máy cá nhân và môi trường CI dùng phiên bản thống
nhất. Điều này giảm các khác biệt phát sinh do Node version.

### `package.json`

File này khai báo dependencies và các lệnh chuẩn:

| Lệnh                   | Tác dụng                                                   |
| ---------------------- | ---------------------------------------------------------- |
| `npm run dev`          | Chạy Webpack Dev Server bằng cấu hình development          |
| `npm run build`        | Tạo production build                                       |
| `npm run build:dev`    | Build theo cấu hình development nhưng không mở server      |
| `npm test`             | Chạy Jest                                                  |
| `npm run typecheck`    | Chạy TypeScript kiểm tra kiểu, không phát sinh file        |
| `npm run lint`         | Chạy ESLint                                                |
| `npm run format:check` | Kiểm tra format bằng Prettier                              |
| `npm run verify`       | Chạy lần lượt typecheck, lint, format check, test và build |

Một số package có mặt để phục vụ các thử nghiệm của Week 1, không có nghĩa tất
cả đều tham gia vào build hiện tại. Cấu hình Webpack hiện đang dùng
`babel-loader`; `swc-loader` và `ts-loader` được dùng trong các thử nghiệm so
sánh transpiler.

### `.gitignore`

Không đưa các file sinh ra hoặc chỉ thuộc máy cá nhân vào Git:

- `node_modules/`: package đã cài từ npm.
- `dist/`: đầu ra build.
- `coverage/`: báo cáo độ phủ test.
- `.env.local` và `.env.*.local`: cấu hình môi trường local.
- `.worktrees/`: workspace Git riêng.

## 2. TypeScript và Babel

Hai công cụ này có nhiệm vụ khác nhau:

- **Babel** chuyển TSX/React thành JavaScript để trình duyệt chạy được.
- **TypeScript (`tsc`)** kiểm tra kiểu và báo lỗi như truyền sai loại dữ liệu.

### `tsconfig.json`

- `strict: true`: bật các kiểm tra kiểu nghiêm ngặt hơn để bắt lỗi sớm.
- `jsx: "react-jsx"`: sử dụng React JSX runtime tự động.
- `moduleResolution: "Bundler"`: phân giải module theo mô hình phù hợp với dự
  án do bundler như Webpack xử lý.
- `noEmit: true`: chỉ kiểm tra, không tạo JavaScript đầu ra.
- `paths: { "@/*": ["src/*"] }`: để TypeScript hiểu import như `@/App`.
- `include`: giới hạn các vùng TypeScript cần kiểm tra là `src`, `tests`,
  `config`.

Alias `@` cũng phải được khai báo riêng trong Webpack. TypeScript và Webpack là
hai công cụ độc lập; cấu hình alias cho công cụ này không tự cấu hình cho công
cụ kia.

### `babel.config.js`

Babel sử dụng ba preset:

1. `@babel/preset-env` chuyển cú pháp JavaScript theo nhóm trình duyệt mục tiêu
   `defaults`.
2. `@babel/preset-react` với `runtime: "automatic"` chuyển JSX sang JavaScript
   phù hợp với React.
3. `@babel/preset-typescript` loại bỏ cú pháp khai báo kiểu TypeScript khi
   chuyển code.

Khi Babel nhận biết môi trường development, cấu hình thêm
`react-refresh/babel`. Plugin này đánh dấu module React để Fast Refresh có thể
cập nhật component khi sửa code.

Preset TypeScript của Babel chỉ loại cú pháp kiểu; nó **không** kiểm tra kiểu.
Việc kiểm tra kiểu được thực hiện riêng bằng `tsc` và
`ForkTsCheckerWebpackPlugin`.

## 3. Webpack dùng chung: `config/webpack.common.js`

`webpack.common.js` chứa những cài đặt được dùng trong cả development và
production. Hai cấu hình môi trường ghép file này với cấu hình riêng bằng
`webpack-merge`.

### 3.1. Thư mục gốc và entry

```js
context: root,
entry: './src/index.tsx',
```

`context` giúp Webpack diễn giải các đường dẫn tương đối trong config từ thư
mục gốc dự án. `entry` chỉ ra điểm bắt đầu của ứng dụng.

Webpack bắt đầu đọc `src/index.tsx`, theo các lệnh `import`, rồi lần theo những
module khác mà ứng dụng cần để tạo bundle.

### 3.2. Output

```js
output: {
  path: .../dist,
  filename: 'js/[name].js',
  assetModuleFilename: 'assets/[name][ext]',
  publicPath: '/',
  clean: true,
}
```

- `path`: thư mục trên máy để ghi file build — `dist/`.
- `filename`: JavaScript bundle được ghi dưới `dist/js/`.
- `assetModuleFilename`: vị trí mặc định cho asset được phát hành thành file.
- `publicPath: '/'`: tiền tố URL dùng khi trình duyệt tải bundle và asset.
- `clean: true`: dọn nội dung output cũ trước lần build mới để tránh sót file
  đã bị bỏ khỏi ứng dụng.

### 3.3. Phân giải module

```js
resolve: {
  extensions: ['.tsx', '.ts', '.js'],
  alias: { '@': .../src },
}
```

- `extensions` cho phép import module mà không cần ghi phần mở rộng, nếu
  Webpack tìm thấy file phù hợp.
- `alias` cho phép dùng `@/components/...` thay vì nhiều đoạn `../`.

### 3.4. `module.rules` và `oneOf`

`module.rules` trả lời câu hỏi: “Webpack gặp file loại này thì phải xử lý thế
nào?”. Các rule được đặt trong `oneOf`; Webpack dùng **rule đầu tiên khớp** và
không xét các rule sau trong cùng nhóm. Vì vậy thứ tự rule ở đây quan trọng.

#### File có `?raw`

```js
{ resourceQuery: /raw/, type: 'asset/source' }
```

`resourceQuery` kiểm tra phần query sau dấu `?` trong import. `asset/source`
xuất nội dung file thành chuỗi, thay vì phát hành file như một asset thông
thường. Ví dụ:

```ts
import text from './about.txt?raw';
```

#### JavaScript, TypeScript và JSX

```js
{
  test: /\.[jt]sx?$/,
  exclude: /node_modules/,
  use: 'babel-loader',
}
```

- `test` khớp `.js`, `.jsx`, `.ts`, `.tsx`.
- `exclude` tránh biên dịch lại các thư viện trong `node_modules`.
- `babel-loader` đưa file qua cấu hình Babel ở trên.

#### CSS, SCSS và CSS Modules

Hàm `styleRule(...)` tạo rule cho bốn dạng:

- `.module.scss`: SCSS có CSS Modules.
- `.module.css`: CSS có CSS Modules.
- `.scss`: SCSS toàn cục.
- `.css`: CSS toàn cục.

Trong cấu hình loader:

```js
[
  'style-loader',
  'css-loader',
  'postcss-loader',
  'sass-loader', // chỉ có với SCSS
];
```

Webpack thực thi loader **từ phải sang trái**, vì vậy SCSS đi theo luồng:

```text
sass-loader → postcss-loader → css-loader → style-loader
```

1. `sass-loader` biên dịch cú pháp SCSS thành CSS.
2. `postcss-loader` chạy CSS qua PostCSS, gồm Tailwind và Autoprefixer theo
   cấu hình.
3. `css-loader` giải quyết import/URL trong CSS và biến CSS thành module mà
   Webpack quản lý.
4. `style-loader` chèn CSS đã xử lý vào trang lúc chạy.

Với CSS Modules, `css-loader` tạo tên class theo mẫu
`[name]__[local]--[hash:base64:5]`. Phần tên giúp đọc được nguồn class, còn
hash giảm nguy cơ trùng tên giữa các module. `namedExport: false` nghĩa là
module được lấy qua default export.

Rule cho style toàn cục loại trừ các file `.module.*`, để CSS Module không bị
bắt nhầm. `importLoaders` cho biết các CSS được `@import` cần chạy qua bao
nhiêu loader tiếp theo:

- CSS thường đặt `1`, để file import tiếp tục qua PostCSS.
- SCSS đặt `2`, để file import tiếp tục qua PostCSS và Sass.

#### SVG

Các rule SVG xử lý theo mục đích import:

| Cách import                        | Cách Webpack xử lý | Giá trị nhận được               |
| ---------------------------------- | ------------------ | ------------------------------- |
| `icon.svg?url`                     | `asset/resource`   | URL tới file SVG được phát hành |
| `icon.svg?inline`                  | `asset/inline`     | Data URL nhúng nội dung SVG     |
| `icon.svg` từ JS/TS                | `@svgr/webpack`    | React component                 |
| SVG không khớp các trường hợp trên | `asset/resource`   | URL tới file riêng              |

Rule query cụ thể đứng trước rule mặc định. `issuer` giới hạn rule SVGR vào
trường hợp file SVG được import từ JavaScript/TypeScript.

#### Ảnh raster và font

Ảnh `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp` dùng `type: 'asset'` với ngưỡng
`8 * 1024` byte:

- Ảnh nhỏ hơn ngưỡng có thể được nhúng thành data URL.
- Ảnh lớn hơn ngưỡng được phát hành thành file riêng.

Font `.woff`, `.woff2`, `.ttf`, `.eot` dùng `asset/resource`, được ghi dưới
`fonts/`. Cách này tạo file font riêng để trình duyệt tải bằng URL.

### 3.5. Plugins dùng chung

Loader xử lý từng module; plugin có thể can thiệp vào các phần rộng hơn của
quá trình build.

- **`HtmlWebpackPlugin`** dùng `public/index.html`, tạo HTML đầu ra và gắn
  bundle mà Webpack tạo.
- **`ForkTsCheckerWebpackPlugin`** kiểm tra TypeScript trong process riêng,
  song song với việc Babel biên dịch. Babel không làm type-check nên plugin
  này giữ chẩn đoán kiểu trong quá trình build.
- **`DefinePlugin`** thay `__APP_VERSION__` bằng version trong `package.json`.
  `JSON.stringify` biến giá trị thành literal JavaScript hợp lệ, ví dụ
  `"0.1.0"`.

`DefinePlugin` thay giá trị ở thời điểm build; đây không phải biến được đọc
động từ server khi người dùng mở trang.

## 4. Cấu hình riêng cho development và production

`webpack-merge` ghép config chung với phần riêng:

```text
webpack.common.js + webpack.dev.js  → npm run dev / npm run build:dev
webpack.common.js + webpack.prod.js → npm run build
```

### `config/webpack.dev.js`

- `mode: 'development'`: chọn chế độ Webpack phục vụ phát triển.
- `devtool: 'eval-cheap-module-source-map'`: tạo source map nhanh để debugger
  có thể truy về source gốc; độ chính xác cột bị giới hạn.
- `devServer.port: 3000`: mở server tại cổng 3000.
- `hot: true`: bật Hot Module Replacement (HMR), cho phép Webpack gửi phần
  module thay đổi mà không cần tải lại toàn trang trong các trường hợp được hỗ
  trợ.
- `historyApiFallback: true`: khi truy cập trực tiếp `/settings`, server trả
  SPA shell để React Router xử lý đường dẫn.
- `compress: true`: bật nén response của development server.
- `client.overlay: true`: hiện lỗi biên dịch trên giao diện trình duyệt.
- `proxy`: chuyển request `/api` sang `http://localhost:4000`;
  `changeOrigin: true` điều chỉnh header `Host` theo server đích.
- **`ReactRefreshWebpackPlugin`** phối hợp với `react-refresh/babel` để cập
  nhật React component khi sửa code.
- **`Dotenv`** đọc `.env.development`.

HMR là cơ chế cập nhật module của Webpack; React Fast Refresh bổ sung hành vi
phù hợp với React component. Hai khái niệm liên quan nhưng không đồng nghĩa.

### `config/webpack.prod.js`

- `mode: 'production'`: chọn chế độ production và các tối ưu mặc định tương
  ứng của Webpack.
- `devtool: 'source-map'`: tạo source map đầy đủ để truy ngược lỗi về source.
- **`Dotenv`** đọc `.env.production`.

`.env.production` hiện để trống; `.env.example` là file mẫu tham khảo, không
tự động thay thế file production.

Không đặt secret vào biến môi trường được Webpack nhúng. Giá trị thay vào
JavaScript phía client có thể được người dùng xem.

## 5. CSS: PostCSS và Tailwind

### `postcss.config.js`

PostCSS chạy hai plugin:

- Tailwind xử lý các chỉ thị như `@tailwind base`, `@tailwind components`,
  `@tailwind utilities`.
- Autoprefixer thêm prefix CSS khi cần để hỗ trợ các trình duyệt mục tiêu.

### `tailwind.config.js`

- `darkMode: 'class'`: chế độ tối được bật bằng class trên DOM, không chỉ dựa
  vào cài đặt của hệ điều hành.
- `content`: Tailwind quét `public/index.html` và các file TS/TSX dưới `src`
  để tìm class đang sử dụng.
- `theme.extend: {}`: hiện chưa thêm token theme riêng.
- `plugins: []`: hiện chưa cấu hình plugin Tailwind bổ sung.

`src/styles/tailwind.css` chứa ba chỉ thị Tailwind. Khi file này được import từ
entry, nó đi qua pipeline CSS của Webpack và được PostCSS/Tailwind xử lý.

## 6. Jest và test

Jest chạy trong môi trường Node, không tự chạy Webpack loader. Vì vậy
`jest.config.js` mô phỏng các import mà test gặp:

- `testEnvironment: 'jsdom'`: cung cấp DOM giả lập để test React.
- `setupFilesAfterEnv`: nạp `tests/setup.ts` sau khi môi trường test sẵn sàng.
- `testPathIgnorePatterns` và `modulePathIgnorePatterns`: bỏ qua thư viện,
  output build và worktree.
- `moduleNameMapper`: ánh xạ CSS, SVG, `?raw` sang mock và ánh xạ alias `@/`
  tới `src/`.

Ví dụ, khi component import CSS, Jest thay import đó bằng mock thay vì cố chạy
toàn bộ loader CSS. Nhờ vậy test tập trung vào hành vi component.

## 7. ESLint, Prettier và quy trình verify

### `eslint.config.js`

Đây là cấu hình ESLint flat:

- Dùng rule JavaScript và TypeScript được khuyến nghị.
- Với `.ts`/`.tsx`, bật rule React Hooks.
- Với `.js`, khai báo môi trường CommonJS như `require`, `module`,
  `__dirname`; tắt rule import không phù hợp với `require`.
- Bỏ qua output và thư mục tạm.
- Nạp `eslint-config-prettier` để giảm xung đột giữa rule format và Prettier.

### `.prettierrc` và `.prettierignore`

`.prettierrc` định nghĩa quy ước format như nháy đơn, dấu chấm phẩy và độ dài
dòng. `.prettierignore` loại những khu vực không muốn Prettier format hàng
loạt.

`npm run verify` thực hiện:

```text
TypeScript check
→ ESLint
→ Prettier check
→ Jest
→ production build
```

Vì các lệnh được nối bằng `&&`, quy trình dừng ở bước đầu tiên có lỗi.

## 8. Luồng thực tế khi chạy dự án

### Khi chạy `npm run dev`

1. `cross-env` đặt `NODE_ENV=development`.
2. Webpack CLI nạp `config/webpack.dev.js`.
3. Config dev import `webpack.common.js` và ghép hai cấu hình bằng
   `webpack-merge`.
4. Webpack bắt đầu từ `src/index.tsx` và lần theo các import.
5. `module.rules` phân loại TSX, CSS/SCSS, SVG, ảnh, font và file raw.
6. TS/TSX đi qua Babel; `ForkTsCheckerWebpackPlugin` kiểm tra kiểu song song.
7. CSS/SCSS đi qua chuỗi loader từ phải sang trái; asset được nhúng hoặc phát
   hành thành file theo rule tương ứng.
8. Plugin tạo HTML, thay hằng phiên bản và đọc biến môi trường development.
9. Dev Server phục vụ ứng dụng ở cổng 3000, gửi cập nhật HMR/Fast Refresh và
   chuyển tiếp request `/api`.

### Khi chạy `npm run build`

Webpack dùng cùng phần `common`, nhưng ghép với `webpack.prod.js`. Build chạy
ở production mode, dùng `source-map` và đọc `.env.production`.

## Tóm tắt thứ tự cấu hình

1. Chốt Node/npm và cài các package cần thiết.
2. Cấu hình TypeScript để kiểm tra kiểu và Babel để chuyển cú pháp.
3. Cấu hình Webpack dùng chung: context, entry, output và resolve.
4. Thêm rules cho code, style, SVG, ảnh, font và raw file.
5. Thêm plugins dùng chung cho HTML, type-check và version.
6. Tách cấu hình development và production.
7. Nối PostCSS/Tailwind và biến môi trường vào đúng pipeline.
8. Cấu hình Jest, ESLint, Prettier và lệnh `verify`.

Tuần 1 xây dựng nền tảng pipeline. Các tối ưu nâng cao như tách vendor chunks
hoặc tách CSS thành file riêng chưa nằm trong cấu hình này.
