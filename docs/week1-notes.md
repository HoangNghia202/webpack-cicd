# Week 1 notes

## Concepts

1. **Loader vs plugin:** A loader transforms individual modules as webpack reads
   them; for example, `babel-loader` turns TSX into JavaScript. A plugin hooks
   into the wider compilation lifecycle; `HtmlWebpackPlugin` generates the HTML
   that includes the bundle.
2. **Style loader order:** Webpack executes the configured loaders right to left.
   Sass first compiles SCSS to CSS, PostCSS processes that CSS, css-loader
   resolves CSS imports and URLs into modules, and style-loader injects the
   resulting styles into the page.
3. **`importLoaders`:** This tells css-loader how many loaders following it in
   the configured array should also process CSS reached through `@import`.
   SCSS uses `2` so imported files pass through both postcss-loader and
   sass-loader before css-loader handles them.
4. **Asset modules:** Use `asset/resource` for a separate emitted file and URL,
   useful for fonts or larger images; `asset/inline` embeds a data URL, useful
   for small assets where a separate request costs more; `asset/source` exports
   the file contents as a string, useful for raw text.
5. **Environment variables:** dotenv-webpack replaces statically referenced
   expressions such as `process.env.APP_NAME` at build time instead of
   serializing the entire environment into the client bundle. A computed access
   such as `process.env[key]` cannot be matched reliably to a variable during
   compilation and can produce an undefined value or a browser error rather
   than the intended value. Only expose values that are safe to ship to users.
6. **Type checking:** ForkTsCheckerWebpackPlugin runs TypeScript checking in a
   separate process, allowing transpilation and checking to proceed in parallel
   and surfacing errors without requiring the loader to block on checking.
   `ts-loader` without `transpileOnly` performs type checking as part of its
   own loader work; `transpileOnly` skips that work, so it needs a separate
   checker to retain type diagnostics.

## Experiment 1 – transpiler comparison (seconds, 3 runs each)

| loader                    | run 1 | run 2 | run 3 | notes                                                         |
| ------------------------- | ----: | ----: | ----: | ------------------------------------------------------------- |
| babel-loader              | 2.663 | 1.762 | 1.741 | Baseline; includes the development React Refresh Babel plugin |
| swc-loader                | 1.784 | 1.786 | 1.809 | TypeScript/TSX parser and automatic React runtime              |
| ts-loader (transpileOnly) | 1.785 | 1.880 | 1.855 | Type checking remains in ForkTsCheckerWebpackPlugin           |

Each run deleted `node_modules/.cache` and `dist` and timed `npm run build:dev`
with a monotonic wall clock, including npm and process startup. All nine builds
exited 0. OS caches and background load were not controlled; the first Babel
run was slower, so these small samples are not a definitive ranking. SWC and
ts-loader used the requested temporary options, not equivalent React Refresh
transforms, so successful builds do not prove equivalent HMR behavior.

## Experiment 2 – devtool comparison

| devtool                      | build s | rebuild s | original TS in debugger?                                                    |
| ---------------------------- | ------: | --------: | --------------------------------------------------------------------------- |
| eval                         |   1.464 |     0.049 | No original TS map                                                          |
| eval-cheap-module-source-map |   1.159 |     0.055 | Yes; original source and line breakpoint verified (column precision limited) |
| source-map                   |   1.159 |     0.070 | Yes; original source and line/column breakpoint verified                    |
| false                        |   1.120 |     0.049 | No original TS map                                                          |

Times are webpack's reported compilation durations from a cold-cache
development watch build and one rebuild after editing `Settings.tsx`, not
end-to-end npm wall time. Source maps were inspected, and headless Chrome
DevTools Protocol breakpoints mapped from `Settings.tsx` line 11 to generated
code, paused on clicking the button, and mapped back to that TS line for both
mapped modes. The `eval` and `false` bundles had no original TS source maps.

## Development server verification

With the restored Babel configuration, headless Chrome opened `/settings`,
clicked “Switch to dark”, and observed “Switch to light”. Editing the heading
updated it while that button and a page marker remained unchanged; there were
zero navigation events and a `.hot-update.json` request. An injected TS2322
error appeared in the React Refresh overlay, which disappeared after restoring
the file. The three routes rendered their expected headings, and direct
requests, including an unknown path, returned the SPA shell. This was an
automated headless-browser check, not an interactive visual inspection.

As a visual follow-up, the Settings route was opened in headful Chrome and
inspected alongside the rendered page. DevTools Sources showed the
`webpack-cicd-lab/src/pages/Settings.tsx` source-map entry; opening it displayed
the original TSX with its source line numbers and `Settings` component, rather
than only the generated bundle. The page also visibly rendered its heading,
environment/version text, SVG and font assets, and the light navigation link
on the dark sidebar.

## React Router advisory decision

Task 9's production audit reported two moderate findings through React Router
and proposed a breaking upgrade to v7. The upgrade is deferred because the
plan requires react-router-dom 6, and the current app uses static links without
SSR or data-router hydration. Reassess the advisories before introducing
user-controlled navigation or SSR; this decision does not establish that future
uses are safe.
