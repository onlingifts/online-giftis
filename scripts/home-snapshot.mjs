import {readFileSync,writeFileSync} from 'node:fs';
import vm from 'node:vm';
// Publish the saved category cards in the initial HTML, with the same renderer as the client.
export function generateHomeSnapshot(data){
 if(!Array.isArray(data?.categories))throw Error('Missing category snapshot');
 for(const language of ['ar','tr']){
  const context={window:{},document:{documentElement:{lang:language}},location:{search:''},URL,URLSearchParams};
  vm.createContext(context);
  for(const script of ['boutique-presentation.js','home-banners.js'])vm.runInContext(readFileSync('assets/'+script,'utf8'),context);
  const picks=context.window.OGHomeBanners.picks(data);
  const cards=picks.map(item=>context.window.OGBoutique.card(item.meta,item.href)).join('');
  const path=language==='tr'?'tr/index.html':'index.html';
  let html=readFileSync(path,'utf8').replace(/(<div id="homeAllCategories"[^>]*>)[\s\S]*?(<\/div><\/section>)/,'$1'+cards+'$2');
  const count=context.window.OGHomeBanners.heroRows(data).length;
  html=html.replace(/(<section class="pink-hero boutique-hero")(?: data-hero-slides="[^"]*")?/, '$1'+(count>1?' data-hero-slides="'+count+'"':''));
  writeFileSync(path,html);
 }
}
