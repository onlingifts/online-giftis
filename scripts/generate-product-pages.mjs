import { rmSync, mkdirSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import '../assets/themes.js';
const {info:themeInfo,list:categoryList,productCategory}=globalThis.OGThemes;
const API = process.env.STOREFRONT_API || 'https://bayi.onlinegiftis.com/api/store/products';
const SITE = 'https://onlinegiftis.com';
const BACKEND = 'https://bayi.onlinegiftis.com';
const today = new Date().toISOString().slice(0,10);

function esc(v=''){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function clean(v=''){return String(v).replace(/\s+/g,' ').trim()}
function money(v){return new Intl.NumberFormat('tr-TR',{maximumFractionDigits:2}).format(Number(v||0))+' ₺'}
function absImage(p){return p.hasImage && p.imageUrl ? BACKEND+p.imageUrl : SITE+'/assets/cover-new.webp'}
function productUrl(p){return SITE+'/products/'+p.id+'/'}
function descriptionFor(p){
  const d=clean(p.description);
  const core=d||('صفحة '+p.name+' من Online Gifts تعرض معلومات المنتج والسعر والمخزون وخيارات الطلب الحالية داخل تركيا.');
  return core.slice(0,155);
}
function schemaFor(p){
  const s={
    '@context':'https://schema.org',
    '@type':'Product',
    name:p.name,
    description:clean(p.description)||p.name,
    sku:p.sku||String(p.id),
    image:[absImage(p)],
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
  const bodyDesc=clean(p.description)||('هذا المنتج هو '+p.name+' من Online Gifts. تعرض الصفحة السعر والمخزون وخيارات الطلب الحالية، وقد يحتاج المنتج إلى تخصيص أو تنسيق إضافي حسب نوعه.');
  const image=absImage(p);
  const price=p.price!==null?money(p.price):'السعر عند الطلب';
  const stock=p.stockQuantity>0?'متوفر حالياً: '+p.stockQuantity:'غير متوفر حالياً';
  const wa='https://wa.me/905349154274?text='+encodeURIComponent('مرحبا، أريد طلب المنتج: '+p.name+' - '+productUrl(p));
  return `<!doctype html><html lang="ar" dir="rtl" data-theme="${themeInfo(productCategory(p)).theme}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${productUrl(p)}"><meta property="og:type" content="product"><meta property="og:title" content="${esc(p.name)} | Online Gifts"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${productUrl(p)}"><meta property="og:image" content="${image}"><meta property="product:price:currency" content="TRY">${p.price!==null?'<meta property="product:price:amount" content="'+Number(p.price)+'">':''}<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet"><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css"><link rel="stylesheet" href="/assets/product-page.css"><link rel="stylesheet" href="/assets/themes.css"><script type="application/ld+json">${schemaFor(p)}</script></head><body data-product-id="${p.id}" data-product-categories="${esc(JSON.stringify(categoryList(p)))}"><script src="/assets/themes.js"></script><header class="header"><div class="container nav"><a class="brand" href="/"><img src="/assets/brand-logo.webp" alt="Online Gifts"><div><strong>Online Gifts</strong><span>PERSONALIZED GIFTS</span></div></a><div class="nav-actions"><a class="store" href="/products/"><i class="fa-solid fa-store"></i> كل المنتجات</a><a class="wa" href="${wa}" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i> واتساب</a></div></div></header><main><div class="container crumb"><a href="/">الرئيسية</a> / <a href="/products/">المنتجات</a> / ${esc(p.name)}</div><section class="product"><div class="container product-grid"><div class="media">${p.hasImage?'<img src="'+image+'" alt="'+esc(p.name)+'">':'<div class="no-image"><i class="fa-solid fa-gift"></i></div>'}</div><article class="info">${p.isFeatured?'<span class="badge">الأكثر طلباً</span>':''}<h1>${esc(p.name)}</h1><div class="sku">SKU: ${esc(p.sku||String(p.id))}</div><p class="desc">${esc(clean(p.description)||'منتج من Online Gifts يمكن طلبه حسب حالة المخزون وخيارات التخصيص المتاحة.')}</p><div class="price" id="livePrice">${price}</div><div class="stock" id="liveStock">${stock}</div><div class="product-options"><a href="/products/?category=${encodeURIComponent(productCategory(p))}">${esc(themeInfo(productCategory(p)).ar)}</a><span data-ar="${esc((p.requiresCustomizationText?'نص مخصص · ':'')+(p.requiresCustomizationImage?'صورة مخصصة · ':'')+(p.requiresDesignInput?'تفاصيل تصميم · ':'')+(p.requiresPrepayment||p.paymentPolicy==='prepaid_only'?'دفع مسبق بالتحويل البنكي':'الدفع عند الاستلام أو التحويل البنكي'))}" data-tr="${esc((p.requiresCustomizationText?'Özel metin · ':'')+(p.requiresCustomizationImage?'Özel görsel · ':'')+(p.requiresDesignInput?'Tasarım detayları · ':'')+(p.requiresPrepayment||p.paymentPolicy==='prepaid_only'?'Banka havalesi ile ön ödeme':'Kapıda ödeme veya banka havalesi'))}">${esc((p.requiresCustomizationText?'نص مخصص · ':'')+(p.requiresCustomizationImage?'صورة مخصصة · ':'')+(p.requiresDesignInput?'تفاصيل تصميم · ':'')+(p.requiresPrepayment||p.paymentPolicy==='prepaid_only'?'دفع مسبق بالتحويل البنكي':'الدفع عند الاستلام أو التحويل البنكي'))}</span></div><div class="actions"><button class="buy" id="buyBtn" type="button" ${p.orderable?'':'disabled'}>${p.orderable?'<i class="fa-solid fa-bag-shopping"></i> اطلب المنتج':'غير متاح للطلب المباشر'}</button><a class="whatsapp" href="${wa}" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i></a></div><div class="trust"><div><i class="fa-solid fa-palette"></i>تنفيذ حسب الطلب</div><div><i class="fa-solid fa-box"></i>تغليف مرتب</div><div><i class="fa-solid fa-truck-fast"></i>توصيل مجاني داخل تركيا</div></div></article></div></section><section class="copy"><div class="container copy-grid"><article class="panel"><h2>عن هذا المنتج</h2><p>${esc(clean(p.description)||p.name)}</p><p>السعر والمخزون الظاهرين يتم تحديثهما من نظام Online Gifts. المنتجات المخصصة يمكن إدخال النص أو رفع الصورة والملف المطلوب من داخل سلة المتجر قبل تثبيت الطلب.</p></article><article class="panel"><h2>Online Gifts منذ 2016</h2><ul><li>تصميم وطباعة وتجهيز حسب نوع المنتج.</li><li>طباعة حرارية، حفر ليزر، طباعة 3D ومنتجات NFC.</li><li>تجهيز الطلبات وتوصيل مجاني داخل تركيا.</li><li>يمكن رفع ملفات التخصيص وإشعار التحويل مباشرة من المتجر، وللكميات الخاصة يمكن التواصل عبر واتساب.</li></ul></article></div></section></main><footer class="footer"><div class="container"><span>© Online Gifts — منذ 2016</span><span><a href="/gifts-istanbul/">هدايا في إسطنبول</a> · <a href="/custom-gifts-turkey/">هدايا مخصصة في تركيا</a></span></div></footer><script src="/assets/product-page.js" defer></script></body></html>`;
}

const res=await fetch(API,{headers:{accept:'application/json'}});
if(!res.ok) throw new Error('Storefront API failed: '+res.status);
const data=await res.json();
if(!Array.isArray(data.products)) throw new Error('Storefront API returned no products array');
const products=data.products.filter(p=>p&&Number.isFinite(Number(p.id)));

mkdirSync('products',{recursive:true});
for (const entry of readdirSync('products',{withFileTypes:true})) {
  if (entry.isDirectory() && /^\d+$/.test(entry.name))
    rmSync(join('products',entry.name),{recursive:true,force:true});
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
const urls=[
  ...staticUrls.map(([loc,priority,changefreq])=>`  <url><loc>${loc}</loc><lastmod>${today}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`),
  ...products.map(p=>`  <url><loc>${productUrl(p)}</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>`)
];
writeFileSync('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+urls.join('\n')+'\n</urlset>\n');
console.log('Generated '+products.length+' product SEO pages and sitemap.');
