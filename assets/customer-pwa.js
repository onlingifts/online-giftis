/* Customer storefront PWA - install assistance only, independent of checkout/session logic. */
(()=>{
"use strict";
if(window.OGCustomerPWA)return;
const lang=()=>document.documentElement.lang==="tr"?"tr":"ar";
const t=(ar,tr)=>lang()==="tr"?tr:ar;
const isStandalone=()=>window.matchMedia("(display-mode: standalone)").matches || navigator.standalone===true;
const ios=()=>/iPhone|iPad|iPod/i.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
const mobile=()=>ios()||/Android|Mobile/i.test(navigator.userAgent);
const REMIND="og-customer-pwa-remind-at-v1";
const WEEK=7*24*60*60*1000;
let pending=null,banner=null,installed=false,promptTimer=0,infoOpened=false;
function snoozed(){try{return Number(localStorage.getItem(REMIND)||0)>Date.now()}catch{return false}}
function snooze(){try{localStorage.setItem(REMIND,String(Date.now()+WEEK))}catch{}}
function clearSnooze(){try{localStorage.removeItem(REMIND)}catch{}}
function installedNow(){return installed||isStandalone()}
function updateButton(){
 if(!banner)return;
 const btn=banner.querySelector("[data-pwa-action]");
 if(!btn)return;
 btn.textContent=pending?t("تثبيت التطبيق الآن","Uygulamayı yükle"):ios()?t("طريقة التثبيت على آيفون","iPhone'a nasıl eklenir?"):t("طريقة التثبيت","Nasıl yüklenir?");
}
function dismiss(remember=true){if(remember)snooze();if(banner){banner.remove();banner=null}infoOpened=false}
function renderInstructions(){
 if(!banner)return;
 const steps=banner.querySelector("[data-pwa-help]");
 if(!steps)return;
 infoOpened=true;
 steps.hidden=false;
 steps.textContent=ios()
 ?t("افتح الموقع في Safari، ثم اضغط زر المشاركة واختر «إضافة إلى الشاشة الرئيسية». إذا كنت داخل متصفح واتساب أو فيسبوك، افتح الرابط في Safari أولاً.","Siteyi Safari'de açın, Paylaş menüsünden Ana Ekrana Ekle'yi seçin. WhatsApp veya Facebook içindeyseniz önce Safari'de açın.")
 :t("افتح الموقع في Chrome، ثم من قائمة ⋮ اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية». إذا كنت داخل واتساب أو فيسبوك، افتح الرابط في Chrome أولاً.","Siteyi Chrome'da açıp ⋮ menüsünden Uygulamayı yükle veya Ana ekrana ekle seçeneğini kullanın. Uygulama içi tarayıcıdaysanız Chrome'da açın.");
}
function open(explicit=false){
 if(installedNow()){dismiss(false);return}
 if(!explicit && (snoozed() || !mobile()))return;
 if(banner){if(explicit)banner.querySelector("[data-pwa-action]")?.focus();return}
 const el=document.createElement("aside");
 el.className="og-customer-pwa-banner";
 el.setAttribute("dir",lang()==="tr"?"ltr":"rtl");
 el.setAttribute("role","region");
 el.setAttribute("aria-label",t("تثبيت تطبيق اون لاين للهدايا","Online Giftis uygulamasını yükleyin"));
 const icon=lang()==="tr"?"/assets/favicon-tr-192.png":"/assets/favicon-ar-192.png";
 el.innerHTML=`<div class="og-pwa-header"><img src="${icon}" alt="" width="54" height="54" loading="lazy"><div class="og-pwa-copy"><strong>${t("ثبّت متجر اون لاين للهدايا","Online Giftis'i telefonuna ekle")}</strong><p>${t("تسوّق الهدايا بسهولة من أيقونة مستقلة على هاتفك.","Hediyelere telefonunun ana ekranından kolayca ulaş.")}</p></div><button class="og-pwa-x" type="button" data-pwa-close aria-label="${t("إغلاق","Kapat")}">×</button></div><p class="og-pwa-help" data-pwa-help role="status" hidden></p><div class="og-pwa-buttons"><button type="button" class="og-pwa-primary" data-pwa-action></button><button type="button" class="og-pwa-later" data-pwa-later>${t("ليس الآن","Şimdi değil")}</button></div>`;
 banner=el;document.body.append(el);updateButton();
 el.querySelector("[data-pwa-close]").addEventListener("click",()=>dismiss(true));
 el.querySelector("[data-pwa-later]").addEventListener("click",()=>dismiss(true));
 el.querySelector("[data-pwa-action]").addEventListener("click",install);
}
async function install(){
 if(!pending){renderInstructions();return}
 const event=pending;pending=null;updateButton();
 try{
  await event.prompt(); // Called from an actual user click, before any other async work.
  const choice=await event.userChoice;
  if(choice?.outcome==="accepted"){dismiss(false);snooze()}
  else {renderInstructions()}
 }catch{renderInstructions()}
}
function onReady(){
 if(installedNow())return;
 window.clearTimeout(promptTimer);
 promptTimer=window.setTimeout(()=>open(false),4700);
}
window.addEventListener("beforeinstallprompt",event=>{
 event.preventDefault();pending=event;
 updateButton();
});
window.addEventListener("appinstalled",()=>{
 installed=true;pending=null;clearSnooze();dismiss(false);
});
window.addEventListener("pageshow",()=>{
 if(installedNow()){dismiss(false);return}
});
document.addEventListener("click",event=>{
 const trigger=event.target?.closest?.("[data-og-install-app]");
 if(!trigger)return;
 event.preventDefault();
 open(true);
});
if("serviceWorker" in navigator && window.isSecureContext){
 window.addEventListener("load",()=>{
  navigator.serviceWorker.register("/customer-sw.js",{scope:"/",updateViaCache:"none"}).catch(()=>{});
 },{once:true});
}
window.OGCustomerPWA={open:()=>open(true),isStandalone:installedNow};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",onReady,{once:true});
else onReady();
})();