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
 function mountCategories(data,products=[]){
  const section=document.getElementById('ogMovingCategories'),rail=document.getElementById('ogMovingCategoriesRail');
  if(!section||!rail)return;
  categoriesStop();categoriesStop=()=>{};
  // One distinct, relevant product photograph per vertical category banner.
  // Horizontal admin category banners remain in their original category section.
  const available=(Array.isArray(products)?products:[]).filter(p=>p?.hasImage&&p.orderable!==false&&picture(p));
  const usedPhotos=new Set(),usedProducts=new Set();
  const choices=(data.categories||[]).filter(c=>c.key!=='all'&&c.isActive!==false)
   .slice().sort((a,b)=>(a.sortOrder??0)-(b.sortOrder??0))
   .map(c=>{
    const matches=available.filter(p=>categories(p).includes(c.key))
      .sort((a,b)=>categories(a).length-categories(b).length||Number(a.id)-Number(b.id));
    const picked=matches.find(p=>!usedProducts.has(String(p.id))&&!usedPhotos.has(picture(p)));
    if(!picked)return null;
    usedProducts.add(String(picked.id));usedPhotos.add(picture(picked));
    const name=tr?(c.nameTr||c.nameAr):(c.nameAr||c.nameTr);
    return {href:shop+'category='+encodeURIComponent(c.key),name,product:picked};
   }).filter(Boolean);
  rail.replaceChildren();
  choices.forEach((c,i)=>{
   const link=document.createElement('a');link.className='og-moving-card og-portrait-banner';link.href=c.href;
   link.setAttribute('aria-label',c.name);
   link.dataset.artIndex=String(i%5);
   const media=document.createElement('span');media.className='og-portrait-art';
   const img=document.createElement('img');img.className='og-portrait-main-photo';
   img.src=picture(c.product);img.alt=c.name;img.loading=i<4?'eager':'lazy';img.decoding='async';
   media.append(img);
   const label=document.createElement('span');label.className='og-portrait-title';label.textContent=c.name;
   link.append(media,label);rail.append(link);
  });
  section.hidden=choices.length===0;
  if(choices.length<2)return;
  let current=0,paused=false,onscreen=false,timer=0,resumeTimer=0;
  const show=(i,smooth=true)=>{
   current=(i+choices.length)%choices.length;
   const target=rail.children[current];if(!target)return;
   const left=target.offsetLeft-rail.children[0].offsetLeft;
   const leftValue=left; // offsetLeft differences already match LTR or RTL scroll direction.
   rail.scrollTo({left:leftValue,behavior:smooth&&!reduced?.matches?'smooth':'auto'});
  };
  function stop(){clearTimeout(timer);timer=0}
  function schedule(){stop();if(!paused&&onscreen&&!document.hidden&&!reduced?.matches)timer=setTimeout(()=>{show(current+1,current+1<choices.length);schedule()},4800)}
  const markPause=()=>{paused=true;stop()};
  const resume=()=>{clearTimeout(resumeTimer);paused=false;schedule()};
  const resumeLater=()=>{clearTimeout(resumeTimer);resumeTimer=setTimeout(resume,7500)};
  const prev=section.querySelector('[data-og-category-prev]'),next=section.querySelector('[data-og-category-next]');
  const prevClick=()=>{markPause();show(current-1);resumeLater()};
  const nextClick=()=>{markPause();show(current+1);resumeLater()};
  prev?.addEventListener('click',prevClick);next?.addEventListener('click',nextClick);
  const observer=new IntersectionObserver(entries=>{onscreen=entries.some(e=>e.isIntersecting);schedule()},{threshold:.1});
  observer.observe(section);
  rail.addEventListener('pointerdown',markPause,{passive:true});
  rail.addEventListener('pointerup',resumeLater,{passive:true});
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
  categoriesStop=()=>{stop();clearTimeout(resumeTimer);observer.disconnect();prev?.removeEventListener('click',prevClick);next?.removeEventListener('click',nextClick);document.removeEventListener('visibilitychange',schedule);reduced?.removeEventListener?.('change',schedule);rail.removeEventListener('scroll',onScroll);rail.removeEventListener('pointerdown',markPause);rail.removeEventListener('pointerup',resumeLater);rail.removeEventListener('mouseenter',markPause);rail.removeEventListener('mouseleave',resume);rail.removeEventListener('focusin',markPause);rail.removeEventListener('focusout',resume)};
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
   // Exclude feminine and ambiguous merchandise; only explicitly male gifts belong here.
   // Never infer a product's recipient from the model in its photo or a broad category tag.
   const names=p=>[p.storefront?.shortNameAr,p.storefront?.nameAr,p.storefront?.shortNameTr,p.storefront?.nameTr,p.name].filter(Boolean).join(' ');
   const femaleWords=/(?:نسائي|نسائية|للسيدات|للبنات|للفتيات|للمرأة|للعروس|kadın|bayan|kız|women|ladies|female|girl|tesettür)/i;
   const maleWords=/(?:رجالي|رجالية|للرجال|للرجل|للزوج|للأب|للأخ|للشاب|شبابي|erkek|babaya|babalar|baba için|for men|menswear|boyfriend|for him)/i;
   const male=records.filter(p=>maleWords.test(names(p))&&!femaleWords.test(names(p)));
   menGrid.innerHTML=male.slice(0,4).map(p=>card(p)).join('');
   // Keep a consistent gifts photograph instead of automatically promoting any product image.
   const hero=men.querySelector('[data-og-him-image]');
   if(hero){hero.src='/assets/boutique-gifts.webp';hero.alt=t('هدايا متنوعة','Hediye seçenekleri');}
   const buttons=men.querySelectorAll('[data-og-him-all]');
   buttons.forEach(button=>{button.href=shop+'q='+encodeURIComponent(tr?'erkek':'رجالي')});
   men.hidden=male.length===0;
  }
  if(deals&&dealGrid){
   const sale=records.filter(p=>Boolean(offer(p))).sort((a,b)=>(offer(b).pct-offer(a).pct)||Number(a.id)-Number(b.id));
   dealGrid.innerHTML=sale.slice(0,8).map(p=>card(p,true)).join('');
   deals.hidden=!sale.length;
  }
 }
 window.OGHomeDiscovery={mountCategories,mountProducts,offer};
})();
