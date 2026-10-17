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
 function imageUrl(p){const key=document.documentElement.lang==='tr'?'imageUrlTr':'imageUrlAr';return p[key]!==undefined?p[key]:p.imageUrl}
 function currentPreview(p){const entry=(document.documentElement.lang==='tr'?manifest.productsTr?.[String(p.id)]:null)||manifest.products[String(p.id)];return p.hasImage&&entry?.source===imageUrl(p)?entry:null}
 function product(p,sizes){
  const fallback=p.hasImage&&imageUrl(p)?new URL(imageUrl(p),'https://api.onlinegiftis.com').href:'';
  return attrs(currentPreview(p),fallback,sizes);
 }
 function set(img,entry,fallback,sizes){
  if(!img)return;
  if(entry){
   img.sizes=sizes;
   img.srcset=entry.variants.map(v=>v.url+' '+v.width+'w').join(', ');
   img.dataset.imageFallback=fallback;
   img.width=entry.width;img.height=entry.height;
   img.src=(entry.variants.find(v=>v.width>=320)||entry.variants.at(-1)).url;
  }else{delete img.dataset.imageFallback;img.removeAttribute('srcset');img.removeAttribute('sizes');img.src=fallback}
 }
 document.addEventListener('error',e=>{
  const img=e.target;if(img.tagName!=='IMG'||!img.dataset.imageFallback)return;
  const fallback=img.dataset.imageFallback;delete img.dataset.imageFallback;
  img.removeAttribute('srcset');img.removeAttribute('sizes');img.src=fallback;
 },true);
 function assetEntry(url){try{const parsed=new URL(url,location.origin);return (parsed.origin===location.origin||parsed.origin==='https://onlinegiftis.com')&&!parsed.search?manifest.assets[parsed.pathname]:null}catch{return null}}
 window.OGImages={asset:(url,sizes)=>attrs(assetEntry(url),url,sizes),product,setProduct:(img,p,sizes)=>set(img,currentPreview(p),p.hasImage&&imageUrl(p)?new URL(imageUrl(p),'https://api.onlinegiftis.com').href:'',sizes),setAsset:(img,url,sizes)=>set(img,assetEntry(url),url,sizes)};
 document.querySelectorAll('img[data-responsive-asset]').forEach(img=>window.OGImages.setAsset(img,img.getAttribute('src'),img.dataset.imageSizes||'100vw'));
})();
