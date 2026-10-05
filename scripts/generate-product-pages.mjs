import { rmSync, mkdirSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import '../assets/themes.js';
const {info:themeInfo,list:categoryList,productCategory}=globalThis.OGThemes;
const API = process.env.STOREFRONT_API || 'https://bayi.onlinegiftis.com/api/store/products';
const SITE = 'https://onlinegiftis.com';
const BACKEND = 'https://bayi.onlinegiftis.com';
const IMAGE_DIR = 'product-images';
const today = new Date().toISOString().slice(0,10);

function esc(v=''){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function clean(v=''){return String(v).replace(/\s+/g,' ').trim()}
function money(v){return new Intl.NumberFormat('tr-TR',{maximumFractionDigits:2}).format(Number(v||0))+' ₺'}
function productUrl(p){return SITE+'/products/'+p.id+'/'}
function dynamicImage(p){return p.hasImage && p.imageUrl ? BACKEND+p.imageUrl : SITE+'/assets/cover-new.webp'}
function absImage(p){return p.seoImage?.url || SITE+'/assets/cover-new.webp'}
function imageAlt(p){return clean(p.name)+' - Online Gifts'}
function safeToken(v=''){
  return String(v).normalize('NFKD').toLowerCase()
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'')
    .slice(0,70);
}
function imageExtension(contentType='',bytes){
  const ct=String(contentType).split(';')[0].trim().toLowerCase();
  if(ct==='image/jpeg'||ct==='image/jpg') return 'jpg';
  if(ct==='image/png') return 'png';
  if(ct==='image/webp') return 'webp';
  if(ct==='image/gif') return 'gif';
  if(ct==='image/avif') return 'avif';
  if(bytes?.length>=12){
    if(bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff) return 'jpg';
    if(bytes[0]===0x89&&bytes[1]===0x50&&bytes[2]===0x4e&&bytes[3]===0x47) return 'png';
    const head=bytes.subarray(0,12).toString('ascii');
    if(head.startsWith('GIF8')) return 'gif';
    if(head.startsWith('RIFF')&&head.slice(8,12)==='WEBP') return 'webp';
    if(head.slice(4,12).includes('ftypavif')) return 'avif';
  }
  return null;
}
function existingImageFor(p){
  if(!existsSync(IMAGE_DIR)) return null;
  const prefix=String(p.id)+'-';
  const name=readdirSync(IMAGE_DIR).find(x=>x.startsWith(prefix));
  return name ? {file:name,url:SITE+'/product-images/'+encodeURIComponent(name)} : null;
}
async function syncProductImage(p){
  const previous=existingImageFor(p);
  if(!p.hasImage||!p.imageUrl) return null;
  try{
    const response=await fetch(BACKEND+p.imageUrl,{
      redirect:'follow',
      headers:{Accept:'image/avif,image/webp,image/png,image/jpeg,image/gif,image/*;q=0.8,*/*;q=0.1'}
    });
    if(!response.ok) throw new Error('HTTP '+response.status);
    const bytes=Buffer.from(await response.arrayBuffer());
    const ext=imageExtension(response.headers.get('content-type'),bytes);
    if(!ext||!bytes.length) throw new Error('Unsupported image response');
    const token=safeToken(p.sku)||('gift-'+p.id);
    const file=String(p.id)+'-'+token+'.'+ext;
    for(const name of readdirSync(IMAGE_DIR)){
      if(name.startsWith(String(p.id)+'-')&&name!==file) rmSync(join(IMAGE_DIR,name),{force:true});
    }
    writeFileSync(join(IMAGE_DIR,file),bytes);
    return {
      file,
      url:SITE+'/product-images/'+encodeURIComponent(file),
      bytes:bytes.length,
      contentType:response.headers.get('content-type')||('image/'+ext)
    };
  }catch(error){
    console.warn('Image sync failed for product '+p.id+': '+(error instanceof Error?error.message:String(error)));
    return previous;
  }
}
function descriptionFor(p){
  const d=clean(p.description);
  const core=d||('صفحة '+p.name+' من Online Gifts تعرض معلومات المنتج والسعر والمخزون وخيارات الطلب الحالية داخل تركيا.');
  return core.slice(0,155);
}
function schemaFor(p){
  const image=absImage(p);
  const s={
    '@context':'https://schema.org',
    '@type':'Product',
    name:p.name,
    description:clean(p.description)||p.name,
    sku:p.sku||String(p.id),
    image:[image],
    url:productUrl(p),
    brand:{'@type':'Brand',name:'Online Gifts'}
  };
  if(p.price!==null && Number(p.price)>0){
    s.offers={
      '@type':'Offer',
      url:productUrl(p),
      priceCurrency:'TRY',
      price:Number(p.price),
      availability:p.stockQuantity>0?'https://schema.org/InStock':'https://schema.org/OutOfStock',
      itemCondition:'https://schema.org/NewCondition',
      seller:{'@type':'Organization',name:'Online Gifts'}
    };
  }
  return JSON.stringify(s).replace(/</g,'\\u003c');
}
function pageFor(p){
  const title=('شراء '+p.name+' في تركيا | Online Gifts').slice(0,65);
  const desc=descriptionFor(p);
  const image=absImage(p);
  const alt=imageAlt(p);
  const price=p.price!==null?money(p.price):'السعر عند الطلب';
  const stock=p.stockQuantity>0?'متوفر حالياً: '+p.stockQuantity:'غير متوفر حالياً';
  const wa='https://wa.me/905349154274?text='+encodeURIComponent('مرحبا، أريد طلب المنتج: '+p.name+' - '+productUrl(p));
  const imageHead=p.seoImage
    ? '<link rel="preload" as="image" href="'+image+'"><link rel="image_src" href="'+image+'">'
    : '';
  return `<!doctype html><html lang="ar" dir="rtl" data-theme="${themeInfo(productCategory(p)).theme}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><meta name="robots" content="index,follow,max-image-preview:large"><meta name="googlebot" content="index,follow,max-image-preview:large"><link rel="canonical" href="${productUrl(p)}">${imageHead}<meta property="og:type" content="product"><meta property="og:title" content="${esc(p.name)} | Online Gifts"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${productUrl(p)}"><meta property="og:image" content="${image}"><meta property="og:image:secure_url" content="${image}"><meta property="og:image:alt" content="${esc(alt)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(p.name)} | Online Gifts"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${image}"><meta name="twitter:image:alt" content="${esc(alt)}"><meta property="product:price:currency" content="TRY">${p.price!==null?'<meta property="product:price:amount" content="'+Number(p.price)+'">':''}<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet"><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css"><link rel="stylesheet" href="/assets/product-page.css"><link rel="stylesheet" href="/assets/themes.css"><script type="application/ld+json">${schemaFor(p)}</script></head><body data-product-id="${p.id}" data-product-categories="${esc(JSON.stringify(categoryList(p)))}"><script src="/assets/themes.js"></script><header class="header"><div class="container nav"><a class="brand" href="/"><img src="/assets/brand-logo.webp" alt="Online Gifts"><div><strong>Online Gifts</strong><span>PERSONALIZED GIFTS</span></div></a><div class="nav-actions"><a class="store" href="/products/"><i class="fa-solid fa-store"></i> كل المنتجات</a><a class="wa" href="${wa}" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i> واتساب</a></div></div></header><main><div class="container crumb"><a href="/">الرئيسية</a> / <a href="/products/">المنتجات</a> / ${esc(p.name)}</div><section class="product"><div class="container product-grid"><div class="media">${p.seoImage?'<img src="'+image+'" alt="'+esc(alt)+'" itemprop="image" decoding="async" fetchpriority="high">':'<div class="no-image"><i class="fa-solid fa-gift"></i></div>'}</div><article class="info">${p.isFeatured?'<span class="badge">الأكثر طلباً</span>':''}<h1>${esc(p.name)}</h1><div class="sku">SKU: ${esc(p.sku||String(p.id))}</div><p class="desc">${esc(clean(p.description)||'منتج من Online Gifts يمكن طلبه حسب حالة المخزون وخيارات التخصيص المتاحة.')}</p><div class="price" id="livePrice">${price}</div><div class="stock" id="liveStock">${stock}</div><div class="product-options"><a href="/products/?category=${encodeURIComponent(productCategory(p))}">${esc(themeInfo(productCategory(p)).ar)}</a><span data-ar="${esc((p.requiresCustomizationText?'نص مخصص · ':'')+(p.requiresCustomizationImage?'صورة مخصصة · ':'')+(p.requiresDesignInput?'تفاصيل تصميم · ':'')+(p.requiresPrepayment||p.paymentPolicy==='prepaid_only'?'دفع مسبق بالتحويل البنكي':'الدفع عند الاستلام أو التحويل البنكي'))}" data-tr="${esc((p.requiresCustomizationText?'Özel metin · ':'')+(p.requiresCustomizationImage?'Özel görsel · ':'')+(p.requiresDesignInput?'Tasarım detayları · ':'')+(p.requiresPrepayment||p.paymentPolicy==='prepaid_only'?'Banka havalesi ile ön ödeme':'Kapıda ödeme veya banka havalesi'))}">${esc((p.requiresCustomizationText?'نص مخصص · ':'')+(p.requiresCustomizationImage?'صورة مخصصة · ':'')+(p.requiresDesignInput?'تفاصيل تصميم · ':'')+(p.requiresPrepayment||p.paymentPolicy==='prepaid_only'?'دفع مسبق بالتحويل البنكي':'الدفع عند الاستلام أو التحويل البنكي'))}</span></div><div class="actions"><button class="buy" id="buyBtn" type="button" ${p.orderable?'':'disabled'}>${p.orderable?'<i class="fa-solid fa-bag-shopping"></i> اطلب المنتج':'غير متاح للطلب المباشر'}</button><a class="whatsapp" href="${wa}" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i></a></div><div class="trust"><div><i class="fa-solid fa-palette"></i>تنفيذ حسب الطلب</div><div><i class="fa-solid fa-box"></i>تغليف مرتب</div><div><i class="fa-solid fa-truck-fast"></i>توصيل مجاني داخل تركيا</div></div></article></div></section><section class="copy"><div class="container copy-grid"><article class="panel"><h2>عن هذا المنتج</h2><p>${esc(clean(p.description)||p.name)}</p><p>السعر والمخزون الظاهرين يتم تحديثهما من نظام Online Gifts. المنتجات المخصصة يمكن إدخال النص أو رفع الصورة والملف المطلوب من داخل سلة المتجر قبل تثبيت الطلب.</p></article><article class="panel"><h2>Online Gifts منذ 2016</h2><ul><li>تصميم وطباعة وتجهيز حسب نوع المنتج.</li><li>طباعة حرارية، حفر ليزر، طباعة 3D ومنتجات NFC.</li><li>تجهيز الطلبات وتوصيل مجاني داخل تركيا.</li><li>يمكن رفع ملفات التخصيص وإشعار التحويل مباشرة من المتجر، وللكميات الخاصة يمكن التواصل عبر واتساب.</li></ul></article></div></section></main><footer class="footer"><div class="container"><span>© Online Gifts — منذ 2016</span><span><a href="/gifts-istanbul/">هدايا في إسطنبول</a> · <a href="/custom-gifts-turkey/">هدايا مخصصة في تركيا</a></span></div></footer><script src="/assets/product-page.js" defer></script></body></html>`;
}

const res=await fetch(API,{headers:{accept:'application/json'}});
if(!res.ok) throw new Error('Storefront API failed: '+res.status);
const data=await res.json();
if(!Array.isArray(data.products)) throw new Error('Storefront API returned no products array');
const products=data.products.filter(p=>p&&Number.isFinite(Number(p.id)));

mkdirSync('products',{recursive:true});
mkdirSync(IMAGE_DIR,{recursive:true});
for (const entry of readdirSync('products',{withFileTypes:true})) {
  if (entry.isDirectory() && /^\d+$/.test(entry.name))
    rmSync(join('products',entry.name),{recursive:true,force:true});
}

for(const p of products) p.seoImage=await syncProductImage(p);

const activeIds=new Set(products.map(p=>String(p.id)));
for(const file of readdirSync(IMAGE_DIR)){
  const id=file.match(/^(\d+)-/)?.[1];
  if(id&&!activeIds.has(id)) rmSync(join(IMAGE_DIR,file),{force:true});
}

for(const p of products){
  const dir=join('products',String(p.id));
  mkdirSync(dir,{recursive:true});
  writeFileSync(join(dir,'index.html'),pageFor(p));
}

const staticUrls=[
  [SITE+'/',1.0,'daily'],
  [SITE+'/products/',0.95,'daily'],
  [SITE+'/tr/',1.0,'daily'],
  [SITE+'/gifts-istanbul/',0.9,'weekly'],
  [SITE+'/custom-gifts-turkey/',0.9,'weekly'],
  [SITE+'/tr/istanbul-hediye/',0.9,'weekly'],
  [SITE+'/tr/kisiye-ozel-hediye/',0.9,'weekly'],
  [SITE+'/marketer.html',0.4,'monthly']
];
const productSitemapRows=products.map(p=>{
  const image=p.seoImage?.url;
  const imageXml=image
    ? '<image:image><image:loc>'+esc(image)+'</image:loc></image:image>'
    : '';
  return '  <url><loc>'+productUrl(p)+'</loc><lastmod>'+today+'</lastmod><changefreq>daily</changefreq><priority>0.8</priority>'+imageXml+'</url>';
});
const urls=[
  ...staticUrls.map(([loc,priority,changefreq])=>'  <url><loc>'+loc+'</loc><lastmod>'+today+'</lastmod><changefreq>'+changefreq+'</changefreq><priority>'+priority+'</priority></url>'),
  ...productSitemapRows
];
writeFileSync('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n'+urls.join('\n')+'\n</urlset>\n');

const imageRows=products.filter(p=>p.seoImage?.url).map(p=>
  '  <url><loc>'+productUrl(p)+'</loc><image:image><image:loc>'+esc(p.seoImage.url)+'</image:loc></image:image></url>'
);
writeFileSync('image-sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n'+imageRows.join('\n')+'\n</urlset>\n');

console.log('Generated '+products.length+' product SEO pages, '+imageRows.length+' same-domain product images, sitemap.xml and image-sitemap.xml.');
