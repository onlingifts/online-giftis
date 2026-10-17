/* Shared source references keep homepage picks and carousel in sync with admin. */
(()=>{
 'use strict';
 const language=document.documentElement.lang==='tr'?'tr':'ar',suffix=language==='tr'?'Tr':'Ar',t=(ar,tr)=>language==='tr'?tr:ar;
 const target=meta=>'/products/?'+(language==='tr'?'lang=tr&':'')+(meta.categoryKey||meta.key&&meta.key!=='all'?'category='+encodeURIComponent(meta.categoryKey||meta.key):meta['query'+suffix]?'q='+encodeURIComponent(meta['query'+suffix]):'');
 function library(data){return new Map([['home',{meta:data.homeBanner||{},href:data.storefront?.hero?.[language]?.link||'/products/?'+(language==='tr'?'lang=tr':'')}],...(data.categories||[]).filter(c=>c.key!=='all'&&c.isActive!==false).map(meta=>['category:'+meta.key,{meta,href:target(meta)}]),...(data.banners||[]).map(meta=>['banner:'+meta.id,{meta:{...meta,key:meta.id},href:target(meta)}])]);}
 function picks(data){const sources=library(data),config=data.storefront?.homeBanners||{limit:4,selected:null};const chosen=config.selected??[...sources.keys()].filter(key=>key.startsWith('category:'));return chosen.map(key=>sources.get(key)).filter(Boolean).slice(0,[3,4].includes(config.limit)?config.limit:4);}
 function heroRows(data){
  const sources=library(data),config=data.storefront?.heroSlider||{autoplay:true,interval:6000,slides:[{source:'home',enabled:true,sortOrder:0}]};
  const rows=config.slides.filter(slide=>slide.enabled).slice().sort((a,b)=>a.sortOrder-b.sortOrder).map(slide=>{
   const item=sources.get(slide.source);if(!item)return null;const meta=item.meta;let asset,isDefault=false;
   if(slide.source==='home'){
    const managed=Object.prototype.hasOwnProperty.call(meta,'effectiveBannerUrl'+suffix);
    asset=managed?meta['effectiveBannerUrl'+suffix]:language==='tr'?meta.bannerUrlTr:meta.bannerUrlAr;
    isDefault=managed?meta['bannerSource'+suffix]==='default':window.OGBoutique?!window.OGBoutique.savedAsset({...meta,key:'home'}):!asset;
    if(!managed&&isDefault&&!meta.configured)asset='/assets/boutique-hero-desktop.webp';
   }else{asset=window.OGBoutique?.campaign(meta).asset;}
   if(!asset)return null;return {...item,source:slide.source,asset:asset.startsWith('/assets/')?asset:new URL(asset,'https://api.onlinegiftis.com').href,isDefault};
  }).filter(Boolean);
  return rows;
 }
 let destroy=()=>{},template=null;
 function mountHero(data,hero){
  if(!hero)return;destroy();if(!template)template=hero.querySelector('.pink-hero-link')?.cloneNode(true);
  const config=data.storefront?.heroSlider||{autoplay:true,interval:6000};const rows=heroRows(data);
  hero.replaceChildren();hero.classList.remove('has-custom-banner');hero.hidden=!rows.length;hero.style.display=hero.hidden?'none':'';if(!rows.length)return;
  hero.classList.add('hero-slider');hero.setAttribute('aria-roledescription',t('عرض شرائح','slayt gösterisi'));hero.setAttribute('aria-label',t('بانرات المتجر','Mağaza bannerları'));
  const track=document.createElement('div');track.className='hero-slider-track';const links=rows.map((row,index)=>{
   const link=template.cloneNode(true);link.classList.add('hero-slide');link.dataset.slideIndex=index;link.href=row.href;
   const image=link.querySelector('img');if(!row.isDefault){image.src=row.asset;image.removeAttribute('srcset');image.removeAttribute('sizes');}window.OGImages?.setAsset(image,row.asset,row.source==='home'&&row.isDefault?'(max-width:760px) 100vw, 60vw':'100vw');image.removeAttribute('style');image.alt=row.source==='home'?t('البانر الرئيسي — Online Giftis','Online Giftis ana banner'):window.OGBoutique.label(row.meta);image.loading=index===0?'eager':'lazy';image.setAttribute('fetchpriority',index===0?'high':'low');
   // Keep the main banner's heading and CTA when additional slides are enabled.
   if(row.source!=='home'){link.classList.add('hero-image-only');link.querySelector('.boutique-hero-copy')?.remove();}
   if(!row.isDefault)link.querySelectorAll('picture source').forEach(source=>source.remove());
   track.append(link);return link;
  });hero.append(track);
  window.OGHomeLayout?.apply(data.storefront,document,language);
  if(rows.length===1)return;
  const controls=document.createElement('div');controls.className='hero-slider-controls';
  const button=(label,content)=>{const el=document.createElement('button');el.type='button';el.setAttribute('aria-label',label);el.textContent=content;return el;};
  const prev=button(t('البانر السابق','Önceki banner'),'‹'),next=button(t('البانر التالي','Sonraki banner'),'›'),pause=button(t('إيقاف الحركة','Otomatik geçişi durdur'),'Ⅱ');const dots=document.createElement('div');dots.className='hero-slider-dots';controls.append(prev,dots,next,pause);hero.append(controls);
  let active=0,timer=null,manualPaused=!config.autoplay,hovered=false,focused=false;const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const dotButtons=rows.map((row,index)=>{const dot=button(t('عرض البانر ','Bannerı göster: ')+(index+1),'');dot.onclick=()=>show(index);dots.append(dot);return dot;});
  function stop(){clearTimeout(timer);timer=null;}
  function schedule(){stop();if(!manualPaused&&!hovered&&!focused&&!document.hidden&&!reduced.matches)timer=setTimeout(()=>show(active+1),Math.max(3000,Math.min(15000,config.interval||6000)));}
  function show(index){active=(index+rows.length)%rows.length;links.forEach((link,i)=>{link.classList.toggle('is-active',i===active);link.inert=i!==active;link.setAttribute('aria-hidden',String(i!==active));if(i===active)link.querySelector('img').loading='eager';});dotButtons.forEach((dot,i)=>dot.setAttribute('aria-current',String(i===active)));schedule();}
  prev.onclick=()=>show(active-1);next.onclick=()=>show(active+1);pause.onclick=()=>{manualPaused=!manualPaused;pause.textContent=manualPaused?'▶':'Ⅱ';pause.setAttribute('aria-label',manualPaused?t('تشغيل الحركة','Otomatik geçişi başlat'):t('إيقاف الحركة','Otomatik geçişi durdur'));schedule();};
  // Swipe between saved hero slides without opening a product link accidentally.
  let swipeX=null,swipeY=null,suppressClick=false;
  const onTouchStart=e=>{if(e.touches.length!==1)return;swipeX=e.touches[0].clientX;swipeY=e.touches[0].clientY;stop();};
  const onTouchEnd=e=>{if(swipeX===null||!e.changedTouches.length)return;const dx=e.changedTouches[0].clientX-swipeX,dy=e.changedTouches[0].clientY-swipeY;swipeX=swipeY=null;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.3){suppressClick=true;show(active+(dx<0?1:-1));setTimeout(()=>{suppressClick=false},400);}else schedule();};
  const onSlideClick=e=>{if(suppressClick&&e.target.closest('.hero-slide')){e.preventDefault();e.stopPropagation();suppressClick=false;}};
  hero.addEventListener('touchstart',onTouchStart,{passive:true});hero.addEventListener('touchend',onTouchEnd,{passive:true});
  hero.addEventListener('click',onSlideClick,true);
  hero.onmouseenter=()=>{hovered=true;stop();};hero.onmouseleave=()=>{hovered=false;schedule();};hero.onfocusin=()=>{focused=true;stop();};hero.onfocusout=event=>{if(!hero.contains(event.relatedTarget)){focused=false;schedule();}};
  const visibility=()=>schedule(),motion=()=>schedule();document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',motion);pause.textContent=manualPaused?'▶':'Ⅱ';show(0);
  destroy=()=>{stop();document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',motion);hero.removeEventListener('touchstart',onTouchStart);hero.removeEventListener('touchend',onTouchEnd);hero.removeEventListener('click',onSlideClick,true);hero.onmouseenter=hero.onmouseleave=hero.onfocusin=hero.onfocusout=null;};
 }
 window.OGHomeBanners={library,picks,heroRows,mountHero};
})();
