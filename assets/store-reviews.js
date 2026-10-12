(()=>{
 'use strict';
 const host=document.getElementById('storeReviewList'),form=document.getElementById('storeReviewForm');if(!host||!form)return;
 const tr=document.documentElement.lang==='tr',t=(ar,turkish)=>tr?turkish:ar;
 const endpoint='https://api.onlinegiftis.com/api/store/reviews';
 const status=document.getElementById('reviewStatus');
 async function load(){
  try{const response=await fetch(endpoint,{cache:'no-store'}),data=await response.json();if(!response.ok||!Array.isArray(data.reviews))throw Error('reviews');host.replaceChildren();
   const summary=document.getElementById('storeReviewSummary');summary.textContent=data.summary.count?t('تقييمات عملائنا: ','Müşteri değerlendirmeleri: ')+data.summary.count+' · '+data.summary.average+' / 5':t('شاركنا تجربتك مع هديتك.','Hediye deneyimini bizimle paylaş.');
   if(!data.reviews.length){const p=document.createElement('p');p.className='review-empty';p.textContent=t('لا توجد تقييمات منشورة بعد. يمكنك إضافة تقييمك من هنا.','Henüz yayınlanmış değerlendirme yok. İlk yorumunu buradan paylaşabilirsin.');host.append(p);return;}
   const sorted=data.reviews.slice().sort((a,b)=>Number(b.language===(tr?'tr':'ar'))-Number(a.language===(tr?'tr':'ar')));
   for(const review of sorted){const article=document.createElement('article');article.className='store-review-card';article.lang=review.language;const name=document.createElement('strong');name.dir='auto';name.textContent=review.displayName;const stars=document.createElement('p');stars.className='review-stars';stars.setAttribute('aria-label',review.rating+' / 5');stars.textContent='★'.repeat(review.rating)+'☆'.repeat(5-review.rating);const comment=document.createElement('p');comment.dir='auto';comment.textContent=review.comment;const date=document.createElement('time');date.dateTime=review.createdAt;const parsed=new Date(review.createdAt.replace(' ','T')+'Z');date.textContent=Number.isNaN(parsed.getTime())?'':new Intl.DateTimeFormat(tr?'tr-TR':'ar',{dateStyle:'medium'}).format(parsed);article.append(name,stars,comment,date);host.append(article);}
  }catch{host.textContent=t('تعذر تحميل التقييمات الآن. أعد المحاولة لاحقاً.','Değerlendirmeler şu anda yüklenemedi. Lütfen daha sonra tekrar dene.');}
 }
 form.addEventListener('submit',async event=>{
  event.preventDefault();const button=form.querySelector('[type=submit]');button.disabled=true;status.textContent='';
  try{const token=await window.OGCustomerAuth?.getAccessToken();if(!token){status.textContent=t('سجّل الدخول بحسابك أولاً لإرسال تقييمك.','Değerlendirme göndermek için önce hesabına giriş yap.');return;}
   const data=new FormData(form);const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({displayName:data.get('displayName'),rating:Number(data.get('rating')),comment:data.get('comment'),language:tr?'tr':'ar'})});
   if(!response.ok){const errors={401:t('انتهت الجلسة. سجّل الدخول من جديد.','Oturumun sona erdi. Lütfen tekrar giriş yap.'),429:t('حاول مجدداً لاحقاً.','Lütfen daha sonra tekrar dene.'),400:t('تحقق من الاسم والتقييم والتعليق.','Adını, puanını ve yorumunu kontrol et.')};throw Error(errors[response.status]||t('تعذر إرسال التقييم.','Değerlendirme gönderilemedi.'));}
   status.textContent=t('شكراً! تم إرسال تقييمك وبانتظار الاعتماد قبل ظهوره بالموقع.','Teşekkürler! Yorumun alındı ve yayınlanmadan önce onay bekliyor.');form.reset();
  }catch(error){status.textContent=error.message;}finally{button.disabled=false;}
 });
 load();
})();
