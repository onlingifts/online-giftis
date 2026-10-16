const {chromium}=require('playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const products=JSON.parse(fs.readFileSync('/tmp/og-products.json'));
 const categories=JSON.parse(fs.readFileSync('/tmp/og-categories.json'));
 const product=products.products.find(p=>p.id===112);
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const errors=[];
 try {
  for(const width of [390,1440]){
   const page=await browser.newPage({viewport:{width,height:900},serviceWorkers:'block'});
   page.on('pageerror',e=>errors.push(e.message));
   let offline=false;
   await page.route('https://**/*',route=>{
    const req=route.request(),url=new URL(req.url());
    assert.equal(req.method(),'GET','Search browsing must not submit live data');
    if(req.resourceType()==='image')return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="pink"/></svg>'});
    if(url.pathname==='/api/store/products')return offline?route.abort():route.fulfill({json:products});
    if(url.pathname==='/api/store/categories')return offline?route.abort():route.fulfill({json:categories});
    if(url.pathname==='/api/store/reviews')return route.fulfill({json:{reviews:[]}});
    return route.abort();
   });
   await page.addInitScript(()=>localStorage.setItem('og_lang','ar'));
   await page.goto('http://localhost:8765/tr/products/112/');
   await page.waitForFunction(name=>document.querySelector('.info h1')?.textContent===name,product.storefront.nameTr);
   assert.equal(await page.locator('html').getAttribute('lang'),'tr');
   assert.match(await page.locator('link[rel="canonical"]').getAttribute('href'),/\/tr\/products\/112\/$/);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Turkish product overflow');
   await page.locator('#buyBtn').click();
   await page.waitForURL(/cart=1/);
   assert.equal(new URL(page.url()).pathname,'/tr/products/');
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('og_cart_v1')).some(p=>Number(p.productId)===112)),true);
   for(const path of ['/flower-delivery-istanbul/','/tr/gaziantep-cicek/','/en/flower-delivery-istanbul/','/tr/turkiyeye-hediye-gonder/']){
    await page.goto('http://localhost:8765'+path);
    assert.equal(await page.locator('h1').count(),1);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Guide overflow '+path);
   }
   await page.evaluate(()=>localStorage.setItem('og_cart_v1','[]'));
   await page.goto('http://localhost:8765/tr/');
   const quick=page.locator('.pink-product-quick[href*="/112/"]').first();
   await quick.waitFor();
   assert.equal(new URL(await quick.getAttribute('href'),'http://localhost:8765').searchParams.get('intent'),'add');
   await quick.click();await page.waitForURL(/cart=1/);
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('og_cart_v1')).find(p=>Number(p.productId)===112)?.quantity),1,'Native Turkish quick-add reaches the cart once');
   offline=true;
   await page.goto('http://localhost:8765/tr/cicek-teslimati/');
   await page.waitForTimeout(150);
   assert.ok(await page.locator('#productsGrid .card').count()>0,'API outage retains the public bouquet links');
   await page.screenshot({path:'/tmp/og-search-flowers-'+width+'.png',fullPage:true});
   await page.goto('http://localhost:8765/tr/products/112/');
   assert.equal(await page.locator('h1').textContent(),product.storefront.nameTr,'API outage retains translated product content');
   await page.close();
  }
  const context=await browser.newContext({javaScriptEnabled:false});
  const page=await context.newPage();
  await page.goto('http://localhost:8765/tr/products/112/');
  assert.equal(await page.locator('h1').textContent(),product.storefront.nameTr);
  assert.equal(await page.locator('html').getAttribute('lang'),'tr');
  await context.close();
  assert.deepEqual(errors,[]);
  console.log('Passed: native Turkish HTML without JavaScript, opposite saved language, product-to-cart navigation, responsive guides and catalogue outage fallbacks.');
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
