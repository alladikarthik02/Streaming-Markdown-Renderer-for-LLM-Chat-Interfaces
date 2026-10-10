"""Record actual StudyChat SSE deltas; never synthesize response text or timing."""
import argparse
import asyncio
import bisect
import hashlib
import json
import time
from datetime import datetime, timezone
from pathlib import Path
import httpx
import tiktoken

ROOT=Path(__file__).resolve().parents[1]
ENCODING=tiktoken.get_encoding('o200k_base')

def account_tokens(chunks):
    text=''.join(c['text'] for c in chunks)
    ends=[];count=0
    for c in chunks:
        count+=len(c['text'].encode());ends.append(count);c['tokenCount']=0
    cursor=0
    tokens=ENCODING.encode(text,disallowed_special=())
    for token in tokens:
        cursor+=len(ENCODING.decode_single_token_bytes(token))
        chunks[bisect.bisect_left(ends,cursor)]['tokenCount']+=1
    return len(tokens)

async def main(args):
    out=ROOT/'private/captures';out.mkdir(parents=True,exist_ok=True)
    workloads=json.loads((ROOT/'capture/workloads.json').read_text())[:args.limit]
    async with httpx.AsyncClient(base_url=args.url,timeout=240) as client:
        cfg=(await client.get('/config')).json()
        if cfg.get('provider_mode')!='live':raise RuntimeError('Refusing to label fixture answers as live recordings')
        docs=(await client.get('/documents')).json()
        ids={}
        for topic in dict.fromkeys(w['topic'] for w in workloads):
            name=f'stream-benchmark-{topic}.pdf'
            existing=next((d for d in docs if d['filename']==name and d['state']=='ready'),None)
            if existing:ids[topic]=existing['id'];continue
            with (ROOT/f'capture/{topic}.pdf').open('rb') as file:
                response=await client.post('/documents',files={'file':(name,file,'application/pdf')},headers={'X-StudyChat-Consent':'yes'})
            response.raise_for_status();doc=response.json();ids[topic]=doc['id']
            for _ in range(120):
                status=(await client.get('/documents/'+doc['id'])).json()
                if status['state']=='ready':break
                if status['state']=='failed':raise RuntimeError('Lesson ingestion failed: '+str(status.get('error_code')))
                await asyncio.sleep(1)
            else:raise RuntimeError('Lesson ingestion timed out')
            print('Uploaded',topic,flush=True)
        sem=asyncio.Semaphore(args.concurrency)
        async def capture(w):
            path=out/(w['id']+'.json')
            if path.exists():print('Kept',w['id'],flush=True);return
            async with sem:
                chunks=[];events=[];start=time.perf_counter();seq=0;request_id=None
                try:
                    async with client.stream('POST','/chat',json={'question':w['question'],'document_ids':[ids[w['topic']]],'live_consent':True}) as response:
                        response.raise_for_status()
                        async for line in response.aiter_lines():
                            if not line.startswith('data:'):continue
                            event=json.loads(line[5:]);at=round((time.perf_counter()-start)*1000,3)
                            if event['seq']!=seq+1 or (request_id and event['request_id']!=request_id):raise RuntimeError('Invalid event sequence')
                            seq=event['seq'];request_id=event['request_id'];events.append({'event':event['event'],'atMs':at})
                            if event['event']=='start':model=event['model'];prompt_hash=event['prompt_hash']
                            if event['event']=='delta':chunks.append({'text':event['text'],'atMs':at})
                            if event['event']=='verification':verification=event['result']
                            if event['event']=='error':raise RuntimeError('StudyChat error: '+event['code'])
                            if event['event']=='done':outcome=event['outcome']
                    if not chunks or events[-1]['event']!='done' or outcome not in ['answered','no_verified_citations']:raise RuntimeError('Incomplete or abstained capture')
                    count=account_tokens(chunks)
                    record={'id':w['id'],'provenance':'recorded','workloadProvenance':'synthetic questions and original lesson material; live model responses','captureDescription':'Actual HTTP POST /chat SSE response from StudyChat with live OpenAI provider, retrieval and verification. Timings are client monotonic arrival times.','publicationApproved':False,'redacted':False,'privacyReview':'Pending review; source is original benchmark material, not private coursework.','capturedAt':datetime.now(timezone.utc).isoformat(),'model':model,'promptHash':prompt_hash,'question':w['question'],'sourceSha256':hashlib.sha256((ROOT/f'capture/{w["topic"]}.pdf').read_bytes()).hexdigest(),'tokenizer':'tiktoken 0.12.0 / o200k_base (visible text; not provider billing usage)','tokenCount':count,'tokenAttribution':'Full-text tokens attributed to the first recorded chunk containing their final UTF-8 byte.','outcome':outcome,'verification':{'hasVerifiedCitations':verification['has_verified_citations'],'citationCount':len(verification['citations']),'finalTextSha256':hashlib.sha256(verification['text'].encode()).hexdigest()},'events':events,'chunks':chunks}
                    path.write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
                    print('RECORDED',w['id'],'tokens',count,'chunks',len(chunks),'seconds',round(time.perf_counter()-start,1),flush=True)
                except Exception as exc:
                    failure={'id':w['id'],'error':str(exc),'events':events,'acceptedCharacters':sum(len(c['text']) for c in chunks)}
                    (out/(w['id']+'.failure.json')).write_text(json.dumps(failure,indent=2)+'\n')
                    print('FAILED',w['id'],str(exc),flush=True)
        await asyncio.gather(*(capture(w) for w in workloads))

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--url',default='http://127.0.0.1:8001');parser.add_argument('--limit',type=int,default=40);parser.add_argument('--concurrency',type=int,default=2)
    asyncio.run(main(parser.parse_args()))
