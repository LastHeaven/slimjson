import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { compress, decompress, stringify, parse } = require('./compress.js');
export { compress, decompress, stringify, parse };
