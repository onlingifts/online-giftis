/* The scheduled SEO sync refreshes these previews alongside product photos. */
(()=>{
 'use strict';
 const manifest=window.OGImageManifest||{products:{},assets:{}};
 const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 function attrs(entry,fallback,sizes){
  if(!entry)return 'src="'+esc(fallback)+'"';
  const middle=entry.variants.find(v=>v.width>=320)||entry.variants.at(-1);
  return 'src="'+esc(middle.url)+'" srcset="'+esc(entry.variants.map(v=>v.url+' '+v.width+'w').join(', '))+'" sizes="'+esc(sizes)+'" width="'+entry.width+'" height="'+entry.height+'" data-image-fallback="'+esc(fallback)+'"';
 }
 function product(p,sizes){
  const fallback=p.hasImage&&p.imageUrl?'https://bayi.onlinegiftis.com'+p.imageUrl:'';
  return attrs(p.hasImage?manifest.products[String(p.id)]:null,fallback,sizes);
 }
 function set(img,entry,fallback,sizes){
  if(!img)return;
  if(entry){
   img.sizes=sizes;
   img.srcset=entry.variants.map(v=>v.url+' '+v.width+'w').join(', ');
   img.dataset.imageFallback=fallback;
   img.width=entry.width;img.height=entry.height;
   img.src=(entry.variants.find(v=>v.width>=320)||entry.variants.at(-1)).url;
  }else{img.removeAttribute('srcset');img.removeAttribute('sizes');img.src=fallback}
 }
 document.addEventListener('error',e=>{
  const img=e.target;if(img.tagName!=='IMG'||!img.dataset.imageFallback)return;
  const fallback=img.dataset.imageFallback;delete img.dataset.imageFallback;
  img.removeAttribute('srcset');img.removeAttribute('sizes');img.src=fallback;
 },true);
 window.OGImages={product,setProduct:(img,p,sizes)=>set(img,p.hasImage?manifest.products[String(p.id)]:null,'https://bayi.onlinegiftis.com'+p.imageUrl,sizes),setAsset:(img,url,sizes)=>set(img,manifest.assets[url],url,sizes)};
 document.querySelectorAll('img[data-responsive-asset]').forEach(img=>window.OGImages.setAsset(img,img.getAttribute('src'),img.dataset.imageSizes||'100vw'));
})();
