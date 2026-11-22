/** @jest-environment node */
import type {} from 'webpack-dev-server';
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
