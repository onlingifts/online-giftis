import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {SITE, esc, json, hasTurkish, productPath, languageLinks} from './seo-localization.mjs';

const decode = value => value.replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
export function generateCatalog(products) {
  let template=readFileSync('products/index.html','utf8');
  // Remove only generated blocks; keep the commerce template as the single source.
  template=template.replace(/<!-- catalog-seo:start -->[\s\S]*?<!-- catalog-seo:end -->/g,'');
  for(const lang of ['ar','tr']) {
    const tr=lang==='tr', path=tr?'/tr/products/':'/products/';
    const title=tr?'Tüm ürünler ve kişiye özel hediyeler | Online Giftis':'المنتجات والهدايا المخصصة في تركيا | Online Giftis – أونلاين للهدايا';
    const description=tr?'Online Giftis ürünlerini keşfedin: isimli ve fotoğraflı hediyeler, lazer kazıma, baskı ve NFC ürünleri. Güncel fiyatları ve stok bilgilerini inceleyin.':'تصفح منتجات Online Giftis – أونلاين للهدايا: هدايا بالأسماء والصور، طباعة وحفر ليزر ومنتجات NFC. اطلع على الأسعار والمخزون وخيارات التخصيص والتوصيل داخل تركيا.';
    let html=template.replace(/<html lang="[^"]+" dir="[^"]+"/,`<html lang="${lang}" dir="${tr?'ltr':'rtl'}"`);
    html=html.replace(/<title>[^<]*<\/title>/,`<title>${esc(title)}</title>`)
      .replace(/<meta name="description" content="[^"]*">/,`<meta name="description" content="${esc(description)}">`)
      .replace(/<link rel="canonical"[^>]*>/,`<link rel="canonical" href="${SITE}${path}">`)
      .replace(/<link rel="alternate" hreflang="[^"]+"[^>]*>\s*/g,'');
    html=html.replace(/<link rel="canonical"[^>]*>/,m=>m+'\n'+languageLinks({ar:'/products/',tr:'/tr/products/'}));
    for(const [key,value] of [['title',title],['description',description],['url',SITE+path]])
      html=html.replace(new RegExp(`<meta property="og:${key}" content="[^"]*">`),`<meta property="og:${key}" content="${esc(value)}">`);
    if(tr) {
      html=html.replace(/<([\w-]+)\b([^>]*\bdata-tr="([^"]*)"[^>]*)>[\s\S]*?<\/\1>/g,(_,tag,attrs,text)=>`<${tag}${attrs}>${decode(text)}</${tag}>`);
      html=html.replace(/<input\b[^>]*data-tr-placeholder="[^"]*"[^>]*>/g,tag=>tag.replace(/placeholder="[^"]*"(?=[\s>])/g,m=>m.startsWith('placeholder=')?`placeholder="${tag.match(/data-tr-placeholder="([^"]*)"/)[1]}"`:m));
      // Explicit link destinations and static accessibility labels, without changing layout.
      html=html.replace(/<a\b[^>]*data-href-tr="([^"]*)"[^>]*>/g,(tag,target)=>tag.replace(/\bhref="[^"]*"/,`href="${target}"`));
      html=html.replace(/href="\/track\/"/g,'href="/track/?lang=tr"').replace(/href="\/#how-it-works"/g,'href="/tr/#how-it-works"').replace(/href="\/about\/"/g,'href="/tr/about/"');
      html=html.replace('سياسة الإرجاع والاستبدال','İade ve değişim politikası').replace('اختر الولاية / İl seçiniz','İl seçiniz').replace('اختر المنطقة / İlçe seçiniz','İlçe seçiniz');
      html=html.replace(/(<a class="brand" href=")[^"]*/, '$1/tr/').replace(/aria-label="السلة"/g,'aria-label="Alışveriş sepeti"');
    }
    const list=products.filter(p=>!tr||hasTurkish(p));
    const cards=list.map(p=>{
      const name=tr?p.storefront.nameTr:p.name, desc=tr?(p.storefront.shortDescriptionTr||p.storefront.descriptionTr):p.description;
      const image=tr?(p.imageUrlTr||p.imageUrl):p.seoImage?.url||p.imageUrlAr||p.imageUrl;
      const price=p.price==null?(tr?'Fiyat için iletişim':'السعر عند الطلب'):new Intl.NumberFormat('tr-TR',{maximumFractionDigits:2}).format(Number(p.price))+' ₺';
      return `<div class="product-card-wrap"><a class="product-card-link" href="${productPath(p,lang)}"><article class="product-card"><div class="product-media">${image?`<img src="${esc(new URL(image,'https://api.onlinegiftis.com').href)}" alt="${esc(name)}" loading="lazy" decoding="async">`:''}</div><div class="product-body"><h3>${esc(name)}</h3><p>${esc(String(desc||'').replace(/\s+/g,' ').slice(0,180))}</p><div class="product-price">${esc(price)}</div><span>${p.stockQuantity>0?(tr?'Stokta':'متوفر'):(tr?'Stokta yok':'غير متوفر')}</span></div></article></a></div>`;
    }).join('');
    html=html.replace(/(<div class="product-grid" id="productGrid">)[\s\S]*?(\n <\/div>\n<\/section>)/,`$1${cards}</div>$2`);
    const schema=[{'@context':'https://schema.org','@type':'CollectionPage','@id':SITE+path+'#webpage',url:SITE+path,name:title,inLanguage:lang,isPartOf:{'@id':SITE+'/#website'},mainEntity:{'@type':'ItemList',itemListElement:list.map((p,i)=>({'@type':'ListItem',position:i+1,url:SITE+productPath(p,lang),name:tr?p.storefront.nameTr:p.name}))}}, {'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:tr?'Ana sayfa':'الرئيسية',item:SITE+(tr?'/tr/':'/')},{'@type':'ListItem',position:2,name:tr?'Ürünler':'المنتجات',item:SITE+path}]}];
    html=html.replace('</head>',`<!-- catalog-seo:start -->${schema.map(s=>`<script type="application/ld+json">${json(s)}</script>`).join('')}<!-- catalog-seo:end --></head>`);
    mkdirSync(tr?'tr/products':'products',{recursive:true});
    writeFileSync((tr?'tr/':'')+'products/index.html',html);
  }
}
