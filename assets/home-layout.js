/* Persisted storefront sections. Product eligibility always comes from the live API. */
(()=>{
 'use strict';
 const defaults=[
  {key:'featured',enabled:true,sortOrder:0,selection:'featured',limit:6},
  {key:'personalized',enabled:true,sortOrder:1,selection:'personalized',limit:4},
  {key:'flowers',enabled:true,sortOrder:2,selection:'flowers',limit:4},
  {key:'reviews',enabled:true,sortOrder:3},
  {key:'promotions',enabled:true,sortOrder:4}
 ];
 function sections(layout){return layout?.sections||defaults;}
 function productCategories(p){const raw=p.categories??p.category??[];return Array.isArray(raw)?raw:typeof raw==='string'?raw.split(',').map(s=>s.trim()):[];}
 function select(section,products,categories,role){
  if(section.enabled===false)return [];
  const eligible=products.filter(p=>p.orderable!==false&&p.hasImage);
  const mode=section.selection;
  let chosen=[];
  if(mode==='manual'){const byId=new Map(eligible.map(p=>[String(p.id),p]));chosen=(section.productIds||[]).map(id=>byId.get(String(id))).filter(Boolean);}
  else if(mode==='category')chosen=eligible.filter(p=>productCategories(p).includes(section.categoryKey));
  else if(mode==='personalized')chosen=eligible.filter(p=>p.requiresCustomizationText||p.requiresCustomizationImage||p.requiresDesignInput);
  else if(mode==='flowers'){const keys=categories.filter(c=>role(c)==='flowers').map(c=>c.key);chosen=eligible.filter(p=>productCategories(p).some(k=>keys.includes(k)));}
  else if(mode==='featured'){chosen=eligible.filter(p=>p.storefront?.showOnHomepage||p.isFeatured||p.storefront?.isFeatured);}
  else if(mode==='all')chosen=eligible;
  return chosen.slice(0,Math.min(24,Math.max(1,Number(section.limit)||4)));
 }
 function apply(layout,doc,language){
  const ids={featured:'personalized',personalized:'homePersonalizedSection',flowers:'homeFlowersSection',reviews:'reviews',promotions:'occasions'};
  const main=doc.getElementById('main'),anchor=main?.querySelector('.boutique-more');
  sections(layout).slice().sort((a,b)=>a.sortOrder-b.sortOrder).forEach(section=>{
   const el=doc.getElementById(ids[section.key]);if(!el)return;
   if(section.key==='reviews')el.hidden=section.enabled===false;else if(section.enabled===false)el.hidden=true;
   const title=section[language==='tr'?'titleTr':'titleAr'];if(title&&el.querySelector('h2'))el.querySelector('h2').textContent=title;
   if(main&&anchor&&el.parentElement===main)main.insertBefore(el,anchor);
  });
  const hero=layout?.hero?.[language],copy=doc.querySelector('.boutique-hero-copy');
  if(hero&&copy){
   copy.querySelector('small').textContent=hero.kicker;
   copy.querySelector('h1').textContent=hero.heading;
   copy.querySelector('p').textContent=hero.description;
   const button=copy.querySelector('.boutique-cta');button.textContent=hero.button;
   const link=copy.closest?.('.pink-hero-link')||doc.querySelector('.pink-hero-link');if(link&&/^\/(?!\/)/.test(hero.link)&&!/[\\\u0000-\u001f]/.test(hero.link))link.setAttribute('href',hero.link);
  }
 }
 window.OGHomeLayout={sections,select,apply};
})();
