import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {SITE,FLOWERS,hasTurkish,productLanguageLinks} from './seo-localization.mjs';
import {flowerDestinations} from './search-landing-pages.mjs';
const read=path=>readFileSync(path,'utf8');
const fileFor=url=>{
  const path=new URL(url,SITE).pathname;
  return path==='/'?'index.html':path.slice(1)+(path.endsWith('/')?'index.html':'');
};
const sitemap=read('sitemap.xml');
const urls=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
const schemas=html=>[...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map(m=>JSON.parse(m[1]));
test('all sitemap pages and their internal navigation resolve to maintained files',()=>{
  for(const url of urls){
    const file=fileFor(url);assert.ok(existsSync(file),url);
    for(const [,href] of read(file).matchAll(/<a\b[^>]*href="(\/[^"<>]*)"/g))assert.ok(existsSync(fileFor(href)),`${file} links to missing ${href}`);
  }
});
test('translated products have native Turkish HTML, self canonicals and reciprocal alternates',()=>{
  for(const id of readdirSync('tr/products').filter(x=>/^\d+$/.test(x))){
    const path='/tr/products/'+id+'/',html=read(fileFor(path)),ar=read(`products/${id}/index.html`);
    assert.match(html,/<html lang="tr" dir="ltr"/);
    assert.ok(html.includes(`rel="canonical" href="${SITE}${path}"`));
    assert.ok(sitemap.includes(SITE+path));
    assert.ok(ar.includes(`hreflang="tr" href="${SITE}${path}"`));
    assert.ok(html.includes(`hreflang="ar" href="${SITE}/products/${id}/"`));
    const product=schemas(html).find(s=>s['@type']==='Product');
    assert.ok(product.name);assert.ok(product.description);assert.equal(product.url,SITE+path);
    assert.ok(html.includes('<h1>'+product.name.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')+'</h1>'));
  }
  const incomplete={id:1,storefront:{nameTr:'Hediye'}};
  assert.equal(hasTurkish(incomplete),false);assert.ok(!productLanguageLinks(incomplete).includes('hreflang="tr"'));
});
test('flower pages expose real bouquet links before JavaScript and pair all three languages',()=>{
  for(const dest of flowerDestinations)for(const lang of ['ar','tr','en']){
    const path=dest[lang],html=read(fileFor(path));
    assert.ok(sitemap.includes(SITE+path));
    assert.equal((html.match(/<h1>/g)||[]).length,1);
    for(const other of ['ar','tr','en'])assert.ok(html.includes(`hreflang="${other}" href="${SITE}${dest[other]}"`));
    const collection=schemas(html).find(s=>s['@type']==='CollectionPage');
    assert.equal(collection.inLanguage,lang);assert.equal(collection.url,SITE+path);
    assert.ok(collection.mainEntity.itemListElement.length>0);
    for(const item of collection.mainEntity.itemListElement){
      const product=read(fileFor(item.url));
      assert.ok(product.includes(FLOWERS),'Only products in the saved flower category belong in flower guides');
    }
  }
});
test('Turkish merchant feed targets pages that are Turkish without JavaScript',()=>{
  for(const [,url] of read('feeds/google-products-tr.xml').matchAll(/<g:link>(.*?)<\/g:link>/g)){
    assert.match(url,/\/tr\/products\/\d+\/$/);
    assert.match(read(fileFor(url)),/<html lang="tr"/);
  }
});
