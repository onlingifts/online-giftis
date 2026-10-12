(()=>{
 'use strict';
 const host=document.getElementById('googleReviewList');if(!host)return;
 const locale=document.documentElement.lang==='tr'?'tr':'ar';
 const label=(ar,tr)=>locale==='tr'?tr:ar;
 for(const review of (window.OGGoogleReviews||[]).filter(item=>item.locale===locale)){
  const card=document.createElement('article');card.className='google-review-card';card.lang=locale;
  const header=document.createElement('div');header.className='google-review-header';
  const avatar=document.createElement('span');avatar.className='google-review-monogram';avatar.setAttribute('aria-hidden','true');avatar.textContent=review.author.trim().split(/\s+/).slice(0,2).map(part=>Array.from(part)[0]).join('');
  const identity=document.createElement('div');const author=document.createElement('h3');author.dir='auto';author.textContent=review.author;
  const source=document.createElement('span');source.className='google-review-source';source.textContent=label('تقييم على Google','Google yorumu');identity.append(author,source);header.append(avatar,identity);
  const stars=document.createElement('div');stars.className='google-review-stars';stars.textContent='★'.repeat(review.rating);stars.setAttribute('aria-label',label('التقييم: ','Puan: ')+review.rating+' / 5');
  const quote=document.createElement('blockquote');quote.textContent=review.text;
  card.append(header,stars,quote);
  if(review.excerpt){const note=document.createElement('small');note.className='google-review-excerpt';note.textContent=label('مقتطف من التقييم','Yorumdan alıntı');card.append(note);}
  if(review.translated){const note=document.createElement('small');note.className='google-review-translation';note.textContent='Arapçadan çevrilmiştir';card.append(note);}
  host.append(card);
 }
})();
