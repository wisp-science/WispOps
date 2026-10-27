import { build } from 'esbuild'
await build({
  entryPoints: ['client/index.tsx'], outfile: 'lib/client.js', bundle: true,
  platform: 'browser', format: 'cjs', target: 'es2022', jsx: 'automatic',
  external: ['react', 'react/jsx-runtime'], loader: { '.css': 'text' },
  banner: { js: 'window.__ModuleLoader__.load({ id: "dsh-wisp-ops", factory: (require) => { var module = { exports: {} }; var exports = module.exports;' },
  footer: { js: 'return module.exports; } });' },
})
