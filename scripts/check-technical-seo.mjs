import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
const SITE='https://onlinegiftis.com';
const read=p=>readFileSync(p,'utf8');
const file=url=>{const p=new URL(url).pathname;return p==='/'?'index.html':p.slice(1)+(p.endsWith('/')?'index.html':'');};
const schemas=html=>[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
const locations=[...read('sitemap.xml').matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
test('sitemap contains unique existing indexable self-canonical pages',()=>{
 assert.equal(new Set(locations).size,locations.length);
 for(const url of locations){
  assert.ok(existsSync(file(url)),url);const html=read(file(url));
  assert.equal([...html.matchAll(/<link rel="canonical" href="([^"]+)"/g)].length,1,url);
  assert.ok(html.includes(`rel="canonical" href="${url}"`),url);
  assert.ok(!/<meta name="robots" content="[^"]*noindex/.test(html),url);
  schemas(html); // every published structured-data block must parse.
 }
});
test('hreflang clusters point to self-canonical equivalent pages and are reciprocal',()=>{
 for(const url of locations){
  const html=read(file(url));
  for(const [,lang,target] of html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)){
   assert.ok(existsSync(file(target)),`${url}: ${target}`);
   const other=read(file(target));assert.ok(other.includes(`rel="canonical" href="${target}"`),target);
   if(lang!=='x-default')assert.ok(other.includes(`href="${url}"`),`${target} missing return to ${url}`);
  }
 }
});
test('both catalogue languages expose product names and native links without JavaScript',()=>{
 for(const lang of ['ar','tr']){
  const path=lang==='tr'?'/tr/products/':'/products/',html=read(file(SITE+path));
  assert.match(html,new RegExp(`<html lang="${lang}" dir="${lang==='tr'?'ltr':'rtl'}"`));
  for(const [code,target] of [['ar','/products/'],['tr','/tr/products/'],['x-default','/products/']])assert.ok(html.includes(`hreflang="${code}" href="${SITE}${target}"`));
  const collection=schemas(html).find(s=>s['@type']==='CollectionPage');
  assert.ok(collection.mainEntity.itemListElement.length>0);
  const grid=html.split('id="productGrid">')[1].split('</section>')[0];
  for(const item of collection.mainEntity.itemListElement){
   const product=schemas(read(file(item.url))).find(s=>s['@type']==='Product');
   assert.equal(item.name,product.name);assert.ok(grid.includes(`href="${new URL(item.url).pathname}"`));
  }
 }
});
test('product offers match visible prices and the live snapshot when supplied; no fabricated ratings',()=>{
 const snapshot=process.env.STOREFRONT_SNAPSHOT?JSON.parse(read(process.env.STOREFRONT_SNAPSHOT)).products:null;
 for(const url of locations){
  const html=read(file(url));
  for(const obj of schemas(html)){
   assert.ok(!obj.aggregateRating&&!obj.review,`${url}: unexpected review data`);
   if(obj['@type']!=='Product')continue;
   assert.equal(obj.url,url);assert.ok(obj.name&&obj.description&&obj.image?.length,url);
   assert.equal(obj.offers?.priceCurrency,'TRY');assert.ok(Number(obj.offers.price)>0);
   assert.ok(schemas(html).some(s=>s['@type']==='BreadcrumbList'),url);
   if(snapshot){const p=snapshot.find(p=>String(p.id)===new URL(url).pathname.split('/').filter(Boolean).at(-1));assert.ok(p,url);assert.equal(obj.offers.price,p.price);assert.equal(obj.offers.availability,'https://schema.org/'+(p.stockQuantity>0?'InStock':'OutOfStock'));}
  }
 }
});
test('catalogue language is explicit in the URL and does not follow a stored preference',()=>{
 const html=read('products/index.html');
 assert.ok(!html.includes("else if(savedLang==='tr')"));
 assert.ok(html.includes("pageUrl.pathname=l==='tr'?'/tr/products/':'/products/'"));
 assert.ok(!html.includes('facebook.com/onlonlayinnayinn'));
});
