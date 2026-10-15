(()=>{
 'use strict';
 const API='https://api.onlinegiftis.com';
 const FAVORITES_KEY='og_favorites_v1';
 const CART_KEY='og_cart_v1';
 const language=document.documentElement.lang==='tr'?'tr':'ar';
 const txt=(ar,tr)=>language==='tr'?tr:ar;
 const name=p=>language==='tr'?(p.storefront?.nameTr||p.name):(p.storefront?.nameAr||p.name);
 const productImage=p=>language==='tr'?(p.imageUrlTr!==undefined?p.imageUrlTr:p.imageUrl):(p.imageUrlAr!==undefined?p.imageUrlAr:p.imageUrl);
 const href=id=>'/products/'+encodeURIComponent(String(id))+'/'+(language==='tr'?'?lang=tr':'');
 const $=id=>document.getElementById(id);
 const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 const colorKeys=['bg','surface','primary','secondary','text','muted','accent','onPrimary'];
 const colorStyle=colors=>colorKeys.filter(k=>/^#[0-9a-fA-F]{6}$/.test(colors?.[k]||'')).map(k=>'--home-'+k+':'+colors[k]).join(';');
 function applyHomeColors(meta){window.OGBoutique?.applyPalette(meta);const el=document.documentElement;for(const key of colorKeys)el.style.removeProperty('--home-'+key);el.toggleAttribute('data-home-colors',Boolean(meta?.customColors));if(meta?.customColors)for(const key of colorKeys)if(/^#[0-9a-fA-F]{6}$/.test(meta.colors?.[key]||''))el.style.setProperty('--home-'+key,meta.colors[key]);}
 const money=v=>new Intl.NumberFormat('tr-TR',{maximumFractionDigits:0}).format(Number(v||0))+' ₺';
 const categories=p=>{const raw=p?.categories??p?.category??[];return (Array.isArray(raw)?raw:typeof raw==='string'?raw.split(','):[]).map(x=>String(x).trim()).filter(Boolean)};
 let catalogue=[],categoryRows=[],homeLayout=null;
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
  const id=Number(p.id),image=p.hasImage&&productImage(p)?API+productImage(p):'',price=p.price!==null&&p.price!==undefined?money(p.price):txt('عرض المنتج','Ürünü görüntüle');
  const active=favorites.has(String(id));
  return '<article class="pink-product-card">'+
   '<button class="pink-favorite'+(active?' is-favorite':'')+'" type="button" data-favorite-id="'+id+'" aria-label="'+txt('إضافة للمفضلة','Favorilere ekle')+'" aria-pressed="'+active+'"><i class="'+(active?'fa-solid':'fa-regular')+' fa-heart"></i></button>'+
   '<a class="pink-product-link" href="'+href(id)+'">'+
    '<span class="pink-product-media">'+(image?'<img '+OGImages.product(p,'(max-width: 900px) calc((100vw - 34px) / 2), (max-width: 1208px) calc((100vw - 67px) / 4), 282px')+' alt="'+esc(window.OGBoutique?.shortName(p)||name(p))+'" loading="lazy" decoding="async">':'<span class="pink-empty">'+txt('بدون صورة','Görsel yok')+'</span>')+'</span>'+
    '<span class="pink-product-body"><strong class="pink-product-name">'+esc(window.OGBoutique?.shortName(p)||name(p))+'</strong>'+(window.OGBoutique?.rating(p)||'')+'<span class="pink-product-bottom"><b class="pink-product-price">'+esc(price)+'</b><span class="pink-product-open" aria-hidden="true"><i class="fa-solid fa-cart-shopping"></i></span></span></span>'+
   '</a><a class="pink-product-quick" href="'+href(id)+'&intent=add" aria-label="'+txt('إضافة للسلة: ','Sepete ekle: ')+esc(name(p))+'"><i class="fa-solid fa-cart-shopping"></i></a></article>'
 }
 function pickByCategory(products,key){return products.find(p=>p.orderable!==false&&p.hasImage&&categories(p).includes(key))}
 function applyOccasionImages(products){
  const map={birthday:'occasions',love:'love',family:'family',kids:'kids'};
  document.querySelectorAll('[data-occasion]').forEach(card=>{
   const p=pickByCategory(products,map[card.dataset.occasion]);if(!p||!productImage(p))return;
   const img=card.querySelector('img');if(img)OGImages.setProduct(img,p,'(max-width: 900px) calc((100vw - 36px) / 4), 280px')
  })
 }
 function bindFavoriteButtons(host){host?.querySelectorAll('[data-favorite-id]').forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();toggleFavorite(btn.dataset.favoriteId,btn)}));}
 function renderCollections(){
  if(!window.OGHomeLayout)return;
  const hosts={featured:['homeFeaturedProducts','personalized'],personalized:['homePersonalizedProducts','homePersonalizedSection'],flowers:['homeFlowersProducts','homeFlowersSection']};
  for(const section of OGHomeLayout.sections(homeLayout)){
   const ids=hosts[section.key];if(!ids)continue;
   const host=$(ids[0]),el=$(ids[1]);if(!host||!el)continue;
   const products=OGHomeLayout.select(section,catalogue,categoryRows,c=>window.OGBoutique?.role(c));
   el.hidden=section.enabled===false||!products.length;host.innerHTML=products.map(productCard).join('');bindFavoriteButtons(host);
   const link=el.querySelector('.pink-section-head a');if(link){const category=section.selection==='category'?section.categoryKey:section.selection==='flowers'?categoryRows.find(c=>window.OGBoutique?.role(c)==='flowers')?.key:null;link.href='/products/?'+(language==='tr'?'lang=tr&':'')+(category?'category='+encodeURIComponent(category):'');}
  }
  OGHomeLayout.apply(homeLayout,document,language);
 }
 function renderCategoryDrawer(){
  const nav=document.querySelector('.pink-categories');if(!nav||!categoryRows.length||!window.OGBoutique)return;
  nav.innerHTML=OGBoutique.orderedCategories(categoryRows).map(c=>OGBoutique.card(c,'/products/?'+(language==='tr'?'lang=tr&':'')+'category='+encodeURIComponent(c.key),catalogue.find(p=>categories(p).includes(c.key)&&p.hasImage))).join('');
 }
 async function loadProducts(){
  const host=$('homeFeaturedProducts');if(!host&&!document.querySelector('.stage-main-card'))return;
  try{
   const r=await fetch(API+'/api/store/products',{cache:'no-store'}),d=await r.json();
   if(!r.ok||!Array.isArray(d.products))throw new Error('products');
   const products=d.products.filter(p=>p&&p.orderable!==false&&p.hasImage);catalogue=products;renderCollections();renderCategoryDrawer();window.OGHomeDiscovery?.mountProducts(products);



   document.querySelectorAll('.stage-main-card,.stage-mini-card').forEach((card,i)=>{const p=products[i];if(!p)return;card.href=href(p.id);const img=card.querySelector('img');if(img)OGImages.setProduct(img,p,'460px');const title=card.querySelector('strong');if(title)title.textContent=name(p)});
  }catch{
   if(host)host.innerHTML='<div class="pink-empty">'+txt('تعذر تحميل المنتجات حالياً.','Ürünler şu anda yüklenemedi.')+'</div>'
  }
 }
 async function loadCategories(){
  try{const response=await fetch(API+'/api/store/categories?ts='+Date.now(),{cache:'no-store'}),data=await response.json();if(!response.ok||!Array.isArray(data.categories))throw Error('categories');categoryRows=data.categories;homeLayout=data.storefront||null;renderCollections();window.OGHomeDiscovery?.mountCategories(data);
   const all=data.categories.find(c=>c.key==='all'),main=data.homeBanner;applyHomeColors(main);
   window.OGHomeBanners?.mountHero(data,document.querySelector('.pink-hero'));
   const shortcutCategory={love:data.categories.find(c=>/ورود|بوكيه|çiçek/i.test(c.nameAr+' '+(c.nameTr||''))),gifts:data.categories.find(c=>c.key==='personalized')||data.categories.find(c=>c.key==='gifts'),drinkware:data.categories.find(c=>c.key==='assorted')||data.categories.find(c=>c.key==='drinkware')};
   document.querySelectorAll('.boutique-category,.boutique-desktop-links a').forEach(link=>{const url=new URL(link.href);const original=url.searchParams.get('category');if(!original)return;const category=shortcutCategory[original]||data.categories.find(c=>c.key===original);if(!category){link.hidden=true;return;}url.searchParams.set('category',category.key);link.href=url.pathname+url.search;const art=window.OGBoutique?.campaign(category),photo=link.querySelector('.category-photo');if(photo&&art){photo.hidden=!art.asset;if(art.asset)photo.style.backgroundImage='url('+JSON.stringify(art.asset)+')';}const title=link.querySelector('strong');if(title)title.textContent=language==='tr'?(category.nameTr||category.nameAr):category.nameAr;const description=link.querySelector('p');if(description&&art)description.textContent=art.description;});
   const nav=document.querySelector('.pink-categories');if(nav){const icons={drinkware:'fa-mug-hot',nfc:'fa-wifi',family:'fa-people-roof',kids:'fa-child-reaching',love:'fa-heart',all:'fa-gift'};nav.innerHTML=data.categories.map(c=>'<a href="/products/?'+(language==='tr'?'lang=tr&':'')+(c.key==='all'?'':'category='+encodeURIComponent(c.key))+'"><span class="pink-cat-icon cat-gift"><i class="fa-solid '+(icons[c.key]||'fa-gift')+'"></i></span><strong>'+esc(language==='tr'?(c.nameTr||c.nameAr):c.nameAr)+'</strong></a>').join('')}
   renderCategoryDrawer();
   const allCategories=$('homeAllCategories');if(allCategories&&window.OGBoutique){const chosen=window.OGHomeBanners?.picks(data)||[];allCategories.innerHTML=chosen.map(item=>OGBoutique.card(item.meta,item.href)).join('');allCategories.closest('section').hidden=!chosen.length;}
   // All selected campaign cards now share one capped homepage collection.
   const bannerGrid=document.querySelector('.pink-occasion-grid');if(bannerGrid){bannerGrid.replaceChildren();bannerGrid.closest('section').hidden=true;}
   window.OGHomeLayout?.apply(homeLayout,document,language);
   // Other category shortcuts use the same saved names and visibility.
   document.querySelectorAll('[data-occasion],.collection-card').forEach(link=>{
    const key=new URL(link.href).searchParams.get('category');if(!key)return;
    const category=data.categories.find(c=>c.key===key);
    if(!category){link.hidden=true;link.style.display='none';return}
    const label=link.querySelector('strong');if(label)label.textContent=language==='tr'?(category.nameTr||category.nameAr):category.nameAr;
   });
  }catch{const host=$('homeAllCategories');if(host)host.textContent=txt('تعذر تحميل الأقسام. أعد المحاولة لاحقاً.','Kategoriler yüklenemedi. Lütfen daha sonra tekrar dene.');}
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
 function revealSection(){const target=document.getElementById(location.hash.slice(1)||'main');const more=target?.closest('.boutique-more');if(more)more.open=true;}
 window.addEventListener('hashchange',revealSection);revealSection();
 const y=$('year');if(y)y.textContent=new Date().getFullYear();
 try{localStorage.setItem('og_lang',language)}catch{}
 syncBadges();loadProducts();loadCategories();
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)loadCategories()});
 window.addEventListener('pageshow',event=>{if(event.persisted)loadCategories()});
 window.addEventListener('storage',e=>{if(e.key===FAVORITES_KEY){try{favorites=new Set((JSON.parse(e.newValue||'[]')||[]).map(String))}catch{}syncBadges()}if(e.key===CART_KEY)syncBadges()});
})();



