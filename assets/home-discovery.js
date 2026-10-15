/* Homepage discovery: real product offers + gently moving catalogue art. */
(()=>{
 'use strict';
 const tr=document.documentElement.lang==='tr';
 const t=(ar,trText)=>tr?trText:ar;
 const api='https://api.onlinegiftis.com';
 const shop='/products/?'+(tr?'lang=tr&':'');
 const money=value=>new Intl.NumberFormat('tr-TR',{maximumFractionDigits:2}).format(Number(value))+' ₺';
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 const itemName=p=>tr?(p.storefront?.shortNameTr||p.storefront?.nameTr||p.name):(p.storefront?.shortNameAr||p.storefront?.nameAr||p.name);
 const categories=p=>{const raw=p.categories??p.category??[];return (Array.isArray(raw)?raw:typeof raw==='string'?raw.split(','):[]).map(v=>String(v).trim())};
 const eligible=p=>p&&p.orderable!==false&&p.hasImage&&Number(p.price)>0;
 function offer(p){
  const now=Number(p?.price),before=Number(p?.storefront?.compareAtPrice);
  return eligible(p)&&Number.isFinite(before)&&before>now&&now>0?{before,now,pct:Math.round((before-now)*100/before)}:null;
 }
 const url=p=>'/products/'+encodeURIComponent(String(p.id))+'/'+(tr?'?lang=tr':'');
 function picture(p){if(!p.hasImage)return '';const src=tr?(p.imageUrlTr!==undefined?p.imageUrlTr:p.imageUrl):(p.imageUrlAr!==undefined?p.imageUrlAr:p.imageUrl);if(!src)return '';try{const dest=new URL(src,api);if(dest.protocol!=='https:')return '';return dest.href}catch{return ''}}
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
 let categoriesStop=()=>{};
 function mountCategories(data){
  const section=document.getElementById('ogMovingCategories'),rail=document.getElementById('ogMovingCategoriesRail');
  if(!section||!rail||!window.OGBoutique)return;
  categoriesStop();categoriesStop=()=>{};
  const choices=(data.categories||[]).filter(c=>c.key!=='all'&&c.isActive!==false)
   .slice().sort((a,b)=>(a.sortOrder??0)-(b.sortOrder??0)).map(c=>{
    const art=window.OGBoutique.campaign(c);
    const lang=tr?'Tr':'Ar';
    const source=Object.prototype.hasOwnProperty.call(c,'effectiveBannerUrl'+lang)?c['effectiveBannerUrl'+lang]:undefined;
    if(source===null||source==='')return null;
    if(!art.asset)return null;
    const href=shop+'category='+encodeURIComponent(c.key);
    const name=tr?(c.nameTr||c.nameAr):(c.nameAr||c.nameTr);
    return {href,src:art.asset,name};
   }).filter(Boolean);
  rail.replaceChildren();
  choices.forEach((c,i)=>{
   const link=document.createElement('a');link.className='og-moving-card';link.href=c.href;
   link.setAttribute('aria-label',c.name);
   const img=document.createElement('img');img.src=c.src;img.alt=c.name;img.loading=i<5?'eager':'lazy';img.decoding='async';
   const label=document.createElement('span');label.textContent=c.name;link.append(img,label);rail.append(link);
  });
  section.hidden=choices.length===0;
  if(choices.length<2)return;
  let current=0,paused=false,onscreen=false,timer=0;
  const show=(i,smooth=true)=>{
   current=(i+choices.length)%choices.length;
   const target=rail.children[current];if(!target)return;
   const left=target.offsetLeft-rail.children[0].offsetLeft;
   const leftValue=tr?left:-left;
   rail.scrollTo({left:leftValue,behavior:smooth&&!reduced?.matches?'smooth':'instant'});
  };
  function stop(){clearTimeout(timer);timer=0}
  function schedule(){stop();if(!paused&&onscreen&&!document.hidden&&!reduced?.matches)timer=setTimeout(()=>{show(current+1);schedule()},4800)}
  const markPause=()=>{paused=true;stop()};
  const resume=()=>{paused=false;schedule()};
  const prev=section.querySelector('[data-og-category-prev]'),next=section.querySelector('[data-og-category-next]');
  const prevClick=()=>{markPause();show(current-1);setTimeout(resume,7500)};
  const nextClick=()=>{markPause();show(current+1);setTimeout(resume,7500)};
  prev?.addEventListener('click',prevClick);next?.addEventListener('click',nextClick);
  const observer=new IntersectionObserver(entries=>{onscreen=entries.some(e=>e.isIntersecting);schedule()},{threshold:.1});
  observer.observe(section);
  rail.addEventListener('pointerdown',markPause,{passive:true});
  rail.addEventListener('pointerup',resume,{passive:true});
  rail.addEventListener('mouseenter',markPause);
  rail.addEventListener('mouseleave',resume);
  rail.addEventListener('focusin',markPause);
  rail.addEventListener('focusout',resume);
  document.addEventListener('visibilitychange',schedule);
  reduced?.addEventListener?.('change',schedule);
  const onScroll=()=>{
   // Keep automatic movement aligned with the user's manual scroll.
   const pos=Math.abs(rail.scrollLeft);
   let nearest=0,distance=Infinity;
   [...rail.children].forEach((el,i)=>{const d=Math.abs(Math.abs(el.offsetLeft-rail.children[0].offsetLeft)-pos);if(d<distance){distance=d;nearest=i}});
   current=nearest;
  };
  rail.addEventListener('scroll',onScroll,{passive:true});
  categoriesStop=()=>{stop();observer.disconnect();prev?.removeEventListener('click',prevClick);next?.removeEventListener('click',nextClick);document.removeEventListener('visibilitychange',schedule);reduced?.removeEventListener?.('change',schedule);rail.removeEventListener('scroll',onScroll)};
 }
 function card(p,withOld=false){
  const discount=withOld?offer(p):null,img=picture(p);
  return '<a class="og-discovery-product" href="'+url(p)+'">'+
   (img?'<img src="'+esc(img)+'" alt="'+esc(itemName(p))+'" loading="lazy" decoding="async">':'')+
   (discount?'<span class="og-discount-label">'+t('خصم','İndirim')+' '+discount.pct+'%</span>':'')+
   '<strong>'+esc(itemName(p))+'</strong><span class="og-discovery-price">'+
   (discount?'<del>'+money(discount.before)+'</del>':'')+
   '<b>'+money(p.price)+'</b></span></a>';
 }
 function mountProducts(products){
  const men=document.getElementById('ogGiftsForHim'),menGrid=document.getElementById('ogGiftsForHimProducts'),deals=document.getElementById('ogRealDiscounts'),dealGrid=document.getElementById('ogRealDiscountProducts');
  const records=(products||[]).filter(eligible);
  if(men&&menGrid){
   const male=records.filter(p=>categories(p).includes('men')||/(رجالي|للرجال|لرجل|erkek|babaya|boyfriend)/i.test([itemName(p),p.storefront?.nameAr,p.storefront?.nameTr].filter(Boolean).join(' ')));
   menGrid.innerHTML=male.slice(0,4).map(p=>card(p)).join('');
   const hero=men.querySelector('[data-og-him-image]');
   const first=male.find(p=>picture(p));if(hero&&first){hero.src=picture(first);hero.alt=itemName(first);}
   else if(hero){hero.src='/assets/boutique-gifts.webp';hero.alt=t('صناديق هدايا متنوعة','Hediye kutuları');}
   const button=men.querySelector('[data-og-him-all]');if(button)button.href=shop+(male.some(p=>categories(p).includes('men'))?'category=men':'q='+encodeURIComponent(tr?'erkek':'رجالي'));
   // The curated banner remains available; product cards only appear for qualifying records.
   men.hidden=false;
  }
  if(deals&&dealGrid){
   const sale=records.filter(p=>Boolean(offer(p))).sort((a,b)=>(offer(b).pct-offer(a).pct)||Number(a.id)-Number(b.id));
   dealGrid.innerHTML=sale.slice(0,8).map(p=>card(p,true)).join('');
   deals.hidden=!sale.length;
  }
 }
 window.OGHomeDiscovery={mountCategories,mountProducts,offer};
})();
