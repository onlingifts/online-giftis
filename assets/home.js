(()=>{
 'use strict';
 const API='https://api.onlinegiftis.com';
 const FAVORITES_KEY='og_favorites_v1';
 const CART_KEY='og_cart_v1';
 const language=document.documentElement.lang==='tr'?'tr':'ar';
 const txt=(ar,tr)=>language==='tr'?tr:ar;
 const name=p=>language==='tr'?(p.storefront?.nameTr||p.name):(p.storefront?.nameAr||p.name);
 const href=id=>'/products/detail/?id='+id+(language==='tr'?'&lang=tr':'');
 const $=id=>document.getElementById(id);
 const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 const colorKeys=['bg','surface','primary','secondary','text','muted','accent','onPrimary'];
 const colorStyle=colors=>colorKeys.filter(k=>/^#[0-9a-fA-F]{6}$/.test(colors?.[k]||'')).map(k=>'--home-'+k+':'+colors[k]).join(';');
 function applyHomeColors(meta){const el=document.documentElement;for(const key of colorKeys)el.style.removeProperty('--home-'+key);el.toggleAttribute('data-home-colors',Boolean(meta?.customColors));if(meta?.customColors)for(const key of colorKeys)if(/^#[0-9a-fA-F]{6}$/.test(meta.colors?.[key]||''))el.style.setProperty('--home-'+key,meta.colors[key]);}
 const money=v=>new Intl.NumberFormat('tr-TR',{maximumFractionDigits:0}).format(Number(v||0))+' TL';
 const categories=p=>{const raw=p?.categories??p?.category??[];return (Array.isArray(raw)?raw:typeof raw==='string'?raw.split(','):[]).map(x=>String(x).trim()).filter(Boolean)};
 let favorites=new Set();
 try{favorites=new Set((JSON.parse(localStorage.getItem(FAVORITES_KEY)||'[]')||[]).map(String))}catch{}
 function cartCount(){
  try{const cart=JSON.parse(localStorage.getItem(CART_KEY)||'[]');return Array.isArray(cart)?cart.reduce((n,item)=>n+Math.max(0,Number(item.quantity)||0),0):0}catch{return 0}
 }
 function syncBadges(){
  const cart=$('homeCartCount'),fav=$('homeFavoriteCount');
  const cc=cartCount();if(cart){cart.textContent=String(cc);cart.hidden=!cc}
  const fc=favorites.size;if(fav){fav.textContent=String(fc);fav.hidden=!fc}
 }
 function saveFavorites(){try{localStorage.setItem(FAVORITES_KEY,JSON.stringify([...favorites]))}catch{}syncBadges()}
 function toggleFavorite(id,button){
  const key=String(id);favorites.has(key)?favorites.delete(key):favorites.add(key);saveFavorites();
  if(button){const active=favorites.has(key);button.classList.toggle('is-favorite',active);button.setAttribute('aria-pressed',String(active));const i=button.querySelector('i');if(i)i.className=active?'fa-solid fa-heart':'fa-regular fa-heart'}
 }
 function productCard(p){
  const id=Number(p.id),image=p.hasImage&&p.imageUrl?API+p.imageUrl:'',price=p.price!==null&&p.price!==undefined?money(p.price):txt('عرض المنتج','Ürünü görüntüle');
  const active=favorites.has(String(id));
  return '<article class="pink-product-card">'+
   '<button class="pink-favorite'+(active?' is-favorite':'')+'" type="button" data-favorite-id="'+id+'" aria-label="'+txt('إضافة للمفضلة','Favorilere ekle')+'" aria-pressed="'+active+'"><i class="'+(active?'fa-solid':'fa-regular')+' fa-heart"></i></button>'+
   '<a class="pink-product-link" href="'+href(id)+'">'+
    '<span class="pink-product-media">'+(image?'<img '+OGImages.product(p,'(max-width: 900px) calc((100vw - 34px) / 3), (max-width: 1208px) calc((100vw - 67px) / 4), 282px')+' alt="'+esc(name(p))+'" loading="lazy" decoding="async">':'<span class="pink-empty">'+txt('بدون صورة','Görsel yok')+'</span>')+'</span>'+
    '<span class="pink-product-body"><strong class="pink-product-name">'+esc(name(p))+'</strong><span class="pink-product-bottom"><b class="pink-product-price">'+esc(price)+'</b><span class="pink-product-open" aria-hidden="true"><i class="fa-solid fa-cart-shopping"></i></span></span></span>'+
   '</a></article>'
 }
 function pickByCategory(products,key){return products.find(p=>p.orderable!==false&&p.hasImage&&categories(p).includes(key))}
 function applyOccasionImages(products){
  const map={birthday:'occasions',love:'love',family:'family',kids:'kids'};
  document.querySelectorAll('[data-occasion]').forEach(card=>{
   const p=pickByCategory(products,map[card.dataset.occasion]);if(!p?.imageUrl)return;
   const img=card.querySelector('img');if(img)OGImages.setProduct(img,p,'(max-width: 900px) calc((100vw - 36px) / 4), 280px')
  })
 }
 async function loadProducts(){
  const host=$('homeFeaturedProducts');if(!host&&!document.querySelector('.stage-main-card'))return;
  try{
   const r=await fetch(API+'/api/store/products',{cache:'no-store'}),d=await r.json();
   if(!r.ok||!Array.isArray(d.products))throw new Error('products');
   const products=d.products.filter(p=>p&&p.orderable!==false&&p.hasImage);
   const preferred=products.filter(p=>p.isFeatured&&p.price!==null);
   const customized=products.filter(p=>p.price!==null&&(p.requiresCustomizationText||p.requiresCustomizationImage||p.requiresDesignInput||categories(p).some(c=>['nfc','drinkware','gifts','love'].includes(c))));
   const seen=new Set(),list=[];
   [...preferred,...customized,...products].forEach(p=>{if(list.length>=3)return;const k=String(p.id);if(!seen.has(k)){seen.add(k);list.push(p)}});
   if(host)host.innerHTML=list.length?list.map(productCard).join(''):'<div class="pink-empty">'+txt('ما في منتجات متاحة حالياً.','Henüz ürün bulunmuyor.')+'</div>';
   host?.querySelectorAll('[data-favorite-id]').forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();toggleFavorite(btn.dataset.favoriteId,btn)}));


   document.querySelectorAll('.stage-main-card,.stage-mini-card').forEach((card,i)=>{const p=products[i];if(!p)return;card.href=href(p.id);const img=card.querySelector('img');if(img)OGImages.setProduct(img,p,'460px');const title=card.querySelector('strong');if(title)title.textContent=name(p)});
  }catch{
   if(host)host.innerHTML='<div class="pink-empty">'+txt('تعذر تحميل المنتجات حالياً.','Ürünler şu anda yüklenemedi.')+'</div>'
  }
 }
 async function loadCategories(){
  try{const response=await fetch(API+'/api/store/categories?ts='+Date.now(),{cache:'no-store'}),data=await response.json();if(!response.ok||!Array.isArray(data.categories))return;
   const all=data.categories.find(c=>c.key==='all'),main=data.homeBanner;applyHomeColors(main);
   const banner=main?(language==='tr'?main.bannerUrlTr:main.bannerUrlAr):(language==='tr'?all?.bannerUrlTr:(all?.bannerUrlAr||all?.bannerUrl));
   const hero=document.querySelector('.pink-hero'),img=hero?.querySelector('img');
   if(hero){hero.style.display=banner?'':'none';if(img&&banner){img.hidden=false;img.removeAttribute('srcset');img.removeAttribute('sizes');img.style.height='auto';img.style.aspectRatio='auto';img.style.objectFit='contain';img.src=new URL(banner,API).href;img.alt=txt('البانر الرئيسي — Online Gifts','Online Gifts ana banner');hero.classList.add('has-custom-banner')}}
   const nav=document.querySelector('.pink-categories');if(nav){const icons={drinkware:'fa-mug-hot',nfc:'fa-wifi',family:'fa-people-roof',kids:'fa-child-reaching',love:'fa-heart',all:'fa-gift'};nav.innerHTML=data.categories.map(c=>'<a href="/products/?'+(language==='tr'?'lang=tr&':'')+(c.key==='all'?'':'category='+encodeURIComponent(c.key))+'"><span class="pink-cat-icon cat-gift"><i class="fa-solid '+(icons[c.key]||'fa-gift')+'"></i></span><strong>'+esc(language==='tr'?(c.nameTr||c.nameAr):c.nameAr)+'</strong></a>').join('')}
   const bannerGrid=document.querySelector('.pink-occasion-grid');
   if(bannerGrid&&Array.isArray(data.banners)){
    bannerGrid.innerHTML=data.banners.slice().sort((a,b)=>a.sortOrder-b.sortOrder).map(b=>{
     const category=data.categories.find(c=>c.key===b.categoryKey);
     const title=category?(language==='tr'?(category.nameTr||category.nameAr):category.nameAr):(language==='tr'?(b.nameTr||b.nameAr):b.nameAr);
     const image=language==='tr'?b.bannerUrlTr:b.bannerUrlAr;
     const query=language==='tr'?b.queryTr:b.queryAr;
     const target='/products/?'+(language==='tr'?'lang=tr&':'')+(category?'category='+encodeURIComponent(category.key):query?'q='+encodeURIComponent(query):'');
     return '<a class="pink-occasion-card" href="'+esc(target)+'" data-site-banner="'+esc(b.id)+'"'+(b.customColors?' data-banner-colors style="'+esc(colorStyle(b.colors))+'"':'')+'>'+(image?'<img src="'+esc(new URL(image,API).href)+'" alt="'+esc(title)+'" loading="lazy" decoding="async">':'<span class="occasion-art"><i class="fa-solid fa-gift"></i></span>')+'<strong>'+esc(title)+'</strong></a>';
    }).join('');
    const section=bannerGrid.closest('section');if(section)section.hidden=!data.banners.length;
   }
   // Other category shortcuts use the same saved names and visibility.
   document.querySelectorAll('[data-occasion],.collection-card').forEach(link=>{
    const key=new URL(link.href).searchParams.get('category');if(!key)return;
    const category=data.categories.find(c=>c.key===key);
    if(!category){link.hidden=true;link.style.display='none';return}
    const label=link.querySelector('strong');if(label)label.textContent=language==='tr'?(category.nameTr||category.nameAr):category.nameAr;
   });
  }catch{}
 }
 const drawer=$('homeCategoryDrawer');
 if(drawer){
  const triggers=[...document.querySelectorAll('[data-open-categories]')];
  const syncDrawer=()=>triggers.forEach(button=>button.setAttribute('aria-expanded',String(drawer.open)));
  triggers.forEach(button=>button.addEventListener('click',()=>{if(!drawer.open)drawer.showModal();syncDrawer()}));
  drawer.querySelector('[data-close-categories]').addEventListener('click',()=>drawer.close());
  drawer.addEventListener('close',syncDrawer);
  drawer.addEventListener('click',event=>{if(event.target!==drawer)return;const rect=drawer.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)drawer.close()});
 }
 const y=$('year');if(y)y.textContent=new Date().getFullYear();
 try{localStorage.setItem('og_lang',language)}catch{}
 syncBadges();loadProducts();loadCategories();
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)loadCategories()});
 window.addEventListener('pageshow',event=>{if(event.persisted)loadCategories()});
 window.addEventListener('storage',e=>{if(e.key===FAVORITES_KEY){try{favorites=new Set((JSON.parse(e.newValue||'[]')||[]).map(String))}catch{}syncBadges()}if(e.key===CART_KEY)syncBadges()});
})();


