import { writeFileSync, mkdirSync } from 'node:fs';
const blocks={
  prose: '## A steady answer\n\nA completed thought should remain stable while new information arrives. This synthetic paragraph exercises incremental rendering without implying any real conversation provenance.\n\n',
  code: '### Implementation\n\n```typescript\nconst value = 42;\nfunction double(n: number) { return n * 2; }\nconsole.log(double(value));\n```\n\nA closed fence can now be highlighted.\n\n',
  tables: '| Feature | Result |\n| --- | --- |\n| Streaming | Batches frames |\n| Scrolling | Preserves attention |\n\nThe next section continues the explanation.\n\n',
  references: 'A [reference][guide] can resolve later.\n\n- [x] completed\n- [ ] pending\n\nAnother paragraph separates the structures.\n\n',
  unfinished: 'This intentionally unfinished paragraph contains ordinary words and literal math $x^2 + y^2$ to expose growing-suffix work. ',
};
mkdirSync('bench/streams',{recursive:true});
for(const [id,block] of Object.entries(blocks)){
  let text=block.repeat(Math.ceil(9000/block.length));if(id==='references')text+='\n[guide]: https://example.com\n';
  const chunks=[];for(let i=0;i<text.length;i+=80)chunks.push({text:text.slice(i,i+80),atMs:(chunks.length+1)*10});
  writeFileSync(`bench/streams/${id}.json`,JSON.stringify({id,provenance:'synthetic',description:'Deterministic generated fixture; not a real answer and no model token count.',chunks},null,2)+'\n');
}
