import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync} from 'node:fs';

const read = p => readFileSync(p,'utf8');
const brand = 'Online Giftis';
const url = 'https://onlinegiftis.com/';
const social = [
  'https://www.instagram.com/onlinegiftis/',
  'https://www.facebook.com/onlayinn',
  'https://www.tiktok.com/@onlinegiftis',
  'https://www.instagram.com/online.giftis.tr/',
  'https://www.facebook.com/onlayinn.tr/',
  'https://www.tiktok.com/@onlinegiftis.tr'
];
const schema = html => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  .map(([,text]) => JSON.parse(text));

test('both homepages identify the same canonical store with all official social profiles', () => {
  for (const file of ['index.html','tr/index.html','products/index.html']) {
    const entries=schema(read(file));
    const store=entries.find(s=>s['@type']==='OnlineStore');
    assert.ok(store, `missing OnlineStore in ${file}`);
    assert.equal(store.name, brand, file);
    assert.equal(store['@id'], url+'#store', file);
    assert.equal(store.url, url, file);
    for (const profile of social) assert.ok(store.sameAs?.includes(profile), `${file}: ${profile}`);
    assert.ok(store.alternateName?.includes('اون لاين للهدايا'), file);
  }
});

test('Arabic and Turkish About pages link to the right official profiles', () => {
  const ar=read('about/index.html');
  const tr=read('tr/about/index.html');
  assert.match(ar,/Online Giftis/);
  assert.match(tr,/Online Giftis/);
  for(const profile of social.slice(0,3)) assert.ok(ar.includes(profile),profile);
  for(const profile of social.slice(3)) assert.ok(tr.includes(profile),profile);
  assert.ok(!/instagram\.com\/telef98|tiktok\.com\/@on_gift/.test(ar),'No legacy social links');
});

test('generated Arabic and Turkish product schemas use Online Giftis as product brand', () => {
  let checked=0;
  for(const root of ['products','tr/products']){
    for(const dir of readdirSync(root).filter(x=>/^\d+$/.test(x))) {
      const path=`${root}/${dir}/index.html`;
      if(!existsSync(path)) continue;
      const product=schema(read(path)).find(s=>s['@type']==='Product');
      assert.ok(product, `missing Product: ${path}`);
      assert.equal(product.brand?.name, brand, path);
      const seller=product.offers?.seller;
      if(seller?.['@id']) assert.equal(seller['@id'],url+'#store',path);
      checked++;
    }
  }
  assert.ok(checked>0, 'Expected generated product pages');
});

test('official ChatGPT search crawler and general web crawlers can access public pages in robots.txt', () => {
  const text=read('robots.txt');
  assert.match(text,/User-agent:\s*OAI-SearchBot\s*\nAllow:\s*\//i);
  assert.match(text,/User-agent:\s*\*\s*\nAllow:\s*\//i);
  assert.ok(text.includes(url+'sitemap.xml'));
});
