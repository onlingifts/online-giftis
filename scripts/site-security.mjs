import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
// GitHub Pages cannot set arbitrary HTTP headers. These are supported document policies,
// not substitutes for HSTS, nosniff or frame-ancestors response headers.
export function applyDocumentSecurity(root='.'){
 for(const item of readdirSync(root,{withFileTypes:true})){
  if(item.name.startsWith('.')||item.name==='node_modules')continue;
  const path=root+'/'+item.name;
  if(item.isDirectory()){applyDocumentSecurity(path);continue}
  if(!item.name.endsWith('.html'))continue;
  let html=readFileSync(path,'utf8');
  if(!html.includes('</head>'))continue;
  const security=`<meta name="referrer" content="strict-origin-when-cross-origin"><meta http-equiv="Content-Security-Policy" content="object-src 'none'; base-uri 'self'; upgrade-insecure-requests">`;
  html=html.replace(/<!-- document-security:start -->[\s\S]*?<!-- document-security:end -->/g,'').replace('</head>','<!-- document-security:start -->'+security+'<!-- document-security:end --></head>');
  writeFileSync(path,html);
 }
}
