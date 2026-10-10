/* One stable brand icon shared by Arabic and Turkish pages. */
(()=>{
 'use strict';
 const icon=document.getElementById('site-favicon');
 const touch=document.getElementById('site-touch-icon');
 if(icon)icon.setAttribute('href','/favicon.png');
 if(touch)touch.setAttribute('href','/apple-touch-icon.png');
})();
