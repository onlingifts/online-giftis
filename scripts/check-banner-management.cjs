const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const path=require('node:path');
const vm=require('node:vm');
const snapshot=JSON.parse(fs.readFileSync('scripts/fixtures/banner-management.json'));
const products=JSON.parse(fs.readFileSync('/tmp/og-products.json'));
const expected={personalized:'occasions',assorted:'printing',kids:'kids',family:'family',nfc:'keychains',photo:'photo',laser:'silver',perfumes_accessories:'perfume',thermal:'hookah','cat_bb6c6aa1-4628-457f-a482-639e011bc174':'jewelry','cat_3cd33c02-2fb9-4609-82c0-2898be0264a6':'flowers','cat_cd93d32f-d427-4542-aad7-f1958012c278':'gifts'};
const tokens=new Map();
const sandbox={window:{},document:{documentElement:{lang:'ar',style:{setProperty:(k,v)=>tokens.set(k,v),removeProperty:k=>tokens.delete(k)}}},location:{search:''},URL,URLSearchParams};
vm.runInNewContext(fs.readFileSync('assets/boutique-presentation.js','utf8'),sandbox);
const presentation=sandbox.window.OGBoutique;
for(const category of snapshot.categories.filter(c=>c.key!=='all')){
 assert.equal(presentation.role(category),expected[category.key],category.nameAr);
 assert.ok(fs.existsSync('.'+presentation.campaign(category).asset),category.nameAr);
 for(const lang of ['ar','tr']){sandbox.document.documentElement.lang=lang;const changed={...category,[lang==='ar'?'bannerUrlAr':'bannerUrlTr']:'/api/store/categories/banner?key='+category.key+'&v=admin-new-upload'};assert.match(presentation.campaign(changed).asset,/admin-new-upload/);assert.equal(presentation.campaign(changed).custom,true);assert.equal(presentation.campaign(category).custom,false);}
}
presentation.applyPalette({customColors:true,colors:{primary:'#123456',bg:'#ABCDEF',text:'#010203'}});assert.equal(tokens.get('--lux-wine'),'#123456');assert.equal(tokens.get('--lux-ivory'),'#ABCDEF');presentation.applyPalette({customColors:false});assert.equal(tokens.size,0);
assert.match(presentation.card({...snapshot.banners[0],key:'personalized'},'/products/'),/Doğum günü/);
(async()=>{
 const output=process.env.OG_SCREENSHOT_DIR||'/tmp/og-specialty-banners';fs.mkdirSync(output,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.OG_BROWSER_PATH,args:['--no-sandbox'],headless:true});
 const errors=[];
 for(const lang of ['ar','tr'])for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:844}});page.on('pageerror',e=>errors.push(e.message));
  let updated=false;
  await page.route('https://**/*',async route=>{
   assert.equal(route.request().method(),'GET','Read-only test');const url=new URL(route.request().url());
   if(url.pathname==='/api/store/categories'){const data=structuredClone(snapshot);if(updated){data.categories.find(c=>c.key==='nfc')[lang==='ar'?'bannerUrlAr':'bannerUrlTr']='/api/store/categories/banner?key=nfc&v=admin-new-upload';data.homeBanner[lang==='ar'?'bannerUrlAr':'bannerUrlTr']='/api/store/home-banner?v=admin-new-upload';data.banners[0][lang==='ar'?'bannerUrlAr':'bannerUrlTr']='/api/store/banners/image?id=birthday&v=admin-new-upload';}return route.fulfill({json:data});}
   if(url.pathname==='/api/store/products')return route.fulfill({json:products});
   if(url.pathname.includes('/image')||url.pathname.includes('banner'))return route.fulfill({contentType:'image/webp',body:fs.readFileSync('assets/boutique-gifts.webp')});
   return route.abort();
  });
  for(const c of snapshot.categories.filter(c=>c.key!=='all')){
   await page.goto('http://localhost:8765/products/?lang='+lang+'&category='+encodeURIComponent(c.key));
   await page.locator('#categoryCampaign').waitFor({state:'visible'});await page.locator('#categoryCampaignImg').evaluate(img=>img.decode());
   assert.equal(await page.locator('#categoryCampaign').getAttribute('data-art-role'),expected[c.key]);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await page.screenshot({path:path.join(output,c.key+'-'+lang+'-'+width+'.png')});
  }
  updated=true;await page.goto('http://localhost:8765/products/?lang='+lang+'&category=nfc');await page.waitForFunction(()=>document.getElementById('categoryCampaignImg').src.includes('admin-new-upload'));
  assert.equal(await page.locator('.boutique-category-campaign-copy').isVisible(),false);
  await page.screenshot({path:path.join(output,'admin-upload-category-'+lang+'-'+width+'.png')});
  await page.goto('http://localhost:8765/'+(lang==='tr'?'tr/':''));await page.waitForFunction(()=>document.querySelector('.has-custom-banner img')?.src.includes('admin-new-upload'));
  await page.locator('.pink-occasion-grid .boutique-saved-banner').first().waitFor();
  assert.equal(await page.locator('.pink-occasion-grid .boutique-section-card strong').first().textContent(),lang==='tr'?'Doğum günü':'أعياد الميلاد');
  await page.screenshot({path:path.join(output,'admin-upload-home-'+lang+'-'+width+'.png'),fullPage:true});await page.close();
 }
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS specialty coverage, AR/TR uploads, own promo names and 56 browser screenshots');
})().catch(e=>{console.error(e);process.exit(1)});
