const SITE = 'https://onlinegiftis.com';
const API = 'https://api.onlinegiftis.com';
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const plain = value => String(value || '').replace(/<[^>]*>/g, ' ').replace(/\*\*/g, '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').replace(/\s+/g, ' ').trim();
// Hookahs are prohibited. Hold lighters and bundles containing them for review.
const heldTerms = /أراكيل|اراكيل|أركيلة|اركيلة|شيشة|نرجيلة|ولاعة|قداحة|نفاضة|منفضة|\b(?:hookah|shisha|nargile|lighter|ashtray)\b/i;
export function merchantFeed(products, lang = 'ar') {
  if (!['ar','tr'].includes(lang)) throw new Error('Unsupported merchant feed language');
  const turkish = lang === 'tr';
  const items = [], skipped = [], seen = new Set();
  for (const p of products) {
    const title = plain(turkish ? p.storefront?.nameTr : p.storefront?.nameAr || p.name);
    const description = plain(turkish ? p.storefront?.descriptionTr || p.storefront?.shortDescriptionTr || title : p.storefront?.descriptionAr || p.description || title);
    const id = Number(p.id);
    const price = p.price == null || p.price === '' ? NaN : Number(p.price);
    const status = p.storefront?.status;
    const rawImage = turkish ? (p.imageUrlTr !== undefined ? p.imageUrlTr : p.hasImage ? p.imageUrl : '') : p.seoImage?.url || (p.hasImage ? p.imageUrlAr || p.imageUrl : '');
    let reason = !Number.isInteger(id) || id <= 0 || seen.has(id) ? 'invalid or duplicate ID' : '';
    if (!reason && (status && status !== 'published' || p.storefront?.indexable === false)) reason = 'not publicly listed';
    if (!reason && heldTerms.test(title + ' ' + description + ' ' + plain(p.storefront?.nameAr || p.name) + ' ' + plain(p.storefront?.descriptionAr || p.description))) reason = 'restricted product or smoking accessory review';
    if (!reason && (!title || !rawImage || !Number.isFinite(price) || price <= 0)) reason = 'missing title, image or valid price';
    if (!reason && (p.orderable !== true || !Number.isFinite(Number(p.stockQuantity)))) reason = 'not directly orderable or missing stock';
    if (reason) { skipped.push({id:p.id,reason}); continue; }
    const image = new URL(rawImage, API).href;
    if (!/^https?:\/\//.test(image)) { skipped.push({id:p.id,reason:'invalid image URL'}); continue; }
    seen.add(id);
    const fields = {id:String(id),title:title.slice(0,150),description:description.slice(0,5000),link:SITE+'/products/'+id+'/?lang='+lang,image_link:image,availability:Number(p.stockQuantity)>0?'in_stock':'out_of_stock',price:price.toFixed(2)+' TRY'};
    // Do not fabricate GTIN/MPN/brand or claim identifier_exists=no for resale goods.
    items.push('    <item>\n'+Object.entries(fields).map(([key,value])=>'      <g:'+key+'>'+esc(value)+'</g:'+key+'>').join('\n')+'\n    </item>');
  }
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel>\n<title>'+(turkish?'Online Gifts':'اونلاين للهدايا')+'</title><link>'+SITE+'/</link><description>'+(turkish?'Türkiye için Türkçe mağaza ürünleri':'منتجات المتجر العربية للبيع داخل تركيا')+'</description>\n'+items.join('\n')+'\n</channel></rss>\n';
  return {xml,count:items.length,skipped};
}
