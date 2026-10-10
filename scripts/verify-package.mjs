import { mkdtempSync, readdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
const root=process.cwd(); const dir=mkdtempSync(join(tmpdir(),'stream-md-consumer-'));
try {
  execFileSync('pnpm',['pack','--pack-destination',dir],{cwd:root,stdio:'inherit'});
  const archive=join(dir,readdirSync(dir).find(f=>f.endsWith('.tgz')));
  const entries=execFileSync('tar',['-tzf',archive],{encoding:'utf8'}).trim().split('\n');
  if(entries.some(f=>!/^package\/(dist\/|README\.md$|package\.json$)/.test(f)))throw new Error('Unexpected package contents');
  const pkg=JSON.parse(readFileSync(join(root,'package.json'),'utf8'));
  writeFileSync(join(dir,'package.json'),JSON.stringify({private:true,type:'module',dependencies:{[pkg.name]:`file:${archive}`,react:pkg.devDependencies.react,'react-dom':pkg.devDependencies['react-dom']}}));
  execFileSync('pnpm',['install','--offline','--ignore-scripts'],{cwd:dir,stdio:'inherit'});
  writeFileSync(join(dir,'smoke.mjs'),`import assert from 'node:assert/strict';\nimport {createElement} from 'react';\nimport {renderToStaticMarkup} from 'react-dom/server';\nimport {Markdown,MarkdownController,MarkdownStream} from '${pkg.name}';\nassert.equal(typeof MarkdownStream,'function');\nassert.match(renderToStaticMarkup(createElement(Markdown,{source:'# Package works'})),/<h1>Package works<\\/h1>/);\nconst s=new MarkdownController({scheduler:{request:()=>1,cancel:()=>{}}});s.append('hello');s.finish();assert.equal(s.getSnapshot().plan.source,'hello');\nconsole.log('Clean tarball consumer passed');`);
  execFileSync(process.execPath,['smoke.mjs'],{cwd:dir,stdio:'inherit'});
  console.log(`Package allowlist passed: ${entries.length} entries`);
} finally { rmSync(dir,{recursive:true,force:true}); }
