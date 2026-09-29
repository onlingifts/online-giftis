(()=>{
  const API='https://bayi.onlinegiftis.com';
  const WA='https://wa.me/message/LR3NY7SMCEM3B1/';
  const STORAGE_KEY='onlinegifts_cart_v2';
  const $=(id)=>document.getElementById(id);
  const $$=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
  const state={products:[],cart:[],category:'all',query:'',sort:'featured',lang:'ar',activeProduct:null,pendingProduct:null};

  const translations={
    ar:{
      dir:'rtl',title:'أونلاين للهدايا | هدايا مخصصة في تركيا',
      loading:'جاري تحميل المنتجات...',empty:'ما لقينا منتجات مطابقة لهالبحث.',productsCount:(n)=>`${n} منتج`,
      add:'أضف للسلة',details:'التفاصيل',contact:'اطلب عبر واتساب',out:'نفد المخزون',special:'طلب خاص',prepaid:'دفع مسبق',askPrice:'السعر عند الطلب',featured:'الأكثر طلباً',lowStock:'كمية محدودة',stock:(n)=>`المتوفر ${n}`,
      cartEmpty:'السلة فارغة حالياً',total:'الإجمالي',customTitle:'اكتب النص المطلوب',customHint:'هذا المنتج يدعم تخصيص النص. اكتب الاسم أو العبارة كما تريدها أن تظهر على المنتج.',customPlaceholder:'مثال: عمر',cancel:'إلغاء',confirm:'إضافة للسلة',added:'تمت إضافة المنتج للسلة',removed:'تم حذف المنتج من السلة',
      checkout:'إكمال الطلب',checkoutTitle:'بيانات الشحن وتثبيت الطلب',orderSuccess:(n)=>`تم تثبيت طلبك بنجاح. رقم الطلب: ${n}`,orderError:'تعذر تثبيت الطلب، حاول مرة ثانية.',loadError:'تعذر تحميل المنتجات حالياً. حاول تحديث الصفحة.',required:'تأكد من تعبئة الاسم، الهاتف، الولاية والعنوان.',
      noImage:'لا توجد صورة',all:'الكل',featuredFilter:'الأكثر طلباً',searchPlaceholder:'ابحث باسم المنتج...',shareDone:'تم نسخ رابط الموقع',
      categories:{keychains:'ميداليات المفتاح', '3d_printing':'طباعة 3D', gifts:'هدايا مخصصة', laser:'ليزر وحفر', shirts:'تيشيرتات وملابس', drinkware:'أكواب ومشروبات', perfumes_accessories:'عطور وإكسسوارات', misc:'منتجات متنوعة'},
      sortFeatured:'الأبرز أولاً',sortLow:'السعر: الأقل أولاً',sortHigh:'السعر: الأعلى أولاً',sortName:'الاسم'
    },
    tr:{
      dir:'ltr',title:'Online Gifts | Türkiye’de Kişiye Özel Hediyeler',
      loading:'Ürünler yükleniyor...',empty:'Aramanızla eşleşen ürün bulunamadı.',productsCount:(n)=>`${n} ürün`,
      add:'Sepete ekle',details:'Detaylar',contact:'WhatsApp ile sipariş',out:'Stokta yok',special:'Özel sipariş',prepaid:'Ön ödemeli',askPrice:'Fiyat için iletişime geçin',featured:'Çok satan',lowStock:'Sınırlı stok',stock:(n)=>`Stok ${n}`,
      cartEmpty:'Sepetiniz şu anda boş',total:'Toplam',customTitle:'İstenen metni yazın',customHint:'Bu ürün metin kişiselleştirmesini destekliyor. Üründe görünmesini istediğiniz isim veya ifadeyi yazın.',customPlaceholder:'Örnek: Omar',cancel:'İptal',confirm:'Sepete ekle',added:'Ürün sepete eklendi',removed:'Ürün sepetten kaldırıldı',
      checkout:'Siparişi tamamla',checkoutTitle:'Teslimat bilgileri ve sipariş',orderSuccess:(n)=>`Siparişiniz başarıyla oluşturuldu. Sipariş no: ${n}`,orderError:'Sipariş oluşturulamadı, tekrar deneyin.',loadError:'Ürünler şu anda yüklenemedi. Sayfayı yenilemeyi deneyin.',required:'Ad, telefon, il ve adres alanlarını kontrol edin.',
      noImage:'Görsel yok',all:'Tümü',featuredFilter:'Çok satan',searchPlaceholder:'Ürün ara...',shareDone:'Site bağlantısı kopyalandı',
      categories:{keychains:'Anahtarlıklar','3d_printing':'3D Baskı',gifts:'Kişiye Özel',laser:'Lazer & Kazıma',shirts:'Giyim',drinkware:'Kupa & Bardak',perfumes_accessories:'Parfüm & Aksesuar',misc:'Diğer'},
      sortFeatured:'Öne çıkanlar',sortLow:'Fiyat: düşükten yükseğe',sortHigh:'Fiyat: yüksekten düşüğe',sortName:'İsme göre'
    }
  };

  const tr=()=>translations[state.lang];
  const money=(value)=>value===null||value===undefined?'—':new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:2}).format(Number(value||0));
  const esc=(value)=>String(value??'').replace(/[&<>"']/g,(m)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const productImage=(p)=>p?.hasImage&&p.imageUrl?API+p.imageUrl:'';
  const categoryLabel=(id)=>tr().categories[id]||tr().categories.misc;

  function showToast(message){const el=$('toast');el.textContent=message;el.classList.add('show');clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>el.classList.remove('show'),1800)}
  function setBodyModal(open){document.body.classList.toggle('modal-open',Boolean(open))}
  function saveCart(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state.cart))}catch{}}
  function loadCart(){try{const raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');if(Array.isArray(raw))state.cart=raw.filter(x=>Number.isInteger(x.productId)&&x.quantity>0)}catch{state.cart=[]}}
  function syncCart(){
    const map=new Map(state.products.map(p=>[p.id,p]));
    state.cart=state.cart.filter(item=>{const p=map.get(item.productId);if(!p||!p.orderable||p.stockQuantity<=0)return false;item.name=p.name;item.price=p.price;item.stock=p.stockQuantity;item.image=productImage(p);item.quantity=Math.min(Math.max(1,item.quantity),p.stockQuantity);return true});
    saveCart();renderCart();
  }

  function applyStaticLanguage(){
    document.documentElement.lang=state.lang;document.documentElement.dir=tr().dir;document.title=tr().title;
    $$('.lang-btn').forEach(btn=>btn.classList.toggle('active',btn.dataset.lang===state.lang));
    $$('[data-ar][data-tr]').forEach(el=>{const value=el.dataset[state.lang];if(value!==undefined)el.textContent=value});
    const search=$('searchInput');if(search)search.placeholder=tr().searchPlaceholder;const cancel=$('customizeCancel');if(cancel)cancel.textContent=tr().cancel;const confirm=$('customizeConfirm');if(confirm)confirm.textContent=tr().confirm;
    const sort=$('sortSelect');if(sort){sort.options[0].textContent=tr().sortFeatured;sort.options[1].textContent=tr().sortLow;sort.options[2].textContent=tr().sortHigh;sort.options[3].textContent=tr().sortName;}
    renderCategories();renderProducts();renderCart();renderProductModal();
  }

  function setLang(lang){state.lang=lang==='tr'?'tr':'ar';try{localStorage.setItem('onlinegifts_lang',state.lang)}catch{}applyStaticLanguage()}

  function orderabilityLabel(p){
    if(p.orderable)return tr().add;
    if(p.orderableReason==='out_of_stock')return tr().out;
    if(p.orderableReason==='prepaid_only')return tr().prepaid;
    if(p.orderableReason==='custom_order')return tr().special;
    return tr().askPrice;
  }
  function whatsappHref(p){const msg=state.lang==='tr'?`Merhaba, ${p.name} ürünü hakkında sipariş vermek istiyorum.`:`مرحبا، أريد طلب المنتج: ${p.name}`;return WA+'?text='+encodeURIComponent(msg)}

  function allCategoryIds(){const seen=new Set();state.products.forEach(p=>(p.categories||[p.category]).forEach(c=>seen.add(c)));return Array.from(seen)}
  function renderCategories(){
    const root=$('categoryFilters');if(!root)return;
    const ids=allCategoryIds();
    const countBy=(id)=>state.products.filter(p=>(p.categories||[p.category]).includes(id)).length;
    const chips=[{id:'all',label:tr().all,count:state.products.length,icon:'fa-border-all'},{id:'featured',label:tr().featuredFilter,count:state.products.filter(p=>p.isFeatured).length,icon:'fa-fire'}]
      .concat(ids.map(id=>({id,label:categoryLabel(id),count:countBy(id),icon:categoryIcon(id)})));
    root.innerHTML=chips.filter(c=>c.id==='all'||c.count>0).map(c=>`<button class="category-chip ${state.category===c.id?'active':''}" type="button" data-category="${esc(c.id)}"><i class="fa-solid ${c.icon}"></i>${esc(c.label)}<span class="count">${c.count}</span></button>`).join('');
    $$('[data-category]',root).forEach(btn=>btn.addEventListener('click',()=>{state.category=btn.dataset.category;renderCategories();renderProducts()}));
  }
  function categoryIcon(id){return ({keychains:'fa-key','3d_printing':'fa-cube',gifts:'fa-gift',laser:'fa-bolt',shirts:'fa-shirt',drinkware:'fa-mug-hot',perfumes_accessories:'fa-spray-can-sparkles',misc:'fa-box-open'})[id]||'fa-gift'}

  function filteredProducts(){
    let list=state.products.slice();
    if(state.category==='featured')list=list.filter(p=>p.isFeatured);
    else if(state.category!=='all')list=list.filter(p=>(p.categories||[p.category]).includes(state.category));
    const q=state.query.trim().toLocaleLowerCase(state.lang==='tr'?'tr-TR':'ar');
    if(q)list=list.filter(p=>`${p.name} ${p.description||''} ${(p.categories||[]).map(categoryLabel).join(' ')}`.toLocaleLowerCase(state.lang==='tr'?'tr-TR':'ar').includes(q));
    if(state.sort==='low')list.sort((a,b)=>(a.price??Infinity)-(b.price??Infinity));
    else if(state.sort==='high')list.sort((a,b)=>(b.price??-Infinity)-(a.price??-Infinity));
    else if(state.sort==='name')list.sort((a,b)=>a.name.localeCompare(b.name,state.lang==='tr'?'tr':'ar'));
    else list.sort((a,b)=>Number(b.isFeatured)-Number(a.isFeatured)||a.name.localeCompare(b.name,state.lang==='tr'?'tr':'ar'));
    return list;
  }

  function renderProducts(){
    const grid=$('productGrid');if(!grid)return;
    if(!state.products.length){grid.innerHTML=skeletonCards(8);$('catalogMeta').textContent=tr().loading;return}
    const list=filteredProducts();$('catalogMeta').textContent=tr().productsCount(list.length);
    if(!list.length){grid.innerHTML=`<div class="empty-state"><i class="fa-solid fa-magnifying-glass"></i>${esc(tr().empty)}</div>`;return}
    grid.innerHTML=list.map(p=>productCard(p)).join('');
    $$('[data-add]',grid).forEach(btn=>btn.addEventListener('click',()=>startAdd(Number(btn.dataset.add))));
    $$('[data-detail]',grid).forEach(btn=>btn.addEventListener('click',()=>openProduct(Number(btn.dataset.detail))));
    $$('.product-media',grid).forEach(el=>el.addEventListener('click',()=>openProduct(Number(el.dataset.product))));
  }
  function skeletonCards(n){return Array.from({length:n},()=>`<article class="product-card"><div class="product-media skeleton"></div><div class="product-body"><div class="product-name skeleton" style="height:20px"></div><div class="product-desc skeleton" style="height:30px;margin-top:8px"></div><div class="product-price skeleton" style="height:23px;width:55%;margin-top:12px"></div></div></article>`).join('')}
  function productCard(p){
    const image=productImage(p);const cats=(p.categories||[p.category]).map(categoryLabel).join(' · ');
    const badges=[];if(p.isFeatured)badges.push(`<span class="badge hot">${esc(tr().featured)}</span>`);if(!p.orderable&&p.orderableReason==='custom_order')badges.push(`<span class="badge special">${esc(tr().special)}</span>`);if(p.stockQuantity>0&&p.stockQuantity<=5)badges.push(`<span class="badge stock">${esc(tr().lowStock)}</span>`);
    const action=p.orderable?`<button class="btn btn-dark" type="button" data-add="${p.id}"><i class="fa-solid fa-bag-shopping"></i>${esc(tr().add)}</button>`:`<a class="btn btn-whatsapp" href="${whatsappHref(p)}" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i>${esc(orderabilityLabel(p))}</a>`;
    return `<article class="product-card">
      <div class="product-media" data-product="${p.id}">${image?`<img src="${image}" alt="${esc(p.name)}" loading="lazy">`:`<div class="product-placeholder"><div><i class="fa-solid fa-gift"></i>${esc(tr().noImage)}</div></div>`}<div class="badges">${badges.join('')}</div></div>
      <div class="product-body"><div class="product-category">${esc(cats)}</div><div class="product-name">${esc(p.name)}</div><div class="product-desc">${esc(p.description||'')}</div><div class="product-price-row"><div class="product-price">${p.price!==null?money(p.price):esc(tr().askPrice)}</div><div class="stock-text">${p.stockQuantity>0?esc(tr().stock(p.stockQuantity)):esc(tr().out)}</div></div><div class="product-actions">${action}<button class="detail-btn" type="button" data-detail="${p.id}" aria-label="${esc(tr().details)}"><i class="fa-solid fa-arrow-up-right-from-square"></i></button></div></div>
    </article>`;
  }

  function startAdd(id){const p=state.products.find(x=>x.id===id);if(!p||!p.orderable)return;if(p.customizationType==='text'){state.pendingProduct=p;$('customizeTitle').textContent=tr().customTitle;$('customizeHint').textContent=tr().customHint;$('customizeInput').placeholder=tr().customPlaceholder;$('customizeInput').value='';openModal('customizeModal');setTimeout(()=>$('customizeInput').focus(),120);return}addProduct(p,'')}
  function addProduct(p,customizationText){
    const existing=state.cart.find(x=>x.productId===p.id&&String(x.customizationText||'')===String(customizationText||''));
    if(existing)existing.quantity=Math.min(existing.quantity+1,p.stockQuantity);else state.cart.push({productId:p.id,name:p.name,price:p.price,quantity:1,stock:p.stockQuantity,image:productImage(p),customizationText:customizationText||''});
    saveCart();renderCart();showToast(tr().added);closeModal('customizeModal');openCart();
  }

  function renderCart(){
    const count=state.cart.reduce((sum,x)=>sum+x.quantity,0);$$('.cart-dot').forEach(el=>el.textContent=count);const list=$('cartList');if(!list)return;
    if(!count){list.innerHTML=`<div class="empty-state"><i class="fa-solid fa-bag-shopping"></i>${esc(tr().cartEmpty)}</div>`;$('cartTotal').textContent=money(0);$('checkoutBtn').disabled=true;return}
    $('checkoutBtn').disabled=false;
    list.innerHTML=state.cart.map((x,i)=>`<div class="cart-item"><div class="cart-thumb">${x.image?`<img src="${x.image}" alt="${esc(x.name)}">`:'<div class="product-placeholder" style="font-size:8px"><i class="fa-solid fa-gift"></i></div>'}</div><div><b>${esc(x.name)}</b><small>${money(x.price)}${x.customizationText?` · ${esc(x.customizationText)}`:''}</small><div class="cart-item-row"><div class="qty"><button type="button" data-minus="${i}"><i class="fa-solid fa-minus"></i></button><strong>${x.quantity}</strong><button type="button" data-plus="${i}"><i class="fa-solid fa-plus"></i></button></div><button class="remove-btn" type="button" data-remove="${i}"><i class="fa-solid fa-trash"></i></button></div></div></div>`).join('');
    $('cartTotal').textContent=money(cartTotal());
    $$('[data-minus]',list).forEach(b=>b.addEventListener('click',()=>changeQty(Number(b.dataset.minus),-1)));$$('[data-plus]',list).forEach(b=>b.addEventListener('click',()=>changeQty(Number(b.dataset.plus),1)));$$('[data-remove]',list).forEach(b=>b.addEventListener('click',()=>removeCart(Number(b.dataset.remove))));
  }
  function cartTotal(){return state.cart.reduce((sum,x)=>sum+Number(x.price||0)*x.quantity,0)}
  function changeQty(index,delta){const item=state.cart[index];if(!item)return;item.quantity=Math.max(1,Math.min(item.stock||999,item.quantity+delta));saveCart();renderCart()}
  function removeCart(index){state.cart.splice(index,1);saveCart();renderCart();showToast(tr().removed)}
  function openCart(){renderCart();$('drawerBackdrop').classList.add('open');$('cartDrawer').classList.add('open');$('cartDrawer').setAttribute('aria-hidden','false');setBodyModal(true)}
  function closeCart(){$('drawerBackdrop').classList.remove('open');$('cartDrawer').classList.remove('open');$('cartDrawer').setAttribute('aria-hidden','true');setBodyModal(false)}

  function openProduct(id){state.activeProduct=state.products.find(x=>x.id===id)||null;renderProductModal();if(state.activeProduct)openModal('productModal')}
  function renderProductModal(){const p=state.activeProduct;if(!p||!$('productModalCard'))return;const image=productImage(p);const cats=(p.categories||[p.category]).map(categoryLabel).join(' · ');const action=p.orderable?`<button class="btn btn-dark" type="button" id="modalAdd"><i class="fa-solid fa-bag-shopping"></i>${esc(tr().add)}</button>`:`<a class="btn btn-whatsapp" href="${whatsappHref(p)}" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i>${esc(orderabilityLabel(p))}</a>`;$('productModalCard').innerHTML=`<div class="product-modal-grid"><div class="product-modal-media">${image?`<img src="${image}" alt="${esc(p.name)}">`:`<div class="product-placeholder"><div><i class="fa-solid fa-gift"></i>${esc(tr().noImage)}</div></div>`}</div><div class="product-modal-content"><button class="close-btn" type="button" data-close-modal="productModal"><i class="fa-solid fa-xmark"></i></button><div class="product-category">${esc(cats)}</div><h3>${esc(p.name)}</h3><p>${esc(p.description||'')}</p><div class="product-modal-price">${p.price!==null?money(p.price):esc(tr().askPrice)}</div><div class="product-modal-meta"><span class="meta-pill">${esc(p.stockQuantity>0?tr().stock(p.stockQuantity):tr().out)}</span>${p.isFeatured?`<span class="meta-pill">${esc(tr().featured)}</span>`:''}</div><div class="product-modal-actions">${action}</div></div></div>`;const add=$('modalAdd');if(add)add.addEventListener('click',()=>{closeModal('productModal');startAdd(p.id)});bindModalClosers($('productModalCard'))}

  function openModal(id){const el=$(id);if(!el)return;el.classList.add('open');el.setAttribute('aria-hidden','false');setBodyModal(true)}
  function closeModal(id){const el=$(id);if(!el)return;el.classList.remove('open');el.setAttribute('aria-hidden','true');if(!$('.modal-backdrop.open')&&!$('cartDrawer').classList.contains('open'))setBodyModal(false)}
  function bindModalClosers(root=document){$$('[data-close-modal]',root).forEach(btn=>{if(btn.dataset.bound)return;btn.dataset.bound='1';btn.addEventListener('click',()=>closeModal(btn.dataset.closeModal))})}

  function openCheckout(){if(!state.cart.length)return;closeCart();$('checkoutTotal').textContent=money(cartTotal());$('checkoutResult').className='result-box';$('checkoutResult').textContent='';openModal('checkoutModal')}
  async function checkout(){
    const customerName=$('checkoutName').value.trim(),customerPhone=$('checkoutPhone').value.trim(),city=$('checkoutCity').value.trim(),district=$('checkoutDistrict').value.trim(),address=$('checkoutAddress').value.trim(),notes=$('checkoutNotes').value.trim();
    const result=$('checkoutResult');result.className='result-box';result.textContent='';
    if(customerName.length<2||customerPhone.replace(/\D/g,'').length<7||!city||address.length<5){result.className='result-box show err';result.textContent=tr().required;return}
    const btn=$('checkoutSubmit');btn.disabled=true;
    try{
      const payload={items:state.cart.map(x=>({productId:x.productId,quantity:x.quantity,customizationText:x.customizationText||''})),customerName,customerPhone,city,district,address,notes};
      const response=await fetch(API+'/api/store/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||tr().orderError);
      result.className='result-box show ok';result.textContent=tr().orderSuccess(data.order.orderNumber);state.cart=[];saveCart();renderCart();await loadProducts();if(typeof gtag==='function')gtag('event','purchase',{transaction_id:data.order.orderNumber,value:data.order.saleTotal,currency:'TRY'});
    }catch(error){result.className='result-box show err';result.textContent=error?.message||tr().orderError}
    finally{btn.disabled=false}
  }

  async function loadProducts(){
    $('catalogMeta').textContent=tr().loading;$('productGrid').innerHTML=skeletonCards(8);
    try{const response=await fetch(API+'/api/store/products',{cache:'no-store'});const data=await response.json();if(!response.ok||!Array.isArray(data.products))throw new Error('products');state.products=data.products;syncCart();renderCategories();renderProducts();}
    catch{$('catalogMeta').textContent='';$('productGrid').innerHTML=`<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i>${esc(tr().loadError)}</div>`}
  }

  function scrollProducts(){document.getElementById('products')?.scrollIntoView({behavior:'smooth',block:'start'})}
  async function shareSite(){try{if(navigator.share)await navigator.share({title:document.title,url:location.href});else{await navigator.clipboard.writeText(location.href);showToast(tr().shareDone)}}catch(e){if(e?.name!=='AbortError'){try{await navigator.clipboard.writeText(location.href);showToast(tr().shareDone)}catch{}}}}

  function init(){
    loadCart();try{state.lang=localStorage.getItem('onlinegifts_lang')==='tr'?'tr':'ar'}catch{}
    $('year').textContent=new Date().getFullYear();
    $$('.lang-btn').forEach(btn=>btn.addEventListener('click',()=>setLang(btn.dataset.lang)));
    $$('.open-cart').forEach(btn=>btn.addEventListener('click',openCart));$('cartClose').addEventListener('click',closeCart);$('drawerBackdrop').addEventListener('click',closeCart);
    $('checkoutBtn').addEventListener('click',openCheckout);$('checkoutSubmit').addEventListener('click',checkout);
    $('customizeCancel').addEventListener('click',()=>closeModal('customizeModal'));$('customizeConfirm').addEventListener('click',()=>{const value=$('customizeInput').value.trim();if(!value){$('customizeInput').focus();return}if(state.pendingProduct)addProduct(state.pendingProduct,value)});
    $('customizeInput').addEventListener('keydown',e=>{if(e.key==='Enter')$('customizeConfirm').click()});
    $('searchInput').addEventListener('input',e=>{state.query=e.target.value;renderProducts()});$('sortSelect').addEventListener('change',e=>{state.sort=e.target.value;renderProducts()});
    $$('[data-scroll-products]').forEach(el=>el.addEventListener('click',scrollProducts));$$('[data-share]').forEach(el=>el.addEventListener('click',shareSite));
    $$('.modal-backdrop').forEach(el=>el.addEventListener('click',e=>{if(e.target===el)closeModal(el.id)}));bindModalClosers();
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeCart();$$('.modal-backdrop.open').forEach(m=>closeModal(m.id))}});
    applyStaticLanguage();renderCart();loadProducts();
  }
  document.addEventListener('DOMContentLoaded',init);
})();
