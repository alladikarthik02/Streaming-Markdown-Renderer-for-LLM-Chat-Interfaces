import {expect,it} from 'vitest';
import {percentile,checkRegression} from '../bench/stats.mjs';
import {validateRecording,replayChunks,requireRealCorpus} from '../bench/schema.mjs';
const fixture={id:'test',provenance:'synthetic',chunks:[{text:'a',atMs:0},{text:'b',atMs:10}]};
it('uses nearest-rank p95 and rejects missing measurements',()=>{expect(percentile(Array.from({length:100},(_,i)=>i+1))).toBe(95);expect(()=>percentile([])).toThrow();});
it('rejects regression above 50% while retaining a 1 ms floor',()=>{
  const baseline={calibrated:true,environment:{cpu:4},summary:{a:{renderP95Ms:10,workP95Ms:20}}};
  expect(checkRegression(baseline,{environment:{cpu:4},summary:{a:{renderP95Ms:15,workP95Ms:30}}})).toEqual([]);
  expect(checkRegression(baseline,{environment:{cpu:4},summary:{a:{renderP95Ms:16,workP95Ms:31}}})).toHaveLength(2);
  expect(()=>checkRegression(undefined,{})).toThrow('baseline');expect(()=>checkRegression(baseline,{environment:{cpu:1}})).toThrow('Incomparable');
});
it('requires real provenance, approval and accurate token accounting',()=>{
  expect(validateRecording(fixture)).toBe(fixture);
  expect(()=>validateRecording({...fixture,provenance:'recorded'})).toThrow('approval');
  expect(()=>validateRecording({...fixture,chunks:[{text:'a',atMs:20},{text:'b',atMs:10}]})).toThrow('timing');
  expect(()=>replayChunks(fixture,'tokens-100')).toThrow('token');
  expect(replayChunks(fixture,'chunks-100').map((c:{atMs:number})=>c.atMs)).toEqual([10,20]);
  expect(()=>requireRealCorpus([fixture])).toThrow('40');
});
