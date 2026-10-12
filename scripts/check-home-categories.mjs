import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../assets/home.js',import.meta.url),'utf8');
async function render(data,lang='ar'){
 const image={style:{},removeAttribute(){}};const nav={innerHTML:''};const hero={style:{},querySelector(){return image},querySelectorAll(){return []},classList:{add(){},toggle(){},contains(){return false}}};
 const document={documentElement:{lang,style:{removeProperty(){},setProperty(){}},toggleAttribute(){}},getElementById(){return null},addEventListener(){},querySelector(selector){return selector==='.pink-hero'?hero:selector==='.pink-categories'?nav:null},querySelectorAll(){return []}};
 vm.runInNewContext(source,{document,window:{addEventListener(){}},localStorage:{getItem(){return null},setItem(){}},fetch:async()=>Response.json(data),URL,URLSearchParams,location:{search:'',hash:''},Intl,Date});
 await new Promise(resolve=>setImmediate(resolve));
 return {image,nav,hero};
}
test('all saved categories, including renamed and ninth-plus entries, appear in both languages',async()=>{
 const categories=Array.from({length:12},(_,i)=>({key:'cat'+i,nameAr:'اسم جديد '+i,nameTr:'Yeni ad '+i}));
 for(const lang of ['ar','tr']){const {nav}=await render({categories,homeBanner:{}},lang);assert.equal((nav.innerHTML.match(/<a /g)||[]).length,12);assert.match(nav.innerHTML,/category=cat11/);assert.ok(nav.innerHTML.includes(lang==='ar'?'اسم جديد 11':'Yeni ad 11'));}
});
test('independent main image wins over the all-category banner, languages stay separate, deletion keeps it hidden',()=>{
 const window={};vm.runInNewContext(readFileSync(new URL('../assets/home-banners.js',import.meta.url),'utf8'),{window,document:{documentElement:{lang:'ar'}},URL});
 const categories=[{key:'all',bannerUrlAr:'/old-category.webp'}];
 assert.equal(window.OGHomeBanners.heroRows({categories,homeBanner:{bannerUrlAr:'/main.webp'}})[0].asset,'https://api.onlinegiftis.com/main.webp');
 assert.equal(window.OGHomeBanners.heroRows({categories,homeBanner:{configured:true,bannerUrlAr:null}}).length,0);
 const trWindow={};vm.runInNewContext(readFileSync(new URL('../assets/home-banners.js',import.meta.url),'utf8'),{window:trWindow,document:{documentElement:{lang:'tr'}},URL});
 assert.equal(trWindow.OGHomeBanners.heroRows({categories,homeBanner:{bannerUrlAr:'/ar.webp',bannerUrlTr:'/tr.webp'}})[0].asset,'https://api.onlinegiftis.com/tr.webp');
});
