/** Validate recording provenance and timing without inventing token accounting. */
export function validateRecording(value) {
  if (!value || typeof value !== 'object' || typeof value.id !== 'string' || !/^[a-z0-9-]+$/.test(value.id)) throw new Error('Invalid recording ID');
  if (!['synthetic','recorded'].includes(value.provenance)) throw new Error('Missing provenance');
  if (!Array.isArray(value.chunks) || !value.chunks.length) throw new Error('Missing chunks');
  if (value.provenance === 'recorded' && (value.publicationApproved !== true || value.redacted !== true || typeof value.captureDescription !== 'string')) throw new Error('Real recordings require publication approval, redaction and capture description');
  let last=-1, length=0, tokens=0;
  for(const chunk of value.chunks){
    if(typeof chunk.text!=='string'||!Number.isFinite(chunk.atMs)||chunk.atMs<last||chunk.atMs<0)throw new Error('Invalid chunk timing/text');
    last=chunk.atMs;length+=chunk.text.length;
    if(chunk.tokenCount!==undefined){if(!Number.isSafeInteger(chunk.tokenCount)||chunk.tokenCount<0)throw new Error('Invalid token count');tokens+=chunk.tokenCount;}
  }
  if(length>1_000_000)throw new Error('Recording exceeds source limit');
  if(value.tokenCount!==undefined && (!Number.isSafeInteger(value.tokenCount)||value.tokenCount<1||typeof value.tokenizer!=='string'||!value.chunks.every(c=>c.tokenCount!==undefined)||tokens!==value.tokenCount))throw new Error('Incomplete token accounting');
  return value;
}
export function replayChunks(recording, mode='recorded'){
  validateRecording(recording);
  if(mode==='recorded')return recording.chunks;
  if(mode==='tokens-100' && recording.tokenCount===undefined)throw new Error('100 tokens/s requires verified per-chunk token counts');
  if(!['tokens-100','chunks-100'].includes(mode))throw new Error('Unknown timing mode');
  let atMs=0;return recording.chunks.map(c=>{atMs+=mode==='tokens-100'?c.tokenCount*10:10;return {...c,atMs};});
}
export function requireRealCorpus(recordings){
  const real=recordings.map(validateRecording).filter(r=>r.provenance==='recorded');
  if(real.length<40)throw new Error(`Need 40 approved real recordings; found ${real.length}`);
  if(real.some(r=>r.tokenCount===undefined||r.tokenCount<2500||r.tokenCount>3500))throw new Error('Real corpus needs verified approximately 3,000-token answers');
  return real;
}
