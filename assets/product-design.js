(()=>{
'use strict';
// Lightweight visual design attachment: produces an image file for order preparation.
// This is a request preview, not a manufacturing-accurate product mockup.
let overlay=null, resolveCallback=null, imageBitmap=null, productLabel='',template='generic';
const $=id=>overlay?.querySelector('#'+id);
const tr=()=>document.documentElement.lang==='tr';
const t=(ar,tk)=>tr()?tk:ar;
function node(tag,cls,txt){
 const el=document.createElement(tag);if(cls)el.className=cls;
 if(txt!=null)el.textContent=txt;return el
}
function ensure(){
 if(overlay)return;
 overlay=node('div','og-design-overlay');overlay.hidden=true;
 overlay.innerHTML=`
  <div class="og-design-panel" role="dialog" aria-modal="true" aria-labelledby="ogDesignTitle">
   <div class="og-design-header">
    <h2 id="ogDesignTitle"></h2><button type="button" id="ogDesignClose" aria-label="Close">×</button>
   </div>
   <div class="og-design-body">
    <div class="og-design-tools">
      <label id="ogDesignLabelText" for="ogDesignText"></label>
      <input id="ogDesignText" maxlength="200" autocomplete="off"><label id="ogDesignSecondLabel" for="ogDesignSecondText"></label><input id="ogDesignSecondText" maxlength="80" autocomplete="off">
      <label id="ogDesignLabelPhoto" for="ogDesignPhoto"></label>
      <input id="ogDesignPhoto" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif">
      <p id="ogDesignNote"></p>
      <button type="button" id="ogDesignClear"></button>
    </div>
    <canvas id="ogDesignCanvas" width="1080" height="1080" aria-label="Design preview"></canvas>
   </div>
   <div class="og-design-actions"><button type="button" id="ogDesignCancel"></button><button type="button" id="ogDesignApply"></button></div>
  </div>`;
 document.body.appendChild(overlay);
 $('ogDesignClose').onclick=close;
 $('ogDesignCancel').onclick=close;
 overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
 $('ogDesignText').addEventListener('input',draw);$('ogDesignSecondText').addEventListener('input',draw);
 $('ogDesignPhoto').addEventListener('change',async()=>{
  const file=$('ogDesignPhoto').files?.[0];
  if(imageBitmap){imageBitmap.close?.();imageBitmap=null}
  if(file){
   if(file.size>10*1024*1024){alert(t('الصورة أكبر من 10MB','Görsel 10MB sınırını aşıyor'));$('ogDesignPhoto').value='';return}
   try{imageBitmap=await createImageBitmap(file)}catch{
    alert(t('تعذر قراءة الصورة؛ اختر JPG أو PNG أو WebP.','Görsel açılamadı; JPG, PNG veya WebP seçin.'));$('ogDesignPhoto').value=''
   }
  }
  draw()
 });
 $('ogDesignClear').onclick=()=>{$('ogDesignText').value='';$('ogDesignSecondText').value='';$('ogDesignPhoto').value='';if(imageBitmap){imageBitmap.close?.();imageBitmap=null}draw()};
 $('ogDesignApply').onclick=()=>{
   const canvas=$('ogDesignCanvas'),label=[$('ogDesignText').value.trim(),$('ogDesignSecondText').value.trim()].filter(Boolean).join(' · ');
   if(template==='name_lamp'&&!$('ogDesignText').value.trim()){alert(t('أدخل الاسم الأول للأباجور.','Lamba için birinci ismi yazın.'));return}
   if(template==='mirror_heart'&&!imageBitmap){alert(t('اختر الصورة اللي بدك تطبعها على المراية.','Aynaya basılacak fotoğrafı seçin.'));return}
   if(!label&&!imageBitmap){alert(t('أدخل نصًا أو اختر صورة للتصميم.','Tasarım için metin yazın veya görsel seçin.'));return}
   $('ogDesignApply').disabled=true;
   canvas.toBlob(async blob=>{
    $('ogDesignApply').disabled=false;
    if(!blob){alert(t('تعذر حفظ التصميم.','Tasarım kaydedilemedi.'));return}
    const file=new File([blob],'online-gifts-'+template+'-design-'+Date.now()+'.png',{type:'image/png'});
    const save=resolveCallback;
    try{await save?.(file,label);close()}catch(error){alert(t('تعذر إرفاق التصميم. جرّب مرة تانية.','Tasarım eklenemedi. Lütfen tekrar deneyin.'))}
   },'image/png')
 };
 document.addEventListener('keydown',e=>{if(!overlay?.hidden&&e.key==='Escape')close()});
}
function draw(){
 const canvas=$('ogDesignCanvas'),ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;if(!ctx)return;
 ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);
 const text=$('ogDesignText').value.trim(),second=$('ogDesignSecondText').value.trim();
 const fit=(value,y,start=100)=>{let size=start;ctx.font='bold '+size+'px Cairo, Arial';while(size>24&&ctx.measureText(value).width>900){size-=3;ctx.font='bold '+size+'px Cairo, Arial'}ctx.fillStyle='#222';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(value,w/2,y,900)};
 if(template==='name_lamp'){
  fit(text||t('الاسم الأول','Birinci isim'),second?410:540,140);
  if(second){fit('♡',540,100);fit(second,680,140)}
  return
 }
 ctx.save();
 if(template==='mirror_heart'){
  ctx.beginPath();ctx.moveTo(540,840);ctx.bezierCurveTo(120,580,30,230,295,160);ctx.bezierCurveTo(420,125,515,210,540,290);ctx.bezierCurveTo(565,210,660,125,785,160);ctx.bezierCurveTo(1050,230,960,580,540,840);ctx.closePath();ctx.clip()
 }
 if(imageBitmap){const scale=template==='mirror_heart'?Math.max(900/imageBitmap.width,720/imageBitmap.height):Math.min(900/imageBitmap.width,720/imageBitmap.height);const dw=imageBitmap.width*scale,dh=imageBitmap.height*scale;ctx.drawImage(imageBitmap,540-dw/2,490-dh/2,dw,dh)}else{ctx.fillStyle='#fff0f5';ctx.fillRect(90,130,900,720);ctx.font='120px Arial';ctx.fillStyle='#d65582';ctx.textAlign='center';ctx.fillText('♡',540,500)}
 ctx.restore();if(text)fit(text,940,64)
}
function close(){
 if(!overlay)return;
 overlay.hidden=true;document.body.classList.remove('og-design-open');
 if(imageBitmap){imageBitmap.close?.();imageBitmap=null}
 resolveCallback=null
}
function open(product,onSave){
 ensure();
 productLabel=String(product?.name||'').slice(0,100);template=product?.designType||product?.storefront?.details?.designTemplate||'generic';
 resolveCallback=onSave;
 $('ogDesignTitle').textContent=template==='name_lamp'?t('صمّم أباجور الأسماء','İsim lambanı tasarla'):template==='mirror_heart'?t('صمّم صورتك للمراية','Ayna fotoğrafını tasarla'):t('صمّم هديتك','Hediyeni tasarla');
 $('ogDesignLabelText').textContent=template==='name_lamp'?t('الاسم الأول *','Birinci isim *'):t('الاسم أو العبارة — اختياري','İsim veya yazı — isteğe bağlı');
 $('ogDesignSecondLabel').textContent=t('الاسم الثاني — اختياري','İkinci isim — isteğe bağlı');$('ogDesignSecondLabel').hidden=template!=='name_lamp';$('ogDesignSecondText').hidden=template!=='name_lamp';$('ogDesignSecondText').value='';
 $('ogDesignLabelPhoto').textContent=template==='mirror_heart'?t('اختر الصورة للمراية *','Ayna fotoğrafını seç *'):t('ارفع صورتك للتصميم (اختياري)','Tasarım için görsel yükle (isteğe bağlı)');
 $('ogDesignNote').textContent=t('هذه معاينة لتوضيح طلبك وليست شكل المنتج النهائي. سيتم إرفاق التصميم بالطلب.','Bu görsel sipariş tercihinizin önizlemesidir; nihai ürünün birebir görünümü değildir. Dosya siparişe eklenecektir.');
 $('ogDesignClear').textContent=t('مسح التصميم','Tasarımı temizle');
 $('ogDesignCancel').textContent=t('إلغاء','İptal');
 $('ogDesignApply').textContent=t('اعتماد التصميم وإرفاقه بالطلب','Tasarımı kaydet ve siparişe ekle');
 const existing=String(product?.customizationText||'');const names=existing.split(' · ');$('ogDesignText').value=template==='name_lamp'?names[0]:existing;$('ogDesignText').maxLength=template==='name_lamp'?80:200;if(template==='name_lamp')$('ogDesignSecondText').value=names.slice(1).join(' · ');
 $('ogDesignPhoto').value='';$('ogDesignPhoto').hidden=template==='name_lamp';$('ogDesignLabelPhoto').hidden=template==='name_lamp';
 if(imageBitmap){imageBitmap.close?.();imageBitmap=null}
 overlay.hidden=false;document.body.classList.add('og-design-open');
 draw();$('ogDesignText').focus()
}
const css=node('style');
css.textContent=`
.og-design-overlay[hidden]{display:none!important}
.og-design-overlay{position:fixed;z-index:999999;inset:0;background:rgba(17,12,17,.72);display:flex;align-items:center;justify-content:center;padding:12px}
.og-design-panel{width:min(790px,100%);max-height:94vh;overflow:auto;border-radius:22px;background:white;color:#241b1c;box-shadow:0 22px 80px #0005}
.og-design-header{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #eae1e0;padding:16px 22px}
.og-design-header h2{font-size:22px;margin:0}
.og-design-header button{border:0;background:#eee6e6;width:36px;height:36px;border-radius:50%;font-size:25px;cursor:pointer}
.og-design-body{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);gap:18px;padding:20px}
.og-design-tools{display:flex;flex-direction:column;gap:10px;font-size:14px}
.og-design-tools label{font-weight:700}
.og-design-tools input{border:1px solid #ded1d1;border-radius:11px;padding:11px;width:100%;font-size:14px}
.og-design-tools p{font-size:12px;line-height:1.8;color:#736264}
.og-design-tools button,.og-design-actions button{border-radius:12px;border:1px solid #e1d3d1;background:white;padding:12px 16px;font-weight:700;cursor:pointer}
.og-design-body canvas{display:block;width:100%;max-height:460px;aspect-ratio:1/1;object-fit:contain;border-radius:14px;border:1px solid #eee4e3;background:#faf0ef}
.og-design-actions{display:flex;justify-content:flex-end;gap:10px;padding:16px 20px;border-top:1px solid #eee4e3}
#ogDesignApply{background:#2d2324;color:white}
#ogDesignApply:disabled{opacity:.5}
.og-design-open{overflow:hidden}
.og-design-trigger{display:block;margin:9px 0;border:1px solid #ba8b94;background:#fff1f4;color:#7a2f46;border-radius:12px;padding:11px 14px;font-weight:800;cursor:pointer}
@media(max-width:640px){.og-design-body{grid-template-columns:1fr}.og-design-header h2{font-size:18px}.og-design-actions{flex-direction:column-reverse}}
`;
document.head.appendChild(css);
async function attachment(action,id,file){
 return new Promise((resolve,reject)=>{const request=indexedDB.open('og-order-designs',1);request.onupgradeneeded=()=>request.result.createObjectStore('attachments');request.onerror=()=>reject(request.error);request.onsuccess=()=>{const db=request.result,tx=db.transaction('attachments',action==='get'?'readonly':'readwrite'),store=tx.objectStore('attachments');let operation=action==='get'?store.get(String(id)):action==='delete'?store.delete(String(id)):store.put({blob:file,name:file.name,type:file.type},String(id));let value;operation.onsuccess=()=>{value=operation.result};tx.oncomplete=()=>{db.close();resolve(action==='get'&&value?new File([value.blob],value.name,{type:value.type}):value)};tx.onerror=()=>{db.close();reject(tx.error)}}})
}
window.OGProductDesign={open,saveAttachment:(id,file)=>attachment('put',id,file),getAttachment:id=>attachment('get',id),removeAttachment:id=>attachment('delete',id)};
})();