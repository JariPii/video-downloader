import { context } from 'esbuild';

async function createContext(options) {
  return context({
    bundle: true,
    platform: 'node',
    target: 'node22',
    sourcemap: true,
    external: ['electron'],
    logLevel: 'info',
    ...options,
  });
}

const main = await createContext({
  entryPoints: ['electron/main.ts'],
  outfile: 'dist-electron/main.js',
  format: 'esm',
});

const preload = await createContext({
  entryPoints: ['electron/preload.ts'],
  outfile: 'dist-electron/preload.js',
  format: 'cjs',
});

await Promise.all([main.watch(), preload.watch()]);

console.log('Watching electron files');
