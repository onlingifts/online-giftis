/* Editorial descriptions for records whose administration fields are empty.
 * Saved descriptions always win. No volume, origin, ingredients or authenticity claims. */
(()=>{
 'use strict';
 const descriptions={
  80:['عطر اكسرجوف أكسنتو ضمن تشكيلة العطور في Online Giftis. للاستفسار عن الحجم والتركيز وخيارات هذا المنتج، تواصل معنا قبل الطلب.','Online Giftis parfüm koleksiyonundaki Accento. Boyut, konsantrasyon ve mevcut ürün seçenekleri hakkında siparişten önce bizimle iletişime geçebilirsiniz.'],
  96:['عطر اكسرجوف ناكسوس من تشكيلة Online Giftis. راجع السعر والمخزون الحاليين، واطلب تفاصيل العبوة عبر خدمة العملاء.','Online Giftis koleksiyonunda Naxos parfümü. Güncel fiyat ve stok durumunu inceleyebilir, şişe bilgilerini müşteri hizmetlerinden öğrenebilirsiniz.'],
  81:['عطر الثائر من ديمارلي ضمن مجموعة العطور. تفاصيل العبوة المتاحة لهذا المنتج تُطلب من فريق Online Giftis قبل الشراء.','The Rebel from De Marly adlı parfüm seçeneği. Sunulan şişenin ayrıntılarını satın almadan önce Online Giftis ekibinden öğrenebilirsiniz.'],
  82:['عطر بكرات روج الأبيض كما هو مسمى في كتالوج المتجر. اسأل فريقنا عن تفاصيل العبوة وخياراتها قبل تثبيت الطلب.','Mağaza kataloğunda beyaz Baccarat Rouge adıyla sunulan parfüm. Siparişi tamamlamadan önce şişe ayrıntıları ve seçenekleri için ekibimize danışabilirsiniz.'],
  83:['عطر بولغاري تايغر ضمن تشكيلة متجر Online Giftis. السعر وحالة المخزون معروضان في الصفحة، وتفاصيل العبوة متاحة عبر التواصل معنا.','Online Giftis parfüm seçkisindeki Tygar. Fiyatı ve stok durumunu bu sayfada görebilir, şişe ayrıntıları için bizimle iletişime geçebilirsiniz.'],
  92:['عطر تيزيانا تيرينزي Tyl في تشكيلة العطور. تواصل مع Online Giftis لمعرفة الحجم والتركيز المتاحين لهذا المنتج.','Parfüm koleksiyonundaki Tiziana Terenzi Tyl. Bu ürün için sunulan boyut ve konsantrasyonu Online Giftis ekibine sorabilirsiniz.'],
  84:['عطر تيزيانا تيرينزي هالي من مجموعة Online Giftis. تأكد من تفاصيل العبوة وخيارات المنتج مع فريق المتجر قبل الشراء.','Online Giftis koleksiyonunda Tiziana Terenzi Halei. Satın almadan önce şişe bilgilerini ve ürün seçeneklerini mağaza ekibimizle teyit edebilirsiniz.'],
  85:['عطر جان بول لومال إليكسير ضمن منتجات العطور. تفاصيل الحجم والعبوة متاحة من خدمة عملاء Online Giftis قبل تثبيت الطلب.','Parfüm ürünleri arasında Le Male Elixir seçeneği. Boyut ve şişe bilgilerini siparişten önce Online Giftis müşteri hizmetlerinden alabilirsiniz.'],
  86:['عطر جان بول لومال لو بارفام من تشكيلة المتجر. للاستفسار عن العبوة والتركيز المتاحين، راسل Online Giftis قبل الطلب.','Mağaza seçkisinde Le Male Le Parfum. Sunulan şişe ve konsantrasyon hakkında siparişten önce Online Giftis ile iletişime geçebilirsiniz.'],
  95:['عطر ديلينا إكسكلوسيف ضمن تشكيلة Online Giftis. اطّلع على السعر والتوفر، وتواصل معنا للحصول على تفاصيل العبوة.','Online Giftis koleksiyonundaki Delina Exclusif. Fiyat ve stok durumunu inceleyebilir, şişe ayrıntılarını ekibimizden öğrenebilirsiniz.'],
  93:['عطر سو سكاندل من مجموعة العطور في المتجر. اسأل فريق Online Giftis عن خيارات العبوة والتفاصيل قبل الشراء.','Mağazanın parfüm koleksiyonunda So Scandal. Şişe seçenekleri ve ürün ayrıntıları için satın almadan önce Online Giftis ekibimize danışabilirsiniz.'],
  87:['عطر سوسبيرو فيبراتو في كتالوج Online Giftis. لمعرفة معلومات الحجم والتركيز المتاحين، تواصل مع فريق المتجر.','Online Giftis kataloğunda Sospiro Vibrato. Sunulan boyut ve konsantrasyon bilgilerini mağaza ekibimizden öğrenebilirsiniz.'],
  88:['عطر كركه كما هو مسمى ضمن مجموعة العطور في المتجر. تأكد من تفاصيل المنتج والعبوة مع فريقنا قبل تثبيت طلبك.','Mağaza kataloğunda Karkah adıyla yer alan parfüm. Siparişinizi tamamlamadan önce ürün ve şişe ayrıntılarını ekibimizle teyit edebilirsiniz.'],
  89:['عطر لويس فيتون إيماجيناشن ضمن تشكيلة Online Giftis. تفاصيل العبوة المتاحة لهذا المنتج تُطلب من خدمة العملاء.','Online Giftis seçkisindeki Louis Vuitton Imagination. Bu ürün için sunulan şişenin ayrıntılarını müşteri hizmetlerinden öğrenebilirsiniz.'],
  90:['عطر لايتون من ديمارلي ضمن منتجات المتجر. راجع السعر والتوفر، واسأل فريقنا عن الحجم وخيارات العبوة قبل الشراء.','Mağazanın parfüm seçeneklerinden Layton by Parfums de Marly. Fiyat ve stok durumunu inceleyebilir, boyut ve şişe seçeneklerini satın almadan önce sorabilirsiniz.'],
  91:['عطر مارك أنطوان باروا إنسيلاد ضمن تشكيلة العطور. تواصل مع Online Giftis لمعرفة تفاصيل العبوة قبل تثبيت الطلب.','Parfüm koleksiyonundaki Marc-Antoine Barrois Encelade. Siparişi tamamlamadan önce şişe ayrıntıları için Online Giftis ile iletişime geçebilirsiniz.'],
  94:['عطر مارك جاكوبس ديكادنس من تشكيلة Online Giftis. اطلب معلومات العبوة والحجم المتاح من فريقنا قبل الشراء.','Online Giftis koleksiyonunda Marc Jacobs Decadence. Satın almadan önce sunulan şişe ve boyut bilgilerini ekibimizden isteyebilirsiniz.']
 };
 function product(p){
  const text=descriptions[p?.id];if(!text)return p;
  const sf={...p.storefront};
  const corrected={80:['Exergov Accento','Xerjoff Accento'],82:['White Rouge Buffing Wheels','Baccarat Rouge Beyaz'],85:['Jean Paul Gaultier Le Elixir','Jean Paul Gaultier Le Male Elixir'],86:['Ganboul Lomal La Parfum','Jean Paul Gaultier Le Male Le Parfum']};
  if(corrected[p.id]?.[0]===sf.nameTr)sf.nameTr=corrected[p.id][1];
  if(!String(sf.descriptionAr||sf.shortDescriptionAr||p.description||'').trim())sf.descriptionAr=text[0];
  if(!String(sf.descriptionTr||sf.shortDescriptionTr||'').trim())sf.descriptionTr=text[1];
  return {...p,description:p.description||sf.descriptionAr,storefront:sf};
 }
 const api={product,products:rows=>rows.map(product)};
 if(typeof window!=='undefined')window.OGCatalogContent=api;else globalThis.OGCatalogContent=api;
})();
