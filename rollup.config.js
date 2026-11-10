import { copyFile, cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';

function copySite() {
  return {
    name: 'copy-site',
    async writeBundle() {
      await mkdir('dist', { recursive: true });
      const html = await readFile('index.html', 'utf8');
      await writeFile(
        'dist/index.html',
        html.replace('./out/application-shell.js', './application-shell.js'),
      );
      await copyFile('manifest.json', 'dist/manifest.json');
      await copyFile('robots.txt', 'dist/robots.txt');
      await copyFile('sitemap.xml', 'dist/sitemap.xml');
      await cp('images', 'dist/images', { recursive: true });
    },
  };
}

export default {
  input: 'out/application-shell.js',
  onwarn(warning, warn) {
    // pwa-auth ships TypeScript's `this && this.__decorate` helper. In an ES module
    // `this` is undefined, so the helper function runs. Rollup reports that rewrite.
    if (warning.code === 'THIS_IS_UNDEFINED') return;
    warn(warning);
  },
  output: {
    dir: 'dist',
    format: 'es',
    sourcemap: true,
  },
  plugins: [
    nodeResolve(),
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    copySite(),
  ],
};
