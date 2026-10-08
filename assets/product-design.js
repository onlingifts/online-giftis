(()=>{
'use strict';
// Lightweight visual design attachment: produces an image file for order preparation.
// This is a request preview, not a manufacturing-accurate product mockup.
let overlay=null, resolveCallback=null, imageBitmap=null, productLabel='';
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
      <input id="ogDesignText" maxlength="200" autocomplete="off">
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
 $('ogDesignText').addEventListener('input',draw);
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
 $('ogDesignClear').onclick=()=>{$('ogDesignText').value='';$('ogDesignPhoto').value='';if(imageBitmap){imageBitmap.close?.();imageBitmap=null}draw()};
 $('ogDesignApply').onclick=()=>{
   const canvas=$('ogDesignCanvas'),label=$('ogDesignText').value.trim();
   if(!label&&!imageBitmap){alert(t('أدخل نصًا أو اختر صورة للتصميم.','Tasarım için metin yazın veya görsel seçin.'));return}
   $('ogDesignApply').disabled=true;
   canvas.toBlob(blob=>{
    $('ogDesignApply').disabled=false;
    if(!blob){alert(t('تعذر حفظ التصميم.','Tasarım kaydedilemedi.'));return}
    const file=new File([blob],'online-gifts-design-'+Date.now()+'.png',{type:'image/png'});
    const save=resolveCallback;
    close();
    save?.(file,label)
   },'image/png')
 };
 document.addEventListener('keydown',e=>{if(!overlay?.hidden&&e.key==='Escape')close()});
}
function draw(){
 const canvas=$('ogDesignCanvas'),ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
 if(!ctx)return;
 ctx.fillStyle='#faf1ef';ctx.fillRect(0,0,w,h);
 ctx.fillStyle='#fff';ctx.fillRect(70,70,w-140,h-140);
 ctx.strokeStyle='#e0b2b4';ctx.lineWidth=9;ctx.strokeRect(70,70,w-140,h-140);
 ctx.fillStyle='#fff9f8';ctx.fillRect(110,120,860,670);
 if(imageBitmap){
  const iw=imageBitmap.width,ih=imageBitmap.height;
  const scale=Math.min(860/iw,670/ih);
  const dw=iw*scale,dh=ih*scale;
  ctx.drawImage(imageBitmap,540-dw/2,455-dh/2,dw,dh);
 }else{
  ctx.fillStyle='#f0e5e6';ctx.beginPath();ctx.arc(540,455,125,0,Math.PI*2);ctx.fill();
  ctx.font='bold 80px Arial';ctx.fillStyle='#b47a80';ctx.textAlign='center';ctx.fillText('♡',540,480)
 }
 const value=$('ogDesignText').value.trim();
 if(value){
  ctx.fillStyle='#39282a';
  ctx.textAlign='center';ctx.textBaseline='middle';
  let size=64;
  ctx.font='bold '+size+'px Cairo, Arial';
  while(size>24 && ctx.measureText(value).width>840){size-=3;ctx.font='bold '+size+'px Cairo, Arial'}
  ctx.fillText(value,540,858,840)
 }
 ctx.fillStyle='#9e7e7a';ctx.textAlign='center';ctx.textBaseline='alphabetic';
 ctx.font='28px Cairo, Arial';ctx.fillText(productLabel.slice(0,90),540,951,830)
}
function close(){
 if(!overlay)return;
 overlay.hidden=true;document.body.classList.remove('og-design-open');
 if(imageBitmap){imageBitmap.close?.();imageBitmap=null}
 resolveCallback=null
}
function open(product,onSave){
 ensure();
 productLabel=String(product?.name||'').slice(0,100);
 resolveCallback=onSave;
 $('ogDesignTitle').textContent=t('صمّم هديتك','Hediyeni tasarla');
 $('ogDesignLabelText').textContent=t('الاسم أو العبارة على الهدية','Hediye üzerindeki isim veya yazı');
 $('ogDesignLabelPhoto').textContent=t('ارفع صورتك للتصميم (اختياري)','Tasarım için görsel yükle (isteğe bağlı)');
 $('ogDesignNote').textContent=t('هذه معاينة لتوضيح طلبك وليست شكل المنتج النهائي. سيتم إرفاق التصميم بالطلب.','Bu görsel sipariş tercihinizin önizlemesidir; nihai ürünün birebir görünümü değildir. Dosya siparişe eklenecektir.');
 $('ogDesignClear').textContent=t('مسح التصميم','Tasarımı temizle');
 $('ogDesignCancel').textContent=t('إلغاء','İptal');
 $('ogDesignApply').textContent=t('اعتماد التصميم وإرفاقه بالطلب','Tasarımı kaydet ve siparişe ekle');
 $('ogDesignText').value=String(product?.customizationText||'');
 $('ogDesignPhoto').value='';
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
window.OGProductDesign={open};
})();