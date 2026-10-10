/* Keep the browser icon in the page's current language. */
(()=>{
 'use strict';
 function sync(){
  const language=document.documentElement.lang==='tr'?'tr':'ar';
  const icon=document.getElementById('site-favicon');
  const touch=document.getElementById('site-touch-icon');
  if(icon)icon.setAttribute('href','/assets/favicon-'+language+'-48.png?v=20261010');
  if(touch)touch.setAttribute('href','/assets/favicon-'+language+'-192.png?v=20261010');
 }
 sync();
 new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
})();
