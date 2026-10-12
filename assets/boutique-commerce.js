/* Boutique UI enhancement. Existing commerce handlers own prices, stock, files and submissions. */
(()=>{
 'use strict';
 let tr=document.documentElement.lang==='tr';
 const t=(ar,turkish)=>tr?turkish:ar;
 const query=new URLSearchParams(location.search);
 let shop='/products/?'+(tr?'lang=tr&':'');
 let home=tr?'/tr/':'/';
 const nav=document.createElement('nav');nav.className='boutique-bottom-nav';nav.setAttribute('aria-label',t('التنقل السريع','Hızlı gezinme'));
 const items=[[home,'house',t('الرئيسية','Ana sayfa')],[shop+'categories=1','table-cells-large',t('الأقسام','Kategoriler')],[shop+'favorites=1','heart',t('المفضلة','Favoriler')],[shop+'cart=1','cart-shopping',t('السلة','Sepet')],[shop+'account=1','user',t('حسابي','Hesabım')]];
 nav.innerHTML=items.map(([href,icon,label])=>'<a href="'+href+'"><i class="fa-'+(['heart','user'].includes(icon)?'regular':'solid')+' fa-'+icon+'"></i><span>'+label+'</span></a>').join('');document.body.append(nav);
 function syncLocale(){
  tr=document.documentElement.lang==='tr';shop='/products/?'+(tr?'lang=tr&':'');home=tr?'/tr/':'/';
  const labels=[t('الرئيسية','Ana sayfa'),t('الأقسام','Kategoriler'),t('المفضلة','Favoriler'),t('السلة','Sepet'),t('حسابي','Hesabım')];
  const hrefs=[home,shop+'categories=1',shop+'favorites=1',shop+'cart=1',shop+'account=1'];
  nav.querySelectorAll('a').forEach((a,i)=>{a.href=hrefs[i];a.querySelector('span').textContent=labels[i]});
  const stage=Number(document.getElementById('cartModal')?.dataset.checkoutStage||0);
  const next=document.getElementById('checkoutNext');if(next)next.textContent=stage===0?t('إتمام الطلب','Siparişi tamamla'):t('متابعة للدفع','Ödemeye devam et');
  const stages=[t('السلة','Sepet'),t('العنوان','Adres'),t('الدفع','Ödeme')];document.querySelectorAll('button[data-checkout-stage]').forEach((button,i)=>{if(button.tagName==='BUTTON')button.lastChild.textContent=stages[i]});
  const memberLabels=[t('تتبع طلباتي','Sipariş takibi'),t('المفضلة','Favorilerim'),t('المساعدة والدعم','Yardım ve destek')];document.querySelectorAll('.boutique-account-links a').forEach((a,i)=>{a.querySelector('span').textContent=memberLabels[i];if(i===0)a.href='/track/'+(tr?'?lang=tr':'');if(i===1)a.href=shop+'favorites=1'});
  const heading=document.querySelector('#boutiqueCategories h2');if(heading)heading.textContent=t('الأقسام','Kategoriler');
 }
 new MutationObserver(syncLocale).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});

 function syncNav(){
  const account=document.getElementById('accountModal')?.classList.contains('open');
  const cart=document.getElementById('cartModal')?.classList.contains('open');
  nav.querySelectorAll('a').forEach((a,i)=>a.classList.toggle('active',account?i===4:cart?i===3:query.get('favorites')==='1'?i===2:i===1));
 }
 ['cartModal','accountModal','orderSuccessModal'].forEach(id=>{const el=document.getElementById(id);if(el)new MutationObserver(syncNav).observe(el,{attributes:true,attributeFilter:['class']})});syncNav();
 const member=document.getElementById('accountMemberView');
 if(member){const links=document.createElement('nav');links.className='boutique-account-links';
 const rows=[['/track/'+(tr?'?lang=tr':''),'box',t('تتبع طلباتي','Sipariş takibi')],[shop+'favorites=1','heart',t('المفضلة','Favorilerim')],['https://wa.me/message/LR3NY7SMCEM3B1/','circle-info',t('المساعدة والدعم','Yardım ve destek')]];
 rows.forEach(([href,icon,label])=>{const a=document.createElement('a');a.href=href;const i=document.createElement('i');i.className='fa-solid fa-'+icon;const text=document.createElement('span');text.textContent=label;a.append(i,text);links.append(a)});member.querySelector('.member-profile-card')?.after(links);
 }
 // Catalogue navigation opens the existing sheets without resetting file uploads.
 if(document.getElementById('navCart')){
  nav.children[3].addEventListener('click',e=>{e.preventDefault();document.getElementById('navCart').click()});
  nav.children[4].addEventListener('click',e=>{e.preventDefault();document.getElementById('customerAccountBtn').click()});
 }
 const cart=document.getElementById('cartModal');
 if(cart){
  const body=cart.querySelector('.sheet-body');
  const address=document.createElement('section');address.className='boutique-address-step';
  const grid=body.querySelector('.checkout-grid'),heading=grid?.previousElementSibling;
  if(heading)address.append(heading);if(grid)address.append(grid);
  const payment=body.querySelector('.payment-box');if(payment)payment.classList.add('boutique-payment-step');
  body.insertBefore(address,body.querySelector('.checkout-submit'));
  const progress=document.createElement('div');progress.className='boutique-checkout-progress';
  progress.innerHTML=[t('السلة','Sepet'),t('العنوان','Adres'),t('الدفع','Ödeme')].map((label,i)=>'<button type="button" data-checkout-stage="'+i+'"><span>'+(i+1)+'</span>'+label+'</button>').join('');body.prepend(progress);
  const next=document.createElement('button');next.type='button';next.className='boutique-checkout-next';next.id='checkoutNext';
  body.insertBefore(next,body.querySelector('.checkout-submit'));
  let stage=0;
  const submit=body.querySelector('.checkout-submit');
  function setStage(value){stage=value;cart.dataset.checkoutStage=String(stage);next.hidden=stage===2;next.textContent=stage===0?t('إتمام الطلب','Siparişi tamamla'):t('متابعة للدفع','Ödemeye devam et');submit.hidden=stage!==2;next.disabled=!cart.querySelector('.cart-item');progress.querySelectorAll('button').forEach((button,i)=>{button.classList.toggle('active',i===stage);button.setAttribute('aria-current',i===stage?'step':'false')});body.closest('.sheet').scrollTop=0;}
  next.addEventListener('click',()=>{
   if(stage===0&&!cart.querySelector('.cart-item'))return;
   if(stage===1){const fields=['checkoutName','checkoutPhone','checkoutCity','checkoutDistrict','checkoutAddress'];const missing=fields.map(id=>document.getElementById(id)).find(el=>!el.value.trim());if(missing){missing.focus();const result=document.getElementById('checkoutResult');result.className='checkout-result show err';result.textContent=t('أكمل الاسم والهاتف والولاية والمنطقة والعنوان.','Ad soyad, telefon, il, ilçe ve adresi doldurun.');return;}}
   const result=document.getElementById('checkoutResult');result.className='checkout-result';result.textContent='';setStage(Math.min(2,stage+1));
  });
  progress.querySelectorAll('button').forEach((button,i)=>button.addEventListener('click',()=>{if(i<=stage)setStage(i)}));
  new MutationObserver(()=>{next.disabled=!cart.querySelector('.cart-item')}).observe(document.getElementById('cartItems'),{childList:true});
  new MutationObserver(()=>{if(cart.classList.contains('open'))setStage(0)}).observe(cart,{attributes:true,attributeFilter:['class']});setStage(0);
 }
 // Full category screen uses actual saved category names and real product images.
 if(document.getElementById('categories')){
  const categoryScreen=document.createElement('dialog');categoryScreen.id='boutiqueCategories';categoryScreen.className='boutique-categories-screen';
  const title=document.createElement('h2');title.textContent=t('الأقسام','Kategoriler');
  const close=document.createElement('button');close.type='button';close.className='close-btn';close.setAttribute('aria-label',t('إغلاق','Kapat'));close.textContent='×';close.onclick=()=>categoryScreen.close();
  const header=document.createElement('header');header.append(close,title);categoryScreen.append(header);const cards=document.createElement('div');cards.className='boutique-category-screen-grid';categoryScreen.append(cards);const categoryNav=nav.cloneNode(true);categoryScreen.append(categoryNav);document.body.append(categoryScreen);
  const open=()=>{if(!categoryScreen.open)categoryScreen.showModal()};
  nav.children[1].addEventListener('click',e=>{e.preventDefault();open()});
  window.addEventListener('og-catalog-ready',event=>{
   const {products,categories}=event.detail;cards.replaceChildren();
   categories.filter(c=>c.key!=='all').forEach(category=>{
    const a=document.createElement('a');a.href=shop+'category='+encodeURIComponent(category.key);a.className='boutique-category-screen-card';
    const p=products.find(p=>(Array.isArray(p.categories)?p.categories:[]).includes(category.key)&&p.hasImage);
    const imageUrl=tr?(p?.imageUrlTr??p?.imageUrl):(p?.imageUrlAr??p?.imageUrl);
    const img=document.createElement('img');img.src=imageUrl?new URL(imageUrl,'https://api.onlinegiftis.com').href:'/assets/boutique-hero-desktop.webp';img.alt='';img.loading='lazy';
    const copy=document.createElement('div');const label=document.createElement('strong');label.textContent=tr?(category.nameTr||category.nameAr):category.nameAr;
    const button=document.createElement('span');button.textContent=t('تسوّق الآن','Şimdi keşfet');copy.append(label,button);a.append(img,copy);cards.append(a);
   });
   if(query.get('categories')==='1')open();
  });
 }
 // Keyboard focus stays in whichever existing modal is open, and returns to the opener.
 let opener=null;
 const modalObserver=new MutationObserver(()=>{
  const modal=[...document.querySelectorAll('.modal-backdrop.open')].at(-1);
  if(modal){if(!modal.contains(document.activeElement)){opener=document.activeElement;modal.querySelector('button,input,a,[tabindex]')?.focus();}}
  else if(opener?.isConnected){opener.focus();opener=null;}
 });
 document.querySelectorAll('.modal-backdrop').forEach(modal=>modalObserver.observe(modal,{attributes:true,attributeFilter:['class']}));
 document.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const modal=[...document.querySelectorAll('.modal-backdrop.open')].at(-1);if(!modal)return;const focusable=[...modal.querySelectorAll('button,a[href],input,select,textarea,[tabindex="0"]')].filter(el=>!el.disabled&&el.getClientRects().length);const first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}});
})();
