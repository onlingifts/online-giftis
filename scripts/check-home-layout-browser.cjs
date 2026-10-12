const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
(async()=>{
 const products=JSON.parse(fs.readFileSync('/tmp/og-products.json'));const snapshot=JSON.parse(fs.readFileSync('scripts/fixtures/banner-management.json'));const available=products.products.filter(p=>p.orderable!==false&&p.hasImage);assert.ok(available.length>=2);
 const wanted=available.slice(0,2).reverse().map(p=>Number(p.id));const errors=[];const browser=await chromium.launch({headless:true,args:['--no-sandbox']});fs.mkdirSync('/tmp/og-home-admin',{recursive:true});
 try{for(const lang of ['ar','tr'])for(const width of [320,390,1440]){
  const page=await browser.newPage({viewport:{width,height:900}});page.on('pageerror',e=>errors.push(e.message));
  const data=structuredClone(snapshot);const title=lang==='ar'?'مختارات الإدارة':'Yönetimin seçtikleri';
  data.storefront={sections:[{key:'featured',enabled:true,sortOrder:2,titleAr:'مختارات الإدارة',titleTr:'Yönetimin seçtikleri',selection:'manual',productIds:wanted,limit:2},{key:'personalized',enabled:false,sortOrder:1,titleAr:'هدايا',titleTr:'Özel',selection:'personalized',limit:4},{key:'flowers',enabled:false,sortOrder:3,titleAr:'ورد',titleTr:'Çiçek',selection:'flowers',limit:4},{key:'reviews',enabled:true,sortOrder:0,titleAr:'آراء العملاء',titleTr:'Müşteri görüşleri'},{key:'promotions',enabled:false,sortOrder:4,titleAr:'عروض',titleTr:'Kampanya'}],hero:{ar:{kicker:'ONLINE GIFTS',heading:'هدايا تختارها بنفسك',description:'وصف من الإدارة',button:'تسوق هديتك',link:'/products/?category=nfc'},tr:{kicker:'ONLINE GIFTS',heading:'Kendi hediyeni seç',description:'Yönetim açıklaması',button:'Hediyeni keşfet',link:'/products/?lang=tr&category=nfc'}}};
  for(const c of data.categories){for(const suffix of ['Ar','Tr']){c['effectiveBannerUrl'+suffix]='http://localhost:8765/assets/boutique-gifts.webp';c['bannerSource'+suffix]='default';}}
  for(const suffix of ['Ar','Tr']){data.homeBanner['effectiveBannerUrl'+suffix]='http://localhost:8765/assets/boutique-hero-desktop.webp';data.homeBanner['bannerSource'+suffix]='default';}
  await page.route('https://**/*',async route=>{assert.equal(route.request().method(),'GET','No remote mutations');const url=new URL(route.request().url());if(url.pathname==='/api/store/categories')return route.fulfill({json:data});if(url.pathname==='/api/store/products')return route.fulfill({json:products});if(/image|banner/.test(url.pathname))return route.fulfill({contentType:'image/webp',body:fs.readFileSync('assets/boutique-gifts.webp')});return route.abort();});
  await page.goto('http://localhost:8765/'+(lang==='tr'?'tr/':''));await page.waitForFunction(()=>document.querySelector('#personalized h2')?.textContent.includes(document.documentElement.lang==='tr'?'Yönetimin':'مختارات'));
  assert.equal(await page.locator('#personalized h2').textContent(),title);assert.equal(await page.locator('#homePersonalizedSection').isVisible(),false);assert.equal(await page.locator('#homeFlowersSection').isVisible(),false);assert.equal(await page.locator('#occasions').isVisible(),false);
  const ids=await page.locator('#homeFeaturedProducts .pink-product-link').evaluateAll(links=>links.map(a=>Number(new URL(a.href).searchParams.get('id'))));assert.deepEqual(ids,wanted);
  assert.equal(await page.evaluate(()=>document.querySelector('#reviews').compareDocumentPosition(document.querySelector('#personalized'))&Node.DOCUMENT_POSITION_FOLLOWING),4);
  assert.equal(await page.locator('.boutique-hero-copy h1').textContent(),data.storefront.hero[lang].heading);assert.match(await page.locator('.pink-hero-link').getAttribute('href'),/category=nfc/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:'/tmp/og-home-admin/'+lang+'-'+width+'.png',fullPage:true});await page.close();
 }assert.deepEqual(errors,[]);console.log('Admin-selected home products/order/limits, hidden sections, bilingual titles/hero and 320/390/1440 responsive views passed.');}
 finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
