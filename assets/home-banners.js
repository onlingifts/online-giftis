/* Shared source references keep homepage picks and carousel in sync with admin. */
(()=>{
 'use strict';
 const language=document.documentElement.lang==='tr'?'tr':'ar',suffix=language==='tr'?'Tr':'Ar',t=(ar,tr)=>language==='tr'?tr:ar;
 const target=meta=>'/products/?'+(language==='tr'?'lang=tr&':'')+(meta.categoryKey||meta.key&&meta.key!=='all'?'category='+encodeURIComponent(meta.categoryKey||meta.key):meta['query'+suffix]?'q='+encodeURIComponent(meta['query'+suffix]):'');
 function library(data){return new Map([['home',{meta:data.homeBanner||{},href:data.storefront?.hero?.[language]?.link||'/products/?'+(language==='tr'?'lang=tr':'')}],...(data.categories||[]).filter(c=>c.key!=='all'&&c.isActive!==false).map(meta=>['category:'+meta.key,{meta,href:target(meta)}]),...(data.banners||[]).map(meta=>['banner:'+meta.id,{meta:{...meta,key:meta.categoryKey||meta.id},href:target(meta)}])]);}
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
   const image=link.querySelector('img');image.src=row.asset;image.removeAttribute('srcset');image.removeAttribute('sizes');image.removeAttribute('style');image.alt=row.source==='home'?t('البانر الرئيسي — Online Giftis','Online Giftis ana banner'):window.OGBoutique.label(row.meta);image.loading=index===0?'eager':'lazy';image.setAttribute('fetchpriority',index===0?'high':'low');
   if(rows.length>1||!row.isDefault){link.classList.add('hero-image-only');link.querySelector('.boutique-hero-copy')?.remove();link.querySelectorAll('picture source').forEach(source=>source.remove());}
   track.append(link);return link;
  });hero.append(track);
  if(rows.length===1){window.OGHomeLayout?.apply(data.storefront,document,language);return;}
  const controls=document.createElement('div');controls.className='hero-slider-controls';
  const button=(label,content)=>{const el=document.createElement('button');el.type='button';el.setAttribute('aria-label',label);el.textContent=content;return el;};
  const prev=button(t('البانر السابق','Önceki banner'),'‹'),next=button(t('البانر التالي','Sonraki banner'),'›'),pause=button(t('إيقاف الحركة','Otomatik geçişi durdur'),'Ⅱ');const dots=document.createElement('div');dots.className='hero-slider-dots';controls.append(prev,dots,next,pause);hero.append(controls);
  let active=0,timer=null,manualPaused=!config.autoplay,hovered=false,focused=false;const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const dotButtons=rows.map((row,index)=>{const dot=button(t('عرض البانر ','Bannerı göster: ')+(index+1),'');dot.onclick=()=>show(index);dots.append(dot);return dot;});
  function stop(){clearTimeout(timer);timer=null;}
  function schedule(){stop();if(!manualPaused&&!hovered&&!focused&&!document.hidden&&!reduced.matches)timer=setTimeout(()=>show(active+1),Math.max(3000,Math.min(15000,config.interval||6000)));}
  function show(index){active=(index+rows.length)%rows.length;links.forEach((link,i)=>{link.classList.toggle('is-active',i===active);link.inert=i!==active;link.setAttribute('aria-hidden',String(i!==active));if(i===active)link.querySelector('img').loading='eager';});dotButtons.forEach((dot,i)=>dot.setAttribute('aria-current',String(i===active)));schedule();}
  prev.onclick=()=>show(active-1);next.onclick=()=>show(active+1);pause.onclick=()=>{manualPaused=!manualPaused;pause.textContent=manualPaused?'▶':'Ⅱ';pause.setAttribute('aria-label',manualPaused?t('تشغيل الحركة','Otomatik geçişi başlat'):t('إيقاف الحركة','Otomatik geçişi durdur'));schedule();};
  hero.onmouseenter=()=>{hovered=true;stop();};hero.onmouseleave=()=>{hovered=false;schedule();};hero.onfocusin=()=>{focused=true;stop();};hero.onfocusout=event=>{if(!hero.contains(event.relatedTarget)){focused=false;schedule();}};
  const visibility=()=>schedule(),motion=()=>schedule();document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',motion);pause.textContent=manualPaused?'▶':'Ⅱ';show(0);
  destroy=()=>{stop();document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',motion);hero.onmouseenter=hero.onmouseleave=hero.onfocusin=hero.onfocusout=null;};
 }
 window.OGHomeBanners={library,picks,heroRows,mountHero};
})();
