const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
(async()=>{
 const products=JSON.parse(fs.readFileSync('/tmp/og-products.json')),snapshot=JSON.parse(fs.readFileSync('scripts/fixtures/banner-management.json'));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});const errors=[];let submissions=0;fs.mkdirSync('/tmp/og-desktop-followup',{recursive:true});
 try{for(const lang of ['ar','tr'])for(const width of [390,1024,1440,1920]){
  const page=await browser.newPage({viewport:{width,height:1000}});page.on('pageerror',error=>errors.push(error.message));
  await page.route('https://**/*',async route=>{const request=route.request(),url=new URL(request.url());
   if(url.hostname==='api.onlinegiftis.com'){
    if(url.pathname==='/api/store/products')return route.fulfill({json:products});
    if(url.pathname==='/api/store/categories'){const data=structuredClone(snapshot);for(const c of data.categories){c.descriptionAr='وصف واضح للقسم دون تداخل مع الصورة. '.repeat(5);c.descriptionTr='Ürün detayları fotoğrafın üzerine taşmadan okunmalı. '.repeat(5);}return route.fulfill({json:data});}
    if(url.pathname==='/api/store/reviews'){
     if(request.method()==='POST'){submissions++;assert.equal(request.headers().authorization,'Bearer fixture-member');const body=JSON.parse(request.postData());assert.equal(body.language,lang);assert.equal(body.rating,5);return route.fulfill({status:201,json:{success:true,status:'pending'}});}
     return route.fulfill({json:{summary:{count:2,average:4.5},reviews:[{id:'fixture-ar',displayName:'اسم تجربة <script>',rating:5,comment:'تقييم تجريبي داخل الاختبار فقط',language:'ar',createdAt:'2026-10-12 10:00:00'},{id:'fixture-tr',displayName:'Test müşterisi',rating:4,comment:'Yalnızca test için örnek yorum',language:'tr',createdAt:'2026-10-12 10:01:00'}]}});
    }
    if(request.method()==='GET')return route.fulfill({contentType:'image/webp',body:fs.readFileSync('assets/boutique-gifts.webp')});
   }
   if(url.hostname==='onlinegiftis.com'&&url.pathname.startsWith('/assets/'))return route.fulfill({contentType:'image/webp',body:fs.readFileSync('.'+url.pathname)});
   assert.equal(request.method(),'GET','No real write');return route.abort();
  });
  await page.goto('http://localhost:8765/'+(lang==='tr'?'tr/':''));
  const cards=page.locator('#homeAllCategories .boutique-section-card');await page.waitForFunction(()=>document.querySelectorAll('#homeAllCategories .boutique-section-card').length>3);
  assert.equal(await cards.count(),4);assert.equal(await page.locator('#homeCategories h2').textContent(),lang==='tr'?'Kategoriler':'الأقسام');
  for(const card of await cards.all()){
   assert.equal(await card.isVisible(),true);const fit=await card.locator('img').evaluate(img=>getComputedStyle(img).objectFit);assert.equal(fit,'contain');
   const image=await card.locator('img').boundingBox(),copy=await card.locator('div').boundingBox();assert.ok(image.y+image.height<=copy.y+1,'category text overlaps image');
  }
  assert.equal(await page.locator('.pink-hero picture img').evaluate(img=>getComputedStyle(img).objectFit),'contain','hero art must not crop');
  await page.locator(width>760?'.boutique-desktop-links [data-open-categories]':'.boutique-menu').click();assert.equal(await page.locator('#homeCategoryDrawer .boutique-section-card').count(),snapshot.categories.filter(c=>c.key!=='all').length);if(lang==='tr')assert.match(await page.locator('#homeCategoryDrawer [data-art-role="printing"] img').first().getAttribute('src'),/boutique-print-tr\.webp/);await page.locator('[data-close-categories]').click();
  await page.locator('.store-review-card').first().waitFor();assert.equal(await page.locator('.store-review-card').count(),1);assert.equal(await page.locator('#storeReviewList script').count(),0);assert.equal(await page.locator('.google-review-card').count(),5);assert.equal(await page.locator('.google-review-card[lang="'+lang+'"]').count(),5);if(lang==='tr')assert.equal(await page.locator('.google-review-translation').count(),5);await page.locator('#reviews').screenshot({path:'/tmp/og-desktop-followup/reviews-'+lang+'-'+width+'.png'});assert.equal(await page.locator('#reviews a[href*="g.page"]').count(),0);
  if(width===1440){await page.locator('.review-compose summary').click();await page.locator('[name="displayName"]').fill('Test customer');await page.locator('[name="rating"]').selectOption('5');await page.locator('[name="comment"]').fill('Test review only');await page.locator('#storeReviewForm button').click();await page.waitForFunction(()=>document.getElementById('reviewStatus').textContent.includes(document.documentElement.lang==='tr'?'giriş':'الدخول'));await page.evaluate(()=>localStorage.setItem('og_customer_session_v1',JSON.stringify({accessToken:'fixture-member',refreshToken:'fixture',expiresAt:Date.now()+3600000})));await page.locator('#storeReviewForm button').click();await page.waitForFunction(()=>document.getElementById('reviewStatus').textContent.includes(document.documentElement.lang==='tr'?'onay':'الاعتماد'));assert.equal(await page.locator('.store-review-card').count(),1);}
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'home overflow '+lang+' '+width);
  await page.screenshot({path:'/tmp/og-desktop-followup/home-'+lang+'-'+width+'.png',fullPage:true});
  await page.goto('http://localhost:8765/products/?category=assorted&lang='+lang);await page.locator('#categoryCampaign.boutique-category-campaign').waitFor({state:'visible'});await page.locator('#categoryCampaignImg').evaluate(image=>image.decode());await page.evaluate(()=>document.fonts.ready);
  const {image,copy}=await page.evaluate(()=>({image:document.getElementById('categoryCampaignImg').getBoundingClientRect().toJSON(),copy:document.querySelector('.boutique-category-campaign-copy').getBoundingClientRect().toJSON()}));assert.ok(image.y+image.height<=copy.y+1,'campaign text overlaps artwork');assert.equal(await page.locator('#categoryCampaignImg').evaluate(img=>getComputedStyle(img).objectFit),'contain');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'category overflow');await page.screenshot({path:'/tmp/og-desktop-followup/category-'+lang+'-'+width+'.png',fullPage:true});await page.close();
 }assert.equal(submissions,2);assert.deepEqual(errors,[]);console.log('All homepage categories, complete banner images, separate long AR/TR copy, Turkish print artwork and native review login/pending flow passed at 390/1024/1440/1920.');}
 finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
