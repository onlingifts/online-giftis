const {chromium}=require('playwright'),fs=require('fs'),assert=require('node:assert/strict');
const catalog=JSON.parse(fs.readFileSync(process.env.STOREFRONT_SNAPSHOT||'/tmp/og-products.json')),categories=JSON.parse(fs.readFileSync('/tmp/og-categories.json'));
(async()=>{const browser=await chromium.launch({headless:true});let errors=[];
try{
 for(const width of [390,1440])for(const lang of ['ar','tr']){
  const page=await browser.newPage({viewport:{width,height:900},serviceWorkers:'block'});page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',r=>{assert.equal(r.request().method(),'GET');const u=new URL(r.request().url());if(u.pathname==='/api/store/products')return r.fulfill({json:catalog});if(u.pathname==='/api/store/categories')return r.fulfill({json:categories});if(u.pathname==='/api/store/config')return r.fulfill({json:{config:{bankConfigured:true}}});return r.abort();});
  await page.addInitScript(other=>localStorage.setItem('og_lang',other),lang==='ar'?'tr':'ar');
  await page.goto('http://localhost:8765'+(lang==='tr'?'/tr/products/':'/products/'));
  await page.waitForFunction(()=>document.querySelectorAll('#productGrid .product-card').length===54);
  assert.equal(await page.locator('html').getAttribute('lang'),lang);assert.equal(new URL(page.url()).pathname,lang==='tr'?'/tr/products/':'/products/');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.match(await page.locator('link[rel="canonical"]').getAttribute('href'),new RegExp((lang==='tr'?'/tr':'')+'/products/$'));
  await page.screenshot({path:`/tmp/og-seo-catalog-${lang}-${width}.png`,fullPage:false});
  await page.goto('http://localhost:8765/products/?lang=tr&category=all');await page.waitForFunction(()=>document.documentElement.lang==='tr');
  assert.equal(new URL(page.url()).pathname,'/tr/products/');assert.equal(new URL(page.url()).searchParams.get('category'),'all');assert.equal(new URL(page.url()).searchParams.has('lang'),false);
  await page.locator('.lang-btn[data-lang="ar"]').evaluate(el=>el.click());assert.equal(new URL(page.url()).pathname,'/products/');assert.equal(await page.locator('html').getAttribute('lang'),'ar');
  await page.close();
 }
 for(const lang of ['ar','tr']){const page=await browser.newPage({javaScriptEnabled:false});await page.goto('http://localhost:8765'+(lang==='tr'?'/tr/products/':'/products/'));assert.equal(await page.locator('#productGrid h3').count(),lang==='tr'?37:54);assert.equal(await page.locator('html').getAttribute('lang'),lang);await page.close();}
 assert.deepEqual(errors,[]);console.log('PASS catalogue native languages, saved-language isolation, legacy query, filter preservation, language switches, 390/1440 layouts, no-JavaScript names/links.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
