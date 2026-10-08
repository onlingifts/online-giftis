const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.OG_BROWSER_PATH?{executablePath:process.env.OG_BROWSER_PATH,args:['--no-sandbox']}: {})});
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const gift={id:9001,sku:'NEW-9001',name:'هدية اختبار',description:'هدية جديدة',price:500,stockQuantity:3,hasImage:true,imageUrl:'/api/store/products/media?id=9001&v=new',orderable:true,categories:['laser','gifts'],requiresDesignInput:true,storefront:{nameAr:'هدية اختبار',nameTr:'Yeni hediye',descriptionTr:'Yeni ürün',descriptionAr:'هدية جديدة',indexable:true}};
 let products=[gift];let categoryFailure=false;let orderCalls=0;
 await page.route('https://www.googletagmanager.com/**',r=>r.fulfill({body:''}));
 await page.route('https://mqqvcreobqjyhflodvom.supabase.co/**',r=>r.fulfill({json:{external:{google:false}}}));
 await page.route('https://api.onlinegiftis.com/**',async r=>{
  const req=r.request(),url=new URL(req.url());
  if(req.method()==='OPTIONS')throw Error('Unexpected preflight for public catalogue');
  if(url.pathname==='/api/store/products')return r.fulfill({json:{products}});
  if(url.pathname==='/api/store/categories')return categoryFailure?r.abort():r.fulfill({json:{categories:[{key:'laser',nameAr:'الحفر بالليزر',nameTr:'Lazer kazıma'},{key:'gifts',nameAr:'هدايا',nameTr:'Hediyeler'}]}});
  if(url.pathname==='/api/store/config')return r.fulfill({json:{config:{bankConfigured:false,freeDelivery:true,codFee:75}}});
  if(url.pathname==='/api/store/orders'){
   assert.equal(req.method(),'POST');orderCalls++;assert.ok(req.postData().includes('9001'));
   await new Promise(resolve=>setTimeout(resolve,150));
   return r.fulfill({json:{order:{orderNumber:'webTEST',saleTotal:500}}});
  }
  if(url.pathname.includes('/media'))return r.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="pink"/></svg>'});
  throw Error('Unexpected API route: '+url.pathname);
 });
 const base='http://localhost:8765';
 for(const width of [360,390,430,768,1440]){
  await page.setViewportSize({width,height:900});
  for(const path of ['/','/tr/','/products/','/products/?lang=tr&category=laser','/products/detail/?id=9001&lang=tr']){
   await page.goto(base+path);await page.waitForTimeout(100);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Overflow '+width+' '+path);
  }
 }
 await page.goto(base+'/tr/');await page.locator('#homeSearch').fill('Yeni');await page.locator('.home-search button').click();
 await page.locator('.product-card-link').first().waitFor();assert.match(page.url(),/lang=tr/);assert.equal(await page.locator('#productSearch').inputValue(),'Yeni');
 assert.match(await page.locator('.product-name').first().innerText(),/Yeni hediye/);
 await page.locator('.product-card-link').first().click();await page.waitForFunction(()=>!document.getElementById('buyBtn').disabled);
 assert.equal(await page.locator('h1').innerText(),'Yeni hediye');assert.match(await page.locator('.media img').getAttribute('src'),/api\.onlinegiftis\.com/);
 await page.locator('#buyBtn').click();await page.locator('#cartModal.open').waitFor();await page.locator('[data-custom-text]').fill('Ömer');
 await page.locator('#checkoutName').fill('Test Buyer');await page.locator('#checkoutPhone').fill('05340000000');await page.locator('#checkoutCity').fill('İstanbul');await page.locator('#checkoutAddress').fill('Test Address');
 assert.equal(await page.locator('#checkoutGrandTotal').innerText(),'575 ₺');
 await page.locator('#checkoutSubmit').click();await page.locator('#checkoutResult.ok').waitFor();assert.equal(orderCalls,1);assert.match(await page.locator('#checkoutResult').innerText(),/webTEST/);
 assert.ok(await page.locator('#checkoutSubmit').isDisabled());assert.equal(await page.locator('#checkoutResult').evaluate(el=>parseFloat(getComputedStyle(el).fontSize)),16);
 // A catalogue outage must leave ordering disabled. Category failures must not hide products.
 categoryFailure=true;await page.goto(base+'/products/');await page.locator('.product-card-link').first().waitFor();categoryFailure=false;
 await page.goto(base+'/products/?account=1');await page.locator('[data-account-mode="register"]').click();assert.ok(await page.locator('#accountFullName').isVisible());await page.locator('[data-account-mode="login"]').click();assert.ok(await page.locator('#accountFullName').isHidden());
 products=[];
 await page.evaluate(()=>localStorage.setItem('og_cart_v1',JSON.stringify([{productId:9001,name:'old',price:500,quantity:1,stock:3}])));
 await page.goto(base+'/products/?cart=1');await page.waitForFunction(()=>JSON.parse(localStorage.getItem('og_cart_v1')).length===0);assert.equal(await page.locator('#navCartCount').innerText(),'0');
 await page.goto(base+'/products/detail/?id=9001&lang=tr');await page.waitForFunction(()=>document.getElementById('liveStock').textContent.includes('mevcut değil'));assert.ok(await page.locator('#buyBtn').isDisabled());
 for(const path of ['/','/tr/']){await page.goto(base+path);await page.evaluate(()=>document.querySelectorAll('img').forEach(img=>img.loading='eager'));await page.waitForFunction(()=>[...document.images].every(img=>img.complete&&img.naturalWidth>0));for(const img of await page.locator('img').all())assert.ok(await img.evaluate(el=>el.complete&&el.naturalWidth>0),'Broken home image '+path)}
 assert.deepEqual(errors,[]);await browser.close();console.log('Passed: 25 responsive views, Turkish search, new product routes/images, design details, checkout totals, stale cart removal, deleted product, registration tabs and category outage.');
})().catch(e=>{console.error(e);process.exit(1)});
