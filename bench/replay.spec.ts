import {test,expect} from '@playwright/test';
import {readFileSync,readdirSync,mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import os from 'node:os';
import {validateRecording,replayChunks} from './schema.mjs';
import {percentile,median} from './stats.mjs';
import type {Variant,Measurement} from './harness.js';
const fixtures=readdirSync('bench/streams').filter(f=>f.endsWith('.json')).sort().map(f=>validateRecording(JSON.parse(readFileSync(`bench/streams/${f}`,'utf8'))));
const rows:{id:string;variant:Variant;repeat:number;measurement:Omit<Measurement,'html'>;renderP95Ms:number;workP95Ms:number}[]=[];
const smoke=process.env.BENCH_SMOKE==='1'; const repeats=3; const variants:Variant[]=smoke?['stream-md']:['stream-md','full-marked','react-markdown','streamdown'];
let browserVersion='';
for(const fixture of fixtures)test(`replay ${fixture.id}`,async({page,browser})=>{
  browserVersion=browser.version();const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  await page.goto('/');await page.waitForFunction(()=>!!window.bench,undefined,{timeout:10_000});
  const chunks=replayChunks(fixture,process.env.BENCH_TIMING??'recorded');
  for(const variant of variants){
    // Full warmup is excluded, each subsequent repeat is retained.
    await page.evaluate(async({variant,chunks})=>window.bench.run(variant,chunks),{variant,chunks});
    for(let repeat=0;repeat<repeats;repeat++){
      const {html:_,...measurement}=await page.evaluate(async({variant,chunks})=>window.bench.run(variant,chunks),{variant,chunks});
      expect(measurement.renders.length).toBeGreaterThan(0);expect(measurement.characters).toBe(chunks.map((c:{text:string})=>c.text).join('').length);
      rows.push({id:fixture.id,variant,repeat,measurement,renderP95Ms:percentile(measurement.renders),workP95Ms:percentile(measurement.work)});
    }
  }
});
test.afterAll(()=>{
  const summary:Record<string,{renderP95Ms:number;workP95Ms:number}>={};
  for(const fixture of fixtures){const current=rows.filter(r=>r.id===fixture.id&&r.variant==='stream-md');if(current.length)summary[fixture.id]={renderP95Ms:median(current.map(r=>r.renderP95Ms)),workP95Ms:median(current.map(r=>r.workP95Ms))};}
  const digest=(value:string|Buffer)=>createHash('sha256').update(value).digest('hex');
  const result={calibrated:false,createdAt:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),environment:{platform:os.platform(),arch:os.arch(),cpu:os.cpus()[0]?.model,node:process.version,browser:browserVersion,cpuThrottle:4,viewport:'1280x900',timing:process.env.BENCH_TIMING??'recorded',lockDigest:digest(readFileSync('pnpm-lock.yaml')),fixtureDigest:digest(JSON.stringify(fixtures)),profiling:'production',warmups:1,repeats},corpus:{real:fixtures.filter(f=>f.provenance==='recorded').length,synthetic:fixtures.filter(f=>f.provenance==='synthetic').length},summary,rows};
  mkdirSync('bench/results/local',{recursive:true});writeFileSync('bench/results/local/current.json',JSON.stringify(result,null,2)+'\n');
});
