const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const base=process.env.OG_BASE_URL||'http://localhost:8765';
const product={id:9001,sku:'WRAP-TEST',name:'هدية الاختبار',price:500,stockQuantity:5,orderable:true,hasImage:false,description:'Test gift',categories:['gifts'],storefront:{nameAr:'هدية الاختبار',nameTr:'Test hediyesi',descriptionAr:'هدية',descriptionTr:'Hediye'}};
(async()=>{
 const browser=await chromium.launch({headless:true});
 for(const language of ['ar','tr']){
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),page=await context.newPage();let submitted=null;
  await page.route('https://**/*',async route=>{
   const u=new URL(route.request().url()),p=u.pathname;
   if(u.hostname==='api.onlinegiftis.com'){
    if(p==='/api/store/products')return route.fulfill({json:{products:[product]}});
    if(p==='/api/store/categories')return route.fulfill({json:{categories:[{key:'all',nameAr:'كل المنتجات',nameTr:'Tüm ürünler'},{key:'gifts',nameAr:'هدايا',nameTr:'Hediyeler'}]}});
    if(p==='/api/store/config')return route.fulfill({json:{config:{bankConfigured:false,freeDelivery:false,deliveryFee:150,codFee:75}}});
    if(p==='/api/store/wheel')return route.fulfill({json:{active:false,awards:[]}});
    if(p==='/api/store/orders'){
     const raw=route.request().postData(),match=raw.match(/name="payload"\r\n\r\n([^\r]+)/);assert.ok(match,raw);submitted=JSON.parse(match[1]);
     return route.fulfill({json:{order:{orderNumber:'WRAP-TEST',total:1715,giftWrappingType:'vip',giftWrappingFee:490}}});
    }
    if(route.request().method()!=='GET')throw Error('Unexpected production mutation '+p);
    return route.fulfill({json:{}});
   }
   if(p.endsWith('/settings'))return route.fulfill({json:{external:{google:false}}});
   return route.abort();
  });
  await page.addInitScript(()=>localStorage.setItem('og_cart_v1',JSON.stringify([{productId:9001,quantity:1,name:'هدية',price:500,stock:5}])));
  await page.goto(base+(language==='tr'?'/tr/products/':'/products/')+'?cart=1');
  await page.waitForFunction(()=>document.getElementById('checkoutSubmit').disabled===false);
  const total=()=>page.locator('#checkoutGrandTotal').textContent();
  assert.match(await total(),/725/);
  await page.selectOption('#giftWrappingType','paper');assert.match(await total(),/815/);
  await page.selectOption('#giftWrappingType','vip');assert.match(await total(),/1[.,]215/);
  await page.reload();await page.waitForFunction(()=>document.getElementById('checkoutSubmit').disabled===false);assert.equal(await page.inputValue('#giftWrappingType'),'vip');assert.match(await total(),/1[.,]215/);
  await page.click('[data-plus="0"]');assert.match(await total(),/1[.,]715/);
  if(language==='tr')assert.match(await page.locator('#giftWrappingType').textContent(),/Çiçekli VIP/);
  else assert.match(await page.locator('#giftWrappingType').textContent(),/صندوق هدية/);
  assert.equal(await page.locator('#giftWrappingFeeAmount').textContent(),'490 ₺');
  assert.equal(await page.evaluate(()=>document.querySelector('#cartModal .sheet').scrollWidth>document.querySelector('#cartModal .sheet').clientWidth),false);
  await page.screenshot({path:'/tmp/og-wrapping-'+language+'.png',fullPage:true});
  await page.click('#checkoutNext');
  await page.fill('#checkoutName','Test Buyer');await page.fill('#checkoutPhone','05320000000');
  await page.selectOption('#checkoutCity','İstanbul');await page.selectOption('#checkoutDistrict','Fatih');await page.fill('#checkoutAddress','Test address 123');
  await page.click('#checkoutNext');
  await page.click('#checkoutSubmit');await page.locator('#orderSuccessModal.open').waitFor();
  assert.equal(submitted.giftWrappingType,'vip');assert.equal(submitted.items[0].quantity,2);assert.equal(submitted.giftWrappingFee,undefined);assert.match(await page.locator('#orderSuccessExtras').textContent(),/490/);
  await page.click('#orderSuccessClose');await page.click('#navCart');assert.equal(await page.inputValue('#giftWrappingType'),'none');
  await context.close();
 }
 await browser.close();console.log('Wrapping AR/TR totals, persistence, quantity, payload and reset passed with isolated API mocks.');
})().catch(error=>{console.error(error);process.exit(1)});
