/* Shared category art and compact product presentation; catalogue records stay authoritative. */
(()=>{
 'use strict';
 const t=(ar,tr)=>document.documentElement.lang==='tr'?tr:ar;
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function role(category){
  const text=[category?.key,category?.nameAr,category?.nameTr].filter(Boolean).join(' ').toLocaleLowerCase('tr-TR');
  if(/ورد|بوكيه|çiçek|gül|flowers|\blove\b/.test(text))return 'flowers';
  if(/مناسب|ميلاد|occasions|doğum|özel gün/.test(text))return 'occasions';
  if(/طباعة|أكواب|صور|assorted|drinkware|photo|baskı|kupa/.test(text))return 'printing';
  if(/عطور|بخور|perfume|parfüm/.test(text))return 'perfume';
  if(/أطفال|kids|çocuk/.test(text))return 'kids';
  if(/personalized|family|gifts|هدايا|hediye/.test(text))return 'gifts';
  return 'catalogue';
 }
 const assets={flowers:'/assets/boutique-hero-mobile.webp',gifts:'/assets/boutique-gifts.webp',printing:'/assets/boutique-print.webp',occasions:'/assets/boutique-occasions.webp',kids:'/assets/boutique-occasions.webp',perfume:'/assets/boutique-gifts.webp'};
 function campaign(category,product){const kind=role(category);const source=document.documentElement.lang==='tr'?(product?.imageUrlTr??product?.imageUrl):(product?.imageUrlAr??product?.imageUrl);const asset=['catalogue','perfume'].includes(kind)&&product?.hasImage&&source?new URL(source,'https://api.onlinegiftis.com').href:(assets[kind]||assets.gifts);return {role:kind,asset,description:kind==='flowers'?t('ورود تختصر مشاعرك','Duygularını anlatan çiçekler'):kind==='printing'?t('اجعل هديتك أقرب إليك بلمستك الخاصة','Hediyene kendi dokunuşunu kat'):kind==='occasions'||kind==='kids'?t('لكل لحظة جميلة هدية مميزة','Her güzel ana özel bir hediye'):t('هدايا مختارة لتبقى ذكرى','Bir anıya dönüşen özel hediyeler')};}
 function label(category){return document.documentElement.lang==='tr'?(category.nameTr||category.nameAr||category.key):(category.nameAr||category.nameTr||category.key);}
 function card(category,href,product){const art=campaign(category,product);return '<a class="boutique-section-card" data-category-key="'+esc(category.key)+'" data-art-role="'+art.role+'" href="'+esc(href)+'"><img src="'+art.asset+'" alt="" loading="lazy" width="2048" height="683"><div><strong>'+esc(label(category))+'</strong><p>'+esc(art.description)+'</p><span>'+t('تسوّق الآن','Şimdi keşfet')+'</span></div></a>';}
 function rating(p){const sf=p?.storefront||{},average=Number(sf.ratingAverage??sf.rating?.average),count=Number(sf.reviewCount??sf.rating?.count);if(!Number.isFinite(average)||average<1||average>5||!Number.isInteger(count)||count<1)return '';return '<span class="boutique-rating" aria-label="'+esc(t('تقييم ','Puan ')+average+' / 5')+'"><span aria-hidden="true">'+'★'.repeat(Math.round(average))+'☆'.repeat(5-Math.round(average))+'</span><small>('+count+')</small></span>';}
 function shortName(p){const sf=p.storefront||{};return document.documentElement.lang==='tr'?(sf.shortNameTr||sf.nameTr||p.name):(sf.shortNameAr||sf.nameAr||p.name);}
 function orderedCategories(categories){const rank={flowers:0,gifts:1,printing:2,occasions:3,kids:4,perfume:5,catalogue:6};return categories.filter(c=>c.key!=='all').slice().sort((a,b)=>rank[role(a)]-rank[role(b)]);}
 window.OGBoutique={role,campaign,label,card,rating,shortName,orderedCategories};
})();
