const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=process.env.OG_BASE_URL||'http://localhost:8765';
const output=process.env.OG_SCREENSHOT_DIR||'/tmp/og-boutique';
fs.mkdirSync(output,{recursive:true});
const sample={id:9001,sku:'PREVIEW',name:'هدية المعاينة',description:'هدية مخصصة للمعاينة فقط',price:500,stockQuantity:3,hasImage:true,imageUrl:'/api/store/products/image?id=9001',orderable:true,categories:['gifts','drinkware'],requiresDesignInput:true,storefront:{nameAr:'هدية المعاينة',nameTr:'Önizleme hediyesi',descriptionAr:'هدية مخصصة للمعاينة فقط',descriptionTr:'Önizleme için kişiye özel hediye',gallery:[{imageUrl:'/api/store/products/image?id=9001'},{imageUrl:'/api/store/products/image?id=9002'}]}};
const categories=[{key:'all',nameAr:'كل المنتجات',nameTr:'Tüm ürünler'},{key:'gifts',nameAr:'الهدايا',nameTr:'Hediyeler'},{key:'love',nameAr:'الورود',nameTr:'Çiçekler'},{key:'drinkware',nameAr:'الطباعة المخصصة',nameTr:'Özel baskı'}];
const catalogue=fs.existsSync('/tmp/og-products.json')?JSON.parse(fs.readFileSync('/tmp/og-products.json')).products:[sample];
const savedCategories=fs.existsSync('/tmp/og-categories.json')?JSON.parse(fs.readFileSync('/tmp/og-categories.json')):{categories};
const errors=[];let orderCalls=0;let mode='visual';let authCalls=0;
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.OG_BROWSER_PATH?{executablePath:process.env.OG_BROWSER_PATH,args:['--no-sandbox']}: {})});
 async function newPage(language='ar',width=390){
  const context=await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce',locale:language==='tr'?'tr-TR':'ar',serviceWorkers:'block'});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  // Supply generated shells for the synthetic product used in purchase tests.
  await page.route(/http:\/\/localhost:8765\/(?:tr\/)?products\/9001\//,r=>r.fulfill({contentType:'text/html',body:fs.readFileSync('products/detail/index.html','utf8').replace('<body>','<body data-product-id="9001">')}));
  // Every remote request is intercepted: screenshots and purchase/auth tests cannot touch production data.
  await page.route('https://**/*',async route=>{
   const req=route.request(),url=new URL(req.url());
   if(url.hostname==='onlinegiftis.com'&&url.pathname.startsWith('/assets/')){assert.equal(req.method(),'GET');const file=path.join(process.cwd(),url.pathname.slice(1));if(!file.startsWith(path.join(process.cwd(),'assets')+path.sep)||!fs.existsSync(file))throw Error('Missing design artwork '+url.pathname);return route.fulfill({contentType:'image/webp',body:fs.readFileSync(file)});}
   if(url.hostname==='api.onlinegiftis.com'){
    if(url.pathname==='/api/store/wheel')return route.fulfill({json:{active:false,campaign:null,awards:[]}});
    if(url.pathname==='/api/store/reviews')return route.fulfill({json:{summary:{count:0,average:null},reviews:[]}});
    if(url.pathname==='/api/store/products')return route.fulfill({json:{products:mode==='visual'?catalogue:[sample]}});
    if(url.pathname==='/api/store/categories')return route.fulfill({json:mode==='visual'?savedCategories:{categories}});
    if(url.pathname==='/api/store/config')return route.fulfill({json:{config:{bankConfigured:true,bankName:'Preview Bank',bankAccountName:'Preview account',iban:'TR00 PREVIEW ONLY',deliveryFee:150,freeDelivery:false,codFee:75}}});
    if(url.pathname==='/api/store/orders'){
     assert.equal(mode,'flow');assert.equal(req.method(),'POST');orderCalls++;assert.match(req.postData(),/"quantity":2/);assert.match(req.postData(),/"district":"Kadıköy"/);assert.match(req.postData(),/"paymentMethod":"bank_transfer"/);assert.match(req.postData(),/transferReceipt/);
     await new Promise(resolve=>setTimeout(resolve,150));return route.fulfill({json:{order:{orderNumber:'PREVIEW-ONLY',saleTotal:1150}}});
    }
    if(url.pathname==='/api/store/account')return route.fulfill({json:{customer:{displayName:'Preview Member',email:'preview@example.test',phone:'05340000000'},benefits:{firstOrderDiscountAvailable:true,weekly:{orderCount:2,itemCount:3}}}});
    if(url.pathname.includes('notifications'))return route.fulfill({json:{notifications:[],unreadCount:0}});
    const id=url.searchParams.get('id');const files=fs.readdirSync('assets/previews').filter(f=>f.startsWith(id+'-')&&f.endsWith('-480.webp'));
    if(req.method()==='GET')return route.fulfill({contentType:'image/webp',body:fs.readFileSync(files.length?'assets/previews/'+files[0]:'assets/boutique-hero-mobile.webp')});
    throw Error('Unexpected remote mutation '+req.method()+' '+url.pathname);
   }
   if(url.hostname.endsWith('supabase.co')){
    if(url.pathname.endsWith('/settings'))return route.fulfill({json:{external:{google:false}}});
    if(url.pathname.endsWith('/token')){assert.equal(mode,'flow');authCalls++;return route.fulfill({json:{access_token:'preview-token',refresh_token:'preview-refresh',expires_in:3600,user:{id:'preview-user',email:'preview@example.test'}}});}
    if(url.pathname.endsWith('/logout'))return route.fulfill({json:{}});
    throw Error('Unexpected auth request '+url.pathname);
   }
   return route.abort();
  });return {page,context};
 }
 async function screenshot(page,name){
  await page.evaluate(()=>document.querySelectorAll('img').forEach(img=>img.loading='eager'));
  await page.waitForFunction(()=>[...document.images].filter(img=>img.getAttribute('src')).every(img=>img.complete));await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Overflow '+name);
  const broken=await page.evaluate(()=>[...document.images].filter(img=>img.getAttribute('src')&&!img.naturalWidth).map(img=>({src:img.src,currentSrc:img.currentSrc,outer:img.outerHTML,display:getComputedStyle(img).display})));if(broken.length){console.log('Broken images '+name,JSON.stringify(broken));await page.screenshot({path:path.join(output,name+'-broken.png'),fullPage:true});}
  assert.deepEqual(broken,[],'Broken artwork '+name);
  await page.screenshot({path:path.join(output,name+'.png'),fullPage:true});
  await page.screenshot({path:path.join(output,name+'-viewport.png'),fullPage:false});
 }
 // Both languages at the actual acceptance widths. Use separate sessions so no saved language leaks across cases.
 for(const language of ['ar','tr']){
  for(const width of [320,390,1440]){
   const {page,context}=await newPage(language,width),suffix='-'+width+'-'+language;
   await page.goto(base+(language==='tr'?'/tr/':'/'));await page.locator('#homeFeaturedProducts .pink-product-card').first().waitFor();await screenshot(page,'home'+suffix);
   if(width===390){await page.locator('.boutique-menu').click();await page.locator('#homeCategoryDrawer[open]').waitFor();await screenshot(page,'home-categories'+suffix);await page.keyboard.press('Escape');}
   await page.goto(base+'/products/?lang='+language);await page.locator('.product-card-link').first().waitFor();await screenshot(page,'catalogue'+suffix);
   if(width===390){await page.locator('body > .boutique-bottom-nav a').nth(1).click();await page.locator('#boutiqueCategories[open]').waitFor();await screenshot(page,'categories'+suffix);await page.keyboard.press('Escape');}
   if(width===390){const category=savedCategories.categories.find(c=>['assorted','drinkware','gifts'].includes(c.key))||savedCategories.categories.find(c=>c.key!=='all');if(category){await page.goto(base+'/products/?lang='+language+'&category='+encodeURIComponent(category.key));await page.locator('#categoryCampaign.boutique-category-campaign').waitFor();assert.match(await page.locator('#categoryCampaignImg').getAttribute('src'),/^(?:https:\/\/onlinegiftis\.com)?\/assets\/boutique-/);await screenshot(page,'category-campaign'+suffix);}}
   const first=catalogue.find(p=>p.id===104)||catalogue[0];await page.goto(base+'/products/detail/?id='+first.id+'&lang='+language);await page.waitForFunction(()=>document.getElementById('buyBtn')&&!document.getElementById('buyBtn').disabled);await screenshot(page,'product'+suffix);
   if(width===390){await page.locator('.boutique-accordion').last().locator('summary').click();assert.ok(await page.locator('.boutique-accordion').last().getAttribute('open')!==null);}
   await context.close();
  }
 }
 mode='flow';
 // Image and cart controls are separate from navigation and never exceed current stock.
 {const {page,context}=await newPage('ar');await page.goto(base+'/products/?lang=ar');await page.locator('[data-add-product="9001"]').waitFor();await page.locator('[data-add-product="9001"]').click();await page.locator('#cartModal.open').waitFor();for(let i=0;i<4;i++)await page.locator('[data-plus]').click();assert.equal(await page.locator('.cart-item-actions strong').innerText(),'3');await context.close();}
 {const {page,context}=await newPage('tr');await page.goto(base+'/tr/');await page.locator('.pink-product-quick').first().click();await page.locator('#cartModal.open').waitFor();assert.equal(await page.locator('.cart-item-actions strong').innerText(),'1');assert.match(page.url(),/lang=tr/);await context.close();}

 for(const language of ['ar','tr']){
  const {page,context}=await newPage(language);
  await page.goto(base+'/products/detail/?id=9001&lang='+language);await page.waitForFunction(()=>!document.getElementById('buyBtn').disabled);
  await page.locator('.media img').click();await page.locator('#productImageViewer[open]').waitFor();assert.ok(await page.locator('#productImageViewer img').getAttribute('src'));await page.keyboard.press('Escape');
  await page.locator('[data-quantity-plus]').click();assert.equal(await page.locator('#productQuantity').innerText(),'2');
  await page.locator('.boutique-detail-favorite').click();assert.equal(await page.locator('.boutique-detail-favorite').getAttribute('aria-pressed'),'true');
  await page.locator('.product-gallery button').last().click();assert.match(await page.locator('.media img').getAttribute('src'),/9002/);
  await page.locator('#buyBtn').click();await page.locator('#cartModal.open').waitFor();assert.match(await page.locator('.cart-item-main').innerText(),/500/);
  await page.locator('[data-custom-text]').fill('Preview personalisation');await screenshot(page,'cart-390-'+language);
  await page.locator('#checkoutNext').click();await page.locator('#checkoutNext').click();assert.equal(await page.locator('#cartModal').getAttribute('data-checkout-stage'),'1');assert.ok(await page.locator('#checkoutResult.err').isVisible());
  await page.locator('#checkoutName').fill('Preview Buyer');await page.locator('#checkoutPhone').fill('05340000000');await page.locator('#checkoutCity').selectOption({label:'İstanbul'});await page.locator('#checkoutDistrict').selectOption({label:'Kadıköy'});await page.locator('#checkoutAddress').fill('Preview address only');await screenshot(page,'address-390-'+language);
  await page.locator('#checkoutNext').click();await page.locator('#payBank').check();assert.equal(await page.locator('#checkoutGrandTotal').innerText(),'1.150 ₺');await screenshot(page,'payment-390-'+language);
  await page.locator('#checkoutSubmit').click();assert.ok(await page.locator('#checkoutResult.err').isVisible());
  await page.locator('#transferReceipt').setInputFiles({name:'preview-receipt.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4 preview fixture')});
  await page.locator('#checkoutSubmit').dblclick();await page.locator('#orderSuccessModal.open').waitFor();await screenshot(page,'success-390-'+language);assert.equal(orderCalls,language==='ar'?1:2);
  await page.locator('#orderSuccessClose').click();await page.locator('body > .boutique-bottom-nav a').last().click();await page.locator('[data-account-mode="register"]').click();await screenshot(page,'register-390-'+language);await page.locator('[data-account-mode="login"]').click();await screenshot(page,'login-390-'+language);
  await page.locator('#accountEmail').fill('preview@example.test');await page.locator('#accountPassword').fill('PreviewPasswordOnly');await page.locator('#accountSubmit').click();await page.locator('#accountMemberView:not([hidden])').waitFor();await screenshot(page,'account-390-'+language);await page.locator('#accountLogout').click();await page.locator('#accountGuestView:not([hidden])').waitFor();
  await context.close();
 }
 assert.equal(authCalls,2);assert.deepEqual(errors,[]);await browser.close();console.log('Boutique passed: bilingual visual views, categories, gallery/zoom, stock-limited card quick-add, home quick-add, quantity, favorites, 3 checkout stages, required fields, bank receipt, single order submission and mocked member login/logout. Screenshots: '+output);
})().catch(e=>{console.error(e);process.exit(1)});

