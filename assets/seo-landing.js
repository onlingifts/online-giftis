(()=>{
 const API='https://api.onlinegiftis.com';
 const grid=document.getElementById('productsGrid');
 if(!grid)return;
 const lang=document.body.dataset.lang==='tr'?'tr':'ar';
 const txt=(ar,tr)=>lang==='tr'?tr:ar;
 const money=v=>new Intl.NumberFormat('tr-TR',{maximumFractionDigits:2}).format(Number(v||0))+' ₺';
 const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 const localizedName=p=>{
  const s=p?.storefront||{};
  return lang==='tr'?(s.nameTr||p.name||''):(s.nameAr||p.name||'');
 };
 const localizedDescription=p=>{
  const s=p?.storefront||{};
  return lang==='tr'?(s.shortDescriptionTr||s.descriptionTr||p.description||''):(s.shortDescriptionAr||s.descriptionAr||p.description||'');
 };
 async function load(){
  try{
   const r=await fetch(API+'/api/store/products',{cache:'no-store'}),d=await r.json();
   if(!r.ok||!Array.isArray(d.products))throw new Error();
   const items=d.products.slice(0,8);
   grid.innerHTML=items.map(p=>{
    const name=localizedName(p),description=localizedDescription(p);
    const image=p.hasImage?API+p.imageUrl:'';
    const price=p.price!==null?money(p.price):txt('السعر عند الطلب','Fiyat için iletişim');
    const href='/products/'+p.id+'/'+(lang==='tr'?'?lang=tr':'');
    return '<article class="card"><div class="media">'+
     (image?'<img '+OGImages.product(p,'(max-width: 760px) 90vw, 300px')+' alt="'+esc(name)+'" loading="lazy" decoding="async">':'')+
     '</div><div class="body"><div class="name">'+esc(name)+'</div><div class="desc">'+esc(description)+'</div><div class="price">'+price+
     '</div><a class="view" href="'+href+'">'+txt('شوف تفاصيل المنتج','Ürünü incele')+'</a></div></article>'
   }).join('')
  }catch{
   grid.innerHTML='<div class="state">'+txt('تعذر تحميل المنتجات حالياً. تقدر تشوف كل المنتجات من المتجر الرئيسي.','Ürünler şu anda yüklenemedi. Tüm ürünleri ana mağazada görebilirsiniz.')+'</div>'
  }
 }
 load()
})();
