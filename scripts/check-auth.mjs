import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
function context(fetch){
 const values=new Map();const window={dispatchEvent(){}};
 vm.runInNewContext(readFileSync('assets/customer-auth.js','utf8'),{window,document:{documentElement:{lang:'tr'}},location:{origin:'https://onlinegiftis.com'},localStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},CustomEvent:class{},Headers,fetch,Date,JSON});
 return {auth:window.OGCustomerAuth,values};
}
const key='og_customer_session_v1';const old={accessToken:'old',refreshToken:'refresh',expiresAt:1};
test('parallel callers share one rotating refresh request',async()=>{
 let count=0;const {auth,values}=context(async()=>{count++;await new Promise(r=>setTimeout(r,10));return Response.json({access_token:'new',refresh_token:'new-refresh',expires_in:3600})});values.set(key,JSON.stringify(old));
 const result=await Promise.all([auth.getAccessToken(),auth.getAccessToken()]);assert.deepEqual(result,['new','new']);assert.equal(count,1);
});
test('network errors preserve the refresh token',async()=>{const {auth,values}=context(async()=>{throw Error('network')});values.set(key,JSON.stringify(old));await assert.rejects(auth.refresh());assert.equal(JSON.parse(values.get(key)).refreshToken,'refresh')});
test('rejected refresh tokens clear the expired session',async()=>{const {auth,values}=context(async()=>Response.json({error:'invalid token'},{status:400}));values.set(key,JSON.stringify(old));assert.equal(await auth.refresh(),null);assert.equal(values.has(key),false)});
