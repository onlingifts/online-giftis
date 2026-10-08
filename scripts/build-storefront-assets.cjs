/* Generate small, same-origin previews from the SEO image mirrors.
 * Full-resolution originals remain available for indexing and product pages. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');

async function build() {
  const out = 'assets/previews';
  fs.mkdirSync(out, {recursive: true});
  const manifest = {products: {}, assets: {}};
  const retained = new Set();
  async function preview(source, widths) {
    const bytes = fs.readFileSync(source);
    const hash = crypto.createHash('sha256').update(bytes).digest('hex').slice(0, 16);
    const stem = path.basename(source, path.extname(source));
    const meta = await sharp(bytes).metadata();
    const variants = [];
    const targets = [...new Set(widths.filter(w => w <= meta.width).concat(meta.width < widths.at(-1) ? [meta.width] : []))];
    for (const width of targets) {
      const filename = `${stem}-${hash}-${width}.webp`;
      retained.add(filename);
      if (!fs.existsSync(path.join(out, filename))) {
        await sharp(bytes).rotate().resize({width, withoutEnlargement: true}).webp({quality: 82}).toFile(path.join(out, filename));
      }
      variants.push({width, url: '/'+out+'/'+filename});
    }
    // All supported source files in this catalogue are larger than the smallest preview.
    if (!variants.length) return null;
    return {width: meta.width, height: meta.height, variants};
  }
  fs.mkdirSync('product-images',{recursive:true});
  const sourcesFile='product-images/.sources.json';
  const sources=fs.existsSync(sourcesFile)?JSON.parse(fs.readFileSync(sourcesFile,'utf8')):{};
  for (const file of fs.readdirSync('product-images')) {
    const id = file.match(/^(\d+)-/)?.[1];
    if (!id || !/\.(webp|jpg|jpeg|png|avif|gif)$/i.test(file)) continue;
    const entry = await preview('product-images/'+file, [160, 320, 480, 768]);
    if (entry) manifest.products[id] = {...entry,source:sources[id]||null};
  }
  for (const file of fs.readdirSync('assets').filter(x => /^(pink-hero-hq|campaign-|collection-).*\.webp$/.test(x))) {
    try {
      const entry = await preview('assets/'+file, file.startsWith('pink-hero') || file.startsWith('campaign-') ? [320, 480, 768, 1200] : [160, 320, 480, 768]);
      if (entry) manifest.assets['/assets/'+file] = entry;
    } catch (error) {
      // Keep the original URL when an older asset cannot be decoded by libvips.
      console.warn('Preview skipped for '+file+': '+error.message);
    }
  }
  for (const file of fs.readdirSync(out)) if (!retained.has(file)) fs.unlinkSync(path.join(out, file));
  fs.writeFileSync('assets/image-manifest.js', 'window.OGImageManifest='+JSON.stringify(manifest)+';\n');
  const css = fs.readFileSync('assets/store-fonts.css','utf8')+'\n'+fs.readFileSync('assets/pink-home.css','utf8');
  let html = fs.readFileSync('index.html','utf8');
  const style = '<!-- storefront-critical:start --><style>'+css+'</style><!-- storefront-critical:end -->';
  html = html.replace(/<!-- storefront-critical:start -->[\s\S]*?<!-- storefront-critical:end -->/, style);
  html = html.replace(/<img\s[^>]*data-responsive-asset[^>]*>/g, tag => {
    const source = tag.match(/\ssrc="([^"]+)"/)?.[1];
    const entry = manifest.assets[source];
    if (!entry) return tag;
    const sizes = tag.match(/data-image-sizes="([^"]+)"/)?.[1] || '100vw';
    tag = tag.replace(/\s(?:srcset|sizes|width|height)="[^"]*"/g, '');
    return tag.replace(/>$/, ` srcset="${entry.variants.map(v => v.url+' '+v.width+'w').join(', ')}" sizes="${sizes}" width="${entry.width}" height="${entry.height}">`);
  });
  fs.writeFileSync('index.html', html);
  for (const id of fs.readdirSync('products').filter(x => /^\d+$/.test(x))) {
    const entry = manifest.products[id];
    if (!entry) continue;
    const file = `products/${id}/index.html`;
    if (!fs.existsSync(file)) continue;
    let page = fs.readFileSync(file, 'utf8');
    const sizes = '(max-width: 760px) calc(100vw - 50px), (max-width: 1280px) 44vw, 520px';
    const source = page.match(/<img src="([^"]*\/product-images\/[^"]+)"/)?.[1];
    if (!source) continue;
    const candidates = entry.variants.filter(v => v.width !== entry.width).concat({width: entry.width, url: source});
    const srcset = candidates.map(v => v.url+' '+v.width+'w').join(', ');
    page = page.replace(/<img src="[^"]*\/product-images\/[^>]*>/, tag => tag.replace(/\s(?:srcset|sizes|width|height)="[^"]*"/g, '').replace(/>$/, ` srcset="${srcset}" sizes="${sizes}" width="${entry.width}" height="${entry.height}">`));
    page = page.replace(/<link rel="preload" as="image"[^>]*>/, `<link rel="preload" as="image" href="${source}" imagesrcset="${srcset}" imagesizes="${sizes}">`);
    fs.writeFileSync(file, page);
  }
  console.log(`Built ${retained.size} responsive previews; ${Object.keys(manifest.products).length} product images.`);
}
build().catch(error => { console.error(error); process.exitCode = 1; });
