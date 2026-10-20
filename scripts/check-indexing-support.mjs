import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createSitemapDates,relatedProductLinks} from './indexing-support.mjs';

test('lastmod follows content changes, survives later builds and drops deleted pages',()=>{
 const root=mkdtempSync(join(tmpdir(),'og-indexing-')),url='https://onlinegiftis.com/products/1/';
 try{
  mkdirSync(join(root,'products/1'),{recursive:true});
  writeFileSync(join(root,'products/1/index.html'),'old page');
  writeFileSync(join(root,'sitemap.xml'),'<url><loc>'+url+'</loc><lastmod>2026-01-01</lastmod></url>');
  let dates=createSitemapDates({root,now:new Date('2026-10-20')});
  assert.equal(dates.tag(url),'');dates.save();
  dates=createSitemapDates({root,now:new Date('2026-10-21')});
  writeFileSync(join(root,'products/1/index.html'),'updated price and product');
  assert.equal(dates.tag(url),'<lastmod>2026-10-21</lastmod>');dates.save();
  dates=createSitemapDates({root,now:new Date('2026-10-23')});
  assert.equal(dates.tag(url),'<lastmod>2026-10-21</lastmod>');dates.save();
  dates=createSitemapDates({root});dates.save();
  const again=createSitemapDates({root,now:new Date('2026-10-24')});
  assert.equal(again.tag(url),'<lastmod>2026-10-24</lastmod>');
 }finally{rmSync(root,{recursive:true,force:true})}
});

test('product links reach the whole eligible catalogue and preserve language and exclusion settings',()=>{
 const products=Array.from({length:10},(_,i)=>({id:i+1,name:'Name & '+i,category:i<5?'gifts':'flowers',storefront:{nameTr:'Ürün '+i,descriptionTr:'Açıklama'}}));
 products[8].storefront.indexable=false;products[9].storefront.includeInSitemap=false;
 products[7].storefront.nameTr='';
 for(const lang of ['ar','tr']){
  const valid=products.filter(p=>p.id<9&&(lang==='ar'||p.id!==8));
  const edges=new Map(valid.map(p=>[p.id,[...relatedProductLinks(p,products,lang).matchAll(/href="([^"]+)"/g)].map(m=>m[1])]));
  const reached=new Set();
  function visit(id){if(reached.has(id))return;reached.add(id);for(const path of edges.get(id)){assert.ok(path.startsWith(lang==='tr'?'/tr/products/':'/products/'));const target=Number(path.split('/').filter(Boolean).at(-1));assert.notEqual(target,id);assert.ok(edges.has(target));visit(target)}}
  visit(1);assert.equal(reached.size,valid.length);
 }
 assert.ok(relatedProductLinks(products[0],products).includes('Name &amp;'));
 assert.equal(relatedProductLinks(products[8],products),'');
});
