(()=>{
'use strict';
const SUPABASE_URL='https://mqqvcreobqjyhflodvom.supabase.co';
const SUPABASE_KEY='sb_publishable_KsWvGfiVoQbCozyFAiCiww_vHAYBIws';
const STORAGE_KEY='og_customer_session_v1';
const t=(ar,tr)=>document.documentElement.lang==='tr'?tr:ar;

function read(){
 try{
  const value=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
  return value&&value.accessToken?value:null;
 }catch{return null}
}
function write(value){
 if(value)localStorage.setItem(STORAGE_KEY,JSON.stringify(value));
 else localStorage.removeItem(STORAGE_KEY);
 window.dispatchEvent(new CustomEvent('og-customer-auth-changed',{detail:value}));
}
function normalizeSession(data){
 if(!data||!data.access_token)return null;
 const expiresAt=Number(data.expires_at||0)>1e9
  ?Number(data.expires_at)*1000
  :Date.now()+Math.max(60,Number(data.expires_in||3600))*1000;
 return {
  accessToken:data.access_token,
  refreshToken:data.refresh_token||'',
  expiresAt,
  user:data.user||null
 };
}
async function authFetch(path,options={}){
 const headers=new Headers(options.headers||{});
 headers.set('apikey',SUPABASE_KEY);
 if(options.body&&!headers.has('Content-Type'))headers.set('Content-Type','application/json');
 const response=await fetch(SUPABASE_URL+path,{...options,headers});
 let payload={};
 try{payload=await response.json()}catch{}
 if(!response.ok){
  const message=payload.msg||payload.message||payload.error_description||payload.error||t('تعذر إكمال العملية','İşlem tamamlanamadı');
  const error=new Error(message);
  error.status=response.status;
  throw error;
 }
 return payload;
}
function authRedirect(){
 return location.origin+'/products/?account=1';
}
async function signUp({email,password,fullName,phone}){
 const path='/auth/v1/signup?redirect_to='+encodeURIComponent(authRedirect());
 const data=await authFetch(path,{
  method:'POST',
  body:JSON.stringify({
   email:String(email||'').trim().toLowerCase(),
   password:String(password||''),
   data:{full_name:String(fullName||'').trim(),phone:String(phone||'').trim()}
  })
 });
 const session=normalizeSession(data);
 if(session)write(session);
 return {session,user:data.user||session?.user||null,requiresEmailConfirmation:!session};
}
async function signIn(email,password){
 const data=await authFetch('/auth/v1/token?grant_type=password',{
  method:'POST',
  body:JSON.stringify({
   email:String(email||'').trim().toLowerCase(),
   password:String(password||'')
  })
 });
 const session=normalizeSession(data);
 if(!session)throw new Error(t('تعذر إنشاء جلسة الدخول','Oturum oluşturulamadı'));
 write(session);
 return session;
}
async function refresh(){
 const current=read();
 if(!current?.refreshToken)return null;
 try{
  const data=await authFetch('/auth/v1/token?grant_type=refresh_token',{
   method:'POST',
   body:JSON.stringify({refresh_token:current.refreshToken})
  });
  const session=normalizeSession(data);
  if(session){write(session);return session}
 }catch{}
 write(null);
 return null;
}
async function getAccessToken(){
 let current=read();
 if(!current)return null;
 if(Number(current.expiresAt||0)<=Date.now()+60000)current=await refresh();
 return current?.accessToken||null;
}
async function getUser(){
 const token=await getAccessToken();
 if(!token)return null;
 try{
  const user=await authFetch('/auth/v1/user',{headers:{Authorization:'Bearer '+token}});
  const current=read();
  if(current){current.user=user;write(current)}
  return user;
 }catch(error){
  if(error&&error.status===401)write(null);
  return null;
 }
}
async function providerEnabled(provider){
 try{
  const data=await authFetch('/auth/v1/settings');
  if(data?.external&&typeof data.external==='object')return Boolean(data.external[provider]);
  if(Array.isArray(data?.providers))return data.providers.includes(provider);
  return false;
 }catch{return false}
}
function googleSignIn(){
 const redirect=authRedirect();
 location.href=SUPABASE_URL+'/auth/v1/authorize?provider=google&redirect_to='+encodeURIComponent(redirect);
}
async function signOut(){
 const token=await getAccessToken();
 write(null);
 if(token){
  try{await authFetch('/auth/v1/logout',{method:'POST',headers:{Authorization:'Bearer '+token}})}catch{}
 }
}
function consumeOAuthCallback(){
 const hash=new URLSearchParams(location.hash.replace(/^#/,''));
 const access=hash.get('access_token');
 if(access){
  const session=normalizeSession({
   access_token:access,
   refresh_token:hash.get('refresh_token')||'',
   expires_in:Number(hash.get('expires_in')||3600),
   token_type:hash.get('token_type')||'bearer'
  });
  if(session)write(session);
  history.replaceState({},'',location.pathname+location.search);
  return {ok:true};
 }
 const error=hash.get('error_description')||hash.get('error');
 if(error){
  history.replaceState({},'',location.pathname+location.search);
  return {ok:false,error};
 }
 return null;
}
window.OGCustomerAuth={
 read,
 signUp,
 signIn,
 refresh,
 getAccessToken,
 getUser,
 providerEnabled,
 googleSignIn,
 signOut,
 consumeOAuthCallback
};
})();
