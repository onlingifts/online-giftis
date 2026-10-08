(()=>{
 const API='https://api.onlinegiftis.com';
 const WA='https://wa.me/message/LR3NY7SMCEM3B1/';
 const id=Number(document.body.dataset.productId||0);
 let product=null;
 const $=x=>document.getElementById(x);
 const money=v=>new Intl.NumberFormat('tr-TR',{maximumFractionDigits:2}).format(Number(v||0))+' ₺';
 const params=new URLSearchParams(location.search);
 const requested=params.get('lang');
 const currentLang=requested==='tr'||(!requested&&localStorage.getItem('og_lang')==='tr')?'tr':'ar';
 const txt=(ar,tr)=>currentLang==='tr'?tr:ar;
 const localizedName=p=>{
  const s=p?.storefront||{};
  return currentLang==='tr'?(s.nameTr||p.name||''):(s.nameAr||p.name||'');
 };
 const localizedDescription=p=>{
  const s=p?.storefront||{};
  return currentLang==='tr'?(s.descriptionTr||s.shortDescriptionTr||p.description||''):(s.descriptionAr||s.shortDescriptionAr||p.description||'');
 };
 function setText(selector,value){const el=document.querySelector(selector);if(el)el.textContent=value}
 function setHref(selector,value){const el=document.querySelector(selector);if(el)el.setAttribute('href',value)}
 function applyLanguageShell(p){
  document.documentElement.lang=currentLang;
  document.documentElement.dir=currentLang==='tr'?'ltr':'rtl';
  localStorage.setItem('og_lang',currentLang);
  const name=localizedName(p),description=localizedDescription(p);
  if(currentLang==='tr'){
   const s=p.storefront||{};
   document.title=s.seoTitleTr||((name||'Ürün')+' | Online Gifts Türkiye');
   const meta=document.querySelector('meta[name="description"]');if(meta)meta.content=s.metaDescriptionTr||description||'Online Gifts kişiye özel hediye ürünü.';
   setHref('.brand','/tr/');
   setText('.nav-actions .store','Tüm ürünler');setHref('.nav-actions .store','/products/?lang=tr');
   setText('.nav-actions .wa','WhatsApp');
   const crumb=document.querySelector('.crumb');if(crumb)crumb.innerHTML='<a href="/tr/">Ana sayfa</a> / <a href="/products/?lang=tr">Ürünler</a> / '+escapeHtml(name);
   const badge=document.querySelector('.info .badge');if(badge)badge.textContent='Çok satan';
   const trusts=document.querySelectorAll('.trust div');
   if(trusts[0])trusts[0].innerHTML='<i class="fa-solid fa-palette"></i>Kişiye özel üretim';
   if(trusts[1])trusts[1].innerHTML='<i class="fa-solid fa-box"></i>Özenli paketleme';
   if(trusts[2])trusts[2].innerHTML='<i class="fa-solid fa-truck-fast"></i>Türkiye genelinde ücretsiz teslimat';
   const panels=document.querySelectorAll('.copy .panel');
   if(panels[0]){
    const h=panels[0].querySelector('h2');if(h)h.textContent='Bu ürün hakkında';
    const ps=panels[0].querySelectorAll('p');if(ps[0])ps[0].textContent=description||name;if(ps[1])ps[1].textContent='Görünen fiyat ve stok Online Gifts sisteminden güncellenir. Kişiye özel ürünlerde metin, görsel veya tasarım dosyanızı sipariş sırasında ekleyebilirsiniz.'
   }
   if(panels[1]){
    const h=panels[1].querySelector('h2');if(h)h.textContent='Online Gifts · 2016’dan beri';
    const ul=panels[1].querySelector('ul');if(ul)ul.innerHTML='<li>Ürüne göre kişiye özel tasarım, baskı ve hazırlık.</li><li>Transfer baskı, lazer kazıma, 3D baskı ve NFC ürünleri.</li><li>Türkiye genelinde ücretsiz teslimat.</li><li>Özel adet ve tasarımlar için WhatsApp desteği.</li>'
   }
   const footer=document.querySelector('.footer .container');if(footer)footer.innerHTML='<span>© Online Gifts — 2016’dan beri</span><span><a href="/tr/istanbul-hediye/">İstanbul hediyeleri</a> · <a href="/tr/kisiye-ozel-hediye/">Kişiye özel hediyeler</a></span>';
  }
  setText('.info h1',name);
  setText('.info .desc',description||txt('Online Gifts ürünü.','Online Gifts ürünü.'));
  const media=document.querySelector('.media img');if(media)media.alt=name;
  const cat=document.querySelector('.product-options a');
  if(cat&&window.OGThemes){const key=OGThemes.productCategory(p,params.get('category'));const info=OGThemes.info(key);cat.textContent=currentLang==='tr'?info.tr:info.ar;cat.href='/products/?'+(currentLang==='tr'?'lang=tr&':'')+'category='+encodeURIComponent(key)}
  const options=document.querySelector('.product-options span');
  if(options)options.textContent=currentLang==='tr'?(options.dataset.tr||options.textContent):(options.dataset.ar||options.textContent);
  const wa=document.querySelector('.nav-actions .wa');if(wa){const message=txt('مرحبا، أريد طلب المنتج: ','Merhaba, şu ürünü sipariş etmek istiyorum: ')+name+' - '+location.href;wa.href=WA+(WA.includes('?')?'&':'?')+'text='+encodeURIComponent(message)}
 }
 function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
 function setProduct(p){
  product=p;
  if(window.OGThemes)OGThemes.apply(OGThemes.productCategory(p,params.get('category')));
  applyLanguageShell(p);
  if($('livePrice'))$('livePrice').textContent=p.price!==null?money(p.price):txt('السعر عند الطلب','Fiyat için iletişime geçin');
  if($('liveStock'))$('liveStock').textContent=p.stockQuantity>0?txt('متوفر حالياً: ','Stokta: ')+p.stockQuantity:txt('غير متوفر حالياً','Şu anda stokta yok');
  const btn=$('buyBtn');
  if(btn){btn.disabled=!p.orderable;btn.innerHTML=p.orderable?'<i class="fa-solid fa-bag-shopping"></i> '+txt('اطلب المنتج','Sipariş ver'):txt('غير متاح للطلب المباشر','Doğrudan siparişe kapalı')}
 }
 async function refresh(){
  try{
   const r=await fetch(API+'/api/store/products',{cache:'no-store'}),d=await r.json();
   if(!r.ok||!Array.isArray(d.products))return;
   const p=d.products.find(x=>Number(x.id)===id);
   if(p)setProduct(p)
  }catch{}
 }
 function add(){
  if(!product||!product.orderable)return;
  let custom='';
  const needsText=Boolean(product.requiresCustomizationText??(product.customizationType==='text'||product.customizationType==='text_and_image'));
  if(needsText){
   custom=prompt(txt('اكتب الاسم أو النص المطلوب لهذا المنتج:','Bu ürün için isim veya istediğiniz metni yazın:'))?.trim()||'';
   if(!custom)return
  }
  let cart=[];
  try{cart=JSON.parse(localStorage.getItem('og_cart_v1')||'[]');if(!Array.isArray(cart))cart=[]}catch{}
  const existing=cart.find(x=>Number(x.productId)===id&&String(x.customizationText||'')===custom);
  if(existing){if(existing.quantity<product.stockQuantity)existing.quantity+=1}
  else cart.push({productId:id,name:localizedName(product),price:product.price,quantity:1,stock:product.stockQuantity,customizationText:custom});
  localStorage.setItem('og_cart_v1',JSON.stringify(cart));
  location.href=currentLang==='tr'?'/products/?lang=tr&cart=1':'/products/?cart=1'
 }
 $('buyBtn')?.addEventListener('click',add);
 refresh()
})();
