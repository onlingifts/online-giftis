import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, mkdtempSync, writeFileSync, rmSync, readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {runInNewContext} from 'node:vm';

const source=readFileSync('assets/product-page.js','utf8');
async function load(url,{dataset={productId:'0'},products=[{id:179,storefront:{nameTr:'Hediye',descriptionTr:'Özel hediye'}}],failed=false,saved='ar'}={}) {
 const location=new URL(url), redirects=[],metas=[],errors=[];
 location.replace=target=>redirects.push(target);
 const document={body:{dataset},documentElement:{},head:{append:el=>metas.push(el)},
  querySelector:()=>null,querySelectorAll:()=>[],getElementById:()=>null,createElement:()=>({})};
 runInNewContext(source,{document,location,URL,URLSearchParams,AbortSignal,
  localStorage:{getItem:()=>saved,setItem:()=>{}},window:{},console:{error:e=>errors.push(e)},
  fetch:async url=>{if(failed)throw Error('offline');return {ok:true,json:async()=>url.includes('categories')?{categories:[]}:{products}};}});
 await new Promise(resolve=>setImmediate(resolve));
 return {redirects,metas,errors,document};
}
test('legacy product aliases load the native HTML and preserve purchase intent',async()=>{
 for(const path of ['/product.html','/products/detail/']){
  const {redirects,errors}=await load('https://onlinegiftis.com'+path+'?id=179&intent=add&category=flowers#options');
  assert.deepEqual(errors,[]);
  assert.deepEqual(redirects,['https://onlinegiftis.com/products/179/?intent=add&category=flowers#options']);
 }
});
test('language query goes to the matching native document, independent of saved preference',async()=>{
 for(const [path,lang,expected] of [['/products/179/','tr','/tr/products/179/'],['/tr/products/179/','ar','/products/179/']]){
  const result=await load('https://onlinegiftis.com'+path+'?lang='+lang+'&intent=add',{dataset:{productId:'179',renderedLang:path.startsWith('/tr/')?'tr':'ar'},saved:lang==='tr'?'ar':'tr'});
  assert.deepEqual(result.errors,[]);
  assert.deepEqual(result.redirects,['https://onlinegiftis.com'+expected+'?intent=add']);
 }
});
test('removed products are noindex while temporary API failures keep static SEO intact',async()=>{
 const removed=await load('https://onlinegiftis.com/products/142/',{dataset:{productId:'142',renderedLang:'ar'},products:[]});
 assert.deepEqual(removed.metas.map(m=>[m.name,m.content]),[['robots','noindex,follow'],['googlebot','noindex,follow']]);
 assert.deepEqual(removed.redirects,[]);
 const offline=await load('https://onlinegiftis.com/products/179/',{dataset:{productId:'179',renderedLang:'ar'},failed:true});
 assert.equal(offline.metas.length,0);assert.equal(offline.redirects.length,0);
});
test('invalid catalogue snapshots cannot delete published product documents',()=>{
 const temp=mkdtempSync(join(tmpdir(),'og-indexing-'));
 try{
  const marker='products/'+readdirSync('products').find(id=>/^\d+$/.test(id))+'/index.html';
  const before=readFileSync(marker,'utf8');
  for(const products of [[],[{id:0}],[{id:179},{id:179}]]){
   const fixture=join(temp,'catalog.json');writeFileSync(fixture,JSON.stringify({products}));
   const result=spawnSync(process.execPath,['scripts/generate-product-pages.mjs'],{env:{...process.env,STOREFRONT_SNAPSHOT:fixture,SEO_REUSE_IMAGES:'1'},encoding:'utf8'});
   assert.notEqual(result.status,0);assert.match(result.stderr,/Refusing/);
   assert.equal(readFileSync(marker,'utf8'),before);
  }
 }finally{rmSync(temp,{recursive:true,force:true});}
});
