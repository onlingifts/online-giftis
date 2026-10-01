import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {Script} from 'node:vm';
import '../assets/themes.js';
const themes=globalThis.OGThemes;
assert.equal(themes.info('laser').theme,'laser');
assert.equal(themes.info('3d_printing').theme,'3d');
assert.equal(themes.info('unknown').theme,'default');
const sample={categories:['gifts','laser','drinkware']};
assert.equal(themes.productCategory(sample),'laser');
assert.equal(themes.productCategory(sample,'drinkware'),'drinkware');
assert.equal(themes.productCategory(sample,'nfc'),'laser');
assert.equal(themes.productCategory({categories:[]}),'all');
const pages=['index.html','tr/index.html','products/index.html',...readdirSync('products').filter(x=>/^\d+$/.test(x)).map(x=>`products/${x}/index.html`)];
for(const file of pages){
 const html=readFileSync(file,'utf8');
 const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(ids).size,ids.length,`Duplicate ID: ${file}`);
 for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(m[1].trim()){if(m[0].includes('application/ld+json'))JSON.parse(m[1]);else new Script(m[1],{filename:file})}
 assert.ok(html.includes('/assets/themes.css'),file);
 if(/^products\/\d/.test(file)){assert.ok(html.includes('data-product-categories='),file);assert.ok(html.includes('rel="canonical"'),file);assert.ok(readFileSync('sitemap.xml','utf8').includes('https://onlinegiftis.com/'+file.replace('index.html','')),file)}
}
console.log(`Theme selection, script syntax, unique IDs, JSON-LD and sitemap checks passed (${pages.length} pages).`);
