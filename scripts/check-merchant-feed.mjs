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
