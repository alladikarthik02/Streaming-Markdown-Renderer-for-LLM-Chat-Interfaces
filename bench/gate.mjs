import {readFileSync} from 'node:fs';
import {checkRegression} from './stats.mjs';
const [baselinePath,currentPath]=process.argv.slice(2);
if(!baselinePath||!currentPath)throw new Error('Usage: pnpm bench:gate BASELINE.json CURRENT.json; a calibrated baseline is required');
const failures=checkRegression(JSON.parse(readFileSync(baselinePath,'utf8')),JSON.parse(readFileSync(currentPath,'utf8')));
if(failures.length){console.error(failures.join('\n'));process.exitCode=1;}else console.log('All comparable streams are within the 50% / 1 ms regression threshold');
