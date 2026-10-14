const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const products=JSON.parse(fs.readFileSync('/tmp/og-products.json'));
 const p=products.products.find(p=>p.id===72);assert.ok(p,'Turkish product fixture missing');
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try {
  for(const lang of ['ar','tr']) {
   const page=await browser.newPage();
   await page.route('https://**/*',async route=>{
    assert.equal(route.request().method(),'GET');
    const url=new URL(route.request().url());
    if(url.pathname==='/api/store/products')return route.fulfill({json:products});
    if(url.pathname==='/api/store/categories')return route.fulfill({json:{categories:[]}});
    return route.abort();
   });
   // Prove a saved opposite language cannot override the feed landing URL.
   await page.addInitScript(other=>localStorage.setItem('og_lang',other),lang==='tr'?'ar':'tr');
   await page.goto('http://localhost:8765/products/72/?lang='+lang);
   const expected=lang==='tr'?p.storefront.nameTr:p.storefront.nameAr;
   await page.waitForFunction(name=>document.querySelector('.info h1')?.textContent===name,expected);
   assert.equal(await page.locator('html').getAttribute('lang'),lang);
   const image=lang==='tr'?p.imageUrlTr:p.imageUrlAr;
   assert.equal(await page.locator('.media img').first().getAttribute('src'),new URL(image,'https://api.onlinegiftis.com').href);
   assert.equal(await page.evaluate(()=>localStorage.getItem('og_lang')),lang);
   if(lang==='tr')assert.match(await page.locator('.nav-actions .store').getAttribute('href'),/lang=tr/);
   await page.close();
  }
  console.log('Arabic and Turkish feed links force matching product names, images and store language.');
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
