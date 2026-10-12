import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const context={window:{},document:{documentElement:{lang:'ar'}},location:{search:''},URL,URLSearchParams};
vm.createContext(context);for(const path of ['home-layout.js','boutique-presentation.js'])vm.runInContext(readFileSync(new URL('../assets/'+path,import.meta.url),'utf8'),context);
const products=[{id:1,hasImage:true,categories:['nfc'],storefront:{showOnHomepage:true}},{id:2,hasImage:true,categories:['flowers'],isFeatured:true},{id:3,hasImage:true,categories:['nfc'],requiresCustomizationText:true},{id:4,hasImage:true,orderable:false,categories:['flowers']},{id:5,hasImage:false,categories:['nfc']}];
const categories=[{key:'flowers',nameAr:'الورود',nameTr:'Çiçekler'}];const {select,apply}=context.window.OGHomeLayout,role=context.window.OGBoutique.role;
test('manual products keep administrator order, omit unavailable records, obey limits and hidden state',()=>{
 const section={enabled:true,selection:'manual',productIds:[3,4,2,99,5,1],limit:2};assert.deepEqual(Array.from(select(section,products,categories,role),p=>p.id),[3,2]);assert.equal(select({...section,enabled:false},products,categories,role).length,0);
});
test('category, personalized, flower and featured selections use saved catalogue facts',()=>{
 for(const [selection,key,expected] of [['category','nfc',[1,3]],['personalized','',[3]],['flowers','',[2]],['featured','',[1,2]],['all','',[1,2,3]]])assert.deepEqual(Array.from(select({selection,categoryKey:key,limit:24},products,categories,role),p=>p.id),expected);
});
test('section ordering and bilingual titles are applied as text without reviving disabled sections',()=>{
 const titles=[],order=[];const elements=new Map(['personalized','homePersonalizedSection','homeFlowersSection','reviews','occasions'].map(id=>[id,{id,hidden:false,querySelector(){return {set textContent(value){titles.push(value);}};}}]));
 const main={querySelector(){return {};},insertBefore(el){order.push(el.id);}};for(const el of elements.values())el.parentElement=main;
 const doc={getElementById(id){return id==='main'?main:elements.get(id);},querySelector(){return null;}};
 const layout={sections:[{key:'flowers',enabled:true,sortOrder:0,titleAr:'ورد',titleTr:'Çiçek'},{key:'personalized',enabled:false,sortOrder:1,titleAr:'نص',titleTr:'Özel'}]};apply(layout,doc,'tr');assert.deepEqual(titles,['Çiçek','Özel']);assert.deepEqual(order,['homeFlowersSection','homePersonalizedSection']);assert.equal(elements.get('homePersonalizedSection').hidden,true);
 apply({sections:[{key:'reviews',enabled:false,sortOrder:0}]},doc,'ar');assert.equal(elements.get('reviews').hidden,true);apply({sections:[{key:'reviews',enabled:true,sortOrder:0}]},doc,'ar');assert.equal(elements.get('reviews').hidden,false);
});
test('effective artwork from backend overrides legacy frontend fallback, including explicit hidden images',()=>{
 const p=context.window.OGBoutique;
 for(const lang of ['ar','tr']){context.document.documentElement.lang=lang;const suffix=lang==='ar'?'Ar':'Tr';const meta={key:'nfc',nameAr:'ميداليات',nameTr:'Anahtarlık',['effectiveBannerUrl'+suffix]:null,['bannerSource'+suffix]:'hidden'};assert.equal(p.campaign(meta).asset,null);assert.ok(!p.card(meta,'/products/').includes('<img'));
  const uploaded={...meta,['effectiveBannerUrl'+suffix]:'https://onlinegiftis.com/new.webp',['bannerSource'+suffix]:'uploaded'};assert.equal(p.campaign(uploaded).asset,'https://onlinegiftis.com/new.webp');assert.equal(p.campaign(uploaded).custom,true);
  const def={...meta,['effectiveBannerUrl'+suffix]:'https://onlinegiftis.com/default.webp',['bannerSource'+suffix]:'default',['campaignDescription'+suffix]:'وصف محفوظ'};assert.equal(p.campaign(def).asset,'https://onlinegiftis.com/default.webp');assert.equal(p.campaign(def).description,'وصف محفوظ');assert.equal(p.campaign(def).custom,false);
 }
});
