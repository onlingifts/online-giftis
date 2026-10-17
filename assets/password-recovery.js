/* Recovery stays inside the existing account dialog; it never submits an order. */
(()=>{
 'use strict';
 const t=(ar,tr)=>document.documentElement.lang==='tr'?tr:ar;
 const $=id=>document.getElementById(id);
 let panel=null,busy=false;
 function mount(){
  if(panel||!$('accountModal'))return;
  const trigger=document.createElement('button');trigger.type='button';trigger.id='forgotPassword';trigger.className='account-forgot';
  trigger.textContent=t('نسيت كلمة المرور؟','Şifremi unuttum');trigger.onclick=()=>open(false);
  $('accountSubmit').after(trigger);
  panel=document.createElement('form');panel.id='passwordRecoveryForm';panel.className='account-form';panel.hidden=true;
  const heading=document.createElement('h3');heading.id='recoveryHeading';
  const email=document.createElement('input');email.id='recoveryEmail';email.type='email';email.autocomplete='email';email.dir='ltr';
  const password=document.createElement('input');password.id='recoveryPassword';password.type='password';password.minLength=8;password.autocomplete='new-password';password.dir='ltr';
  const confirm=document.createElement('input');confirm.id='recoveryConfirm';confirm.type='password';confirm.minLength=8;confirm.autocomplete='new-password';confirm.dir='ltr';
  const label=(forId,text)=>{const el=document.createElement('label');el.htmlFor=forId;el.textContent=text;return el};
  const emailLabel=label(email.id,t('البريد الإلكتروني','E-posta'));
  const passwordLabel=label(password.id,t('كلمة المرور الجديدة','Yeni şifre'));
  const confirmLabel=label(confirm.id,t('تأكيد كلمة المرور','Şifreyi tekrar girin'));
  const submit=document.createElement('button');submit.type='submit';submit.className='account-primary';submit.id='recoverySubmit';
  const back=document.createElement('button');back.type='button';back.className='account-forgot';back.textContent=t('العودة إلى حسابي','Hesabıma dön');back.onclick=close;
  const status=document.createElement('p');status.id='recoveryStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  panel.append(heading,emailLabel,email,passwordLabel,password,confirmLabel,confirm,submit,back,status);
  $('accountModal').querySelector('.sheet-body').prepend(panel);
  let updating=false;
  function close(){if(busy)return;panel.hidden=true;$('accountGuestView').hidden=false;$('accountMemberView').hidden=true;password.value=confirm.value='';if(updating)location.href=(document.documentElement.lang==='tr'?'/tr':'')+'/products/?account=1';else trigger.focus()}
  function open(update){
   updating=update;panel.hidden=false;$('accountGuestView').hidden=true;$('accountMemberView').hidden=true;
   heading.textContent=update?t('تعيين كلمة مرور جديدة','Yeni şifre belirle'):t('استعادة كلمة المرور','Şifre sıfırlama');
   email.hidden=emailLabel.hidden=update;email.required=!update;
   for(const el of [password,passwordLabel,confirm,confirmLabel])el.hidden=!update;
   password.required=confirm.required=update;
   email.value=$('accountEmail').value;password.value=confirm.value='';status.textContent='';submit.hidden=false;
   submit.textContent=update?t('حفظ كلمة المرور','Şifreyi kaydet'):t('إرسال رابط الاستعادة','Sıfırlama bağlantısı gönder');
   (update?password:email).focus();
  }
  panel.addEventListener('submit',async event=>{
   event.preventDefault();if(busy||!panel.reportValidity())return;
   if(updating&&password.value!==confirm.value){status.textContent=t('كلمتا المرور غير متطابقتين.','Şifreler eşleşmiyor.');return}
   busy=true;submit.disabled=true;back.disabled=true;status.textContent=t('جاري المعالجة…','İşleniyor…');
   try{
    if(updating){await OGCustomerAuth.updatePassword(password.value);password.value=confirm.value='';status.textContent=t('تم تحديث كلمة المرور. يمكنك الآن العودة إلى حسابك.','Şifreniz güncellendi. Hesabınıza dönebilirsiniz.');submit.hidden=true;}
    else{await OGCustomerAuth.resetPassword(email.value);status.textContent=t('إذا كان البريد مرتبطاً بحساب قابل للاستعادة، ستصلك رسالة تحتوي على رابط تغيير كلمة المرور. تحقّق من البريد غير المرغوب فيه أيضاً.','Bu e-posta kurtarılabilir bir hesaba bağlıysa şifre değiştirme bağlantısı gönderilecektir. Spam klasörünü de kontrol edin.');}
   }catch(error){status.textContent=error?.message||t('تعذر إكمال الطلب. حاول مجدداً.','İstek tamamlanamadı. Tekrar deneyin.');}
   finally{busy=false;submit.disabled=false;back.disabled=false;}
  });
  window.OGPasswordRecovery={openUpdate:()=>{open(true);$('accountModal').classList.add('open');$('accountModal').setAttribute('aria-hidden','false');document.body.classList.add('modal-open');}};
  window.addEventListener('hashchange',()=>{
   if(new URLSearchParams(location.hash.slice(1)).get('type')!=='recovery')return;
   const result=OGCustomerAuth.consumeOAuthCallback();if(result?.ok&&result.recovery)window.OGPasswordRecovery.openUpdate();
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
