(()=>{
 const API='https://api.onlinegiftis.com';
 const WA='https://wa.me/message/LR3NY7SMCEM3B1/';
 const params=new URLSearchParams(location.search);
 const id=Number(document.body.dataset.productId||params.get('id')||0);
 let product=null;
 let categoryMeta={};
 const $=x=>document.getElementById(x);
 const money=v=>new Intl.NumberFormat('tr-TR',{maximumFractionDigits:2}).format(Number(v||0))+' ₺';
 const requested=params.get('lang');
 const currentLang=requested==='tr'||(!requested&&localStorage.getItem('og_lang')==='tr')?'tr':'ar';
 const txt=(ar,tr)=>currentLang==='tr'?tr:ar;
 document.documentElement.lang=currentLang;document.documentElement.dir=currentLang==='tr'?'ltr':'rtl';
 const loadingCopy=document.querySelector('.copy');if(loadingCopy)loadingCopy.hidden=true;
 if(currentLang==='tr'){document.title='Ürün detayları | Online Gifts';const h=document.querySelector('.info h1');if(h)h.textContent='Ürün yükleniyor…';if($('buyBtn'))$('buyBtn').textContent='Yükleniyor…'}
 const localizedName=p=>{
  const s=p?.storefront||{};
  return currentLang==='tr'?(s.nameTr||p.name||''):(s.nameAr||p.name||'');
 };
 const localizedDescription=p=>{
  const s=p?.storefront||{};
  return currentLang==='tr'?(s.descriptionTr||s.shortDescriptionTr||''):(s.descriptionAr||s.shortDescriptionAr||p.description||'');
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
  setText('.info .desc',description);const desc=document.querySelector('.info .desc');if(desc)desc.hidden=!description;
  const media=document.querySelector('.media img');if(media)media.alt=name;
  const cat=document.querySelector('.product-options a');
  if(cat&&window.OGThemes){let key=OGThemes.productCategory(p,params.get('category'));if(Object.keys(categoryMeta).length&&!categoryMeta[key])key=OGThemes.list(p).find(c=>categoryMeta[c])||'all';const info=OGThemes.info(key);const meta=categoryMeta[key];cat.textContent=currentLang==='tr'?(meta?.nameTr||info.tr):(meta?.nameAr||info.ar);cat.href='/products/?'+(currentLang==='tr'?'lang=tr&':'')+'category='+encodeURIComponent(key)}
  const options=document.querySelector('.product-options span');
  if(options)options.textContent=currentLang==='tr'?(options.dataset.tr||options.textContent):(options.dataset.ar||options.textContent);
  const wa=document.querySelector('.nav-actions .wa');if(wa){const message=txt('مرحبا، أريد طلب المنتج: ','Merhaba, şu ürünü sipariş etmek istiyorum: ')+name+' - '+location.href;wa.href=WA+(WA.includes('?')?'&':'?')+'text='+encodeURIComponent(message)}
 }
 function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
 function renderProductContent(p){
  const sf=p.storefront||{},d=sf.details||{},name=localizedName(p),description=localizedDescription(p);
  let badge=document.querySelector('.info .badge');if(!badge&&(sf.isBestseller||sf.isNew||sf.isFeatured)){badge=document.createElement('span');badge.className='badge';document.querySelector('.info')?.prepend(badge)}if(badge){badge.hidden=!(sf.isBestseller||sf.isNew||sf.isFeatured);badge.textContent=sf.isNew?txt('جديد','Yeni'):sf.isBestseller?txt('الأكثر طلباً','Çok satan'):txt('مميز','Öne çıkan')}
  const localized=k=>currentLang==='tr'?(d[k+'Tr']||(!/[\u0600-\u06ff]/.test(String(d[k]||''))?d[k]:'')):(d[k+'Ar']||d[k]||'');
  const rows=[['material',txt('الخامة','Malzeme')],['dimensions',txt('الأبعاد','Ölçüler')],['colors',txt('الألوان','Renkler')]].map(([k,label])=>[label,localized(k)]).filter(x=>String(x[1]||'').trim());
  if(Number(d.weightGrams)>0)rows.push([txt('الوزن','Ağırlık'),d.weightGrams+' '+txt('غرام','g')]);
  if(Number(d.preparationDaysMin)>0||Number(d.preparationDaysMax)>0)rows.push([txt('مدة التجهيز','Hazırlık süresi'),[d.preparationDaysMin,d.preparationDaysMax].filter(v=>Number(v)>0).filter((v,i,a)=>i===0||v!==a[0]).join('–')+' '+txt('يوم','gün')]);
  const panels=[];
  if(description)panels.push('<article class="panel"><h2>'+txt('عن المنتج','Ürün hakkında')+'</h2><p class="product-long-description">'+escapeHtml(description)+'</p></article>');
  if(rows.length)panels.push('<article class="panel"><h2>'+txt('المواصفات','Özellikler')+'</h2><dl class="product-specs">'+rows.map(([k,v])=>'<div><dt>'+escapeHtml(k)+'</dt><dd>'+escapeHtml(v)+'</dd></div>').join('')+'</dl></article>');
  for(const [k,title] of [['boxContents',txt('محتويات العلبة','Kutu içeriği')],['importantNotes',txt('ملاحظات قبل الطلب','Sipariş öncesi notlar')]]){const value=localized(k);if(value)panels.push('<article class="panel"><h2>'+title+'</h2><p class="product-long-description">'+escapeHtml(value)+'</p></article>')}
  const copy=document.querySelector('.copy');if(copy){copy.hidden=!panels.length;const grid=copy.querySelector('.copy-grid');if(grid)grid.innerHTML=panels.join('')}
  const options=document.querySelector('.product-options span');if(options){options.hidden=!(p.requiresCustomizationText||p.requiresCustomizationImage||p.requiresDesignInput);options.textContent=txt('يمكنك إضافة تفاصيل التخصيص عند الطلب','Kişiselleştirme bilgilerini sipariş sırasında ekleyebilirsin')}
  const trusts=document.querySelectorAll('.trust div');if(trusts[0])trusts[0].textContent=p.requiresCustomizationText||p.requiresCustomizationImage?txt('هدية بلمستك','Sana özel hediye'):txt('تجهيز بعناية','Özenle hazırlanır');
  if(trusts[1])trusts[1].textContent=txt('تغليف مرتب','Özenli paketleme');
  if(trusts[2])trusts[2].textContent=txt('توصيل داخل تركيا','Türkiye içi teslimat');
  const wa=document.querySelector('.actions .whatsapp');if(wa)wa.href=WA;
  const actions=document.querySelector('.nav-actions');if(actions&&!actions.querySelector('.language-switch')){const link=document.createElement('a');link.className='language-switch';link.href='/products/detail/?id='+id+'&lang='+(currentLang==='tr'?'ar':'tr');link.textContent=currentLang==='tr'?'العربية':'Türkçe';actions.append(link)}
 }
 function renderGallery(p){
  const media=document.querySelector('.media');if(!media)return;
  const localized=p.localizedImages?.[currentLang];
  const shared=p.storefront?.gallery||[];
  const gallery=localized?[{imageUrl:localized,altAr:localizedName(p),altTr:localizedName(p),isPrimary:true},...shared.map(im=>({...im,isPrimary:false}))]:shared;
  if(gallery.length<2)return;
  let host=document.querySelector('.product-gallery');if(!host){host=document.createElement('div');host.className='product-gallery';media.after(host)}
  host.innerHTML=gallery.map((im,i)=>'<button type="button" data-image-index="'+i+'" aria-label="'+txt('عرض الصورة ','Görseli göster ')+(i+1)+'" aria-pressed="'+Boolean(im.isPrimary||i===0)+'"><img src="'+API+escapeHtml(im.imageUrl)+'" alt="'+escapeHtml(currentLang==='tr'?im.altTr||localizedName(p):im.altAr||localizedName(p))+'" loading="lazy"></button>').join('');
  host.querySelectorAll('button').forEach(button=>button.onclick=()=>{const im=gallery[Number(button.dataset.imageIndex)],img=media.querySelector('img');if(img){img.src=API+im.imageUrl;img.removeAttribute('srcset');img.alt=currentLang==='tr'?im.altTr||localizedName(p):im.altAr||localizedName(p)}host.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)))})
 }
 function setProduct(p){
  product=p;
  if(window.OGThemes){const key=OGThemes.productCategory(p,params.get('category')),meta=categoryMeta[key];OGThemes.apply(key,meta?.customColors?meta.colors:null);}
  applyLanguageShell(p);
  renderProductContent(p);
  const media=document.querySelector('.media');
  if(media){
   const imageUrl=currentLang==='tr'?(p.imageUrlTr!==undefined?p.imageUrlTr:p.imageUrl):(p.imageUrlAr!==undefined?p.imageUrlAr:p.imageUrl);
   if(p.hasImage&&imageUrl){
    let img=media.querySelector('img');
    if(!img){media.innerHTML='<img alt="" decoding="async" fetchpriority="high">';img=media.querySelector('img')}
    img.removeAttribute('srcset');img.removeAttribute('sizes');img.src=API+imageUrl;img.alt=localizedName(p);
   }else if(!media.querySelector('.no-image')){
    media.innerHTML='<div class="no-image"><i class="fa-solid fa-gift"></i></div>';
   }
  }
  renderGallery(p);
  if(p.requiresDesignInput||p.requiresCustomizationText||p.requiresCustomizationImage){
   let button=$('designBtn');if(!button){button=document.createElement('button');button.id='designBtn';button.type='button';button.className='og-design-trigger';document.querySelector('.actions')?.before(button)}
   button.textContent=txt('🎨 صمّم هديتك هنا','🎨 Hediyeni burada tasarla');button.disabled=!p.orderable;
   button.onclick=()=>{if(!window.OGProductDesign)return;OGProductDesign.open({...p,name:localizedName(p)},async(file,label)=>{await OGProductDesign.saveAttachment(id,file);add(label,true)})}
  }
  if($('livePrice'))$('livePrice').textContent=p.price!==null?money(p.price):txt('السعر عند الطلب','Fiyat için iletişime geçin');
  const oldPrice=Number(p.storefront?.compareAtPrice);if(oldPrice>Number(p.price)&&p.price!==null){const el=document.createElement('del');el.className='compare-price';el.textContent=money(oldPrice);$('livePrice')?.after(el)}
  if($('liveStock'))$('liveStock').textContent=p.stockQuantity>0?txt('متوفر حالياً: ','Stokta: ')+p.stockQuantity:txt('غير متوفر حالياً','Şu anda stokta yok');
  const btn=$('buyBtn');
  if(btn){btn.disabled=!p.orderable;btn.innerHTML=p.orderable?'<i class="fa-solid fa-bag-shopping"></i> '+txt('اطلب المنتج','Sipariş ver'):txt('غير متاح للطلب المباشر','Doğrudan siparişe kapalı')}
 }
 async function refresh(){
  try{
   if(!id)throw new Error('missing_product_id');
   const [r,cr]=await Promise.all([fetch(API+'/api/store/products?ts='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(15000)}),fetch(API+'/api/store/categories',{cache:'no-store',signal:AbortSignal.timeout(8000)}).catch(()=>null)]);const d=await r.json();if(cr?.ok){try{const data=await cr.json();categoryMeta=Object.fromEntries((data.categories||[]).map(c=>[c.key,c]))}catch{}}
   if(!r.ok||!Array.isArray(d.products))throw new Error('products');
   const p=d.products.find(x=>Number(x.id)===id);
   if(!p){
    const main=document.querySelector('main');
    if(main)main.innerHTML='<section class="copy"><div class="container"><article class="panel"><h2>'+txt('المنتج غير موجود','Ürün bulunamadı')+'</h2><p>'+txt('قد يكون المنتج محذوفاً أو غير منشور.','Ürün silinmiş veya yayından kaldırılmış olabilir.')+'</p></article></div></section>';
    return
   }
   setProduct(p);
   if(document.body.dataset.dynamicProduct==='1'){
    const q=new URLSearchParams(location.search);
    q.delete('id');
    const suffix=q.toString()?'?'+q.toString():'';
    history.replaceState({},'', '/products/'+id+'/'+suffix);
   }
  }catch(error){
   console.error('Product load failed',error);
   if($('liveStock'))$('liveStock').textContent=txt('تعذر تحميل المنتج. حاول مجدداً.','Ürün yüklenemedi. Lütfen tekrar dene.');
   const info=document.querySelector('.info');if(info&&!info.querySelector('.retry-product')){const button=document.createElement('button');button.className='buy retry-product';button.textContent=txt('إعادة المحاولة','Tekrar dene');button.onclick=()=>{button.remove();refresh()};info.append(button)}
  }
 }
 function add(customOverride,skipPrompt=false){
  if(!product||!product.orderable)return;
  let custom=typeof customOverride==='string'?customOverride:'';
  const needsText=Boolean(product.requiresCustomizationText??(product.customizationType==='text'||product.customizationType==='text_and_image'));
  if(needsText&&!skipPrompt){
   custom=prompt(txt('اكتب الاسم أو النص المطلوب لهذا المنتج:','Bu ürün için isim veya istediğiniz metni yazın:'))?.trim()||'';
   if(!custom)return
  }
  let cart=[];
  try{cart=JSON.parse(localStorage.getItem('og_cart_v1')||'[]');if(!Array.isArray(cart))cart=[]}catch{}
  const existing=cart.find(x=>Number(x.productId)===id);
  if(existing){if(skipPrompt){existing.customizationText=custom}else{if(existing.quantity<product.stockQuantity)existing.quantity+=1;else return;if(custom)existing.customizationText=custom}}
  else cart.push({productId:id,name:localizedName(product),price:product.price,quantity:1,stock:product.stockQuantity,customizationText:custom});
  localStorage.setItem('og_cart_v1',JSON.stringify(cart));
  location.href=currentLang==='tr'?'/products/?lang=tr&cart=1':'/products/?cart=1'
 }
 $('buyBtn')?.addEventListener('click',()=>add());
 refresh()
})();

