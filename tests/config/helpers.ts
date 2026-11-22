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
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'webpack-cicd-lab-build-'));
  const config: Configuration = {
    ...prodConfig,
    output: { ...prodConfig.output, path: outDir },
  };

  try {
    const stats = await runBuild(config);
    const files = fs.readdirSync(outDir, { recursive: true }) as string[];
    const js = files
      .filter((f) => f.endsWith('.js'))
      .map((f) => fs.readFileSync(path.join(outDir, f), 'utf8'))
      .join('\n');
    return { outDir, stats, files, js };
  } catch (error) {
    fs.rmSync(outDir, { recursive: true, force: true });
    throw error;
  }
}
