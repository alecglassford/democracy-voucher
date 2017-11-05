// rollup.config.js
import resolve from 'rollup-plugin-node-resolve';

export default {
  input: 'js/main.js',
  output: {
    file: 'site/bundle.js',
    format: 'iife',
  },
  plugins: [resolve()],
};
