import {test,expect} from '@playwright/test';
import {readFileSync,readdirSync} from 'node:fs';
import {validateRecording,requireRealCorpus} from './schema.mjs';
const corpus=process.env.BENCH_CORPUS??'bench/streams';
const fixtures=readdirSync(corpus).filter(f=>f.endsWith('.json')).map(f=>validateRecording(JSON.parse(readFileSync(`${corpus}/${f}`,'utf8'))));
if(!fixtures.length)throw new Error('No recordings found in '+corpus);
for(const fixture of fixtures)test(`final parity ${fixture.id}`,async({page})=>{
  await page.goto('/');await page.waitForFunction(()=>!!window.bench,undefined,{timeout:10_000});
  const result=await page.evaluate(chunks=>window.bench.diff(chunks),fixture.chunks);
  expect(result.incremental).toBe(result.full);
});
test('real-corpus evidence requirement',()=>{
  if(process.env.REQUIRE_REAL_CORPUS==='1')requireRealCorpus(fixtures);
  else test.info().annotations.push({type:'evidence',description:`${fixtures.filter(r=>r.provenance==='recorded').length}/40 real recordings; real-corpus claim unavailable`});
});
