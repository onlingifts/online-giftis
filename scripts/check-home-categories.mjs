import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../assets/home.js',import.meta.url),'utf8');
async function render(data,lang='ar'){
 const image={style:{},removeAttribute(){}};const nav={innerHTML:''};const hero={style:{},querySelector(){return image},classList:{add(){}}};
 const document={documentElement:{lang},getElementById(){return null},addEventListener(){},querySelector(selector){return selector==='.pink-hero'?hero:selector==='.pink-categories'?nav:null},querySelectorAll(){return []}};
 vm.runInNewContext(source,{document,window:{addEventListener(){}},localStorage:{getItem(){return null},setItem(){}},fetch:async()=>Response.json(data),URL,Intl,Date});
 await new Promise(resolve=>setImmediate(resolve));
 return {image,nav,hero};
}
test('all saved categories, including renamed and ninth-plus entries, appear in both languages',async()=>{
 const categories=Array.from({length:12},(_,i)=>({key:'cat'+i,nameAr:'اسم جديد '+i,nameTr:'Yeni ad '+i}));
 for(const lang of ['ar','tr']){const {nav}=await render({categories,homeBanner:{}},lang);assert.equal((nav.innerHTML.match(/<a /g)||[]).length,12);assert.match(nav.innerHTML,/category=cat11/);assert.ok(nav.innerHTML.includes(lang==='ar'?'اسم جديد 11':'Yeni ad 11'));}
});
test('independent main image wins over the all-category banner and deletion keeps it hidden',async()=>{
 const categories=[{key:'all',bannerUrlAr:'/old-category.webp'}];
 const current=await render({categories,homeBanner:{bannerUrlAr:'/main.webp'}});assert.equal(current.image.src,'https://api.onlinegiftis.com/main.webp');
 const deleted=await render({categories,homeBanner:{configured:true,bannerUrlAr:null}});assert.equal(deleted.hero.style.display,'none');assert.equal(deleted.image.src,undefined);
 const turkish=await render({categories,homeBanner:{bannerUrlAr:'/ar.webp',bannerUrlTr:'/tr.webp'}},'tr');assert.equal(turkish.image.src,'https://api.onlinegiftis.com/tr.webp');
});
