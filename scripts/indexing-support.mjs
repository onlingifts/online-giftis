import {readFileSync, writeFileSync, existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {esc, hasTurkish, productPath} from './seo-localization.mjs';

// Persist content fingerprints so a scheduled build does not announce an update
// to every URL. Bootstrap old pages without claiming an unknown modification date.
export function createSitemapDates({root='.', now=new Date()}={}) {
 const statePath=join(root,'.seo-page-state.json');
 const fileFor=url=>join(root,new URL(url).pathname,'index.html');
 const hashFor=url=>createHash('sha256').update(readFileSync(fileFor(url))).digest('hex');
 let previous={};
 if(existsSync(statePath)) previous=JSON.parse(readFileSync(statePath,'utf8'));
 else if(existsSync(join(root,'sitemap.xml'))) {
  for(const [,url] of readFileSync(join(root,'sitemap.xml'),'utf8').matchAll(/<loc>(https:\/\/onlinegiftis\.com[^<]*)<\/loc>/g)) {
   if(existsSync(fileFor(url))) previous[url]={hash:hashFor(url),lastmod:null};
  }
 }
 const next={}, today=now.toISOString().slice(0,10);
 return {
  tag(url) {
   const hash=hashFor(url), old=previous[url];
   const lastmod=old?.hash===hash?old.lastmod:today;
   next[url]={hash,lastmod};
   return lastmod?'<lastmod>'+lastmod+'</lastmod>':'';
  },
  save(){writeFileSync(statePath,JSON.stringify(next,null,2)+'\n');}
 };
}

// A native link ring reaches every eligible product from another product, while
// additional category matches keep suggestions relevant. No untranslated targets.
export function relatedProductLinks(product, products, lang='ar') {
 const eligible=products.filter(p=>p.storefront?.indexable!==false&&p.storefront?.includeInSitemap!==false&&(lang!=='tr'||hasTurkish(p))).sort((a,b)=>Number(a.id)-Number(b.id));
 const index=eligible.findIndex(p=>String(p.id)===String(product.id));
 if(index<0||eligible.length<2)return '';
 const ids=p=>new Set([p.category,...(p.categories||[])].filter(x=>typeof x==='string'&&x!=='all'));
 const categories=ids(product), picks=[];
 const add=p=>{if(p&&String(p.id)!==String(product.id)&&!picks.some(v=>String(v.id)===String(p.id)))picks.push(p)};
 add(eligible[(index+1)%eligible.length]);
 add(eligible[(index+eligible.length-1)%eligible.length]);
 for(const p of eligible)if([...ids(p)].some(c=>categories.has(c))&&picks.length<6)add(p);
 const title=lang==='tr'?'Diğer ürünleri keşfedin':'تصفّح منتجات أخرى';
 return '<section class="copy" data-related-products><div class="container"><article class="panel"><h2>'+title+'</h2><ul>'+picks.map(p=>'<li><a href="'+productPath(p,lang)+'">'+esc(lang==='tr'?p.storefront.nameTr:p.name)+'</a></li>').join('')+'</ul></article></div></section>';
}
