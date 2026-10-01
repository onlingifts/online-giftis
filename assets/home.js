(()=>{
 'use strict';
 const lang=document.documentElement.lang==='tr'?'tr':'ar';
 try{localStorage.setItem('og_lang',lang);const cart=JSON.parse(localStorage.getItem('og_cart_v1')||'[]');const count=Array.isArray(cart)?cart.reduce((n,item)=>n+Math.max(0,Number(item.quantity)||0),0):0;const badge=document.getElementById('homeCartCount');if(badge&&count){badge.textContent=String(count);badge.hidden=false}}catch{}
 document.getElementById('year').textContent=new Date().getFullYear();
})();
