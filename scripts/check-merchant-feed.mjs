import {test} from 'node:test';
import assert from 'node:assert/strict';
import {merchantFeed} from './merchant-feed.mjs';
const product = {id:72,name:'كوب & هدية',description:'اسم <b>حسب الطلب</b>',price:850,stockQuantity:2,hasImage:true,imageUrl:'/api/store/products/image?id=72&lang=ar',orderable:true,storefront:{status:'published'}};
test('feed escapes XML, preserves retail price and does not invent identifiers',()=>{
 const result=merchantFeed([product]);
 assert.equal(result.count,1); assert.match(result.xml,/<g:price>850\.00 TRY<\/g:price>/);
 assert.match(result.xml,/كوب &amp; هدية/); assert.match(result.xml,/id=72&amp;lang=ar/);
 assert.match(result.xml,/<g:description>اسم حسب الطلب/);
 assert.doesNotMatch(result.xml,/<g:(gtin|mpn|brand|identifier_exists)>/);
 assert.equal(product.price,850);
});
test('skip missing prices, drafts, restricted products and duplicates',()=>{
 const input=[product,{...product,id:73,price:null},{...product,id:74,name:'أراكيل فاخرة'},{...product,id:75,storefront:{status:'draft'}},product,{...product,id:76,hasImage:false,imageUrl:''}];
 const result=merchantFeed(input);assert.equal(result.count,1);assert.equal(result.skipped.length,5);
});
test('availability reflects stock and localized name and image are used',()=>{
 const result=merchantFeed([{...product,stockQuantity:0,imageUrlAr:'/ar.webp',storefront:{nameAr:'كوب عربي',descriptionAr:'وصف عربي'}}]);
 assert.match(result.xml,/<g:availability>out_of_stock/);assert.match(result.xml,/<g:title>كوب عربي/);assert.match(result.xml,/https:\/\/api.onlinegiftis.com\/ar.webp/);
});
test('Turkish feed uses Turkish content, image and explicit language links',()=>{
 const localized={...product,imageUrlTr:'/tr.webp',seoImage:{url:'https://onlinegiftis.com/ar-only.webp'},storefront:{nameAr:'كوب عربي',nameTr:'İsimli kupa',descriptionTr:'Kişiye özel kupa'}};
 const tr=merchantFeed([localized],'tr');
 assert.equal(tr.count,1);assert.match(tr.xml,/<g:title>İsimli kupa/);assert.match(tr.xml,/<g:description>Kişiye özel kupa/);assert.match(tr.xml,/https:\/\/api.onlinegiftis.com\/tr.webp/);assert.match(tr.xml,/\/tr\/products\/72\//);assert.doesNotMatch(tr.xml,/ar-only.webp/);
 assert.match(merchantFeed([localized],'ar').xml,/\/products\/72\/\?lang=ar/);
 assert.equal(merchantFeed([{...localized,storefront:{nameAr:'كوب'}}],'tr').count,0);
 assert.equal(merchantFeed([{...localized,imageUrlTr:null}],'tr').count,0);
 assert.equal(merchantFeed([{...localized,storefront:{nameAr:'أراكيل',nameTr:'Lüks ürün'}}],'tr').count,0);
});

test('exclude perfume and hookah category tags in both languages without relying on names',()=>{
 const localized={...product,imageUrlTr:'/tr.webp',storefront:{nameAr:'منتج فاخر',descriptionAr:'وصف',nameTr:'Lüks ürün',descriptionTr:'Ürün açıklaması'}};
 for(const lang of ['ar','tr']){
  for(const fields of [{category:'perfumes_accessories'},{categories:['thermal']},{storefront:{...localized.storefront,storeCategories:['perfumes_accessories']}}]){
   const r=merchantFeed([{...localized,...fields}],lang);assert.equal(r.count,0);assert.equal(r.skipped[0].reason,'excluded perfume or hookah');
  }
  const accessories=merchantFeed([{...localized,categories:['cat_bb6c6aa1-4628-457f-a482-639e011bc174']}],lang);assert.equal(accessories.count,1);
 }
});
test('exclude newly named perfumes and incomplete Turkish descriptions',()=>{
 const localized={...product,imageUrlTr:'/tr.webp',storefront:{nameAr:'هدية',descriptionAr:'وصف',nameTr:'Parfüm hediyesi',descriptionTr:'Ürün açıklaması'}};
 for(const lang of ['ar','tr'])assert.equal(merchantFeed([localized],lang).count,0);
 assert.equal(merchantFeed([{...localized,storefront:{nameAr:'هدية',descriptionAr:'وصف',nameTr:'Hediye'}}],'tr').count,0);
 assert.equal(merchantFeed([{...product,stockQuantity:null}]).count,0);
});
