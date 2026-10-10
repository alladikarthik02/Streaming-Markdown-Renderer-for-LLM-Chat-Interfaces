import {readFileSync,writeFileSync} from 'node:fs';
const [input,output]=process.argv.slice(2);
if(!input||!output)throw new Error('Expected prior-revision result and destination');
const prior=JSON.parse(readFileSync(input,'utf8'));
if(prior.environment.repeats<3||Object.keys(prior.summary).length<5)throw new Error('Prior revision needs three repeats on five streams');
prior.calibrated=true;prior.calibration='Prior revision measured on the same CI runner; never use the current revision as its own baseline';
writeFileSync(output,JSON.stringify(prior,null,2)+'\n');
